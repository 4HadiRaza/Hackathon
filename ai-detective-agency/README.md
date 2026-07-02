# 🕵️ AI Detective Agency

An AI-powered detective agency where intelligent agents — built on Google Gemini — help you investigate cases, analyze evidence, interrogate suspects, and solve mysteries.

---

## Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Framework     | [Next.js 14](https://nextjs.org/) — App Router |
| Language      | TypeScript                        |
| Styling       | Tailwind CSS + `@tailwindcss/forms` + `@tailwindcss/typography` |
| AI            | [Google Gemini](https://ai.google.dev/) via `@google/generative-ai` |
| Auth          | [NextAuth.js](https://next-auth.js.org/) |
| Package Mgr   | npm                               |

---

## Project Structure

```
ai-detective-agency/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── auth/           # NextAuth.js handler
│   │   ├── chat/           # Chat with detective agents
│   │   └── cases/          # Case CRUD API
│   ├── dashboard/          # Dashboard page (protected)
│   ├── login/              # Sign-in page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── providers.tsx       # Client-side SessionProvider
│   └── globals.css         # Design system CSS
│
├── components/             # Reusable React components
│   ├── ui/
│   │   └── Button.tsx
│   └── AgentCard.tsx
│
├── lib/                    # Utilities & business logic
│   ├── gemini.ts           # Google Gemini client (singleton)
│   ├── agents.ts           # Detective agent definitions & logic
│   ├── auth.ts             # NextAuth configuration
│   └── utils.ts            # Shared utilities (cn, formatDate, etc.)
│
└── types/
    └── index.ts            # All shared TypeScript types
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd ai-detective-agency
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Then fill in your `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

- **GEMINI_API_KEY** — Get one free at [Google AI Studio](https://aistudio.google.com/app/apikey)
- **NEXTAUTH_SECRET** — Generate with `openssl rand -base64 32`

### 3. Run the Dev Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Detective Agents

| Agent           | Role          | Specialty                                  |
|-----------------|---------------|--------------------------------------------|
| Agent Marlowe   | Investigator  | Scene analysis, pattern recognition        |
| Dr. Chen        | Analyst       | Forensics, behavioral profiling            |
| Detective Rivera| Interrogator  | Deception detection, testimony analysis    |
| Archie          | Archivist     | Case management, cross-referencing         |

---

## API Routes

| Route                        | Method | Description                        |
|------------------------------|--------|------------------------------------|
| `/api/auth/[...nextauth]`    | *      | NextAuth.js authentication handler |
| `/api/chat`                  | POST   | Chat with a detective agent        |
| `/api/cases`                 | GET    | List all cases                     |
| `/api/cases`                 | POST   | Create a new case                  |

### Chat API Example

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze the fingerprint evidence from the crime scene.",
    "sessionId": "session_abc123",
    "agentRole": "analyst"
  }'
```

---

## Demo Credentials

> **Email:** `demo@agency.com`  
> **Password:** `detective123`

Replace the placeholder `authorize` function in [`lib/auth.ts`](./lib/auth.ts) with real database lookups before production.

---

## License

MIT
