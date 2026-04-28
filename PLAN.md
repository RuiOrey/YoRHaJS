# Game Engine & Graphics Implementation Plan

**Goal**: Transform the current prototype into a fully playable basic hacking mini-game level inspired by NieR: Automata.

**Scope**: One parameterized level with 3 waves, board collision, grid overlay, multiple bullet patterns, and debug HUD elements.

---

## 1. Audit: What Already Exists

### ✅ Implemented (working or mostly working)
| Feature | Status | Notes |
|---------|--------|-------|
| Game loop (`requestAnimationFrame`) | ✅ Complete | In `Game.js`, with tab-pause support |
| GameObject system (Unity-like) | ✅ Complete | `GameObject.js` with transform hierarchy, prefab system |
| Component lifecycle (`start`/`update`/`onDestroy`) | ✅ Complete | `GameComponentHOC.js` |
| Redux scene state + prefab system | ✅ Complete | `initialScene.js` with `byId`/`allIds` pattern |
| Cannon.js physics service | ✅ Complete | Box/sphere bodies, contact events, materials |
| Player movement (WASD) | ✅ Complete | Direct physics body manipulation |
| Player aim (mouse lookAt) | ✅ Complete | Raycasting from camera to board plane |
| Player shooting (hold space) | ✅ Complete | `Shooter.js` with bullet pooling |
| Enemy "follow" movement | ✅ Partial | `updateFollowPlayerEnemy` exists but has bugs |
| Enemy "rotate" movement | ✅ Complete | `updateAutoRotateEnemy` in `EnemyMovementControls` |
| Bullet forward movement | ✅ Complete | `BulletMovement.js` with manual position updates |
| Bullet pool (aroundBullets) | ✅ Partial | `initBullets` pre-spawns, `shootAroundBullet` fires but logic is incomplete |
| Enemy geometry (cube + cone tip) | ✅ Complete | `EnemyCubeGeometry.js` |
| Sphere geometry (boss) | ✅ Complete | `SphereGeometry.js` |
| Camera (perspective + OrbitControls) | ✅ Complete | `Camera.js` with multiple preset angles |
| Post-processing (Bloom) | ✅ Complete | `Renderer.js` with `EffectComposer` |
| Animation service (Tween.js) | ✅ Complete | `travelTo`, `lookAt` tweens |
| Audio service | ✅ Partial | Positional/non-positional sound loading works, no SFX integration |
| Input service (keyboard + mouse) | ✅ Complete | Custom events dispatched to `document` |
| Debug stats panel | ✅ Complete | `stats.js` overlay |

### ⚠️ Partially Implemented (exists but broken/incomplete)
| Feature | What's Missing |
|---------|---------------|
| **Bullet patterns** | Only `forward` type works. `type` prop exists but `Shooter.update()` always calls `shootAroundBullet`. No `aimed` pattern. |
| **Enemy health/damage** | No HP system. No collision detection between bullets and enemies/player. |
| **Wave system** | `rules.txt` mentions waves but no implementation. Enemies are statically placed in `initialScene.js`. |
| **Board boundaries** | Board is a flat box with physics but no visible border walls or collision edges. |
| **Grid overlay** | No grid visual on the board. |
| **Level flow** | No start/end state machine. No win/lose conditions. |
| **Debug HUD** | No score, wave counter, timer, or player HP display. |
| **Enemy spawn system** | Enemies are pre-placed in Redux state. No dynamic spawning. |
| **Bullet-enemy collision** | Physics contact events exist but no game logic hooks them up to damage. |

### ❌ Not Implemented
| Feature | Notes |
|---------|-------|
| **Aimed bullet pattern** | Enemies don't calculate direction to player when shooting |
| **Spiral/rotating bullet pattern** | Not implemented |
| **Enemy death/explosion** | No visual or logic for enemy destruction |
| **Player damage/death** | No HP, no game over screen |
| **Level complete screen** | No victory state |
| **Sound effects** | Audio service exists but no SFX are wired to game events |
| **Background music** | Not implemented |
| **Scanline/CRT effect** | Not implemented |
| **Bullet trails** | Not implemented |

---

## 2. Implementation Plan

### Phase 1: Core Gameplay Loop (Highest Priority)

#### 1.1 Board Boundaries + Collision
- **New component**: `BoardWalls` — creates 4 invisible wall bodies around the board perimeter
- Uses `PhysicsService.addNewBoxBody` with `mass: 0` (static)
- Configurable via prefab: `{ width, height }`
- **File**: `src/renderer/Core/GameComponents/BoardWalls/BoardWalls.js`
- **Register in**: `GameComponents/index.js` as `boardWalls`

#### 1.2 Grid Overlay
- **New component**: `BoardGrid` — renders a `THREE.GridHelper` on the board surface
- Configurable: `{ cellSize, divisions, colorCenter, colorGrid }`
- **File**: `src/renderer/Core/GameComponents/BoardGrid/BoardGrid.js`
- **Register in**: `GameComponents/index.js` as `boardGrid`

