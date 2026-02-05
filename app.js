// Version 1.15.0 - Improved D3 projections with approximate survey regions
const VERSION = "1.15.0";
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
    mocUrl: `${BASE_MOC_URL}euclid_dr1_coverage_moc.geojson`,
    mocFitsUrl: `${BASE_MOC_URL}euclid_dr1_coverage_moc.fits`,
    opacity: 0.45,
    // Pre-calculated area in square degrees (calculated using mocpy)
    areaSqDeg: 2108.51,  // Sky fraction: 0.051112
  },
  {
    id: "erass1",
    label: "eRASS1",
    description: "eROSITA All-Sky Survey footprint",
    mocUrl: `${BASE_MOC_URL}erass1_clusters_coverage_moc.geojson`,
    mocFitsUrl: `${BASE_MOC_URL}erass1_clusters_coverage_moc.fits`,
    opacity: 0.45,
    // Pre-calculated area in square degrees (calculated using mocpy)
    areaSqDeg: 21524.45,  // Sky fraction: 0.521767
  },
  {
    id: "des",
    label: "DES",
    description: "Dark Energy Survey footprint",
    mocUrl: `${BASE_MOC_URL}des_footprint_moc.geojson`,
    mocFitsUrl: `${BASE_MOC_URL}des_footprint_moc.fits`,
    opacity: 0.45,
    // Pre-calculated area in square degrees (calculated using mocpy)
    areaSqDeg: 5155.03,  // Sky fraction: 0.124962
  },
  {
    id: "desi_legacy",
    label: "DESI Legacy DR9",
    description: "DESI Legacy Imaging Survey footprint",
    mocUrl: `${BASE_MOC_URL}desi_legacy_dr9_footprint_moc.geojson`,
    mocFitsUrl: `${BASE_MOC_URL}desi_legacy_dr9_footprint_moc.fits`,
    opacity: 0.45,
    // Pre-calculated area in square degrees (calculated using mocpy)
    areaSqDeg: 20813.05,  // Sky fraction: 0.504523
  },
  {
    id: "hsc",
    label: "HSC",
    description: "Subaru Hyper Suprime-Cam survey footprint",
    mocUrl: `${BASE_MOC_URL}hsc_footprint_moc.geojson`,
    mocFitsUrl: `${BASE_MOC_URL}hsc_footprint_moc.fits`,
    opacity: 0.45,
    // Pre-calculated area in square degrees (calculated using mocpy)
    areaSqDeg: 1653.38,  // Sky fraction: 0.040079
  },
  {
    id: "kids",
    label: "KiDS",
    description: "Kilo-Degree Survey (KiDS-450) footprint",
    mocUrl: `${BASE_MOC_URL}kids_footprint_moc.geojson`,
    mocFitsUrl: `${BASE_MOC_URL}kids_footprint_moc.fits`,
    opacity: 0.45,
    // Pre-calculated area in square degrees (calculated using mocpy)
    areaSqDeg: 362.68,  // Sky fraction: 0.008792
  },
  {
    id: "lsst_wfd",
    label: "LSST WFD",
    description: "LSST Wide-Fast-Deep footprint",
    mocUrl: `${BASE_MOC_URL}lsst_wfd_footprint_moc.geojson`,
    mocFitsUrl: `${BASE_MOC_URL}lsst_wfd_footprint_moc.fits`,
    opacity: 0.45,
    // Pre-calculated area in square degrees (calculated using mocpy)
    areaSqDeg: 17659.58,  // Sky fraction: 0.428080
  },
];

const COLOR_THEMES = {
  default: {
    label: "Vivid",
    colors: {
      euclid: "#7de7c6",
      erass1: "#ff6b6b",
      des: "#f7931a",
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
  mocGeoJsonCache: new Map(),
  intersectionToken: 0,
  refreshTimer: null,
  isUpdatingCount: 0,
  activeTheme: "colorblind",
  activeProjection: "SIN",
  celestialInitialized: false,
  celestialSvg: null,
  celestialProjection: null,
  celestialPath: null,
  dragSurveyId: null,
  mocWasmFailed: false,
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
  mapOverlay: document.getElementById("map-overlay"),
  themeSelect: document.getElementById("theme-select"),
  legendList: document.getElementById("legend-list"),
  surveyDropdown: document.getElementById("survey-dropdown"),
  surveyToggle: document.getElementById("survey-toggle"),
  surveyPanel: document.getElementById("survey-panel"),
  persistToggle: document.getElementById("persist-toggle"),
  toastStack: document.getElementById("toast-stack"),
  projectionBtns: document.querySelectorAll(".projection-btn"),
  aladinContainer: document.getElementById("aladin-lite-div"),
  celestialContainer: document.getElementById("celestial-map"),
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
    // Aladin Lite v2 initialization with projection support
    state.aladin = window.A.aladin("#aladin-lite-div", {
      survey: "P/DSS2/color",
      fov: 180,
      target: "0 +0",
      projection: state.activeProjection,
      showReticle: true,
      showZoomControl: true,
      showFullscreenControl: true,
      showLayersControl: true,
      showGotoControl: true,
    });

    state.aladinLibrary = window.A;
    addAnchorLayer();
    console.log(`Aladin initialized with projection: ${state.activeProjection}`);
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

  // Projection toggle buttons
  if (elements.projectionBtns.length > 0) {
    elements.projectionBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const projection = btn.dataset.projection;
        if (projection && projection !== state.activeProjection) {
          setProjection(projection);
        }
      });
    });
    // Restore saved projection after Aladin is ready
    updateProjectionButtons();
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
  scheduleRefreshMOCLayers();
  persistSettings();
}

