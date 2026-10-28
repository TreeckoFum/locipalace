'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check, Sparkles, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePalaceStore } from '@/store/usePalaceStore';
import { getTranslations } from '@/lib/translations';

function getHighResUrl(url: string): string {
  if (url.includes('image.pollinations.ai')) {
    return url
      .replace(/width=\d+/g, 'width=1024')
      .replace(/height=\d+/g, 'height=1024');
  }
  return url;
}

export function ImageLightbox() {
  const locale = useLocale();
  const t = getTranslations(locale).app.lightbox;
  const { lightboxImage, closeLightbox, stickerGallery } = usePalaceStore();

  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // ESC key listener to close lightbox
  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [lightboxImage, closeLightbox]);

  if (!lightboxImage) {
    return null;
  }

  const galleryMatch = stickerGallery.find(
    (item) => item.url === lightboxImage.url
  );
  const resolvedPrompt =
    lightboxImage.prompt ||
    galleryMatch?.prompt ||
    'Die-cut 3D cartoon visual mnemonic sticker isolated on pure black background.';

  const fullResUrl = getHighResUrl(lightboxImage.url);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(resolvedPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // Fallback copy
    }
  };

  const handleDownloadSticker = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(fullResUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      const safeTitle = (lightboxImage.title || 'mnemonic-sticker')
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-');
      link.download = `locipalace-${safeTitle}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    } catch {
      window.open(fullResUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {lightboxImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 backdrop-blur-md bg-black/85"
          />

          {/* Lightbox Content Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl shadow-black"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  {lightboxImage.title || t.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSticker}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-indigo-500/20 hover:from-indigo-400 hover:to-cyan-400 disabled:opacity-50 transition"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{t.downloadBtn}...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>{t.downloadBtn}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={closeLightbox}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                  aria-label="Close Lightbox"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Full-Resolution Image Container */}
            <div className="relative flex items-center justify-center bg-slate-950 p-4 sm:p-6">
              <img
                src={fullResUrl}
                alt={lightboxImage.title || t.title}
                className="high-quality-image max-h-[62vh] w-auto max-w-full rounded-2xl border border-white/15 object-contain shadow-2xl"
              />
            </div>

            {/* Visual Prompt Footer with Copy Button */}
            <div className="border-t border-slate-800 bg-slate-900/90 px-5 py-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t.promptUsedLabel}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-300">{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-cyan-400" />
                      <span>{t.copyPromptBtn}</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {resolvedPrompt}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
