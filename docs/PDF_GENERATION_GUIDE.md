# PDF Generation Technical Guide

This guide explains the implementation of the PDF download functionality using Next.js and Puppeteer, detailing how to replicate this feature in other projects.

## Architecture Overview

The PDF generation process works as follows:
1.  **Public Page**: A dedicated, print-friendly page renders the content (e.g., `/p/[publicId]`).
2.  **API Route**: An API endpoint (`/api/pdf/[publicId]`) accepts the request.
3.  **Puppeteer**: The API launches a headless Chrome browser instance on the server.
4.  **Navigation**: The browser navigates to the Public Page URL.
5.  **Rendering**: Puppeteer generates a PDF of the rendered page.
6.  **Response**: The PDF buffer is returned to the client with a `Content-Disposition: attachment` header.

## prerequisites

### 1. NPM Dependencies
Install `puppeteer` in your project:
```bash
npm install puppeteer
```

### 2. System Dependencies (Linux/Production)
Puppeteer requires specific system libraries to run headless Chrome. On Ubuntu/Debian servers:

```bash
# For Ubuntu 24.04+ (Noble)
sudo apt-get install -y ca-certificates fonts-liberation libasound2t64 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
```

## Implementation Details

### 1. The Public Print-Friendly Page
Create a standard Next.js page that displays the content you want to print.
**Key Requirement**: Use CSS media queries to ensure it looks good on paper.

```tsx
// src/app/[locale]/p/[publicId]/page.tsx
export default function PublicPage({ params }) {
  return (
    <div className="print-container">
      <h1>My Document</h1>
      {/* Content */}
      
      <style jsx global>{`
        @media print {
          /* Hide non-printable elements */
          .no-print { display: none; }
          
          /* Ensure backgrounds are printed */
          body { -webkit-print-color-adjust: exact; }
          
          /* Page breaks */
          .page-break { page-break-before: always; }
        }
      `}</style>
    </div>
  );
}
```

### 2. The API Route (Server-Side)
Create a route handler to generate the PDF.

```typescript
// src/app/api/pdf/[publicId]/route.ts
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  
  // 1. Determine the full URL to visit
  // IMPORTANT: Ensure you include the locale if your middleware requires it!
  const baseUrl = `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host")}`;
  const targetUrl = `${baseUrl}/ar/p/${publicId}`; // e.g., /ar/ for Arabic locale

  let browser;
  try {
    // 2. Launch Browser
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for root/Docker
    });

    const page = await browser.newPage();
    
    // 3. Navigate to page
    await page.goto(targetUrl, {
      waitUntil: "networkidle0", // Wait for all network connections to finish
      timeout: 60000, // 60s timeout
    });

    // 4. Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
    });

    await browser.close();

    // 5. Return Response
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="document-${publicId}.pdf"`,
      },
    });

  } catch (error) {
    if (browser) await browser.close();
    console.error("PDF Gen Error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
```

## Troubleshooting

1.  **404 Errors**: Ensure `targetUrl` in the API route matches your actual page URL perfectly, including **locales** (e.g., `/en/p/...` vs `/p/...`).
2.  **Timeout Errors**: Increase `timeout` in `page.goto` if your page fetches heavy data.
3.  **Missing Libraries**: If you see errors like `libatk... not found`, run the `apt-get install` command above.
4.  **Blank PDF**: Ensure `waitUntil: "networkidle0"` is set so Puppeteer waits for data fetching to complete before printing.
