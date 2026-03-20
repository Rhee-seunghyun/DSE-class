import { get, set, del, keys } from 'idb-keyval';

const PDF_PREFIX = 'lecture-pdf-';

export async function savePdfOffline(materialId: string, data: Uint8Array): Promise<void> {
  await set(`${PDF_PREFIX}${materialId}`, data);
}

export async function loadPdfOffline(materialId: string): Promise<Uint8Array | null> {
  const data = await get<Uint8Array>(`${PDF_PREFIX}${materialId}`);
  return data ?? null;
}

export async function removePdfOffline(materialId: string): Promise<void> {
  await del(`${PDF_PREFIX}${materialId}`);
}

export async function isPdfCached(materialId: string): Promise<boolean> {
  const data = await get(`${PDF_PREFIX}${materialId}`);
  return data != null;
}

export async function getAllCachedMaterialIds(): Promise<string[]> {
  const allKeys = await keys();
  return (allKeys as string[])
    .filter((k) => typeof k === 'string' && k.startsWith(PDF_PREFIX))
    .map((k) => k.slice(PDF_PREFIX.length));
}

export async function clearAllOfflinePdfs(): Promise<void> {
  const ids = await getAllCachedMaterialIds();
  await Promise.all(ids.map((id) => removePdfOffline(id)));
}
