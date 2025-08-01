import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and auth pages
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/auth/') ||
    pathname === '/' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('session');

  if (!sessionCookie) {
    // Redirect to sign in if no session
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Verify the session cookie is valid by calling the session API
  try {
    const sessionResponse = await fetch(new URL('/api/auth/session', request.url), {
      headers: {
        'Cookie': `session=${sessionCookie.value}`,
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (!sessionResponse.ok) {
      console.log('Session verification failed:', sessionResponse.status, 'for path:', pathname);
      
      // For 401 errors, the session might be temporarily invalid during page refresh
      // Give the client a chance to re-authenticate instead of immediately redirecting
      if (sessionResponse.status === 401 && pathname === '/buy-credits') {
        console.log('Allowing buy-credits page load for potential re-authentication');
        return NextResponse.next();
      }
      
      // Invalid session, redirect to sign in
      const response = NextResponse.redirect(new URL('/auth/signin', request.url));
      response.cookies.delete('session');
      return response;
    }

    const sessionData = await sessionResponse.json();
    console.log('Session verified for user:', sessionData.user?.email);

    // Valid session, allow access
    return NextResponse.next();
  } catch (error) {
    console.error('Session verification error:', error);
    // On network errors, allow the page to load and let client-side auth handle it
    if (pathname === '/buy-credits') {
      console.log('Network error during session verification, allowing page load');
      return NextResponse.next();
    }
    // On error, redirect to sign in and clear session
    const response = NextResponse.redirect(new URL('/auth/signin', request.url));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth).*)'],
};