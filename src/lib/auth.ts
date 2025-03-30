import { cookies } from 'next/headers';
import { UserRole } from './types';

// Mock users for development
const mockUsers = [
  {
    id: "cm8vbd0al0000aws4qxaeahpg",
    name: "Super Admin",
    email: "admin@valentine.vc",
    password: "password", // In a real app, this would be hashed
    role: UserRole.SUPER_ADMIN,
  },
  {
    id: "fund-manager",
    name: "Fund Manager",
    email: "manager@valentine.vc",
    password: "password",
    role: UserRole.FUND_MANAGER,
  },
  {
    id: "analyst",
    name: "Investment Analyst",
    email: "analyst@valentine.vc",
    password: "password",
    role: UserRole.ANALYST,
  },
  {
    id: "readonly",
    name: "Read Only User",
    email: "readonly@valentine.vc",
    password: "password",
    role: UserRole.READ_ONLY,
  },
];

// Session type
export interface Session {
  user: {
    id: string;
    name?: string | null;
    email: string;
    role: UserRole;
    image?: string | null;
  };
  expires: string;
}

// Login function
export async function login(email: string, password: string): Promise<Session | null> {
  // For development, check mock users
  const user = mockUsers.find(user => user.email === email && user.password === password);
  
  if (user) {
    // Create session
    const session: Session = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: null,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    };
    
    // In a real app, you would store the session in a database
    // and only store the session ID in the cookie
    
    // Store session in cookie
    cookies().set('session', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    return session;
  }
  
  return null;
}

// Logout function
export function logout() {
  cookies().delete('session');
}

// Get current session
export function getSession(): Session | null {
  const sessionCookie = cookies().get('session');
  
  if (sessionCookie) {
    try {
      return JSON.parse(sessionCookie.value) as Session;
    } catch (error) {
      return null;
    }
  }
  
  return null;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const session = getSession();
  return !!session;
}

// Get current user
export function getCurrentUser() {
  const session = getSession();
  return session?.user || null;
}

// Check if user has required role
export function hasRole(role: UserRole): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}

// Check if user has one of the required roles
export function hasAnyRole(roles: UserRole[]): boolean {
  const user = getCurrentUser();
  return user ? roles.includes(user.role) : false;
}
