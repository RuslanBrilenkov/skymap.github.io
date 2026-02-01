# Sky Coverage Explorer

Interactive web app for visualizing survey sky coverage MOCs in Aladin Lite.

## Surveys

- Euclid DR1 (`euclid_dr1_coverage_moc.fits`)
- eRASS1 (`erass1_clusters_coverage_moc.fits`)
- DES (`des_footprint_moc.fits`)
- DESI Legacy Imaging Survey DR9 (`desi_legacy_dr9_footprint_moc.fits`)
- HSC (`hsc_footprint_moc.fits`)

MOC files live in `surveys/` and are loaded by `app.js`.

## Local Run

```bash
python3 -m http.server
```

Open `http://localhost:8000/` in your browser.
