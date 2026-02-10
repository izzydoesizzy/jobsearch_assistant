const runtimeConfig = window.appConfig || {};
const APP_DEFAULT_CONFIG = {
  fixedModel: "gpt-5.2",
  globalContextDocument: "",
  systemPromptPrefix: "You are a professional job search strategist. Follow requested structure strictly and return markdown only.",
  backendGenerateEndpoint: "/api/generate"
};

const config = {
  ...APP_DEFAULT_CONFIG,
  ...runtimeConfig
};

const loadingQuotes = [
  "Polishing your story so recruiters can feel the momentum.",
  "Career clarity is loading… coffee helps.",
  "Turning your experience into interview magnetism.",
  "Small reminder: your next role needs your exact skill mix."
];

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
  categoryChips: document.getElementById("categoryChips"),
  selectCategory: document.getElementById("selectCategory"),
  clearCategory: document.getElementById("clearCategory"),
  selectVisible: document.getElementById("selectVisible"),
  clearVisible: document.getElementById("clearVisible"),
  generateDoc: document.getElementById("generateDoc"),
  modelName: document.getElementById("modelName"),
  markdownOutput: document.getElementById("markdownOutput"),
  downloadMd: document.getElementById("downloadMd"),
  loadingPanel: document.getElementById("loadingPanel"),
  loadingQuote: document.getElementById("loadingQuote"),
  promptsSection: document.getElementById("promptsSection"),
  generateSection: document.getElementById("generateSection"),
  outputSection: document.getElementById("outputSection"),
  extraDropzone: document.getElementById("extraDropzone"),
  extraFiles: document.getElementById("extraFiles"),
  extraFileList: document.getElementById("extraFileList"),
  extraStatus: document.getElementById("extraStatus")
};

Object.values(sourceConfigs).forEach((sourceConfig) => {
  els[sourceConfig.file] = document.getElementById(sourceConfig.file);
  els[sourceConfig.status] = document.getElementById(sourceConfig.status);
  els[sourceConfig.textarea] = document.getElementById(sourceConfig.textarea);
  els[sourceConfig.modeSelect] = document.getElementById(sourceConfig.modeSelect);
  els[sourceConfig.toggle] = document.getElementById(sourceConfig.toggle);
});

const state = {
  selectedPrompts: new Set(),
  activeCategories: new Set(),
  categoryIndex: new Map(),
  outputMarkdown: "",
  context: { resume: "", linkedin: "", voice: "", job: "", additional: "" },
  sources: {
    resume: { fileText: "", fileName: "", pastedText: "", mode: "auto", textareaVisible: false },
    linkedin: { fileText: "", fileName: "", pastedText: "", mode: "auto", textareaVisible: false },
    voice: { fileText: "", fileName: "", pastedText: "", mode: "auto", textareaVisible: false },
    job: { fileText: "", fileName: "", pastedText: "", mode: "auto", textareaVisible: false }
  },
  additionalDocs: []
};

let loadingQuoteTimer = null;

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.js";
}

function buildCategoryIndex() {
  const index = new Map();
  prompts.forEach((prompt) => {
    (prompt.categories || []).forEach((category) => {
      if (!index.has(category)) index.set(category, new Set());
      index.get(category).add(prompt.id);
    });
  });
  state.categoryIndex = index;
}

function getVisiblePrompts() {
  const query = els.promptSearch.value.toLowerCase().trim();
  return prompts.filter((prompt) => {
    const matchesSearch = `${prompt.title} ${prompt.description}`.toLowerCase().includes(query);
    const matchesCategory = !state.activeCategories.size
      || (prompt.categories || []).some((category) => state.activeCategories.has(category));
    return matchesSearch && matchesCategory;
  });
}

