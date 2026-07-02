// ============================================================
// NextAuth configuration — lib/auth.ts
// ============================================================

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// ---------------------------------------------------------------------------
// In-memory mock users
// Replace this array with a real DB lookup (e.g. Prisma) when ready.
// Passwords are stored in plaintext here for demo purposes only.
// In production, use bcrypt: await bcrypt.compare(password, user.passwordHash)
// ---------------------------------------------------------------------------
export type UserRole = "admin" | "detective" | "analyst" | "viewer";

interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string; // plaintext — dev/demo only
  role: UserRole;
  badge: string;    // a fun flavour field
}

const MOCK_USERS: MockUser[] = [
  {
    id: "usr_001",
    name: "Sam Marlowe",
    email: "demo@agency.com",
    password: "detective123",
    role: "detective",
    badge: "DA-001",
  },
  {
    id: "usr_002",
    name: "Dr. Elena Chen",
    email: "analyst@agency.com",
    password: "forensics456",
    role: "analyst",
    badge: "DA-002",
  },
  {
    id: "usr_003",
    name: "Director Hayes",
    email: "admin@agency.com",
    password: "admin789",
    role: "admin",
    badge: "DA-000",
  },
];

/** Finds a user by email + password (plaintext comparison — dev only). */
function findUser(email: string, password: string): MockUser | null {
  return (
    MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    ) ?? null
  );
}

// ---------------------------------------------------------------------------
// NextAuth options
// ---------------------------------------------------------------------------
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Case Files",
      credentials: {
        email: {
          label: "Agent Email",
          type: "email",
          placeholder: "detective@agency.com",
        },
        password: {
          label: "Badge Code",
          type: "password",
          placeholder: "Your secret badge code",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = findUser(credentials.email, credentials.password);
        if (!user) return null;

        // Return the shape NextAuth expects
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          badge: user.badge,
        };
      },
    }),
  ],

  // ---------------------------------------------------------------------------
  // Session strategy — JWT (no DB session store needed)
  // ---------------------------------------------------------------------------
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  // ---------------------------------------------------------------------------
  // Callbacks — persist role + badge into the JWT and session
  // ---------------------------------------------------------------------------
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role  = (user as { role?: string }).role  ?? "detective";
        token.badge = (user as { badge?: string }).badge ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id     = token.id   as string;
        (session.user as { role?: string }).role  = token.role as string;
        (session.user as { badge?: string }).badge = token.badge as string;
      }
      return session;
    },
  },

  // ---------------------------------------------------------------------------
  // Custom pages
  // ---------------------------------------------------------------------------
  pages: {
    signIn: "/login",
    error:  "/login",   // errors (e.g. CredentialsSignin) redirect here
  },

  // ---------------------------------------------------------------------------
  // Security
  // ---------------------------------------------------------------------------
  secret: process.env.NEXTAUTH_SECRET,
  debug:  process.env.NODE_ENV === "development",
};

