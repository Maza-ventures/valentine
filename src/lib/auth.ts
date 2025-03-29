import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthConfig } from "next-auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import Credentials from "next-auth/providers/credentials";

// For development and CLI use
const mockUsers = [
  {
    id: "super-admin",
    name: "Super Admin",
    email: "admin@valentine.vc",
    role: UserRole.SUPER_ADMIN,
  },
  {
    id: "fund-manager",
    name: "Fund Manager",
    email: "manager@valentine.vc",
    role: UserRole.FUND_MANAGER,
  },
  {
    id: "analyst",
    name: "Investment Analyst",
    email: "analyst@valentine.vc",
    role: UserRole.ANALYST,
  },
  {
    id: "readonly",
    name: "Read Only User",
    email: "readonly@valentine.vc",
    role: UserRole.READ_ONLY,
  },
];

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "Development",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize({ email }) {
        if (!email) return null;
        
        // For development and CLI use
        const mockUser = mockUsers.find((user) => user.email === email);
        if (mockUser) {
          return {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
          };
        }

        // Check if user exists in the database
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = request.nextUrl.pathname.startsWith("/login");
      
      // Public routes
      if (isOnLoginPage) {
        return true;
      }

      // API routes
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return isLoggedIn;
      }

      // MCP routes
      if (request.nextUrl.pathname.startsWith("/mcp/")) {
        return isLoggedIn;
      }

      // Protected routes
      if (!isLoggedIn) {
        return false;
      }

      return true;
    },
  },
};

declare module "next-auth" {
  interface User {
    role: UserRole;
  }
  
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    id: string;
  }
}
