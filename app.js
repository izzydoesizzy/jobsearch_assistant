const runtimeConfig = window.appConfig || {};
const APP_DEFAULT_CONFIG = {
  fixedModel: "gpt-5.2",
  globalContextDocument: "",
  systemPromptPrefix: "You are a professional job search strategist. Follow requested structure strictly and return markdown only."
};

const config = {
  ...APP_DEFAULT_CONFIG,
  ...runtimeConfig
};

const els = {
  promptChecklist: document.getElementById("promptChecklist"),
  promptSearch: document.getElementById("promptSearch"),
  selectedCount: document.getElementById("selectedCount"),
  generateDoc: document.getElementById("generateDoc"),
  apiKey: document.getElementById("apiKey"),
  modelName: document.getElementById("modelName"),
  resumeFile: document.getElementById("resumeFile"),
  linkedinFile: document.getElementById("linkedinFile"),
  voiceFile: document.getElementById("voiceFile"),
  jobFile: document.getElementById("jobFile"),
  resumeStatus: document.getElementById("resumeStatus"),
  linkedinStatus: document.getElementById("linkedinStatus"),
  voiceStatus: document.getElementById("voiceStatus"),
  jobStatus: document.getElementById("jobStatus"),
  markdownOutput: document.getElementById("markdownOutput"),
  downloadMd: document.getElementById("downloadMd")
};

const state = {
  selectedPrompts: new Set(),
  outputMarkdown: "",
  context: { resume: "", linkedin: "", voice: "", job: "" }
};

const storageKeys = { apiKey: "jobPromptOpenAIKey" };

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.js";
}

function renderPromptChecklist() {
  const query = els.promptSearch.value.toLowerCase();
  const filtered = prompts.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(query));
  els.promptChecklist.innerHTML = filtered
    .map((p) => `
      <article class="prompt-item">
        <label>
          <input type="checkbox" data-id="${p.id}" ${state.selectedPrompts.has(p.id) ? "checked" : ""} />
          <span>${p.title}</span>
        </label>
        <small>${p.description}</small>
      </article>
    `)
    .join("");

  els.promptChecklist.querySelectorAll("input[type='checkbox']").forEach((box) => {
    box.addEventListener("change", (e) => {
      const id = Number(e.target.dataset.id);
      e.target.checked ? state.selectedPrompts.add(id) : state.selectedPrompts.delete(id);
      updateSelectedCount();
    });
  });

  updateSelectedCount();
}

function updateSelectedCount() {
  els.selectedCount.textContent = `${state.selectedPrompts.size} of ${prompts.length} selected`;
}

async function extractPdfText(file) {
  if (!window.pdfjsLib) throw new Error("PDF parser unavailable.");
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const chunks = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    chunks.push(content.items.map((item) => item.str).join(" "));
  }
  return chunks.join("\n\n");
}

async function extractDocxText(file) {
  if (!window.mammoth) throw new Error("DOCX parser unavailable.");
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function fileToText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".json") || name.endsWith(".csv")) return file.text();
  if (name.endsWith(".pdf")) return extractPdfText(file);
  if (name.endsWith(".docx")) return extractDocxText(file);
  if (name.endsWith(".doc")) throw new Error(".doc is not supported for browser parsing. Please export as .docx or .txt.");
  throw new Error("Unsupported file type. Use txt, md, pdf, or docx.");
}

function bindUpload(inputEl, statusEl, key) {
  inputEl.addEventListener("change", async () => {
    const file = inputEl.files[0];
    if (!file) {
      state.context[key] = "";
      statusEl.textContent = "No file selected";
      return;
    }

    statusEl.textContent = "Reading file...";
    try {
      const text = await fileToText(file);
      state.context[key] = text.trim();
      statusEl.textContent = `${file.name} (${Math.min(text.length, 99999)} chars extracted)`;
    } catch (error) {
      state.context[key] = "";
      statusEl.textContent = `Failed: ${error.message}`;
    }
  });
}