function renderCategoryChips() {
  const categories = [...state.categoryIndex.keys()].sort((a, b) => a.localeCompare(b));
  els.categoryChips.innerHTML = categories.map((category) => `
    <button type="button" class="chip ${state.activeCategories.has(category) ? "is-selected" : ""}" data-category="${category}">
      ${category}
    </button>
  `).join("");

  els.categoryChips.querySelectorAll("button[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const { category } = button.dataset;
      if (state.activeCategories.has(category)) state.activeCategories.delete(category);
      else state.activeCategories.add(category);
      renderCategoryChips();
      renderPromptChecklist();
    });
  });

  const hasCategorySelection = state.activeCategories.size > 0;
  els.selectCategory.disabled = !hasCategorySelection;
  els.clearCategory.disabled = !hasCategorySelection;
}

function updateSelectedCount() {
  els.selectedCount.textContent = `${state.selectedPrompts.size} of ${prompts.length} selected`;
}

function applyBulkSelection(promptIds, shouldSelect) {
  promptIds.forEach((id) => {
    if (shouldSelect) state.selectedPrompts.add(id);
    else state.selectedPrompts.delete(id);
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
    .map((prompt) => `
      <article class="prompt-item">
        <label>
          <input type="checkbox" data-id="${prompt.id}" ${state.selectedPrompts.has(prompt.id) ? "checked" : ""} />
          <span>${prompt.title}</span>
        </label>
        <small>${prompt.description}</small>
      </article>
    `)
    .join("");

  els.promptChecklist.querySelectorAll("input[type='checkbox']").forEach((box) => {
    box.addEventListener("change", (event) => {
      const id = Number(event.target.dataset.id);
      if (event.target.checked) state.selectedPrompts.add(id);
      else state.selectedPrompts.delete(id);
      updateSelectedCount();
    });
  });

  updateSelectedCount();
}

async function extractPdfText(file) {
  if (!window.pdfjsLib) throw new Error("PDF parser unavailable.");
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const chunks = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
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
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".json") || name.endsWith(".csv") || name.endsWith(".rtf")) {
    return file.text();
  }
  if (name.endsWith(".pdf")) return extractPdfText(file);
  if (name.endsWith(".docx")) return extractDocxText(file);
  if (name.endsWith(".doc")) throw new Error(".doc is not supported for browser parsing. Please export as .docx or .txt.");
  throw new Error("Unsupported file type.");
}

function getResolvedContextForKey(key) {
  const source = state.sources[key];
  const fileText = source.fileText.trim();
  const pastedText = source.pastedText.trim();

  if (source.mode === "file") return fileText;
  if (source.mode === "pasted") return pastedText;
  return pastedText || fileText;
}

function refreshAllResolvedContext() {
  Object.keys(state.sources).forEach((key) => {
    state.context[key] = getResolvedContextForKey(key);
  });
  state.context.additional = state.additionalDocs
    .map((doc) => `#### ${doc.name}\n${doc.text}`)
    .join("\n\n");
}

function getSourceStatusText(key) {
  const source = state.sources[key];
  const hasFile = Boolean(source.fileText.trim());
  const hasPaste = Boolean(source.pastedText.trim());
  const modeLabel = source.mode === "auto" ? "Auto" : source.mode === "file" ? "Use file" : "Use pasted text";

  if (!hasFile && !hasPaste) return `${modeLabel}: no source selected`;
  if (source.mode === "file") return hasFile ? `Using file: ${source.fileName || "selected file"}` : "File mode selected, but no file";
  if (source.mode === "pasted") return hasPaste ? "Using pasted text" : "Pasted mode selected, but textarea is empty";
  if (hasPaste && hasFile) return "Auto mode: using pasted text";
  if (hasPaste) return "Auto mode: using pasted text";
  return `Auto mode: using ${source.fileName || "file"}`;
}

function updateProgressiveSections() {
  refreshAllResolvedContext();
  const hasResume = Boolean(state.context.resume.trim());
  els.promptsSection.classList.toggle("hidden", !hasResume);
  els.generateSection.classList.toggle("hidden", !hasResume);
}

