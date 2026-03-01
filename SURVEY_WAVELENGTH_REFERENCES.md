# Survey Wavelength Reference Log (EQ Legend)

Last reviewed: 2026-03-01

Purpose: track the modality/filter labels used in the equirectangular legend and keep source links for later re-checks.

## Legend Mapping

| Survey ID | Legend Label Used | Claimed Modes | Claimed Filters/Bands | Primary Sources | Notes |
|---|---|---|---|---|---|
| `kids` | `KiDS (Opt.; u/g/r/i)` | Optical | u, g, r, i | https://kids.strw.leidenuniv.nl/DR4/ ; https://www.eso.org/public/announcements/ann15028/ | KiDS main weak-lensing imaging set is ugri. |
| `euclid` | `Euclid DR1 (Opt./NIR/Spec.; VIS, Y/J/H, grism)` | Optical, NIR, Spectroscopic | VIS imager; NISP Y/J/H and slitless grisms | https://www.esa.int/Science_Exploration/Space_Science/Euclid/Euclid_s_instruments ; https://sci.esa.int/web/euclid/-/euclid-nisp-instrument | NISP has photometric and slitless spectroscopy modes. |
| `hsc` | `HSC (Opt./NIR; g/r/i/z/y)` | Optical/NIR-edge | g, r, i, z, y | https://hsc-release.mtk.nao.ac.jp/doc/index.php/survey/ ; https://hsc.mtk.nao.ac.jp/ssp/survey/ | HSC SSP broad bands are grizy. |
| `des` | `DES (Opt./NIR; g/r/i/z/Y)` | Optical/NIR-edge | g, r, i, z, Y | https://www.darkenergysurvey.org/the-des-project/instrument/ ; https://www.darkenergysurvey.org/dr1-data-release-papers/ | DES camera/filter set includes grizY. |
| `unions` | `UNIONS (UV./Opt./NIR; u/g/r/i/z)` | UV/Optical/NIR-edge | u, g, r, i, z (combined programs) | https://www.skysurvey.ca/unions/ ; https://www.cfht.hawaii.edu/Science/CFIS/ | UNIONS is a combined survey footprint from multiple facilities/bands. |
| `desi_legacy` | `DESI Legacy DR9 (Opt./IR; g/r/z, WISE IR)` | Optical + infrared | g, r, z + W1/W2 IR | https://www.legacysurvey.org/ ; https://www.desi.lbl.gov/imaging-surveys/ | Legacy Surveys combine optical imaging with WISE IR for target selection. |
| `erass1` | `eRASS1 (X-ray; 0.2-2.3 keV)` | X-ray | 0.2-2.3 keV (catalog band usage) | https://heasarc.gsfc.nasa.gov/w3browse/all/erass1main.html ; https://www.mpe.mpg.de/eROSITA | Use X-ray energy band notation, not optical filter notation. |
| `lsst_wfd` | `LSST WFD (UV./Opt./NIR; u/g/r/i/z/y)` | UV/Optical/NIR-edge | u, g, r, i, z, y | https://www.lsst.org/about/camera ; https://www6.slac.stanford.edu/lsst-camera | Rubin LSST camera uses six broad ugrizy filters. |
| `roman_hlwas` | `Roman HLWAS (NIR/Spec.; F106/F129/F158, grism)` | NIR + spectroscopic | F106, F129, F158 + grism | https://roman.gsfc.nasa.gov/science/High_Latitude_Wide_Area_Survey.html ; https://roman.gsfc.nasa.gov/science/WFI_technical.html | HLWAS Wide/Medium tiers are NIR imaging plus spectroscopic components. |
| `roman_hlwas_deep` | `Roman HLWAS Deep (Opt./NIR/Spec.; F087/F106/F129/F146/F158/F184/F213, grism)` | Optical-edge/NIR + spectroscopic | F087, F106, F129, F146, F158, F184, F213 + grism | https://roman.gsfc.nasa.gov/science/High_Latitude_Wide_Area_Survey.html ; https://roman.gsfc.nasa.gov/science/WFI_technical.html | Includes the shorter F087 band in addition to NIR filters. |

## Verification Checklist

- Re-check every external link yearly or when a survey major data release changes.
- Confirm filter naming matches official instrument docs before changing legend text.
- Keep modality abbreviations concise in UI: `Spec.`, `UV.`, `Opt.`, `NIR`, `IR`, `X-ray`.
- If any claim becomes uncertain, mark it in this file before changing app labels.
