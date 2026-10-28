'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePalaceStore } from '@/store/usePalaceStore';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { PalaceCanvas } from '@/components/PalaceCanvas';
import { PinModal } from '@/components/PinModal';
import { RecallModal } from '@/components/RecallModal';
import { ImageLightbox } from '@/components/ImageLightbox';
import { PalaceManagerModal } from '@/components/PalaceManagerModal';
import { SavePalaceModal } from '@/components/SavePalaceModal';
import { ExamHistoryDrawer } from '@/components/exam/ExamHistoryDrawer';
import type { Locale } from '@/types/palace';

export default function WorkspaceAppPage() {
  const locale = useLocale() as Locale;
  const { undo, redo } = usePalaceStore();

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Global Keyboard Shortcuts for Undo (Ctrl+Z / Cmd+Z) and Redo (Ctrl+Shift+Z / Ctrl+Y / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      const key = e.key.toLowerCase();

      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  if (!hydrated) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-3 text-sm text-slate-300 backdrop-blur">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 animate-ping" />
          <span>LociPalace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden overflow-x-hidden flex flex-col bg-slate-950 text-slate-100">
      {/* Sleek Single-Row Top Navigation Toolbar */}
      <AppHeader locale={locale} />

      {/* 3-Column Workspace Body (Left Sidebar | Central Canvas | Right Drawer) */}
      <div className="flex-1 flex overflow-hidden overflow-x-hidden relative">
        <AppSidebar />
        <PalaceCanvas />
        <PinModal />
      </div>

      {/* Overlay Modals */}
      <RecallModal />
      <ImageLightbox />
      <PalaceManagerModal />
      <SavePalaceModal locale={locale} />
      <ExamHistoryDrawer />
    </div>
  );
}
