# AGENTS.md — YoRHaJS

A custom mini game engine built on React/Redux/Three.js/Cannon.js, replicating the NieR: Automata hacking mini-game. This is **not** a standard web app — it uses React components as game objects driven by a manual `requestAnimationFrame` loop.

## Developer commands

- `npm install` — dependencies (uses npm; both `package-lock.json` and `yarn.lock` exist, prefer npm)
- `npm start` — dev server (Create React App 2.0.3)
- `npm run build` — production build
- `npm test` — runs `react-scripts test --env=jsdom`

## Architecture

- **Entry**: `src/index.js` → `src/App.js` → `src/renderer/Game.js`
- **Game loop**: `Game.js` owns a single `requestAnimationFrame` loop. It registers `update(time, deltaTime)` callbacks from services and components.
- **GameObject**: `src/renderer/Core/GameObject/GameObject.js` — Unity-like wrapper around a Three.js `Object3D`. Each game object is a React class component connected to Redux.
- **Components**: logic/behavior scripts wrapped by `GameComponentHOC.js`, which adds engine lifecycle hooks:
  - `start()` — called once on first `update`
  - `update(time, deltaTime)` — called every frame
  - `onDestroy()` — called on unmount
- **Services**: `PhysicsService`, `AudioService`, `AnimationService`, `InputService` — also React components registered into the `Game` context and updated each frame.
- **Scene state**: stored in Redux (`stores/initialScene.js`). Structure:
  - `gameObjects.byId` / `gameObjects.allIds`
  - `prefabs.byId` / `prefabs.allIds`
  - Prefab `components` are merged with per-instance `selfSettings.components`.

## Adding a new game component

1. Implement the component as a React class in `src/renderer/Core/GameComponents/<Name>/<Name>.js`.
2. Export it from `src/renderer/Core/GameComponents/index.js` with a string key.
3. Reference that key in prefab or game object `components` in `initialScene.js`.
4. The `GameComponentFactory` automatically wraps it with `makeGameComponent` and `connect()` to Redux.

## Key conventions

- **Old codebase**: `react-scripts@2.0.3`, React 16.12, Three.js 0.110.0. Avoid modern syntax unsupported by this toolchain.
- **Legacy dirs**: `game_old/` and `game_redux_old/` are obsolete prototypes. Do not modify or import from them.
- **ESLint**: uses `babel-eslint`, extends `prettier/recommended` and `react/recommended`. `react/prop-types` is disabled.
- **CSS theme**: `yorha/dist/yorha.min.css` is imported in `index.js`.
- **Redux DevTools**: enabled in development via `window.__REDUX_DEVTOOLS_EXTENSION__` in `App.js`.
- **Tab visibility**: the engine pauses the simulation loop when the document is hidden (`visibilitychange`).
- **Cannon.js**: installed from GitHub (`github:schteppe/cannon.js`), not npm.

## Testing

- `npm test` launches CRA test runner in interactive watch mode.
- There is only one default test file (`src/App.test.js`). No integration test infrastructure or required services.
