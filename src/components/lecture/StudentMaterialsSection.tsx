import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

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

export function StudentMaterialsSection({ lectureId }: StudentMaterialsSectionProps) {
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);

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

  const currentMaterial = materials?.[selectedMaterialIndex];

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

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!materials || materials.length === 0) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            강의 자료
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[600px] bg-muted rounded-lg">
            <p className="text-muted-foreground">게시된 강의 자료가 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            강의 자료
          </CardTitle>
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
          <div className="mt-2">
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
      </CardHeader>
      <CardContent>
        {currentMaterial ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              {currentMaterial.file_name}
            </div>
            <div className="relative w-full h-[600px] bg-muted rounded-lg overflow-hidden">
              <iframe
                src={currentMaterial.file_url}
                className="w-full h-full"
                title={currentMaterial.file_name}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[600px] bg-muted rounded-lg">
            <p className="text-muted-foreground">강의 자료를 선택하세요.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
