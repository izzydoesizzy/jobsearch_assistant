const sourceConfigs = {
  resume: {
    label: "Resume",
    file: "resumeFile",
    status: "resumeStatus",
    textarea: "resumePaste",
    modeSelect: "resumeMode",
    toggle: "resumeTogglePaste"
  },
  linkedin: {
    label: "LinkedIn",
    file: "linkedinFile",
    status: "linkedinStatus",
    textarea: "linkedinPaste",
    modeSelect: "linkedinMode",
    toggle: "linkedinTogglePaste"
  },
  voice: {
    label: "Voice transcript",
    file: "voiceFile",
    status: "voiceStatus",
    textarea: "voicePaste",
    modeSelect: "voiceMode",
    toggle: "voiceTogglePaste"
  },
  job: {
    label: "Job posting",
    file: "jobFile",
    status: "jobStatus",
    textarea: "jobPaste",
    modeSelect: "jobMode",
    toggle: "jobTogglePaste"
  }
};

const els = {
  promptChecklist: document.getElementById("promptChecklist"),
  promptSearch: document.getElementById("promptSearch"),
  selectedCount: document.getElementById("selectedCount"),
  generateDoc: document.getElementById("generateDoc"),
  apiKey: document.getElementById("apiKey"),
  modelName: document.getElementById("modelName"),
  markdownOutput: document.getElementById("markdownOutput"),
  downloadMd: document.getElementById("downloadMd")
};

Object.values(sourceConfigs).forEach((config) => {
  els[config.file] = document.getElementById(config.file);
  els[config.status] = document.getElementById(config.status);
  els[config.textarea] = document.getElementById(config.textarea);
  els[config.modeSelect] = document.getElementById(config.modeSelect);
  els[config.toggle] = document.getElementById(config.toggle);
});

const state = {
  selectedPrompts: new Set(),
  outputMarkdown: "",
  context: { resume: "", linkedin: "", voice: "", job: "" },
  sources: {
    resume: { fileText: "", fileName: "", pastedText: "", mode: "auto", textareaVisible: false },
    linkedin: { fileText: "", fileName: "", pastedText: "", mode: "auto", textareaVisible: false },
    voice: { fileText: "", fileName: "", pastedText: "", mode: "auto", textareaVisible: false },
    job: { fileText: "", fileName: "", pastedText: "", mode: "auto", textareaVisible: false }
  }
};

const storageKeys = { apiKey: "jobPromptOpenAIKey", model: "jobPromptModel" };

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

function getResolvedContextForKey(key) {
  const source = state.sources[key];
  const fileText = source.fileText.trim();
  const pastedText = source.pastedText.trim();

  // Precedence rules:
  // 1) Explicit mode (file or pasted) wins when content exists.
  // 2) Auto mode prefers pasted text when present, else file text.
  if (source.mode === "file") return fileText;
  if (source.mode === "pasted") return pastedText;
  return pastedText || fileText;
}

function refreshAllResolvedContext() {
  Object.keys(state.context).forEach((key) => {
    state.context[key] = getResolvedContextForKey(key);
  });
}

function getSourceStatusText(key) {
  const source = state.sources[key];
  const hasFile = Boolean(source.fileText.trim());
  const hasPaste = Boolean(source.pastedText.trim());
  const fileChars = source.fileText.trim().length;
  const pasteChars = source.pastedText.trim().length;
  const modeLabel = source.mode === "auto" ? "Auto" : source.mode === "file" ? "Use file" : "Use pasted text";
  const fileName = source.fileName || "file";

  if (!hasFile && !hasPaste) return `${modeLabel}: no source selected`;
  if (source.mode === "file" && hasFile) return `Using file: ${fileName} (${Math.min(fileChars, 99999)} chars extracted)`;
  if (source.mode === "pasted" && hasPaste) return `Using pasted text (${Math.min(pasteChars, 99999)} chars)`;

  if (source.mode === "file" && !hasFile) {
    return hasPaste
      ? `File mode selected, but no file text available (${Math.min(pasteChars, 99999)} chars pasted)`
      : "File mode selected, but no file selected";
  }

  if (source.mode === "pasted" && !hasPaste) {
    return hasFile
      ? `Pasted mode selected, but textarea is empty (${Math.min(fileChars, 99999)} chars extracted from file)`
      : "Pasted mode selected, but textarea is empty";
  }

  if (hasPaste && hasFile) {
    return `Auto mode: using pasted text (${Math.min(pasteChars, 99999)} chars), file available (${Math.min(fileChars, 99999)} chars)`;
  }

  if (hasPaste) return `Auto mode: using pasted text (${Math.min(pasteChars, 99999)} chars)`;
  return `Auto mode: using file ${fileName} (${Math.min(fileChars, 99999)} chars extracted)`;
}