function buildContextMarkdown() {
  const safe = (v) => (v && v.trim() ? v.trim() : "(not provided)");
  return [
    "## Context",
    `### Global Instructions / Context\n${safe(config.globalContextDocument)}`,
    `### Resume\n${safe(state.context.resume)}`,
    `### LinkedIn Profile\n${safe(state.context.linkedin)}`,
    `### Voice Transcript\n${safe(state.context.voice)}`,
    `### Job Posting\n${safe(state.context.job)}`
  ].join("\n\n");
}

async function generateOnePromptOutput(prompt, apiKey, sharedContext) {
  const systemMessage = config.systemPromptPrefix;
  const userMessage = [
    "Use the following context to answer the selected prompt.",
    sharedContext,
    `## Selected Prompt\n${prompt.title}`,
    `### Prompt Instructions\n${prompt.promptText}`,
    "Return only markdown for this prompt output."
  ].join("\n\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.fixedModel,
      input: [
        { role: "system", content: [{ type: "input_text", text: systemMessage }] },
        { role: "user", content: [{ type: "input_text", text: userMessage }] }
      ]
    })
  });

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`API error ${response.status}: ${msg}`);
  }

  const data = await response.json();
  return data.output_text || "(No output text returned)";
}

async function generateDocument() {
  const apiKey = els.apiKey.value.trim();
  const selected = prompts.filter((p) => state.selectedPrompts.has(p.id));

  if (!apiKey) {
    alert("Please provide your OpenAI API key.");
    return;
  }
  if (!state.context.resume) {
    alert("Resume is required.");
    return;
  }
  if (!selected.length) {
    alert("Please select at least one prompt.");
    return;
  }

  localStorage.setItem(storageKeys.apiKey, apiKey);

  els.generateDoc.disabled = true;
  els.generateDoc.textContent = "Generating...";
  els.markdownOutput.textContent = "Generating document...";

  try {
    const sharedContext = buildContextMarkdown();
    const sections = [];

    for (let i = 0; i < selected.length; i += 1) {
      const prompt = selected[i];
      els.markdownOutput.textContent = `Generating ${i + 1}/${selected.length}: ${prompt.title}`;
      const result = await generateOnePromptOutput(prompt, apiKey, sharedContext);
      sections.push(`## ${i + 1}. ${prompt.title}\n\n${result}`);
    }

    const finalMarkdown = [
      "# Job Search Analysis",
      `Generated: ${new Date().toISOString()}`,
      `Model: ${config.fixedModel}`,
      buildContextMarkdown(),
      "---",
      ...sections
    ].join("\n\n");

    state.outputMarkdown = finalMarkdown;
    els.markdownOutput.textContent = finalMarkdown;
    els.downloadMd.disabled = false;
  } catch (error) {
    els.markdownOutput.textContent = `Generation failed: ${error.message}`;
  } finally {
    els.generateDoc.disabled = false;
    els.generateDoc.textContent = "Generate Document";
  }
}

function downloadMarkdown() {
  if (!state.outputMarkdown) return;
  const blob = new Blob([state.outputMarkdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `job-search-analysis-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function init() {
  els.apiKey.value = localStorage.getItem(storageKeys.apiKey) || "";
  if (els.modelName) {
    els.modelName.textContent = config.fixedModel;
  }

  renderPromptChecklist();
  els.promptSearch.addEventListener("input", renderPromptChecklist);
  els.generateDoc.addEventListener("click", generateDocument);
  els.downloadMd.addEventListener("click", downloadMarkdown);

  bindUpload(els.resumeFile, els.resumeStatus, "resume");
  bindUpload(els.linkedinFile, els.linkedinStatus, "linkedin");
  bindUpload(els.voiceFile, els.voiceStatus, "voice");
  bindUpload(els.jobFile, els.jobStatus, "job");
}

init();
