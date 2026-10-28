'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Hammer,
  BookOpen,
  Brain,
  GraduationCap,
  Undo2,
  Redo2,
  Pencil,
  Check,
  Home,
  Save,
  History,
} from 'lucide-react';
import { usePalaceStore } from '@/store/usePalaceStore';
import { LanguageSelector } from '@/components/LanguageSelector';
import { getTranslations } from '@/lib/translations';
import type { Locale, PinRecallStatus, RoomPin, StudyMode } from '@/types/palace';

function getEffectivePinStatus(pin: RoomPin): PinRecallStatus {
  if (pin.status) return pin.status;
  const s = pin.score ?? pin.lastScore;
  if (typeof s === 'number') {
    if (s >= 80) return 'MASTERED';
    if (s >= 50) return 'NEEDS_REVIEW';
    return 'FAILED';
  }
  return 'UNTESTED';
}

interface AppHeaderProps {
  locale: Locale;
}

export function AppHeader({ locale }: AppHeaderProps) {
  const t = getTranslations(locale);

  const {
    studyMode,
    currentRoom,
    folders,
    examHistory,
    setStudyMode,
    renamePalace,
    togglePalaceManager,
    toggleSavePalaceModal,
    toggleExamHistoryDrawer,
    undo,
    redo,
  } = usePalaceStore();

  const canUndo = usePalaceStore((state) => state.history.length > 0);
  const canRedo = usePalaceStore((state) => state.future.length > 0);

  const [isEditingHeaderTitle, setIsEditingHeaderTitle] = useState(false);
  const [headerTitleDraft, setHeaderTitleDraft] = useState('');

  const activeFolder = folders.find(
    (f) => f.id === (currentRoom?.folderId || folders[0]?.id)
  );

  const handleSaveHeaderTitle = () => {
    if (currentRoom && headerTitleDraft.trim()) {
      renamePalace(currentRoom.id, headerTitleDraft.trim());
    }
    setIsEditingHeaderTitle(false);
  };

  const modes: {
    id: StudyMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'build', label: t.app.modes.build, icon: Hammer },
    { id: 'study', label: t.app.modes.study, icon: BookOpen },
    { id: 'memory', label: t.app.modes.recall, icon: Brain },
    { id: 'exam', label: t.app.modes.exam, icon: GraduationCap },
  ];

  // Dynamic Palace Retention Score calculation
  const pins = currentRoom?.pins ?? [];
  const totalPins = pins.length;
  const masteredCount = pins.filter(
    (p) => getEffectivePinStatus(p) === 'MASTERED'
  ).length;
  const computedRetention =
    totalPins > 0 ? Math.round((masteredCount / totalPins) * 100) : 0;
  const retentionPercent =
    typeof currentRoom?.retentionRate === 'number'
      ? currentRoom.retentionRate
      : computedRetention;

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between gap-4 shrink-0 z-40">
      {/* LEFT: Brand Logo + Breadcrumb (Folder / Palace Name + Inline Rename) + Save + Undo/Redo */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href={`/${locale}`}
          className="text-base font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-90 transition shrink-0"
        >
          {t.nav.brand}
        </Link>

        <span className="text-slate-700">/</span>

        {/* Breadcrumb: Folder / Palace Name */}
        <div className="flex items-center gap-1.5 text-xs min-w-0">
          <button
            type="button"
            onClick={() => togglePalaceManager(true)}
            className="hidden sm:inline-flex items-center gap-1 rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition truncate max-w-[160px]"
            title={t.nav.myPalaces}
          >
            <span>📁</span>
            <span className="truncate">
              {activeFolder?.name || t.app.manager.noFolderOption}
            </span>
          </button>

          <span className="hidden sm:inline text-slate-700">/</span>

          {isEditingHeaderTitle && currentRoom ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={headerTitleDraft}
                onChange={(e) => setHeaderTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveHeaderTitle();
                  if (e.key === 'Escape') setIsEditingHeaderTitle(false);
                }}
                autoFocus
                className="rounded-lg border border-indigo-500 bg-slate-900 px-2 py-0.5 text-xs font-bold text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveHeaderTitle}
                className="rounded-lg bg-emerald-500/20 p-1 text-emerald-300 hover:bg-emerald-500/30"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-bold text-white truncate max-w-[180px] sm:max-w-[220px]">
                🏛️ {currentRoom ? currentRoom.name : t.app.manager.newPalaceBtn}
              </span>
              {currentRoom && (
                <button
                  type="button"
                  onClick={() => {
                    setHeaderTitleDraft(currentRoom.name);
                    setIsEditingHeaderTitle(true);
                  }}
                  title="Rename"
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-white transition shrink-0"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Save Palace Button */}
        <button
          type="button"
          onClick={() => toggleSavePalaceModal(true)}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-colors shrink-0"
          title={t.nav.savePalaceTitle || 'Guardar Palacio y organizar carpeta'}
        >
          <Save className="h-3.5 w-3.5" />
          <span>{t.nav.saveBtn || 'Guardar'}</span>
        </button>

        {/* Compact Undo / Redo */}
        <div className="hidden md:flex items-center rounded-lg border border-slate-800 bg-slate-900/70 p-0.5 ml-1">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`rounded p-1 transition ${
              canUndo
                ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`rounded p-1 transition ${
              canRedo
                ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* CENTER: 4-Segment Mode Pill Selector (Construir | Estudiar | Memoria | Examen) */}
      <div
        role="tablist"
        aria-label="LociPalace Study Modes"
        className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1 shrink-0"
      >
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = studyMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setStudyMode(m.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 shadow-sm shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* RIGHT: Memory Health Score Badge + Exam History Button + LanguageSelector (EXACTLY ONCE) + Home Link */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div
          title={`${masteredCount}/${totalPins} ${t.nav.mastered}`}
          className="hidden lg:inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1 text-xs font-semibold"
        >
          <Brain className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-slate-400">{t.nav.retentionScore}:</span>
          <span
            className={`font-mono font-bold ${
              retentionPercent >= 80
                ? 'text-emerald-400'
                : retentionPercent >= 50
                ? 'text-amber-400'
                : 'text-cyan-400'
            }`}
          >
            {retentionPercent}%
          </span>
          <span className="text-[10px] text-slate-500">
            ({masteredCount}/{totalPins})
          </span>
        </div>

        <button
          type="button"
          onClick={() => toggleExamHistoryDrawer(true)}
          title={t.app.exam.historyTitle}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:border-indigo-500/40 hover:bg-slate-800 hover:text-white transition"
        >
          <History className="h-3.5 w-3.5 text-indigo-400" />
          <span className="hidden md:inline">{t.app.exam.viewHistory}</span>
          {examHistory.length > 0 && (
            <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-indigo-300">
              {examHistory.length}
            </span>
          )}
        </button>

        <LanguageSelector />

        <Link
          href={`/${locale}`}
          title={t.nav.backToHome}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition"
        >
          <Home className="h-4 w-4 text-cyan-400" />
        </Link>
      </div>
    </header>
  );
}
