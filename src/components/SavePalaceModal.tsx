'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  FolderPlus,
  Folder,
  Check,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePalaceStore } from '@/store/usePalaceStore';
import { getTranslations } from '@/lib/translations';

interface SavePalaceModalProps {
  locale?: string;
}

export function SavePalaceModal({ locale: propLocale }: SavePalaceModalProps) {
  const hookLocale = useLocale();
  const activeLocale = propLocale || hookLocale;
  const t = getTranslations(activeLocale);

  const {
    currentRoom,
    folders,
    isSavePalaceModalOpen,
    toggleSavePalaceModal,
    savePalaceDetails,
    createFolder,
  } = usePalaceStore();

  const [palaceName, setPalaceName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Sync form state whenever modal opens or active palace changes
  useEffect(() => {
    if (isSavePalaceModalOpen && currentRoom) {
      setPalaceName(currentRoom.name);
      setSelectedFolderId(currentRoom.folderId ?? '');
      setIsCreatingFolder(false);
      setNewFolderName('');
    }
  }, [isSavePalaceModalOpen, currentRoom?.id, currentRoom?.name, currentRoom?.folderId]);

  // ESC key listener to close modal
  useEffect(() => {
    if (!isSavePalaceModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        toggleSavePalaceModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSavePalaceModalOpen, toggleSavePalaceModal]);

  const handleCreateInlineFolder = () => {
    if (!newFolderName.trim()) return;
    const createdId = createFolder(newFolderName.trim());
    setSelectedFolderId(createdId);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !palaceName.trim()) return;

    savePalaceDetails(
      currentRoom.id,
      palaceName.trim(),
      selectedFolderId || undefined
    );

    setShowSuccessToast(true);
    toggleSavePalaceModal(false);

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 2800);
  };

  return (
    <>
      {/* Floating Green Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="fixed top-16 right-6 z-[95] flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/90 px-4 py-2.5 text-xs font-bold text-emerald-200 shadow-2xl backdrop-blur-md"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{t.nav.saveSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save & Organize Palace Modal (z-[85]) */}
      <AnimatePresence>
        {isSavePalaceModalOpen && currentRoom && (
          <div className="fixed inset-0 z-[85] flex items-end md:items-center justify-center p-0 md:p-4">
            {/* Dark Glassmorphic Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => toggleSavePalaceModal(false)}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
            />

            {/* Modal Card (Bottom Sheet on < md, Centered on md+) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="relative z-10 w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl md:rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black"
            >
              {/* Mobile Drag Handle Pill */}
              <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-slate-700 md:hidden" />
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-400">
                    <Save className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      {t.nav.saveModalHeader}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {t.nav.saveModalDesc}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSavePalaceModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                  aria-label={t.app.manager.btnCancel}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveSubmit} className="p-6 space-y-4">
                {/* Palace Name Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="save-palace-name-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                  >
                    {t.nav.palaceNameLabel}
                  </label>
                  <input
                    id="save-palace-name-input"
                    type="text"
                    required
                    autoFocus
                    value={palaceName}
                    onChange={(e) => setPalaceName(e.target.value)}
                    placeholder={t.app.manager.newPalaceNamePlaceholder}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Destination Folder Dropdown + Inline "+ Nueva Carpeta" */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="save-palace-folder-select"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                    >
                      {t.nav.folderLabel}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingFolder((prev) => !prev)}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500/20 transition"
                    >
                      <FolderPlus className="h-3 w-3" />
                      <span>+ {t.app.manager.newFolderBtn}</span>
                    </button>
                  </div>

                  {/* Inline New Folder Input */}
                  <AnimatePresence>
                    {isCreatingFolder && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-slate-950 p-1.5 mb-1">
                          <Folder className="h-4 w-4 text-indigo-400 ml-1.5 shrink-0" />
                          <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateInlineFolder();
                              }
                            }}
                            placeholder={t.app.manager.newFolderPlaceholder}
                            className="w-full bg-transparent px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleCreateInlineFolder}
                            className="rounded-lg bg-indigo-500 p-1.5 text-slate-950 hover:bg-indigo-400"
                            title={t.app.manager.newFolderBtn}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCreatingFolder(false)}
                            className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <select
                    id="save-palace-folder-select"
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">{t.nav.noFolderLabel}</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        📁 {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col-reverse md:flex-row items-center justify-end gap-2.5 border-t border-slate-800 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => toggleSavePalaceModal(false)}
                    className="w-full md:w-auto cursor-pointer rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                  >
                    {t.app.manager.btnCancel}
                  </button>

                  <button
                    type="submit"
                    className="w-full md:w-auto cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-cyan-400 transition"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{t.nav.saveChangesBtn}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
