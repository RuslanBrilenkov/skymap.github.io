# MOC Format Compatibility Fix

## Problem Identified

**Error:** `Uncaught TypeError: Cannot use 'in' operator to search for '6' in undefined` when loading MOC files in Aladin Lite v2.

**Root Cause:** The MOC files were being generated in **MOC 2.0 format with RANGE encoding**, but Aladin Lite v2 only supports **MOC 1.x format with NUNIQ encoding**.

## Solution Applied

### 1. Updated MOC Generation Code

Modified `dev/sky_coverage_app/surveys/euclid.py` to use the `pre_v2=True` parameter when saving MOC files:

```python
# Before (MOC 2.0 with RANGE encoding)
moc.save(str(output_path), format="fits")

# After (MOC 1.x with NUNIQ encoding)
moc.save(str(output_path), format="fits", pre_v2=True, overwrite=overwrite)
```

### 2. Fixed NumPy Compatibility

Downgraded NumPy from 2.4.1 to 1.26.4 to ensure compatibility with healpy and matplotlib:

```bash
# Updated requirements.txt
numpy<2.0.0  # Changed from numpy==2.4.1
```

### 3. Regenerated MOC File

Created a new `euclid_dr1_coverage_moc.fits` file with the correct format:

**Old format:**
- `ORDERING= 'RANGE'`
- `TTYPE1  = 'RANGE'`
- Size: 1.2M

**New format:**
- `ORDERING= 'NUNIQ'`
- `TTYPE1  = 'UNIQ'`
- Size: 1.5M

## Files Changed

### In `sky_map_visualizer/` repository:
1. `dev/sky_coverage_app/surveys/euclid.py` - Added `pre_v2=True` parameter
2. `requirements.txt` - Constrained NumPy to <2.0.0
3. `dev/output/euclid_dr1_coverage_moc.fits` - Regenerated with NUNIQ encoding

### In `skymap.github.io/` repository:
1. `surveys/euclid_dr1_coverage_moc.fits` - Replaced with NUNIQ-encoded version

## Testing

### Local Testing
```bash
# Serve the GitHub Pages site locally
cd ../skymap.github.io
python3 -m http.server 8000

# Open in browser: http://localhost:8000/
```

### What to Test
1. ✅ Page loads without console errors
2. ✅ Map initializes correctly
3. ✅ Check the "Euclid DR1" checkbox
4. ✅ MOC overlay appears on the map (cyan/teal color)
5. ✅ No "Cannot use 'in' operator" errors in console

### Deployment
After testing locally:
```bash
cd ../skymap.github.io
git add surveys/euclid_dr1_coverage_moc.fits
git commit -m "Fix MOC format for Aladin Lite v2 compatibility (NUNIQ encoding)"
git push origin main
```

Wait 1-2 minutes for GitHub Pages to rebuild, then test at:
`https://ruslanbrilenkov.github.io/skymap.github.io/`

## Future Survey Additions

When adding new surveys, ensure the MOC processor uses `pre_v2=True`:

```python
# In your survey processor's run() method:
moc.save(str(output_path), format="fits", pre_v2=True, overwrite=overwrite)
```

This ensures compatibility with Aladin Lite v2's MOC parser.

## References

- [MOCPy Documentation](https://cds-astro.github.io/mocpy/)
- [MOC 2.0 Standard](https://www.ivoa.net/documents/MOC/20220727/REC-moc-2.0-20220727.html)
- [Aladin Lite v2 API](https://aladin.cds.unistra.fr/AladinLite/v2-doc/API/)

## Technical Background

### Why the Format Matters

**MOC 1.x (NUNIQ):**
- Each pixel encoded as a single 64-bit NUNIQ value
- Format: `(order, nested_index)` packed into one number
- Compatible with Aladin Lite v2, older tools
- Less storage-efficient

**MOC 2.0 (RANGE):**
- Pixels stored as ranges of indices
- More compact representation
- Better for large sky areas
- Requires newer parsers (Aladin Lite v3+)

### Version Matrix

| Tool | MOC 1.x (NUNIQ) | MOC 2.0 (RANGE) |
|------|----------------|-----------------|
| Aladin Lite v2 | ✅ | ❌ |
| Aladin Lite v3 | ✅ | ✅ |
| MOCPy 0.19+ | ✅ (with `pre_v2=True`) | ✅ (default) |
| @cds-astro/moc (WebAssembly) | ✅ | ✅ |

Since your GitHub Pages site uses Aladin Lite v2, MOC 1.x with NUNIQ encoding is required.
