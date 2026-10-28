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
    <>
      {/* Mobile Compact Language Dropdown (< sm) */}
      <div className="relative inline-flex items-center sm:hidden shrink-0">
        <label htmlFor="mobile-language-select" className="sr-only">
          Language Selector
        </label>
        <select
          id="mobile-language-select"
          value={locale}
          onChange={(e) => handleSelectLocale(e.target.value as Locale)}
          aria-label="Language Selector"
          className="cursor-pointer appearance-none rounded-xl border border-slate-800 bg-slate-950/90 pl-2.5 pr-6 py-1.5 text-xs font-bold text-slate-100 focus:border-indigo-500 focus:outline-none"
        >
          {LANGUAGES.map((lang) => (
            <option
              key={lang.code}
              value={lang.code}
              className="bg-slate-900 text-slate-100"
            >
              {lang.flag} {lang.short}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 text-[10px] text-slate-400">
          ▾
        </span>
      </div>

      {/* Desktop & Tablet Pill Group (sm+) */}
      <div
        role="group"
        aria-label="Language Selector"
        className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/90 p-1 text-xs shrink-0"
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
    </>
  );
}

export default LanguageSelector;