#### 1.3 Health System
- **New component**: `Health` — attachable to any GameObject
- Props: `{ maxHealth, currentHealth, onDeath }`
- Dispatches Redux action on death
- **File**: `src/renderer/Core/GameComponents/Health/Health.js`
- **New Redux action**: `damageGameObject(gameObjectId, damage)` in `stores/scene/actions/`
- **New Redux reducer case**: `DAMAGE_GAME_OBJECT` in `stores/scene/reducers/`

#### 1.4 Collision → Damage Pipeline
- Wire `PhysicsService.beginContact` to dispatch damage events
- **New component**: `CollisionDamage` — registers `beginContactFunction` on physics body
- Filters collisions by tag (e.g., `playerBullet` vs `enemy`, `enemyBullet` vs `player`)
- **File**: `src/renderer/Core/GameComponents/CollisionDamage/CollisionDamage.js`

#### 1.5 Enemy Death + Respawn Removal
- On HP ≤ 0: trigger `onDeath` → destroy GameObject, remove physics body, play explosion
- **New component**: `DeathHandler` — listens for death event, triggers cleanup + effects
- **File**: `src/renderer/Core/GameComponents/DeathHandler/DeathHandler.js`

---

### Phase 2: Bullet Patterns

#### 2.1 Forward Pattern (Fix Existing)
- `Shooter.js` already has `shootForwardBullet` — wire it to `type: "forward"`
- Currently `update()` always calls `shootAroundBullet`. Fix the dispatch:
  ```js
  const shootMethods = { forward: this.shootForwardBullet, around: this.shootAroundBullet, aimed: this.shootAimedBullet };
  shootMethods[this.type]?.(time);
  ```

#### 2.2 Aimed Pattern (New)
- **New method in `Shooter.js`**: `shootAimedBullet(time)`
- Calculates direction from enemy to player using `getShooter()` (already exists in `EnemyMovementControls`)
- Sets bullet rotation to face player at spawn time
- **File**: Modify `Shooter.js`

#### 2.3 Spiral/Rotating Pattern (New)
- **New method in `Shooter.js`**: `shootSpiralBullet(time)`
- Each shot rotates the base angle by `spiralAngleIncrement`
- Creates a rotating fan of bullets
- Configurable: `{ spiralAngleIncrement, spiralRotationSpeed }`
- **File**: Modify `Shooter.js`

#### 2.4 Bullet Visual Improvements
- Add emissive material to player bullets (glow effect via post-processing bloom)
- Different colors: player = white/cyan, enemy = red/orange
- **File**: Modify `PlayerBulletGeometry.js` and add `EnemyBulletGeometry.js`

---

### Phase 3: Wave System

#### 3.1 Wave Manager
- **New component**: `WaveManager` — central controller for wave progression
- Reads wave definitions from Redux `game.levels.byId[levelId].waves`
- Each wave: `{ id, enemies: [{ prefab, position, components }], trigger: "previous_wave_cleared" }`
- Spawns enemies via `instantiateFromPrefab` Redux action
- Listens for all-enemies-dead event → triggers next wave
- **File**: `src/renderer/Core/GameComponents/WaveManager/WaveManager.js`
- **Register in**: `GameComponents/index.js` as `waveManager`

#### 3.2 Wave Data Structure (Redux)
Extend `initialScene.js`:
```js
game: {
  levels: {
    byId: {
      zero: {
        waves: [
          {
            id: "wave1",
            enemies: [
              { prefab: "EnemyFollower", position: { x: 20, y: 0, z: 3 }, components: { enemyMovementControls: { type: "follow" }, shooter: { type: "forward", ... } } }
            ]
          },
          { id: "wave2", enemies: [...] },
          { id: "wave3", enemies: [...] }
        ]
      }
    }
  }
}
```

#### 3.3 Enemy Spawn Points
- Define spawn positions per wave in the wave config
- Enemies appear at those positions with a brief spawn animation (tween scale from 0→1)

---

### Phase 4: Level Flow & State Machine

#### 4.1 Game State Manager
- **New component**: `GameStateManager` — tracks: `idle` → `playing` → `waveTransition` → `victory` / `defeat`
- Dispatches events: `GAME_START`, `WAVE_START`, `WAVE_CLEAR`, `GAME_OVER`, `VICTORY`
- **File**: `src/renderer/Core/GameComponents/GameStateManager/GameStateManager.js`

#### 4.2 Win/Lose Conditions
- Victory: all waves cleared
- Defeat: player HP ≤ 0
- Configurable time limit per level (optional)

#### 4.3 Level Reset
- `restartGame` event already exists in `InputService.js` (R key)
- Wire it to reset Redux scene state to initial values

---

### Phase 5: Debug HUD (In-Game Overlay)