function updateSourceUI(key) {
  const sourceConfig = sourceConfigs[key];
  const source = state.sources[key];

  els[sourceConfig.textarea].classList.toggle("visible", source.textareaVisible);
  els[sourceConfig.toggle].textContent = source.textareaVisible ? "Hide pasted text" : "Paste text instead";

  const hasFile = Boolean(source.fileText.trim());
  const hasPaste = Boolean(source.pastedText.trim());
  els[sourceConfig.modeSelect].disabled = !(hasFile && hasPaste);
  els[sourceConfig.status].textContent = getSourceStatusText(key);

  updateProgressiveSections();
}

function bindSource(key) {
  const sourceConfig = sourceConfigs[key];
  const inputEl = els[sourceConfig.file];
  const textareaEl = els[sourceConfig.textarea];
  const modeSelectEl = els[sourceConfig.modeSelect];
  const toggleBtnEl = els[sourceConfig.toggle];

  inputEl.addEventListener("change", async () => {
    const file = inputEl.files[0];
    if (!file) {
      state.sources[key].fileText = "";
      state.sources[key].fileName = "";
      updateSourceUI(key);
      return;
    }

    els[sourceConfig.status].textContent = "Reading file...";
    try {
      state.sources[key].fileText = (await fileToText(file)).trim();
      state.sources[key].fileName = file.name;
    } catch (error) {
      state.sources[key].fileText = "";
      state.sources[key].fileName = "";
      els[sourceConfig.status].textContent = `Failed: ${error.message}`;
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

function renderAdditionalFiles() {
  els.extraFileList.innerHTML = state.additionalDocs.map((doc) => `<li>${doc.name}</li>`).join("");
  if (!state.additionalDocs.length) {
    els.extraStatus.textContent = "No additional files added.";
  } else {
    els.extraStatus.textContent = `${state.additionalDocs.length} additional file(s) ready for context.`;
  }
  updateProgressiveSections();
}

async function addAdditionalFiles(fileList) {
  const files = [...fileList];
  if (!files.length) return;

  els.extraStatus.textContent = "Reading additional files...";
  for (const file of files) {
    try {
      const text = (await fileToText(file)).trim();
      state.additionalDocs.push({ name: file.name, text });
    } catch (error) {
      state.additionalDocs.push({ name: `${file.name} (skipped: ${error.message})`, text: "" });
    }
  }
  renderAdditionalFiles();
}

function bindAdditionalDropzone() {
  const { extraDropzone, extraFiles } = els;
  extraDropzone.addEventListener("click", () => extraFiles.click());
  extraDropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      extraFiles.click();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    extraDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      extraDropzone.classList.add("is-active");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    extraDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      extraDropzone.classList.remove("is-active");
    });
  });

  extraDropzone.addEventListener("drop", async (event) => {
    await addAdditionalFiles(event.dataTransfer.files);
  });

  extraFiles.addEventListener("change", async () => {
    await addAdditionalFiles(extraFiles.files);
    extraFiles.value = "";
  });
}

function getRandomLoadingQuote() {
  return loadingQuotes[Math.floor(Math.random() * loadingQuotes.length)];
}

function startLoadingExperience() {
  els.loadingPanel.hidden = false;
  els.loadingQuote.textContent = getRandomLoadingQuote();
  if (loadingQuoteTimer) clearInterval(loadingQuoteTimer);
  loadingQuoteTimer = setInterval(() => {
    els.loadingQuote.textContent = getRandomLoadingQuote();
  }, 2600);
}

function stopLoadingExperience() {
  if (loadingQuoteTimer) {
    clearInterval(loadingQuoteTimer);
    loadingQuoteTimer = null;
  }
  els.loadingPanel.hidden = true;
}

