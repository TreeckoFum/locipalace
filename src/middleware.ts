import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Coincide con todas las rutas excepto llamadas a API, archivos estáticos o _next
  matcher: ['/', '/(es|en|ca)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
