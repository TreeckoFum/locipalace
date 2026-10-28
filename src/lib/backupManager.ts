import { usePalaceStore } from '@/store/usePalaceStore';
import type {
  MemoryPalace,
  PalaceFolder,
  StickerGalleryItem,
} from '@/types/palace';

export interface WorkspaceBackupPayload {
  version: string;
  exportedAt: string;
  data: {
    folders: PalaceFolder[];
    palaces: MemoryPalace[];
    activePalaceId?: string;
    stickerGallery?: StickerGalleryItem[];
  };
}

/**
 * Exports all folders, palaces, and active workspace settings to a portable JSON file:
 * `locipalace-backup-YYYY-MM-DD.json`.
 */
export function exportWorkspaceBackup(): void {
  if (typeof window === 'undefined') return;

  const state = usePalaceStore.getState();

  const payload: WorkspaceBackupPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      folders: state.folders,
      palaces: state.palaces,
      activePalaceId: state.activePalaceId,
      stickerGallery: state.stickerGallery,
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const datePart = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `locipalace-backup-${datePart}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates an uploaded JSON backup file and restores it into the Zustand store
 * and localStorage.
 */
export async function importWorkspaceBackup(
  file: File
): Promise<{ success: boolean; message?: string }> {
  try {
    const rawText = await file.text();
    const parsed = JSON.parse(rawText);

    // Support both `{ version, exportedAt, data: { folders, palaces } }` and direct `{ folders, palaces }`
    const container = parsed?.data ? parsed.data : parsed;

    if (
      !container ||
      !Array.isArray(container.folders) ||
      !Array.isArray(container.palaces)
    ) {
      return {
        success: false,
        message: 'INVALID_SCHEMA',
      };
    }

    // Validate minimum palace structure
    const validPalaces: MemoryPalace[] = container.palaces.filter(
      (p: unknown): p is MemoryPalace =>
        Boolean(
          p &&
            typeof p === 'object' &&
            'id' in p &&
            'name' in p &&
            'imageUrl' in p &&
            Array.isArray((p as MemoryPalace).pins)
        )
    );

    if (validPalaces.length === 0) {
      return {
        success: false,
        message: 'NO_VALID_PALACES',
      };
    }

    const validFolders: PalaceFolder[] = container.folders.filter(
      (f: unknown): f is PalaceFolder =>
        Boolean(f && typeof f === 'object' && 'id' in f && 'name' in f)
    );

    usePalaceStore
      .getState()
      .restoreWorkspaceBackup(
        validFolders,
        validPalaces,
        container.activePalaceId,
        container.stickerGallery
      );

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message: 'PARSE_ERROR',
    };
  }
}
