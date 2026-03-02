# Citation Enforcement Plan (Draft)

**Status:** Draft policy. Revisit and finalize before implementation (paper/link pending).

## Purpose
Define a user-friendly but explicit citation acknowledgement flow that users must accept before downloading map PDFs or augmented catalogs.

For now, this is planning only. No production code changes for citation gating are included yet.

## Finalized Decisions (Current)
- Gate type: Blocking modal with a required checkbox acknowledgement.
- Memory scope: Remember acknowledgement per browser session (`sessionStorage`), not permanently.
- Persistent reminder placement: Sidebar footer area near copyright, ideally above or below the existing copyright lines.
- Current scope: Copyright-only is already live; citation text remains placeholder until paper details are available.

## Why This Approach
- Enforces acknowledgement at point of download.
- Lower friction than typed confirmation.
- More visible and explicit than toast-only notices.
- Session-only memory avoids stale long-term acceptance when policy text changes later.

## Integration Points (Existing Code)
- Catalog download entry: `handleDownload()` in `app.js`.
- Map PDF download entry: `handleMapDownload()` in `app.js`.
- Download button listeners currently attach directly in `init()`:
  - `download-button` -> catalog download
  - `download-map-button` -> map download

## Planned Implementation (When Activated)
1. Add a reusable citation modal to `index.html`.
2. Add modal styles in `styles.css` with dark/light support.
3. Add citation policy constants + session key in `app.js`.
4. Add helpers:
   - `hasCitationAckSession()`
   - `setCitationAckSessionAccepted()`
   - `clearCitationAckSession()`
5. Route both download button click paths through a shared gate:
   - `requestCitationAckThen("catalog", handleDownload)`
   - `requestCitationAckThen("map", handleMapDownload)`
6. Gate behavior:
   - If session already acknowledged -> proceed immediately.
   - Otherwise open modal -> require checkbox -> continue download.
   - Cancel/Escape closes modal and aborts action.

## Modal UX Specification
- Title: `Citation acknowledgement`
- Body text (temporary): `If you use this tool in research outputs, please acknowledge Sky Coverage Explorer and cite the upcoming paper once available.`
- Required checkbox:
  - `I acknowledge that research use of this tool should be cited.`
- Buttons:
  - `Cancel`
  - `Continue download` (disabled until checkbox checked)
- Accessibility:
  - `role="dialog"`, `aria-modal="true"`
  - focus trap while open
  - Escape closes modal
  - focus returns to invoking download button on close

## Sidebar Reminder Specification
Place a short policy line in sidebar footer near copyright:
- Temporary text:
  - `Research use should acknowledge Sky Coverage Explorer; citation details will be added with the upcoming paper.`

Placement preference:
- Under or above the existing copyright lines in `.sidebar-footer`.

## Future Update Path (When Paper Is Ready)
- Replace placeholder modal/body text with formal citation guidance.
- Add arXiv/DOI link.
- Add a policy version constant (e.g., `CITATION_POLICY_VERSION`).
- If policy materially changes, invalidate prior acknowledgement by version bump.

## Acceptance Criteria for Future Implementation
- First download attempt in a session is blocked until acknowledgement.
- After acknowledgement, both map and catalog downloads proceed without re-prompt in same session.
- Cancel path never triggers download.
- Existing download validation/error toasts remain unchanged.
- Modal works in dark and light themes.
- Keyboard-only flow is fully usable.

## Out of Scope (Current Draft)
- Server-side enforcement.
- Legal terms of use workflow.
- Permanent localStorage-based acknowledgement.
- Requiring typed confirmation.