#### 5.1 Debug Overlay Component
- **New component**: `DebugHUD` — renders HTML overlay via CSS
- Shows: wave number, enemy count, player HP, score, time
- Toggled via config (visible in dev, hidden in prod or togglable)
- **File**: `src/renderer/Core/GameComponents/DebugHUD/DebugHUD.js`
- Uses existing `CSSLabelTo3D` pattern or plain HTML overlay

---

### Phase 6: Visual Polish

#### 6.1 Bullet Trails
- **New component**: `BulletTrail` — adds a fading trail mesh behind moving bullets
- Uses `THREE.Line` with decreasing opacity segments
- **File**: `src/renderer/Core/GameComponents/BulletTrail/BulletTrail.js`

#### 6.2 Explosion Effect
- **New component**: `ExplosionEffect` — particle burst on enemy death
- Uses `THREE.Points` with short-lived particles
- Triggered by `DeathHandler`
- **File**: `src/renderer/Core/GameComponents/ExplosionEffect/ExplosionEffect.js`

#### 6.3 Scanline/CRT Post-Processing
- Add `ScanlineEffect` from `postprocessing` library to `Renderer.js`
- Configurable intensity
- **File**: Modify `Renderer.js`

#### 6.4 Color Theme
- Board: dark gray/black with subtle grid
- Player: white/cyan with glow
- Enemies: red/orange
- Bullets: player = cyan, enemy = red
- Update `BoardPlaneGeometry.js` color, `PlayerBulletGeometry.js` material, `EnemyCubeGeometry.js` defaults

---

### Phase 7: Audio

#### 7.1 Sound Effects
- Wire `Shooter.playBulletSound()` (already exists but needs asset)
- Add SFX for: player shoot, enemy shoot, hit, explosion, wave start, victory, defeat
- **File**: Add sounds to `public/assets/sounds/` and wire in components

#### 7.2 Background Music
- Use `AudioService.buildNonPositionalSound` for looping BGM
- Start on level begin, fade on victory/defeat

---

## 3. File Map (New Files to Create)

```
src/renderer/Core/GameComponents/
├── BoardWalls/BoardWalls.js          # Phase 1.1
├── BoardGrid/BoardGrid.js            # Phase 1.2
├── Health/Health.js                  # Phase 1.3
├── CollisionDamage/CollisionDamage.js # Phase 1.4
├── DeathHandler/DeathHandler.js      # Phase 1.5
├── WaveManager/WaveManager.js        # Phase 3.1
├── GameStateManager/GameStateManager.js # Phase 4.1
├── DebugHUD/DebugHUD.js              # Phase 5.1
├── BulletTrail/BulletTrail.js        # Phase 6.1
├── ExplosionEffect/ExplosionEffect.js # Phase 6.2
└── EnemyBulletGeometry/EnemyBulletGeometry.js # Phase 2.4

src/renderer/Core/GameComponents/EnemyBullet/
└── EnemyBulletGeometry.js            # Phase 2.4 (separate from player)

src/stores/scene/actions/
├── (add) damageGameObject.js         # Phase 1.3
├── (add) destroyEnemy.js             # Phase 1.5
└── (add) waveActions.js              # Phase 3.1

src/stores/scene/reducers/
└── (add cases) DAMAGE_GAME_OBJECT, WAVE_START, WAVE_CLEAR
```

## 4. Files to Modify

| File | Changes |
|------|---------|
| `Shooter.js` | Wire `type` dispatch, add `shootAimedBullet`, `shootSpiralBullet` |
| `BulletMovement.js` | Add aimed trajectory support |
| `EnemyMovementControls.js` | Fix `follow` mode, add `spiral` movement type |
| `BoardPlaneGeometry.js` | Darker color, optional grid texture |
| `PlayerBulletGeometry.js` | Emissive material, configurable color |
| `EnemyCubeGeometry.js` | Remove `console.log`, configurable color per enemy type |
| `initialScene.js` | Add wave definitions, health components, board walls/grid |
| `Renderer.js` | Add scanline effect to post-processing |
| `GameComponents/index.js` | Register all new components |
| `stores/scene/actions/index.js` | Add damage/destroy/wave actions |
| `stores/scene/reducers/index.js` | Add reducer cases |

## 5. Recommended Implementation Order

1. **BoardWalls + BoardGrid** — quick wins, visible immediately
2. **Health + CollisionDamage + DeathHandler** — core gameplay loop
3. **Bullet patterns (aimed, spiral)** — enemy variety
4. **WaveManager + wave data** — level structure
5. **GameStateManager** — flow control
6. **DebugHUD** — visibility into game state
7. **Visual polish** (trails, explosions, scanlines, colors)
8. **Audio** (SFX, BGM)

## 6. Parameterization

Everything should be configurable through prefab/component props in `initialScene.js`:
- Board size, grid density
- Wall positions
- Wave definitions (enemy count, types, positions, timing)
- Enemy behavior (movement type, shoot pattern, speed, HP)
- Bullet properties (speed, lifetime, count per burst)
- Player stats (speed, HP, fire rate)
- Level config (time limit, win conditions)
