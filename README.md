# Sky Coverage Explorer

Interactive web app for visualizing survey sky coverage MOCs, comparing overlaps, and testing source catalogs directly in the browser.

## What You Can Do

- View survey footprints in Aladin (globe) and an equirectangular projection.
- Select, reorder, or select all surveys to control draw order and layering.
- Toggle cross-match mode to highlight the intersection region.
- Upload a source catalog (CSV/TSV with `ra`/`dec`) and plot points on both maps.
- Download an augmented catalog with boolean columns per selected survey.
- Switch between Light/Dark UI modes (map interiors remain unchanged).

## Current Surveys

- Euclid DR1
- eRASS1
- DES
- DESI Legacy Imaging Survey DR9
- HSC
- KiDS
- LSST WFD
- UNIONS

## Catalog Upload Notes

- The file must contain `ra` and `dec` columns (case-insensitive).
- RA in hours is auto-detected and converted to degrees.
- All processing happens locally in the browser.

## Local Run

```bash
python3 -m http.server
```

Open `http://localhost:8000/` in your browser.
