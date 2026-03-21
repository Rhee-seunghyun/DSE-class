import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DynamicWatermark } from "@/components/DynamicWatermark";
import { PdfThumbnailPanel } from "@/components/lecture/PdfThumbnailPanel";

// Use legacy build for broader browser compatibility (toHex polyfill etc.)
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// Vite-friendly worker setup
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.mjs",
  import.meta.url,
).toString();

interface PdfCanvasViewerProps {
  pdfData: Uint8Array;
  className?: string;
  onPageChange?: (page: number) => void;
  showWatermark?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function PdfCanvasViewer({ pdfData, className, onPageChange, showWatermark = false, isFullscreen, onToggleFullscreen }: PdfCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

  useEffect(() => {
    onPageChange?.(page);
  }, [onPageChange, page]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({
        width: Math.max(320, Math.round(rect.width)),
        height: Math.max(240, Math.round(rect.height)),
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const docTask = useMemo(() => {
    setLoading(true);
    setError(null);
    setNumPages(0);
    setPage(1);
    return getDocument({ data: pdfData });
  }, [pdfData]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const doc = await docTask.promise;
        if (cancelled) return;
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "PDF를 불러오지 못했습니다.");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      // Best-effort cleanup
      try {
        docTask.destroy();
      } catch {
        // noop
      }
    };
  }, [docTask]);

  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    // Cancel any in-progress render before starting a new one
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // noop
      }
      renderTaskRef.current = null;
    }

    (async () => {
      if (loading || error) return;
      try {
        const doc = await docTask.promise;
        if (cancelled) return;
        const pdfPage = await doc.getPage(page);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Fit-to-container scale (no scroll; plays nicely with drawing overlay)
        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(
          containerSize.width / baseViewport.width,
          containerSize.height / baseViewport.height,
        );
        const viewport = pdfPage.getViewport({ scale });

        // Use devicePixelRatio for crisp rendering on high-DPI screens
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        canvas.style.maxWidth = "100%";
        canvas.style.maxHeight = "100%";
        ctx.scale(dpr, dpr);

        // Render – store the task so it can be cancelled by the next effect run
        const task = pdfPage.render({ canvasContext: ctx, viewport, canvas });
        renderTaskRef.current = task;
        await task.promise;
        renderTaskRef.current = null;
      } catch (e: any) {
        if (cancelled) return;
        // Ignore cancellation errors (expected when switching pages quickly)
        if (e?.name === "RenderingCancelledException") return;
        setError(e instanceof Error ? e.message : "PDF 렌더링에 실패했습니다.");
      }
    })();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // noop
        }
        renderTaskRef.current = null;
      }
    };
  }, [containerSize.height, containerSize.width, docTask, error, loading, page]);

  const canPrev = page > 1;
  const canNext = numPages > 0 && page < numPages;

  return (
    <div ref={wrapRef} className={cn("h-full w-full flex flex-col", className)}>
      <div className="relative z-20 flex items-center justify-between gap-2 py-2">
        <div className="min-w-0">
          {onToggleFullscreen && (
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1" onClick={onToggleFullscreen}>
              {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              {isFullscreen ? "종료" : "전체화면"}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            이전
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {numPages ? `${page} / ${numPages}` : "- / -"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => (numPages ? Math.min(numPages, p + 1) : p + 1))}
            disabled={!canNext}
          >
            다음
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

        </div>
      </div>

      <div ref={viewerRef} className="relative z-0 flex-1 min-h-0 bg-muted rounded-lg overflow-hidden">
        {showWatermark && <DynamicWatermark className="absolute inset-0 z-10" />}
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <p className="text-sm text-muted-foreground text-center break-words">{error}</p>
          </div>
        ) : (
          <div className="absolute inset-0 p-3 flex items-center justify-center">
            <canvas ref={canvasRef} className="block" />
          </div>
        )}
      </div>
    </div>
  );
}
