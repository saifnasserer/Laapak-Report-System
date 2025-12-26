# Laapak Client App

## UI / UX Design Brief

---

## 1. Design Vision

The Laapak Client App should feel **calm, intelligent, and trustworthy** with a strong local identity.

The application will be **Arabic-first** in language, layout, and tone.
Design decisions must respect Arabic reading flow (RTL), clarity, and cultural familiarity.

The overall look & interaction feel is inspired by **DeepSeek UI** in terms of:

* Calm interactions
* Minimal visual noise
* Content-first layout

> The app must feel professional and reassuring, not flashy or sales-driven.

---

## 2. Core Design Principles

### 2.1 Clarity Over Decoration

* Every screen has one primary purpose
* Avoid unnecessary visual noise
* White space is intentional, not empty

### 2.2 Calm Confidence

* No aggressive colors
* No alert-heavy UI
* Balanced contrast to reduce eye strain

### 2.3 Guided Interaction

* The UI should gently guide the user step-by-step
* Use motion and transitions to show hierarchy, not to impress

### 2.4 Trust-Centered Design

* Clear language
* No hidden actions
* Transparent flows (especially around reports and add-ons)

---

## 3. Visual Style

### 3.1 Color System (Official Laapak Brand Colors)

This color system strictly follows Laapak Brand Guidelines.
No additional brand colors are allowed.

---

#### Primary Brand Color

**Laapak Green Gradient (Core Identity)**

* The only brand color used for emphasis
* Derived from official Laapak logo

Usage:

* Primary buttons
* Key confirmations
* Selected states
* Brand highlights

Rules:

* Use gradients only in small, intentional areas
* Never use gradient as full-screen background
* Avoid over-saturation

---

#### Base Colors