function buildContextMarkdown() {
  refreshAllResolvedContext();
  const safe = (value) => (value && value.trim() ? value.trim() : "(not provided)");
  return [
    "## Context",
    `### Global Instructions / Context\n${safe(config.globalContextDocument)}`,
    `### Resume\n${safe(state.context.resume)}`,
    `### LinkedIn Profile\n${safe(state.context.linkedin)}`,
    `### Voice Transcript\n${safe(state.context.voice)}`,
    `### Job Posting\n${safe(state.context.job)}`,
    `### Additional Documents\n${safe(state.context.additional)}`
  ].join("\n\n");
}

async function generateOnePromptOutput(prompt, sharedContext) {
  const userMessage = [
    "Use the following context to answer the selected prompt.",
    sharedContext,
    `## Selected Prompt\n${prompt.title}`,
    `### Prompt Instructions\n${prompt.promptText}`,
    "Return only markdown for this prompt output."
  ].join("\n\n");

  const response = await fetch(config.backendGenerateEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.fixedModel,
      systemPromptPrefix: config.systemPromptPrefix,
      promptTitle: prompt.title,
      promptText: prompt.promptText,
      sharedContext
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`API error ${response.status}: ${message}`);
  }

  const data = await response.json();
  return data.output_text || data.output || data.markdown || "(No output text returned)";
}

async function generateDocument() {
  updateProgressiveSections();
  const selected = prompts.filter((prompt) => state.selectedPrompts.has(prompt.id));

  if (!state.context.resume) return alert("Resume is required. Upload a resume file or paste resume text.");
  if (!selected.length) return alert("Please select at least one prompt.");

  els.outputSection.classList.remove("hidden");
  els.generateDoc.disabled = true;
  els.generateDoc.textContent = "Generating...";
  els.markdownOutput.textContent = "Generating document...";
  startLoadingExperience();

  try {
    const sharedContext = buildContextMarkdown();
    const sections = [];

    for (let i = 0; i < selected.length; i += 1) {
      const prompt = selected[i];
      els.markdownOutput.textContent = `Generating ${i + 1}/${selected.length}: ${prompt.title}`;
      const result = await generateOnePromptOutput(prompt, sharedContext);
      sections.push(`## ${i + 1}. ${prompt.title}\n\n${result}`);
    }

    state.outputMarkdown = [
      "# Job Search Analysis",
      `Generated: ${new Date().toISOString()}`,
      `Model: ${config.fixedModel}`,
      buildContextMarkdown(),
      "---",
      ...sections
    ].join("\n\n");

    els.markdownOutput.textContent = state.outputMarkdown;
    els.downloadMd.disabled = false;
  } catch (error) {
    els.markdownOutput.textContent = `Generation failed: ${error.message}`;
  } finally {
    stopLoadingExperience();
    els.generateDoc.disabled = false;
    els.generateDoc.textContent = "Generate Document";
  }
}

function downloadMarkdown() {
  if (!state.outputMarkdown) return;
  const blob = new Blob([state.outputMarkdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `job-search-analysis-${Date.now()}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function init() {
  stopLoadingExperience();
  els.modelName.textContent = config.fixedModel;

  buildCategoryIndex();
  renderCategoryChips();
  renderPromptChecklist();
  renderAdditionalFiles();

  els.promptSearch.addEventListener("input", renderPromptChecklist);
  els.selectCategory.addEventListener("click", () => applyBulkSelection(getActiveCategoryPromptIds(), true));
  els.clearCategory.addEventListener("click", () => applyBulkSelection(getActiveCategoryPromptIds(), false));
  els.selectVisible.addEventListener("click", () => applyBulkSelection(getVisiblePrompts().map((prompt) => prompt.id), true));
  els.clearVisible.addEventListener("click", () => applyBulkSelection(getVisiblePrompts().map((prompt) => prompt.id), false));

  els.generateDoc.addEventListener("click", generateDocument);
  els.downloadMd.addEventListener("click", downloadMarkdown);

  Object.keys(sourceConfigs).forEach(bindSource);
  bindAdditionalDropzone();
  updateProgressiveSections();
}

init();
