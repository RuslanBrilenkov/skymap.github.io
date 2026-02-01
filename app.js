// Version 1.9.1 - Status messages for UI changes
const VERSION = "1.9.1";
const BASE_MOC_URL =
  "https://ruslanbrilenkov.github.io/skymap.github.io/surveys/";
const ANCHOR_MOC_URL = `${BASE_MOC_URL}anchor_moc.fits`;
const STORAGE_KEY = "sky-coverage-settings-v1";
const PERSIST_KEY = "sky-coverage-persist-enabled";

const SURVEY_CONFIGS = [
  {
    id: "euclid",
    label: "Euclid DR1",
    description: "Euclid DR1 coverage map",
    mocUrl: `${BASE_MOC_URL}euclid_dr1_coverage_moc.fits`,
    opacity: 0.45,
    // Pre-calculated area in square degrees (calculated using mocpy)
    areaSqDeg: 2108.51,  // Sky fraction: 0.051112
  },
  {
    id: "erass1",
    label: "eRASS1",
    description: "eROSITA All-Sky Survey footprint",
    mocUrl: `${BASE_MOC_URL}erass1_clusters_coverage_moc.fits`,
    opacity: 0.45,
    // Pre-calculated area in square degrees (calculated using mocpy)
    areaSqDeg: 21524.45,  // Sky fraction: 0.521767
  },
];

