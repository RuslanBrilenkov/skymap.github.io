// Version 1.12.1 - Add UNIONS survey
const VERSION = "1.13.1";
const FULL_SKY_AREA_SQ_DEG = 41252.96;
const LOCAL_MOC_URL = "./surveys/";
const REMOTE_MOC_URL =
  "https://ruslanbrilenkov.github.io/skymap.github.io/surveys/";
const BASE_MOC_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? LOCAL_MOC_URL
    : REMOTE_MOC_URL;
const BASE_GEOJSON_URL = "./surveys/geojson/";
const ANCHOR_MOC_URL = `${BASE_MOC_URL}anchor_moc.fits`;
const STORAGE_KEY = "sky-coverage-settings-v2";
const PERSIST_KEY = "sky-coverage-persist-enabled";

const SURVEY_CONFIGS = [
  {
    id: "kids",
    label: "KiDS",
    description: "Kilo-Degree Survey (KiDS-450) footprint",
    mocUrl: `${BASE_MOC_URL}kids_footprint_moc.fits`,
    geojsonFile: "kids_footprint_moc.geojson",
    opacity: 0.45,
  },
  {
    id: "euclid",
    label: "Euclid DR1",
    description: "Euclid DR1 coverage map",
    mocUrl: `${BASE_MOC_URL}euclid_dr1_coverage_moc.fits`,
    geojsonFile: "euclid_dr1_coverage_moc.geojson",
    opacity: 0.45,
  },
  {
    id: "hsc",
    label: "HSC",
    description: "Subaru Hyper Suprime-Cam survey footprint",
    mocUrl: `${BASE_MOC_URL}hsc_footprint_moc.fits`,
    geojsonFile: "hsc_footprint_moc.geojson",
    opacity: 0.45,
  },
  {
    id: "des",
    label: "DES",
    description: "Dark Energy Survey footprint",
    mocUrl: `${BASE_MOC_URL}des_footprint_moc.fits`,
    geojsonFile: "des_footprint_moc.geojson",
    opacity: 0.45,
  },
  {
    id: "unions",
    label: "UNIONS",
    description: "UNIONS survey footprint",
    mocUrl: `${BASE_MOC_URL}unions_footprint_moc.fits`,
    geojsonFile: "unions_footprint_moc.geojson",
    opacity: 0.45,
  },
  {
    id: "desi_legacy",
    label: "DESI Legacy DR9",
    description: "DESI Legacy Imaging Survey footprint",
    mocUrl: `${BASE_MOC_URL}desi_legacy_dr9_footprint_moc.fits`,
    geojsonFile: "desi_legacy_dr9_footprint_moc.geojson",
    opacity: 0.45,
  },
  {
    id: "erass1",
    label: "eRASS1",
    description: "eROSITA All-Sky Survey footprint",
    mocUrl: `${BASE_MOC_URL}erass1_clusters_coverage_moc.fits`,
    geojsonFile: "erass1_clusters_coverage_moc.geojson",
    opacity: 0.45,
  },
  {
    id: "lsst_wfd",
    label: "LSST WFD",
    description: "LSST Wide-Fast-Deep footprint",
    mocUrl: `${BASE_MOC_URL}lsst_wfd_footprint_moc.fits`,
    geojsonFile: "lsst_wfd_footprint_moc.geojson",
    opacity: 0.45,
  },
];

const COLOR_THEMES = {
  default: {
    label: "Vivid",
    colors: {
      euclid: "#7de7c6",
      erass1: "#ff6b6b",
      des: "#f7931a",
      unions: "#f9b25c",
      desi_legacy: "#f5b352",
      hsc: "#7a7aed",
      kids: "#4cbcac",
      lsst_wfd: "#2ab7a9",
    },
  },
  colorblind: {
    label: "Color-blind friendly",
    colors: {
      euclid: "#0072B2",
      erass1: "#D55E00",
      des: "#E69F00",
      unions: "#F0E442",
      desi_legacy: "#009E73",
      hsc: "#56B4E9",
      kids: "#009E73",
      lsst_wfd: "#009E73",
    },
  },
  pastel: {
    label: "Pastel",
    colors: {
      euclid: "#9ad9c7",
      erass1: "#f4a7b9",
      des: "#f4c199",
      unions: "#f5d1a9",
      desi_legacy: "#f2c2a2",
      hsc: "#c1c6f2",
      kids: "#bfe7df",
      lsst_wfd: "#b8e3dd",
    },
  },
};

let SURVEYS = SURVEY_CONFIGS.map((survey) => ({
  ...survey,
  color: COLOR_THEMES.colorblind.colors[survey.id] || "#7de7c6",
}));

const state = {
  aladin: null,
  aladinLibrary: null,
  anchorLayer: null,
  layers: new Map(),
  selected: new Set(),
  mocWasm: null,
  mocCache: new Map(),
  intersectionToken: 0,
  singleAreaToken: 0,
  refreshTimer: null,
  isUpdatingCount: 0,
  activeTheme: "colorblind",
  activeProjection: "SIN",
  activeView: "aladin",  // "aladin" or "equirectangular"
  dragSurveyId: null,
  mocWasmFailed: false,
  // Equirectangular map state
  eqMap: {
    svg: null,
    gridGroup: null,
    surveyGroup: null,
    overlayGroup: null,
    labelGroup: null,
    xScale: null,
    yScale: null,
    geojsonCache: new Map(),
    initialized: false,
  },
  areaCache: new Map(),
  crossMatchOnly: false,
  intersectionBlobUrl: null,
};

const elements = {
  surveyList: document.getElementById("survey-list"),
  selectedCount: document.getElementById("selected-count"),
  intersectionArea: document.getElementById("intersection-area"),
  coverageLog: document.getElementById("coverage-log"),
  mocStatus: document.getElementById("moc-status"),
  mapStatus: document.getElementById("map-status"),
  mapTitle: document.getElementById("map-title"),
  downloadButton: document.getElementById("download-button"),
  resetButton: document.getElementById("reset-button"),
  mapPanel: document.querySelector(".map-panel"),
  mapOverlay: document.getElementById("map-overlay"),
  themeSelect: document.getElementById("theme-select"),
  legendList: document.getElementById("legend-list"),
  surveyDropdown: document.getElementById("survey-dropdown"),
  surveyToggle: document.getElementById("survey-toggle"),
  surveyPanel: document.getElementById("survey-panel"),
  persistToggle: document.getElementById("persist-toggle"),
  crossMatchToggle: document.getElementById("crossmatch-toggle"),
  toastStack: document.getElementById("toast-stack"),
  projectionBtns: document.querySelectorAll(".projection-btn"),
  // View toggle elements
  viewBtns: document.querySelectorAll(".view-btn"),
  aladinDiv: document.getElementById("aladin-lite-div"),
  equirectDiv: document.getElementById("equirectangular-map"),
  equirectControls: document.getElementById("equirect-controls"),
  showGrid: document.getElementById("show-grid"),
  showGalactic: document.getElementById("show-galactic"),
  showEcliptic: document.getElementById("show-ecliptic"),
  skyMapSvg: document.getElementById("sky-map"),
};

init();

