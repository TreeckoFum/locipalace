'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Globe } from 'lucide-react';
import type { Locale } from '@/types/palace';

const LANGUAGES: Array<{ code: Locale; label: string; flag: string; short: string }> = [
  { code: 'es', label: 'Español', flag: '🇪🇸', short: 'ES' },
  { code: 'ca', label: 'Català', flag: '🏴', short: 'CA' },
  { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
];

export function LanguageSelector() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleSelectLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div
      role="group"
      aria-label="Language Selector"
      className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/90 p-1 text-xs"
    >
      <Globe className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-slate-400 hidden sm:block" />
      {LANGUAGES.map((lang) => {
        const isActive = locale === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleSelectLocale(lang.code)}
            title={`${lang.label} (${lang.flag})`}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold transition-all ${
              isActive
                ? 'bg-indigo-500/25 text-white border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.short}</span>
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSelector;
