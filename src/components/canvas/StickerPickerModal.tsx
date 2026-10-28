'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Maximize2, Check, X, CheckCircle2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePalaceStore } from '@/store/usePalaceStore';
import { getTranslations } from '@/lib/translations';

interface StickerPickerModalProps {
  isOpen: boolean;
  selectedUrl?: string;
  onSelect: (url: string, prompt: string) => void;
  onStickerDeleted?: (deletedUrl: string) => void;
}

export function StickerPickerModal({
  isOpen,
  selectedUrl,
  onSelect,
  onStickerDeleted,
}: StickerPickerModalProps) {
  const locale = useLocale();
  const t = getTranslations(locale).app.pinModal;

  const { stickerGallery, deleteCustomSticker, openLightbox } =
    usePalaceStore();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletedToast, setDeletedToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmDelete = (stickerId: string, stickerUrl: string) => {
    deleteCustomSticker(stickerId);
    setConfirmDeleteId(null);
    if (onStickerDeleted) {
      onStickerDeleted(stickerUrl);
    }
    setDeletedToast(t.stickerDeleted);
    window.setTimeout(() => {
      setDeletedToast(null);
    }, 2600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 space-y-2">
            {deletedToast && (
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>{deletedToast}</span>
              </div>
            )}

            {stickerGallery.length === 0 ? (
              <p className="py-3 text-center text-[11px] text-slate-500">
                0 stickers
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1">
                {stickerGallery.map((item) => {
                  const isCurrent = selectedUrl === item.url;
                  const isConfirming = confirmDeleteId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                        isCurrent
                          ? 'border-cyan-400 ring-1 ring-cyan-400/40'
                          : 'border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(item.url, item.prompt)}
                        title={item.prompt}
                        className="h-full w-full focus:outline-none"
                      >
                        <img
                          src={item.url}
                          alt={item.prompt}
                          className="h-full w-full object-cover bg-slate-950"
                        />
                      </button>

                      {/* Top-Left Lightbox Zoom Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLightbox({
                            url: item.url,
                            prompt: item.prompt,
                          });
                        }}
                        className="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded bg-slate-950/85 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-cyan-500 hover:text-slate-950"
                      >
                        <Maximize2 className="h-3 w-3" />
                      </button>

                      {/* Top-Right Red Trash Delete Button on Hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(item.id);
                        }}
                        title={t.deleteStickerConfirm}
                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded bg-rose-600/90 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-500 shadow"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      {/* Active Check Badge (Bottom-Right when selected) */}
                      {isCurrent && !isConfirming && (
                        <span className="pointer-events-none absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow">
                          <Check className="h-3 w-3" />
                        </span>
                      )}

                      {/* Quick Delete Confirmation Popover Overlay */}
                      {isConfirming && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-slate-950/95 p-1.5 text-center"
                        >
                          <p className="text-[9px] font-bold leading-tight text-slate-200 line-clamp-2">
                            {t.deleteStickerConfirm}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleConfirmDelete(item.id, item.url)
                              }
                              className="flex h-5 w-6 items-center justify-center rounded bg-rose-500 text-white hover:bg-rose-400"
                              title={t.btnDeletePin}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="flex h-5 w-6 items-center justify-center rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                              title={t.btnCancel}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
