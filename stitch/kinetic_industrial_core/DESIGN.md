---
name: Kinetic Industrial Core
colors:
  surface: '#121416'
  surface-dim: '#121416'
  surface-bright: '#38393c'
  surface-container-lowest: '#0c0e10'
  surface-container-low: '#1a1c1e'
  surface-container: '#1e2022'
  surface-container-high: '#282a2c'
  surface-container-highest: '#333537'
  on-surface: '#e2e2e5'
  on-surface-variant: '#dbc2ad'
  inverse-surface: '#e2e2e5'
  inverse-on-surface: '#2f3133'
  outline: '#a38d7a'
  outline-variant: '#554434'
  surface-tint: '#ffb86f'
  primary: '#ffc082'
  on-primary: '#4a2800'
  primary-container: '#ff9900'
  on-primary-container: '#653a00'
  inverse-primary: '#8a5100'
  secondary: '#c6c6c6'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b5b5b5'
  tertiary: '#cbccd2'
  on-tertiary: '#2e3135'
  tertiary-container: '#afb1b6'
  on-tertiary-container: '#414448'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcbd'
  primary-fixed-dim: '#ffb86f'
  on-primary-fixed: '#2c1600'
  on-primary-fixed-variant: '#693c00'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e1e2e8'
  tertiary-fixed-dim: '#c5c6cc'
  on-tertiary-fixed: '#191c20'
  on-tertiary-fixed-variant: '#44474b'
  background: '#121416'
  on-background: '#e2e2e5'
  surface-variant: '#333537'
typography:
  display-lg:
    fontFamily: Chivo
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-md:
    fontFamily: Chivo
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md-mobile:
    fontFamily: Chivo
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
spacing:
  unit: 4px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  panel-gap: 2px
---

## Brand & Style
The design system is engineered to evoke the raw power of high-density compute and industrial energy production. Moving away from generic "digital finance" aesthetics, this system adopts a **Technological Industrialism** style. It prioritizes the feeling of physical infrastructure, transparency through data density, and the unyielding strength of cloud mining hardware.

The target audience consists of sophisticated miners and institutional investors who value hardware-level reliability over marketing fluff. The UI should feel like a high-performance control interface—tactile, utilitarian, and authoritative.

**Key Aesthetic Pillars:**
- **Industrial Utility:** Focus on structural integrity, heavy borders, and functional hierarchy.
- **High-Tech Precision:** Monospaced data points and sharp technical details.
- **Power & Energy:** A high-contrast color strategy that mimics industrial caution signage and high-voltage environments.

## Colors
The palette is rooted in a "Deep Slate" foundation, providing a heavy, low-reflectivity base that mimics weathered steel and carbon housing.

- **Primary (Vibrant Orange):** Used exclusively for high-energy actions, active power states, and primary navigation highlights. It represents the heat and energy of mining.
- **Accent (Neon Yellow):** Reserved for "Caution" states, live data tickers, and industrial warnings.
- **Base (Deep Slate/Neutrals):** A range of cool, dark greys that provide a non-distracting background for complex data visualization.
- **Tonal Logic:** Use `#1A1D21` for elevated surfaces (control modules) and `#0D0F11` for the main background to create a "recessed panel" effect.

## Typography
Typography is split between aggressive, high-impact headlines and clinical, technical data labels.

- **Headlines (Chivo):** A heavy, authoritative sans-serif that commands attention. Use tight letter spacing for a dense, "stamped" industrial look.
- **Body (Hanken Grotesk):** Provides high legibility for technical descriptions and documentation.
- **Data & Accents (JetBrains Mono):** All hash rates, wallet addresses, and real-time metrics must use this monospaced font to maintain the "control panel" aesthetic and ensure numerical alignment in tables.

## Layout & Spacing
The layout follows a **Rigid Grid** model, simulating the physical assembly of rack-mounted hardware.

- **Modular Panels:** Content should be housed in clearly defined "modules" or "racks."
- **Panel Gap:** Use a minimal 2px gap between adjacent modules with heavy borders to create a "bolted together" appearance.
- **Data Density:** Information density should be high. Avoid excessive whitespace; instead, use structural borders and tonal shifts to differentiate sections.
- **Responsive Behavior:** On mobile, modules stack vertically, but maintain their "framed" appearance. Desktop layouts should utilize a 12-column grid to allow for complex multi-paneled dashboards.

## Elevation & Depth
This design system avoids soft ambient shadows in favor of **Tonal Layering and Inset Depths**.

- **Recessed Surfaces:** The main background is the deepest layer. UI modules should appear slightly elevated via `1px` solid borders (using `surface_border_hex`).
- **Tactile Insets:** Input fields and data readouts should use "inset" styling (inner shadows or darker fills) to look like they are carved into the control panel.
- **No Blurs:** Avoid glassmorphism. Use solid, opaque surfaces to reinforce the feeling of physical industrial equipment.
- **Active States:** Instead of shadows, use "Glow" effects (outer glows) using the primary orange color to simulate lit LED indicators on a machine.

## Shapes
The shape language is strictly **Sharp (0px)**.

- **Zero Radius:** All buttons, cards, and input fields must have 90-degree corners. This reinforces the industrial, machined-metal aesthetic.
- **Angled Accents:** Use 45-degree "clipped corners" for decorative elements or status badges to simulate safety markings or heavy-duty machinery plates.
- **Heavy Strokes:** Use 2px borders for primary containers to give them a sense of weight and physical presence.

## Components
- **Industrial Buttons:** Sharp corners, 2px solid borders. Hover states should feature a full background fill of the primary orange with black text, mimicking a lit-up physical toggle.
- **Data Readouts:** Containers for metrics (Hashrate, Temp) should have a JetBrains Mono label in the top-left corner, separated by a thin horizontal line.
- **Progress Bars:** Use segmented "LED-style" blocks instead of a continuous fluid bar. Each segment represents power load or mining progress.
- **Status Indicators:** Small square "LEDs." Green for "Online," Pulsing Orange for "Processing," and Neon Yellow for "Maintenance."
- **Input Fields:** Darker background than the container, 1px border, monospaced text entry.
- **Toggle Switches:** Square, chunky toggles that look like physical breakers or industrial rocker switches.
- **Mining Racks (Cards):** Grouped data modules that represent individual mining units, featuring high-contrast headers and technical spec labels.