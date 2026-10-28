'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Upload,
  Layers,
  MapPin,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePalaceStore, SAMPLE_STUDY_DESK_SVG } from '@/store/usePalaceStore';
import { getTranslations } from '@/lib/translations';
import { compressImageWithMeta } from '@/lib/imageCompression';

export function PalaceManagerModal() {
  const locale = useLocale();
  const fullT = getTranslations(locale);
  const t = fullT.app.manager;
  const {
    folders,
    palaces,
    activePalaceId,
    isPalaceManagerOpen,
    createFolder,
    renameFolder,
    deleteFolder,
    createPalace,
    renamePalace,
    deletePalace,
    movePalaceToFolder,
    setActivePalace,
    togglePalaceManager,
  } = usePalaceStore();

  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('ALL');

  // New Folder State
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Edit Folder State
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Edit Palace State
  const [editingPalaceId, setEditingPalaceId] = useState<string | null>(null);
  const [editingPalaceName, setEditingPalaceName] = useState('');

  // Create New Palace State
  const [isCreatingPalace, setIsCreatingPalace] = useState(false);
  const [newPalaceName, setNewPalaceName] = useState('');
  const [newPalaceFolderId, setNewPalaceFolderId] = useState<string>(
    folders[0]?.id ?? ''
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Confirmation Dialog State before Deleting Palace or Folder
  const [pendingDelete, setPendingDelete] = useState<{
    type: 'palace' | 'folder';
    id: string;
    name: string;
  } | null>(null);

  if (!isPalaceManagerOpen) {
    return null;
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'palace') {
      deletePalace(pendingDelete.id);
    } else {
      if (selectedFolderFilter === pendingDelete.id) {
        setSelectedFolderFilter('ALL');
      }
      deleteFolder(pendingDelete.id);
    }
    setPendingDelete(null);
  };

  const filteredPalaces = palaces.filter((p) => {
    if (selectedFolderFilter === 'ALL') return true;
    if (selectedFolderFilter === 'UNFILED') return !p.folderId;
    return p.folderId === selectedFolderFilter;
  });

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const id = createFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
    setSelectedFolderFilter(id);
  };

  const handleSaveFolderRename = (id: string) => {
    if (editingFolderName.trim()) {
      renameFolder(id, editingFolderName.trim());
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleSavePalaceRename = (id: string) => {
    if (editingPalaceName.trim()) {
      renamePalace(id, editingPalaceName.trim());
    }
    setEditingPalaceId(null);
    setEditingPalaceName('');
  };

  const handleCreatePalaceWithDefaultRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const targetFolder =
      selectedFolderFilter !== 'ALL' && selectedFolderFilter !== 'UNFILED'
        ? selectedFolderFilter
        : newPalaceFolderId || undefined;

    createPalace(
      newPalaceName.trim() || 'Nuevo Palacio Mental',
      targetFolder,
      SAMPLE_STUDY_DESK_SVG,
      16 / 9
    );
    setNewPalaceName('');
    setIsCreatingPalace(false);
    togglePalaceManager(false);
  };

  const handleCreatePalaceFromPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const fallbackTitle = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ');

    const targetFolder =
      selectedFolderFilter !== 'ALL' && selectedFolderFilter !== 'UNFILED'
        ? selectedFolderFilter
        : newPalaceFolderId || undefined;

    try {
      const { dataUrl, aspectRatio } = await compressImageWithMeta(
        file,
        1920,
        0.75
      );
      createPalace(
        newPalaceName.trim() || fallbackTitle || 'Nuevo Palacio Mental',
        targetFolder,
        dataUrl,
        aspectRatio
      );
    } catch {
      const objectUrl = URL.createObjectURL(file);
      createPalace(
        newPalaceName.trim() || fallbackTitle || 'Nuevo Palacio Mental',
        targetFolder,
        objectUrl,
        16 / 9
      );
    }

    setNewPalaceName('');
    setIsCreatingPalace(false);
    togglePalaceManager(false);
  };

  return (
    <AnimatePresence>
      {isPalaceManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => togglePalaceManager(false)}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Confirmation Dialog Modal */}
          {pendingDelete && (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="manager-delete-confirm-title"
              aria-describedby="manager-delete-confirm-desc"
              className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4"
            >
              <div
                onClick={() => setPendingDelete(null)}
                className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
              />
              <div className="relative z-10 w-full max-w-md rounded-t-3xl md:rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/15 text-rose-400">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3
                      id="manager-delete-confirm-title"
                      className="text-sm font-bold text-white"
                    >
                      {pendingDelete.type === 'palace'
                        ? locale === 'ca'
                          ? 'Eliminar palau mental'
                          : locale === 'en'
                          ? 'Delete memory palace'
                          : 'Eliminar palacio mental'
                        : locale === 'ca'
                        ? 'Eliminar carpeta'
                        : locale === 'en'
                        ? 'Delete folder'
                        : 'Eliminar carpeta'}
                      : “{pendingDelete.name}”
                    </h3>
                    <p
                      id="manager-delete-confirm-desc"
                      className="text-xs leading-relaxed text-slate-300"
                    >
                      {pendingDelete.type === 'palace'
                        ? locale === 'ca'
                          ? 'Segur que vols eliminar aquest palau mental? Aquesta acció no es pot desfer.'
                          : locale === 'en'
                          ? 'Are you sure you want to delete this memory palace? This action cannot be undone.'
                          : '¿Seguro que deseas eliminar este palacio mental? Esta acción no se puede deshacer.'
                        : locale === 'ca'
                        ? 'Segur que vols eliminar aquesta carpeta? Els palaus que conté passaran a Sense carpeta.'
                        : locale === 'en'
                        ? 'Are you sure you want to delete this folder? Its palaces will become unfiled.'
                        : '¿Seguro que deseas eliminar esta carpeta? Los palacios que contiene pasarán a Sin carpeta.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse md:flex-row items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPendingDelete(null)}
                    className="w-full md:w-auto cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                  >
                    {t.btnCancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="w-full md:w-auto cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-500 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t.btnDelete}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Container (Bottom Sheet on mobile < md, Centered Dialog on md+) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="relative z-10 flex h-[88vh] md:h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl md:rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl shadow-black"
          >
            {/* Mobile Drag Handle Pill */}
            <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-slate-700 md:hidden" />
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-400">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {t.title}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {t.subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => togglePalaceManager(false)}
                className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                aria-label={t.btnCancel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Main 2-Column Body */}
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
              {/* LEFT SIDEBAR: FOLDERS */}
              <aside className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {t.foldersHeader}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingFolder((prev) => !prev)}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500/25 transition"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      <span>{t.newFolderBtn}</span>
                    </button>
                  </div>

                  {/* New Folder Form */}
                  {isCreatingFolder && (
                    <form
                      onSubmit={handleCreateFolderSubmit}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-2"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder={t.newFolderPlaceholder}
                        className="w-full bg-transparent px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-indigo-500 p-1.5 text-slate-950 hover:bg-indigo-400"
                        title={t.newFolderBtn}
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
                    </form>
                  )}

                  {/* Folder Navigation List */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setSelectedFolderFilter('ALL')}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        selectedFolderFilter === 'ALL'
                          ? 'bg-indigo-500/20 text-white border border-indigo-500/40'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-indigo-400" />
                        <span>{t.allPalaces}</span>
                      </span>
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300">
                        {palaces.length}
                      </span>
                    </button>

                    {folders.map((folder) => {
                      const count = palaces.filter(
                        (p) => p.folderId === folder.id
                      ).length;
                      const isSelected = selectedFolderFilter === folder.id;
                      const isEditing = editingFolderId === folder.id;

                      return (
                        <div
                          key={folder.id}
                          className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                            isSelected
                              ? 'bg-indigo-500/20 text-white border border-indigo-500/40'
                              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex w-full items-center gap-1">
                              <input
                                type="text"
                                autoFocus
                                value={editingFolderName}
                                onChange={(e) =>
                                  setEditingFolderName(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter')
                                    handleSaveFolderRename(folder.id);
                                  if (e.key === 'Escape')
                                    setEditingFolderId(null);
                                }}
                                className="w-full rounded bg-slate-950 px-2 py-1 text-xs text-white border border-indigo-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveFolderRename(folder.id)}
                                className="rounded bg-emerald-500/20 p-1 text-emerald-300 hover:bg-emerald-500/30"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedFolderFilter(folder.id)}
                                className="flex flex-1 items-center gap-2 text-left truncate"
                              >
                                <Folder className="h-4 w-4 shrink-0 text-cyan-400" />
                                <span className="truncate">{folder.name}</span>
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingFolderId(folder.id);
                                    setEditingFolderName(folder.name);
                                  }}
                                  title="Renombrar carpeta"
                                  className="cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingDelete({
                                      type: 'folder',
                                      id: folder.id,
                                      name: folder.name,
                                    });
                                  }}
                                  title="Eliminar carpeta"
                                  className="cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                                <span className="ml-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300">
                                  {count}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setSelectedFolderFilter('UNFILED')}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        selectedFolderFilter === 'UNFILED'
                          ? 'bg-indigo-500/20 text-white border border-indigo-500/40'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-slate-500" />
                        <span>{t.noFolderOption}</span>
                      </span>
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400">
                        {palaces.filter((p) => !p.folderId).length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Quick Create New Palace Trigger at Bottom of Sidebar */}
                <div className="pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingPalace(true);
                      if (
                        selectedFolderFilter !== 'ALL' &&
                        selectedFolderFilter !== 'UNFILED'
                      ) {
                        setNewPalaceFolderId(selectedFolderFilter);
                      } else {
                        setNewPalaceFolderId(folders[0]?.id ?? '');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-cyan-400 transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t.newPalaceBtn}</span>
                  </button>
                </div>
              </aside>

              {/* RIGHT CONTENT: PALACE CARD GRID & CREATE FORM */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Inline Create Palace Drawer */}
                <AnimatePresence>
                  {isCreatingPalace && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-indigo-500/40 bg-indigo-950/20 p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">
                          {t.newPalaceBtn}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsCreatingPalace(false)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          {t.btnCancel}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-300">
                            {t.newPalaceBtn}
                          </label>
                          <input
                            type="text"
                            value={newPalaceName}
                            onChange={(e) => setNewPalaceName(e.target.value)}
                            placeholder={t.newPalaceNamePlaceholder}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-300">
                            {t.foldersHeader}
                          </label>
                          <select
                            value={newPalaceFolderId}
                            onChange={(e) => setNewPalaceFolderId(e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="">{t.noFolderOption}</option>
                            {folders.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCreatePalaceFromPhoto}
                        className="hidden"
                      />

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:from-indigo-400 hover:to-cyan-400 transition"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>{fullT.app.canvas.uploadPhoto}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCreatePalaceWithDefaultRoom}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                        >
                          <span>{t.btnCreateAndAnchor}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Palace Cards Grid or Empty State */}
                {filteredPalaces.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center space-y-3">
                    <FolderOpen className="h-10 w-10 text-indigo-400/70" />
                    <p className="text-sm font-bold text-white">
                      {t.newPalaceBtn}
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      {t.subtitle}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCreatingPalace(true)}
                      className="w-full md:w-auto cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:from-indigo-400 hover:to-cyan-400 transition"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t.newPalaceBtn}</span>
                    </button>
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredPalaces.map((palace) => {
                    const isActive = palace.id === activePalaceId;
                    const isEditing = editingPalaceId === palace.id;
                    const folderObj = folders.find(
                      (f) => f.id === palace.folderId
                    );
                    const masteredPins = palace.pins.filter(
                      (pin) => pin.status === 'MASTERED'
                    ).length;

                    return (
                      <div
                        key={palace.id}
                        className={`group flex flex-col overflow-hidden rounded-2xl border transition ${
                          isActive
                            ? 'border-cyan-400/70 bg-slate-900 ring-1 ring-cyan-400/30 shadow-xl'
                            : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                        }`}
                      >
                        {/* Thumbnail Preview */}
                        <div
                          onClick={() => {
                            setActivePalace(palace.id);
                            togglePalaceManager(false);
                          }}
                          className="relative h-36 w-full cursor-pointer overflow-hidden bg-slate-950"
                        >
                          <img
                            src={palace.imageUrl}
                            alt={palace.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                          {isActive && (
                            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-cyan-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950 shadow">
                              {t.activeBadge}
                            </span>
                          )}

                          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900/90 border border-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                              <MapPin className="h-3 w-3 text-cyan-400" />
                              {t.anchorsCount.replace(
                                '{count}',
                                String(palace.pins.length)
                              )}
                            </span>

                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-950/90 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              {masteredPins}/{palace.pins.length} {fullT.nav.mastered}
                            </span>
                          </div>
                        </div>

                        {/* Card Details & Controls */}
                        <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                          <div className="space-y-1.5">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingPalaceName}
                                  onChange={(e) =>
                                    setEditingPalaceName(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter')
                                      handleSavePalaceRename(palace.id);
                                    if (e.key === 'Escape')
                                      setEditingPalaceId(null);
                                  }}
                                  className="w-full rounded-lg border border-indigo-500 bg-slate-950 px-2.5 py-1 text-xs font-bold text-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSavePalaceRename(palace.id)
                                  }
                                  className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-300 hover:bg-emerald-500/30"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-bold text-white line-clamp-1">
                                  {palace.name}
                                </h4>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingPalaceId(palace.id);
                                      setEditingPalaceName(palace.name);
                                    }}
                                    title={palace.name}
                                    className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPendingDelete({
                                        type: 'palace',
                                        id: palace.id,
                                        name: palace.name,
                                      });
                                    }}
                                    title={t.btnDelete}
                                    className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Folder Assignment Dropdown */}
                            <div className="flex items-center gap-2 pt-1">
                              <Folder className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                              <select
                                value={palace.folderId ?? ''}
                                onChange={(e) =>
                                  movePalaceToFolder(
                                    palace.id,
                                    e.target.value || undefined
                                  )
                                }
                                aria-label={palace.name}
                                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-300 focus:border-indigo-500 focus:outline-none"
                              >
                                <option value="">{t.noFolderOption}</option>
                                {folders.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    📁 {f.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                            <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                              {folderObj ? folderObj.name : t.noFolderOption}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                setActivePalace(palace.id);
                                togglePalaceManager(false);
                              }}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                isActive
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
                              }`}
                            >
                              <span>
                                {isActive ? t.palaceInUseBtn : t.openPalaceBtn}
                              </span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