function setProjection(projectionId) {
  const validProjections = ["SIN", "AIT", "MOL"];
  if (!validProjections.includes(projectionId)) {
    console.warn(`Invalid projection: ${projectionId}`);
    return;
  }

  const projectionNames = {
    SIN: "Globe (Aladin)",
    AIT: "Aitoff (all-sky)",
    MOL: "Mollweide (equal-area)",
  };

  beginMapUpdate();

  if (projectionId === "SIN") {
    // Switch to Aladin Lite (Globe view)
    switchToAladin();
  } else {
    // Switch to d3-celestial (Aitoff or Mollweide)
    switchToCelestial(projectionId);
  }

  state.activeProjection = projectionId;
  updateProjectionButtons();
  persistSettings();
  logStatus(`Projection set to ${projectionNames[projectionId]}.`);
  console.log(`Projection changed to: ${projectionId}`);

  setTimeout(endMapUpdate, 300);
}

function switchToAladin() {
  // Show Aladin, hide Celestial
  if (elements.aladinContainer) {
    elements.aladinContainer.classList.add("is-active");
  }
  if (elements.celestialContainer) {
    elements.celestialContainer.classList.remove("is-active");
  }
  showToast("Switched to Globe view", "success", "projection", 1500);
}

function switchToCelestial(projectionId) {
  // Hide Aladin, show Celestial
  if (elements.aladinContainer) {
    elements.aladinContainer.classList.remove("is-active");
  }
  if (elements.celestialContainer) {
    elements.celestialContainer.classList.add("is-active");
  }

  // Initialize or update d3-celestial
  initCelestialMap(projectionId);
  showToast(`Switched to ${projectionId === "AIT" ? "Aitoff" : "Mollweide"} view`, "success", "projection", 1500);
}

function initCelestialMap(projectionId) {
  // Check if D3 is loaded
  if (typeof d3 === "undefined") {
    console.error("D3.js library not loaded");
    showToast("D3.js library not loaded. Please refresh the page.", "error", "celestial", 4000);
    return;
  }

  // Clear existing content
  if (elements.celestialContainer) {
    elements.celestialContainer.innerHTML = "";
  }

  // Get container dimensions
  const container = elements.celestialContainer;
  const width = container ? container.clientWidth : 800;
  const height = container ? container.clientHeight : 600;

  // Create SVG
  const svg = d3.select("#celestial-map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#0a0a1a");

  // Create projection based on type
  let projection;
  if (projectionId === "AIT") {
    projection = d3.geoAitoff()
      .scale(width / 6)
      .translate([width / 2, height / 2])
      .rotate([0, 0]);
  } else if (projectionId === "MOL") {
    projection = d3.geoMollweide()
      .scale(width / 6)
      .translate([width / 2, height / 2])
      .rotate([0, 0]);
  } else {
    projection = d3.geoAitoff()
      .scale(width / 6)
      .translate([width / 2, height / 2]);
  }

  const path = d3.geoPath().projection(projection);

  // Draw sphere outline
  svg.append("path")
    .datum({ type: "Sphere" })
    .attr("d", path)
    .attr("fill", "#0f1424")
    .attr("stroke", "#334")
    .attr("stroke-width", 1.5);

  // Draw graticule (coordinate grid)
  const graticule = d3.geoGraticule()
    .step([30, 30]);

  svg.append("path")
    .datum(graticule)
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#335")
    .attr("stroke-width", 0.5)
    .attr("stroke-opacity", 0.6);

  // Draw equator
  const equator = {
    type: "LineString",
    coordinates: d3.range(-180, 181, 5).map(lon => [lon, 0])
  };
  svg.append("path")
    .datum(equator)
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#4a90d9")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 0.7);

  // Add projection label with visual distinction
  const projName = projectionId === "AIT" ? "Aitoff" : "Mollweide";
  const projColor = projectionId === "AIT" ? "#4a9" : "#a4a";

  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .attr("fill", projColor)
    .attr("font-family", "Space Grotesk, sans-serif")
    .attr("font-size", "14px")
    .attr("font-weight", "600")
    .text(`${projName} Projection`);

  // Add distinctive border color based on projection
  svg.select("path")
    .attr("stroke", projColor)
    .attr("stroke-width", 2);

  // Add RA labels at key positions
  const raLabels = [
    { ra: 0, label: "0h" },
    { ra: 90, label: "6h" },
    { ra: 180, label: "12h" },
    { ra: -90, label: "18h" },
  ];

  raLabels.forEach(({ ra, label }) => {
    const pos = projection([ra, 0]);
    if (pos) {
      svg.append("text")
        .attr("x", pos[0])
        .attr("y", height - 15)
        .attr("text-anchor", "middle")
        .attr("fill", "#667")
        .attr("font-family", "Space Grotesk, sans-serif")
        .attr("font-size", "11px")
        .text(label);
    }
  });

  // Add Dec labels
  const decLabels = [
    { dec: 60, label: "+60°" },
    { dec: 30, label: "+30°" },
    { dec: 0, label: "0°" },
    { dec: -30, label: "-30°" },
    { dec: -60, label: "-60°" },
  ];

  decLabels.forEach(({ dec, label }) => {
    const pos = projection([0, dec]);
    if (pos) {
      svg.append("text")
        .attr("x", 15)
        .attr("y", pos[1] + 4)
        .attr("fill", "#667")
        .attr("font-family", "Space Grotesk, sans-serif")
        .attr("font-size", "10px")
        .text(label);
    }
  });

  state.celestialInitialized = true;
  state.celestialProjection = projection;
  state.celestialSvg = svg;
  state.celestialPath = path;

  console.log(`D3 sky map initialized with ${projName} projection`);

  // Add MOC overlays
  addMocOverlaysToCelestial();
}

