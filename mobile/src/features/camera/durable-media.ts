import { Directory, File, Paths } from 'expo-file-system';

/** Batas minimum ruang kosong sebelum menyatakan foto tersimpan (CAM-05). */
export const MIN_FREE_BYTES = 30 * 1024 * 1024;

export class StorageFullError extends Error {}

function mediaDir(): Directory {
  const dir = new Directory(Paths.document, 'tovv-media');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/**
 * Salin file cache kamera/galeri ke penyimpanan dokumen aplikasi sebelum menyatakan "tersimpan".
 * Cache URI saja belum aman (PRD §5 GPS Map Camera). Original tidak dikompres atau diubah.
 */
export function persistOriginal(sourceUri: string, clientMediaId: string): { uri: string; md5: string | null; size: number | null } {
  if (Paths.availableDiskSpace < MIN_FREE_BYTES) {
    throw new StorageFullError('Ruang penyimpanan tidak cukup. Foto belum tersimpan.');
  }
  const src = new File(sourceUri);
  const ext = src.extension || '.jpg';
  const dest = new File(mediaDir(), `${clientMediaId}-original${ext.startsWith('.') ? ext : `.${ext}`}`);
  if (!dest.exists) src.copySync(dest);
  const info = dest.info({ md5: true });
  return { uri: dest.uri, md5: info.md5 ?? null, size: info.size ?? null };
}

/** Derivative overlay disimpan terpisah dan berelasi ke original lewat clientMediaId. */
export function persistDerivative(tmpUri: string, clientMediaId: string): string {
  const src = new File(tmpUri);
  const dest = new File(mediaDir(), `${clientMediaId}-overlay.jpg`);
  if (dest.exists) dest.delete();
  src.copySync(dest);
  return dest.uri;
}
