import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
        const authValue = basicAuth.split(' ')[1];
        const [user, pwd] = atob(authValue).split(':');

        const expectedUser = process.env.BASIC_AUTH_USER || 'admin';
        const expectedPassword = process.env.BASIC_AUTH_PASSWORD || 'password';

        if (user === expectedUser && pwd === expectedPassword) {
            return NextResponse.next();
        }
    }

    const url = req.nextUrl;
    url.pathname = '/api/auth';

    return new NextResponse('Auth required', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (if we add it)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - manifest.json (PWA manifest)
         * - icon-*.png (PWA icons)
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png).*)',
    ],
};
