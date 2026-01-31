# Aladin Lite Solutions for GitHub Pages

## The Problem

Aladin Lite v3 has SES (Secure EcmaScript) lockdown issues when loaded via CDN on GitHub Pages, causing:
- `TypeError: Cannot read properties of undefined (reading 'WebClient')`
- `TypeError: Cannot read properties of undefined (reading 'setProjection')`

## ✅ Solution 1: Aladin Lite v2 (IMPLEMENTED - Recommended)

**Status:** Currently implemented in your codebase

**Pros:**
- ✅ Stable and battle-tested
- ✅ No SES lockdown issues
- ✅ Works perfectly on GitHub Pages
- ✅ Full MOC support via `A.MOCFromURL()`
- ✅ Smaller bundle size
- ✅ jQuery dependency is acceptable for static sites

**Cons:**
- ⚠️ Uses jQuery (required dependency)
- ⚠️ Older API (but still maintained)
- ⚠️ Less modern JavaScript patterns

**What's included:**
```html
<!-- jQuery (required for v2) -->
<script src="https://code.jquery.com/jquery-1.12.1.min.js"></script>
<!-- Aladin Lite v2 -->
<link rel="stylesheet" href="https://aladin.cds.unistra.fr/AladinLite/api/v2/latest/aladin.min.css" />
<script src="https://aladin.cds.unistra.fr/AladinLite/api/v2/latest/aladin.min.js"></script>
```

**API Usage:**
```javascript
// Initialize
let aladin = A.aladin('#aladin-lite-div', {
  survey: "P/DSS2/color",
  fov: 180,
  target: "0 +0"
});

// Add MOC
let moc = A.MOCFromURL('path/to/moc.fits', {
  color: '#7de7c6',
  opacity: 0.45,
  lineWidth: 2
});
aladin.addMOC(moc);
```

---

## Solution 2: Self-Hosted Aladin Lite v3

If you absolutely need v3 features, you can download and self-host the library.

**Steps:**
1. Download Aladin Lite v3 from GitHub releases
2. Place files in a `/vendor/aladin/` directory
3. Update script paths to use local files
4. This avoids CDN SES lockdown issues

**Pros:**
- ✅ Modern ES6+ API
- ✅ No jQuery dependency
- ✅ Full control over updates

**Cons:**
- ⚠️ Larger bundle size (~2-3MB)
- ⚠️ Manual updates required
- ⚠️ May still have SES issues

---

## Solution 3: Alternative Libraries

If Aladin continues to cause issues, consider these alternatives:

### Option A: Leaflet.js + HiPS Plugin
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

**Pros:**
- ✅ Very stable and widely used
- ✅ Large ecosystem of plugins
- ✅ Great mobile support

**Cons:**
- ⚠️ No native HiPS/astronomical coordinate support
- ⚠️ Would need custom MOC rendering

### Option B: CesiumJS (3D Globe)
- Overkill for 2D sky maps
- Much larger bundle size
- Better for interactive 3D visualizations

---

## Recommendation

**For your use case (GitHub Pages + MOC visualization):**

👉 **Stick with Aladin Lite v2** (currently implemented)

**Reasons:**
1. Your app specification requires MOC support - v2 handles this perfectly
2. GitHub Pages static hosting works flawlessly with v2
3. No complex build process needed
4. The jQuery dependency is negligible for your use case
5. v2 is still actively maintained by CDS

**When to consider v3:**
- If you need WebGL performance for massive catalogs (millions of points)
- If you need modern ESM module bundling with Webpack/Vite
- If you're building a Node.js application (not static site)

---

## Testing Your Implementation

After pushing changes, test:
1. ✅ Map initializes without errors
2. ✅ Euclid DR1 MOC loads and displays
3. ✅ Coverage stats calculate correctly
4. ✅ No console errors related to SES lockdown

**Test URL:** https://ruslanbrilenkov.github.io/skymap.github.io/

---

## Future: MOC Engine Integration

Your code already includes `@cds-astro/moc` for boolean operations:

```javascript
state.mocEngine = await loadMocEngine();
```

This works with both v2 and v3. When you implement intersection calculations:

```javascript
// Pseudo-code for MOC intersection
import { MOC } from '@cds-astro/moc';

let moc1 = await MOC.fromFITS('euclid.fits');
let moc2 = await MOC.fromFITS('unions.fits');
let intersection = moc1.intersection(moc2);
let areaSqDeg = intersection.skyFraction() * 41252.96;
```

This is library-agnostic - works regardless of which Aladin version you use for visualization.

---

## Quick Reference

| Feature | v2 | v3 |
|---------|----|----|
| MOC Support | ✅ | ✅ |
| GitHub Pages | ✅ | ⚠️ (CDN issues) |
| jQuery Required | ✅ | ❌ |
| Bundle Size | ~500KB | ~2MB |
| Stability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Modern API | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

