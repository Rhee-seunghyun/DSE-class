import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DynamicWatermark } from "@/components/DynamicWatermark";

// pdfjs-dist types are a bit inconsistent across bundlers; keep imports simple.
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

// Vite-friendly worker setup (avoids relying on browser PDF plugins)
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

interface PdfCanvasViewerProps {
  pdfData: Uint8Array;
  className?: string;
  onPageChange?: (page: number) => void;
  showWatermark?: boolean;
}

export function PdfCanvasViewer({ pdfData, className, onPageChange, showWatermark = false }: PdfCanvasViewerProps) {
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (loading || error) return;
      try {
        const doc = await docTask.promise;
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

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = "100%";
        canvas.style.height = "auto";

        // Render
        await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise;
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "PDF 렌더링에 실패했습니다.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [containerSize.height, containerSize.width, docTask, error, loading, page]);

  const canPrev = page > 1;
  const canNext = numPages > 0 && page < numPages;

  return (
    <div ref={wrapRef} className={cn("h-full w-full flex flex-col", className)}>
      <div className="relative z-20 flex items-center justify-between gap-2 py-2">
        <div className="min-w-0" />

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
