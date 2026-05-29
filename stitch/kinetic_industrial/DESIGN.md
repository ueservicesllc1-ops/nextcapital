---
name: Kinetic Industrial
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c4c9ac'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#8e9379'
  outline-variant: '#444933'
  surface-tint: '#abd600'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c3f400'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#bcc7de'
  on-secondary: '#263143'
  secondary-container: '#3e495d'
  on-secondary-container: '#aeb9d0'
  tertiary: '#ffffff'
  on-tertiary: '#283044'
  tertiary-container: '#dae2fd'
  on-tertiary-container: '#5c647a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.1em
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1440px
---

## Brand & Style

This design system is built for high-stakes technical environments where clarity, speed, and precision are paramount. The brand personality is unapologetically industrial, functional, and alert. It targets engineers, developers, and technicians who require immediate visual feedback and a low-friction interface.

The design style merges **Modern Minimalism** with **Technical Brutalism**. It utilizes heavy whitespace to isolate critical data points while employing aggressive, high-visibility accents to direct attention. The aesthetic is defined by its "dark mode first" philosophy, using deep slate tones to provide a non-distracting canvas for a piercing neon yellow primary accent. The emotional response is one of controlled urgency and absolute technical reliability.

## Colors

The palette is engineered for maximum contrast and reduced eye strain in low-light environments. 

- **Primary (#CCFF00):** A sharp, industrial neon yellow used exclusively for interactive elements, status indicators, and critical highlights. It must be used sparingly to maintain its "alert" utility.
- **Secondary / Surface (#1E293B):** A deep charcoal slate used for elevated containers, sidebars, and card surfaces.
- **Tertiary / Background (#0F172A):** A near-black navy slate used for the primary application background to provide maximum depth.
- **Neutral (#94A3B8):** A muted slate grey for secondary text and non-interactive iconography, ensuring the hierarchy remains focused on the primary accent.

## Typography

The typography strategy prioritizes legibility and a "built-in" technical feel. 

- **Geist** is used for all primary UI text and headings. Its clean, geometric sans-serif terminals provide a modern, developer-centric aesthetic that feels precise.
- **JetBrains Mono** is utilized for labels, data points, and status indicators. The monospaced nature reinforces the industrial narrative and ensures that numerical data aligns perfectly in tables and dashboards.
- Headings use tight letter-spacing and bold weights to command authority. Labels are frequently set in all-caps with increased tracking for maximum scannability.

## Layout & Spacing

This design system employs a **Fixed Grid** model within a flexible container. 

- **Desktop:** 12-column grid with 24px gutters. Content is centered with a max-width of 1440px. 
- **Tablet:** 8-column grid with 16px gutters. 
- **Mobile:** 4-column grid with 16px margins and 12px gutters.

Spacing follows a strict 8px linear scale. Large-scale padding (48px+) is used to separate major functional blocks, while tight spacing (8px-16px) is used within components to maintain a "high-density" information feel. Vertical rhythm is driven by the monospaced label heights to ensure a structured, tabular alignment across the entire UI.

## Elevation & Depth

Depth is achieved through **Tonal Layering** and **High-Contrast Outlines** rather than traditional shadows.

- **Level 0 (Background):** The base Tertiary color (#0F172A).
- **Level 1 (Surface):** The Secondary color (#1E293B), used for primary content cards.
- **Level 2 (Overlay):** A lighter slate (#334155), used for modals or floating menus.

To define boundaries, use 1px solid borders. For inactive elements, borders use a subtle slate. For active or focused elements, the border switches to the Primary Neon Yellow (#CCFF00). Shadows, if used at all, should be "Hard Shadows"—0px blur, 4px offset, in a semi-transparent black to mimic physical stacking without the softness of ambient light.

## Shapes

The shape language is strictly **Sharp (0px)**. 

Every UI element—from buttons and input fields to large container cards—features hard 90-degree angles. This reinforces the brutalist, industrial aesthetic and ensures that every pixel on the screen feels intentional and rigid. The only exception to this rule is circular geometry used for specific status "pips" or avatars, though even these should be encased in square containers where possible to maintain the structural grid.

## Components

- **Buttons:** Primary buttons are solid Neon Yellow (#CCFF00) with black text (#000000). Secondary buttons use a 1px Neon Yellow border with no fill and Neon Yellow text. Hover states should invert these or introduce a slight opacity shift.
- **Input Fields:** Deep charcoal background with a 1px slate border. On focus, the border transitions to Neon Yellow. Use JetBrains Mono for input text.
- **Chips / Tags:** Small, rectangular blocks. Active tags use the Primary color; inactive tags use a muted grey stroke.
- **Cards:** No shadows. Hard 1px borders (#334155). Header areas of cards should be separated by a horizontal rule.
- **Status Indicators:** Use the Neon Yellow for "Active" or "OK" status to signify visibility. For "Warning" or "Error," use high-chroma red or orange, but maintain the 1px sharp-border styling.
- **Data Tables:** Use zebra-striping with subtle slate variations. Headers should be all-caps JetBrains Mono with a bottom border in the Primary accent color.