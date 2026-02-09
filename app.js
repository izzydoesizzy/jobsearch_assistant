const els = {
  promptChecklist: document.getElementById("promptChecklist"),
  promptSearch: document.getElementById("promptSearch"),
  selectedCount: document.getElementById("selectedCount"),
  categoryChips: document.getElementById("categoryChips"),
  selectCategory: document.getElementById("selectCategory"),
  clearCategory: document.getElementById("clearCategory"),
  selectVisible: document.getElementById("selectVisible"),
  clearVisible: document.getElementById("clearVisible"),
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
  activeCategories: new Set(),
  categoryIndex: new Map(),
  outputMarkdown: "",
  context: { resume: "", linkedin: "", voice: "", job: "" }
};

const storageKeys = { apiKey: "jobPromptOpenAIKey", model: "jobPromptModel" };

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.js";
}

function buildCategoryIndex() {
  const index = new Map();
  prompts.forEach((prompt) => {
    (prompt.categories || []).forEach((category) => {
      if (!index.has(category)) {
        index.set(category, new Set());
      }
      index.get(category).add(prompt.id);
    });
  });
  state.categoryIndex = index;
}

function getVisiblePrompts() {
  const query = els.promptSearch.value.toLowerCase().trim();
  return prompts.filter((p) => {
    const matchesSearch = `${p.title} ${p.description}`.toLowerCase().includes(query);
    const matchesCategory = !state.activeCategories.size
      || (p.categories || []).some((category) => state.activeCategories.has(category));
    return matchesSearch && matchesCategory;
  });
}

function renderCategoryChips() {
  const categories = [...state.categoryIndex.keys()].sort((a, b) => a.localeCompare(b));
  els.categoryChips.innerHTML = categories
    .map((category) => `
      <button
        type="button"
        class="chip ${state.activeCategories.has(category) ? "is-selected" : ""}"
        data-category="${category}"
      >
        ${category}
      </button>
    `)
    .join("");

  els.categoryChips.querySelectorAll("button[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const { category } = button.dataset;
      if (state.activeCategories.has(category)) {
        state.activeCategories.delete(category);
      } else {
        state.activeCategories.add(category);
      }
      renderCategoryChips();
      renderPromptChecklist();
    });
  });

  const hasCategorySelection = state.activeCategories.size > 0;
  els.selectCategory.disabled = !hasCategorySelection;
  els.clearCategory.disabled = !hasCategorySelection;
}

function applyBulkSelection(promptIds, shouldSelect) {
  promptIds.forEach((id) => {
    if (shouldSelect) {
      state.selectedPrompts.add(id);
    } else {
      state.selectedPrompts.delete(id);
    }
  });
  renderPromptChecklist();
}

function getActiveCategoryPromptIds() {
  const ids = new Set();
  state.activeCategories.forEach((category) => {
    const categoryPrompts = state.categoryIndex.get(category);
    if (!categoryPrompts) return;
    categoryPrompts.forEach((id) => ids.add(id));
  });
  return [...ids];
}

function renderPromptChecklist() {
  const filtered = getVisiblePrompts();
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
  const apiKey = els.apiKey.value.trim();
  const model = els.modelName.value.trim() || "gpt-4.1-mini";
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

  buildCategoryIndex();
  renderCategoryChips();
  renderPromptChecklist();

  els.promptSearch.addEventListener("input", renderPromptChecklist);
  els.selectCategory.addEventListener("click", () => applyBulkSelection(getActiveCategoryPromptIds(), true));
  els.clearCategory.addEventListener("click", () => applyBulkSelection(getActiveCategoryPromptIds(), false));
  els.selectVisible.addEventListener("click", () => applyBulkSelection(getVisiblePrompts().map((p) => p.id), true));
  els.clearVisible.addEventListener("click", () => applyBulkSelection(getVisiblePrompts().map((p) => p.id), false));

  els.generateDoc.addEventListener("click", generateDocument);
  els.downloadMd.addEventListener("click", downloadMarkdown);

  bindUpload(els.resumeFile, els.resumeStatus, "resume");
  bindUpload(els.linkedinFile, els.linkedinStatus, "linkedin");
  bindUpload(els.voiceFile, els.voiceStatus, "voice");
  bindUpload(els.jobFile, els.jobStatus, "job");
}

init();
