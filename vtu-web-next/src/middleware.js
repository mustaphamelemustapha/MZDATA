import { NextResponse } from 'next/server';

export function middleware(request) {
  const host = request.headers.get('host') || '';
  if (host.includes('mzdata.org')) {
    const url = request.nextUrl.clone();
    url.hostname = 'mzdata.ng';
    url.protocol = 'https';
    url.port = '';
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.png|brand|pwa|landing).*)',
};
