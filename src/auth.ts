import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

// This is the recommended way to use NextAuth.js v5
export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
