# Tessera

Describe a part, list what it has to fit, and Tessera turns it into a researched, fit-checked, 3D-printable model.

- **Researches before it designs.** Looks up real dimensions for the parts you list *and* for things the brief only implies (ask for "a 5 spot cable organizer" and it finds real cable diameters and connector sizes), surveys how that kind of object is usually designed, and picks a style.
- **Real CAD, not meshes.** Models are OpenCascade B-rep solids (via [replicad](https://replicad.xyz)), so fillets, booleans and STEP export are exact.
- **Checks its own work.** Every build reports body sizes, overlaps between parts, and printer-bed fit; Claude fixes problems and rebuilds. An optional visual review renders the model from 5 angles and refines shape and detail.
- **Plans before it models.** Multi-part briefs are broken into bodies with sizes, positions and interfaces first, so the design call can focus on geometry.
- **Doesn't lose work.** The model kept is always the last one that actually built. If Claude runs out of turns, Tessera keeps that build; if nothing built, it switches to a direct write-and-repair mode. A failed run offers "Retry the design" without redoing the research.
- **Exploded view** for assemblies, plus a parts list, assembly steps and fit checks.
- **Exports** one zip: STL per printable body, a STEP assembly (Fusion 360 / FreeCAD / Onshape), a GLB, the replicad source, and an optional CadQuery port.
- **Learns from a reference library.** `library/` holds tested models (enclosures, snap-fits, a print-in-place hinge, involute gears, mounts, lathed and sculpted forms). The research step picks the closest ones and their code goes into the design prompt as worked examples. Add a model + catalog entry to teach Tessera a new technique.
- **Your own library.** Save designs with their brief, research and model; they sync privately per person, or stay in the browser outside Claude.
- **Never looks frozen.** A live activity panel shows the stage, elapsed time and what's happening right now.

## How it works

```
brief + parts ──► Research (web lookup, inferred items, style survey) ──► spec + requirements
                                                                              │
                     Visual review ◄── build → measure → fix loop ◄── Design ◄┘
                     (5 renders → Claude → refine)          (run_cad tool, CAD worker)
```

| Piece | File |
|---|---|
| Page UI, prompts, orchestration | `web/index.html`, `web/app.js` |
| Viewer (three.js), worker client, zip export | `src/browser.js` → `dist/cad.js` |
| CAD worker: runs model code, meshes, STL/STEP | `src/worker.js` → `dist/cad-worker.js` |
| Model runner + fit checks (shared with tests) | `src/engine.js` |
| Reference models, catalog, thumbnails | `library/*.js`, `library/catalog.json`, `library/thumbs/` |

The Claude calls use the claude.ai artifact runtime (`sample` with page tools and images), the web lookup uses the Claude desktop app's built-in browser (`host:claude_browser`), and exports go through the `downloads` capability. Outside the Claude viewer the page still loads, shows models, and lets you edit and run the source; the designer needs Claude.

## Develop

```bash
npm install
npm run build      # dist/: page, bundles, gzipped OpenCascade kernel (~7 MB)
npm run serve      # http://localhost:8765
npm run thumbs     # re-render library thumbnails in headless Chrome
npm test           # builds every model in library/ with the real kernel; fails on errors or overlaps
npm run test:e2e   # runs the real page headless with Claude's side scripted, incl. recovery paths (needs Chrome; CHROME_PATH to override)
```

Model code is plain JavaScript defining `main(r, p)`, where `r` is replicad and `p` holds printer settings; it returns `[{ name, shape, color, printable }]`. Purchased parts are returned with `printable: false` so overlaps can be checked. See `library/` for examples.

### Adding a reference model

1. Write `library/<id>.js` (a `main(r, p)` that builds cleanly; purchased parts as `printable: false`).
2. Add an entry to `library/catalog.json`: title, category, brief, tags (what briefs it should match), techniques (what Claude should learn from it).
3. `npm test` (must build with no overlaps), then `npm run thumbs`.

## Licenses

Tessera's own code: MIT. OpenCascade (via `replicad-opencascadejs`) is LGPL-2.1; replicad and three.js are MIT; JSZip is MIT/GPLv3 dual-licensed.
