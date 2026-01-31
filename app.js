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
  mocs: new Map(), // Store MOC objects for area calculations
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

  // Load MOC engine for area calculations
  try {
    state.mocEngine = await loadMocEngine();
    elements.mocStatus.textContent = state.mocEngine
      ? "MOC engine: ready"
      : "MOC engine: unavailable";
    logStatus(
      state.mocEngine ? "MOC engine loaded." : "MOC engine unavailable."
    );
  } catch (error) {
    console.error("Failed to load MOC engine:", error);
    elements.mocStatus.textContent = "MOC engine: unavailable";
    logStatus("MOC engine unavailable.");
  }

  updateStats();

  elements.resetButton.addEventListener("click", resetSelections);
  elements.downloadButton.addEventListener("click", handleDownload);
}

async function loadMocEngine() {
  try {
    // Import the MOC module as an ES6 module
    const MOCModule = await import("https://cdn.jsdelivr.net/npm/@cds-astro/moc@3/dist/moc.js");

    // Wait for WASM to initialize
    await MOCModule.default;

    console.log("MOC engine loaded successfully");
    return MOCModule;
  } catch (error) {
    console.error("MOC engine load failed:", error);
    return null;
  }
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

async function handleSurveyToggle(survey, isChecked) {
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

        // Aladin Lite v2 MOC loading for visualization
        const mocLayer = A.MOCFromURL(survey.mocUrl, {
          color: survey.color,
          opacity: survey.opacity,
          lineWidth: 2,
          adaptativeDisplay: false,
        });

        state.aladin.addMOC(mocLayer);
        state.layers.set(survey.id, mocLayer);

        // Load MOC data for area calculations
        if (state.mocEngine) {
          try {
            const mocData = await loadMocData(survey.mocUrl);
            state.mocs.set(survey.id, mocData);
          } catch (error) {
            console.warn("Failed to load MOC data for area calculation:", error);
          }
        }

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
    state.mocs.delete(survey.id);
    elements.coverageLog.textContent = `Removed ${survey.label} coverage.`;
  }

  await updateStats();
}

async function loadMocData(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch MOC: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Use @cds-astro/moc to parse the FITS file
  const MOC = state.mocEngine.MOC;
  return MOC.fromFITS(uint8Array);
}

async function updateStats() {
  if (!elements.selectedCount) {
    return;
  }
  elements.selectedCount.textContent = String(state.selected.size);

  if (!state.mocEngine) {
    elements.intersectionArea.textContent = "--";
    elements.downloadButton.disabled = true;
    return;
  }

  // Calculate area based on number of selected surveys
  const selectedCount = state.selected.size;

  if (selectedCount === 0) {
    elements.intersectionArea.textContent = "--";
    elements.downloadButton.disabled = true;
    return;
  }

  if (selectedCount === 1) {
    // Show single survey area
    const surveyId = Array.from(state.selected)[0];
    const moc = state.mocs.get(surveyId);

    if (moc) {
      try {
        const areaSqDeg = await calculateMocArea(moc);
        elements.intersectionArea.textContent = areaSqDeg.toFixed(2);
        elements.downloadButton.disabled = true;
      } catch (error) {
        console.error("Failed to calculate area:", error);
        elements.intersectionArea.textContent = "error";
        elements.downloadButton.disabled = true;
      }
    } else {
      elements.intersectionArea.textContent = "loading...";
      elements.downloadButton.disabled = true;
    }
    return;
  }

  // Calculate intersection for 2+ surveys
  try {
    const selectedMocs = Array.from(state.selected)
      .map(id => state.mocs.get(id))
      .filter(moc => moc !== undefined);

    if (selectedMocs.length < state.selected.size) {
      elements.intersectionArea.textContent = "loading...";
      elements.downloadButton.disabled = true;
      return;
    }

    const intersectionMoc = calculateIntersection(selectedMocs);
    const areaSqDeg = await calculateMocArea(intersectionMoc);
    elements.intersectionArea.textContent = areaSqDeg.toFixed(2);
    elements.downloadButton.disabled = false;
  } catch (error) {
    console.error("Failed to calculate intersection:", error);
    elements.intersectionArea.textContent = "error";
    elements.downloadButton.disabled = true;
  }
}

async function calculateMocArea(moc) {
  // Get sky fraction and convert to square degrees
  // Full sky = 4π steradians = 41252.96 square degrees
  const skyFraction = moc.skyFraction();
  return skyFraction * 41252.96;
}

function calculateIntersection(mocs) {
  // Start with the first MOC
  let intersection = mocs[0];

  // Intersect with all other MOCs
  for (let i = 1; i < mocs.length; i++) {
    intersection = intersection.intersection(mocs[i]);
  }

  return intersection;
}

async function resetSelections() {
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
  state.mocs.clear();
  await updateStats();
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
