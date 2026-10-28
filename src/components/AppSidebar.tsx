'use client';

import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FolderPlus,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Upload,
  LayoutGrid,
  HardDriveDownload,
  HardDriveUpload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePalaceStore, SAMPLE_STUDY_DESK_SVG } from '@/store/usePalaceStore';
import { getTranslations } from '@/lib/translations';
import { compressImageWithMeta } from '@/lib/imageCompression';
import {
  exportWorkspaceBackup,
  importWorkspaceBackup,
} from '@/lib/backupManager';

export function AppSidebar() {
  const locale = useLocale();
  const fullT = getTranslations(locale);
  const t = fullT.app.manager;
  const sidebarT = fullT.app.sidebar;

  const {
    folders,
    palaces,
    activePalaceId,
    isMobileSidebarOpen,
    createFolder,
    renameFolder,
    deleteFolder,
    createPalace,
    renamePalace,
    deletePalace,
    setActivePalace,
    togglePalaceManager,
    toggleMobileSidebar,
  } = usePalaceStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<
    Record<string, boolean>
  >({});

  // Confirmation dialog state before deleting a palace or folder
  const [pendingDelete, setPendingDelete] = useState<{
    type: 'palace' | 'folder';
    id: string;
    name: string;
  } | null>(null);

  // Inline New Folder State
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Inline Folder Rename State
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Inline Palace Rename State
  const [editingPalaceId, setEditingPalaceId] = useState<string | null>(null);
  const [editingPalaceName, setEditingPalaceName] = useState('');

  // Inline New Palace State
  const [isCreatingPalace, setIsCreatingPalace] = useState(false);
  const [newPalaceName, setNewPalaceName] = useState('');
  const [newPalaceFolderId, setNewPalaceFolderId] = useState<string>(
    folders[0]?.id ?? ''
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  // Backup / Restore Feedback Toast State
  const [backupToast, setBackupToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showBackupToast = (type: 'success' | 'error', message: string) => {
    setBackupToast({ type, message });
    window.setTimeout(() => {
      setBackupToast(null);
    }, 3500);
  };

  const handleExportBackup = () => {
    exportWorkspaceBackup();
    showBackupToast('success', sidebarT.exportSuccess);
  };

  const handleImportBackupChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const result = await importWorkspaceBackup(file);
    if (result.success) {
      showBackupToast('success', sidebarT.importSuccess);
    } else {
      showBackupToast('error', sidebarT.importInvalidFile);
    }
  };

  const toggleFolderAccordion = (folderId: string) => {
    setCollapsedFolderIds((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const id = createFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
    setCollapsedFolderIds((prev) => ({ ...prev, [id]: false }));
  };

  const handleSaveFolderRename = (folderId: string) => {
    if (editingFolderName.trim()) {
      renameFolder(folderId, editingFolderName.trim());
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleSavePalaceRename = (palaceId: string) => {
    if (editingPalaceName.trim()) {
      renamePalace(palaceId, editingPalaceName.trim());
    }
    setEditingPalaceId(null);
    setEditingPalaceName('');
  };

  const handleCreateDefaultPalace = (e: React.FormEvent) => {
    e.preventDefault();
    const targetFolder = newPalaceFolderId || folders[0]?.id || undefined;
    createPalace(
      newPalaceName.trim() || 'Nuevo Palacio',
      targetFolder,
      SAMPLE_STUDY_DESK_SVG,
      16 / 9
    );
    setNewPalaceName('');
    setIsCreatingPalace(false);
  };

  const handleCreatePhotoPalace = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const fallbackName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ');
    const targetFolder = newPalaceFolderId || folders[0]?.id || undefined;

    try {
      const { dataUrl, aspectRatio } = await compressImageWithMeta(
        file,
        1920,
        0.75
      );
      createPalace(
        newPalaceName.trim() || fallbackName || 'Nuevo Palacio',
        targetFolder,
        dataUrl,
        aspectRatio
      );
    } catch {
      const objectUrl = URL.createObjectURL(file);
      createPalace(
        newPalaceName.trim() || fallbackName || 'Nuevo Palacio',
        targetFolder,
        objectUrl,
        16 / 9
      );
    }

    setNewPalaceName('');
    setIsCreatingPalace(false);
  };

  const unfiledPalaces = palaces.filter((p) => !p.folderId);

  if (isCollapsed) {
    return (
      <aside className="hidden md:flex w-12 border-r border-slate-800 bg-slate-900/40 flex-col items-center justify-between py-3 shrink-0 select-none">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            title={fullT.nav.myPalaces}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:border-indigo-500/40 hover:text-white transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => togglePalaceManager(true)}
            title={t.title}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-400 hover:bg-slate-800 transition"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <input
            ref={backupFileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportBackupChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => {
              setIsCollapsed(false);
              setIsCreatingFolder(true);
            }}
            title={t.newFolderBtn}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCollapsed(false);
              setIsCreatingPalace(true);
            }}
            title={t.newPalaceBtn}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition"
          >
            <Plus className="h-4 w-4" />
          </button>

          <div className="h-px w-6 bg-slate-800 my-0.5" />

          <button
            type="button"
            onClick={handleExportBackup}
            title={sidebarT.exportBackup}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-cyan-300 transition"
          >
            <HardDriveDownload className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => backupFileInputRef.current?.click()}
            title={sidebarT.importBackup}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-indigo-300 transition"
          >
            <HardDriveUpload className="h-4 w-4" />
          </button>
        </div>
      </aside>
    );
  }

  const confirmDeleteAction = () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'palace') {
      deletePalace(pendingDelete.id);
    } else {
      deleteFolder(pendingDelete.id);
    }
    setPendingDelete(null);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay (< md) */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => toggleMobileSidebar(false)}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Confirmation Dialog Modal for Deleting a Palace or Folder */}
      {pendingDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="sidebar-delete-confirm-title"
          aria-describedby="sidebar-delete-confirm-desc"
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
                  id="sidebar-delete-confirm-title"
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
                  id="sidebar-delete-confirm-desc"
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
                onClick={confirmDeleteAction}
                className="w-full md:w-auto cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-500 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{t.btnDelete}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <aside
        className={`${
          isMobileSidebarOpen
            ? 'fixed inset-y-0 left-0 z-50 flex shadow-2xl'
            : 'hidden md:flex'
        } w-72 border-r border-slate-800 bg-slate-900/95 md:bg-slate-900/40 flex-col justify-between shrink-0 select-none overflow-hidden`}
      >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-3.5 py-3">
        <button
          type="button"
          onClick={() => {
            toggleMobileSidebar(false);
            togglePalaceManager(true);
          }}
          className="cursor-pointer flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition truncate"
          title={t.title}
        >
          <FolderOpen className="h-4 w-4 text-indigo-400 shrink-0" />
          <span className="truncate">{fullT.nav.myPalaces}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              toggleMobileSidebar(false);
              togglePalaceManager(true);
            }}
            title={t.title}
            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            title="Collapse Sidebar"
            className="hidden md:inline-flex cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toggleMobileSidebar(false)}
            title={t.btnCancel}
            className="md:hidden cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Folder & Palace Tree */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-2">
        {folders.map((folder) => {
          const isFolderOpen = !collapsedFolderIds[folder.id];
          const folderPalaces = palaces.filter((p) => p.folderId === folder.id);
          const isEditingThisFolder = editingFolderId === folder.id;

          return (
            <div key={folder.id} className="space-y-1">
              {/* Folder Row */}
              <div className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800/60 transition">
                {isEditingThisFolder ? (
                  <div className="flex w-full items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveFolderRename(folder.id);
                        if (e.key === 'Escape') setEditingFolderId(null);
                      }}
                      className="w-full rounded bg-slate-950 px-2 py-0.5 text-xs text-white border border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveFolderRename(folder.id)}
                      className="rounded bg-emerald-500/20 p-1 text-emerald-300"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleFolderAccordion(folder.id)}
                      className="flex flex-1 items-center gap-1.5 text-left truncate"
                    >
                      {isFolderOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      )}
                      <Folder className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                      <span className="truncate">{folder.name}</span>
                    </button>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolderId(folder.id);
                          setEditingFolderName(folder.name);
                        }}
                        className="cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition"
                        title="Rename"
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
                        className="cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                        title={t.btnDelete}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <span className="ml-1 rounded-full bg-slate-800/90 px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
                        {folderPalaces.length}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Nested Palaces inside Folder */}
              {isFolderOpen && (
                <div className="ml-3 border-l border-slate-800/90 pl-2 space-y-1">
                  {folderPalaces.map((palace) => {
                    const isActive = palace.id === activePalaceId;
                    const isEditingThisPalace = editingPalaceId === palace.id;

                    return (
                      <div
                        key={palace.id}
                        className={`group flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition ${
                          isActive
                            ? 'border border-indigo-500/50 bg-indigo-500/15 text-white font-semibold shadow-sm'
                            : 'border border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}
                      >
                        {isEditingThisPalace ? (
                          <div className="flex w-full items-center gap-1">
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
                              className="w-full rounded bg-slate-950 px-2 py-0.5 text-xs text-white border border-indigo-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePalaceRename(palace.id)}
                              className="cursor-pointer rounded bg-emerald-500/20 p-1 text-emerald-300"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setActivePalace(palace.id);
                                toggleMobileSidebar(false);
                              }}
                              className="cursor-pointer flex flex-1 items-center gap-2 text-left truncate"
                            >
                              <span className="text-xs leading-none">🏛️</span>
                              <span className="truncate">{palace.name}</span>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPalaceId(palace.id);
                                  setEditingPalaceName(palace.name);
                                }}
                                className="cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition"
                                title="Rename"
                              >
                                <Pencil className="h-3 w-3" />
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
                                className="cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                                title={t.btnDelete}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
                                  isActive
                                    ? 'bg-indigo-500/30 text-indigo-200'
                                    : 'bg-slate-800/80 text-slate-400'
                                }`}
                              >
                                {palace.pins.length}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Unfiled Palaces (if any) */}
        {unfiledPalaces.length > 0 && (
          <div className="pt-2 border-t border-slate-800/60 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t.noFolderOption}
            </div>
            {unfiledPalaces.map((palace) => {
              const isActive = palace.id === activePalaceId;
              const isEditingThisPalace = editingPalaceId === palace.id;
              return (
                <div
                  key={palace.id}
                  className={`group flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition ${
                    isActive
                      ? 'border border-indigo-500/50 bg-indigo-500/15 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  {isEditingThisPalace ? (
                    <div className="flex w-full items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={editingPalaceName}
                        onChange={(e) => setEditingPalaceName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')
                            handleSavePalaceRename(palace.id);
                          if (e.key === 'Escape') setEditingPalaceId(null);
                        }}
                        className="w-full rounded bg-slate-950 px-2 py-0.5 text-xs text-white border border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSavePalaceRename(palace.id)}
                        className="cursor-pointer rounded bg-emerald-500/20 p-1 text-emerald-300"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePalace(palace.id);
                          toggleMobileSidebar(false);
                        }}
                        className="cursor-pointer flex flex-1 items-center gap-2 text-left truncate"
                      >
                        <span>🏛️</span>
                        <span className="truncate">{palace.name}</span>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPalaceId(palace.id);
                            setEditingPalaceName(palace.name);
                          }}
                          className="cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition"
                          title="Rename"
                        >
                          <Pencil className="h-3 w-3" />
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
                          className="cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                          title={t.btnDelete}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                          {palace.pins.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Actions: + Nueva Carpeta & + Nuevo Palacio */}
      <div className="border-t border-slate-800 bg-slate-950/60 p-3 space-y-2">
        {/* Inline New Folder Form */}
        {isCreatingFolder && (
          <form
            onSubmit={handleCreateFolderSubmit}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-slate-900 p-1.5"
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
              className="rounded-lg bg-indigo-500 p-1 text-slate-950 hover:bg-indigo-400"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="rounded-lg bg-slate-800 p-1 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </form>
        )}

        {/* Inline New Palace Form */}
        {isCreatingPalace && (
          <div className="rounded-xl border border-indigo-500/40 bg-slate-900 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-300">
                {t.newPalaceBtn}
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingPalace(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={newPalaceName}
              onChange={(e) => setNewPalaceName(e.target.value)}
              placeholder={t.newPalaceNamePlaceholder}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />

            <select
              value={newPalaceFolderId}
              onChange={(e) => setNewPalaceFolderId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">{t.noFolderOption}</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCreatePhotoPalace}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1 rounded-lg bg-indigo-500 px-2 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-indigo-400 transition"
              >
                <Upload className="h-3 w-3" />
                <span>Foto</span>
              </button>
              <button
                type="button"
                onClick={handleCreateDefaultPalace}
                className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                <span>Base Demo</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setIsCreatingFolder((prev) => !prev);
              setIsCreatingPalace(false);
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-2 text-[11px] font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition"
          >
            <FolderPlus className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">+ {t.newFolderBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCreatingPalace((prev) => !prev);
              setIsCreatingFolder(false);
              setNewPalaceFolderId(folders[0]?.id ?? '');
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-indigo-500/40 px-2.5 py-2 text-[11px] font-bold text-indigo-200 hover:from-indigo-500/30 hover:to-cyan-500/30 transition"
          >
            <Plus className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{t.newPalaceBtn}</span>
          </button>
        </div>

        {/* Backup & Restore Feedback Toast */}
        {backupToast && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium ${
              backupToast.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
            }`}
          >
            {backupToast.type === 'success' ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
            )}
            <span className="line-clamp-2">{backupToast.message}</span>
          </div>
        )}

        {/* Hidden JSON File Input for Backup Import */}
        <input
          ref={backupFileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportBackupChange}
          className="hidden"
        />

        {/* Secondary Utility Buttons: Export & Import Backup */}
        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleExportBackup}
            title={sidebarT.exportBackup}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800/90 bg-slate-900/70 px-2 py-1.5 text-[10px] font-semibold text-slate-400 hover:border-cyan-500/40 hover:bg-slate-900 hover:text-cyan-300 transition"
          >
            <HardDriveDownload className="h-3 w-3 text-cyan-400 shrink-0" />
            <span className="truncate">{sidebarT.exportBackup}</span>
          </button>

          <button
            type="button"
            onClick={() => backupFileInputRef.current?.click()}
            title={sidebarT.importBackup}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800/90 bg-slate-900/70 px-2 py-1.5 text-[10px] font-semibold text-slate-400 hover:border-indigo-500/40 hover:bg-slate-900 hover:text-indigo-300 transition"
          >
            <HardDriveUpload className="h-3 w-3 text-indigo-400 shrink-0" />
            <span className="truncate">{sidebarT.importBackup}</span>
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
