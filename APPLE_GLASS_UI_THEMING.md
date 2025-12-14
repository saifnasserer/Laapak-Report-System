# Apple Glass UI Theming Guide
## Laapak Report System - Design System Documentation

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Glass Morphism Effects](#glass-morphism-effects)
5. [Spacing & Layout](#spacing--layout)
6. [Components](#components)
7. [Animations & Transitions](#animations--transitions)
8. [Responsive Design](#responsive-design)
9. [Accessibility](#accessibility)
10. [Implementation Guidelines](#implementation-guidelines)

---

## Design Philosophy

### Core Principles

1. **Transparency & Depth**
   - Use translucent elements with backdrop blur to create visual hierarchy
   - Multiple layers create depth perception
   - Background content subtly visible through glass surfaces

2. **Minimalism**
   - Clean, uncluttered interfaces
   - Focus on essential elements
   - Generous white space

3. **Fluid Motion**
   - Smooth, natural animations
   - Micro-interactions enhance user experience
   - Transitions feel organic and responsive

4. **Elegance**
   - Refined aesthetics inspired by Apple's design language
   - Premium feel without being ostentatious
   - Attention to subtle details

5. **Consistency**
   - Unified visual language across all components
   - Predictable interactions
   - Cohesive brand experience

---

## Color System

### Primary Palette

```css
/* Base Colors */
--glass-bg-primary: rgba(255, 255, 255, 0.1);
--glass-bg-secondary: rgba(255, 255, 255, 0.05);
--glass-bg-elevated: rgba(255, 255, 255, 0.15);

/* Brand Colors (Laapak Green) */
--brand-primary: #007AFF;        /* Apple Blue - Primary Actions */
--brand-secondary: #34C759;      /* Apple Green - Success/Positive */
--brand-accent: #FF9500;         /* Apple Orange - Accent/Warning */

/* Neutral Colors */
--text-primary: rgba(0, 0, 0, 0.85);
--text-secondary: rgba(0, 0, 0, 0.65);
--text-tertiary: rgba(0, 0, 0, 0.45);
--text-inverse: rgba(255, 255, 255, 0.95);

/* Background Gradients */
--bg-gradient-light: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
--bg-gradient-warm: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
--bg-gradient-cool: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
--bg-gradient-dark: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
```

### Glass Surface Colors

```css
/* Light Glass Surfaces */
--glass-light: rgba(255, 255, 255, 0.7);
--glass-light-border: rgba(255, 255, 255, 0.18);
--glass-light-shadow: rgba(0, 0, 0, 0.1);

/* Dark Glass Surfaces */
--glass-dark: rgba(0, 0, 0, 0.3);
--glass-dark-border: rgba(255, 255, 255, 0.1);
--glass-dark-shadow: rgba(0, 0, 0, 0.3);
```

### Semantic Colors

```css
/* Status Colors */
--success: #34C759;
--warning: #FF9500;
--error: #FF3B30;
--info: #007AFF;

/* Interactive States */
--hover-overlay: rgba(0, 0, 0, 0.05);
--active-overlay: rgba(0, 0, 0, 0.1);
--focus-ring: rgba(0, 122, 255, 0.4);
```

---

## Typography

### Font Stack

```css
--font-primary: -apple-system, BlinkMacSystemFont, "SF Pro Display", 
                "SF Pro Text", "Helvetica Neue", "Segoe UI", 
                "Tajawal", sans-serif;
--font-mono: "SF Mono", "Monaco", "Menlo", "Courier New", monospace;
```

### Type Scale

```css
/* Display */
--text-display-1: 3.5rem;      /* 56px - Hero Headlines */
--text-display-2: 3rem;        /* 48px - Section Headlines */
--text-display-3: 2.5rem;       /* 40px - Large Headlines */

/* Headings */
--text-h1: 2rem;               /* 32px - Page Titles */
--text-h2: 1.75rem;             /* 28px - Section Titles */
--text-h3: 1.5rem;              /* 24px - Subsection Titles */
--text-h4: 1.25rem;             /* 20px - Card Titles */
--text-h5: 1.125rem;            /* 18px - Small Headings */
--text-h6: 1rem;                /* 16px - Tiny Headings */

/* Body */
--text-body-large: 1.125rem;    /* 18px - Large Body */
--text-body: 1rem;              /* 16px - Standard Body */
--text-body-small: 0.875rem;    /* 14px - Small Body */
--text-caption: 0.75rem;        /* 12px - Captions, Labels */

/* Line Heights */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Font Weights

```css
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

---

## Glass Morphism Effects

### Backdrop Filters

```css
/* Standard Glass */
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);

/* Heavy Glass (More Opaque) */
backdrop-filter: blur(30px) saturate(200%);
-webkit-backdrop-filter: blur(30px) saturate(200%);

/* Light Glass (More Transparent) */
backdrop-filter: blur(10px) saturate(150%);
-webkit-backdrop-filter: blur(10px) saturate(150%);
```

### Glass Surface Properties

```css
/* Base Glass Card */
.glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 20px;
    box-shadow: 
        0 8px 32px 0 rgba(31, 38, 135, 0.37),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
}

/* Elevated Glass (Floating Effect) */
.glass-elevated {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(30px) saturate(200%);
    -webkit-backdrop-filter: blur(30px) saturate(200%);
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: 
        0 20px 60px 0 rgba(31, 38, 135, 0.5),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.4);
}
```

### Border & Shadow Patterns

```css
/* Subtle Border */
border: 1px solid rgba(255, 255, 255, 0.18);

/* Stronger Border */
border: 1.5px solid rgba(255, 255, 255, 0.3);

/* Multi-layer Shadow */
box-shadow: 
    0 8px 32px 0 rgba(31, 38, 135, 0.37),    /* Outer shadow */
    inset 0 1px 0 0 rgba(255, 255, 255, 0.3); /* Inner highlight */
```

---

## Spacing & Layout

### Spacing Scale

```css
--space-xs: 0.25rem;    /* 4px */
--space-sm: 0.5rem;     /* 8px */
--space-md: 1rem;       /* 16px */
--space-lg: 1.5rem;     /* 24px */
--space-xl: 2rem;       /* 32px */
--space-2xl: 3rem;      /* 48px */
--space-3xl: 4rem;      /* 64px */
--space-4xl: 6rem;      /* 96px */
```

### Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

### Container Widths

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

---

## Components

### Login Card

```css
.login-card {
    /* Glass Properties */
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(30px) saturate(180%);
    -webkit-backdrop-filter: blur(30px) saturate(180%);
    
    /* Structure */
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 24px;
    padding: 3rem;
    max-width: 480px;
    width: 100%;
    
    /* Shadows */
    box-shadow: 
        0 20px 60px 0 rgba(31, 38, 135, 0.4),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.3);
    
    /* Animation */
    animation: fadeInUp 0.6s ease-out;
}
```

### Input Fields

```css
.glass-input {
    /* Background */
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    
    /* Border */
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    
    /* Typography */
    color: var(--text-primary);
    font-size: var(--text-body);
    
    /* Transitions */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-input:focus {
    background: rgba(255, 255, 255, 0.2);
    border-color: var(--brand-primary);
    box-shadow: 
        0 0 0 4px rgba(0, 122, 255, 0.1),
        0 4px 12px rgba(0, 122, 255, 0.15);
    outline: none;
}

.glass-input::placeholder {
    color: var(--text-tertiary);
}
```

### Buttons

```css
.glass-button {
    /* Base */
    background: rgba(0, 122, 255, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    
    /* Structure */
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 0.875rem 2rem;
    
    /* Typography */
    color: white;
    font-weight: var(--font-weight-semibold);
    font-size: var(--text-body);
    
    /* Effects */
    box-shadow: 
        0 4px 12px rgba(0, 122, 255, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    
    /* Interaction */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
}

.glass-button:hover {
    background: rgba(0, 122, 255, 0.9);
    transform: translateY(-2px);
    box-shadow: 
        0 8px 20px rgba(0, 122, 255, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.glass-button:active {
    transform: translateY(0);
    box-shadow: 
        0 2px 8px rgba(0, 122, 255, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
```

### Background Patterns

```css
/* Animated Gradient Background */
.glass-background {
    background: linear-gradient(
        135deg,
        #667eea 0%,
        #764ba2 25%,
        #f093fb 50%,
        #4facfe 75%,
        #00f2fe 100%
    );
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
}

.glass-background::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
        radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(120, 200, 255, 0.3) 0%, transparent 50%);
    animation: float 20s ease-in-out infinite;
}
```

---

## Animations & Transitions

### Keyframe Animations

```css
/* Fade In Up */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Gradient Shift */
@keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* Float */
@keyframes float {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(30px, -30px) rotate(120deg); }
    66% { transform: translate(-20px, 20px) rotate(240deg); }
}

/* Pulse */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

/* Shimmer */
@keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
}
```

### Transition Timing

```css
/* Standard */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Fast */
transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

/* Slow */
transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);

/* Spring */
transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## Responsive Design

### Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Mobile Optimizations

```css
@media (max-width: 768px) {
    .login-card {
        padding: 2rem 1.5rem;
        border-radius: 20px;
    }
    
    .glass-input {
        padding: 0.875rem 1rem;
        font-size: 16px; /* Prevents zoom on iOS */
    }
    
    .glass-button {
        padding: 1rem 1.5rem;
        width: 100%;
    }
}
```

---

## Accessibility

### Contrast Ratios

- **Text on Glass**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Interactive Elements**: Minimum 3:1 contrast ratio
- **Focus Indicators**: Clear, visible focus rings

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Focus states clearly visible
- Logical tab order

### Screen Readers

- Proper ARIA labels
- Semantic HTML structure
- Descriptive alt text for images

---

## Implementation Guidelines

### Browser Support

- **Modern Browsers**: Full support (Chrome 76+, Safari 9+, Firefox 103+)
- **Fallbacks**: Solid backgrounds for browsers without backdrop-filter support

### Performance

- Use `will-change` sparingly
- Prefer `transform` and `opacity` for animations
- Debounce scroll/resize handlers
- Lazy load heavy effects

### Best Practices

1. **Layer Management**: Use z-index consistently
2. **Blur Performance**: Limit blur radius (10-30px optimal)
3. **Color Opacity**: Keep glass backgrounds between 0.1-0.3 for readability
4. **Border Thickness**: 1-2px for subtle definition
5. **Shadow Depth**: Use multiple shadow layers for depth

---

## Component Examples

### Complete Login Page Structure

```html
<div class="glass-background">
    <div class="container">
        <div class="login-card">
            <h1 class="glass-heading">Welcome Back</h1>
            <form class="glass-form">
                <div class="glass-input-group">
                    <input type="text" class="glass-input" placeholder="Username">
                </div>
                <div class="glass-input-group">
                    <input type="password" class="glass-input" placeholder="Password">
                </div>
                <button type="submit" class="glass-button">Sign In</button>
            </form>
        </div>
    </div>
</div>
```

---

## Version History

- **v1.0.0** (2025-01-XX): Initial Apple Glass UI theme implementation
  - Login page redesign
  - Core glass morphism components
  - Responsive design system

---

## References

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Glassmorphism Design Trend](https://glassmorphism.com/)
- [CSS Backdrop Filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [Apple Design Resources](https://developer.apple.com/design/resources/)

---

**Last Updated**: January 2025
**Maintained By**: Laapak Development Team

