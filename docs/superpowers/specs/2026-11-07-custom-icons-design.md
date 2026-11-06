# Custom icons — replace every emoji in Embervale

## Goal
Zero emojis in the shipped game. Weapons, armour, set pieces, artifacts and legendary powers get rich custom
art (coloured, bevelled, trimmed, tiered by rarity). Every other emoji becomes a flat game-icons.net glyph tinted
with the surrounding text colour. Offline: art lives in `assets/icons/` next to `index.html`; flat glyphs are
inlined as an SVG sprite so they never pop in.

Icons: game-icons.net (CC BY 3.0) via the GitHub clone at `/tmp/gi/icons` (4239 SVGs, `<author>/<name>.svg`).
Browse with e.g. `ls /tmp/gi/icons/*/ | grep -i sword` or `find /tmp/gi/icons -name '*helm*'`.
The build copies every icon it uses into `art/gi/` (committed), so `/tmp` is only needed when adding new ones.

## Layout
```
art/lib.js            engine: path parsing, materials, tier palettes, recipe context `c`, finish pass
art/build.js          node art/build.js [--only <prefix>] [--sheet <prefix>]
art/audit.js          node art/audit.js [files]  → lists remaining emojis (exit 1 if any)
art/recipes/*.js      styled recipes (arrays of {key, base, tiered?, tier?, roles?, draw(c)})
art/flat/*.json       flat glyph maps {key: "author/name"}; core.json = shared UI glyphs
art/out/              contact sheets (gitignored)
assets/icons/*.svg    GENERATED styled art
source/0_sprite.html  GENERATED flat sprite (build.sh inlines it after head.html)
source/0_icons_gen.js GENERATED key sets ICON_STYLED / ICON_FLAT / RAR_TIER
source/0_icons.js     runtime: ico(), itemIcon(), itemIconKey(), icoImg(), drawIco(), plain(), icoKeyOf()
```
`source/build.sh` runs `art/build.js` first, then builds `index.html` as before.

## Styled art (recipes)
Read `art/lib.js` (the `makeCtx` API) and the reference recipe `w-katana` in `art/recipes/weapons.js`.
- Start from a game-icons silhouette (`base`). Paint regions with materials **clipped to the silhouette**:
  whole subpaths (`c.sub(i)`), axis strips (`c.along(a,b,{from,to})`) or any custom `d`.
- Use ROLE names (`metal`, `metal2`, `trim`, `wood`, `leather`, `cloth`, `gem`, `bone`, `string`, `dark`) so
  the six tiers re-skin automatically; or a preset name from `MAT`, or a custom `[hi, mid, lo]` array.
- Details on `top`: `c.shine` edge highlights, `c.line` fullers/stitching, `c.band` trim bands (tier ≥2),
  `c.gem` (tier ≥3, glows ≥4), `c.engrave` (≥4), `c.runes` (≥5), `c.rust` (tier 1), `c.shape` for unclipped
  extra pieces, `c.gi(name)` + `c.place()` to pull in a second game-icon.
- No big auras/blobs behind items — rarity glow comes from the inventory frame. Small local glows are fine.
- Must read clearly at **42px** on a dark slot (`#1a1622`). Check with `node art/build.js --sheet <prefix>` and
  look at `art/out/sheet-<prefix>.png` (Read the PNG). Also render one large:
  `rsvg-convert -w 320 -b '#16131c' -o /tmp/x.png assets/icons/<key>.svg`.

Tiers: rarity index → tier `[1,2,2,3,4,4,5,5,5,6,6,6]` (Common … Eternal).
1 rusty iron/plain · 2 steel+bronze · 3 polished steel+gold+small gem · 4 blackened steel+gold+glowing gem+engraving
· 5 pale silver+cyan runes · 6 pale silver+gold runes+void gem (frame shimmer is CSS).

### Keys (exact — the runtime builds these from item data)
- Weapons, tiered: `w-<type>` → `w-<type>-t1..t6` for every WT key:
  sword katana dagger axe hammer spear scythe flail fists bow xbow cannon staff wand tome chakram rapier glaive shuriken scepter
- Armour, tiered: `a-<slot>-<light|medium|heavy>` for helm, armor (chestplate), gloves, boots; plus `a-ring`, `a-amulet`.
  Light = cloth/leather/feather motifs, Medium = leather + mail/studs, Heavy = full plate. Each must look distinct.
- Set pieces, single (`tier: 4`, custom palette in the set's `col`): `s-<setkey>-<slot>` for each SETS entry's
  `pieces` (source/1f_features.js). All four pieces of a set share motif + colours.
- Artifacts, single: `x-<artikey>` for each ARTI entry (source/1b_story.js), drawn on its weapon type's silhouette
  family but clearly one-of-a-kind, strongest look in the game.
- Legendary power emblems, single overlay: `e-<unqkey>` for every UNQ key (source/1_data.js, 1e_more.js, 1h_gear.js).
  Drawn ON TOP of any item icon at the same size — keep the centre mostly clear: effects hug the edges/corners
  plus an optional small badge in the bottom-right quadrant. Use `base: null` and `noOutline` style (no silhouette).

## Flat glyphs
`ico('key')` → `<svg class="gi"><use href="#i-key"/></svg>` sized 1.15em, `fill: currentColor`.
Reuse `art/flat/core.json` keys first. New keys go in your own `art/flat/<yourname>.json`. Keys are semantic
(`whirlwind`, `alchemist`), lowercase-hyphen. If the build reports a key clash, rename yours.

## Replacing emojis in source
- Data tables: `ic: '🗡️'` → `ic: ico('w-sword-t3')` / `ic: ico('whirlwind')`. `ic` stays an HTML string so the
  dozens of `${x.ic} ${x.n}` template uses keep working.
  - WT[t].ic = `ico('w-<t>-t3')`; AT[slot].ic = `ico('a-<slot>-medium-t3')` (ring/amulet: `a-ring-t3`).
- Inline strings: `'🔒 Locked'` → `ico('lock') + ' Locked'`; in templates `${ico('lock')} Locked`.
- NOT-HTML contexts (title="" attributes, canvas fillText, document.title, alert/confirm, textContent,
  plain chat text, localStorage): use `plain(...)` around icon-bearing strings, or drop the icon. Canvas icons:
  `drawIco(X, key, x, y, size, col)`; get a key from a data-table html with `icoKeyOf(x.ic)`.
- Items: `icon(it)` (2_engine.js) already returns `itemIcon(it)` (layered art + emblem + infusion glow).
- Allowed typographic marks (not emoji): → ← ↑ ↓ ★ ☆ ✦ ✧ ✕ × ☰ ◆ ◇ • ○ ● · … — –
- Don't change game logic. Keep each edit minimal. Don't reformat lines.

## Verification
- `node art/audit.js` → 0 emoji left.
- `sh source/build.sh` succeeds; `node art/build.js` reports 0 errors.
- Browser check (index.html over a local server): title, inventory, codex, skills, Haven stalls, HUD — no
  console `[icons] missing icon key` warnings, no visible markup text.
- Credits + README carry: "Icons by Lorc, Delapouite & contributors — game-icons.net (CC BY 3.0)".
