import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PdfThumbnailPanelProps {
  pdfDoc: any; // PDFDocumentProxy
  numPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
  onClose: () => void;
}

const THUMB_SCALE = 0.25;

function ThumbnailItem({
  pdfDoc,
  pageNum,
  isCurrent,
  onSelect,
}: {
  pdfDoc: any;
  pageNum: number;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const renderingRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || rendered || renderingRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !renderingRef.current && !rendered) {
          renderingRef.current = true;
          observer.disconnect();

          (async () => {
            try {
              const page = await pdfDoc.getPage(pageNum);
              const viewport = page.getViewport({ scale: THUMB_SCALE });
              const canvas = canvasRef.current;
              if (!canvas) return;
              const ctx = canvas.getContext("2d");
              if (!ctx) return;

              const dpr = Math.min(window.devicePixelRatio || 1, 2);
              canvas.width = Math.floor(viewport.width * dpr);
              canvas.height = Math.floor(viewport.height * dpr);
              canvas.style.width = `${Math.floor(viewport.width)}px`;
              canvas.style.height = `${Math.floor(viewport.height)}px`;
              ctx.scale(dpr, dpr);

              await page.render({ canvasContext: ctx, viewport }).promise;
              setRendered(true);
            } catch {
              // noop
            } finally {
              renderingRef.current = false;
            }
          })();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pdfDoc, pageNum, rendered]);

  return (
    <div
      ref={containerRef}
      onClick={onSelect}
      className={cn(
        "cursor-pointer rounded-md border-2 p-1 transition-colors flex flex-col items-center gap-1",
        isCurrent
          ? "border-primary bg-primary/10"
          : "border-transparent hover:border-muted-foreground/30"
      )}
    >
      <div className="relative bg-muted rounded overflow-hidden min-h-[80px] flex items-center justify-center">
        {!rendered && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground absolute" />
        )}
        <canvas ref={canvasRef} className="block" />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums">{pageNum}</span>
    </div>
  );
}

export function PdfThumbnailPanel({
  pdfDoc,
  numPages,
  currentPage,
  onPageSelect,
  onClose,
}: PdfThumbnailPanelProps) {
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll current page into view
    setTimeout(() => {
      currentRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 100);
  }, []);

  return (
    <div className="absolute inset-0 z-20 flex" onClick={onClose}>
      <div
        className="w-[140px] sm:w-[160px] h-full bg-background/95 backdrop-blur-sm border-r shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <div key={pageNum} ref={pageNum === currentPage ? currentRef : undefined}>
                <ThumbnailItem
                  pdfDoc={pdfDoc}
                  pageNum={pageNum}
                  isCurrent={pageNum === currentPage}
                  onSelect={() => {
                    onPageSelect(pageNum);
                    onClose();
                  }}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      {/* Click overlay area to close */}
      <div className="flex-1" />
    </div>
  );
}
