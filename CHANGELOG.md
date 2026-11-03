# Changelog

## 2026-11-03 - v2.9.1 Restore 2:1 equirectangular map

### Fix
- v2.9.0 made the equirectangular map look too square. `initEquirectangularMap()` sized the SVG viewBox from its container and fell back to 1200×600 when the container measured 0. Up to v2.8.0 the map was always built while hidden behind the Aladin view, so the fallback (2:1, matching 360° RA × 180° Dec) was always used. With the equirectangular view visible at startup in v2.9.0, it measured the panel instead and took the panel's aspect ratio. The size is now fixed at 1200×600, as before.

### Version
- App `VERSION` 2.9.0 → 2.9.1; `app.js` cache-bust query and infographic hero badge/footer updated.

---

## 2026-11-02 - v2.9.0 Equirectangular by default, Aladin Lite on demand

### Fix: app dead during the CDS outage
- The Aladin Lite v2 script and CSS were loaded synchronously in `<head>` from `aladin.cds.unistra.fr`. When CDS stopped responding (servers unreachable worldwide, Nov 2026), the browser stalled on that request, `app.js` (a deferred module) never ran until the request timed out, and `init()` then returned early on "Failed to load Aladin Lite". Nothing after that point was set up, including the equirectangular map, which does not need Aladin.

### Changes
- **Equirectangular is the default view** and always the start view. The saved `view` setting is still written but no longer restored, so a session that ended in Aladin reopens in the equirectangular map with its surveys, cross-match and catalog.
- **Aladin Lite is optional and loads on demand.** The `<script>` and `<link>` tags were removed from `index.html`; `loadAladinLibrary()` injects them the first time the Aladin view is opened. jQuery stays in `<head>` since Aladin v2 needs it.
- `init()` no longer waits for Aladin. Aladin setup moved to `createAladin()` (instance, anchor layer, restored projection), driven by `ensureAladin()` from `setActiveView("aladin")`. Selections, cross-match, catalog and a Find-source position made before Aladin exists are applied by the new `syncAladinView()` (the old Aladin branch of `setActiveView`) once it is created.
- **"Temporarily unavailable" notice.** While loading, the Aladin area shows "Loading Aladin Lite…". If the script fails or CDS does not answer within 15 s (`ALADIN_LOAD_TIMEOUT_MS`), it shows "Aladin Lite is temporarily unavailable" with a **Try again** button, plus an error toast. A network failure clears the loader so a retry re-requests the script; a request that only hangs stays in flight and Aladin is created if it arrives later.
- `addSurveyLayer` / `refreshMOCLayers` now clear the survey items' loading pulse when Aladin is absent (previously they could stay pulsing).

### Fix: user MOC uploaded while cross-match is on
- Uploading a MOC with "Show cross-match only" already on drew the intersection highlight but never the uploaded footprint itself on the equirectangular map (bug present since the user-MOC feature; unticking and re-ticking the MOC was the only way to show it). `handleMocUpload` now calls `renderUserMocOnEqMap()` before `enterCrossMatchMode()`, following the render-order contract (surveys → user MOC raster → cross-match overlay), so the raster appears greyed out under the highlight. Verified: same result as the untick/re-tick path; re-upload, untick/re-tick and cross-match off unchanged.
- `index.html`: view toggle order is now Equirectangular | Aladin; `styles.css` and `app.js` cache-bust queries set to `2.9.0`.

### Notes
- With Aladin back, its DSS2 background tiles still come from CDS. During an outage the Aladin view stays unavailable; all other features work in the equirectangular view.
- Tested in Chrome (Playwright) with CDS hanging, refusing, slow (8 s) and normal, and inside a sandboxed iframe like the Google Sites embed: 123/123 checks passed (surveys, cross-match, catalog, user MOC, Find source, overlay toggles, PDF export, theme, Reset, persistence, view switching, no stuck loading state).

### Documentation
- Infographic: "Default" tag moved from the Aladin card to the Equirectangular card (Aladin now "Optional"), a line about on-demand loading from CDS, Quick Start and view-toggle wording; hero badge and footer 2.8.0 → 2.9.0.

