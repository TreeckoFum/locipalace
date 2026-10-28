'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trash2,
  Save,
  Sparkles,
  MapPin,
  Loader2,
  Images,
  RefreshCw,
  Unlink,
  Check,
  Maximize2,
  Clock,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePalaceStore } from '@/store/usePalaceStore';
import { getTranslations } from '@/lib/translations';
import { StickerPickerModal } from '@/components/canvas/StickerPickerModal';

export function PinModal() {
  const locale = useLocale();
  const t = getTranslations(locale).app.pinModal;

  const {
    currentMode,
    isPinModalOpen,
    selectedPin,
    pendingCoords,
    stickerGallery,
    cooldownSeconds,
    cooldownUntil,
    setCooldownSeconds,
    syncCooldownClock,
    addStickerToGallery,
    saveGeneratedHookAndSticker,
    assignStickerToPin,
    removeStickerFromPin,
    openLightbox,
    addPin,
    updatePin,
    deletePin,
    closePinModal,
    setSelectedPin,
  } = usePalaceStore();

  const [title, setTitle] = useState('');
  const [concept, setConcept] = useState('');
  const [detailedNotes, setDetailedNotes] = useState('');
  const [mnemonicVisual, setMnemonicVisual] = useState('');
  const [triggerWord, setTriggerWord] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [currentStickerPrompt, setCurrentStickerPrompt] = useState<string>('');

  const [isLoadingHook, setIsLoadingHook] = useState(false);
  const [mnemonicError, setMnemonicError] = useState<string | null>(null);

  const [isGeneratingSticker, setIsGeneratingSticker] = useState(false);
  const [stickerError, setStickerError] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Drawer is visible when creating/editing in BUILD mode OR inspecting in STUDY mode
  const isDrawerOpen =
    isPinModalOpen || (currentMode === 'STUDY' && Boolean(selectedPin));
  const isEditing = Boolean(selectedPin);

  const handleCloseDrawer = () => {
    closePinModal();
    setSelectedPin(null);
  };

  // Close drawer on ESC key
  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Sync cooldown clock on open & tick every 1 second while cooldown is active
  useEffect(() => {
    syncCooldownClock();
    if (!cooldownUntil && cooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      syncCooldownClock();
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil, cooldownSeconds, syncCooldownClock]);

  useEffect(() => {
    const legacyDummySnippets = [
      'Three giant baseball CAPs',
      'tiny glowing mitochondria pedaling',
      'vibrates at relativistic speed',
    ];

    if (selectedPin) {
      const pinHook = selectedPin.hook ?? '';
      const pinVisual = selectedPin.mnemonicVisual ?? '';
      const rawHook = pinHook || pinVisual;
      const isStaleDummy = legacyDummySnippets.some(
        (snippet) =>
          pinHook.includes(snippet) ||
          pinVisual.includes(snippet) ||
          mnemonicVisual.includes(snippet)
      );

      if (isStaleDummy) {
        selectedPin.hook = '';
        selectedPin.mnemonicVisual = '';
        usePalaceStore.setState((state) => ({
          palaces: state.palaces.map((palace) => ({
            ...palace,
            pins: palace.pins.map((p) =>
              p.id === selectedPin.id
                ? { ...p, hook: '', mnemonicVisual: '' }
                : p
            ),
          })),
          currentRoom: state.currentRoom
            ? {
                ...state.currentRoom,
                pins: state.currentRoom.pins.map((p) =>
                  p.id === selectedPin.id
                    ? { ...p, hook: '', mnemonicVisual: '' }
                    : p
                ),
              }
            : state.currentRoom,
          selectedPin:
            state.selectedPin?.id === selectedPin.id
              ? { ...state.selectedPin, hook: '', mnemonicVisual: '' }
              : state.selectedPin,
        }));
      }

      setTitle(selectedPin.title);
      setConcept(selectedPin.concept);
      setDetailedNotes(selectedPin.detailedNotes || selectedPin.notes || '');
      setMnemonicVisual(isStaleDummy ? '' : rawHook);
      setTriggerWord(isStaleDummy ? '' : selectedPin.triggerWord ?? '');
      setImageUrl(selectedPin.customSticker ?? selectedPin.imageUrl);
      setCurrentStickerPrompt('');
      setMnemonicError(null);
      setStickerError(null);
      setIsLoadingHook(false);
      setIsGeneratingSticker(false);
      setIsGalleryOpen(false);
    } else if (pendingCoords) {
      setTitle('');
      setConcept('');
      setDetailedNotes('');
      setMnemonicVisual('');
      setTriggerWord('');
      setImageUrl(undefined);
      setCurrentStickerPrompt('');
      setMnemonicError(null);
      setStickerError(null);
      setIsLoadingHook(false);
      setIsGeneratingSticker(false);
      setIsGalleryOpen(false);
    } else if (
      mnemonicVisual &&
      legacyDummySnippets.some((snippet) => mnemonicVisual.includes(snippet))
    ) {
      setMnemonicVisual('');
    }
  }, [selectedPin?.id, pendingCoords, isDrawerOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !concept.trim()) return;

    if (selectedPin) {
      updatePin(selectedPin.id, {
        title: title.trim(),
        anchorName: title.trim(),
        concept: concept.trim(),
        notes: detailedNotes.trim(),
        detailedNotes: detailedNotes.trim(),
        hook: mnemonicVisual.trim() || undefined,
        triggerWord: triggerWord.trim() || undefined,
        mnemonicVisual: mnemonicVisual.trim() || undefined,
        customSticker: imageUrl || undefined,
        imageUrl: imageUrl || undefined,
      });
    } else if (pendingCoords) {
      addPin({
        x: pendingCoords.x,
        y: pendingCoords.y,
        title: title.trim(),
        anchorName: title.trim(),
        concept: concept.trim(),
        notes: detailedNotes.trim(),
        detailedNotes: detailedNotes.trim(),
        hook: mnemonicVisual.trim() || undefined,
        triggerWord: triggerWord.trim() || undefined,
        mnemonicVisual: mnemonicVisual.trim() || undefined,
        customSticker: imageUrl || undefined,
        imageUrl: imageUrl || undefined,
      });
    }
  };

  const handleDelete = () => {
    if (!selectedPin) return;
    deletePin(selectedPin.id);
  };

  const handleGenerateMnemonic = async () => {
    const currentAnchor = title.trim();
    const currentConcept = concept.trim();
    const currentNotes = detailedNotes.trim();

    if (!currentAnchor || !currentConcept) {
      setMnemonicError(`${t.fieldObjectLabel} + ${t.fieldConceptLabel}`);
      return;
    }

    setIsLoadingHook(true);
    setMnemonicError(null);

    try {
      const res = await fetch('/api/generate-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptTitle: currentConcept,
          anchorName: currentAnchor,
          notes: currentNotes || currentConcept,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || t.serverBusyError);
      }

      const generatedHook: string = data.hook || data.hookText || '';
      const generatedTrigger: string = data.triggerWord || '';
      const generatedSvg: string = data.stickerSvg || '';

      setTriggerWord(generatedTrigger);
      setMnemonicVisual(generatedHook);

      if (generatedSvg) {
        const stickerDataUri = saveGeneratedHookAndSticker(
          selectedPin ? selectedPin.id : null,
          generatedHook,
          generatedTrigger,
          generatedSvg
        );
        setImageUrl(stickerDataUri);
        setCurrentStickerPrompt(
          generatedTrigger
            ? `${generatedTrigger} — ${generatedHook}`
            : generatedHook
        );
      }
    } catch (err) {
      setMnemonicError(
        err instanceof Error && err.message ? err.message : t.serverBusyError
      );
    } finally {
      setIsLoadingHook(false);
    }
  };

  const handleGenerateSticker = async () => {
    if (cooldownSeconds > 0 || isGeneratingSticker) return;

    if (!title.trim() || !concept.trim()) {
      setStickerError(`${t.fieldObjectLabel} + ${t.fieldConceptLabel}`);
      return;
    }

    setIsGeneratingSticker(true);
    setStickerError(null);

    try {
      const res = await fetch('/api/generate-sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          physicalObject: title.trim(),
          targetConcept: concept.trim(),
          mnemonicHook: mnemonicVisual.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 429 || data?.error === 'RATE_LIMIT') {
        const waitSec = Number(data?.retryAfterSeconds) || 15;
        setCooldownSeconds(waitSec);
        setStickerError(data?.message || t.imageGenError);
        return;
      }

      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || t.imageGenError);
      }

      if (data.imageUrl) {
        const promptUsed =
          data.promptUsed || `${title.trim()} + ${concept.trim()}`;
        addStickerToGallery(data.imageUrl, promptUsed);
        setImageUrl(data.imageUrl);
        setCurrentStickerPrompt(promptUsed);
        if (selectedPin) {
          assignStickerToPin(selectedPin.id, data.imageUrl);
        }
        setCooldownSeconds(Number(data.cooldownSeconds) || 5);
      } else {
        throw new Error(t.imageGenError);
      }
    } catch (err) {
      setStickerError(
        err instanceof Error ? err.message : t.imageGenError
      );
    } finally {
      setIsGeneratingSticker(false);
    }
  };

  const handleSelectFromGallery = (url: string, prompt: string) => {
    setImageUrl(url);
    setCurrentStickerPrompt(prompt);
    if (selectedPin) {
      assignStickerToPin(selectedPin.id, url);
    }
    setIsGalleryOpen(false);
  };

  const handleRemoveSticker = () => {
    setImageUrl(undefined);
    setCurrentStickerPrompt('');
    if (selectedPin) {
      removeStickerFromPin(selectedPin.id);
    }
  };

  const coords = selectedPin
    ? { x: selectedPin.x, y: selectedPin.y }
    : pendingCoords;

  const isStickerButtonDisabled = isGeneratingSticker || cooldownSeconds > 0;

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <motion.aside
          initial={{ x: 340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 340, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          className="w-80 sm:w-96 border-l border-slate-800 bg-slate-900/90 backdrop-blur-xl p-5 flex flex-col overflow-y-auto shrink-0 h-full z-30"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  {isEditing ? t.editTitle : t.newTitle}
                </h2>
                {coords && (
                  <p className="text-[11px] text-slate-400">
                    {t.coords}: X {coords.x.toFixed(1)}% · Y{' '}
                    {coords.y.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              aria-label={t.btnCancel}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              {/* Object Title */}
              <div className="space-y-1">
                <label
                  htmlFor="pin-object-title"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300"
                >
                  {t.fieldObjectLabel}
                </label>
                <input
                  id="pin-object-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.fieldObjectPlaceholder}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Target Concept */}
              <div className="space-y-1">
                <label
                  htmlFor="pin-target-concept"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300"
                >
                  {t.fieldConceptLabel}
                </label>
                <input
                  id="pin-target-concept"
                  type="text"
                  required
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder={t.fieldConceptPlaceholder}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Detailed Notes */}
              <div className="space-y-1">
                <label
                  htmlFor="pin-detailed-notes"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300"
                >
                  {t.fieldNotesLabel}
                </label>
                <textarea
                  id="pin-detailed-notes"
                  rows={3}
                  value={detailedNotes}
                  onChange={(e) => setDetailedNotes(e.target.value)}
                  placeholder={t.fieldNotesPlaceholder}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              {/* AI Mnemonic Text Hook Generator */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleGenerateMnemonic}
                  disabled={isLoadingHook}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/15 via-violet-500/15 to-cyan-500/15 px-3 py-2 text-xs font-semibold text-indigo-200 hover:border-indigo-400/70 hover:from-indigo-500/25 hover:to-cyan-500/25 disabled:opacity-50 transition"
                >
                  {isLoadingHook ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                      <span>{t.btnGeneratingHook}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{t.btnGenHook}</span>
                    </>
                  )}
                </button>

                {mnemonicError && (
                  <p className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg px-2.5 py-1.5">
                    {mnemonicError}
                  </p>
                )}

                {triggerWord && (
                  <div className="flex items-center justify-between rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-2.5 py-1 text-[11px]">
                    <span className="font-semibold text-indigo-300">
                      ⚡ {t.triggerWordLabel}
                    </span>
                    <span className="font-mono font-bold text-cyan-300">
                      {triggerWord}
                    </span>
                  </div>
                )}

                <label className="block text-[11px] font-semibold text-cyan-300">
                  {t.hookTitle}
                </label>
                <textarea
                  rows={3}
                  value={mnemonicVisual}
                  onChange={(e) => setMnemonicVisual(e.target.value)}
                  placeholder={t.hookTitle}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-cyan-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>

              {/* Visual Mnemonic Sticker System Section */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                    {t.stickerSectionTitle}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {stickerGallery.length}
                  </span>
                </div>

                {/* Sticker Action Row */}
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateSticker}
                    disabled={isStickerButtonDisabled}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-200 transition ${
                      isStickerButtonDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-cyan-500/25'
                    }`}
                  >
                    {isGeneratingSticker ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                        <span>{t.btnGeneratingHook}</span>
                      </>
                    ) : cooldownSeconds > 0 ? (
                      <span>
                        {t.cooldownWait.replace(
                          '{seconds}',
                          String(cooldownSeconds)
                        )}
                      </span>
                    ) : (
                      <span>{t.btnGenSticker}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGalleryOpen((prev) => !prev)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                  >
                    <Images className="h-3.5 w-3.5 text-indigo-400" />
                    <span>
                      {t.btnPickGallery} ({stickerGallery.length})
                    </span>
                  </button>
                </div>

                {/* Active Cooldown Amber Info Alert Box */}
                {cooldownSeconds > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-300">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <span>
                      {t.cooldownNotice.replace(
                        '{seconds}',
                        String(cooldownSeconds)
                      )}
                    </span>
                  </div>
                )}

                {stickerError && (
                  <p className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg px-2.5 py-1.5">
                    {stickerError}
                  </p>
                )}

                {/* Inline Gallery Selector Sheet */}
                <StickerPickerModal
                  isOpen={isGalleryOpen}
                  selectedUrl={imageUrl}
                  onSelect={handleSelectFromGallery}
                  onStickerDeleted={(deletedUrl) => {
                    if (imageUrl === deletedUrl) {
                      setImageUrl(undefined);
                      setCurrentStickerPrompt('');
                    }
                  }}
                />

                {/* Current Sticker Preview & Actions */}
                {imageUrl && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        openLightbox({
                          url: imageUrl,
                          prompt: currentStickerPrompt || undefined,
                          title:
                            title && concept
                              ? `${title} · ${concept}`
                              : t.stickerSectionTitle,
                        })
                      }
                      className="group relative h-14 w-14 shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-white/20 bg-slate-950 shadow-lg"
                    >
                      <img
                        src={imageUrl}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Maximize2 className="h-4 w-4 text-white" />
                      </span>
                    </button>

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={handleGenerateSticker}
                        disabled={isStickerButtonDisabled}
                        className={`inline-flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition ${
                          isStickerButtonDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <RefreshCw
                          className={`h-3 w-3 ${
                            isGeneratingSticker
                              ? 'animate-spin text-cyan-400'
                              : ''
                          }`}
                        />
                        <span>
                          {cooldownSeconds > 0
                            ? `⏳ ${cooldownSeconds}s`
                            : t.btnRegenerateSticker}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveSticker}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                      >
                        <Unlink className="h-3 w-3" />
                        <span>{t.btnRemoveSticker}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-4">
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{t.btnDeletePin}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  {t.btnCancel}
                </button>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-cyan-400 transition"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{t.btnSavePin}</span>
              </button>
            </div>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