async function init() {
  elements.coverageLog.textContent = "Initializing Aladin Lite…";
  const persistenceEnabled = restorePersistenceToggle();
  if (persistenceEnabled) {
    restoreSettings();
  }
  renderSurveyList();
  renderLegend();
  logStatus("Survey list ready.");

  // Wait for Aladin Lite v2 to be available
  const aladinReady = await waitForAladin();
  if (!aladinReady) {
    elements.coverageLog.textContent =
      "Failed to load Aladin Lite. Check network access or retry.";
    elements.mapStatus.textContent = "Error";
    elements.mapStatus.classList.add("map-status--error");
    showToast("Failed to load Aladin Lite. Check your network connection.", "error", "aladin-init", 0);
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
    addAnchorLayer();
  } catch (error) {
    console.error("Failed to initialize Aladin:", error);
    elements.coverageLog.textContent = `Failed to initialize Aladin: ${error.message}`;
    elements.mapStatus.textContent = "Error";
    elements.mapStatus.classList.add("map-status--error");
    showToast(`Failed to initialize Aladin: ${error.message}`, "error", "aladin-init", 0);
    return;
  }

  elements.mapStatus.textContent = "Map ready";
  elements.coverageLog.textContent = "Select a survey to load its MOC.";
  elements.mocStatus.textContent = `MOC engine: ready (v${VERSION})`;
  logStatus("Application ready.");
  console.log(`Sky Coverage Explorer v${VERSION} initialized`);

  // Apply restored projection if different from default
  if (state.activeProjection !== "SIN") {
    try {
      state.aladin.setProjection(state.activeProjection);
      console.log(`Restored projection: ${state.activeProjection}`);
    } catch (error) {
      console.warn("Failed to restore projection:", error);
      state.activeProjection = "SIN";
    }
  }

  updateStats();
  renderLegend();
  updateSurveyToggleLabel();

  elements.resetButton.addEventListener("click", resetSelections);
  elements.downloadButton.addEventListener("click", handleDownload);
  if (elements.surveyToggle && elements.surveyDropdown) {
    elements.surveyToggle.addEventListener("click", () => {
      toggleDropdown(!elements.surveyDropdown.classList.contains("is-open"));
    });
    elements.surveyToggle.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const willOpen = !elements.surveyDropdown.classList.contains("is-open");
        toggleDropdown(willOpen);
        if (willOpen) {
          const first = elements.surveyPanel.querySelector("input[type=checkbox]");
          if (first) first.focus();
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        toggleDropdown(false);
      }
    });
    elements.surveyPanel.addEventListener("keydown", (event) => {
      const checkboxes = Array.from(elements.surveyPanel.querySelectorAll("input[type=checkbox]"));
      const currentIndex = checkboxes.indexOf(document.activeElement);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = currentIndex < checkboxes.length - 1 ? currentIndex + 1 : 0;
        checkboxes[next].focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : checkboxes.length - 1;
        checkboxes[prev].focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        toggleDropdown(false);
        elements.surveyToggle.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!elements.surveyDropdown.contains(event.target)) {
        toggleDropdown(false);
      }
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const toasts = elements.toastStack.querySelectorAll(".toast.is-visible");
      if (toasts.length > 0) {
        const lastToast = toasts[toasts.length - 1];
        lastToast.classList.remove("is-visible");
        setTimeout(() => lastToast.remove(), 200);
      }
    }
  });
  if (elements.themeSelect) {
    elements.themeSelect.value = state.activeTheme;
    elements.themeSelect.addEventListener("change", (event) => {
      applyTheme(event.target.value);
      const theme = COLOR_THEMES[event.target.value] || COLOR_THEMES.default;
      logStatus(`Color theme set to ${theme.label}.`);
    });
  }
  if (elements.persistToggle) {
    elements.persistToggle.addEventListener("change", (event) => {
      const enabled = Boolean(event.target.checked);
      setPersistenceEnabled(enabled);
      if (!enabled) {
        localStorage.removeItem(STORAGE_KEY);
        logStatus("Selected options are cleared.");
      } else {
        persistSettings();
        logStatus("Selected options remembered.");
      }
    });
  }

  // Cross-match toggle
  if (elements.crossMatchToggle) {
    elements.crossMatchToggle.addEventListener("change", handleCrossMatchToggle);
  }

  // View toggle buttons (Aladin vs Equirectangular)
  if (elements.viewBtns.length > 0) {
    elements.viewBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        if (view && view !== state.activeView) {
          setActiveView(view);
        }
      });
    });
    updateViewButtons();
  }

  // Equirectangular map controls
  if (elements.showGrid) {
    elements.showGrid.addEventListener("change", (e) => {
      if (state.eqMap.gridGroup) {
        state.eqMap.gridGroup.style("display", e.target.checked ? "block" : "none");
      }
    });
  }
  if (elements.showGalactic) {
    elements.showGalactic.addEventListener("change", (e) => {
      if (state.eqMap.overlayGroup) {
        state.eqMap.overlayGroup.selectAll(".eq-galactic-plane, .galactic-marker")
          .style("display", e.target.checked ? "block" : "none");
      }
    });
  }
  if (elements.showEcliptic) {
    elements.showEcliptic.addEventListener("change", (e) => {
      if (state.eqMap.overlayGroup) {
        state.eqMap.overlayGroup.selectAll(".eq-ecliptic-plane, .ecliptic-marker")
          .style("display", e.target.checked ? "block" : "none");
      }
    });
  }

  // Initialize equirectangular map
  initEquirectangularMap();

  // Apply restored view and load surveys
  if (state.activeView !== "aladin") {
    setActiveView(state.activeView);
  } else if (state.selected.size > 0) {
    scheduleRefreshMOCLayers();
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

function toggleDropdown(open) {
  elements.surveyDropdown.classList.toggle("is-open", open);
  elements.surveyToggle.setAttribute("aria-expanded", String(open));
}

function renderSurveyList() {
  elements.surveyList.innerHTML = "";

  SURVEYS.forEach((survey) => {
    const item = document.createElement("div");
    item.className = "survey-item";
    item.draggable = true;
    item.dataset.surveyId = survey.id;
    item.addEventListener("dragstart", (event) => {
      state.dragSurveyId = survey.id;
      item.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", survey.id);
    });
    item.addEventListener("dragend", () => {
      state.dragSurveyId = null;
      item.classList.remove("dragging");
      clearDropTargets();
    });
    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      item.classList.add("drop-target");
    });
    item.addEventListener("dragleave", () => {
      item.classList.remove("drop-target");
    });
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      const sourceId = event.dataTransfer.getData("text/plain") || state.dragSurveyId;
      const targetId = survey.id;
      item.classList.remove("drop-target");
      if (sourceId && targetId && sourceId !== targetId) {
        reorderSurveys(sourceId, targetId);
      }
    });

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = survey.id;
    checkbox.id = `checkbox-${survey.id}`;
    checkbox.setAttribute("aria-label", survey.label);
    checkbox.checked = state.selected.has(survey.id);
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

    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.textContent = "⋮⋮";
    handle.title = "Drag to reorder";
    handle.setAttribute("aria-label", survey.label + " – drag to reorder");
    handle.setAttribute("tabindex", "0");
    handle.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const currentIndex = SURVEYS.findIndex((s) => s.id === survey.id);
        const targetIndex = event.key === "ArrowUp" ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex >= 0 && targetIndex < SURVEYS.length) {
          reorderSurveys(survey.id, SURVEYS[targetIndex].id);
          const newHandle = elements.surveyList.querySelector(`[data-survey-id="${survey.id}"] .drag-handle`);
          if (newHandle) newHandle.focus();
        }
      }
    });

    item.appendChild(label);
    item.appendChild(badge);
    item.appendChild(handle);
    elements.surveyList.appendChild(item);
  });

  updateSurveyToggleLabel();
}

