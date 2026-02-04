import { ChevronDown, ChevronUp, FileText, Pencil, PencilOff, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

import { DrawingCanvas } from "./DrawingCanvas";
import { PdfCanvasViewer } from "./PdfCanvasViewer";

interface LectureMaterial {
  id: string;
  lecture_id: string;
  file_url: string;
  file_name: string;
  order_index: number;
  is_published: boolean;
}

interface StudentMaterialsSectionBlobProps {
  lectureId: string;
}

function extractStoragePath(fileUrl: string): string | null {
  // Expected DB value today: https://.../storage/v1/object/public/lecture-files/<path>
  // But we handle multiple formats defensively.
  if (!fileUrl) return null;

  if (!fileUrl.startsWith("http")) {
    return fileUrl;
  }

  try {
    const url = new URL(fileUrl);
    const parts = url.pathname.split("/lecture-files/");
    if (parts.length > 1) {
      return decodeURIComponent(parts[1]);
    }
  } catch {
    // noop
  }

  const match = fileUrl.match(/lecture-files\/(.+)$/);
  if (match) return decodeURIComponent(match[1]);
  return null;
}

export function StudentMaterialsSectionBlob({ lectureId }: StudentMaterialsSectionBlobProps) {
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const pdfOverlayTop = 72; // PdfCanvasViewer 상단 페이지 네비 영역 보호(여유 있게)
  const pdfOverlayHeight = Math.max(0, canvasDimensions.height - pdfOverlayTop);

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [blobLoading, setBlobLoading] = useState(false);
  const [blobError, setBlobError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const { data: materials, isLoading } = useQuery({
    queryKey: ["student-lecture-materials", lectureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lecture_materials")
        .select("*")
        .eq("lecture_id", lectureId)
        .eq("is_published", true)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as LectureMaterial[];
    },
    enabled: !!lectureId,
  });

  const currentMaterial = materials?.[selectedMaterialIndex];
  const currentStoragePath = useMemo(() => {
    if (!currentMaterial) return null;
    return extractStoragePath(currentMaterial.file_url);
  }, [currentMaterial]);

  // Update canvas dimensions when container resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCanvasDimensions({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  // Download PDF as Blob
  useEffect(() => {
    let cancelled = false;

    async function run() {
      // cleanup previous
      setBlobError(null);
      setBlobLoading(false);
      setPdfBytes(null);

      if (!currentStoragePath) return;

      setBlobLoading(true);
      const { data, error } = await supabase.storage.from("lecture-files").download(currentStoragePath);

      if (cancelled) return;

      if (error || !data) {
        setBlobError(error?.message ?? "파일을 불러오지 못했습니다.");
        setBlobLoading(false);
        return;
      }

      const buf = await data.arrayBuffer();
      setPdfBytes(new Uint8Array(buf));
      setBlobLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [currentStoragePath, reloadKey]);

  const goToPrevious = () => {
    if (selectedMaterialIndex > 0) setSelectedMaterialIndex(selectedMaterialIndex - 1);
  };

  const goToNext = () => {
    if (materials && selectedMaterialIndex < materials.length - 1) {
      setSelectedMaterialIndex(selectedMaterialIndex + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!materials || materials.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 p-4 border-b">
          <FileText className="w-5 h-5" />
          <span className="font-semibold">강의 자료</span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">게시된 강의 자료가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <span className="font-semibold">강의 자료</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showDrawingTools ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowDrawingTools((v) => !v)}
          >
            {showDrawingTools ? (
              <>
                <PencilOff className="w-4 h-4 mr-1" />
                필기 끄기
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4 mr-1" />
                필기하기
              </>
            )}
          </Button>

          {materials.length > 1 && (
            <>
              <div className="w-px h-6 bg-border" />
              <Button variant="outline" size="sm" onClick={goToPrevious} disabled={selectedMaterialIndex === 0}>
                <ChevronUp className="w-4 h-4 mr-1" />
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedMaterialIndex + 1} / {materials.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={selectedMaterialIndex === materials.length - 1}
              >
                다음
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}
        </div>
      </div>

      {materials.length > 1 && (
        <div className="p-2 border-b">
          <select
            value={selectedMaterialIndex}
            onChange={(e) => setSelectedMaterialIndex(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background"
          >
            {materials.map((material, index) => (
              <option key={material.id} value={index}>
                자료 {index + 1}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex-1 flex flex-col space-y-2">
          <div className="text-sm font-medium text-muted-foreground">자료 {selectedMaterialIndex + 1}</div>

          <div ref={containerRef} className="relative flex-1 bg-muted rounded-lg overflow-hidden protected-content">
            {blobLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">파일을 불러오는 중...</p>
              </div>
            ) : blobError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <p className="text-muted-foreground">{blobError}</p>
                <Button variant="outline" size="sm" onClick={() => setReloadKey((v) => v + 1)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
              </div>
            ) : pdfBytes ? (
              <PdfCanvasViewer pdfData={pdfBytes} onPageChange={setPdfPage} showWatermark />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">강의 자료를 선택하세요.</p>
              </div>
            )}

            {/*
              필기 오버레이: 상단 페이지 네비 영역(이전/다음 버튼)을 피해서 배치.
              overflow-visible로 해야 도구모음이 보임.
            */}
            <div
              className="absolute left-0 right-0 bottom-0 pointer-events-none"
              style={{ top: pdfOverlayTop }}
            >
              <DrawingCanvas
                key={`${currentMaterial?.id || selectedMaterialIndex}-${pdfPage}`}
                width={canvasDimensions.width}
                height={pdfOverlayHeight}
                className="absolute inset-0 z-20"
                showToolbar={showDrawingTools}
              />
            </div>
          </div>

          {showDrawingTools && (
            <p className="text-xs text-muted-foreground text-center">
              🖊️ 필기 모드가 켜져 있습니다. 펜/형광펜/지우개를 선택해 사용하세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
