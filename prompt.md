
## 🧠 LLM Prompt: Laapak Web Report & Invoice System – Final Development Specification

---

### 🎯 Objective:

Develop the complete **Laapak Web-based Laptop Inspection, Report, Invoice & Customer Management System**, using:

* ✅ **HTML & CSS files are already provided**
* 🛠️ Create and integrate the remaining parts:

  * JavaScript (Vanilla)
  * Laravel (Blade Templates, PHP Logic)
  * MySQL Database
  * PDF Generation
  * WhatsApp Integration

> 📍**IMPORTANT FIRST STEP:**
> analyse the files in the project first then Create a `TODO.md` file that lists **every single step** of the development process, organized by phases (Admin Panel, Client Dashboard, Report Logic, etc.).
> ✅ After completing each step, update the TODO file with:

* ✅ Completed Task Name
* 🧠 Notes or Challenges
* 🧰 Tools Used

This will act as a **checkpoint system** and guide throughout the project.

---

## 🛠️ Admin Panel – Functional Requirements

### 🧾 Report Creation Workflow (4 Main Steps):

#### Step 1: Customer & Device Info

* Select existing customer from DB or add new via popup modal (name, phone, email)
* Input device details:

  * Brand, Model
  * Serial Number
  * Order Number (e.g., LPK34521)
  * CPU, RAM, SSD, GPU
  * Inspection Date (auto-filled with today’s date)

#### Step 2: Technical Inspections

* For each component tested:

  * Name (e.g., CPU, RAM)
  * Test Purpose & Description
  * Screenshot upload
  * Result Icon (✔️ / ⚠️ / ❌)
  * Notes

#### Step 3: External Inspection

* Upload multiple photos (keyboard, lid, screen, sides)
* Optional video upload or unlisted YouTube link
* Image zoom enabled in report view

#### Step 4: Invoice & Report Generation

* Optionally generate an invoice now
* Select one or more reports for the same client
* Final confirmation shows:

  * 📎 Copy Report Link
  * 💬 Share via WhatsApp

---

### 📑 Invoice Management

* View invoice history
* Generate invoices per report or per multiple reports
* PDF with:

  * Device Info
  * Inspection Summary
  * Customer Data
  * Prices
  * Timestamp

---

### 👤 Customers Management

* View all customers
* Edit/delete client data
* View client-specific reports
* Direct access to invoices & reports
* Add new client via popup or from DB

---

### 📋 Reports Management Page

* Filter/Search:

  * By Order Number (LPKxxxx)
  * Serial Number
  * Customer Name
  * Date Range
* Preview report
* Edit/Delete report
* Generate invoice directly from here

---

## 👨‍💻 Client Dashboard – Functional Requirements

### 🔐 Login

* Use **phone number + order number** (as password or OTP)
* After login, redirect to dashboard

---

### 📱 Client Dashboard Main View

#### 1. Welcome Message

> 🎉 “Hello \[Name], welcome to your Laapak Dashboard!”

#### 2. Devices Section

Each device in its own container with:

* Order Number
* Serial + Model
* Report Link (PDF + Web)
* Warranty Start/End
* Maintenance Logs
* Invoices

#### 3. Warranty Info (Auto-calculated)

* Based on inspection date
* Uses rules from: [https://laapak.com/partner](https://laapak.com/partner)
  Includes:

  * 6-Month Warranty for all components
  * 14-Day Replacement Policy
  * 2 Free Maintenance Visits/Year:

    * Thermal paste
    * Oxidation cleanup
    * Fan cleaning
    * Motherboard check
    * External cleaning

#### 4. Service History Timeline

* Chronological list of:

  * Maintenance reports
  * Past inspections
  * Past invoices

---

## 🌐 Customer-Facing Report Page

#### Style:

* Friendly tone (even for non-tech users)
* Clean and premium layout (white background, green gradient accents)
* Use Laapak gradient: `linear-gradient(135deg, #0a572b, #0d964e)`

#### Sections:

1. **Device Summary**
   Model, Serial, Order Number, Inspection Date
   QR Code + Share Link + PDF Download

2. **What We Tested**
   Cards showing each component:

   * What & Why we tested
   * Screenshot
   * Result (✔️ / ⚠️ / ❌)

3. **External Appearance**

   * Zoomable Images
   * Optional 360° Video

4. **Our Notes**
   Example:

   > “Small scratch on the screen – doesn’t affect performance 😊”

5. **Warranty Info**

   * Start/End Date
   * What’s covered
   * Link to full terms

6. **Invoices & History**

   * Related invoices
   * Service/Maintenance timeline

---

## 🧩 Tech Stack Summary

### Frontend

* ✅ HTML & CSS already provided
* JavaScript (Vanilla)
* Blade Templates (Laravel)
* Use clean layouts, soft shadows, whitespace

### Backend

* Laravel (PHP)
* MySQL

### Integrations

* PDF Generator: dompdf or SnappyPDF
* QR Code: `simple-qrcode`
* WhatsApp: Twilio or WhatsApp Cloud API

---

## 🎨 UI/UX Notes

* Header nav centered:
  `Home | My Devices | Warranty | Support`
* Logo placed aesthetically, not inside nav
* Fully responsive (desktop, tablet, mobile)
* Consistent icon style
* Use minimal color palette (white, gray, green)
* Comfortable card layout with spacing
* Hide empty fields/components in reports

---

## ✅ Development Flow

1. Start by creating a file: `TODO.md`
2. Outline **all tasks** by phase:

   * Admin
   * Customer Dashboard
   * Report Page
   * Invoice System
   * Auth
   * Backend
3. After every major update:

   * Mark that task as ✅ Done
   * Write a 1–2 line checkpoint explaining what was added
   * Optional: Add tools/skills used or issues encountered