function renderLegend() {
  if (!elements.legendList) {
    return;
  }
  elements.legendList.innerHTML = "";
  const selectedSurveys = SURVEYS.filter((survey) => state.selected.has(survey.id));
  selectedSurveys.forEach((survey) => {
    const item = document.createElement("div");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.backgroundColor = survey.color;

    const label = document.createElement("span");
    label.textContent = survey.label;

    item.appendChild(swatch);
    item.appendChild(label);
    elements.legendList.appendChild(item);
  });
}

function applyTheme(themeId) {
  const theme = COLOR_THEMES[themeId] || COLOR_THEMES.default;
  state.activeTheme = themeId in COLOR_THEMES ? themeId : "default";

  SURVEYS = SURVEY_CONFIGS.map((survey) => ({
    ...survey,
    color: theme.colors[survey.id] || "#7de7c6",
  }));

  renderSurveyList();
  renderLegend();

  // Refresh the active view
  if (state.activeView === "aladin") {
    scheduleRefreshMOCLayers();
  } else if (state.eqMap.initialized) {
    refreshEqMapSurveys();
  }

  persistSettings();
}

function setProjection(projectionId) {
  if (!state.aladin) {
    console.warn("Aladin not ready for projection change");
    return;
  }

  const validProjections = ["SIN", "AIT", "MOL", "TAN", "MER", "STG"];
  if (!validProjections.includes(projectionId)) {
    console.warn(`Invalid projection: ${projectionId}`);
    return;
  }

  try {
    state.aladin.setProjection(projectionId);
    state.activeProjection = projectionId;
    updateProjectionButtons();
    persistSettings();

    const projectionNames = {
      SIN: "Globe (orthographic)",
      AIT: "Aitoff (all-sky)",
      MOL: "Mollweide (equal-area)",
      TAN: "Gnomonic (tangent)",
      MER: "Mercator",
      STG: "Stereographic",
    };
    logStatus(`Projection set to ${projectionNames[projectionId] || projectionId}.`);
    console.log(`Projection changed to: ${projectionId}`);
  } catch (error) {
    console.error("Failed to set projection:", error);
    showToast("Failed to change projection", "error", "projection", 2000);
  }
}

function updateProjectionButtons() {
  elements.projectionBtns.forEach((btn) => {
    const isActive = btn.dataset.projection === state.activeProjection;
    btn.classList.toggle("is-active", isActive);
  });
}

function updateSurveyToggleLabel() {
  if (!elements.surveyToggle) {
    return;
  }
  const selectedCount = state.selected.size;
  if (selectedCount === 0) {
    elements.surveyToggle.textContent = "Select Survey(s)";
    return;
  }
  if (selectedCount === 1) {
    const surveyId = Array.from(state.selected)[0];
    const survey = SURVEYS.find((item) => item.id === surveyId);
    elements.surveyToggle.textContent = survey ? survey.label : "1 survey selected";
    return;
  }
  elements.surveyToggle.textContent = `${selectedCount} surveys selected`;
}

function reorderSurveys(sourceId, targetId) {
  const sourceIndex = SURVEYS.findIndex((survey) => survey.id === sourceId);
  const targetIndex = SURVEYS.findIndex((survey) => survey.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) {
    return;
  }
  const updated = [...SURVEYS];
  const [moved] = updated.splice(sourceIndex, 1);
  updated.splice(targetIndex, 0, moved);
  SURVEYS = updated;

  renderSurveyList();
  renderLegend();
  scheduleRefreshMOCLayers();
  if (state.activeView === "equirectangular" && state.eqMap.initialized) {
    refreshEqMapSurveys({ notify: false });
  }
  persistSettings();
}

function clearDropTargets() {
  const targets = elements.surveyList.querySelectorAll(".drop-target");
  targets.forEach((target) => target.classList.remove("drop-target"));
}

function handleSurveyToggle(survey, isChecked) {
  // Clean up stale intersection state (will be recomputed if still needed)
  if (state.crossMatchOnly) {
    cleanupCrossMatchState();
  }

  logStatus(
    `${survey.label} ${isChecked ? "selected" : "deselected"}.`
  );

  if (isChecked) {
    const item = elements.surveyList.querySelector(`[data-survey-id="${survey.id}"]`);
    if (item) item.classList.add("is-loading");
    showToast(`Loading ${survey.label}…`, "loading", survey.id);
    state.selected.add(survey.id);
    elements.coverageLog.textContent = `Loaded ${survey.label} coverage.`;

    // Update Aladin view
    if (state.activeView === "aladin") {
      if (state.selected.size === 1) {
        addSurveyLayer(survey);
      } else {
        scheduleRefreshMOCLayers();
      }
    }

    // Update Equirectangular view
    if (state.activeView === "equirectangular" && state.eqMap.initialized) {
      refreshEqMapSurveys({ notify: true, focusId: survey.id });
    }
  } else {
    // Remove survey from selection
    state.selected.delete(survey.id);
    elements.coverageLog.textContent = `Removed ${survey.label} coverage.`;

    // Update Aladin view
    if (state.activeView === "aladin") {
      const removed = removeSurveyLayer(survey.id);
      if (!removed) {
        scheduleRefreshMOCLayers();
      }
    }

    // Update Equirectangular view
    if (state.eqMap.initialized) {
      removeSurveyFromEqMap(survey.id);
    }

    showToast(`Removed ${survey.label}`, "success", survey.id, 1200);
  }

  updateStats();
  renderLegend();
  updateSurveyToggleLabel();
  persistSettings();

  if (state.crossMatchOnly) {
    if (state.selected.size >= 2) {
      // Re-compute intersection for the new survey set
      enterCrossMatchMode();
    } else {
      // Dropped below 2 surveys — restore normal view
      if (state.activeView === "aladin") {
        scheduleRefreshMOCLayers();
      }
      if (state.activeView === "equirectangular" && state.eqMap.initialized) {
        restoreEqMapNormalView();
      }
    }
  }
}

function addSurveyLayer(survey) {
  if (!state.aladin) {
    return;
  }
  try {
    const A = window.A;
    if (!A || !A.MOCFromURL) {
      throw new Error("MOCFromURL is unavailable.");
    }
    const mocLayer = A.MOCFromURL(survey.mocUrl, {
      color: survey.color,
      opacity: survey.opacity,
      lineWidth: 2,
      adaptativeDisplay: false,
    });
    state.aladin.addMOC(mocLayer);
    state.layers.set(survey.id, mocLayer);
    console.log(`Added MOC for ${survey.id}`);
    showToast(`Loaded ${survey.label}`, "success", survey.id, 1400);
    const loadedItem = elements.surveyList.querySelector(`[data-survey-id="${survey.id}"]`);
    if (loadedItem) loadedItem.classList.remove("is-loading");
  } catch (error) {
    console.error("Failed to add MOC layer:", error);
    scheduleRefreshMOCLayers();
    showToast(`Failed to load ${survey.label}`, "error", survey.id, 2000);
    const failedItem = elements.surveyList.querySelector(`[data-survey-id="${survey.id}"]`);
    if (failedItem) failedItem.classList.remove("is-loading");
  }
}

