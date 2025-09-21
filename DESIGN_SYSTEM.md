# Laapak Report System - Design System & Brand Guidelines

## 🎨 Brand Identity

### Logo & Branding
- **Primary Logo**: `img/cropped-Logo-mark.png.png` (40px height in headers)
- **Company Name**: Laapak
- **Tagline**: "نظام تقارير Laapak" (Laapak Report System)
- **Industry**: Technology repair and service management

### Brand Personality
- **Professional**: Clean, modern interface design
- **Trustworthy**: Consistent green color scheme representing growth and reliability
- **User-Friendly**: Intuitive navigation with clear visual hierarchy
- **Bilingual**: Arabic-first design with RTL support

---

## 🎨 Color Palette

### Primary Colors
```css
/* Main Brand Colors */
--dark-green: #0a6e35        /* Primary brand color - headers, buttons */
--medium-green: #0eaf54      /* Secondary brand color - accents, hover states */
--light-green: #36d278       /* Tertiary brand color - success states, highlights */

/* Alternative Primary Variations */
--lpk-primary: #007553       /* Client interface primary */
--lpk-primary-dark: #004d35  /* Client interface dark variant */
--premium-primary: #0a6e35   /* Premium report styling */
--premium-dark: #0a3622      /* Premium dark variant */
```

### Secondary Colors
```css
/* Neutral Colors */
--dark-gray: #343a40         /* Primary text color */
--medium-gray: #666666       /* Secondary text color */
--light-gray: #f8f9fa        /* Background color */
--white: #ffffff             /* Pure white */

/* Status Colors */
--success-color: #28a745     /* Success states */
--danger-color: #dc3545      /* Error states, delete actions */
--warning-color: #ffc107     /* Warning states */
--info-color: #0dcaf0        /* Information states */
```

### Specialized Color Sets

#### Child-Friendly Theme
```css
--happy-green: #36d278       /* Fun, friendly green */
--friendly-blue: #4dabf7     /* Trustworthy blue */
--fun-yellow: #ffd43b        /* Playful yellow */
--gentle-purple: #cc5de8     /* Creative purple */
--soft-red: #ff8787          /* Gentle red for warnings */
```

#### Premium Theme
```css
--premium-gold: #d4af37      /* Luxury gold accent */
--premium-silver: #c0c0c0    /* Elegant silver */
--premium-charcoal: #333333  /* Sophisticated dark */
--premium-off-white: #f5f5f5 /* Soft background */
```

---

## 📝 Typography

### Font Family
```css
--font-primary: "Tajawal", "Segoe UI", sans-serif;
```

**Primary Font**: Tajawal (Google Fonts)
- **Weight**: 400 (Regular), 500 (Medium), 700 (Bold)
- **Usage**: All Arabic text, headings, body text
- **Fallback**: Segoe UI, system sans-serif

### Font Sizes & Hierarchy
```css
/* Headings */
h1: 2.8rem (44.8px) - Hero titles
h2: 2.25rem (36px) - Section titles  
h3: 1.75rem (28px) - Subsection titles
h4: 1.5rem (24px) - Card titles
h5: 1.25rem (20px) - Small headings
h6: 1rem (16px) - Micro headings

/* Body Text */
--text-large: 1.3rem (20.8px) - Hero descriptions
--text-normal: 1rem (16px) - Body text
--text-small: 0.9rem (14.4px) - Secondary text
--text-micro: 0.8rem (12.8px) - Captions, hints
```

### Text Colors
```css
--text-dark: #212529         /* Primary text */
--text-muted: #6c757d        /* Secondary text */
--text-light: rgba(255,255,255,0.9) /* Light text on dark backgrounds */
```

---

## 🧩 Component Library

### Buttons

#### Primary Button
```css
.btn-primary {
    background: linear-gradient(135deg, #007553 0%, #004d35 100%);
    border: none;
    border-radius: 50px;
    padding: 14px 20px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,117,83,0.3);
}
```

#### Secondary Button
```css
.btn-outline-primary {
    color: var(--medium-green);
    border-color: var(--medium-green);
    border-radius: 50px;
    background: transparent;
}

.btn-outline-primary:hover {
    background-color: var(--medium-green);
    color: white;
}
```

#### Circular Buttons
```css
.btn-circle {
    border-radius: 50% !important;
    width: 40px;
    height: 40px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
```

### Cards

#### Standard Card
```css
.card {
    border-radius: 8px;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}
```

#### Premium Card
```css
.premium-card {
    border-radius: 12px;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    padding: 1.5rem;
    transition: all 0.3s ease;
}
```

### Navigation

#### Header Navigation
```css
.header-navbar {
    background: linear-gradient(135deg, #0d964e 0%, #0a572b 100%);
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    border-radius: 16px;
}

.nav-link {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link:hover {
    transform: translateY(-2px) scale(1.05);
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
}
```

### Forms

#### Form Controls
```css
.form-control {
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    transition: all 0.3s ease;
}

.form-control:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem rgba(0, 117, 83, 0.15);
}
```

#### Input Groups
```css
.input-group-text {
    background-color: var(--medium-green);
    color: white;
    border-color: var(--medium-green);
}
```

---

## 🎭 Visual Effects

