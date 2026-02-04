import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Trash2, Eye, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface LectureMaterial {
  id: string;
  lecture_id: string;
  speaker_id: string;
  file_url: string;
  file_name: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
}

interface LectureMaterialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lectureId: string;
  speakerId: string;
  lectureTitle: string;
}

export function LectureMaterialsDialog({
  open,
  onOpenChange,
  lectureId,
  speakerId,
  lectureTitle
}: LectureMaterialsDialogProps) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch materials for this lecture
  const { data: materials, isLoading } = useQuery({
    queryKey: ['lecture-materials', lectureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lecture_materials')
        .select('*')
        .eq('lecture_id', lectureId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as LectureMaterial[];
    },
    enabled: open && !!lectureId
  });

  // Upload material mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (fileExt !== 'pdf') {
        throw new Error('PDF 파일만 업로드 가능합니다.');
      }

      const filePath = `${speakerId}/${lectureId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('lecture-files')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lecture-files')
        .getPublicUrl(filePath);

      // Get current max order_index
      const currentMaxOrder = materials?.length ? Math.max(...materials.map(m => m.order_index)) : -1;

      const { error: insertError } = await supabase
        .from('lecture_materials')
        .insert({
          lecture_id: lectureId,
          speaker_id: speakerId,
          file_url: publicUrl,
          file_name: file.name,
          order_index: currentMaxOrder + 1,
          is_published: false
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecture-materials', lectureId] });
      toast.success('강의자료가 업로드되었습니다.');
    },
    onError: (error) => {
      toast.error('업로드 실패: ' + error.message);
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  // Delete material mutation
  const deleteMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const { error } = await supabase
        .from('lecture_materials')
        .delete()
        .eq('id', materialId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecture-materials', lectureId] });
      toast.success('강의자료가 삭제되었습니다.');
    },
    onError: (error) => {
      toast.error('삭제 실패: ' + error.message);
    }
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ materialId, newIndex }: { materialId: string; newIndex: number }) => {
      if (!materials) return;

      const material = materials.find(m => m.id === materialId);
      if (!material) return;

      const oldIndex = material.order_index;
      
      // Update all affected materials
      const updates = materials.map(m => {
        let newOrderIndex = m.order_index;
        
        if (m.id === materialId) {
          newOrderIndex = newIndex;
        } else if (oldIndex < newIndex) {
          // Moving down: decrease order_index for items between old and new
          if (m.order_index > oldIndex && m.order_index <= newIndex) {
            newOrderIndex = m.order_index - 1;
          }
        } else if (oldIndex > newIndex) {
          // Moving up: increase order_index for items between new and old
          if (m.order_index >= newIndex && m.order_index < oldIndex) {
            newOrderIndex = m.order_index + 1;
          }
        }
        
        return { id: m.id, order_index: newOrderIndex };
      });

      // Perform updates
      for (const update of updates) {
        const { error } = await supabase
          .from('lecture_materials')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecture-materials', lectureId] });
    },
    onError: (error) => {
      toast.error('순서 변경 실패: ' + error.message);
    }
  });

  // Publish all materials mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('lecture_materials')
        .update({ is_published: true })
        .eq('lecture_id', lectureId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecture-materials', lectureId] });
      toast.success('강의자료가 게시되었습니다. 수강생들이 볼 수 있습니다.');
    },
    onError: (error) => {
      toast.error('게시 실패: ' + error.message);
    }
  });

  // Unpublish mutation
  const unpublishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('lecture_materials')
        .update({ is_published: false })
        .eq('lecture_id', lectureId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecture-materials', lectureId] });
      toast.success('강의자료가 비공개로 전환되었습니다.');
    },
    onError: (error) => {
      toast.error('비공개 전환 실패: ' + error.message);
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    e.target.value = '';
  };

  const moveUp = (material: LectureMaterial) => {
    if (material.order_index > 0) {
      reorderMutation.mutate({ materialId: material.id, newIndex: material.order_index - 1 });
    }
  };

  const moveDown = (material: LectureMaterial) => {
    if (materials && material.order_index < materials.length - 1) {
      reorderMutation.mutate({ materialId: material.id, newIndex: material.order_index + 1 });
    }
  };

  const allPublished = materials?.every(m => m.is_published) ?? false;
  const hasUnpublished = materials?.some(m => !m.is_published) ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>강의자료 관리</DialogTitle>
          <DialogDescription>
            {lectureTitle} - PDF 파일을 업로드하고 순서를 조정한 후 게시하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upload Button */}
          <div className="flex gap-2">
            <label className="flex-1">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <Button variant="outline" className="w-full gap-2" asChild disabled={isUploading}>
                <span>
                  <Upload className="w-4 h-4" />
                  {isUploading ? '업로드 중...' : 'PDF 파일 업로드'}
                </span>
              </Button>
            </label>
          </div>

          {/* Materials List */}
          <div className="space-y-2">
            <Label>업로드된 강의자료 ({materials?.length || 0}개)</Label>
            
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">로딩 중...</div>
            ) : !materials || materials.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                업로드된 강의자료가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {materials.map((material, index) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    {/* Order Controls */}
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => moveUp(material)}
                        disabled={index === 0 || reorderMutation.isPending}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => moveDown(material)}
                        disabled={index === materials.length - 1 || reorderMutation.isPending}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Order Number */}
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{material.file_name}</span>
                        {material.is_published && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">
                            게시됨
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(material.file_url, '_blank')}
                        title="미리보기"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('이 강의자료를 삭제하시겠습니까?')) {
                            deleteMutation.mutate(material.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {materials && materials.length > 0 && (
            <>
              {hasUnpublished && (
                <Button
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  {publishMutation.isPending ? '게시 중...' : '강의자료 게시'}
                </Button>
              )}
              {allPublished && (
                <Button
                  variant="outline"
                  onClick={() => unpublishMutation.mutate()}
                  disabled={unpublishMutation.isPending}
                >
                  {unpublishMutation.isPending ? '처리 중...' : '비공개로 전환'}
                </Button>
              )}
            </>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
