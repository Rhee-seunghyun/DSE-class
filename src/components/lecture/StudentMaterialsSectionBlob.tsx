import { ChevronDown, ChevronUp, FileText, Pencil, PencilOff, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useDrawingSync } from "@/hooks/useDrawingSync";

import { DrawingCanvas, DrawAction } from "./DrawingCanvas";
import { PdfCanvasViewer } from "./PdfCanvasViewer";
import { QuestionDialog } from "./QuestionDialog";

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
  lectureTitle?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
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

export function StudentMaterialsSectionBlob({ lectureId, lectureTitle, isFullscreen, onToggleFullscreen }: StudentMaterialsSectionBlobProps) {
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);

  // DB 기반 필기 동기화 (같은 계정이면 다른 기기에서도 접근 가능)
  const { drawingsMap, updateDrawings, loaded: drawingsLoaded } = useDrawingSync(lectureId);

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

  // 현재 페이지의 고유 키 생성
  const currentDrawingKey = useMemo(() => {
    const materialId = currentMaterial?.id || `material-${selectedMaterialIndex}`;
    return `${materialId}-page-${pdfPage}`;
  }, [currentMaterial?.id, selectedMaterialIndex, pdfPage]);

  // 현재 페이지의 저장된 필기 불러오기
  const currentPageActions = useMemo(() => {
    return drawingsMap[currentDrawingKey] || [];
  }, [drawingsMap, currentDrawingKey]);

  // 필기 변경 시 저장
  const handleActionsChange = useCallback((actions: DrawAction[]) => {
    setDrawingsMap(prev => ({
      ...prev,
      [currentDrawingKey]: actions,
    }));
  }, [currentDrawingKey]);

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

  // Download PDF from storage
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setBlobError(null);
      setBlobLoading(false);
      setPdfBytes(null);

      if (!currentStoragePath || !currentMaterial) return;

      setBlobLoading(true);

      const { data, error } = await supabase.storage.from("lecture-files").download(currentStoragePath);

      if (cancelled) return;

      if (error || !data) {
        setBlobError(error?.message ?? "파일을 불러오지 못했습니다.");
        setBlobLoading(false);
        return;
      }

      const buf = await data.arrayBuffer();
      const bytes = new Uint8Array(buf);
      setPdfBytes(bytes);
      setBlobLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [currentStoragePath, currentMaterial, reloadKey]);

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
      <div className="flex items-center justify-between px-2 py-1.5 border-b gap-1">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium text-xs sm:text-sm">강의 자료</span>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <QuestionDialog lectureId={lectureId} lectureTitle={lectureTitle || '강의'} />
          
          <Button
            variant={showDrawingTools ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setShowDrawingTools((v) => !v)}
          >
            {showDrawingTools ? (
              <><PencilOff className="w-3.5 h-3.5 mr-1" />끄기</>
            ) : (
              <><Pencil className="w-3.5 h-3.5 mr-1" />필기</>
            )}
          </Button>

          {materials.length > 1 && (
            <>
              <div className="w-px h-5 bg-border" />
              <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={goToPrevious} disabled={selectedMaterialIndex === 0}>
                <ChevronUp className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {selectedMaterialIndex + 1}/{materials.length}
              </span>
              <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={goToNext} disabled={selectedMaterialIndex === materials.length - 1}>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {materials.length > 1 && (
        <div className="px-2 py-1 border-b">
          <select
            value={selectedMaterialIndex}
            onChange={(e) => setSelectedMaterialIndex(Number(e.target.value))}
            className="w-full px-2 py-1 text-xs border rounded bg-background"
          >
            {materials.map((material, index) => (
              <option key={material.id} value={index}>
                자료 {index + 1}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1 flex flex-col p-1.5 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div ref={containerRef} className="relative flex-1 bg-muted rounded overflow-hidden protected-content">
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
              <PdfCanvasViewer pdfData={pdfBytes} onPageChange={setPdfPage} showWatermark isFullscreen={isFullscreen} onToggleFullscreen={onToggleFullscreen} />
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
                key={currentDrawingKey}
                width={canvasDimensions.width}
                height={pdfOverlayHeight}
                className="absolute inset-0 z-20"
                showToolbar={showDrawingTools}
                initialActions={currentPageActions}
                onActionsChange={handleActionsChange}
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
