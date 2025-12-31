# Gujarat Hazardwest Management Co. - User Manual & Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Master Data Management](#master-data-management)
   - [Companies Management](#companies-management)
   - [Transporters Management](#transporters-management)
5. [Inward Operations](#inward-operations)
   - [Recording Inward Entries](#recording-inward-entries)
   - [Generating Inward Invoices](#generating-inward-invoices)
6. [Outward Operations](#outward-operations)
   - [Recording Outward Entries](#recording-outward-entries)
7. [Invoicing & Payments](#invoicing--payments)
   - [Invoice Overview](#invoice-overview)
   - [Downloading Invoices](#downloading-invoices)
   - [Payment Tracking](#payment-tracking)
8. [Settings](#settings)

---

## 1. Introduction
Welcome to the **Gujarat Hazardwest Management Co. (GHMC) Management System**. This application is designed to streamline the operations of waste management, including tracking inward waste from companies, outward waste disposal, transporter management, and comprehensive invoicing and payment tracking.

## 2. Getting Started
### Login
To access the system, you must authenticate using your credentials.
1. Navigate to the login page.
2. Enter your **Email** and **Password**.
3. Click **Sign In**.

> **Note:** Access is restricted to authorized personnel only. If you forget your password, please contact the system administrator.

---

## 3. Dashboard
Upon logging in, you are greeted with the **Dashboard**. This serves as the command center for your operations.
- **Key Metrics:** View real-time statistics such as Total Inward Quantity, Total Outward Quantity, Pending Invoices, and Revenue.
- **Charts:** Visual representation of waste flow and revenue trends over time.
- **Quick Actions:** Shortcuts to frequently used features like "New Inward Entry" or "New Invoice".

---

## 4. Master Data Management
Before recording daily transactions, you must set up your master data.

### Companies Management
Manage the companies you receive waste from.
*   **Navigate to:** `Companies` in the sidebar.
*   **Add Company:** Click the "Add Company" button. Fill in details like Name, Address, GST Number, and Contact Info.
*   **Manage Materials:** For each company, you can define specific **Waste Materials**.
    *   Click on a company to view details.
    *   Add materials with their standard **Rate** and **Unit** (e.g., "Sludge" @ 500/MT). This automates data entry during Inward creation.

### Transporters Management
Manage the logistics partners who handle waste transport.
*   **Navigate to:** `Transporters` in the sidebar.
*   **Add Transporter:** Click "Add Transporter" and provide details like Name, Transporter ID, Vehicle details, and GST Number.

---

## 5. Inward Operations
This module tracks waste coming **into** the facility.

### Recording Inward Entries
1.  **Navigate to:** `Inward` page.
2.  **Create Entry:** Click **"New Entry"**.
3.  **Fill Details:**
    *   **Date:** Transaction date.
    *   **Company:** Select from the dropdown (Master data).
    *   **Waste Name:** Select from the company's pre-defined materials (Rate/Unit auto-fills).
    *   **Manifest No & Vehicle No:** Enter the tracking details.
    *   **Quantity:** Net weight/quantity received.
4.  **Save:** The entry is now added to the ledger.

### Generating Inward Invoices
You can generate tax invoices for one or multiple inward entries.
1.  **Select Entries:** On the Inward list, check the boxes next to the entries you want to bill.
2.  **Create Invoice:** Click the **"Create Invoice"** button.
3.  **Review:** A modal appears with aggregated totals. Confirm the details.
4.  **Finalize:** The system generates a unique Invoice Number. The entries are now linked to this invoice.

---

## 6. Outward Operations
This module tracks waste going **out** of the facility (e.g., to cement plants for co-processing).

### Recording Outward Entries
1.  **Navigate to:** `Outward` page.
2.  **Create Entry:** Click **"New Entry"**.
3.  **Fill Details:**
    *   **Transporter:** Select the logistics provider.
    *   **Destination:** Where the waste is going (e.g., Cement Company Name).
    *   **Manifest & Quantity:** Tracking details.
4.  **Save:** Records the dispatch.

---

## 7. Invoicing & Payments
The central hub for all financial documents.

### Invoice Overview
*   **Navigate to:** `Invoices` page.
*   **Types:** Filter by **Inward** (billed to companies), **Outward**, or **Transporter** invoices.
*   **Status:** Quickly see which invoices are **Paid**, **Pending**, or **Partial**.

### Downloading Invoices (PDF)
You can generate professional PDF invoices that match the company's official format.
1.  **Locate Invoice:** Find the invoice in the list or go to the related Inward Entry.
2.  **Download:**
    *   **From List:** Click the download icon next to the invoice.
    *   **From Entry:** Open the entry details and click **"Download PDF"**.
3.  **Format:** The PDF includes the company logo, bank details, authorized signatory, and detailed item breakdown (HSN codes, GST split).

### Payment Tracking
Keep track of received payments.
1.  **Select Invoice:** Open the invoice details.
2.  **Update Payment:** Click **"Update Payment"**.
3.  **Enter Amount:** Input the amount received and the date.
4.  **Status Update:** The system automatically updates the status to "Partial" or "Paid" based on the remaining balance.

---

## 8. Settings
Configure system-wide parameters.
*   **GST Rates:** Update default CGST/SGST percentages.
*   **Financial Year:** Set the current operating year for invoice numbering sequences.
*   **Profile:** Update admin user details.

---

## Technical Support
For technical issues, database backups, or advanced configuration, please refer to the technical documentation or contact the development team.
