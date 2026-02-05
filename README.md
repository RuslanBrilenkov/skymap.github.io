# Sky Coverage Explorer

Interactive web app for visualizing survey sky coverage MOCs with multiple projection views.

## Features

- **Globe View** (Aladin Lite v2) - Interactive spherical sky map with full MOC overlays.
- **Aitoff Projection** (D3.js) - All-sky elliptical projection.
- **Mollweide Projection** (D3.js) - Equal-area elliptical projection.
- *D3 projections are prepared for high-fidelity GeoJSON overlays but will show approximate footprints if GeoJSON files are not provided.*
- Survey selection with intersection area calculation (using a WebAssembly MOC library).
- Color themes (Vivid, Color-blind friendly, Pastel).
- Drag-to-reorder survey layers.
- Persistent settings via localStorage.

## Surveys & Data Formats

The application uses two data formats for each survey:

- **`.fits`**: The primary MOC data used for the interactive Aladin Lite globe view and for all backend MOC operations (e.g., intersection calculations) via the WASM library.
- **`.geojson`**: Expected by the D3.js flat projections (Aitoff, Mollweide) for rendering high-fidelity survey boundaries. If a `.geojson` file is not present for a selected survey, the D3 map will fall back to displaying a simplified, approximate footprint.

| Survey | Area (sq deg) | FITS File (for Aladin/WASM) | GeoJSON File (for D3) |
|--------|---------------|-----------------------------|-----------------------|
| Euclid DR1 | 2,109 | `euclid_dr1_coverage_moc.fits` | `euclid_dr1_coverage_moc.geojson` |
| eRASS1 | 21,524 | `erass1_clusters_coverage_moc.fits` | `erass1_clusters_coverage_moc.geojson` |
| DES | 5,155 | `des_footprint_moc.fits` | `des_footprint_moc.geojson` |
| DESI Legacy DR9 | 20,813 | `desi_legacy_dr9_footprint_moc.fits`| `desi_legacy_dr9_footprint_moc.geojson`|
| HSC | 1,653 | `hsc_footprint_moc.fits` | `hsc_footprint_moc.geojson` |
| KiDS | 363 | `kids_footprint_moc.fits` | `kids_footprint_moc.geojson` |
| LSST WFD | 17,660 | `lsst_wfd_footprint_moc.fits` | `lsst_wfd_footprint_moc.geojson` |

All data files are located in the `surveys/` directory.

## Architecture

- **Globe view**: Aladin Lite v2 (CDN) with jQuery dependency, rendering MOCs directly from `.fits` files.
- **Flat projections**: D3.js v7 + d3-geo-projection v4. Renders survey boundaries from `.geojson` files if available, otherwise falls back to pre-defined approximate shapes.
- **MOC operations**: A vendored WebAssembly library (`cds-moc-rust` v0.9.1) performs all MOC calculations (e.g., intersections) by fetching and processing the `.fits` files.

## Local Development

```bash
python3 -m http.server 8003
# Open http://localhost:8003/
```

Note: Opening `index.html` directly via `file://` won't work due to ES module imports and WASM requirements.

## Deployment

Hosted on GitHub Pages. Push to `main` to deploy.

## Related Repository

Survey footprint generation (MOC to GeoJSON creation):
`/Users/ruslanbrilenkov/Desktop/Ruslan/Programming/sky_map_visualizer`