### Shadows
```css
--shadow-sm: 0 4px 16px rgba(0, 0, 0, 0.08)    /* Small shadows */
--shadow-md: 0 8px 32px rgba(0, 0, 0, 0.12)    /* Medium shadows */
--shadow-lg: 0 16px 64px rgba(0, 0, 0, 0.16)   /* Large shadows */
```

### Gradients
```css
/* Primary Gradient */
--gradient-primary: linear-gradient(135deg, #007553 0%, #00a67a 50%, #007553 100%);

/* Secondary Gradient */
--gradient-secondary: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%);

/* Header Gradient */
--header-gradient: linear-gradient(135deg, #0d964e 0%, #0a572b 100%);
```

### Border Radius
```css
--border-radius-sm: 8px      /* Small elements */
--border-radius-md: 12px     /* Medium elements */
--border-radius-lg: 16px     /* Large elements */
--border-radius-xl: 20px     /* Extra large elements */
--border-radius-full: 50px   /* Pills and buttons */
```

### Transitions
```css
--transition-fast: 0.2s ease
--transition-normal: 0.3s ease
--transition-slow: 0.5s ease
--transition-bounce: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
@media (max-width: 576px) { /* Small devices */ }
@media (max-width: 768px) { /* Medium devices */ }
@media (max-width: 992px) { /* Large devices */ }
@media (max-width: 1200px) { /* Extra large devices */ }
```

### Mobile Adaptations
- **Navigation**: Circular buttons reduce to 40px on mobile
- **Typography**: Font sizes scale down proportionally
- **Spacing**: Padding and margins reduce on smaller screens
- **Cards**: Stack vertically on mobile devices

---

## 🌍 Internationalization

### RTL Support
- **Direction**: `dir="rtl"` on HTML element
- **Bootstrap**: Uses Bootstrap RTL CSS
- **Text Alignment**: Right-aligned for Arabic content
- **Navigation**: Mirrored layout for RTL

### Language Support
- **Primary**: Arabic (العربية)
- **Secondary**: English (for technical terms)
- **Font**: Tajawal optimized for Arabic text

---

## 🎨 Theme Variations

### 1. Default Theme
- **Primary**: Dark green (#0a6e35)
- **Use Case**: Main application interface
- **Files**: `styles.css`, `custom-admin.css`

### 2. Client Theme
- **Primary**: Teal green (#007553)
- **Use Case**: Client-facing interfaces
- **Files**: `custom-client.css`

### 3. Child-Friendly Theme
- **Colors**: Bright, playful palette
- **Use Case**: Educational reports for children
- **Files**: `child-friendly.css`

### 4. Premium Theme
- **Colors**: Sophisticated dark greens with gold accents
- **Use Case**: High-end report presentations
- **Files**: `premium-report.css`

---

## 🛠️ Implementation Guidelines

### CSS Architecture
1. **Base Styles**: `styles.css` - Core design system
2. **Component Styles**: Specific component CSS files
3. **Theme Styles**: Theme-specific overrides
4. **Utility Classes**: Bootstrap + custom utilities

### Naming Conventions
- **CSS Variables**: `--laapak-*` or `--lpk-*` prefix
- **Component Classes**: `.component-name` (kebab-case)
- **Utility Classes**: `.utility-name` (kebab-case)
- **State Classes**: `.is-active`, `.has-error` (BEM-like)

### File Organization
```
css/
├── styles.css              # Core design system
├── custom-admin.css        # Admin interface styles
├── custom-client.css       # Client interface styles
├── child-friendly.css      # Child-friendly theme
├── premium-report.css      # Premium theme
├── form-steps.css          # Multi-step form styles
└── device-gallery.css      # Gallery component styles
```

---

## 🎯 Usage Examples

### Creating a New Button
```html
<button class="btn btn-primary">
    <i class="fas fa-plus me-2"></i>
    إضافة عنصر جديد
</button>
```

### Creating a Card
```html
<div class="card">
    <div class="card-header">
        <h4 class="mb-0">عنوان البطاقة</h4>
    </div>
    <div class="card-body">
        <p>محتوى البطاقة</p>
    </div>
</div>
```

### Using Color Variables
```css
.my-component {
    background-color: var(--medium-green);
    color: var(--white);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-sm);
}
```

---

## 📋 Checklist for New Components

### Design Consistency
- [ ] Uses established color palette
- [ ] Follows typography hierarchy
- [ ] Implements proper spacing (8px grid)
- [ ] Includes hover/focus states
- [ ] Supports RTL layout
- [ ] Responsive design implemented

### Accessibility
- [ ] Proper contrast ratios (4.5:1 minimum)
- [ ] Keyboard navigation support
- [ ] Screen reader friendly
- [ ] Focus indicators visible
- [ ] ARIA labels where needed

### Performance
- [ ] CSS optimized and minified
- [ ] Images optimized
- [ ] Animations use transform/opacity
- [ ] No layout thrashing

---

## 🔄 Maintenance

### Regular Updates
- **Quarterly**: Review color accessibility
- **Bi-annually**: Update component library
- **Annually**: Full design system audit

### Version Control
- **Major Changes**: Update version number
- **Breaking Changes**: Document migration guide
- **New Components**: Add to component library

---

## 📞 Support

For questions about the design system:
- **Documentation**: This file
- **Examples**: Check existing components
- **Updates**: Follow version control commits

---

*Last Updated: January 2025*
*Version: 1.0*
*Maintained by: Laapak Development Team*

