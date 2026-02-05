# Changelog

## 2026-02-04 - GeoJSON Rendering Preparation (v1.16.0)

### New Features

#### GeoJSON-Ready D3 Projections
- Updated the application to load and render high-fidelity survey boundaries from `.geojson` files in the D3.js Aitoff and Mollweide projections.
- The app now gracefully falls back to displaying pre-defined approximate footprints if the corresponding `.geojson` files are not found.

### Technical Implementation
- **Dual Data Format**:
  - `SURVEY_CONFIGS` in `app.js` now includes two properties for MOC data:
    - `mocUrl`: Points to `.geojson` files, intended for D3 rendering.
    - `mocFitsUrl`: Points to `.fits` files, used by the WASM MOC library for intersection calculations and Aladin Lite rendering.
- **Refactored Data Loading**:
  - Replaced the `loadMocAsGeoJson` function with a new `loadGeoJson` function that directly fetches and parses GeoJSON files using the `fetch` API.
  - The `loadSurveyMoc` function was updated to use the new `mocFitsUrl` property, ensuring intersection calculations remain functional.
- **Cleanup**: Removed the non-functional `convert_surveys_to_geojson.py` script and its associated `.json` output files.

### Known Limitations
- **GeoJSON files must be manually generated**: The application is now *prepared* to render GeoJSON, but it does not generate these files itself. They must be created in the `sky_map_visualizer` repository and manually copied to the `surveys/` directory.

---

## 2026-02-04 - Dual Map System with D3.js Projections (v1.15.0)

### New Features

#### Multiple Projection Views
Implemented a dual-library approach for different sky projections:
- **Globe (SIN)** - Aladin Lite v2 orthographic spherical view (interactive)
- **Aitoff (AIT)** - D3.js all-sky elliptical projection
- **Mollweide (MOL)** - D3.js equal-area elliptical projection

### Technical Implementation
- **Aladin Lite v2** handles the Globe view (interactive, MOC overlays)
- **D3.js + d3-geo-projection** handles Aitoff/Mollweide views
- Two separate map containers (`#aladin-lite-div`, `#celestial-map`) that switch visibility
- Projection toggle buttons in top bar with visual distinction (different accent colors)
- Coordinate grid (graticule) with RA/Dec labels on flat projections
- Approximate survey footprint visualization using hardcoded regions

### Libraries
- D3.js v7 (d3js.org CDN)
- d3-geo-projection v4 (d3js.org CDN)

### Known Limitations
- **MOC to GeoJSON conversion not available** - The WASM library uses HEALPix format internally
- Flat projections show approximate survey regions, not exact MOC boundaries
- Future: Generate GeoJSON files from MOC in `sky_map_visualizer` repository

### Survey Approximations (for flat projections)
Hardcoded approximate regions based on known survey footprints:
- Euclid: 3 circular fields (ecliptic pole, Fornax, COSMOS)
- eRASS1: Western galactic hemisphere rectangle
- DES: Southern sky rectangle
- DESI Legacy: North and south galactic cap rectangles
- HSC: 3 deep field circles
- KiDS: Two horizontal strips
- LSST WFD: Large southern sky rectangle

---

## 2026-01-31 - Area Display & Interactive Controls

### New Features

#### 1. Survey Area Display
- **Single Survey**: When one survey is selected, displays its total coverage in square degrees
  - Euclid DR1: 2,108.51 sq deg (5.11% of the sky)
- **Multiple Surveys**: Shows "pending" for intersection calculation (to be implemented)
- Uses pre-calculated areas from MOC files for instant display

#### 2. Fixed Reset Button
- ✅ Unchecks all survey checkboxes
- ✅ Removes all MOC overlays from the map visualization
- ✅ Clears internal state (layers and selections)
- ✅ Resets area display to "--"
- ✅ Updates coverage log with "Selections cleared"

#### 3. Fixed Uncheck Behavior
- ✅ Unchecking a survey checkbox now properly removes its MOC overlay from the map
- ✅ Updates the area display dynamically
- ✅ Cleans up internal state

### Technical Implementation

#### Simplified Architecture
- Removed complex external MOC library dependency that was causing 404 errors
- Uses pre-calculated areas stored in the SURVEYS configuration
- Areas calculated offline using `mocpy` Python library
- Immediate display without network requests or WASM loading

#### Area Calculation Method
Pre-calculated using mocpy:
```python
from mocpy import MOC
moc = MOC.from_fits('euclid_dr1_coverage_moc.fits')
area = moc.sky_fraction * 41252.96  # Full sky in sq deg
```

