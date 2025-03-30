import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || 
                       path.startsWith('/api/auth/') || 
                       path === '/';
  
  // Get the session cookie
  const sessionCookie = request.cookies.get('session');
  const isAuthenticated = !!sessionCookie?.value;
  
  // Redirect to login if accessing a protected route without authentication
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirect to dashboard if accessing login page while already authenticated
  if (path === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all paths except for static files, api routes that don't need auth, etc.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
