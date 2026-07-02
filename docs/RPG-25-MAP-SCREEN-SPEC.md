# UMBRA - Dark Medieval Map Screen - Design Specification v2.0

**Issue:** RPG-25 / RPG-27  
**Status:** REVISED - Implementation-Ready  
**Date:** 2026-07-02  
**Author:** Design Specs Writer  
**Target:** UI Developer  

---

## 1. Design Philosophy

- **Theme:** Dark Medieval / Gothic Fantasy — NO neon, NO glow effects, NO RGB, NO cyberpunk
- **Lighting:** Warm only — amber, candlelight, sanguine tones
- **Palette:** Deep blacks, dark grays, sanguine reds, aged golds, parchment whites
- **Typography:** Cinzel (headings/medieval feel), Inter (body/UI readability)
- **Feel:** A cursed map drawn on aged parchment, stained with blood and shadow

---

## 2. Screen Layout (Mobile-First, 480px max-width)

```
┌─────────────────────────────────────┐
│  ┌─ HUD BAR ──────────────────────┐ │  ← 60px height
│  │ [Portrait] HP ████ MP ██ 🧭   │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─ SEARCH BAR (dual-line) ───────┐ │  ← 48px height
│  │ 🔍 Buscar local...            │ │
│  │ Filtros: [Fenda] [Loja] [NPC] │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─ MAP AREA ─────────────────────┐ │  ← flex: 1 (remaining)
│  │                                │ │
│  │    [POI]        [POI]         │ │
│  │         🧭 (compass)          │ │
│  │  [POI]    👤    [POI]        │ │  ← Player silhouette center
│  │      (player)                 │ │
│  │    [POI]        [POI]         │ │
│  │                                │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌─ BOTTOM NAV ───────────────────┐ │  ← 64px height
│  │ 🗺️  ⚔️  🎒  📜  ⚙️           │ │
│  │ Map Inv  Team Log  Set        │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Sidebar (Left, 48px width, overlay):**
```
┌──┐
│🗺️│  ← Map Layers
│⚔️│  ← Bestiary
│🎒│  ← Inventory  
│🛡️│  ← Equipment
│📜│  ← Quest Log
│⚙️│  ← Settings
└──┘
```
- Sidebar slides in from left on hamburger tap or swipe-right
- Semi-transparent black backdrop (#0a0a0a @ 70% opacity)
- Icons: 28px, sanguine red (#8B0000) inactive, aged gold (#C5A55A) active
- Width: 48px expanded, 0px collapsed

---

## 3. POI System — 12 Named Points of Interest

### 3.1 POI Data Structure

| # | POI Name | Category | Level | Ring Color | Icon | GPS Offset (approx) |
|---|----------|----------|-------|------------|------|---------------------|
| 1 | Fenda do Abismo | Rift | Lv.5 | `#FF0000` (Red) | ⚡ | +0.002, +0.002 |
| 2 | Fenda das Almas | Rift | Lv.8 | `#FF0000` (Red) | ⚡ | -0.001, +0.003 |
| 3 | Fenda Sanguinária | Rift | Lv.12 | `#FF0000` (Red) | ⚡ | +0.003, -0.001 |
| 4 | Taverna do Corvo | Shop/NPC | Lv.1 | `#C5A55A` (Gold) | 🍺 | +0.001, +0.001 |
| 5 | Feraria das Sombras | Shop/NPC | Lv.3 | `#C5A55A` (Gold) | ⚒️ | -0.002, +0.001 |
| 6 | Santuário Perdido | NPC | Lv.1 | `#4A90D9` (Blue) | ✝️ | +0.001, -0.002 |
| 7 | Covil do Lobo | Monster | Lv.7 | `#8B4513` (Brown) | 🐺 | -0.003, -0.001 |
| 8 | Crypta dos Antigos | Dungeon | Lv.10 | `#800080` (Purple) | 💀 | +0.002, -0.003 |
| 9 | Torre do Alquimista | Quest | Lv.4 | `#00CED1` (Teal) | 🧪 | -0.001, -0.002 |
| 10 | Cemitério Maldito | Monster | Lv.6 | `#8B4513` (Brown) | ⚰️ | +0.003, +0.001 |
| 11 | Fonte da Vida | Treasure | Lv.2 | `#FFD700` (Gold) | 💎 | -0.002, -0.003 |
| 12 | Portal do Eclipse | Fast Travel | Lv.15 | `#FF4500` (Orange) | 🌀 | +0.001, +0.004 |