#### Fixed Map Clearing
- Convert Map entries to array before iteration to avoid modification issues
- Explicit error handling for MOC removal operations
- Console logging for debugging

### Code Changes

**app.js**:
- Removed broken `loadMocEngine()` function and @cds-astro/moc dependency
- Added `areaSqDeg` property to SURVEYS configuration
- Simplified `updateStats()` to use pre-calculated areas
- Fixed `resetSelections()` to properly clear map visualization
- Fixed `handleSurveyToggle()` to remove MOC overlays when unchecking
- Added `checkbox.id` for better debugging
- Enhanced logging with console.log output

### Usage

1. **View Single Survey Area**:
   - Check "Euclid DR1" checkbox
   - Area displays immediately: "2108.51" sq deg
   - MOC overlay appears on map

2. **Remove Survey**:
   - Uncheck the checkbox
   - MOC overlay disappears from map
   - Area returns to "--"

3. **Reset All Selections**:
   - Click "Reset" button
   - All checkboxes uncheck
   - All overlays removed from map
   - Area shows "--"

### Testing

Test locally:
```bash
cd /Users/ruslanbrilenkov/Desktop/Ruslan/Programming/skymap.github.io
python3 -m http.server 8000
# Open http://localhost:8000/
```

**Test Checklist**:
- ✅ Check Euclid DR1 - overlay appears, area shows 2108.51
- ✅ Uncheck Euclid DR1 - overlay disappears, area shows "--"
- ✅ Check again - overlay reappears, area shows 2108.51
- ✅ Click Reset - everything clears
- ✅ No console errors (404 removed)

### Fixed Issues

1. **404 Error**: Removed dependency on non-existent `@cds-astro/moc` npm package
2. **Reset Button**: Now properly removes MOC layers from map
3. **Uncheck Behavior**: Now properly removes MOC overlays

### Future Enhancements

- Implement dynamic MOC intersection calculation for 2+ surveys
- Integrate WebAssembly MOC library from cds-moc-rust
- Add "Download Intersection MOC" functionality
- Show individual areas in survey list badges
- Add union area calculation

---

## TODO / Planned Features

### 1. Projection Toggle ✓ (Partial)
Add a toggle button to switch between the Aladin globe map view and the "unfolded" projection views.
- [x] Research Aladin Lite v2 projection options (v2 doesn't support projection changes)
- [x] Add toggle button to UI (Globe, Aitoff, Mollweide)
- [x] Implement dual-library approach (Aladin v2 for globe, D3.js for flat)
- [x] Globe view uses Aladin Lite v2 with full MOC support
- [x] Aitoff/Mollweide views use D3.js + d3-geo-projection
- [x] Add coordinate grid and labels to flat projections
- [x] Add approximate survey footprint visualizations
- [x] **NEXT:** Generate GeoJSON files from MOC in `sky_map_visualizer` repo
- [x] Load GeoJSON files for accurate survey boundaries in D3 views (scaffolded)
- [ ] Test all surveys in all projections with real data

### 2. Custom Survey Tiles from CSV
Allow users to upload a CSV file with survey tile definitions and overlay them as a custom survey.

**Input CSV format:**
| tile_id | ra (center) | dec (center) | size (degrees) |
|---------|-------------|--------------|----------------|
| tile_1  | 150.0       | 2.5          | 1.0            |

- [ ] Add CSV file upload UI component
- [ ] Parse CSV and validate columns (RA, DEC, size)
- [ ] Generate tile polygons from center + size
- [ ] Overlay tiles on Aladin globe map
- [ ] Overlay tiles on gnomonic projection
- [ ] Allow user to name their custom survey
- [ ] Add custom survey to legend with user-chosen color
- [ ] Include custom survey in intersection calculations

### 3. Source Coverage Lookup (CSV Export)
When a user provides a list of sources (positions), return a CSV indicating which surveys cover each source.

**Input CSV format:**
| source_id | ra    | dec   |
|-----------|-------|-------|
| ABC       | 123.0 | 45.6  |

**Output CSV format:**
| source_id | ra    | dec   | euclid_dr1 | des | desi_legacy | ... |
|-----------|-------|-------|------------|-----|-------------|-----|
| ABC       | 123.0 | 45.6  | yes        | yes | no          | ... |

- [ ] Add source CSV upload UI
- [ ] Parse source positions from CSV
- [ ] Check each position against selected survey MOCs
- [ ] Use WASM library for point-in-MOC queries
- [ ] Generate output CSV with coverage columns (only for selected surveys)
- [ ] Provide download button for result CSV
- [ ] Show preview of results in UI before download
