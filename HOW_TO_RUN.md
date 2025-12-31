# How to Run the Chemical Waste Management Project

This guide explains how to set up and run the project on a new machine after receiving it as a ZIP file.

## Prerequisites

Before starting, ensure you have the following installed:
1.  **Node.js**: v18 or higher ([Download](https://nodejs.org/))
2.  **PostgreSQL**: v14 or higher ([Download](https://www.postgresql.org/download/))
    *   *Note: Ensure the PostgreSQL service is running.*

---

## 1. Preparing the Project Files

When sharing or receiving the project as a ZIP:
*   **Do NOT include** the `node_modules` folders (they are very large and can be regenerated).
*   **Do NOT include** the `.git` folder.
*   **DO include** all other files in both the `backend` and `frontend` directories.

---

## 2. Backend Setup

Open a terminal in the `backend` folder:

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
1.  Copy `.env.example` to a new file named `.env`.
2.  Open `.env` and update the `DATABASE_URL` with your PostgreSQL username and password:
    ```env
    DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/chemwaste_db?schema=public"
    ```

### Step 3: Create the Database
Create a database named `chemwaste_db` in PostgreSQL (using pgAdmin or `psql`).

### Step 4: Setup Database Schema
Run the following commands to initialize the database:
```bash
# Generate the Prisma client
npm run generate

# Run migrations to create tables
npm run migrate
```

### Step 5: Seed Initial Data
Run these commands to create the admin user and default settings:
```bash
# Create initial admin user
npm run seed:admin

# Create default settings
npm run seed:settings
```
*   *Default Admin Login: admin@example.com / admin123 (Check your specific seeder for details)*

### Step 6: Start Backend
```bash
npm run dev
```
The backend will run on `http://localhost:3000`.

---

## 3. Frontend Setup

Open a **NEW** terminal in the `frontend` folder:

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Frontend
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## Summary of Running the App
Every time you want to start the project:
1.  Start the **Backend**: `cd backend && npm run dev`
2.  Start the **Frontend**: `cd frontend && npm run dev`

Open your browser at `http://localhost:5173` to access the application.
