# Testing Guide

## Fixed Issues

### 1. MOC Removal from Map
**Problem**: Aladin Lite v2 doesn't have `removeMOC()` method
**Solution**: Use `removeLayers()` to remove all layers, then re-add selected ones

### 2. Area Display
**Problem**: Area wasn't showing for selected surveys
**Solution**: Added debug logging and proper area value handling

## How to Test

### Start Local Server
```bash
cd /path/to/skymap.github.io
python3 -m http.server 8003
```

### Open in Browser
```
http://localhost:8003/
```

### Test Sequence

#### Test 1: Check Survey
1. Click the "Euclid DR1" checkbox
2. **Expected Results**:
   - Cyan/teal MOC overlay appears on map
   - "Surveys selected" shows: `1`
   - "Intersection area" shows: `2108.51` sq deg
   - Console log shows: `updateStats called. Selected count: 1`
   - Console log shows: `Area set to: 2108.51`

#### Test 2: Uncheck Survey
1. Uncheck the "Euclid DR1" checkbox
2. **Expected Results**:
   - MOC overlay **disappears from map**
   - "Surveys selected" shows: `0`
   - "Intersection area" shows: `--`
   - Console log shows: `Removed all layers`
   - Console log shows: `Area set to '--' (no selections)`

#### Test 3: Reset Button
1. Check "Euclid DR1" again
2. Click the "Reset" button
3. **Expected Results**:
   - Checkbox becomes unchecked
   - MOC overlay **disappears from map**
   - "Surveys selected" shows: `0`
   - "Intersection area" shows: `--`
   - Coverage log shows: "Selections cleared."
   - Console log shows: `Reset button clicked`
   - Console log shows: `Removed all layers`

### Debug Console Commands

Open browser console (F12) and try:

```javascript
// Check current state
console.log('Selected:', Array.from(state.selected));
console.log('Layers:', state.layers.size);
console.log('Aladin:', state.aladin);

// Check area element
console.log('Area element:', elements.intersectionArea);
console.log('Area value:', elements.intersectionArea.textContent);

// Manually trigger update
updateStats();
```

## Expected Console Output

When checking a survey:
```
Refreshing MOCs. Selected surveys: euclid
Re-added MOC for euclid
updateStats called. Selected count: 1
Found survey: Euclid DR1
Survey area: 2108.51
Area set to: 2108.51
```

When unchecking:
```
Refreshing MOCs. Selected surveys:
Removed all layers
updateStats called. Selected count: 0
Area set to '--' (no selections)
```

## Common Issues

### Issue: Area shows "--" when survey is checked
**Diagnosis**: Check console for "Found survey: not found"
**Fix**: Verify SURVEYS array has areaSqDeg property

### Issue: MOC doesn't disappear
**Diagnosis**: Check for "removeLayers is not a function" error
**Fix**: Verify Aladin Lite v2 is loaded (`window.A` exists)

### Issue: Checkbox state doesn't match map
**Diagnosis**: Check console for "Aladin not ready"
**Fix**: Wait for page to fully load before clicking

## Browser Compatibility

Tested on:
- Chrome 120+
- Firefox 121+
- Safari 17+

Requires:
- JavaScript enabled
- Internet connection (for CDN libraries)
