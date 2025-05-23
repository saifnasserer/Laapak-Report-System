/**
 * Fix AuthMiddleware references in invoices.js
 */
const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(__dirname, 'js', 'invoices.js');

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Replace all instances of AuthMiddleware with authMiddleware
  const fixedContent = data.replace(/AuthMiddleware\./g, 'authMiddleware.');

  // Write the fixed content back to the file
  fs.writeFile(filePath, fixedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('Successfully fixed all AuthMiddleware references in invoices.js');
  });
});
