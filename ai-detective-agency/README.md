# 🕵️ AI Detective Agency

An AI-powered detective agency built on Next.js 14, where intelligent agents — driven by Google Gemini 2.0 — help you investigate cases, analyze evidence, cross-reference alibis, and solve mysteries.

---

## 🛠️ Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, React Server Components) |
| **Language**  | TypeScript                        |
| **Styling**   | Tailwind CSS + `@tailwindcss/forms` + `@tailwindcss/typography` |
| **AI Engine** | [Google Gemini 2.0 Flash](https://ai.google.dev/) via `@google/generative-ai` |
| **Auth**      | [NextAuth.js](https://next-auth.js.org/) (Credentials Provider) |
| **Database**  | In-memory with global cross-reloads persistence (ready to swap with Prisma/PostgreSQL) |

---

## 📂 Project Structure

```
ai-detective-agency/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── auth/           # NextAuth.js handler
│   │   ├── chat/           # Conversational chat with agents
│   │   ├── cases/          # Case listings
│   │   ├── pipeline/       # Runs single-case agent pipeline
│   │   └── actions/        # Case log GET/POST endpoint
│   ├── dashboard/          # Bulletin board interface (Protected)
│   ├── login/              # Noir login portal
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Noir landing page
│   ├── providers.tsx       # Client-side SessionProvider
│   └── globals.css         # Design system & dark mode custom properties
│
├── components/             # Reusable UI components
│   ├── ui/
│   │   └── Button.tsx
│   └── LoginForm.tsx       # Interactive client credential form
│
├── lib/                    # Shared logic & SDK wrappers
│   ├── gemini.ts           # Gemini 2.0 structured JSON helper
│   ├── agents.ts           # 3-step pipeline runner & agent definitions
│   ├── caseLog.ts          # Action logs manager
│   ├── auth.ts             # Credentials & NextAuth options
│   └── utils.ts            # Formatting & general helper utilities
│
└── types/
    └── index.ts            # Domain TypeScript types
```

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/4HadiRaza/Hackathon.git
cd Hackathon/ai-detective-agency
npm install
```

### 2. Configure Environment

Create your `.env.local` file from the provided template:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and add your keys:

```env
# 1. Google Gemini API Key
# Get a free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_real_gemini_api_key_here

# 2. NextAuth.js Secret Key
# Generate on Windows PowerShell with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET=your_generated_secret_key_here

# 3. Canonical App URL
NEXTAUTH_URL=http://localhost:3000
```

> ⚠️ **Note on Live Testing**: The app requires a valid `GEMINI_API_KEY` to run the agent pipeline. If no key is set, the pipeline will capture the failure and load fallback data inside the trace panel.

### 3. Start Development Server

```bash
npm run dev
```

Visit the app at [http://localhost:3000](http://localhost:3000).

---

## 🔍 The 3-Step Detective Pipeline

When a case folder is submitted, it is processed through a sequential, structured agent pipeline:

```
[Case File] ──> Step 1: Clue Organiser (Marlowe)
                     ↓
                [Structured Clues] ──> Step 2: Interrogation (Rivera)
                                            ↓
                                       [Inconsistencies & Ratings] ──> Step 3: Analyst (Chen)
                                                                            ↓
                                                                       [Verdict & Confidence]
```

1.  **Step 1: Clue Organiser (`gatherClues`)**
    *   **Agent**: Agent Marlowe
    *   **Action**: Analyzes evidence records and witness testimonies to filter out noise.
    *   **Output**: A clean, non-redundant list of discrete clue sentences (`ClueResult`).
2.  **Step 2: Interrogator (`interrogateSuspects`)**
    *   **Agent**: Detective Rivera
    *   **Action**: Cross-references suspect statements with gathered clues to highlight contradictions.
    *   **Output**: A list of detailed alibi contradictions and a suspicion score (0-100) per suspect (`InterrogationResult`).
3.  **Step 3: Accuser (`makeAccusation`)**
    *   **Agent**: Dr. Chen
    *   **Action**: Reviews suspect ratings and contradictions to accuse the most likely suspect.
    *   **Output**: Final accused name, case narrative summary, and confidence level (`AccusationResult`).

---

## ⚙️ Concurrency-Limited Solving

For multi-case operations (e.g. batch investigations), the `POST /api/solve` endpoint enforces a **concurrency limit of 3**:
*   Uses an in-memory worker pool queue to guarantee no more than 3 instances of `runDetectivePipeline` execute concurrently.
*   Mitigates rate limiting on the Google Gemini API.
*   Returns progress metrics (`durationMs`, `casesProcessed`) once the batch completes.

---

## 🔑 Demo Credentials

To enter the dashboard, use the pre-filled credentials on the login screen:
*   **Email**: `demo@agency.com`
*   **Password**: `detective123`

---

## ⚖️ License

MIT
