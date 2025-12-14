# Invoice Print Endpoint

## Overview

A new print-ready endpoint has been added to display invoices in a simple, clean format optimized for printing.

## Endpoint

```
GET /api/invoices/:id/print
```

**Authentication:** JWT Token (x-auth-token header)

## Usage

### Direct URL Access

The endpoint requires authentication. You can pass the token as a query parameter:

```
http://localhost:3001/api/invoices/INV123456/print?token=YOUR_JWT_TOKEN
```

Or in production:
```
https://reports.laapak.com/api/invoices/INV123456/print?token=YOUR_JWT_TOKEN
```

**Note:** The token can also be passed in the `x-auth-token` header for API calls, but for browser access, use the query parameter.

### From Frontend

```javascript
// Open print view in new window with token
function printInvoice(invoiceId) {
    // Get token from storage (admin or client token)
    const token = localStorage.getItem('adminToken') || 
                  sessionStorage.getItem('adminToken') ||
                  localStorage.getItem('clientToken') ||
                  sessionStorage.getItem('clientToken');
    
    if (!token) {
        alert('Please login to print invoices');
        return;
    }
    
    const baseUrl = window.config?.api?.baseUrl || window.location.origin;
    const url = `${baseUrl}/api/invoices/${invoiceId}/print?token=${encodeURIComponent(token)}`;
    
    // Open in new window
    window.open(url, '_blank');
}

// Or redirect to print view
function viewInvoicePrint(invoiceId) {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    const baseUrl = window.config?.api?.baseUrl || window.location.origin;
    window.location.href = `${baseUrl}/api/invoices/${invoiceId}/print`;
}
```

### Using Fetch (with authentication)

```javascript
async function openInvoicePrint(invoiceId) {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    const baseUrl = window.config?.api?.baseUrl || window.location.origin;
    
    // Create a form to submit with token
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = `${baseUrl}/api/invoices/${invoiceId}/print`;
    form.target = '_blank';
    
    // Add token as hidden input (if needed)
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token';
    tokenInput.value = token;
    form.appendChild(tokenInput);
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}
```

## Features

### Print-Optimized Design
- Clean, simple layout
- A4 page size support
- Proper margins for printing
- No unnecessary elements when printing
- Print button hidden when printing

### Invoice Information Displayed
- Invoice ID and date
- Payment status (with color-coded badges)
- Payment method
- Client information (name, phone, email, address)
- Invoice items table with:
  - Item number
  - Description
  - Type
  - Serial number
  - Quantity
  - Price
  - Total
- Financial summary:
  - Subtotal
  - Discount (if any)
  - Tax (if any)
  - Total amount

### Styling
- RTL (Right-to-Left) support for Arabic
- Green color scheme matching Laapak branding
- Professional typography
- Responsive table layout
- Status badges with colors:
  - Green: Paid
  - Red: Unpaid
  - Yellow: Pending

## Print Behavior

1. **On Screen:** Shows a print button in the top-left corner
2. **When Printing:** 
   - Print button is hidden
   - Optimized margins for A4 paper
   - Proper page breaks
   - Clean layout without backgrounds

## Example Response

The endpoint returns a complete HTML page with:
- Embedded CSS for styling
- Print-specific media queries
- All invoice data formatted
- Ready to print immediately

## Security

- Requires JWT authentication
- Uses the same permission checks as the regular invoice endpoint
- Only authenticated users can access

## Testing

### Test with curl:

```bash
# Get a JWT token first (from login)
TOKEN="your_jwt_token_here"

# Test the print endpoint
curl -H "x-auth-token: $TOKEN" \
     http://localhost:3001/api/invoices/INV123456/print \
     -o invoice-print.html

# Open the HTML file in a browser
```

### Test in Browser:

1. Login to get a JWT token
2. Navigate to: `http://localhost:3001/api/invoices/{invoice_id}/print`
3. The invoice will display
4. Click the print button or press Ctrl+P
5. Print dialog will open

## Integration Example

Add a print button to your invoice list/view:

```html
<button onclick="printInvoice('INV123456')" class="btn btn-primary">
    <i class="fas fa-print"></i> طباعة الفاتورة
</button>
```

```javascript
function printInvoice(invoiceId) {
    const baseUrl = window.config?.api?.baseUrl || window.location.origin;
    window.open(`${baseUrl}/api/invoices/${invoiceId}/print`, '_blank');
}
```

## Notes

- The endpoint returns HTML, not JSON
- The page is optimized for A4 paper size
- All text is in Arabic with RTL support
- Currency is displayed in Egyptian Pounds (ج.م)
- Dates are formatted in Arabic locale

