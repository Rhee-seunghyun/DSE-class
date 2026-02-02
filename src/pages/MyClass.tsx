import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ChevronDown, ChevronUp, Upload, FileText, ClipboardList, Users } from 'lucide-react';
import { StudentTable, StudentData } from '@/components/student/StudentTable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ApplicationFormDialog } from '@/components/forms/ApplicationFormDialog';
import { FormResponsesDialog } from '@/components/forms/FormResponsesDialog';
// StudentEntry is now handled by StudentData from StudentTable component
export default function MyClass() {
  const {
    profile
  } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [isEditStudentDialogOpen, setIsEditStudentDialogOpen] = useState(false);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [isTableVisible, setIsTableVisible] = useState(true);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [isApplicationFormDialogOpen, setIsApplicationFormDialogOpen] = useState(false);
  const [isResponsesDialogOpen, setIsResponsesDialogOpen] = useState(false);

  // Form states for creating class
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassDate, setNewClassDate] = useState('');
  const [newClassCapacity, setNewClassCapacity] = useState('');

  // Form states for adding student
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentLicense, setStudentLicense] = useState('');
  const [studentPhone, setStudentPhone] = useState('');

  // Edit student form states
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentEmail, setEditStudentEmail] = useState('');
  const [editStudentLicense, setEditStudentLicense] = useState('');
  const [editStudentPhone, setEditStudentPhone] = useState('');

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
      } = await supabase.from('whitelist').select('*').eq('lecture_id', selectedLectureId).order('created_at', {
        ascending: true
      });
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
        license_number: studentLicense,
        phone_number: studentPhone
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
      setStudentPhone('');
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

  // Upload lecture file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedLectureId || !profile?.user_id) throw new Error('강의를 선택해주세요.');
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.user_id}/${selectedLectureId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('lecture-files')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lecture-files')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('lectures')
        .update({ pdf_url: publicUrl })
        .eq('id', selectedLectureId);

      if (updateError) throw updateError;
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-classes'] });
      toast.success('강의자료가 업로드되었습니다.');
    },
    onError: error => {
      toast.error('업로드 실패: ' + error.message);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
  };

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
        {lecturesLoading ? (
          <div className="text-muted-foreground">로딩 중...</div>
        ) : !lectures || lectures.length === 0 ? (
          <p className="text-muted-foreground">생성된 클래스가 없습니다. + class 버튼을 눌러 새 클래스를 만드세요.</p>
        ) : null}

        {/* Selected Class Detail */}
        {selectedLecture && <Card className="bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="secondary"
                  className="gap-2 font-medium"
                  onClick={() => setIsTableVisible(!isTableVisible)}
                >
                  {selectedLecture.description?.split('/')[0]?.trim() || '날짜 미정'} {selectedLecture.title}
                  {isTableVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={() => setIsApplicationFormDialogOpen(true)}
                  >
                    <ClipboardList className="w-4 h-4" />
                    {applicationForm ? '세미나 신청서 수정' : '세미나 신청서 작성'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-1"
                    onClick={() => setIsResponsesDialogOpen(true)}
                  >
                    <Users className="w-4 h-4" />
                    신청 목록
                  </Button>
                  <label>
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button size="sm" variant="outline" className="gap-1" asChild disabled={uploadFileMutation.isPending}>
                      <span>
                        <Upload className="w-4 h-4" />
                        {uploadFileMutation.isPending ? '업로드 중...' : '강의자료'}
                      </span>
                    </Button>
                  </label>
                  {selectedLecture.pdf_url && (
                    <Button size="sm" variant="ghost" className="gap-1" asChild>
                      <a href={selectedLecture.pdf_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4" />
                        보기
                      </a>
                    </Button>
                  )}
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
                        <div className="space-y-2">
                          <Label htmlFor="studentPhone">연락처</Label>
                          <Input id="studentPhone" value={studentPhone} onChange={e => setStudentPhone(e.target.value)} placeholder="010-1234-5678" />
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
              </div>
            </CardHeader>
            {isTableVisible && (
              <CardContent>
                <StudentTable
                  students={(students || []) as StudentData[]}
                  onEdit={handleEditStudent}
                  onDelete={(studentId) => deleteStudentMutation.mutate(studentId)}
                  onCheckboxChange={handleCheckboxChange}
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

        {/* Form Responses Dialog */}
        {applicationForm && selectedLecture && profile?.user_id && (
          <FormResponsesDialog
            open={isResponsesDialogOpen}
            onOpenChange={setIsResponsesDialogOpen}
            formId={applicationForm.id}
            formTitle={applicationForm.title}
            lectureId={selectedLecture.id}
            speakerId={profile.user_id}
          />
        )}
      </div>
    </DashboardLayout>;
}