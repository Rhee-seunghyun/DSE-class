import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Trash2,
  Loader2,
  Search,
  UserCheck,
  UserX
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Whitelist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedLecture, setSelectedLecture] = useState<string>(searchParams.get('lecture') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newLicense, setNewLicense] = useState('');
  const isMobile = useIsMobile();

  const { data: lectures } = useQuery({
    queryKey: ['speaker-lectures-select', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lectures')
        .select('id, title')
        .eq('speaker_id', user?.id)
        .order('title');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: whitelist, isLoading } = useQuery({
    queryKey: ['whitelist', user?.id, selectedLecture],
    queryFn: async () => {
      let query = supabase
        .from('whitelist')
        .select('*')
        .eq('speaker_id', user?.id)
        .order('created_at', { ascending: false });

      if (selectedLecture) {
        query = query.eq('lecture_id', selectedLecture);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLecture) throw new Error('강의를 선택해주세요.');
      
      const { error } = await supabase
        .from('whitelist')
        .insert({
          email: newEmail.toLowerCase(),
          student_name: newName || null,
          license_number: newLicense || null,
          lecture_id: selectedLecture,
          speaker_id: user!.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] });
      queryClient.invalidateQueries({ queryKey: ['whitelist-counts'] });
      toast({
        title: '등록 완료',
        description: '수강생이 등록되었습니다.',
      });
      setDialogOpen(false);
      setNewEmail('');
      setNewName('');
      setNewLicense('');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: '등록 실패',
        description: error.message || '수강생 등록 중 오류가 발생했습니다.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whitelist')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] });
      queryClient.invalidateQueries({ queryKey: ['whitelist-counts'] });
      toast({
        title: '삭제 완료',
        description: '수강생이 삭제되었습니다.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: '수강생 삭제 중 오류가 발생했습니다.',
      });
    },
  });

  const filteredWhitelist = whitelist?.filter((item) =>
    item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLectureName = (lectureId: string) => {
    return lectures?.find((l) => l.id === lectureId)?.title || '알 수 없음';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">수강생 관리</h1>
            <p className="text-muted-foreground mt-1">
              강의별 수강생을 등록하고 관리하세요.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button disabled={!selectedLecture} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                수강생 등록
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>수강생 등록</DialogTitle>
                <DialogDescription>
                  새 수강생의 정보를 입력하세요. 등록된 이메일로만 가입이 가능합니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일 *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="student@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="홍길동"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">면허번호</Label>
                  <Input
                    id="license"
                    value={newLicense}
                    onChange={(e) => setNewLicense(e.target.value)}
                    placeholder="면허번호 (선택)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  취소
                </Button>
                <Button 
                  onClick={() => addMutation.mutate()}
                  disabled={!newEmail || addMutation.isPending}
                >
                  {addMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  등록
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="lecture-select" className="sr-only">강의 선택</Label>
                <Select value={selectedLecture} onValueChange={setSelectedLecture}>
                  <SelectTrigger>
                    <SelectValue placeholder="강의를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">전체 강의</SelectItem>
                    {lectures?.map((lecture) => (
                      <SelectItem key={lecture.id} value={lecture.id}>
                        {lecture.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="이메일 또는 이름으로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Whitelist Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              수강생 목록
              {filteredWhitelist && (
                <Badge variant="secondary">{filteredWhitelist.length}명</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredWhitelist && filteredWhitelist.length > 0 ? (
              isMobile ? (
                <div className="space-y-3">
                  {filteredWhitelist.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.student_name || item.email}</p>
                          <p className="text-sm text-muted-foreground">{item.email}</p>
                          {item.license_number && (
                            <p className="text-xs text-muted-foreground">면허: {item.license_number}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        {item.is_registered ? (
                          <Badge variant="default" className="gap-1">
                            <UserCheck className="w-3 h-3" />
                            가입완료
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <UserX className="w-3 h-3" />
                            미가입
                          </Badge>
                        )}
                        <span className="text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      {!selectedLecture && (
                        <p className="text-xs text-muted-foreground">
                          강의: {getLectureName(item.lecture_id)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이메일</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>면허번호</TableHead>
                    {!selectedLecture && <TableHead>강의</TableHead>}
                    <TableHead>가입 상태</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWhitelist.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>{item.student_name || '-'}</TableCell>
                      <TableCell>{item.license_number || '-'}</TableCell>
                      {!selectedLecture && (
                        <TableCell>{getLectureName(item.lecture_id)}</TableCell>
                      )}
                      <TableCell>
                        {item.is_registered ? (
                          <Badge variant="default" className="gap-1">
                            <UserCheck className="w-3 h-3" />
                            가입완료
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <UserX className="w-3 h-3" />
                            미가입
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {selectedLecture 
                    ? '등록된 수강생이 없습니다.'
                    : '강의를 선택하고 수강생을 등록하세요.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
