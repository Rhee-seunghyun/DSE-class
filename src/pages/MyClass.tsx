import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ChevronDown, ChevronUp, ClipboardList, BarChart3, BookOpen } from 'lucide-react';
import { StudentTable, StudentData } from '@/components/student/StudentTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ApplicationFormDialog } from '@/components/forms/ApplicationFormDialog';
import { ApplicationStatisticsDialog } from '@/components/student/ApplicationStatisticsDialog';
import { LectureMaterialsDialog } from '@/components/lecture/LectureMaterialsDialog';
import { QuestionsManageDialog } from '@/components/lecture/QuestionsManageDialog';
import { StaffAssignmentDialog } from '@/components/class/StaffAssignmentDialog';
import { UserCog, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MyClass() {
  const { profile, role } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditStudentDialogOpen, setIsEditStudentDialogOpen] = useState(false);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [isTableVisible, setIsTableVisible] = useState(true);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [isApplicationFormDialogOpen, setIsApplicationFormDialogOpen] = useState(false);
  const [isStatisticsDialogOpen, setIsStatisticsDialogOpen] = useState(false);
  const [isMaterialsDialogOpen, setIsMaterialsDialogOpen] = useState(false);
  const [isStaffAssignmentDialogOpen, setIsStaffAssignmentDialogOpen] = useState(false);

  // Form states for creating class
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassDate, setNewClassDate] = useState('');
  const [newClassCapacity, setNewClassCapacity] = useState('');

  // Edit student form states
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentEmail, setEditStudentEmail] = useState('');
  const [editStudentLicense, setEditStudentLicense] = useState('');
  const [editStudentPhone, setEditStudentPhone] = useState('');

  // Fetch lectures based on role
  // - For speaker/master: lectures they created
  // - For staff: lectures assigned to them
  const {
    data: lectures,
    isLoading: lecturesLoading
  } = useQuery({
    queryKey: ['my-classes', profile?.user_id, role],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      
      if (role === 'staff') {
        // For staff: get assigned lectures
        const { data: assignments, error: assignError } = await supabase
          .from('staff_lecture_assignments')
          .select('lecture_id')
          .eq('staff_user_id', profile.user_id);
        
        if (assignError) throw assignError;
        if (!assignments || assignments.length === 0) return [];
        
        const lectureIds = assignments.map(a => a.lecture_id);
        const { data, error } = await supabase
          .from('lectures')
          .select('*')
          .in('id', lectureIds)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } else {
        // For speaker/master: lectures they created
        const { data, error } = await supabase
          .from('lectures')
          .select('*')
          .eq('speaker_id', profile.user_id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      }
    },
    enabled: !!profile?.user_id
  });

  // Auto-select first lecture when data loads
  useEffect(() => {
    if (lectures && lectures.length > 0 && !selectedLectureId) {
      setSelectedLectureId(lectures[0].id);
    }
  }, [lectures, selectedLectureId]);

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
      } = await supabase
        .from('whitelist')
        .select('*')
        .eq('lecture_id', selectedLectureId)
        .order('created_at', { ascending: true })
        .limit(200); // Limit bulk queries to prevent data harvesting
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedLectureId
  });

  // Fetch application form for selected lecture
  const { data: applicationForm } = useQuery({
    queryKey: ['application-forms', selectedLectureId],
    queryFn: async () => {
      if (!selectedLectureId) return null;
      const { data, error } = await supabase
        .from('application_forms')
        .select('*')
        .eq('lecture_id', selectedLectureId)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedLectureId
  });
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

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async () => {
      if (!editingStudent) throw new Error('수정할 수강생을 선택해주세요.');
      const { error } = await supabase
        .from('whitelist')
        .update({
          student_name: editStudentName,
          email: editStudentEmail,
          license_number: editStudentLicense,
          phone_number: editStudentPhone
        })
        .eq('id', editingStudent.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['lecture-students']
      });
      setIsEditStudentDialogOpen(false);
      setEditingStudent(null);
      toast.success('수강생 정보가 수정되었습니다.');
    },
    onError: error => {
      toast.error('수정 실패: ' + error.message);
    }
  });

  const handleEditStudent = (student: StudentData) => {
    setEditingStudent(student);
    setEditStudentName(student.student_name || '');
    setEditStudentEmail(student.email);
    setEditStudentLicense(student.license_number || '');
    setEditStudentPhone(student.phone_number || '');
    setIsEditStudentDialogOpen(true);
  };

  const handleCheckboxChange = async (studentId: string, field: keyof StudentData, value: boolean) => {
    const { error } = await supabase
      .from('whitelist')
      .update({ [field]: value })
      .eq('id', studentId);
    
    if (error) {
      toast.error('업데이트 실패: ' + error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ['lecture-students'] });
    }
  };

  const handleMemoChange = async (studentId: string, memo: string) => {
    const { error } = await supabase
      .from('whitelist')
      .update({ admin_memo: memo })
      .eq('id', studentId);
    
    if (error) {
      toast.error('메모 저장 실패: ' + error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ['lecture-students'] });
      toast.success('메모가 저장되었습니다.');
    }
  };

  const selectedLecture = lectures?.find(l => l.id === selectedLectureId);
  return <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
             <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">My class</h1>
            {role === 'staff' && (
              <Badge variant="secondary" className="text-sm">담당 클래스</Badge>
            )}
          </div>
        </div>

        {/* Create Class Button */}
        {role !== 'staff' && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                class
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
        )}

        {/* Class List */}
        {lecturesLoading ? (
          <div className="text-muted-foreground">로딩 중...</div>
        ) : !lectures || lectures.length === 0 ? (
          <p className="text-muted-foreground">
            {role === 'staff' 
              ? '담당 클래스가 없습니다. 관리자에게 클래스 배정을 요청하세요.'
              : '생성된 클래스가 없습니다. + class 버튼을 눌러 새 클래스를 만드세요.'}
          </p>
        ) : null}

        {/* Selected Class Detail */}
        {selectedLecture && <Card className="bg-card">
            <CardHeader className="pb-2">
               <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <Button
                  variant="secondary"
                   className="gap-2 font-medium w-full lg:w-auto justify-start"
                  onClick={() => setIsTableVisible(!isTableVisible)}
                >
                  {selectedLecture.description?.split('/')[0]?.trim() || '날짜 미정'} {selectedLecture.title}
                  {isTableVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                 <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                     className="gap-1 flex-1 sm:flex-none"
                    onClick={() => setIsStatisticsDialogOpen(true)}
                  >
                    <BarChart3 className="w-4 h-4" />
                     <span className="hidden sm:inline">신청서 </span>통계
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                     className="gap-1 flex-1 sm:flex-none"
                    onClick={() => setIsApplicationFormDialogOpen(true)}
                  >
                    <ClipboardList className="w-4 h-4" />
                     <span className="hidden sm:inline">세미나 </span>신청서
                  </Button>
                  {/* 질문받기 버튼 */}
                  <QuestionsManageDialog 
                    lectureId={selectedLecture.id} 
                    lectureTitle={selectedLecture.title} 
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                     className="gap-1 flex-1 sm:flex-none"
                    onClick={() => setIsMaterialsDialogOpen(true)}
                  >
                    <BookOpen className="w-4 h-4" />
                     <span className="hidden sm:inline">강의자료 </span>관리
                  </Button>
                  {role === 'master' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                       className="gap-1 flex-1 sm:flex-none"
                      onClick={() => setIsStaffAssignmentDialogOpen(true)}
                    >
                      <UserCog className="w-4 h-4" />
                       <span className="hidden sm:inline">Staff </span>관리
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {isTableVisible && (
              <CardContent>
                <StudentTable
                  students={(students || []) as StudentData[]}
                  onEdit={handleEditStudent}
                  onDelete={(studentId) => deleteStudentMutation.mutate(studentId)}
                  onCheckboxChange={handleCheckboxChange}
                  onMemoChange={handleMemoChange}
                />
              </CardContent>
            )}
          </Card>}

        {/* Edit Student Dialog */}
        <Dialog open={isEditStudentDialogOpen} onOpenChange={setIsEditStudentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>수강생 정보 수정</DialogTitle>
              <DialogDescription>
                수강생의 정보를 수정합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editStudentName">수강생 이름</Label>
                <Input id="editStudentName" value={editStudentName} onChange={e => setEditStudentName(e.target.value)} placeholder="홍길동" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStudentEmail">이메일 주소</Label>
                <Input id="editStudentEmail" type="email" value={editStudentEmail} onChange={e => setEditStudentEmail(e.target.value)} placeholder="student@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStudentLicense">면허번호</Label>
                <Input id="editStudentLicense" value={editStudentLicense} onChange={e => setEditStudentLicense(e.target.value)} placeholder="12345" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStudentPhone">연락처</Label>
                <Input id="editStudentPhone" value={editStudentPhone} onChange={e => setEditStudentPhone(e.target.value)} placeholder="010-1234-5678" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditStudentDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={() => updateStudentMutation.mutate()} disabled={!editStudentEmail || updateStudentMutation.isPending}>
                {updateStudentMutation.isPending ? '저장 중...' : '저장하기'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Application Form Dialog */}
        {selectedLecture && profile?.user_id && (
          <ApplicationFormDialog
            open={isApplicationFormDialogOpen}
            onOpenChange={setIsApplicationFormDialogOpen}
            lectureId={selectedLecture.id}
            speakerId={profile.user_id}
            lectureTitle={selectedLecture.title}
            existingFormId={applicationForm?.id}
          />
        )}

        {/* Application Statistics Dialog */}
        {selectedLecture && (
          <ApplicationStatisticsDialog
            open={isStatisticsDialogOpen}
            onOpenChange={setIsStatisticsDialogOpen}
            lectureId={selectedLecture.id}
          />
        )}

        {/* Lecture Materials Dialog */}
        {selectedLecture && profile?.user_id && (
          <LectureMaterialsDialog
            open={isMaterialsDialogOpen}
            onOpenChange={setIsMaterialsDialogOpen}
            lectureId={selectedLecture.id}
            speakerId={profile.user_id}
            lectureTitle={selectedLecture.title}
          />
        )}

        {/* Staff Assignment Dialog */}
        {selectedLecture && role === 'master' && (
          <StaffAssignmentDialog
            open={isStaffAssignmentDialogOpen}
            onOpenChange={setIsStaffAssignmentDialogOpen}
            lectureId={selectedLecture.id}
            lectureTitle={selectedLecture.title}
          />
        )}
      </div>
    </DashboardLayout>;
}