function addAnchorLayer() {
  if (!state.aladin) {
    return;
  }
  if (state.anchorLayer) {
    return;
  }
  try {
    const A = window.A;
    if (!A || !A.MOCFromURL) {
      throw new Error("MOCFromURL is unavailable.");
    }
    const anchor = A.MOCFromURL(ANCHOR_MOC_URL, {
      color: "#000000",
      opacity: 0,
      lineWidth: 0,
      adaptativeDisplay: false,
    });
    state.aladin.addMOC(anchor);
    state.anchorLayer = anchor;
    console.log("Anchor MOC added");
  } catch (error) {
    console.error("Failed to add anchor MOC:", error);
  }
}

function removeSurveyLayer(surveyId) {
  if (!state.aladin) {
    return false;
  }
  const layer = state.layers.get(surveyId);
  if (!layer) {
    return true;
  }
  try {
    if (typeof layer.setOpacity === "function") {
      layer.setOpacity(0);
    }
    if (typeof state.aladin.removeLayer === "function") {
      state.aladin.removeLayer(layer);
    } else if (typeof state.aladin.removeLayers === "function") {
      return false;
    }
    state.layers.delete(surveyId);
    console.log(`Removed MOC for ${surveyId}`);
    forceAladinRedraw();
    return true;
  } catch (error) {
    console.error("Failed to remove MOC layer:", error);
    return false;
  }
}

function beginMapUpdate() {
  state.isUpdatingCount += 1;
  if (elements.mapPanel) {
    elements.mapPanel.classList.add("is-updating");
  }
  if (elements.mapOverlay) {
    elements.mapOverlay.setAttribute("aria-hidden", "false");
  }
}

function endMapUpdate() {
  state.isUpdatingCount = Math.max(0, state.isUpdatingCount - 1);
  if (state.isUpdatingCount === 0) {
    if (elements.mapPanel) {
      elements.mapPanel.classList.remove("is-updating");
    }
    if (elements.mapOverlay) {
      elements.mapOverlay.setAttribute("aria-hidden", "true");
    }
  }
}

function scheduleRefreshMOCLayers() {
  beginMapUpdate();
  if (state.refreshTimer) {
    clearTimeout(state.refreshTimer);
  }
  state.refreshTimer = setTimeout(() => {
    refreshMOCLayers();
    state.refreshTimer = null;
    setTimeout(endMapUpdate, 180);
  }, 140);
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

    // Remove existing survey layers only
    const existingLayers = Array.from(state.layers.values());
    if (typeof state.aladin.removeLayer === "function") {
      existingLayers.forEach((layer) => state.aladin.removeLayer(layer));
    } else if (typeof state.aladin.removeLayers === "function") {
      state.aladin.removeLayers();
    }
    state.layers.clear();
    addAnchorLayer();

    console.log(`Refreshing MOCs. Selected surveys: ${Array.from(state.selected).join(', ')}`);

    // Re-add MOCs so the top list item is drawn last (on top)
    [...SURVEYS].reverse().forEach((survey) => {
      if (!state.selected.has(survey.id)) {
        return;
      }
      showToast(`Loading ${survey.label}…`, "loading", survey.id);
      const crossMatchActive = state.crossMatchOnly && state.selected.size >= 2;
      const layerColor = crossMatchActive ? "#888888" : survey.color;
      const layerOpacity = crossMatchActive ? 0.3 : survey.opacity;
      const mocLayer = A.MOCFromURL(survey.mocUrl, {
        color: layerColor,
        opacity: layerOpacity,
        lineWidth: 2,
        adaptativeDisplay: false,
      });

      state.aladin.addMOC(mocLayer);
      state.layers.set(survey.id, mocLayer);
      console.log(`Re-added MOC for ${survey.id}`);
      showToast(`Loaded ${survey.label}`, "success", survey.id, 1200);
      const loadedItem = elements.surveyList.querySelector(`[data-survey-id="${survey.id}"]`);
      if (loadedItem) loadedItem.classList.remove("is-loading");
    });

    // Add intersection overlay if cross-match is active
    const crossMatchActive = state.crossMatchOnly && state.selected.size >= 2;
    if (crossMatchActive && state.intersectionBlobUrl) {
      const intersectionLayer = A.MOCFromURL(state.intersectionBlobUrl, {
        color: "#ffffff",
        opacity: 0.6,
        lineWidth: 2,
        adaptativeDisplay: false,
      });
      state.aladin.addMOC(intersectionLayer);
      state.layers.set("__intersection__", intersectionLayer);
    }

    forceAladinRedraw();
  } catch (error) {
    console.error("Failed to refresh MOC layers:", error);
    elements.coverageLog.textContent = "Failed to refresh MOC layers. Check console.";
    showToast("Failed to refresh MOC layers", "error", "refresh", 2000);
    elements.surveyList.querySelectorAll(".survey-item.is-loading").forEach(
      (el) => el.classList.remove("is-loading")
    );
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
    elements.intersectionArea.textContent = "computing...";
    const token = ++state.singleAreaToken;
    updateSingleSurveyArea(survey, token);
    elements.downloadButton.disabled = true;
    return;
  }

  // For 2+ surveys, compute client-side intersections if wasm is available.
  elements.intersectionArea.textContent = "computing...";
  updateIntersectionArea();
}

async function ensureMocWasm() {
  if (state.mocWasm) {
    return state.mocWasm;
  }
  if (!window.mocReady) {
    if (!state.mocWasmFailed) {
      state.mocWasmFailed = true;
      showToast("MOC engine unavailable. Intersection calculations cannot be performed.", "error", "wasm-init", 0);
    }
    throw new Error("MOC wasm not initialized.");
  }
  try {
    const moc = await window.mocReady;
    state.mocWasm = moc;
    return moc;
  } catch (error) {
    if (!state.mocWasmFailed) {
      state.mocWasmFailed = true;
      showToast("MOC engine failed to load. Intersection calculations are unavailable.", "error", "wasm-init", 0);
    }
    throw error;
  }
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
      elements.intersectionArea.textContent = "unavailable";
      return;
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), 15000);
    });

    const computePromise = (async () => {
      const mocs = [];
      for (const survey of surveys) {
        mocs.push(await loadSurveyMoc(survey));
      }
      let intersection = mocs[0];
      for (let index = 1; index < mocs.length; index += 1) {
        intersection = intersection.and(mocs[index]);
      }
      return intersection.coveragePercentage();
    })();

    const coveragePercent = await Promise.race([computePromise, timeoutPromise]);
    const areaSqDeg = (coveragePercent / 100) * FULL_SKY_AREA_SQ_DEG;

    if (token !== state.intersectionToken) {
      return;
    }

    elements.intersectionArea.textContent = areaSqDeg.toFixed(2);
    console.log(`Intersection area set to: ${areaSqDeg.toFixed(2)}`);
  } catch (error) {
    console.error("Failed to compute intersection area:", error);
    if (token !== state.intersectionToken) {
      return;
    }
    elements.intersectionArea.textContent = "unavailable";
    if (error.message === "timeout") {
      showToast("Intersection calculation timed out. Check your network connection.", "error", "intersection-timeout", 4000);
    } else {
      showToast("Intersection calculation failed.", "error", "intersection-error", 3000);
    }
  }
}

