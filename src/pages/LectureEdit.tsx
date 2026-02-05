import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, Loader2, FileText, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface LectureForm {
  title: string;
  description: string;
  is_active: boolean;
}

export default function LectureEdit() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LectureForm>({
    defaultValues: {
      title: '',
      description: '',
      is_active: true,
    },
  });

  const isActive = watch('is_active');

  const { data: lecture, isLoading } = useQuery({
    queryKey: ['lecture-edit', id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !isNew && !!id,
  });

  useEffect(() => {
    if (lecture) {
      setValue('title', lecture.title);
      setValue('description', lecture.description || '');
      setValue('is_active', lecture.is_active);
      setPdfUrl(lecture.pdf_url);
    }
  }, [lecture, setValue]);

  const saveMutation = useMutation({
    mutationFn: async (data: LectureForm) => {
      if (isNew) {
        const { error } = await supabase
          .from('lectures')
          .insert({
            ...data,
            speaker_id: user!.id,
            pdf_url: pdfUrl,
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lectures')
          .update({
            ...data,
            pdf_url: pdfUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speaker-lectures'] });
      toast({
        title: isNew ? '강의 생성 완료' : '저장 완료',
        description: isNew ? '새 강의가 생성되었습니다.' : '강의가 저장되었습니다.',
      });
      navigate('/lectures');
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: '저장 실패',
        description: '강의 저장 중 오류가 발생했습니다.',
      });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: '업로드 실패',
        description: 'PDF 파일만 업로드 가능합니다.',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('lecture-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lecture-files')
        .getPublicUrl(fileName);

      setPdfUrl(publicUrl);

      toast({
        title: '업로드 완료',
        description: 'PDF 파일이 업로드되었습니다.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: '업로드 실패',
        description: '파일 업로드 중 오류가 발생했습니다.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePdf = () => {
    setPdfUrl(null);
  };

  const onSubmit = (data: LectureForm) => {
    saveMutation.mutate(data);
  };

  if (!isNew && isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
          <div className="flex items-start sm:items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/lectures')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {isNew ? '새 강의 만들기' : '강의 편집'}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? '새 강의를 생성하세요.' : '강의 정보를 수정하세요.'}
            </p>
          </div>
        </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
              <CardDescription>강의의 기본 정보를 입력하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">강의 제목 *</Label>
                <Input
                  id="title"
                  {...register('title', { required: '강의 제목을 입력하세요.' })}
                  placeholder="강의 제목을 입력하세요"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">강의 설명</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="강의에 대한 설명을 입력하세요"
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>강의 활성화</Label>
                  <p className="text-sm text-muted-foreground">
                    비활성화하면 수강생이 강의에 접근할 수 없습니다.
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>강의 자료</CardTitle>
              <CardDescription>PDF 형식의 강의 자료를 업로드하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              {pdfUrl ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">강의 자료 업로드됨</p>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {pdfUrl}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemovePdf}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">
                      PDF 파일을 업로드하세요
                    </p>
                    <Label htmlFor="pdf-upload" className="cursor-pointer">
                      <Button type="button" variant="secondary" disabled={uploading} asChild>
                        <span>
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              업로드 중...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              파일 선택
                            </>
                          )}
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/lectures')}
                className="w-full sm:w-auto"
            >
              취소
            </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="w-full sm:w-auto">
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                isNew ? '강의 생성' : '저장'
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
