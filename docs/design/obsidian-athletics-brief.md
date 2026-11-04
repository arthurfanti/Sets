# Obsidian Athletics — Product Requirements Document (PRD) & Design Brief

## 1. Executive Summary & Vision
**Obsidian Athletics** is a sleek, dark-mode-first workout tracking and progressive overload application designed for serious strength trainees, athletes, and lifters. It combines high-density training logging with an immersive, atmospheric aesthetic ("Obsidian / Cyber-Athletics" with violet `#B26BFF` and neon magenta accents `#F72585` on deep charcoal `#0C0E11` / `#111317`).

The core value proposition is **zero-friction session execution** coupled with **deep progress analytics** and modular routine building.

---

## 2. Product Objectives & Target Audience
- **Target Audience:** Intermediate-to-advanced gym goers, strength athletes, and fitness enthusiasts who demand precise tracking of sets, reps, load, and 1RM progression without clutter.
- **Key Goals:**
  1. Streamline in-gym execution with rapid set completion and high contrast.
  2. Provide clear historical insights and 1RM / weekly volume tracking.
  3. Support flexible workout routine creation and customization.
  4. Deliver an engaging, premium visual experience with ambient lighting and tactile feedback.

---

## 3. Core Information Architecture & User Flows

### Flow 1: Routine Management & Discovery (`Rotinas`)
- **Predefined Routines:** Curated standard splits (e.g., "Rotina A — Peito e tríceps", "Rotina B — Costas e bíceps").
- **Custom Routines:** User-created splits with active status tags (e.g., "Minha rotina de pernas [ATIVA]").
- **Actions:** Quick start session, edit routine composition, or tap `+ Nova rotina` to create a fresh program.

### Flow 2: Live Workout Execution (`Execução — Rotina A`)
- **Active Timer & Header:** Real-time workout duration counter (e.g., `42:15`).
- **Exercise Cards:** Structured tables per movement displaying:
  - Set index, target load (`kg`), target reps, and quick completion toggles/checkboxes.
  - Active set highlight states (focused visual hierarchy).
- **Actions:** Primary `Finalizar` (Complete Workout) button and low-prominence `Descartar` (Discard) action.

### Flow 3: Progress & Exercise Analytics (`Progresso — Supino reto`)
- **Key Metrics Card:** "Melhor série" highlighting heaviest weight × reps and estimated 1RM (e.g., `100 kg × 8`, `1RM estimado 126 kg`).
- **Timeframe Filters:** Segmented control (`12 semanas` vs. `Tudo`).
- **Data Visualizations:**
  - Progression trend curve (neon magenta chart).
  - Weekly volume trend line.
- **Set History Log:** Chronological list of logged sets (date, weight, reps). Note: Set entry occurs strictly in live sessions, maintaining data integrity in history views.

### Flow 4: Session History (`Histórico`)
- **Timeline by Month:** Chronological logs grouped by month (Novembro, Outubro).
- **Session Cards:** Displays routine name, date, elapsed workout time, and total completed sets.

---

## 4. Design System & Visual Specification (`Obsidian Athletics`)

### 4.1 Color System
- **Background Base:** `surface-container-lowest` (`#0C0E11`) / `surface` (`#111317`)
- **Elevated Surfaces & Cards:** Glassmorphic translucent cards (`#1A1C1F` / `#22252A` with 60–80% opacity, 1px subtle border `#2E3238`).
- **Primary Accent:** Violet `#B26BFF` (used for primary actions, active tags, and focused states).
- **Secondary / Data Accent:** Neon Magenta `#F72585` (reserved for metric graphs, volume trends, and micro indicators).
- **Text & Contrast:** High contrast typography with `#FFFFFF` for primary values/headers, `#9BA1A6` for secondary metadata and units.

### 4.2 Typography & Sizing
- **Font Family:** Geist / Geist Mono for tabular numeric data (`kg × reps`).
- **Scales:**
  - Display/Headline: Bold sans-serif for exercise names and routine cards.
  - Numeric Big Numbers: `text-3xl` to `text-4xl` tabular weights for legibility during heavy lifts.
  - Labels & Microcopy: Uppercase tracking-wider (`font-label-sm`).

### 4.3 Visual Polish & Atmosphere
- Ambient radial flares (`#B26BFF` / `#F72585`) positioned in backgrounds for depth.
- Tactile pill buttons with soft top reflection highlights and glow dropshadows.
- Clean 8px border radii (`ROUND_EIGHT`) across containers and interactive elements.

---

## 5. Technical & Responsive Requirements
- **Platforms:** Responsive Web & PWA / Native Mobile shell (~390px viewport optimized, desktop responsive grid).
- **Offline First:** Session logging must persist locally during spotty gym connectivity.
- **Safe Area Insets:** Fixed bottom action bars respect device safe areas (`pb-safe`).

---

## 6. Roadmap & Next Deliverables
1. **Perfil & Metas:** User personal records (PRs), bodyweight log, and workout frequency calendar.
2. **Rest Timer HUD:** Floating countdown overlay between sets with audio/haptic alert.
3. **Plate Calculator:** Quick modal breaking down barbell load into standard plates (20kg, 15kg, 10kg, etc.).
