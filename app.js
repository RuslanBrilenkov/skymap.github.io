// Version 1.3.0 - Added client-side MOC intersection calculation
const VERSION = "1.3.2";
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
    // Pre-calculated area in square degrees (calculated using mocpy)
    areaSqDeg: 2108.51,  // Sky fraction: 0.051112
  },
  {
    id: "erass1",
    label: "eRASS1",
    description: "eROSITA All-Sky Survey footprint",
    mocUrl: `${BASE_MOC_URL}erass1_clusters_coverage_moc.fits`,
    color: "#ff6b6b",
    opacity: 0.45,
    // Pre-calculated area in square degrees (calculated using mocpy)
    areaSqDeg: 21524.45,  // Sky fraction: 0.521767
  },
];

const state = {
  aladin: null,
  aladinLibrary: null,
  layers: new Map(),
  selected: new Set(),
  mocWasm: null,
  mocCache: new Map(),
  intersectionToken: 0,
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
  mapPanel: document.querySelector(".map-panel"),
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
  elements.mocStatus.textContent = `MOC engine: ready (v${VERSION})`;
  logStatus("Application ready.");
  console.log(`Sky Coverage Explorer v${VERSION} initialized`);

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

function renderSurveyList() {
  elements.surveyList.innerHTML = "";

  SURVEYS.forEach((survey) => {
    const item = document.createElement("div");
    item.className = "survey-item";

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = survey.id;
    checkbox.id = `checkbox-${survey.id}`;
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
    elements.coverageLog.textContent = `Loaded ${survey.label} coverage.`;
  } else {
    // Remove survey from selection
    state.selected.delete(survey.id);
    elements.coverageLog.textContent = `Removed ${survey.label} coverage.`;
  }

  // Refresh all MOC layers
  refreshMOCLayers();
  updateStats();
}

function refreshMOCLayers() {
  if (!state.aladin) {
    console.warn("Aladin not ready");
    return;
  }

  try {
    const A = window.A;
    if (!A || !A.MOCFromURL) {
      throw new Error("MOCFromURL is unavailable.");
    }

    // Remove all existing layers (Aladin v2 limitation)
    state.aladin.removeLayers();
    state.layers.clear();

    console.log(`Refreshing MOCs. Selected surveys: ${Array.from(state.selected).join(', ')}`);

    // Re-add MOCs for all selected surveys
    state.selected.forEach(surveyId => {
      const survey = SURVEYS.find(s => s.id === surveyId);
      if (survey) {
        const mocLayer = A.MOCFromURL(survey.mocUrl, {
          color: survey.color,
          opacity: survey.opacity,
          lineWidth: 2,
          adaptativeDisplay: false,
        });

        state.aladin.addMOC(mocLayer);
        state.layers.set(survey.id, mocLayer);
        console.log(`Re-added MOC for ${survey.id}`);
      }
    });
  } catch (error) {
    console.error("Failed to refresh MOC layers:", error);
    elements.coverageLog.textContent = "Failed to refresh MOC layers. Check console.";
  }
}

function updateStats() {
  if (!elements.selectedCount) {
    console.error("selectedCount element not found!");
    return;
  }

  const selectedCount = state.selected.size;
  elements.selectedCount.textContent = String(selectedCount);

  console.log(`updateStats called. Selected count: ${selectedCount}`);
  console.log(`Selected surveys: ${Array.from(state.selected).join(', ')}`);

  if (selectedCount === 0) {
    elements.intersectionArea.textContent = "--";
    elements.downloadButton.disabled = true;
    console.log("Area set to '--' (no selections)");
    return;
  }

  if (selectedCount === 1) {
    // Show single survey area
    const surveyId = Array.from(state.selected)[0];
    const survey = SURVEYS.find(s => s.id === surveyId);

    console.log(`Found survey: ${survey ? survey.label : 'not found'}`);
    console.log(`Survey area: ${survey ? survey.areaSqDeg : 'N/A'}`);

    if (survey && survey.areaSqDeg) {
      const areaText = survey.areaSqDeg.toFixed(2);
      elements.intersectionArea.textContent = areaText;
      console.log(`Area set to: ${areaText}`);
    } else {
      elements.intersectionArea.textContent = "--";
      console.log("Area set to '--' (survey not found or no area)");
    }
    elements.downloadButton.disabled = true;
    return;
  }

  // For 2+ surveys, compute client-side intersections if wasm is available.
  elements.intersectionArea.textContent = "computing...";
  updateIntersectionArea();
  elements.downloadButton.disabled = false;
}

async function ensureMocWasm() {
  if (state.mocWasm) {
    return state.mocWasm;
  }
  if (!window.mocReady) {
    throw new Error("MOC wasm not initialized.");
  }
  const moc = await window.mocReady;
  state.mocWasm = moc;
  return moc;
}

async function loadSurveyMoc(survey) {
  if (state.mocCache.has(survey.id)) {
    return state.mocCache.get(survey.id);
  }
  const mocPromise = ensureMocWasm()
    .then((moc) => moc.MOC.fromFitsUrl(survey.mocUrl))
    .then((mocInstance) => {
      state.mocCache.set(survey.id, Promise.resolve(mocInstance));
      return mocInstance;
    });
  state.mocCache.set(survey.id, mocPromise);
  return mocPromise;
}

async function updateIntersectionArea() {
  const token = ++state.intersectionToken;
  const selectedIds = Array.from(state.selected).sort();
  if (selectedIds.length < 2) {
    return;
  }

  try {
    const surveys = selectedIds
      .map((id) => SURVEYS.find((survey) => survey.id === id))
      .filter(Boolean);

    if (surveys.length < 2) {
      elements.intersectionArea.textContent = "pending";
      return;
    }

    const mocs = [];
    for (const survey of surveys) {
      mocs.push(await loadSurveyMoc(survey));
    }

    let intersection = mocs[0];
    for (let index = 1; index < mocs.length; index += 1) {
      intersection = intersection.and(mocs[index]);
    }

    const coveragePercent = intersection.coveragePercentage();
    const areaSqDeg = (coveragePercent / 100) * 41252.96;

    if (token !== state.intersectionToken) {
      return;
    }

    elements.intersectionArea.textContent = areaSqDeg.toFixed(2);
    console.log(`Intersection area set to: ${areaSqDeg.toFixed(2)}`);
  } catch (error) {
    console.error("Failed to compute intersection area:", error);
    if (token === state.intersectionToken) {
      elements.intersectionArea.textContent = "pending";
    }
  }
}

function resetSelections() {
  console.log("Reset button clicked");

  // Uncheck all checkboxes
  const checkboxes = elements.surveyList.querySelectorAll("input[type=checkbox]");
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  state.intersectionToken += 1;

  // Clear selections first
  state.selected.clear();

  // Remove all MOC layers from the map using removeLayers()
  if (state.aladin) {
    try {
      if (elements.mapPanel) {
        elements.mapPanel.classList.add("is-clearing");
      }
      state.aladin.removeLayers();
      console.log("Removed all layers");
      if (elements.mapPanel) {
        setTimeout(() => {
          elements.mapPanel.classList.remove("is-clearing");
        }, 180);
      }
    } catch (error) {
      console.error("Error removing layers:", error);
    }
  }

  // Clear layer state
  state.layers.clear();

  updateStats();
  elements.coverageLog.textContent = "Selections cleared.";
  logStatus("All selections cleared.");
}

function handleDownload() {
  elements.coverageLog.textContent =
    "Intersection download will be available in a future update.";
}

function logStatus(message) {
  if (!elements.coverageLog) {
    return;
  }
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
  elements.coverageLog.textContent = `[${timestamp}] ${message}`;
}
