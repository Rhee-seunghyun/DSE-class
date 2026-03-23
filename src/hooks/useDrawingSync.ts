import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DrawAction } from '@/components/lecture/DrawingCanvas';

/**
 * Syncs per-page drawing data to the database (student_drawings table).
 * Falls back to localStorage for unauthenticated edge cases.
 */
export function useDrawingSync(lectureId: string) {
  const [drawingsMap, setDrawingsMap] = useState<Record<string, DrawAction[]>>({});
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSavesRef = useRef<Set<string>>(new Set());

  // Load all drawings for this lecture from DB
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setLoaded(true);
        return;
      }

      const { data, error } = await supabase
        .from('student_drawings')
        .select('material_id, page_number, drawing_data')
        .eq('student_id', user.id)
        .eq('lecture_id', lectureId);

      if (cancelled) return;

      if (error) {
        console.error('Failed to load drawings:', error);
        // Fallback: try localStorage
        try {
          const saved = localStorage.getItem(`lecture-drawings-${lectureId}`);
          if (saved) setDrawingsMap(JSON.parse(saved));
        } catch { /* noop */ }
        setLoaded(true);
        return;
      }

      const map: Record<string, DrawAction[]> = {};
      for (const row of data || []) {
        const key = `${row.material_id}-page-${row.page_number}`;
        map[key] = row.drawing_data as unknown as DrawAction[];
      }
      setDrawingsMap(map);
      setLoaded(true);
    }

    load();
    return () => { cancelled = true; };
  }, [lectureId]);

  // Save a specific key to DB (debounced)
  const saveToDb = useCallback(async (key: string, actions: DrawAction[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Parse key: "materialId-page-pageNumber"
    const match = key.match(/^(.+)-page-(\d+)$/);
    if (!match) return;

    const materialId = match[1];
    const pageNumber = parseInt(match[2], 10);

    const row = {
      student_id: user.id,
      lecture_id: lectureId,
      material_id: materialId,
      page_number: pageNumber,
      drawing_data: actions as unknown as Record<string, unknown>[],
    };

    const { error } = await supabase
      .from('student_drawings')
      .upsert(row as any, {
        onConflict: 'student_id,material_id,page_number',
      });

    if (error) {
      console.error('Failed to save drawing:', error);
    }
  }, [lectureId]);

  const updateDrawings = useCallback((key: string, actions: DrawAction[]) => {
    setDrawingsMap(prev => ({ ...prev, [key]: actions }));
    pendingSavesRef.current.add(key);

    // Also save to localStorage as backup
    try {
      const updated = { ...drawingsMap, [key]: actions };
      localStorage.setItem(`lecture-drawings-${lectureId}`, JSON.stringify(updated));
    } catch { /* noop */ }

    // Debounce DB save (1 second)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const keysToSave = new Set(pendingSavesRef.current);
      pendingSavesRef.current.clear();

      // We need current state, so read from the latest drawingsMap via closure
      setDrawingsMap(currentMap => {
        for (const k of keysToSave) {
          if (currentMap[k]) {
            saveToDb(k, currentMap[k]);
          }
        }
        return currentMap;
      });
    }, 1000);
  }, [drawingsMap, lectureId, saveToDb]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return { drawingsMap, updateDrawings, loaded };
}