**White (#FFFFFF)**

* Primary background color
* Default screen background

**Black / Near Black**

* Used for:

  * Headers
  * Dark sections
  * Dark mode backgrounds

---

#### Neutral System

**Dark Gray**

* Primary text color

**Medium Gray**

* Secondary text
* Helper text

**Light Gray**

* Dividers
* Card borders
* Disabled states

---

#### Functional States

**Green (Solid tone from brand gradient)**

* Success states
* Active warranty

**Yellow-Green (Muted)**

* Near-expiry warranty warnings

**Red**

* Errors and expired warranty only
* Very limited usage

---

#### Color Discipline Rules

* One brand color per screen maximum
* Neutral tones dominate UI
* Color supports meaning, not decoration

---

#### Primary Brand Colors

**Laapak Green Gradient (Core Identity)**

* The primary brand expression of Laapak
* Used for:

  * Primary CTAs
  * Progress states (warranty, steps)
  * Key brand moments (success, confirmation)

Rules:

* Gradient is allowed only in controlled components (buttons, badges, highlights)
* Never use gradient as full-screen background
* Gradient direction should remain consistent across the app

---

#### Base Colors

**Pure Black / Near Black**

* Used for:

  * Dark mode backgrounds
  * Emphasis sections
  * Premium moments

**Pure White**

* Main background for light mode
* Primary surface color

---

#### Neutral Palette

**Dark Gray**

* Primary text color (preferred over pure black)

**Mid Gray**

* Secondary text, metadata, hints

**Light Gray**

* Dividers, input borders, card backgrounds

---

#### System & Status Colors

**Green (Solid Variant)**

* Success states
* Warranty active

**Yellow-Green / Amber**

* Near-expiry warnings
* Requires attention (non-critical)

**Red (Very Limited Use)**

* Critical errors only
* Warranty expired

---

Usage Rules:

* Neutral colors must dominate the UI
* One emotional color per screen maximum
* Brand color supports content, never competes with it

---

#### Primary Brand Colors

**Laapak Green Gradient (Signature)**

* Used sparingly for:

  * Primary CTAs
  * Key highlights
  * Brand moments (confirmation, onboarding completion)

Guideline:

* Prefer vertical or subtle diagonal gradients
* Never use harsh or high-saturation gradients in large UI areas
* Avoid using gradients for background fills of long screens

---

#### Base Colors

**Black / Near Black**

* Used for:

  * Dark mode backgrounds
  * Premium sections
  * Brand-heavy screens

**White**

* Primary background color for light mode
* Creates clarity and breathing space

---

#### Neutral System

**Dark Gray**

* Primary text color
* Used instead of pure black for readability

**Medium Gray**

* Secondary text
* Metadata and labels

**Light Gray**

* Card backgrounds
* Dividers
* Input borders

---

#### Functional Colors

**Green (Solid)**

* Success states
* Warranty active indicators
* Confirmed actions

**Amber / Yellow-Green**

* Near-expiry warnings
* Attention without urgency

**Red**

* Critical issues only
* Errors, expired warranty
* Must be used minimally

---

#### Usage Principles

* Color supports hierarchy, never replaces it
* Text readability takes priority over brand expression
* One dominant color per screen maximum
* Neutral colors must dominate most screens

> The interface should feel professional and calm, not decorative or promotional.

---

### 3.2 Typography (Brand-Aligned)

Typography must strictly follow Laapak Brand Guidelines.

---

#### Arabic (Primary Language)

**Font Family:** Noto Sans Arabic

Weights:

* Regular (Body text)
* Medium (Labels)
* Semi-Bold (Headings)
* Bold (Critical highlights only)

Line Height:

* Comfortable spacing for long Arabic reading

---

#### English (Secondary – if needed)

**Font Family:** BDO Grotesk

Usage:

* Technical terms
* Serial numbers
* Model names

---

#### Typography Rules

* Arabic-first layouts (RTL enforced)
* No all-caps
* Clear hierarchy through weight, not color
* Avoid decorative fonts completely

---

#### Primary Typeface (English)

**BDO Grotesk**

* Used for:

  * Headings
  * Body text
  * UI labels (English)

Weights:

* Regular
* Medium
* Semi-Bold
* Bold

---

#### Arabic Typeface

**Noto Sans Arabic**

* Used exclusively for Arabic content
* Matches the tone and readability of the Latin type system

Weights:

* Regular
* Medium
* Semi-Bold
* Bold

---

#### Typography Rules

* Never mix fonts randomly
* No decorative fonts
* Maintain consistent hierarchy
* Avoid condensed or playful styles
* Respect minimum font sizes defined by accessibility

---

## 4. Layout & Spacing

### 4.1 Grid & Structure

* 8px spacing system
* Consistent padding across screens
* Card-based layout for grouping information

### 4.2 Cards Design

* Soft radius (12–16px)
* Minimal shadow or subtle border
* Cards should feel touch-friendly, not boxed

---

## 5. Interaction Design (DeepSeek-Inspired)

### 5.1 Motion Philosophy

* Motion explains hierarchy and flow
* No decorative animations

Examples:

* Fade + slide transitions between steps
* Expand/collapse cards smoothly
* Button feedback with subtle scale or opacity

---

### 5.2 Buttons

**Primary Button**

* Filled with Laapak Green Gradient
* Rounded corners (consistent radius)
* White text for maximum contrast

**Secondary Button**

* Text or outline style
* Neutral gray color

**Disabled State**

* Reduced opacity
* No gradient

Rules:

* Only one primary action per screen
* Buttons must never look aggressive

---

## 6. Report Step 5 Experience 
starting by asking a question - do u have any notes ? if yes send a measage throw whatsapp while no show this flow
### Screen A: Device Care Guidelines

**Feel:** Advisory, calm, expert-like

**Layout:**

* Vertical list of care tips
* Icon + title + short explanation

**Tone:**

* Informative, not alarming

Example copy:

> "Regular screen cleaning helps preserve display quality over time."

Primary action:

* "I understand" button (soft emphasis)

---

### Screen B: Recommended Add-ons

**Feel:** Logical continuation, not a store

**Layout:**

* Card per accessory
* Each card references a care tip implicitly

**Design Rules:**

* No price emphasis initially
* Benefits before features
* Optional by default

CTA Examples:

* "Add to my order"
* "Skip for now"

---

## 7. Microcopy Guidelines

* Use human language
* Avoid technical jargon unless necessary
* Prefer reassurance

Examples:
✅ "Your warranty is active"
❌ "Warranty status: valid"

✅ "You’re all set"
❌ "Process completed"

---

## 8. Icons & Imagery

* Use simple line icons
* Avoid illustrations unless they serve clarity
* Icons should support text, not replace it

---

## 9. Accessibility & Arabic UX Considerations

* Full RTL layout support
* Proper Arabic numerals handling
* Minimum contrast ratios applied
* Text scalable via OS settings
* Touch targets ≥ 44px
* Avoid truncated Arabic text

---

## 10. Design Do & Don’t

### Do

* Keep screens focused
* Let content breathe
* Guide users gently

### Don’t

* Overuse color
* Overexplain
* Force actions
* Mimic e-commerce patterns

---

## 11. Success Criteria (Design)

* Users understand key actions without explanation
* First-time experience feels helpful, not salesy
* Navigation is intuitive within first use
* Design reinforces Laapak’s professional image

---

## 12. Notes for Designers & Developers

This document is a **design compass**, not a pixel-perfect spec.
Final UI components should follow this spirit when implemented in Flutter.

Consistency matters more than creativity.
Clarity matters more than cleverness.