async function updateSingleSurveyArea(survey, token) {
  if (!survey) {
    if (token === state.singleAreaToken) {
      elements.intersectionArea.textContent = "--";
    }
    return;
  }

  if (state.areaCache.has(survey.id)) {
    const cachedArea = state.areaCache.get(survey.id);
    if (token === state.singleAreaToken) {
      elements.intersectionArea.textContent = cachedArea.toFixed(2);
      console.log(`Area set to (cached): ${cachedArea.toFixed(2)}`);
    }
    return;
  }

  try {
    const mocInstance = await loadSurveyMoc(survey);
    const coveragePercent = mocInstance.coveragePercentage();
    const areaSqDeg = (coveragePercent / 100) * FULL_SKY_AREA_SQ_DEG;
    state.areaCache.set(survey.id, areaSqDeg);
    if (token !== state.singleAreaToken) {
      return;
    }
    elements.intersectionArea.textContent = areaSqDeg.toFixed(2);
    console.log(`Area set to: ${areaSqDeg.toFixed(2)}`);
  } catch (error) {
    console.error("Failed to compute survey area:", error);
    if (token !== state.singleAreaToken) {
      return;
    }
    elements.intersectionArea.textContent = "unavailable";
    showToast("Survey area calculation failed.", "error", `area-${survey.id}`, 3000);
  }
}

async function handleCrossMatchToggle(event) {
  state.crossMatchOnly = event.target.checked;

  if (state.crossMatchOnly) {
    if (state.selected.size >= 2) {
      await enterCrossMatchMode();
    }
  } else {
    exitCrossMatchMode();
  }
}

async function enterCrossMatchMode() {
  // Cancel any pending debounced refresh to avoid race conditions
  clearTimeout(state.refreshTimer);
  beginMapUpdate();
  logStatus("Computing cross-match…");

  try {
    // 1. Compute intersection MOC using WASM
    const selectedSurveys = Array.from(state.selected)
      .map((id) => SURVEYS.find((s) => s.id === id))
      .filter(Boolean);

    if (selectedSurveys.length < 2) return;

    const mocs = await Promise.all(selectedSurveys.map((s) => loadSurveyMoc(s)));

    let intersection = mocs[0];
    for (let i = 1; i < mocs.length; i++) {
      intersection = intersection.and(mocs[i]);
    }

    // 2. Check if intersection is non-empty and create Blob URL
    const coverage = intersection.coveragePercentage();
    if (state.intersectionBlobUrl) {
      URL.revokeObjectURL(state.intersectionBlobUrl);
      state.intersectionBlobUrl = null;
    }

    if (coverage > 0) {
      try {
        const fitsData = intersection.toFits(true);
        state.intersectionBlobUrl = URL.createObjectURL(
          new Blob([fitsData], { type: "application/fits" })
        );
      } catch (fitsError) {
        console.warn("Could not export intersection MOC to FITS:", fitsError);
      }
    }

    // 3. Apply cross-match visuals to current view (grey out surveys regardless)
    if (state.activeView === "aladin") {
      applyCrossMatchAladin();
    }
    if (state.activeView === "equirectangular" && state.eqMap.initialized) {
      await applyCrossMatchEquirectangular();
    }

    if (coverage > 0) {
      logStatus("Showing cross-match.");
      showToast("Cross-match mode enabled", "success", "crossmatch", 1400);
    } else {
      logStatus("No overlapping area found.");
      showToast("No overlapping area between selected surveys", "success", "crossmatch", 2000);
    }
  } catch (error) {
    console.error("Failed to compute cross-match intersection:", error);
    state.crossMatchOnly = false;
    if (elements.crossMatchToggle) elements.crossMatchToggle.checked = false;
    showToast("Cross-match calculation failed", "error", "crossmatch", 3000);
    logStatus("Cross-match calculation failed.");
  } finally {
    endMapUpdate();
  }
}

function applyCrossMatchAladin() {
  // Rebuild survey layers with greyed-out colors + intersection overlay
  // (refreshMOCLayers handles both when crossMatchActive and intersectionBlobUrl exist)
  refreshMOCLayers();
}

async function applyCrossMatchEquirectangular() {
  if (!state.eqMap.initialized) return;

  const { surveyGroup, svg, xScale, yScale, innerWidth, innerHeight } = state.eqMap;

  // 1. Grey out existing survey polygons
  surveyGroup.selectAll(".eq-survey-polygon")
    .attr("fill", "#888888")
    .attr("fill-opacity", 0.1)
    .attr("stroke", "none");

  // 2. Build clip paths from each selected survey's GeoJSON
  let defs = svg.select("defs");
  if (defs.empty()) defs = svg.insert("defs", ":first-child");

  // Remove old cross-match clips
  defs.selectAll(".crossmatch-clip").remove();
  surveyGroup.selectAll(".crossmatch-highlight").remove();

  const selectedSurveys = [...SURVEYS].filter((s) => state.selected.has(s.id));

  for (const survey of selectedSurveys) {
    let geoData = state.eqMap.geojsonCache.get(survey.id);
    if (!geoData) {
      geoData = await loadSurveyGeoJSON(survey);
      if (!geoData) continue;
    }
    if (!geoData) continue;

    const clipPath = defs.append("clipPath")
      .attr("id", `clip-crossmatch-${survey.id}`)
      .attr("class", "crossmatch-clip");

    const feature = geoData.features[0];
    const polygons = feature.geometry.coordinates;
    const allPathData = [];

    polygons.forEach((polygon) => {
      const ring = polygon[0];
      const segments = splitRingAtSeamForClip(ring);
      segments.forEach((segment) => {
        const pathData = buildPathDataForClip(segment, xScale, yScale);
        if (pathData) allPathData.push(pathData);
      });
    });

    if (allPathData.length > 0) {
      clipPath.append("path").attr("d", allPathData.join(" "));
    }
  }

  // 3. Draw intersection highlight with nested clip paths
  let group = surveyGroup.append("g").attr("class", "crossmatch-highlight");
  for (const survey of selectedSurveys) {
    const clipId = `clip-crossmatch-${survey.id}`;
    if (defs.select(`#${clipId}`).empty()) continue;
    group = group.append("g")
      .attr("clip-path", `url(#${clipId})`);
  }
  group.append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "#ffffff")
    .attr("fill-opacity", 0.5);
}

// Helper: split ring at RA=0/360 seam (extracted from drawSurveyOnEqMap pattern)
function splitRingAtSeamForClip(ring) {
  if (!ring || ring.length < 3) return [];

  const closed = ring.slice();
  const first = closed[0];
  const last = closed[closed.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    closed.push([first[0], first[1]]);
  }

  const segments = [];
  let current = [];
  const pushPoint = (pt) => {
    const prev = current[current.length - 1];
    if (!prev || prev[0] !== pt[0] || prev[1] !== pt[1]) {
      current.push(pt);
    }
  };

  pushPoint(closed[0]);

  for (let i = 1; i < closed.length; i++) {
    const prev = closed[i - 1];
    const curr = closed[i];
    const raDiff = curr[0] - prev[0];

    if (Math.abs(raDiff) > 180) {
      let adjustedCurr = curr[0];
      let boundaryRa = 0;
      let restartRa = 360;

      if (prev[0] > curr[0]) {
        adjustedCurr = curr[0] + 360;
        boundaryRa = 360;
        restartRa = 0;
      } else {
        adjustedCurr = curr[0] - 360;
        boundaryRa = 0;
        restartRa = 360;
      }

      const t = (boundaryRa - prev[0]) / (adjustedCurr - prev[0]);
      const boundaryDec = prev[1] + t * (curr[1] - prev[1]);

      pushPoint([boundaryRa, boundaryDec]);
      if (current.length >= 3) {
        segments.push(current);
      }
      current = [];
      pushPoint([restartRa, boundaryDec]);
    }

    pushPoint(curr);
  }

  if (current.length >= 3) {
    segments.push(current);
  }

  return segments;
}