function updateSourceUI(key) {
  const config = sourceConfigs[key];
  const source = state.sources[key];
  const textareaEl = els[config.textarea];
  const statusEl = els[config.status];
  const modeSelectEl = els[config.modeSelect];
  const toggleBtnEl = els[config.toggle];

  textareaEl.classList.toggle("visible", source.textareaVisible);
  toggleBtnEl.textContent = source.textareaVisible ? "Hide pasted text" : "Paste text instead";

  const hasFile = Boolean(source.fileText.trim());
  const hasPaste = Boolean(source.pastedText.trim());
  modeSelectEl.disabled = !(hasFile && hasPaste);

  statusEl.textContent = getSourceStatusText(key);
  refreshAllResolvedContext();
}

function bindSource(key) {
  const config = sourceConfigs[key];
  const inputEl = els[config.file];
  const textareaEl = els[config.textarea];
  const modeSelectEl = els[config.modeSelect];
  const toggleBtnEl = els[config.toggle];

  inputEl.addEventListener("change", async () => {
    const file = inputEl.files[0];
    if (!file) {
      state.sources[key].fileText = "";
      state.sources[key].fileName = "";
      updateSourceUI(key);
      return;
    }

    els[config.status].textContent = "Reading file...";
    try {
      const text = await fileToText(file);
      state.sources[key].fileText = text.trim();
      state.sources[key].fileName = file.name;
    } catch (error) {
      state.sources[key].fileText = "";
      state.sources[key].fileName = "";
      els[config.status].textContent = `Failed: ${error.message}`;
    }

    updateSourceUI(key);
  });

  textareaEl.addEventListener("input", () => {
    state.sources[key].pastedText = textareaEl.value.trim();
    updateSourceUI(key);
  });

  modeSelectEl.addEventListener("change", () => {
    state.sources[key].mode = modeSelectEl.value;
    updateSourceUI(key);
  });

  toggleBtnEl.addEventListener("click", () => {
    state.sources[key].textareaVisible = !state.sources[key].textareaVisible;
    if (state.sources[key].textareaVisible) textareaEl.focus();
    updateSourceUI(key);
  });

  updateSourceUI(key);
}

function buildContextMarkdown() {
  refreshAllResolvedContext();
  const safe = (v) => (v && v.trim() ? v.trim() : "(not provided)");
  return [
    "## Context",
    `### Resume\n${safe(state.context.resume)}`,
    `### LinkedIn Profile\n${safe(state.context.linkedin)}`,
    `### Voice Transcript\n${safe(state.context.voice)}`,
    `### Job Posting\n${safe(state.context.job)}`
  ].join("\n\n");
}

async function generateOnePromptOutput(prompt, apiKey, model, sharedContext) {
  const systemMessage = "You are a professional job search strategist. Follow requested structure strictly and return markdown only.";
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
      model,
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
  refreshAllResolvedContext();
  const apiKey = els.apiKey.value.trim();
  const model = els.modelName.value.trim() || "gpt-4.1-mini";
  const selected = prompts.filter((p) => state.selectedPrompts.has(p.id));

  if (!apiKey) {
    alert("Please provide your OpenAI API key.");
    return;
  }
  if (!state.context.resume) {
    alert("Resume is required. Upload a resume file or paste resume text.");
    return;
  }
  if (!selected.length) {
    alert("Please select at least one prompt.");
    return;
  }

  localStorage.setItem(storageKeys.apiKey, apiKey);
  localStorage.setItem(storageKeys.model, model);

  els.generateDoc.disabled = true;
  els.generateDoc.textContent = "Generating...";
  els.markdownOutput.textContent = "Generating document...";

  try {
    const sharedContext = buildContextMarkdown();
    const sections = [];

    for (let i = 0; i < selected.length; i += 1) {
      const prompt = selected[i];
      els.markdownOutput.textContent = `Generating ${i + 1}/${selected.length}: ${prompt.title}`;
      const result = await generateOnePromptOutput(prompt, apiKey, model, sharedContext);
      sections.push(`## ${i + 1}. ${prompt.title}\n\n${result}`);
    }

    const finalMarkdown = [
      "# Job Search Analysis",
      `Generated: ${new Date().toISOString()}`,
      `Model: ${model}`,
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
  els.modelName.value = localStorage.getItem(storageKeys.model) || "gpt-4.1-mini";

  renderPromptChecklist();
  els.promptSearch.addEventListener("input", renderPromptChecklist);
  els.generateDoc.addEventListener("click", generateDocument);
  els.downloadMd.addEventListener("click", downloadMarkdown);

  Object.keys(sourceConfigs).forEach(bindSource);
}

init();
