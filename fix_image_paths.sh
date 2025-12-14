#!/bin/bash

echo "Fixing all image paths after reorganization..."

# Fix logo.png references
find frontend -name "*.js" -exec sed -i 's|img/logo\.png|assets/images/logo.png|g' {} \;
find frontend -name "*.html" -exec sed -i 's|img/logo\.png|assets/images/logo.png|g' {} \;

# Fix cropped-Logo-mark.png.png references
find frontend -name "*.js" -exec sed -i 's|img/cropped-Logo-mark\.png\.png|assets/images/cropped-Logo-mark.png.png|g' {} \;
find frontend -name "*.html" -exec sed -i 's|img/cropped-Logo-mark\.png\.png|assets/images/cropped-Logo-mark.png.png|g' {} \;

# Fix image-error.png references
find frontend -name "*.js" -exec sed -i 's|img/image-error\.png|assets/images/image-error.png|g' {} \;
find frontend -name "*.html" -exec sed -i 's|img/image-error\.png|assets/images/image-error.png|g' {} \;

# Fix dashboard-illustration.svg references
find frontend -name "*.js" -exec sed -i 's|img/dashboard-illustration\.svg|assets/images/dashboard-illustration.svg|g' {} \;
find frontend -name "*.html" -exec sed -i 's|img/dashboard-illustration\.svg|assets/images/dashboard-illustration.svg|g' {} \;

# Fix screenshot references in manifest
find frontend -name "*.json" -exec sed -i 's|img/screenshots/|assets/images/screenshots/|g' {} \;

# Fix icon references in service worker
find frontend -name "*.js" -exec sed -i 's|/img/icons/|/assets/images/icons/|g' {} \;

# Fix any remaining img/ references to assets/images/
find frontend -name "*.js" -exec sed -i 's|img/|assets/images/|g' {} \;
find frontend -name "*.html" -exec sed -i 's|img/|assets/images/|g' {} \;

echo "All image paths fixed!"
