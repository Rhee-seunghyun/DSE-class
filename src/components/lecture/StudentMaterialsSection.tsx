import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useRef, useEffect } from 'react';
import { DrawingCanvas } from './DrawingCanvas';

interface LectureMaterial {
  id: string;
  lecture_id: string;
  file_url: string;
  file_name: string;
  order_index: number;
  is_published: boolean;
}

interface StudentMaterialsSectionProps {
  lectureId: string;
}

// Extract storage path from file_url
function extractStoragePath(fileUrl: string): string | null {
  // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
  const match = fileUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/lecture-files\/(.+)$/);
  if (match) return match[1];
  
  // Alternative: if only path is stored
  if (!fileUrl.startsWith('http')) return fileUrl;
  
  return null;
}

export function StudentMaterialsSection({ lectureId }: StudentMaterialsSectionProps) {
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

  const { data: materials, isLoading } = useQuery({
    queryKey: ['student-lecture-materials', lectureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lecture_materials')
        .select('*')
        .eq('lecture_id', lectureId)
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as LectureMaterial[];
    },
    enabled: !!lectureId
  });

  // Generate signed URLs for materials
  const { data: signedUrls, isLoading: urlsLoading } = useQuery({
    queryKey: ['signed-urls', materials?.map(m => m.id)],
    queryFn: async () => {
      if (!materials || materials.length === 0) return {};
      
      const urlMap: Record<string, string> = {};
      
      for (const material of materials) {
        const storagePath = extractStoragePath(material.file_url);
        if (storagePath) {
          const { data, error } = await supabase.storage
            .from('lecture-files')
            .createSignedUrl(storagePath, 3600); // 1 hour expiry
          
          if (data && !error) {
            urlMap[material.id] = data.signedUrl;
          } else {
            console.error('Failed to create signed URL:', error);
          }
        }
      }
      
      return urlMap;
    },
    enabled: !!materials && materials.length > 0
  });

  const currentMaterial = materials?.[selectedMaterialIndex];
  const currentSignedUrl = currentMaterial ? signedUrls?.[currentMaterial.id] : null;

  // Update canvas dimensions when container resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasDimensions({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // ResizeObserver for more accurate tracking
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  const goToPrevious = () => {
    if (selectedMaterialIndex > 0) {
      setSelectedMaterialIndex(selectedMaterialIndex - 1);
    }
  };

  const goToNext = () => {
    if (materials && selectedMaterialIndex < materials.length - 1) {
      setSelectedMaterialIndex(selectedMaterialIndex + 1);
    }
  };

  if (isLoading || urlsLoading) {
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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          <span className="font-semibold">강의 자료</span>
        </div>
        {materials.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={selectedMaterialIndex === 0}
            >
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
          </div>
        )}
      </div>
      
      {/* Material selector dropdown for mobile */}
      {materials.length > 1 && (
        <div className="p-2 border-b">
          <select
            value={selectedMaterialIndex}
            onChange={(e) => setSelectedMaterialIndex(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background"
          >
            {materials.map((material, index) => (
              <option key={material.id} value={index}>
                {index + 1}. {material.file_name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {currentMaterial && currentSignedUrl ? (
          <div className="flex-1 flex flex-col space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              {currentMaterial.file_name}
            </div>
            <div 
              ref={containerRef}
              className="relative flex-1 bg-muted rounded-lg overflow-hidden protected-content"
            >
              <iframe
                src={currentSignedUrl}
                className="w-full h-full"
                title={currentMaterial.file_name}
              />
              {/* Drawing overlay */}
              <DrawingCanvas
                width={canvasDimensions.width}
                height={canvasDimensions.height}
                className="absolute inset-0"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              💡 마우스를 올리면 필기 도구가 나타납니다 (펜, 형광펜, 지우개)
            </p>
          </div>
        ) : currentMaterial && !currentSignedUrl ? (
          <div className="flex-1 flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">파일을 불러오는 중...</p>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">강의 자료를 선택하세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
