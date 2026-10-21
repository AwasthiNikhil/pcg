# Lucky You

A 2D tile game in which every level is procedurally generated. Grab the key,
collect coins and reach the exit before the timer runs out. As you progress,
each level is built by a different algorithm.

This repo is the web client (Phaser 3 + Vite). It is one of three repos:

| Repo | What it is |
|---|---|
| **pcg** (this one) | The game client |
| [PCG-for-game-levels-generation](https://github.com/AwasthiNikhil/PCG-for-game-levels-generation) | Level generators and the Flask API |
| [pcg-db](https://github.com/AwasthiNikhil/pcg-db) | Accounts, scores, shop and the admin dashboard (Laravel 13) |

## Run it

Start the other two services first. Their READMEs have the steps. Then:

```sh
npm ci
npm run dev        # http://localhost:8080
```

The client looks for the backends at these addresses:

| Variable | Default |
|---|---|
| `VITE_API_URL` | `http://127.0.0.1:8091/api` (pcg-db) |
| `VITE_GENERATOR_URL` | `http://127.0.0.1:5055` (generator API) |

To point it somewhere else, set them in a `.env` file next to `package.json`.

`npm run build` writes a static build to `dist/`.

## Controls

These are the defaults. You can rebind them in Settings.

| Key | Action |
|---|---|
| A / D | Move left / right |
| W | Jump |
| Space | Throw a bomb (clears 2×2 walls) |
| E | Place a wall block |
| S | Place a wall block below you |
| Esc | Pause |

Bombs and wall blocks are bought in the shop with the coins you collect.

## Levels

`src/levels.js` decides which generator builds each level. It also scales the
grid size and generator settings as the level number goes up:

| Levels | Generator |
|---|---|
| 1–2 | Random |
| 3–4 | Cellular automata |
| 5–6 | Graph (rooms and corridors) |
| 7–8 | Perlin noise |
| 9 and up | Transformer model |

## Code map

| Path | Contents |
|---|---|
| `src/main.js` | Phaser config and the scene list |
| `src/config.js` | Backend URLs |
| `src/levels.js` | Level progression and the generator request |
| `src/scenes/` | Login, Register, MainMenu, Game, LevelComplete, Shop, Settings, Leaderboard, Help, Pause, GameOver |
| `src/gameObjects/` | Player, enemies and projectiles |
| `assets/` | Sprites, audio and fonts |