const COLOR_THEMES = {
  default: {
    label: "Vivid",
    colors: {
      euclid: "#7de7c6",
      erass1: "#ff6b6b",
    },
  },
  colorblind: {
    label: "Color-blind friendly",
    colors: {
      euclid: "#0072B2",
      erass1: "#D55E00",
    },
  },
  pastel: {
    label: "Pastel",
    colors: {
      euclid: "#9ad9c7",
      erass1: "#f4a7b9",
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
  refreshTimer: null,
  isUpdatingCount: 0,
  activeTheme: "colorblind",
  dragSurveyId: null,
};

const elements = {
  surveyList: document.getElementById("survey-list"),
  selectedCount: document.getElementById("selected-count"),
  intersectionArea: document.getElementById("intersection-area"),
  coverageLog: document.getElementById("coverage-log"),
  mocStatus: document.getElementById("moc-status"),
  mapStatus: document.getElementById("map-status"),
  downloadButton: document.getElementById("download-button"),
  fitButton: document.getElementById("fit-button"),
  resetButton: document.getElementById("reset-button"),
  mapPanel: document.querySelector(".map-panel"),
  mapOverlay: document.getElementById("map-overlay"),
  themeSelect: document.getElementById("theme-select"),
  legendList: document.getElementById("legend-list"),
  surveyDropdown: document.getElementById("survey-dropdown"),
  surveyToggle: document.getElementById("survey-toggle"),
  surveyPanel: document.getElementById("survey-panel"),
  persistToggle: document.getElementById("persist-toggle"),
  toastStack: document.getElementById("toast-stack"),
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
    return;
  }

  elements.mapStatus.textContent = "Map ready";
  elements.coverageLog.textContent = "Select a survey to load its MOC.";
  elements.mocStatus.textContent = `MOC engine: ready (v${VERSION})`;
  logStatus("Application ready.");
  console.log(`Sky Coverage Explorer v${VERSION} initialized`);

  updateStats();
  renderLegend();
  updateSurveyToggleLabel();

  if (state.selected.size > 0) {
    scheduleRefreshMOCLayers();
  }

  elements.resetButton.addEventListener("click", resetSelections);
  elements.downloadButton.addEventListener("click", handleDownload);
  if (elements.surveyToggle && elements.surveyDropdown) {
    elements.surveyToggle.addEventListener("click", () => {
      elements.surveyDropdown.classList.toggle("is-open");
    });
    document.addEventListener("click", (event) => {
      if (!elements.surveyDropdown.contains(event.target)) {
        elements.surveyDropdown.classList.remove("is-open");
      }
    });
  }
  if (elements.fitButton) {
    elements.fitButton.addEventListener("click", handleFitToSurvey);
  }
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
  scheduleRefreshMOCLayers();
  persistSettings();
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
  persistSettings();
}

function clearDropTargets() {
  const targets = elements.surveyList.querySelectorAll(".drop-target");
  targets.forEach((target) => target.classList.remove("drop-target"));
}

function handleSurveyToggle(survey, isChecked) {
  logStatus(
    `${survey.label} ${isChecked ? "selected" : "deselected"}.`
  );

  if (isChecked) {
    showToast(`Loading ${survey.label}…`, "loading", survey.id);
    state.selected.add(survey.id);
    elements.coverageLog.textContent = `Loaded ${survey.label} coverage.`;
    if (state.selected.size === 1) {
      addSurveyLayer(survey);
    } else {
      scheduleRefreshMOCLayers();
    }
  } else {
    // Remove survey from selection
    state.selected.delete(survey.id);
    elements.coverageLog.textContent = `Removed ${survey.label} coverage.`;
    const removed = removeSurveyLayer(survey.id);
    if (!removed) {
      scheduleRefreshMOCLayers();
    }
    showToast(`Removed ${survey.label}`, "success", survey.id, 1200);
  }

  updateStats();
  renderLegend();
  updateSurveyToggleLabel();
  persistSettings();
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
  } catch (error) {
    console.error("Failed to add MOC layer:", error);
    scheduleRefreshMOCLayers();
    showToast(`Failed to load ${survey.label}`, "error", survey.id, 2000);
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
      const mocLayer = A.MOCFromURL(survey.mocUrl, {
        color: survey.color,
        opacity: survey.opacity,
        lineWidth: 2,
        adaptativeDisplay: false,
      });

      state.aladin.addMOC(mocLayer);
      state.layers.set(survey.id, mocLayer);
      console.log(`Re-added MOC for ${survey.id}`);
      showToast(`Loaded ${survey.label}`, "success", survey.id, 1200);
    });
    forceAladinRedraw();
  } catch (error) {
    console.error("Failed to refresh MOC layers:", error);
    elements.coverageLog.textContent = "Failed to refresh MOC layers. Check console.";
    showToast("Failed to refresh MOC layers", "error", "refresh", 2000);
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
    if (elements.fitButton) {
      elements.fitButton.disabled = true;
    }
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
    if (elements.fitButton) {
      elements.fitButton.disabled = false;
    }
    return;
  }

  // For 2+ surveys, compute client-side intersections if wasm is available.
  elements.intersectionArea.textContent = "computing...";
  updateIntersectionArea();
  elements.downloadButton.disabled = false;
  if (elements.fitButton) {
    elements.fitButton.disabled = true;
  }
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

  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => {
      toast.remove();
    }, 200);
  }, duration);
}

function persistSettings() {
  if (!isPersistenceEnabled()) {
    return;
  }
  try {
    const payload = {
      theme: state.activeTheme,
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

function handleFitToSurvey() {
  if (!state.aladin) {
    return;
  }
  if (state.selected.size !== 1) {
    return;
  }
  const surveyId = Array.from(state.selected)[0];
  const survey = SURVEYS.find((item) => item.id === surveyId);
  if (!survey) {
    return;
  }
  const target = `moc:${survey.mocUrl}`;
  try {
    if (typeof state.aladin.setFoV === "function") {
      state.aladin.setFoV(180);
    }
    if (typeof state.aladin.gotoObject === "function") {
      state.aladin.gotoObject(target);
    } else if (typeof state.aladin.gotoTarget === "function") {
      state.aladin.gotoTarget(target);
    }
  } catch (error) {
    console.error("Failed to fit to survey:", error);
  }
}

function logStatus(message) {
  if (!elements.coverageLog) {
    return;
  }
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
  elements.coverageLog.textContent = `[${timestamp}] ${message}`;
}
