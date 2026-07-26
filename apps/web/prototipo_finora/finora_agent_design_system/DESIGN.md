---
name: Finora Agent Design System
colors:
  surface: '#f8fafa'
  surface-dim: '#d8dadb'
  surface-bright: '#f8fafa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f4'
  surface-container: '#eceeef'
  surface-container-high: '#e6e8e9'
  surface-container-highest: '#e0e3e3'
  on-surface: '#191c1d'
  on-surface-variant: '#3f484a'
  inverse-surface: '#2d3132'
  inverse-on-surface: '#eff1f1'
  outline: '#6f797a'
  outline-variant: '#bec8ca'
  surface-tint: '#186872'
  primary: '#00444b'
  on-primary: '#ffffff'
  primary-container: '#015d67'
  on-primary-container: '#8ed3df'
  inverse-primary: '#8cd2dd'
  secondary: '#00696c'
  on-secondary: '#ffffff'
  secondary-container: '#73f2f7'
  on-secondary-container: '#006e71'
  tertiary: '#004541'
  on-tertiary: '#ffffff'
  tertiary-container: '#005f59'
  on-tertiary-container: '#7cd9d0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a8eefa'
  primary-fixed-dim: '#8cd2dd'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f57'
  secondary-fixed: '#76f5fa'
  secondary-fixed-dim: '#56d9de'
  on-secondary-fixed: '#002021'
  on-secondary-fixed-variant: '#004f52'
  tertiary-fixed: '#96f3ea'
  tertiary-fixed-dim: '#79d6cd'
  on-tertiary-fixed: '#00201e'
  on-tertiary-fixed-variant: '#00504b'
  background: '#f8fafa'
  on-background: '#191c1d'
  surface-variant: '#e0e3e3'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin-desktop: 40px
  container-margin-mobile: 20px
  gutter: 24px
  card-padding: 24px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is engineered for a next-generation fintech experience where human-centric AI meets rigorous financial intelligence. The brand personality is **Intelligent, Helpful, and Goal-Oriented**, manifesting through a visual language that balances professional stability with a futuristic, approachable warmth.

This system utilizes a **Modern Corporate** style infused with **Glassmorphism** and **Tactile** elements. We employ soft, rounded containers to reduce cognitive load and high-fidelity 3D illustrations to personify the AI agent. The aesthetic is defined by "Luminous Depth"—using subtle glows and soft gradients to highlight AI-driven insights and recommendations, ensuring the agent presence feels integrated rather than intrusive.

## Colors

The color strategy uses a monochromatic spectrum of greens to establish a sense of growth, wealth, and safety. 

- **Primary Deep (Forest Green):** Used for structural elements, deep backgrounds, and high-level navigation to provide a grounded, authoritative feel.
- **Primary Action (Kelly Green):** Reserved for core interactions, primary buttons, and active states. It represents the "Go" signal in the user's financial journey.
- **Secondary/Accent (Mint):** Applied to AI suggestions, chat bubbles, and interactive data points.
- **Success/Highlight (Pistachio):** Specifically for positive growth indicators, "completed" states, and soft background fills for success cards.
- **Neutrals:** A custom range of blue-tinted grays ensures that even the "white" space feels cohesive with the forest-green brand identity.

## Typography

The typography system pairs **Montserrat** for headlines to provide a bold, geometric confidence, with **Inter** for body text and data to ensure maximum legibility at small sizes.

For data visualization, we prioritize font weight over size to create hierarchy without cluttering the screen. All "Display" and "Headline" roles use a slight negative letter spacing to feel tighter and more modern. Labels and captions use a slightly increased letter spacing to remain legible against tinted backgrounds.

## Layout & Spacing

This design system uses a **Fluid Grid** model with a base-8 rhythmic scale. 

- **Desktop:** 12-column grid with 24px gutters. Content is housed in "Soft Cards" that can span multiple columns. 
- **Tablet:** 8-column grid with 20px gutters.
- **Mobile:** 4-column grid with 16px gutters.

Spacing is designed to be "airy" to reflect the clean and helpful brand personality. Large vertical stacks (`stack-lg`) are used between different data sections, while tighter stacks (`stack-sm`) are used for grouping related input fields or chat message threads.

## Elevation & Depth

Visual hierarchy is achieved through a mix of **Tonal Layers** and **Ambient Shadows**.

1.  **Level 0 (Base):** Neutral G02 (`#FCFCFC`) or Forest Green (`#015D67`) for the main canvas.
2.  **Level 1 (Cards):** Soft cards use a white background with a very subtle, diffused shadow (0px 4px 20px rgba(0, 0, 0, 0.04)).
3.  **Level 2 (Active/Floating):** Modals, dropdowns, and active chat bubbles use a higher elevation shadow (0px 12px 32px rgba(1, 93, 103, 0.12)) to pop against the background.
4.  **AI Layer:** Elements recommended by the AI agent utilize a "Mint Glow"—a subtle outer glow effect (`#87E4DB` at 30% opacity) to signify intelligence and focus.

## Shapes

The shape language is primarily **Rounded (Level 2)** to convey approachability and "softness" in a typically rigid financial sector.

- **Small Components (Buttons, Chips):** 0.5rem (8px).
- **Large Components (Cards, Modals):** 1.5rem (24px).
- **AI Chat Bubbles:** Asymmetric rounding (24px on three corners, 4px on the anchor corner) to distinguish between agent and user.

## Components

### AI Agent & Chat
- **Chat Bubbles:** The AI's messages use a Mint (`#87E4DB`) soft gradient background. The user's messages are Kelly Green (`#00ACB1`) with white text.
- **Agent Presence:** The 3D character should be placed in a "floating" container with a frosted glass background when providing advice.

### Buttons & Inputs
- **Primary Button:** Kelly Green background, white Montserrat SemiBold text. 8px corner radius.
- **Secondary Button:** Forest Green outline, 1.5px border, Forest Green text.
- **Input Fields:** Soft gray background (`#F4F7F7`) with a 1px border that turns Kelly Green on focus. Labels are Inter Medium 14px.

### Data Visualization
- **Progress Trackers:** Use rounded "capsule" bars. The background track is Pistachio (`#CAF0C1`) at 20% opacity, and the progress fill is Kelly Green.
- **Charts:** Use smooth, curved lines (Bezier) rather than jagged points. Areas under curves should use a soft gradient from Mint to Transparent.

### Cards
- **Soft Cards:** White background, 24px padding, 24px corner radius. Include a 1px soft border in `#E0EAEB` to maintain definition on white backgrounds.