### Version
- App `VERSION` bumped 2.8.0 → 2.9.0.

---

## 2026-10-06 - v2.8.0 Find source (RA/Dec ring marker)

### New Feature
- **Find source** block in the sidebar Actions list, directly above "Upload catalog": two text boxes (RA, Dec), a **Find** button and a **Clear** button.
  - Input formats: plain degrees (`187.7059`, `-0.5`) or sexagesimal (`12:30:49.4`, `12 30 49`, `12h30m49s`, `-00:30:00`, `+12°23'28"`). Sexagesimal RA is read as hours (x15) unless marked `d`/`°`; `12.5h` is decimal hours; Dec is always degrees. Ranges validated (RA 0-360 deg / 0-24 h, Dec +-90, minutes and seconds < 60); errors show inline and an existing marker is left untouched. Enter in either box triggers Find. The parsed result is echoed under the inputs in degrees.
  - Draws one ring (fixed pixel size, so visible at any zoom) around the position in both map views. Electric blue `#0066FF` core (about 4.3:1 on black, 4.8:1 on white) between a white and a dark halo so it stays readable over any backdrop and in both UI themes.
  - Aladin view pans and zooms to the source (FoV 1 deg); this also happens when Find is pressed in the equirectangular view, so the ring is already centred when switching back. The equirectangular view shows the ring only (no zoom).
  - A new Find replaces the previous marker. **Clear** and **Reset** both remove the ring and empty the inputs. The marker is not persisted.
- **Independent by design**: new state `state.findSource`, new SVG group `eq-findsource-group` (above the catalog group, outside the survey group), and an Aladin-side SVG overlay positioned each frame with `aladin.world2pix()`. It does not touch `state.selected`, `state.userMoc`, cross-match counting, the catalog layer or any MOC WASM object.
  - The Aladin ring is deliberately DOM, not an Aladin layer: Aladin Lite v2 has no `removeLayer`, only `removeLayers()`, which wipes every catalog, overlay and MOC and is called by `refreshMOCLayers` and `resetSelections`. A layer-based marker would disappear on each survey toggle.
  - EQ ring uses SVG presentation attributes (not CSS classes), so the PDF export keeps its styling unchanged.
- Only existing-code edits: `VERSION`, a `findSourceGroup` entry in `state.eqMap` + group creation in `initEquirectangularMap`, one `initFindSource()` call in `init`, and one `clearFindSource()` call in `resetSelections`.

### Documentation
- Infographic: "Find source" row in the sidebar mock-up, a new **Find Source** feature card, Quick Start step 3 wording, a Technical Notes entry; hero badge and footer bumped 2.7.0 → 2.8.0.
- `index.html`: stale `app.js?v=2.5.0` cache-bust query updated to `2.8.0`.

### Version
- App `VERSION` bumped 2.7.0 → 2.8.0; MOC-engine status pill now reads "MOC engine: ready (v2.8.0)".

---

## 2026-05-19 - v2.7.0 SDSS-III BOSS DR12 LOWZ + CMASS footprints

### New Surveys
- Added **BOSS LOWZ** (SDSS-III BOSS DR12 LOWZ galaxy sample imaging mask, ~9,281 sq deg)
- Added **BOSS CMASS** (SDSS-III BOSS DR12 CMASS galaxy sample imaging mask, ~10,259 sq deg)
  - Inputs are healsparse N+S masks (`mask_DR12v5_{LOWZ,CMASS}_{North,South}_hsp_4096_v2.fits`, NSIDE=4096 NESTED, sentinel `-1.6375e+30`) — first surveys in the explorer sourced from the healsparse format.
  - Source MOCs built via new processors `sky_map_visualizer/dev/sky_coverage_app/surveys/boss_{lowz,cmass}.py`: footprint = union of `valid_pixels` from N and S patches, written at max order 12 with `pre_v2=True` (NUNIQ encoding for Aladin Lite v2 compatibility).
  - GeoJSON generated at order 6 via `sky_map_visualizer/dev/moc_to_geojson.py` (BOSS LOWZ: 11,650 polygons, ~2.0 MB; BOSS CMASS: 12,731 polygons, ~2.2 MB).
  - `app.js`: two new `SURVEY_CONFIGS` entries (`id: "boss_lowz"`, `id: "boss_cmass"`); EQ wavelength legend labels `BOSS LOWZ (Opt./Spec.; ugriz)` and `BOSS CMASS (Opt./Spec.; ugriz)` documented in `SURVEY_WAVELENGTH_REFERENCES.md`.
  - Colors (paired wine + rose across all three themes): default `#882255` / `#CC6677`; iridescent `#523365` / `#7E5485`; vivid `#7D3C98` / `#BB6699`.
