import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ChevronRight, Download, FileText, Check, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { savePdfOffline, removePdfOffline, getAllCachedMaterialIds } from '@/lib/offlineStorage';

function extractStoragePath(fileUrl: string): string | null {
  if (!fileUrl) return null;
  if (!fileUrl.startsWith("http")) return fileUrl;
  try {
    const url = new URL(fileUrl);
    const parts = url.pathname.split("/lecture-files/");
    if (parts.length > 1) return decodeURIComponent(parts[1]);
  } catch { /* noop */ }
  const match = fileUrl.match(/lecture-files\/(.+)$/);
  if (match) return decodeURIComponent(match[1]);
  return null;
}

export default function MyLectures() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [cachedIds, setCachedIds] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  // Load cached IDs on mount
  useEffect(() => {
    getAllCachedMaterialIds().then((ids) => setCachedIds(new Set(ids))).catch(() => {});
  }, []);

  // 학생이 whitelist에 등록되어 있고 승인된 강의 목록 조회
  const { data: lectures, isLoading } = useQuery({
    queryKey: ['my-lectures', profile?.email],
    queryFn: async () => {
      if (!profile?.email) return [];
      
      const { data: whitelistData, error: whitelistError } = await supabase
        .from('whitelist')
        .select('lecture_id')
        .eq('email', profile.email)
        .eq('is_registered', true);

      if (whitelistError) throw whitelistError;
      if (!whitelistData || whitelistData.length === 0) return [];

      const lectureIds = whitelistData.map(w => w.lecture_id);

      const { data: lecturesData, error: lecturesError } = await supabase
        .from('lectures')
        .select('*')
        .in('id', lectureIds)
        .eq('is_active', true);

      if (lecturesError) throw lecturesError;
      return lecturesData || [];
    },
    enabled: !!profile?.email,
  });

  // Fetch materials for all lectures to enable per-lecture offline download
  const { data: allMaterials } = useQuery({
    queryKey: ['all-lecture-materials', lectures?.map(l => l.id)],
    queryFn: async () => {
      if (!lectures || lectures.length === 0) return [];
      const ids = lectures.map(l => l.id);
      const { data, error } = await supabase
        .from('lecture_materials')
        .select('*')
        .in('lecture_id', ids)
        .eq('is_published', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!lectures && lectures.length > 0,
  });

  const handleDownloadLecture = useCallback(async (lectureId: string) => {
    if (!allMaterials) return;
    const mats = allMaterials.filter(m => m.lecture_id === lectureId);
    if (mats.length === 0) {
      toast({ title: '다운로드할 자료가 없습니다.' });
      return;
    }

    setDownloadingIds(prev => new Set(prev).add(lectureId));

    let success = 0;
    for (const mat of mats) {
      if (cachedIds.has(mat.id)) { success++; continue; }
      const storagePath = extractStoragePath(mat.file_url);
      if (!storagePath) continue;
      try {
        const { data, error } = await supabase.storage.from('lecture-files').download(storagePath);
        if (error || !data) continue;
        const buf = await data.arrayBuffer();
        await savePdfOffline(mat.id, new Uint8Array(buf));
        success++;
      } catch { /* skip */ }
    }

    // Refresh cached IDs
    const updatedIds = await getAllCachedMaterialIds();
    setCachedIds(new Set(updatedIds));
    setDownloadingIds(prev => { const n = new Set(prev); n.delete(lectureId); return n; });

    toast({
      title: '오프라인 저장 완료',
      description: `${success}/${mats.length}개 자료가 저장되었습니다.`,
    });
  }, [allMaterials, cachedIds, toast]);

  const handleRemoveLecture = useCallback(async (lectureId: string) => {
    if (!allMaterials) return;
    const mats = allMaterials.filter(m => m.lecture_id === lectureId);
    for (const mat of mats) {
      await removePdfOffline(mat.id).catch(() => {});
    }
    const updatedIds = await getAllCachedMaterialIds();
    setCachedIds(new Set(updatedIds));
    toast({ title: '오프라인 자료가 삭제되었습니다.' });
  }, [allMaterials, toast]);

  const isLectureCached = useCallback((lectureId: string) => {
    if (!allMaterials) return false;
    const mats = allMaterials.filter(m => m.lecture_id === lectureId);
    return mats.length > 0 && mats.every(m => cachedIds.has(m.id));
  }, [allMaterials, cachedIds]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <Card className="border-2">
          <CardHeader className="pb-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">My class</CardTitle>
                <CardDescription>
                  승인된 강의 목록입니다. 강의를 클릭하여 자료를 확인하세요.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : lectures && lectures.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lectures.map((lecture) => {
                  const cached = isLectureCached(lecture.id);
                  const downloading = downloadingIds.has(lecture.id);

                  return (
                    <div key={lecture.id} className="p-4 border rounded-lg hover:border-primary hover:bg-accent/50 transition-all group">
                      <Link to={`/lecture/${lecture.id}`} className="block">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {lecture.title}
                            </h3>
                          </div>
                          <Badge variant="secondary" className="text-xs">수강 중</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {lecture.description || '강의 설명이 없습니다.'}
                        </p>
                        <div className="flex items-center justify-end text-sm text-primary">
                          <span>강의실 입장</span>
                          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>

                      {/* Offline download controls */}
                      <div className="mt-3 pt-3 border-t flex items-center gap-2">
                        {cached ? (
                          <>
                            <span className="text-xs text-primary flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> 오프라인 저장됨
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs ml-auto text-muted-foreground"
                              onClick={(e) => { e.preventDefault(); handleRemoveLecture(lecture.id); }}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> 삭제
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={downloading}
                            onClick={(e) => { e.preventDefault(); handleDownloadLecture(lecture.id); }}
                          >
                            {downloading ? (
                              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> 저장 중...</>
                            ) : (
                              <><Download className="w-3.5 h-3.5 mr-1" /> 오프라인 저장</>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  수강 가능한 강의가 없습니다.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  연자가 수강생으로 등록하면 강의가 표시됩니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}