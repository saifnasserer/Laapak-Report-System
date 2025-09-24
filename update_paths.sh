#!/bin/bash

# Script to update all file paths in HTML files after reorganization

echo "Updating HTML file paths..."

# Update image paths
find frontend/public -name "*.html" -exec sed -i 's|href="img/|href="../assets/images/|g' {} \;
find frontend/public -name "*.html" -exec sed -i 's|src="img/|src="../assets/images/|g' {} \;

# Update CSS paths
find frontend/public -name "*.html" -exec sed -i 's|href="css/|href="../../styles/|g' {} \;

# Update JS paths - need to be more specific based on location
# For pages in subdirectories, go up to root then into scripts
find frontend/public/pages -name "*.html" -exec sed -i 's|src="js/|src="../../scripts/|g' {} \;

# Update manifest path
find frontend/public -name "*.html" -exec sed -i 's|href="manifest.json"|href="../manifest.json"|g' {} \;

# Update service worker path
find frontend/public -name "*.html" -exec sed -i 's|src="service-worker.js"|src="../service-worker.js"|g' {} \;

echo "Path updates completed!"