- New dev-side dependency: `healsparse==1.12.2` (pinned in `sky_map_visualizer/requirements.txt`).
- Updated infographic: survey count 14 → 16, BOSS LOWZ + BOSS CMASS pills + swatches added (`--c-boss-lowz`, `--c-boss-cmass` CSS variables).

### Version
- App `VERSION` bumped 2.6.0 → 2.7.0; MOC-engine status pill now reads "MOC engine: ready (v2.7.0)".
- Infographic hero badge bumped 2.6.0 → 2.7.0; infographic footer survey-list extended with "BOSS LOWZ, BOSS CMASS".

---

## 2026-05-18 - v2.6.0 ALFALFA HI 21 cm footprint

### New Survey
- Added **ALFALFA** (Arecibo Legacy Fast ALFA Survey, ~7,114 sq deg)
  - First radio / HI-line survey in the explorer (all 13 prior surveys are optical/NIR/X-ray/mm-wave)
  - Source MOC: `alfalfa_moc.fits` (CDS MOC Rust lib export, MOCVERS 2.0, RANGE encoding, max order 10)
  - Re-saved with `pre_v2=True` via mocpy 0.19.1 to convert to NUNIQ encoding (Aladin Lite v2 compatibility); see `BUGFIX_MOC_FORMAT.md`
  - GeoJSON generated at order 6 (8,981 polygons, ~1.56 MB) via `sky_map_visualizer/dev/moc_to_geojson.py`
  - `app.js`: new `SURVEY_CONFIGS` entry (`id: "alfalfa"`, `label: "ALFALFA"`); EQ wavelength legend label `ALFALFA (HI)` documented in `SURVEY_WAVELENGTH_REFERENCES.md`
  - Colors: `#AA4499` (Rainbow / Paul Tol Muted rose-magenta), `#9C6B7C` (Iridescent warm plum), `#009988` (Vivid teal)
- Updated infographic: survey count 13 → 14, ALFALFA pill + swatch added (`--c-alfalfa` CSS variable)

### Citation
- Added a reference pointer to the tool and to the infographic, styled as a button:
  - Tool (`index.html`): "Reference: arxiv:2605.11099" button placed in the sidebar `.brand` block directly under the "How to use this" button (was previously in the sidebar-footer).
  - Infographic (`instructions/infographic.html`): "Reference: arxiv:2605.11099 ↗" button placed in the hero block directly under the intro paragraph, styled via a new `.ref-button` CSS class (was previously in the page footer).
  - Both buttons open https://arxiv.org/abs/2605.11099 in a new tab.

### Version + cleanup
- App `VERSION` bumped 2.5.0 → 2.6.0; MOC-engine status pill now reads "MOC engine: ready (v2.6.0)".
- Infographic hero badge bumped 2.5.0 → 2.6.0; infographic footer survey-list extended with "ALFALFA".

---

## 2026-04-21 - v2.5.0 ACT Legacy + KiDS footprint update

### New Survey
- Added **ACT Legacy** (Atacama Cosmology Telescope legacy survey mask, ~11,235 sq deg)
  - Millimeter-wave: 90/148/220 GHz (1.4–3.3 mm)
  - Converted from a WCS CAR-projection FITS mask (`ACTLegacy.fits`) to MOC at order 11
  - Re-saved with `pre_v2=True` for NUNIQ encoding (Aladin v2 compatibility)
  - Colors: `#72190E` (Rainbow), `#4F3A65` (Iridescent), `#D1005A` (Vivid)
- Updated infographic: survey count 12 → 13, ACT Legacy pill + swatches added

