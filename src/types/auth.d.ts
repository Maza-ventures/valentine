// Type declarations for auth module
declare module '@/lib/auth' {
  import { UserRole } from '@/lib/types';
  
  export interface User {
    id: string;
    name?: string | null;
    email: string;
    role: UserRole;
    image?: string | null;
  }
  
  export interface Session {
    user: User;
    expires: string;
  }
  
  export function getSession(): Promise<Session | null>;
  export function login(email: string, password: string): Promise<Session>;
  export function logout(): Promise<void>;
  export function isUserAllowed(user: User | null | undefined, allowedRoles: UserRole[]): boolean;
}
