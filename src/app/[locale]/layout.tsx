import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = 'https://locipalace.com';

  const seoByLocale: Record<
    string,
    {
      defaultTitle: string;
      description: string;
      ogLocale: string;
    }
  > = {
    es: {
      defaultTitle: 'LociPalace - Palacio Mental & Método de Loci',
      description:
        'Convierte cualquier habitación o foto en un palacio de la memoria interactivo. Memoriza leyes, oposiciones y conceptos complejos con el método de Cicerón y la IA.',
      ogLocale: 'es_ES',
    },
    ca: {
      defaultTitle: 'LociPalace - Palau Mental & Mètode de Loci',
      description:
        'Converteix qualsevol habitació en un palau de la memòria interactiu. Memoritza lleis i oposicions amb el mètode de Loci i IA.',
      ogLocale: 'ca_ES',
    },
    en: {
      defaultTitle: 'LociPalace - Interactive Memory Palace & Method of Loci',
      description:
        'Turn any room or photo into an interactive memory palace. Master exams and complex concepts with the Method of Loci and AI.',
      ogLocale: 'en_US',
    },
  };

  const currentSeo = seoByLocale[locale] ?? seoByLocale.es;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: currentSeo.defaultTitle,
      template: '%s | LociPalace - Palacio Mental & Método de Loci',
    },
    description: currentSeo.description,
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        es: `${baseUrl}/es`,
        en: `${baseUrl}/en`,
        ca: `${baseUrl}/ca`,
        'x-default': `${baseUrl}/es`,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'LociPalace',
      title: currentSeo.defaultTitle,
      description: currentSeo.description,
      url: `${baseUrl}/${locale}`,
      locale: currentSeo.ogLocale,
      images: [
        {
          url: '/images/og-preview.png',
          width: 1200,
          height: 630,
          alt: 'LociPalace - 2D Interactive Memory Palace',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: currentSeo.defaultTitle,
      description: currentSeo.description,
      images: ['/images/og-preview.png'],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark overflow-x-hidden">
      <body className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
