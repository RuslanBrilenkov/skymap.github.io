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

const state = {
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

  const aladinModule = await loadAladinModule();
  if (!aladinModule) {
    elements.coverageLog.textContent =
      "Failed to load Aladin Lite. Check network access or retry.";
    elements.mapStatus.textContent = "Error";
    return;
  }

  state.aladinLibrary = aladinModule;
  state.aladin = aladinModule.aladin("#aladin-lite-div", {
    survey: "P/DSS2/color",
    fov: 180,
    target: "0 +0",
  });

  elements.mapStatus.textContent = "Map ready";
  elements.coverageLog.textContent = "Select a survey to load its MOC.";

  state.mocEngine = await loadMocEngine();
  elements.mocStatus.textContent = state.mocEngine
    ? "MOC engine: ready"
    : "MOC engine: unavailable";

  updateStats();

  elements.resetButton.addEventListener("click", resetSelections);
  elements.downloadButton.addEventListener("click", handleDownload);
}

async function loadAladinModule() {
  const esmPromise = import(
    "https://cdn.jsdelivr.net/npm/aladin-lite@3.6.5/+esm"
  )
    .then((module) => module?.default || null)
    .catch((error) => {
      console.warn("ESM import failed, falling back to global A.", error);
      return null;
    });

  const esmResult = await promiseWithTimeout(esmPromise, 4000);
  if (esmResult) {
    return esmResult;
  }

  return waitForGlobalA(4000);
}

async function loadMocEngine() {
  const enginePromise = import(
    "https://cdn.jsdelivr.net/npm/@cds-astro/moc@latest/+esm"
  )
    .then((module) => module)
    .catch((error) => {
      console.warn("MOC engine failed to load.", error);
      return null;
    });

  return promiseWithTimeout(enginePromise, 4000);
}

function waitForGlobalA(timeoutMs) {
  if (window.A) {
    return Promise.resolve(window.A);
  }

  return new Promise((resolve) => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      if (window.A) {
        clearInterval(timer);
        resolve(window.A);
        return;
      }

      if (Date.now() - startTime >= timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, 100);
  });
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
  if (!state.aladin) {
    return;
  }

  if (isChecked) {
    state.selected.add(survey.id);
    const mocLayer = state.aladinLibrary.MOCFromURL(survey.mocUrl, {
      color: survey.color,
      opacity: survey.opacity,
      lineWidth: 1,
    });

    state.aladin.addMOC(mocLayer);
    state.layers.set(survey.id, mocLayer);
    elements.coverageLog.textContent = `Loaded ${survey.label} coverage.`;
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
