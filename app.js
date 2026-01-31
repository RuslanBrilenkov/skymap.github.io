const BASE_MOC_URL =
  "https://ruslanbrilenkov.github.io/skymap.github.io/surveys/";

const SURVEYS = [
  {
    id: "euclid",
    label: "Euclid DR1",
    description: "Euclid DR1 coverage map",
    mocUrl: `${BASE_MOC_URL}euclid_dr1_coverage_moc.fits`,
    color: "#7de7c6",
    opacity: 0.45,
  },
];

const state = {``
  aladin: null,
  aladinLibrary: null,
  layers: new Map(),
  selected: new Set(),
  mocEngine: null,
};

const elements = {
  surveyList: document.getElementById("survey-list"),
  selectedCount: document.getElementById("selected-count"),
  intersectionArea: document.getElementById("intersection-area"),
  coverageLog: document.getElementById("coverage-log"),
  mocStatus: document.getElementById("moc-status"),
  mapStatus: document.getElementById("map-status"),
  downloadButton: document.getElementById("download-button"),
  resetButton: document.getElementById("reset-button"),
};

init();

async function init() {
  elements.coverageLog.textContent = "Initializing Aladin Lite…";
  renderSurveyList();
  logStatus("Survey list ready.");

  // Wait for Aladin Lite v2 to be available
  const aladinReady = await waitForAladin();
  if (!aladinReady) {
    elements.coverageLog.textContent =
      "Failed to load Aladin Lite. Check network access or retry.";
    elements.mapStatus.textContent = "Error";
    return;
  }

  try {
    // Aladin Lite v2 initialization
    state.aladin = window.A.aladin("#aladin-lite-div", {
      survey: "P/DSS2/color",
      fov: 180,
      target: "0 +0",
      showReticle: true,
      showZoomControl: true,
      showFullscreenControl: true,
      showLayersControl: true,
      showGotoControl: true,
    });

    state.aladinLibrary = window.A;
  } catch (error) {
    console.error("Failed to initialize Aladin:", error);
    elements.coverageLog.textContent = `Failed to initialize Aladin: ${error.message}`;
    elements.mapStatus.textContent = "Error";
    return;
  }

  elements.mapStatus.textContent = "Map ready";
  elements.coverageLog.textContent = "Select a survey to load its MOC.";

  state.mocEngine = await loadMocEngine();
  elements.mocStatus.textContent = state.mocEngine
    ? "MOC engine: ready"
    : "MOC engine: unavailable";
  logStatus(
    state.mocEngine ? "MOC engine loaded." : "MOC engine unavailable."
  );

  updateStats();

  elements.resetButton.addEventListener("click", resetSelections);
  elements.downloadButton.addEventListener("click", handleDownload);
}

async function waitForAladin() {
  // Wait for jQuery and Aladin Lite v2 to be available
  const maxAttempts = 50;
  const delayMs = 100;

  for (let i = 0; i < maxAttempts; i++) {
    if (typeof window.A !== 'undefined' &&
        typeof window.A.aladin === 'function' &&
        typeof jQuery !== 'undefined') {
      console.log("Aladin Lite v2 loaded successfully");
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  console.error("Aladin Lite failed to load after", maxAttempts * delayMs, "ms");
  return false;
}

async function loadMocEngine() {
  const urls = [
    "https://cdn.jsdelivr.net/npm/@cds-astro/moc@latest/+esm",
    "https://unpkg.com/@cds-astro/moc@latest/+esm",
  ];

  for (const url of urls) {
    const enginePromise = import(url)
      .then((module) => module)
      .catch((error) => {
        console.warn("MOC engine failed to load.", url, error);
        return null;
      });

    const engine = await promiseWithTimeout(enginePromise, 4000);
    if (engine) {
      return engine;
    }
  }

  return null;
}

function promiseWithTimeout(promise, timeoutMs) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(null);
      });
  });
}

function renderSurveyList() {
  elements.surveyList.innerHTML = "";

  SURVEYS.forEach((survey) => {
    const item = document.createElement("div");
    item.className = "survey-item";

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = survey.id;
    checkbox.addEventListener("change", (event) => {
      handleSurveyToggle(survey, event.target.checked);
    });

    const name = document.createElement("span");
    name.textContent = survey.label;

    label.appendChild(checkbox);
    label.appendChild(name);

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "MOC";

    item.appendChild(label);
    item.appendChild(badge);
    elements.surveyList.appendChild(item);
  });
}

function handleSurveyToggle(survey, isChecked) {
  logStatus(
    `${survey.label} ${isChecked ? "selected" : "deselected"}.`
  );
  if (isChecked) {
    state.selected.add(survey.id);
    if (!state.aladin) {
      elements.coverageLog.textContent =
        "Aladin is not ready yet. Please wait and retry.";
    } else {
      try {
        const A = window.A;
        if (!A || !A.MOCFromURL) {
          throw new Error("MOCFromURL is unavailable.");
        }

        // Aladin Lite v2 MOC loading
        const mocLayer = A.MOCFromURL(survey.mocUrl, {
          color: survey.color,
          opacity: survey.opacity,
          lineWidth: 2,
          adaptativeDisplay: false,
        });

        state.aladin.addMOC(mocLayer);
        state.layers.set(survey.id, mocLayer);
        elements.coverageLog.textContent = `Loaded ${survey.label} coverage.`;
      } catch (error) {
        console.error("Failed to load MOC layer.", error);
        elements.coverageLog.textContent =
          "Failed to load MOC layer. Check console for details.";
      }
    }
  } else {
    state.selected.delete(survey.id);
    const layer = state.layers.get(survey.id);
    if (layer) {
      if (typeof state.aladin.removeMOC === "function") {
        state.aladin.removeMOC(layer);
      }
      state.layers.delete(survey.id);
    }
    elements.coverageLog.textContent = `Removed ${survey.label} coverage.`;
  }

  updateStats();
}

function updateStats() {
  if (!elements.selectedCount) {
    return;
  }
  elements.selectedCount.textContent = String(state.selected.size);

  if (!state.mocEngine) {
    elements.intersectionArea.textContent = "--";
    elements.downloadButton.disabled = true;
    return;
  }

  if (state.selected.size < 2) {
    elements.intersectionArea.textContent = "--";
    elements.downloadButton.disabled = true;
    return;
  }

  elements.intersectionArea.textContent = "pending";
  elements.downloadButton.disabled = false;
}

function resetSelections() {
  const checkboxes = elements.surveyList.querySelectorAll("input[type=checkbox]");
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  for (const [id, layer] of state.layers.entries()) {
    if (typeof state.aladin?.removeMOC === "function") {
      state.aladin.removeMOC(layer);
    }
    state.layers.delete(id);
  }

  state.selected.clear();
  updateStats();
  elements.coverageLog.textContent = "Selections cleared.";
}

function handleDownload() {
  elements.coverageLog.textContent =
    "Intersection download will be available once MOC engine is wired.";
}

function logStatus(message) {
  if (!elements.coverageLog) {
    return;
  }
  const timestamp = new Date().toLocaleTimeString();
  elements.coverageLog.textContent = `[${timestamp}] ${message}`;
}
