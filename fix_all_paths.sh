#!/bin/bash

echo "Fixing all file paths after reorganization..."

# Fix CSS paths in all HTML files
find frontend/public -name "*.html" -exec sed -i 's|href="../../styles/styles.css"|href="../../styles/base/styles.css"|g' {} \;

# Fix image paths - they should be relative to the HTML file location
find frontend/public/pages -name "*.html" -exec sed -i 's|href="../assets/images/|href="../../assets/images/|g' {} \;
find frontend/public/pages -name "*.html" -exec sed -i 's|src="../assets/images/|src="../../assets/images/|g' {} \;

# Fix JS paths for pages in subdirectories
find frontend/public/pages -name "*.html" -exec sed -i 's|src="../../scripts/|src="../../../scripts/|g' {} \;

# Fix manifest and service worker paths for pages in subdirectories
find frontend/public/pages -name "*.html" -exec sed -i 's|href="../manifest.json"|href="../../manifest.json"|g' {} \;
find frontend/public/pages -name "*.html" -exec sed -i 's|src="../service-worker.js"|src="../../service-worker.js"|g' {} \;

# Fix CSS paths for pages in subdirectories
find frontend/public/pages -name "*.html" -exec sed -i 's|href="../../styles/|href="../../../styles/|g' {} \;

echo "All paths fixed!"