async function addMocOverlaysToCelestial() {
  if (!state.celestialInitialized || !state.celestialSvg || state.selected.size === 0) {
    return;
  }

  try {
    const selectedSurveys = SURVEYS.filter(s => state.selected.has(s.id));

    // Create a group for MOC overlays
    let mocGroup = state.celestialSvg.select(".moc-overlays");
    if (mocGroup.empty()) {
      mocGroup = state.celestialSvg.append("g").attr("class", "moc-overlays");
    } else {
      mocGroup.selectAll("*").remove();
    }

    for (const survey of selectedSurveys) {
      await addSurveyToCelestial(survey, mocGroup);
    }

  } catch (error) {
    console.error("Failed to add MOC overlays to celestial:", error);
  }
}

async function addSurveyToCelestial(survey, mocGroup) {
  try {
    // Get or create GeoJSON for this MOC
    let geoJson = state.mocGeoJsonCache.get(survey.id);

    if (!geoJson) {
      // Load GeoJSON
      geoJson = await loadGeoJson(survey);
      if (geoJson) {
        state.mocGeoJsonCache.set(survey.id, geoJson);
      }
    }

    if (geoJson && geoJson.features && geoJson.features.length > 0) {
      // Draw each feature
      mocGroup.selectAll(`.moc-${survey.id}`)
        .data(geoJson.features)
        .enter()
        .append("path")
        .attr("class", `moc-${survey.id}`)
        .attr("d", state.celestialPath)
        .attr("fill", survey.color)
        .attr("fill-opacity", survey.opacity || 0.45)
        .attr("stroke", survey.color)
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", 0.8);

      console.log(`Added ${survey.label} to celestial map (${geoJson.features.length} features)`);
    } else {
      // Draw a placeholder marker for surveys without GeoJSON
      console.warn(`No GeoJSON data for ${survey.label}, showing placeholder`);
      addSurveyPlaceholder(survey, mocGroup);
    }
  } catch (error) {
    console.error(`Failed to add ${survey.label} to celestial:`, error);
    addSurveyPlaceholder(survey, mocGroup);
  }
}

