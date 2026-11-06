# Embervale — The Fading Flame

A single-player 3D action-adventure RPG that runs entirely in your browser. No install, no internet needed.

## Play
- **Download:** grab `index.html` and double-click it.
- **Online:** if GitHub Pages is enabled for this repo, `index.html` is the game.

See `How to play.txt` for controls. New players start with a guided tutorial.

## Features
- 12 regions, guardians, the endless Abyss and 4 difficulties
- 20 weapon types, each with a signature Art and mastery
- 11 item rarities, item sets, crafting, gems, infusions, awakening and ascension
- Haven: a village that grows as you play, with stall keepers, villager requests and expeditions
- Long-term systems: Constellation, Seasons, Weekly Hunts, Nemesis, Ledger & Renown, and more

## Building from source
The game is plain JavaScript in `source/`, concatenated into one HTML file:
```
cd source && sh build.sh
```
This writes `index.html` in the parent folder, which is both the playable single-file game and the page GitHub Pages serves.

Made by GrimL0ck using Claudy.
