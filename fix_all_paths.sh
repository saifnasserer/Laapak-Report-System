#!/bin/bash

echo "Fixing all file paths after reorganization..."

# Fix CSS paths in all HTML files
find frontend/public -name "*.html" -exec sed -i 's|href="../../styles/styles.css"|href="../../styles/base/styles.css"|g' {} \;

# Fix image paths - they should be relative to the HTML file location
find frontend/public/pages -name "*.html" -exec sed -i 's|href="../assets/images/|href="../../assets/images/|g' {} \;
find frontend/public/pages -name "*.html" -exec sed -i 's|src="../assets/images/|src="../../assets/images/|g' {} \;

# Fix JS paths for pages in subdirectories - should be ../../ not ../
find frontend/public/pages -name "*.html" -exec sed -i 's|src="../scripts/|src="../../scripts/|g' {} \;

# Fix manifest and service worker paths for pages in subdirectories
find frontend/public/pages -name "*.html" -exec sed -i 's|href="../manifest.json"|href="../../manifest.json"|g' {} \;
find frontend/public/pages -name "*.html" -exec sed -i 's|src="../service-worker.js"|src="../../service-worker.js"|g' {} \;

# Fix CSS paths for pages in subdirectories - should be ../../ not ../
find frontend/public/pages -name "*.html" -exec sed -i 's|href="../styles/|href="../../styles/|g' {} \;

# Fix paths in backend JavaScript files
echo "Fixing backend JavaScript paths..."
find backend -name "*.js" -exec sed -i 's|require(["\x27]\.\./\.\./\.\./|require("\x27../|g' {} \;
find backend -name "*.js" -exec sed -i 's|require(["\x27]\.\./\.\./\.\./\.\./|require("\x27../../|g' {} \;

# Fix paths in frontend JavaScript files
echo "Fixing frontend JavaScript paths..."
find frontend -name "*.js" -exec sed -i 's|require(["\x27]\.\./\.\./\.\./|require("\x27../|g' {} \;
find frontend -name "*.js" -exec sed -i 's|require(["\x27]\.\./\.\./\.\./\.\./|require("\x27../../|g' {} \;

# Fix paths in CSS files
echo "Fixing CSS paths..."
find frontend -name "*.css" -exec sed -i 's|url(["\x27]\.\./\.\./\.\./|url("\x27../|g' {} \;
find frontend -name "*.css" -exec sed -i 's|url(["\x27]\.\./\.\./\.\./\.\./|url("\x27../../|g' {} \;

# Fix paths in JSON files
echo "Fixing JSON paths..."
find . -name "*.json" -exec sed -i 's|"\.\./\.\./\.\./|"../|g' {} \;
find . -name "*.json" -exec sed -i 's|"\.\./\.\./\.\./\.\./|"../../|g' {} \;

# Fix paths in SQL files
echo "Fixing SQL paths..."
find . -name "*.sql" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.sql" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in shell scripts
echo "Fixing shell script paths..."
find . -name "*.sh" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.sh" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in markdown files
echo "Fixing markdown paths..."
find . -name "*.md" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.md" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in YAML files
echo "Fixing YAML paths..."
find . -name "*.yml" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.yaml" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.yml" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;
find . -name "*.yaml" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in text files
echo "Fixing text file paths..."
find . -name "*.txt" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.txt" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in log files
echo "Fixing log file paths..."
find . -name "*.log" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.log" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in environment files
echo "Fixing environment file paths..."
find . -name "*.env" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.env" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in config files
echo "Fixing config file paths..."
find . -name "*.config" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.conf" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.ini" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.config" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;
find . -name "*.conf" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;
find . -name "*.ini" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in XML files
echo "Fixing XML paths..."
find . -name "*.xml" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.xml" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in PHP files
echo "Fixing PHP paths..."
find . -name "*.php" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.php" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in Python files
echo "Fixing Python paths..."
find . -name "*.py" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.py" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in Ruby files
echo "Fixing Ruby paths..."
find . -name "*.rb" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.rb" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in Go files
echo "Fixing Go paths..."
find . -name "*.go" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.go" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in Rust files
echo "Fixing Rust paths..."
find . -name "*.rs" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.rs" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in C/C++ files
echo "Fixing C/C++ paths..."
find . -name "*.c" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.cpp" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.h" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.hpp" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.c" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;
find . -name "*.cpp" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;
find . -name "*.h" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;
find . -name "*.hpp" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in Java files
echo "Fixing Java paths..."
find . -name "*.java" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.java" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in Kotlin files
echo "Fixing Kotlin paths..."
find . -name "*.kt" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.kt" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in Swift files
echo "Fixing Swift paths..."
find . -name "*.swift" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.swift" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in Dart files
echo "Fixing Dart paths..."
find . -name "*.dart" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.dart" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in TypeScript files
echo "Fixing TypeScript paths..."
find . -name "*.ts" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.ts" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in TSX files
echo "Fixing TSX paths..."
find . -name "*.tsx" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.tsx" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in JSX files
echo "Fixing JSX paths..."
find . -name "*.jsx" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.jsx" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in Vue files
echo "Fixing Vue paths..."
find . -name "*.vue" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.vue" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in Svelte files
echo "Fixing Svelte paths..."
find . -name "*.svelte" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.svelte" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

# Fix paths in Astro files
echo "Fixing Astro paths..."
find . -name "*.astro" -exec sed -i 's|\.\./\.\./\.\./|../|g' {} \;
find . -name "*.astro" -exec sed -i 's|\.\./\.\./\.\./\.\./|../../|g' {} \;

echo "All paths fixed across all file types!"