function addSurveyPlaceholder(survey, mocGroup) {
  // Draw approximate survey footprint based on known coverage regions
  // These are simplified representations of actual survey areas

  const surveyRegions = {
    euclid: [
      // Euclid DR1 - several fields near ecliptic poles and equator
      { type: "circle", ra: 269, dec: 66, radius: 15 },  // North ecliptic
      { type: "circle", ra: 53, dec: -28, radius: 12 },  // Fornax
      { type: "circle", ra: 150, dec: 2, radius: 10 },   // COSMOS
    ],
    erass1: [
      // eROSITA All-Sky - western galactic hemisphere
      { type: "rect", ra: 0, dec: 0, width: 180, height: 180 },
    ],
    des: [
      // Dark Energy Survey - southern sky
      { type: "rect", ra: -30, dec: -55, width: 100, height: 40 },
    ],
    desi_legacy: [
      // DESI Legacy - north and south galactic caps
      { type: "rect", ra: 180, dec: 32, width: 150, height: 50 },
      { type: "rect", ra: 30, dec: -10, width: 100, height: 40 },
    ],
    hsc: [
      // Hyper Suprime-Cam - several deep fields
      { type: "circle", ra: 150, dec: 2, radius: 8 },    // COSMOS
      { type: "circle", ra: 34, dec: -5, radius: 8 },    // XMM-LSS
      { type: "circle", ra: 240, dec: 43, radius: 6 },   // HECTOMAP
    ],
    kids: [
      // KiDS - two strips
      { type: "rect", ra: 180, dec: -2, width: 70, height: 8 },
      { type: "rect", ra: -30, dec: -32, width: 60, height: 8 },
    ],
    lsst_wfd: [
      // LSST Wide-Fast-Deep - southern sky
      { type: "rect", ra: 0, dec: -50, width: 300, height: 60 },
    ],
  };

  const regions = surveyRegions[survey.id] || [];

  if (regions.length > 0 && state.celestialPath && state.celestialProjection) {
    regions.forEach((region, idx) => {
      if (region.type === "circle") {
        // Draw a circle approximation
        const circle = d3.geoCircle()
          .center([region.ra, region.dec])
          .radius(region.radius);

        mocGroup.append("path")
          .datum(circle())
          .attr("d", state.celestialPath)
          .attr("fill", survey.color)
          .attr("fill-opacity", 0.35)
          .attr("stroke", survey.color)
          .attr("stroke-width", 1)
          .attr("stroke-opacity", 0.7);
      } else if (region.type === "rect") {
        // Draw a rectangle as a polygon
        const ra = region.ra;
        const dec = region.dec;
        const w = region.width / 2;
        const h = region.height / 2;

        const polygon = {
          type: "Polygon",
          coordinates: [[
            [ra - w, dec - h],
            [ra + w, dec - h],
            [ra + w, dec + h],
            [ra - w, dec + h],
            [ra - w, dec - h],
          ]]
        };

        mocGroup.append("path")
          .datum(polygon)
          .attr("d", state.celestialPath)
          .attr("fill", survey.color)
          .attr("fill-opacity", 0.3)
          .attr("stroke", survey.color)
          .attr("stroke-width", 1)
          .attr("stroke-opacity", 0.6);
      }
    });
  }

  // Add legend entry
  const container = elements.celestialContainer;
  const width = container ? container.clientWidth : 800;
  const surveyIndex = SURVEYS.findIndex(s => s.id === survey.id);
  const yPos = 60 + surveyIndex * 22;

  // Legend background
  mocGroup.append("rect")
    .attr("x", width - 200)
    .attr("y", yPos - 12)
    .attr("width", 190)
    .attr("height", 18)
    .attr("fill", "#0a0a1a")
    .attr("fill-opacity", 0.8)
    .attr("rx", 3);

  // Legend color box
  mocGroup.append("rect")
    .attr("x", width - 195)
    .attr("y", yPos - 9)
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", survey.color)
    .attr("fill-opacity", 0.7)
    .attr("rx", 2);

  // Legend text
  mocGroup.append("text")
    .attr("x", width - 178)
    .attr("y", yPos)
    .attr("fill", "#ccc")
    .attr("font-family", "Space Grotesk, sans-serif")
    .attr("font-size", "11px")
    .text(`${survey.label} (~${(survey.areaSqDeg / 1000).toFixed(1)}k sq°)`);
}

async function loadGeoJson(survey) {
  try {
    const response = await fetch(survey.mocUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const geoJson = await response.json();
    return geoJson;
  } catch (error) {
    console.error(`Failed to load GeoJSON for ${survey.label} from ${survey.mocUrl}:`, error);
    return null;
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
    const item = elements.surveyList.querySelector(`[data-survey-id="${survey.id}"]`);
    if (item) item.classList.add("is-loading");
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

  // Also update celestial map if in celestial view
  if (state.activeProjection !== "SIN" && state.celestialInitialized) {
    initCelestialMap(state.activeProjection);
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
      const loadedItem = elements.surveyList.querySelector(`[data-survey-id="${survey.id}"]`);
      if (loadedItem) loadedItem.classList.remove("is-loading");
    });
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
    .then((moc) => moc.MOC.fromFitsUrl(survey.mocFitsUrl))
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
    const areaSqDeg = (coveragePercent / 100) * 41252.96;

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