// Helper: build SVG path data from segment coordinates
function buildPathDataForClip(segment, xScale, yScale) {
  if (!segment || segment.length < 3) return "";
  const first = segment[0];
  const last = segment[segment.length - 1];
  const points = (first[0] === last[0] && first[1] === last[1])
    ? segment.slice(0, -1)
    : segment;

  const pathParts = points.map((coord, idx) => {
    const x = xScale(coord[0]);
    const y = yScale(coord[1]);
    return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
  });

  return `${pathParts.join(" ")} Z`;
}

function exitCrossMatchMode() {
  // Clean up state
  cleanupCrossMatchState();

  // Restore normal visuals
  if (state.activeView === "aladin") {
    refreshMOCLayers();
  }
  if (state.activeView === "equirectangular" && state.eqMap.initialized) {
    restoreEqMapNormalView();
  }

  logStatus("Restored normal view.");
  showToast("Cross-match mode disabled", "success", "crossmatch", 1400);
}

function cleanupCrossMatchState() {
  if (state.intersectionBlobUrl) {
    URL.revokeObjectURL(state.intersectionBlobUrl);
    state.intersectionBlobUrl = null;
  }
}

function restoreEqMapNormalView() {
  if (!state.eqMap.initialized) return;
  const { surveyGroup, svg } = state.eqMap;

  // Remove cross-match highlight and clip paths
  surveyGroup.selectAll(".crossmatch-highlight").remove();
  const defs = svg.select("defs");
  if (!defs.empty()) {
    defs.selectAll(".crossmatch-clip").remove();
  }

  // Re-draw surveys with original colors
  refreshEqMapSurveys();
}

function resetSelections() {
  console.log("Reset button clicked");

  // Reset cross-match mode
  if (state.crossMatchOnly) {
    state.crossMatchOnly = false;
    if (elements.crossMatchToggle) elements.crossMatchToggle.checked = false;
    cleanupCrossMatchState();
  }

  // Uncheck all checkboxes
  const checkboxes = elements.surveyList.querySelectorAll("input[type=checkbox]");
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  state.intersectionToken += 1;

  // Clear selections first
  state.selected.clear();

  beginMapUpdate();
  if (state.aladin) {
    const layers = Array.from(state.layers.values());
    layers.forEach((layer) => {
      if (typeof layer.setOpacity === "function") {
        layer.setOpacity(0);
      }
    });
    if (typeof state.aladin.removeLayer === "function") {
      layers.forEach((layer) => state.aladin.removeLayer(layer));
    } else if (typeof state.aladin.removeLayers === "function") {
      state.aladin.removeLayers();
    }
    addAnchorLayer();
    forceAladinRedraw();
  }

  // Clear equirectangular map surveys
  if (state.eqMap.initialized) {
    clearEqMapSurveys();
  }

  // Clear layer state
  state.layers.clear();
  endMapUpdate();

  updateStats();
  renderLegend();
  updateSurveyToggleLabel();
  elements.coverageLog.textContent = "Selections cleared.";
  logStatus("All selections cleared.");
  persistSettings();
  showToast("Cleared all surveys", "success", "reset", 1400);
}

function showToast(message, type, id, duration = 2000) {
  if (!elements.toastStack) {
    return;
  }
  const toastId = `${id || "toast"}-${Date.now()}`;
  const toast = document.createElement("div");
  toast.className = "toast";
  if (type === "error") {
    toast.classList.add("is-error");
  }
  toast.textContent = message;
  toast.dataset.toastId = toastId;

  elements.toastStack.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  if (duration > 0) {
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => {
        toast.remove();
      }, 200);
    }, duration);
  }
}

function persistSettings() {
  if (!isPersistenceEnabled()) {
    return;
  }
  try {
    const payload = {
      theme: state.activeTheme,
      projection: state.activeProjection,
      view: state.activeView,
      selected: Array.from(state.selected),
      order: SURVEYS.map((survey) => survey.id),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Failed to persist settings:", error);
  }
}

function restoreSettings() {
  if (!isPersistenceEnabled()) {
    return;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const data = JSON.parse(raw);

    if (data.theme && COLOR_THEMES[data.theme]) {
      state.activeTheme = data.theme;
    }
    if (data.projection) {
      const validProjections = ["SIN", "AIT", "MOL", "TAN", "MER", "STG"];
      if (validProjections.includes(data.projection)) {
        state.activeProjection = data.projection;
      }
    }
    if (data.view && (data.view === "aladin" || data.view === "equirectangular")) {
      state.activeView = data.view;
    }
    if (Array.isArray(data.order)) {
      const ordered = [];
      data.order.forEach((id) => {
        const survey = SURVEY_CONFIGS.find((item) => item.id === id);
        if (survey) {
          ordered.push(survey);
        }
      });
      SURVEY_CONFIGS.forEach((survey) => {
        if (!ordered.find((item) => item.id === survey.id)) {
          ordered.push(survey);
        }
      });
      SURVEYS = ordered.map((survey) => ({
        ...survey,
        color: COLOR_THEMES[state.activeTheme]?.colors[survey.id] || "#7de7c6",
      }));
    }
    if (Array.isArray(data.selected)) {
      state.selected = new Set(data.selected);
    }
  } catch (error) {
    console.warn("Failed to restore settings:", error);
  }
}

function setPersistenceEnabled(enabled) {
  try {
    localStorage.setItem(PERSIST_KEY, enabled ? "1" : "0");
    if (elements.persistToggle) {
      elements.persistToggle.checked = enabled;
    }
  } catch (error) {
    console.warn("Failed to store persistence toggle:", error);
  }
}

function restorePersistenceToggle() {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    const enabled = raw === "1";
    if (elements.persistToggle) {
      elements.persistToggle.checked = enabled;
    }
    return enabled;
  } catch (error) {
    console.warn("Failed to restore persistence toggle:", error);
  }
  return false;
}

function isPersistenceEnabled() {
  return elements.persistToggle ? elements.persistToggle.checked : false;
}

