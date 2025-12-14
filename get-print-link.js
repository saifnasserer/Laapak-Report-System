#!/usr/bin/env node
/**
 * Quick script to generate invoice print link
 * Usage: node get-print-link.js <invoiceId> <token>
 */

const invoiceId = process.argv[2] || 'INV1764279418642516';
const token = process.argv[3];

if (!token) {
    console.log('\n❌ Error: Token is required');
    console.log('\nUsage: node get-print-link.js <invoiceId> <token>');
    console.log('\nExample:');
    console.log('  node get-print-link.js INV1764279418642516 YOUR_JWT_TOKEN');
    console.log('\nTo get your token:');
    console.log('  1. Open browser console (F12)');
    console.log('  2. Run: localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken")');
    process.exit(1);
}

const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
const printUrl = `${baseUrl}/api/invoices/${invoiceId}/print?token=${encodeURIComponent(token)}`;

console.log('\n✅ Print URL generated:');
console.log('\n' + printUrl);
console.log('\n📋 Copy and paste this URL in your browser to print the invoice.\n');