### 3.2 POI Visual Specifications

**POI Marker (Default):**
- Size: 40px × 40px circle
- Border: 3px solid [ring color]
- Background: radial-gradient(circle, #1e1e1e 0%, #0a0a0a 100%)
- Icon: Centered, 20px, colored matching ring
- Shadow: `0 0 8px [ring color]40` (40 = 25% opacity, warm glow only)
- Hover/Active: Scale 1.2x, shadow intensifies to `0 0 12px [ring color]60`

**POI Label (below marker):**
- Font: Inter, 10px, bold
- Color: `#e0e0e0`
- Text-shadow: `0 1px 3px #000`
- Max-width: 80px, text-overflow: ellipsis
- Position: 4px below marker bottom

**POI Popup (on tap):**
- Width: 200px
- Background: `#1a1a1a` with 1px solid `#333`
- Border-radius: 8px
- Padding: 12px
- Content: Name (Cinzel, 14px, ring color), Level badge, Category tag, "Visitar" button
- Arrow: 8px triangle pointing to marker
- Shadow: `0 4px 20px rgba(0,0,0,0.8)`

### 3.3 POI States

| State | Visual Change |
|-------|---------------|
| **Discovered** | Full color ring + icon, label visible |
| **Undiscovered** | Gray ring (#555), icon hidden, label shows "???" |
| **Visited** | Ring color dimmed to 60%, checkmark overlay |
| **Active Quest** | Pulsing ring animation (3s cycle), quest marker ⚠️ above |
| **Locked** | Padlock icon overlay, ring at 30% opacity |
| **Fast Travel Available** | Orange ring + 🌀 icon, glow pulse on idle |

---

## 4. HUD (Heads-Up Display) — Top Bar

**Container:** Fixed top, full width, 60px height
- Background: linear-gradient(180deg, #0a0a0a 0%, #0a0a0aCC 80%, transparent 100%)
- No border-bottom (clean dissolve into map)

### 4.1 Character Portrait
- Position: Left, 8px margin
- Size: 40px × 40px
- Shape: Circle with 2px solid `#C5A55A` border
- Image: Player avatar (placeholder: silhouette on dark background)
- Level badge: 16px circle, bottom-right overlap, `#8B0000` bg, white text

### 4.2 HP Bar
- Position: Right of portrait, 8px gap
- Width: 120px, Height: 12px
- Background: `#1a1a1a`
- Border: 1px solid `#333`
- Fill: linear-gradient(90deg, `#8B0000` 0%, `#CC0000` 100%)
- Text overlay: "85/100" centered, Inter 9px, white
- Low HP (<25%): Fill becomes `#FF4444` with subtle pulse animation

### 4.3 Mana Bar
- Position: Below HP bar, 4px gap
- Width: 120px, Height: 8px
- Background: `#1a1a1a`
- Border: 1px solid `#333`
- Fill: linear-gradient(90deg, `#1a3a6a` 0%, `#2a5aa0` 100%)
- Text overlay: "45/60" centered, Inter 8px, `#a0c0e0`

### 4.4 Resource Icons (Right side of HUD)
- Position: Far right, 8px margin
- Layout: Vertical stack, 4px gap
- Icons (16px each):
  - 🪙 Gold: `#C5A55A`, text "1,250" Inter 10px
  - 🔮 Souls: `#8B008B`, text "47" Inter 10px
  - 🧭 Compass: `#C5A55A`, rotates with player heading (360°)

---

## 5. Search Bar — Dual-Line Interface

**Container:** Below HUD, full width minus 16px margins, 48px height
- Background: `#1a1a1a` with 1px solid `#333`
- Border-radius: 24px
- Padding: 8px 16px
- Shadow: `0 2px 8px rgba(0,0,0,0.5)`

### Line 1: Search Input
- Icon: 🔍 `#666`, 16px
- Placeholder: "Buscar local, NPC ou item..." `#666`, Inter 13px
- Input: Inter 13px, `#e0e0e0`, no border, transparent bg
- Focus: Border transitions to `#8B0000`

### Line 2: Filter Chips
- Layout: Horizontal scroll, 4px gap
- Chips: 
  - "Fenda" — `#FF0000` border, `#FF000020` bg
  - "Loja" — `#C5A55A` border, `#C5A55A20` bg
  - "NPC" — `#4A90D9` border, `#4A90D920` bg
  - "Dungeon" — `#800080` border, `#80008020` bg
  - "Fast Travel" — `#FF4500` border, `#FF450020` bg
- Chip size: Auto-width, 20px height, border-radius 10px
- Font: Inter 10px, bold
- Active chip: Filled background (same color as border at 40% opacity)

---

## 6. Decorative Map Elements

### 6.1 Player Silhouette
- Position: Exact center of map viewport
- Size: 32px × 32px
- Image: Dark medieval knight silhouette (SVG preferred)
- Color: `#C5A55A` (aged gold) with `0 0 8px rgba(197,165,90,0.3)` shadow
- Animation: Subtle idle sway (CSS `@keyframes sway`, 4s cycle, ±2deg rotation)

### 6.2 Compass Rose
- Position: Top-right of map, below HUD, 8px margins
- Size: 48px × 48px
- Style: Ornate medieval compass (SVG), `#C5A55A` strokes on transparent bg
- Rotation: Tracks device heading via DeviceOrientationEvent
- Cardinal points: N/S/E/W in Cinzel 8px, `#C5A55A`

### 6.3 Road Sign (Directional Marker)
- Position: Dynamic — appears when player is within 100m of a POI
- Size: 24px × 24px
- Image: Wooden signpost icon (SVG)
- Color: `#8B4513` (brown wood)
- Animation: Fade in (0.3s), points toward nearest undiscovered POI
- Disappears when player moves >100m away

### 6.4 Treasure Chests (Scattered)
- Count: 3-5 per visible map area
- Size: 20px × 20px
- Image: Closed chest icon (SVG)
- Colors: `#8B4513` (wood), `#C5A55A` (gold trim)
- States:
  - Closed: Default, slight glow `0 0 4px rgba(197,165,90,0.2)`
  - Open: Lid rotated 45deg, darker, no glow
  - Collected: Replaced with small debris pile (faded)
- Interaction: Tap opens loot popup (same style as POI popup)

### 6.5 Marker Stones (Waypoints)
- Count: 2-3 visible at a time
- Size: 16px × 24px
- Image: Standing stone / obelisk (SVG)
- Color: `#555` base with `#8B0000` runes
- Purpose: Mark previously visited locations
- Glow: Subtle red rune pulse (5s cycle)

---

## 7. Bottom Navigation — 5 Tabs

**Container:** Fixed bottom, full width, 64px height + safe-area padding
- Background: `#0a0a0a` solid
- Border-top: 1px solid `#333`
- Padding-bottom: `env(safe-area-inset-bottom, 8px)`

### Tab Specifications

| Tab | Icon | Label | Active Color | Inactive Color |
|-----|------|-------|--------------|----------------|
| Mapa | 🗺️ (custom SVG map icon) | MAPA | `#C5A55A` | `#666` |
| Combate | ⚔️ (crossed swords SVG) | COMBATE | `#8B0000` | `#666` |
| Inventário | 🎒 (pouch SVG) | INVENTÁRIO | `#C5A55A` | `#666` |
| Diário | 📜 (scroll SVG) | DIÁRIO | `#C5A55A` | `#666` |
| Config | ⚔️ (gear SVG) | CONFIG | `#C5A55A` | `#666` |

### Tab Visual Specs
- Icon size: 24px
- Label: Inter 10px, uppercase, letter-spacing 0.5px
- Active state: Icon + label in active color, 2px indicator line above icon in same color
- Inactive: Grayscale icon (CSS `filter: grayscale(100%)`), 60% opacity
- Tap feedback: Scale 0.95 for 100ms (CSS transition)
- Badge support: Small red circle (12px) with count for notifications (top-right of icon)

---

## 8. Atmosphere & Effects

### 8.1 Vignette Overlay
- Type: CSS `box-shadow: inset 0 0 80px rgba(0,0,0,0.9)`
- Applied to: `.map-wrapper` container
- Creates: Dark edges fading to transparent center
- Intensity: Fixed (not interactive)

### 8.2 Fog of War
- **UNRESOLVED — Requires Game Designer input:**
  - Option A: Black overlay tiles (traditional, simpler implementation)
  - Option B: Gaussian blur on unexplored areas (more immersive, heavier performance)
- Applied to: Map tiles outside 200m radius of any visited location
- Transition: 0.5s fade when revealing new area

### 8.3 Particle Effects (Subtle)
- **Ash/Ember particles:** 5-8 floating specs
  - Size: 2-4px
  - Color: `#FF4500` to `#FF6600` gradient
  - Animation: Float upward + drift, 3-5s lifespan, fade in/out
  - Performance: CSS-only (no canvas), `will-change: transform`
- **Fog wisps:** 2-3 horizontal streaks
  - Size: 40-80px wide, 2-4px tall
  - Color: `rgba(100,100,100,0.1)`
  - Animation: Horizontal drift left-to-right, 8-12s cycle
  - Performance: CSS animation, `pointer-events: none`

### 8.4 Lighting
- **No neon/glow/RGB** — Warm tones only
- Map tile filter: `hue-rotate(340deg) saturate(1.5) contrast(1.2)` (already in codebase)
- Ambient light: Radial gradient from center `#1e1e1e` to `#0a0a0a`
- POI glow: Warm `rgba(197,165,90,0.2)` — NOT cool/white/blue

### 8.5 Weather Effects (Visual Only)
- **UNRESOLVED — Requires Game Designer input:**
  - Does weather affect gameplay or is it purely cosmetic?
  - Current plan: Visual-only rain overlay (CSS pseudo-element, animated dots)
  - Rain intensity: Light (subtle) vs Heavy (more particles, darker overlay)

---

## 9. Interaction Patterns

### 9.1 Map Gestures
- **Pan:** Touch drag — standard Leaflet behavior
- **Pinch zoom:** Standard Leaflet (min zoom 12, max zoom 18)
- **Double-tap zoom:** +1 zoom level
- **Tap POI:** Opens popup (max 1 visible at a time)
- **Tap empty area:** Dismisses open popup
- **Swipe right from left edge:** Opens sidebar
- **Swipe left on sidebar:** Closes sidebar

### 9.2 POI Interaction Flow
1. Player taps POI marker → Popup appears (0.2s ease-out scale animation)
2. Popup shows: Name, Level, Category, Description snippet
3. "Visitar" button → Triggers navigation event (passed to parent)
4. "Navegar" button (if Fast Travel unlocked) → Fast travel confirmation modal
5. Tap outside popup → Dismiss (0.15s fade out)

### 9.3 Search Interaction
1. Tap search bar → Expands to full width, shows keyboard
2. Type → Real-time filtering of visible POIs (debounce 300ms)
3. Tap filter chip → Toggles filter, POIs outside filter fade to 30% opacity
4. Tap result → Map pans to POI, opens popup
5. Tap outside → Collapse search, restore full POI visibility

---

## 10. Component Inventory (React Components)

| Component | File | Purpose |
|-----------|------|---------|
| `MapScreen` | `MapScreen.jsx` | Root container, orchestrates all sub-components |
| `HudBar` | `HudBar.jsx` | Top bar with portrait, HP/MP, resources, compass |
| `SearchBar` | `SearchBar.jsx` | Dual-line search with filter chips |
| `PoiMarker` | `PoiMarker.jsx` | Individual POI marker with states |
| `PoiPopup` | `PoiPopup.jsx` | POI detail popup on tap |
| `PlayerMarker` | `PlayerMarker.jsx` | Center player silhouette |
| `CompassRose` | `CompassRose.jsx` | Rotating compass indicator |
| `Sidebar` | `Sidebar.jsx` | Left slide-out menu (6 icons) |
| `BottomNav` | `BottomNav.jsx` | 5-tab bottom navigation |
| `FogOverlay` | `FogOverlay.jsx` | Fog of war rendering |
| `ParticleLayer` | `ParticleLayer.jsx` | Ash/ember/fog particles |
| `TreasureChest` | `TreasureChest.jsx` | Collectible chest markers |
| `RoadSign` | `RoadSign.jsx` | Directional waypoint marker |
| `WeatherOverlay` | `WeatherOverlay.jsx` | Rain/weather visual effects |

---

## 11. Color Tokens (CSS Variables)

```css
:root {
  /* Core */
  --umbra-black: #121212;
  --umbra-dark: #1e1e1e;
  --umbra-darker: #0a0a0a;
  
  /* Sanguine */
  --sanguine-red: #8B0000;
  --sanguine-bright: #CC0000;
  --sanguine-glow: rgba(139, 0, 0, 0.6);
  
  /* Aged Gold */
  --gold-primary: #C5A55A;
  --gold-dim: rgba(197, 165, 90, 0.4);
  --gold-glow: rgba(197, 165, 90, 0.2);
  
  /* POI Category Colors */
  --poi-rift: #FF0000;
  --poi-shop: #C5A55A;
  --poi-npc: #4A90D9;
  --poi-monster: #8B4513;
  --poi-dungeon: #800080;
  --poi-quest: #00CED1;
  --poi-treasure: #FFD700;
  --poi-fast-travel: #FF4500;
  
  /* Text */
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --text-dim: #666666;
  
  /* UI */
  --border-color: #333333;
  --border-subtle: #222222;
  --bg-overlay: rgba(10, 10, 10, 0.7);
}
```

---

## 12. Typography Scale

| Element | Font | Size | Weight | Color | Transform |
|---------|------|------|--------|-------|-----------|
| HUD Level Badge | Inter | 10px | 800 | `#fff` | none |
| HP/MP Text | Inter | 9px | 600 | `#fff` | none |
| POI Label | Inter | 10px | 600 | `#e0e0e0` | none |
| POI Popup Name | Cinzel | 14px | 600 | [ring color] | uppercase |
| POI Popup Level | Inter | 11px | 600 | `#a0a0a0` | none |
| Search Placeholder | Inter | 13px | 400 | `#666` | none |
| Search Input | Inter | 13px | 400 | `#e0e0e0` | none |
| Filter Chip | Inter | 10px | 600 | [chip color] | uppercase |
| Bottom Nav Label | Inter | 10px | 600 | [state color] | uppercase |
| Sidebar Icon | — | 28px | — | [state color] | — |
| Compass Cardinal | Cinzel | 8px | 800 | `#C5A55A` | none |

---

## 13. Animation & Transition Specs

| Animation | Property | Duration | Easing | Trigger |
|-----------|----------|----------|--------|---------|
| POI popup appear | transform, opacity | 200ms | ease-out | Tap POI |
| POI popup dismiss | opacity | 150ms | ease-in | Tap outside |
| POI pulse (quest) | box-shadow | 3000ms | ease-in-out | Active quest |
| Sidebar slide | transform | 300ms | ease-out | Swipe/hamburger |
| Sidebar backdrop | opacity | 300ms | ease-out | Swipe/hamburger |
| Player sway | transform | 4000ms | ease-in-out | Idle (loop) |
| Compass rotate | transform | 100ms | linear | Heading change |
| Ash particle | transform, opacity | 3000-5000ms | linear | Continuous |
| Fog wisp | transform | 8000-12000ms | linear | Continuous |
| Tab tap feedback | transform | 100ms | ease-out | Tap |
| Search expand | width, height | 200ms | ease-out | Focus |
| Weather rain | transform | 800ms | linear | Continuous (when active) |

---

## 14. Responsive Behavior

| Breakpoint | Width | Adjustments |
|------------|-------|-------------|
| Mobile (default) | 320-480px | Full layout as specified |
| Tablet | 481-768px | HUD full-width, map 60% right, sidebar 200px |
| Desktop | 769px+ | HUD compact, map full, sidebar always visible |

**Primary target: Mobile (480px max-width)** — Tablet/Desktop are stretch goals.

---

## 15. Asset Requirements

### SVG Icons Needed (Custom, Medieval Style)
1. Map icon (bottom nav)
2. Crossed swords (combat tab)
3. Pouch/bag (inventory tab)
4. Scroll (diary tab)
5. Gear/cog (settings tab)
6. Compass rose (HUD)
7. Player silhouette (knight)
8. Treasure chest (closed/open)
9. Road sign / waypost
10. Standing stone / obelisk
11. Lightning bolt (rift POI)
12. Beer mug (shop POI)
13. Hammer/anvil (forge POI)
14. Cross (sanctuary POI)
15. Wolf head (monster POI)
16. Skull (dungeon POI)
17. Flask (quest POI)
18. Coffin (cemetery POI)
19. Gem (treasure POI)
20. Portal spiral (fast travel POI)
21. Hamburger menu (sidebar)
22. Search magnifier
23. Filter chips (5 category icons)

### Image Assets Needed
- Character portrait placeholder (40×40, PNG with transparency)
- Map tile overlay texture (optional, for parchment effect)

---

## 16. Open Questions for Game Designer

| # | Question | Options | Impact |
|---|----------|---------|--------|
| 1 | **Fog of War style** | A: Black tiles / B: Gaussian blur | Performance, visual feel |
| 2 | **Fast Travel unlock** | A: Visit once / B: Complete quest at POI | Gameplay progression |
| 3 | **Party movement** | A: Real-time GPS / B: Turn-based steps | Core mechanic |
| 4 | **Weather effects** | A: Visual only / B: Gameplay impact (combat modifiers) | Scope, balance |
| 5 | **POI respawn** | A: Fixed locations / B: Random daily / C: Procedural | Map consistency |
| 6 | **Treasure chest loot** | A: Fixed per chest / B: Random from table / C: Level-scaled | Loot system |

---

## 17. Implementation Notes for UI Developer

1. **Map library:** Continue using React-Leaflet (already in codebase)
2. **Tile layer:** Keep CartoDB Dark Matter with existing hue-rotate filter
3. **POI data:** Hardcode the 12 POIs initially; later connect to game state API
4. **Fog of war:** Start with Option A (black tiles) for simplicity; blur can be added later
5. **Particles:** Use CSS animations only — no canvas, no heavy libraries
6. **Sidebar:** Implement as absolute-positioned overlay, not part of flex layout
7. **Safe area:** Use `env(safe-area-inset-bottom)` for iPhone notch
8. **Font loading:** Cinzel + Inter already imported in `index.css`
9. **Color tokens:** Use existing CSS variables, add new ones from Section 11
10. **Performance:** Limit visible POIs to 12, use `React.memo` for markers

---

## 18. Acceptance Criteria

- [ ] All 12 POIs visible with correct colors, icons, and labels
- [ ] HUD displays portrait, HP bar, mana bar, resource icons, compass
- [ ] Search bar with dual-line layout and filter chips functional
- [ ] Sidebar slides in/out with 6 icons
- [ ] Bottom nav has 5 tabs with active state indicator
- [ ] Player silhouette centered with idle animation
- [ ] Compass rose rotates with device heading
- [ ] Vignette overlay applied to map
- [ ] Ash/ember particles floating (5-8 specs)
- [ ] No neon/glow/RGB/cyberpunk elements anywhere
- [ ] All warm tones (sanguine, gold, amber)
- [ ] Responsive down to 320px width
- [ ] 60fps on mid-range mobile device
