# Changelog

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
