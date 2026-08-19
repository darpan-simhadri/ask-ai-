# AskFlow AI - Simple Full-Stack AI Chatbot Application

AskFlow AI is a modern, responsive full-stack AI chatbot application. It enables users to create conversation threads, log prompts securely in Supabase with Row Level Security (RLS) policies, and query the Gemini API securely through a Node.js Express backend.

---

## 🚀 Technology Stack

### Frontend (Client)
- **Vite React** with **TypeScript**
- **Tailwind CSS v4** (Utility-first styling with modern compiler)
- **React Router v6** (Protected routes and layout shell)
- **Supabase JS Client** (Auth state sync & direct-to-database requests)
- **Zod** (Client-side form inputs validation)
- **Lucide React** (Modern, minimalist icons)

### Backend (Server)
- **Node.js** with **Express.js** & **TypeScript**
- **Google Gen AI SDK** (`@google/genai` to call Gemini models securely)
- **Supabase JS Client** (Verifying user authentication JWT tokens)
- **Zod** (Request body payload validation)
- **Helmet & Morgan** (HTTP security headers and request logger)

### Database & Auth
- **Supabase Auth** (Email signup, login, session validation)
- **Supabase PostgreSQL** (Relational storage with Cascading Deletes & Indexes)
- **Row Level Security (RLS)** (Guarantees users only read/write their own chat threads)

---

## 📁 Project Structure

```text
/
├── README.md
├── supabase/
│   └── migrations/
│       └── 20260819000000_create_chat_tables.sql
├── server/                              # Node.js + Express Backend
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                     # Express server startup
│       ├── config.ts                    # Zod validated env config
│       ├── middleware/
│       │   └── auth.ts                  # Supabase JWT token verification
│       ├── routes/
│       │   └── chat.ts                  # Chat route interfacing Gemini API
│       └── validation/
│           └── chat.ts                  # Zod request validators
└── client/                              # Vite + React Frontend
    ├── .env.example
    ├── package.json
    ├── vite.config.ts                   # Integrated with Tailwind v4 plugin
    └── src/
        ├── main.tsx
        ├── App.tsx                      # Page routing definition
        ├── index.css                    # Tailwind CSS imports & animations
        ├── supabaseClient.ts            # Initialize Supabase client
        ├── components/
        │   ├── Layout.tsx               # Responsive layout & Sidebar
        │   └── ProtectedRoute.tsx       # Auth guard
        └── pages/
            ├── Login.tsx                # Zod validated login form
            ├── Signup.tsx               # Zod validated signup form
            ├── Dashboard.tsx            # dynamic dashboard overview
            └── Chatbot.tsx              # Full-page interactive chat console
```

---

## 🛠️ Step-by-Step Setup

### Step 1: Database Setup (Supabase)
1. Go to the [Supabase Dashboard](https://supabase.com) and create a new project.
2. Go to **SQL Editor** in the left menu.
3. Paste the contents of [`supabase/migrations/20260819000000_create_chat_tables.sql`](file:///c:/Users/ASUS/OneDrive/Desktop/Build%20to%20ship/supabase/migrations/20260819000000_create_chat_tables.sql) into the query window and click **Run**.
   - This sets up the `conversations` and `messages` tables, establishes foreign keys referencing Supabase Auth users, creates performance indexes, and enables Row Level Security (RLS) policies.

---

### Step 2: Configure & Start Express Backend
1. Open a terminal and navigate to the `server/` directory.
2. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in the configuration details:
   - `GEMINI_API_KEY`: Get a free key from [Google AI Studio](https://aistudio.google.com/).
   - `SUPABASE_URL` & `SUPABASE_ANON_KEY`: Found in your Supabase Dashboard under **Project Settings** -> **API**.
4. Install backend dependencies:
   ```bash
   npm install
   ```
5. Start the backend in development hot-reload mode:
   ```bash
   npm run dev
   ```
   - The server will run on `http://localhost:5000` by default.

---

### Step 3: Configure & Start React Client
1. Open a new terminal and navigate to the `client/` directory.
2. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in the configurations:
   - `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`: Use the same values as step 2.
   - `VITE_API_URL`: Set to the URL of the Express backend (default: `http://localhost:5000`).
4. Install client dependencies:
   ```bash
   npm install
   ```
5. Start the React development environment:
   ```bash
   npm run dev
   ```
   - The client will run on `http://localhost:5173`. Open this URL in your web browser.

---

## 🔒 Security Architectures

1. **Secure API Calling**: The client does not call Gemini directly. The user sends messages to the Express backend. The backend signs requests with the `GEMINI_API_KEY` environment variable.
2. **Supabase JWT Verification**: The backend has a custom authentication middleware that intercepts requests, checks the `Authorization` header, and verifies the client token using the official Supabase API. Unauthorized clients receive `401 Unauthorized` responses.
3. **Database RLS Policies**: Even if someone intercepts user interactions, Row Level Security ensures that database queries only return data belonging to the authenticated user ID (`auth.uid() = user_id`).
