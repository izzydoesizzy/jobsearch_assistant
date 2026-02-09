const PDFJS_VERSION = "4.7.76";
const PDF_SCRIPT_CANDIDATES = [
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`,
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`
];
const PDF_WORKER_CANDIDATES = [
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`,
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`
];

async function loadScript(url) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(script);
  });
}

function configureWorker() {
  if (!window.pdfjsLib) return false;
  const workerSrc = PDF_WORKER_CANDIDATES[0];
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  return true;
}

window.pdfParserStatus = { ready: false, source: null, error: null };

window.pdfParserReady = (async () => {
  if (window.pdfjsLib && configureWorker()) {
    window.pdfParserStatus = { ready: true, source: "preloaded", error: null };
    return window.pdfParserStatus;
  }

  for (const url of PDF_SCRIPT_CANDIDATES) {
    try {
      await loadScript(url);
      if (configureWorker()) {
        window.pdfParserStatus = { ready: true, source: url, error: null };
        return window.pdfParserStatus;
      }
    } catch (error) {
      window.pdfParserStatus = { ready: false, source: url, error: error.message };
    }
  }

  window.pdfParserStatus = {
    ready: false,
    source: null,
    error: window.pdfParserStatus.error || "PDF parser failed to load from all sources."
  };
  return window.pdfParserStatus;
})();
