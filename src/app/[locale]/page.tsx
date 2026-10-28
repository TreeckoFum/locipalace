import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import HeroSection from '@/components/landing/HeroSection';
import { LanguageSelector } from '@/components/LanguageSelector';
import { getTranslations } from '@/lib/translations';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = getTranslations(locale);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-x-hidden">
      {/* Widescreen Top Navbar with Fluid 1520px Container */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-10 lg:px-16 2xl:px-20 h-16 flex items-center justify-between gap-2">
          {/* Far Left Edge: Brand Logo */}
          <Link
            href={`/${locale}`}
            className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-90 transition shrink-0"
          >
            {t.nav.brand}
          </Link>

          {/* Far Right Edge: Navigation Controls + Single LanguageSelector + CTA */}
          <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
            <a
              href="#experimento"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>{t.nav.experimentLink}</span>
            </a>

            <LanguageSelector />

            <Link
              href={`/${locale}/app`}
              className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-slate-950 shadow-md shadow-indigo-500/20 hover:from-indigo-400 hover:to-cyan-400 transition"
            >
              <span>{t.nav.enterApp}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 pb-28 sm:pb-0">
        <HeroSection locale={locale} />
      </main>
    </div>
  );
}
