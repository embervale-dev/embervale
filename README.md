# Embervale — The Fading Flame

A single-player 3D action-adventure RPG that runs entirely in your browser. No install, no internet needed.

## Play
- **Download:** grab `index.html` **and the `assets/` folder** (keep them side by side), then double-click `index.html`.
- **Online:** if GitHub Pages is enabled for this repo, `index.html` is the game.

See `How to play.txt` for controls. New players start with a guided tutorial.

## Features
- 12 regions, guardians, the endless Abyss and 4 difficulties
- 20 weapon types, each with a signature Art and mastery
- 11 item rarities, item sets, crafting, gems, infusions, awakening and ascension
- Haven: a village that grows as you play, with stall keepers, villager requests and expeditions
- Long-term systems: Constellation, Seasons, Weekly Hunts, Nemesis, Ledger & Renown, Region Stars, Rebirth, Skill Mastery, Monster Trophies, the Endless Arena and more
- Online multiplayer (peer-to-peer via WebRTC/PeerJS): room codes, see friends in Haven, chat, co-op dungeons and PvP duels

## Building from source
The game is plain JavaScript in `source/`, concatenated into one HTML file, with its icon art in `assets/icons/`:
```
cd source && sh build.sh
```
This first runs `art/build.js` (needs Node), which generates the icons from the recipes in `art/recipes/` and the glyph maps in `art/flat/`, then writes `index.html` in the parent folder (the page GitHub Pages serves). `node art/audit.js` checks that no emoji are left in the source.

## Credits
Icons are built from [game-icons.net](https://game-icons.net) silhouettes by Lorc, Delapouite & contributors, licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), then coloured and detailed for Embervale.

Music is from [OpenGameArt.org](https://opengameart.org) by Matthew Pablo, The Cynic Project (cynicmusic), Hitctrl, RandomMind, Alexandr Zhelanov, CleytonKauffman, Patrick Maney, BossLevelVGM, Tausdei and Mega Pixel Music Lab, under CC0 and CC-BY 3.0/4.0. The full per-track list with links is in [`assets/music/CREDITS.md`](assets/music/CREDITS.md). The game streams these from `assets/music/`, so run it from a web server (or the live site) rather than opening `index.html` as a local file.

Made by GrimL0ck & neonxsl.
