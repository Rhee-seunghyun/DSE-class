import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
interface StudentEntry {
  id: string;
  student_name: string | null;
  email: string;
  license_number: string | null;
}
export default function MyClass() {
  const {
    profile
  } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);

  // Form states for creating class
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassDate, setNewClassDate] = useState('');
  const [newClassCapacity, setNewClassCapacity] = useState('');

  // Form states for adding student
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentLicense, setStudentLicense] = useState('');

  // Fetch lectures created by current user (speaker/master)
  const {
    data: lectures,
    isLoading: lecturesLoading
  } = useQuery({
    queryKey: ['my-classes', profile?.id],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      const {
        data,
        error
      } = await supabase.from('lectures').select('*').eq('speaker_id', profile.user_id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.user_id
  });

  // Fetch whitelist for selected lecture
  const {
    data: students
  } = useQuery({
    queryKey: ['lecture-students', selectedLectureId],
    queryFn: async () => {
      if (!selectedLectureId) return [];
      const {
        data,
        error
      } = await supabase.from('whitelist').select('*').eq('lecture_id', selectedLectureId).order('created_at', {
        ascending: true
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedLectureId
  });

  // Create new class mutation
  const createClassMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.user_id) throw new Error('로그인이 필요합니다.');
      const {
        data,
        error
      } = await supabase.from('lectures').insert({
        speaker_id: profile.user_id,
        title: newClassTitle,
        description: `${newClassDate} / 수강인원: ${newClassCapacity}명`,
        is_active: true
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['my-classes']
      });
      setIsCreateDialogOpen(false);
      setNewClassTitle('');
      setNewClassDate('');
      setNewClassCapacity('');
      setSelectedLectureId(data.id);
      toast.success('클래스가 생성되었습니다.');
    },
    onError: error => {
      toast.error('클래스 생성 실패: ' + error.message);
    }
  });

  // Add student to whitelist mutation
  const addStudentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLectureId || !profile?.user_id) throw new Error('강의를 선택해주세요.');
      const {
        error
      } = await supabase.from('whitelist').insert({
        lecture_id: selectedLectureId,
        speaker_id: profile.user_id,
        email: studentEmail,
        student_name: studentName,
        license_number: studentLicense
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['lecture-students']
      });
      setIsAddStudentDialogOpen(false);
      setStudentName('');
      setStudentEmail('');
      setStudentLicense('');
      toast.success('수강생이 등록되었습니다.');
    },
    onError: error => {
      toast.error('수강생 등록 실패: ' + error.message);
    }
  });

  // Delete student from whitelist
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const {
        error
      } = await supabase.from('whitelist').delete().eq('id', studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['lecture-students']
      });
      toast.success('수강생이 삭제되었습니다.');
    },
    onError: error => {
      toast.error('삭제 실패: ' + error.message);
    }
  });
  const selectedLecture = lectures?.find(l => l.id === selectedLectureId);
  return <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-foreground">My class</h1>
        </div>

        {/* Create Class Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              + class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 클래스 만들기</DialogTitle>
              <DialogDescription>
                새로운 강의 클래스를 생성합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">강의 제목</Label>
                <Input id="title" value={newClassTitle} onChange={e => setNewClassTitle(e.target.value)} placeholder="예: 응급강의" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">수강 날짜</Label>
                <Input id="date" type="date" value={newClassDate} onChange={e => setNewClassDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">수강 인원</Label>
                <Input id="capacity" type="number" value={newClassCapacity} onChange={e => setNewClassCapacity(e.target.value)} placeholder="예: 30" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={() => createClassMutation.mutate()} disabled={!newClassTitle || !newClassDate || !newClassCapacity || createClassMutation.isPending}>
                {createClassMutation.isPending ? '생성 중...' : '생성하기'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Class List */}
        {lecturesLoading ? <div className="text-muted-foreground">로딩 중...</div> : lectures && lectures.length > 0 ? <div className="flex gap-2 flex-wrap">
            {lectures.map(lecture => <Button key={lecture.id} variant={selectedLectureId === lecture.id ? "default" : "outline"} onClick={() => setSelectedLectureId(lecture.id)} className="text-sm">
                {lecture.title}
              </Button>)}
          </div> : <p className="text-muted-foreground">생성된 클래스가 없습니다. + class 버튼을 눌러 새 클래스를 만드세요.</p>}

        {/* Selected Class Detail */}
        {selectedLecture && <Card className="bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="px-4 py-2 rounded-md font-medium bg-[#f2f2f2] text-secondary-foreground">
                  {selectedLecture.description?.split('/')[0]?.trim() || '날짜 미정'} {selectedLecture.title}
                </div>
                <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Plus className="w-4 h-4" />
                      수강생 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>수강생 등록</DialogTitle>
                      <DialogDescription>
                        이 강의에 접근할 수 있는 수강생을 등록합니다.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentName">수강생 이름</Label>
                        <Input id="studentName" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="홍길동" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentEmail">이메일 주소</Label>
                        <Input id="studentEmail" type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} placeholder="student@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studentLicense">면허번호</Label>
                        <Input id="studentLicense" value={studentLicense} onChange={e => setStudentLicense(e.target.value)} placeholder="12345" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddStudentDialogOpen(false)}>
                        취소
                      </Button>
                      <Button onClick={() => addStudentMutation.mutate()} disabled={!studentEmail || addStudentMutation.isPending}>
                        {addStudentMutation.isPending ? '등록 중...' : '등록하기'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">No</TableHead>
                    <TableHead>수강생 이름</TableHead>
                    <TableHead>면허번호</TableHead>
                    <TableHead>로그인 이메일</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students && students.length > 0 ? students.map((student, index) => <TableRow key={student.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{student.student_name || '-'}</TableCell>
                        <TableCell>{student.license_number || '-'}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteStudentMutation.mutate(student.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>) : <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        등록된 수강생이 없습니다.
                      </TableCell>
                    </TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>}
      </div>
    </DashboardLayout>;
}