### KiDS Footprint Update
- Replaced KiDS-450 mask (362 sq deg) with combined KiDS-N + KiDS-S science masks (~891 sq deg)
  - Both masks are WCS CAR-projection binary FITS (`mask_KiDSN.fits`, `mask_KiDSS.fits`)
  - Converted and unioned into a single MOC at order 11 with `pre_v2=True`
  - GeoJSON regenerated at order 6 (1,443 polygons, 254 KB)
  - `app.js` description updated; infographic area corrected to ~891 sq deg

---

## 2026-03-01 - v2.4.0 Tooltip + Infographic Metadata Update

### Updates
- Added hover/focus tooltips for:
  - `Upload catalog` (`Upload CSV/TSV with "ra" and "dec" columns.`)
  - `Download catalog (augmented)` (`Download catalog with selected-survey overlap flags.`)
- Reverted equirectangular in-map legend to concise survey names only.
- Expanded the "How to use the app" infographic (`Available Surveys`) with per-survey filter/band lines and concise wavelength/energy ranges.
- Added `SURVEY_WAVELENGTH_REFERENCES.md` to track source links and verification notes for survey band/mode metadata.

---

## 2026-02-08 - Catalog Upload + Augmented Download + UI Updates

### New Features
- Catalog upload (CSV/TSV) with RA/Dec parsing, RA-hours auto-detection, and point rendering on Aladin + equirectangular maps.
- Augmented catalog download adds boolean survey ID columns (only for selected surveys).
- Select-all surveys row to toggle full selection on/off.
- Light/Dark UI mode toggle in the top-right (map interiors unchanged).

### Fixes
- Cross-match intersection now has an outline in the equirectangular view.
- Reset clears cross-match overlays and catalog points in one pass.
- Aladin catalog layer is re-applied after map refreshes and cleared reliably.

### Behavior Updates
- Download button is disabled unless a catalog is loaded and at least one survey is selected.
- Upload row limit temporarily disabled for local testing (TODO to restore).
- Aladin view persistence disabled (map resets on refresh).

---

## 2026-02-05 - Equirectangular Seam Wrap Fix

### Fixes
- Split equirectangular survey polygons at the RA=0/360 seam and insert boundary points to prevent wraparound parallel-line artifacts.
- Render each split segment as its own closed path to avoid SVG implicit seam closures.

### Code Changes
**app.js**:
- Updated `drawSurveyOnEqMap()` to split rings at the seam and render multiple segments.

**equirectangular-map.html**:
- Mirrored the seam-splitting logic for the standalone demo page.

---

## 2026-02-05 - Equirectangular Layer Ordering

### Updates
- Equirectangular map now draws survey layers according to the survey dropdown order.
- The top item in the list is painted last so it appears on top, matching Aladin stacking behavior.

### Code Changes
**app.js**:
- `refreshEqMapSurveys()` now re-renders using the list order and supports optional notifications.
- Reordering and equirectangular selections trigger a re-render to maintain stacking.

---

## 2026-02-04 - Projection Toggle (v1.11.0)

### New Features

#### Projection Toggle
Added toggle buttons in the top bar to switch between different map projections:
- **Globe (SIN)** - Orthographic spherical view (default)
- **Aitoff (AIT)** - Full-sky elliptical projection, ideal for viewing all-sky coverage
- **Mollweide (MOL)** - Equal-area elliptical projection

### Technical Implementation
- Uses Aladin Lite v2's `setProjection()` method
- Projection preference is persisted in localStorage when "Remember selections" is enabled
- Active projection button is highlighted with accent color
- Keyboard accessible with focus indicators

### Usage
Click any projection button in the top bar to switch views. The Aitoff and Mollweide projections show the entire sky "unfolded" in a single view, making it easier to see the full extent of survey coverage.

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
cd /path/to/skymap.github.io
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

### 1. Projection Toggle ✓
Add a toggle button to switch between the Aladin globe map view and the "unfolded" projection views.
- [x] Research Aladin Lite v2 projection options
- [x] Add toggle button to UI (Globe, Aitoff, Mollweide)
- [x] Implement projection switching logic
- [ ] Test all MOC overlays in all projections
- [ ] Ensure layer management works in all views

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
