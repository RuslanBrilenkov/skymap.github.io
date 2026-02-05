# Changelog

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
