# Changelog

## 2026-01-31 - Area Calculation & Reset Button Features

### New Features

#### 1. Survey Area Display
- **Single Survey**: When one survey is selected, the area is displayed in square degrees
- **Multiple Surveys**: When 2+ surveys are selected, the intersection area is displayed
- The area display updates dynamically as surveys are selected/deselected

#### 2. Reset Button Functionality
- The "Reset" button now properly clears all selected surveys
- Unchecks all checkboxes
- Removes all MOC overlays from the map
- Clears the area calculation
- Resets the coverage log

### Technical Implementation

#### MOC Engine Integration
- Integrated `@cds-astro/moc` WebAssembly library for MOC area calculations
- Loads MOC data asynchronously when surveys are selected
- Stores MOC objects separately from visualization layers for computation

#### Area Calculation
- Uses `moc.skyFraction()` method to get the fraction of the sky covered
- Converts to square degrees using the full sky area (41,252.96 sq deg)
- For intersections, uses `moc.intersection()` to compute overlapping regions

### Code Changes

**app.js**:
- Added `state.mocs` Map to store MOC objects for calculations
- Added `loadMocEngine()` function to load @cds-astro/moc library
- Added `loadMocData()` function to fetch and parse MOC FITS files
- Updated `handleSurveyToggle()` to load MOC data asynchronously
- Enhanced `updateStats()` to calculate and display areas
- Added `calculateMocArea()` helper function
- Added `calculateIntersection()` helper function for multiple MOCs
- Updated `resetSelections()` to clear MOC objects

### Usage

1. **View Single Survey Area**:
   - Check any survey checkbox
   - The "Intersection area" field will show the survey's total coverage in square degrees

2. **View Intersection Area**:
   - Check 2 or more survey checkboxes
   - The "Intersection area" field will show the overlapping coverage
   - The "Download Intersection MOC" button becomes enabled

3. **Reset All Selections**:
   - Click the "Reset" button
   - All checkboxes are unchecked
   - All overlays are removed from the map
   - Area display returns to "--"

### Testing

Test locally:
```bash
cd /path/to/skymap.github.io
python3 -m http.server 8000
# Open http://localhost:8000/
```

Test MOC library:
```bash
# Open http://localhost:8000/test_moc.html
```

### Known Limitations

- Area calculation requires internet connection to load the @cds-astro/moc library
- If MOC engine fails to load, area will show "--" but visualization still works
- Large MOC files may take a moment to load and calculate

### Future Enhancements

- Implement "Download Intersection MOC" functionality
- Add union area calculation
- Show individual survey areas in the survey list
- Cache MOC data to reduce network requests