function forceAladinRedraw() {
  if (!state.aladin) {
    return;
  }
  try {
    if (typeof state.aladin.refresh === "function") {
      state.aladin.refresh();
    }
    if (typeof state.aladin.repaint === "function") {
      state.aladin.repaint();
    }
    if (state.aladin.view && typeof state.aladin.view.requestRedraw === "function") {
      state.aladin.view.requestRedraw();
    }
  } catch (error) {
    console.warn("Aladin redraw helpers failed:", error);
  }

  const container = document.getElementById("aladin-lite-div");
  if (!container) {
    return;
  }
  const canvas = container.querySelector("canvas");
  const target = canvas || container;

  const previousOpacity = target.style.opacity;
  target.style.opacity = "0.999";
  requestAnimationFrame(() => {
    target.style.opacity = previousOpacity || "1";
  });

  window.dispatchEvent(new Event("resize"));
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

// ============================================================================
// Equirectangular Map Functions
// ============================================================================

function initEquirectangularMap() {
  if (!elements.skyMapSvg || typeof d3 === "undefined") {
    console.warn("D3.js or SVG element not available for equirectangular map");
    return;
  }

  const container = elements.equirectDiv;
  if (!container) return;

  // Get container dimensions
  const rect = container.getBoundingClientRect();
  const width = rect.width || 1200;
  const height = rect.height || 600;

  const margin = { top: 40, right: 50, bottom: 50, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create scales
  state.eqMap.xScale = d3.scaleLinear().domain([0, 360]).range([0, innerWidth]);
  state.eqMap.yScale = d3.scaleLinear().domain([-90, 90]).range([innerHeight, 0]);

  // Setup SVG
  const svg = d3.select(elements.skyMapSvg)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Clear any existing content
  svg.selectAll("*").remove();

  // Background
  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#0b0f1f");

  // Main group with margins
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Map area background
  g.append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "#111730");

  // Groups for layering (order matters for z-index)
  state.eqMap.gridGroup = g.append("g").attr("class", "eq-grid-group");
  state.eqMap.surveyGroup = g.append("g").attr("class", "eq-survey-group");
  state.eqMap.overlayGroup = g.append("g").attr("class", "eq-overlay-group");
  state.eqMap.labelGroup = g.append("g").attr("class", "eq-label-group");

  state.eqMap.svg = svg;
  state.eqMap.innerWidth = innerWidth;
  state.eqMap.innerHeight = innerHeight;
  state.eqMap.initialized = true;

  // Draw static elements
  drawEqGrid();
  drawEqGalacticPlane();
  drawEqEclipticPlane();

  console.log("Equirectangular map initialized");
}

function drawEqGrid() {
  const { gridGroup, xScale, yScale, innerWidth, innerHeight } = state.eqMap;
  if (!gridGroup) return;

  gridGroup.selectAll("*").remove();

  // RA lines (every 30 degrees = 2 hours)
  for (let ra = 0; ra <= 360; ra += 30) {
    gridGroup.append("line")
      .attr("class", "eq-grid-line")
      .attr("x1", xScale(ra))
      .attr("y1", 0)
      .attr("x2", xScale(ra))
      .attr("y2", innerHeight);
  }

  // Dec lines (every 30 degrees)
  for (let dec = -90; dec <= 90; dec += 30) {
    gridGroup.append("line")
      .attr("class", "eq-grid-line")
      .attr("x1", 0)
      .attr("y1", yScale(dec))
      .attr("x2", innerWidth)
      .attr("y2", yScale(dec));
  }

  // RA labels (top - hours, bottom - degrees)
  for (let ra = 0; ra <= 360; ra += 30) {
    const hours = ra / 15;
    gridGroup.append("text")
      .attr("class", "eq-grid-label")
      .attr("x", xScale(ra))
      .attr("y", -8)
      .attr("text-anchor", "middle")
      .text(`${hours}h`);
    gridGroup.append("text")
      .attr("class", "eq-grid-label")
      .attr("x", xScale(ra))
      .attr("y", innerHeight + 16)
      .attr("text-anchor", "middle")
      .text(`${ra}°`);
  }

  // Dec labels (left side)
  for (let dec = -90; dec <= 90; dec += 30) {
    gridGroup.append("text")
      .attr("class", "eq-grid-label")
      .attr("x", -8)
      .attr("y", yScale(dec))
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .text(`${dec > 0 ? "+" : ""}${dec}°`);
  }

  // Axis labels
  state.eqMap.labelGroup.append("text")
    .attr("class", "eq-axis-label")
    .attr("x", innerWidth / 2)
    .attr("y", -25)
    .attr("text-anchor", "middle")
    .text("Right Ascension (hours)");

  state.eqMap.labelGroup.append("text")
    .attr("class", "eq-axis-label")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 35)
    .attr("text-anchor", "middle")
    .text("Right Ascension (degrees)");

  state.eqMap.labelGroup.append("text")
    .attr("class", "eq-axis-label")
    .attr("x", -innerHeight / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Declination");
}

function calculateGalacticPlane() {
  const points = [];
  const alphaGP = 192.85948 * Math.PI / 180;
  const deltaGP = 27.12825 * Math.PI / 180;
  const l0 = 122.932 * Math.PI / 180;

  for (let l = 0; l <= 360; l += 1) {
    const lRad = l * Math.PI / 180;
    const b = 0;
    const bRad = b * Math.PI / 180;

    const sinDec = Math.sin(bRad) * Math.sin(deltaGP) +
                   Math.cos(bRad) * Math.cos(deltaGP) * Math.sin(lRad - l0);
    const dec = Math.asin(sinDec) * 180 / Math.PI;

    const y = Math.cos(bRad) * Math.cos(lRad - l0);
    const x = Math.sin(bRad) * Math.cos(deltaGP) -
              Math.cos(bRad) * Math.sin(deltaGP) * Math.sin(lRad - l0);
    let ra = Math.atan2(y, x) * 180 / Math.PI + alphaGP * 180 / Math.PI;
    ra = ((ra % 360) + 360) % 360;

    points.push([ra, dec]);
  }
  points.sort((a, b) => a[0] - b[0]);
  return points;
}

function calculateEclipticPlane() {
  const points = [];
  const obliquity = 23.439281 * Math.PI / 180;

  for (let eclLon = 0; eclLon <= 360; eclLon += 1) {
    const lambda = eclLon * Math.PI / 180;
    const sinDec = Math.sin(lambda) * Math.sin(obliquity);
    const dec = Math.asin(sinDec) * 180 / Math.PI;
    const y = Math.sin(lambda) * Math.cos(obliquity);
    const x = Math.cos(lambda);
    let ra = Math.atan2(y, x) * 180 / Math.PI;
    ra = ((ra % 360) + 360) % 360;
    points.push([ra, dec]);
  }
  points.sort((a, b) => a[0] - b[0]);
  return points;
}

function drawEqGalacticPlane() {
  const { overlayGroup, xScale, yScale } = state.eqMap;
  if (!overlayGroup) return;

  overlayGroup.selectAll(".eq-galactic-plane, .galactic-marker").remove();

  const points = calculateGalacticPlane();
  const segments = [];
  let currentSegment = [points[0]];

  for (let i = 1; i < points.length; i++) {
    if (Math.abs(points[i][0] - points[i - 1][0]) > 90) {
      segments.push(currentSegment);
      currentSegment = [];
    }
    currentSegment.push(points[i]);
  }
  segments.push(currentSegment);

  const line = d3.line()
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

  segments.forEach(segment => {
    if (segment.length > 1) {
      overlayGroup.append("path")
        .attr("class", "eq-galactic-plane")
        .attr("d", line(segment));
    }
  });

  // North Galactic Pole marker
  overlayGroup.append("circle")
    .attr("class", "galactic-marker")
    .attr("cx", xScale(192.86))
    .attr("cy", yScale(27.13))
    .attr("r", 4)
    .attr("fill", "#00bcd4");

  overlayGroup.append("text")
    .attr("class", "eq-pole-label galactic-marker")
    .attr("x", xScale(192.86) + 8)
    .attr("y", yScale(27.13) + 4)
    .text("NGP");
}

function drawEqEclipticPlane() {
  const { overlayGroup, xScale, yScale } = state.eqMap;
  if (!overlayGroup) return;

  overlayGroup.selectAll(".eq-ecliptic-plane, .ecliptic-marker").remove();

  const points = calculateEclipticPlane();
  const segments = [];
  let currentSegment = [points[0]];

  for (let i = 1; i < points.length; i++) {
    if (Math.abs(points[i][0] - points[i - 1][0]) > 90) {
      segments.push(currentSegment);
      currentSegment = [];
    }
    currentSegment.push(points[i]);
  }
  segments.push(currentSegment);

  const line = d3.line()
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

  segments.forEach(segment => {
    if (segment.length > 1) {
      overlayGroup.append("path")
        .attr("class", "eq-ecliptic-plane")
        .attr("d", line(segment));
    }
  });

  // North Ecliptic Pole marker
  overlayGroup.append("circle")
    .attr("class", "ecliptic-marker")
    .attr("cx", xScale(270))
    .attr("cy", yScale(66.56))
    .attr("r", 4)
    .attr("fill", "#ffc107");

  overlayGroup.append("text")
    .attr("class", "eq-pole-label ecliptic-marker")
    .attr("x", xScale(270) + 8)
    .attr("y", yScale(66.56) + 4)
    .text("NEP");
}

async function loadSurveyGeoJSON(survey) {
  if (state.eqMap.geojsonCache.has(survey.id)) {
    return state.eqMap.geojsonCache.get(survey.id);
  }

  try {
    const response = await fetch(BASE_GEOJSON_URL + survey.geojsonFile);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const geojson = await response.json();
    state.eqMap.geojsonCache.set(survey.id, geojson);
    return geojson;
  } catch (error) {
    console.error(`Failed to load GeoJSON for ${survey.label}:`, error);
    return null;
  }
}

function drawSurveyOnEqMap(survey, geojson) {
  const { surveyGroup, xScale, yScale } = state.eqMap;
  if (!surveyGroup || !geojson) return;

  const feature = geojson.features[0];
  const polygons = feature.geometry.coordinates;

  const splitRingAtSeam = (ring) => {
    if (!ring || ring.length < 3) return [];

    const closed = ring.slice();
    const first = closed[0];
    const last = closed[closed.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      closed.push([first[0], first[1]]);
    }

    const segments = [];
    let current = [];
    const pushPoint = (pt) => {
      const prev = current[current.length - 1];
      if (!prev || prev[0] !== pt[0] || prev[1] !== pt[1]) {
        current.push(pt);
      }
    };

    pushPoint(closed[0]);

    for (let i = 1; i < closed.length; i++) {
      const prev = closed[i - 1];
      const curr = closed[i];
      const raDiff = curr[0] - prev[0];

      if (Math.abs(raDiff) > 180) {
        let adjustedCurr = curr[0];
        let boundaryRa = 0;
        let restartRa = 360;

        if (prev[0] > curr[0]) {
          adjustedCurr = curr[0] + 360;
          boundaryRa = 360;
          restartRa = 0;
        } else {
          adjustedCurr = curr[0] - 360;
          boundaryRa = 0;
          restartRa = 360;
        }

        const t = (boundaryRa - prev[0]) / (adjustedCurr - prev[0]);
        const boundaryDec = prev[1] + t * (curr[1] - prev[1]);

        pushPoint([boundaryRa, boundaryDec]);
        if (current.length >= 3) {
          segments.push(current);
        }
        current = [];
        pushPoint([restartRa, boundaryDec]);
      }

      pushPoint(curr);
    }

    if (current.length >= 3) {
      segments.push(current);
    }

    return segments;
  };

  const buildPathData = (segment) => {
    if (!segment || segment.length < 3) return "";
    const first = segment[0];
    const last = segment[segment.length - 1];
    const points = (first[0] === last[0] && first[1] === last[1])
      ? segment.slice(0, -1)
      : segment;

    const pathParts = points.map((coord, idx) => {
      const x = xScale(coord[0]);
      const y = yScale(coord[1]);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    });

    return `${pathParts.join(" ")} Z`;
  };

  polygons.forEach((polygon) => {
    const ring = polygon[0];
    const segments = splitRingAtSeam(ring);

    segments.forEach((segment) => {
      const pathData = buildPathData(segment);
      if (!pathData) return;

      surveyGroup.append("path")
        .attr("class", `eq-survey-polygon survey-${survey.id}`)
        .attr("d", pathData)
        .attr("fill", survey.color)
        .attr("fill-opacity", 0.4)
        .attr("stroke", "none");
    });
  });
}

function removeSurveyFromEqMap(surveyId) {
  const { surveyGroup } = state.eqMap;
  if (!surveyGroup) return;
  surveyGroup.selectAll(`.survey-${surveyId}`).remove();
}

function clearEqMapSurveys() {
  const { surveyGroup } = state.eqMap;
  if (!surveyGroup) return;
  surveyGroup.selectAll(".eq-survey-polygon").remove();
}

async function refreshEqMapSurveys(options = {}) {
  if (!state.eqMap.initialized) return;

  const { notify = false, focusId = null } = options;
  clearEqMapSurveys();

  // Draw surveys in reverse order (first in list = on top)
  const selectedSurveys = [...SURVEYS].reverse().filter(s => state.selected.has(s.id));

  for (const survey of selectedSurveys) {
    const shouldNotify = notify && (!focusId || focusId === survey.id);
    const surveyItem = elements.surveyList.querySelector(`[data-survey-id="${survey.id}"]`);
    if (shouldNotify && surveyItem) {
      surveyItem.classList.add("is-loading");
      showToast(`Loading ${survey.label}…`, "loading", survey.id);
    }
    const geojson = await loadSurveyGeoJSON(survey);
    if (geojson) {
      drawSurveyOnEqMap(survey, geojson);
      if (shouldNotify && surveyItem) {
        surveyItem.classList.remove("is-loading");
        showToast(`Loaded ${survey.label}`, "success", survey.id, 1200);
      }
    } else if (shouldNotify) {
      if (surveyItem) surveyItem.classList.remove("is-loading");
      showToast(`Failed to load ${survey.label}`, "error", survey.id, 2000);
    }
  }

  // Re-apply cross-match visuals after all surveys are drawn
  if (state.crossMatchOnly && state.selected.size >= 2) {
    await applyCrossMatchEquirectangular();
  }
}

function setActiveView(view) {
  if (view !== "aladin" && view !== "equirectangular") return;

  state.activeView = view;
  updateViewButtons();

  if (view === "aladin") {
    elements.aladinDiv.style.display = "block";
    elements.equirectDiv.style.display = "none";
    elements.equirectControls.style.display = "none";
    elements.mapTitle.textContent = "Aladin Lite V2";
    // Refresh MOC layers to sync with current selection
    if (state.selected.size > 0) {
      if (state.crossMatchOnly && state.selected.size >= 2 && state.intersectionBlobUrl) {
        // In cross-match mode, use applyCrossMatchAladin which calls refreshMOCLayers internally
        applyCrossMatchAladin();
      } else {
        scheduleRefreshMOCLayers();
      }
    } else {
      forceAladinRedraw();
    }
  } else {
    elements.aladinDiv.style.display = "none";
    elements.equirectDiv.style.display = "block";
    elements.equirectControls.style.display = "flex";
    elements.mapTitle.textContent = "Equirectangular Map";

    // Reinitialize if needed (e.g., after resize)
    if (!state.eqMap.initialized) {
      initEquirectangularMap();
    }
    refreshEqMapSurveys();
  }

  persistSettings();
  logStatus(`Switched to ${view === "aladin" ? "Aladin Lite" : "Equirectangular"} view.`);
}

function updateViewButtons() {
  elements.viewBtns.forEach((btn) => {
    const isActive = btn.dataset.view === state.activeView;
    btn.classList.toggle("is-active", isActive);
  });
}
