 import { DashboardLayout } from '@/components/layout/DashboardLayout';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
   UserCog,
   Shield
 } from 'lucide-react';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { Skeleton } from '@/components/ui/skeleton';
 import { useToast } from '@/hooks/use-toast';
 import { useState } from 'react';
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
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 
 interface StaffWithProfile {
   id: string;
   user_id: string;
   role: string;
   created_at: string;
   profile?: {
     email: string;
     full_name: string;
   };
  assignedLectures?: {
    id: string;
    title: string;
  }[];
 }
 
 export default function Staff() {
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const [searchTerm, setSearchTerm] = useState('');
   const [dialogOpen, setDialogOpen] = useState(false);
   const [deleteId, setDeleteId] = useState<string | null>(null);
   const [newEmail, setNewEmail] = useState('');
 
   // Staff 목록 조회
   const { data: staffList, isLoading } = useQuery({
     queryKey: ['staff'],
     queryFn: async () => {
       const { data: roles, error } = await supabase
         .from('user_roles')
         .select('*')
         .eq('role', 'staff');
 
       if (error) throw error;
 
       const staffWithProfiles: StaffWithProfile[] = [];
       for (const role of roles || []) {
         const { data: profile } = await supabase
           .from('profiles')
           .select('email, full_name')
           .eq('user_id', role.user_id)
           .single();
        
        // 해당 Staff가 담당하는 강의 목록 조회
        const { data: assignments } = await supabase
          .from('staff_lecture_assignments')
          .select('lecture_id')
          .eq('staff_user_id', role.user_id);
        
        let assignedLectures: { id: string; title: string }[] = [];
        if (assignments && assignments.length > 0) {
          const lectureIds = assignments.map((a) => a.lecture_id);
          const { data: lectures } = await supabase
            .from('lectures')
            .select('id, title')
            .in('id', lectureIds);
          assignedLectures = lectures || [];
        }
         
         staffWithProfiles.push({
           ...role,
           profile: profile || undefined,
          assignedLectures,
         });
       }
 
       return staffWithProfiles;
     },
   });
 
   // 이메일로 사용자 찾아서 staff 권한 부여
   const addMutation = useMutation({
     mutationFn: async (email: string) => {
       // 이메일로 프로필 찾기
       const { data: profile, error: profileError } = await supabase
         .from('profiles')
         .select('user_id')
         .eq('email', email.toLowerCase())
         .single();
 
       if (profileError || !profile) {
         throw new Error('해당 이메일로 등록된 사용자를 찾을 수 없습니다.');
       }
 
       // 이미 staff 권한이 있는지 확인
       const { data: existingRole } = await supabase
         .from('user_roles')
         .select('*')
         .eq('user_id', profile.user_id)
         .eq('role', 'staff')
         .single();
 
       if (existingRole) {
         throw new Error('이미 스태프 권한이 있는 사용자입니다.');
       }
 
       // master인지 확인
       const { data: masterRole } = await supabase
         .from('user_roles')
         .select('*')
         .eq('user_id', profile.user_id)
         .eq('role', 'master')
         .single();
 
       if (masterRole) {
         throw new Error('마스터 계정은 스태프로 변경할 수 없습니다.');
       }
 
       // 기존 역할 삭제 후 staff 권한 부여
       await supabase
         .from('user_roles')
         .delete()
         .eq('user_id', profile.user_id);
 
       const { error } = await supabase
         .from('user_roles')
         .insert({
           user_id: profile.user_id,
           role: 'staff',
         });
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['staff'] });
       toast({
         title: '권한 부여 완료',
         description: '스태프 권한이 부여되었습니다.',
       });
       setDialogOpen(false);
       setNewEmail('');
     },
     onError: (error: Error) => {
       toast({
         variant: 'destructive',
         title: '권한 부여 실패',
         description: error.message,
       });
     },
   });
 
   // staff 권한 제거 (student로 변경)
   const removeMutation = useMutation({
     mutationFn: async (roleId: string) => {
       const role = staffList?.find((s) => s.id === roleId);
       if (!role) throw new Error('역할을 찾을 수 없습니다.');
 
       // staff 역할 삭제
       const { error: deleteError } = await supabase
         .from('user_roles')
         .delete()
         .eq('id', roleId);
 
       if (deleteError) throw deleteError;
 
       // student 역할로 변경
       const { error: insertError } = await supabase
         .from('user_roles')
         .insert({
           user_id: role.user_id,
           role: 'student',
         });
 
       if (insertError) throw insertError;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['staff'] });
       toast({
         title: '권한 제거 완료',
         description: '스태프 권한이 제거되고 수강생으로 변경되었습니다.',
       });
       setDeleteId(null);
     },
     onError: () => {
       toast({
         variant: 'destructive',
         title: '권한 제거 실패',
         description: '스태프 권한 제거 중 오류가 발생했습니다.',
       });
     },
   });
 
   const filteredStaff = staffList?.filter((item) =>
     item.profile?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
   );
 
   return (
     <DashboardLayout>
       <div className="space-y-6 animate-fade-in">
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-3xl font-bold text-foreground">스태프 관리</h1>
             <p className="text-muted-foreground mt-1">
               스태프 권한을 부여하고 관리하세요. 스태프는 마스터와 동일한 권한을 가집니다.
             </p>
           </div>
           <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
             <DialogTrigger asChild>
               <Button>
                 <Plus className="w-4 h-4 mr-2" />
                 스태프 권한 부여
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>스태프 권한 부여</DialogTitle>
                 <DialogDescription>
                   스태프 권한을 부여할 사용자의 이메일을 입력하세요.
                   해당 사용자는 이미 가입되어 있어야 합니다.
                 </DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                 <div className="space-y-2">
                   <Label htmlFor="email">이메일</Label>
                   <Input
                     id="email"
                     type="email"
                     value={newEmail}
                     onChange={(e) => setNewEmail(e.target.value)}
                     placeholder="staff@example.com"
                   />
                 </div>
               </div>
               <DialogFooter>
                 <Button variant="outline" onClick={() => setDialogOpen(false)}>
                   취소
                 </Button>
                 <Button 
                   onClick={() => addMutation.mutate(newEmail)}
                   disabled={!newEmail || addMutation.isPending}
                 >
                   {addMutation.isPending ? (
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   ) : null}
                   권한 부여
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
         </div>
 
         {/* Search */}
         <Card>
           <CardContent className="pt-6">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input
                 placeholder="이메일 또는 이름으로 검색"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-10"
               />
             </div>
           </CardContent>
         </Card>
 
         {/* Staff Table */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Shield className="w-5 h-5" />
               스태프 목록
               {filteredStaff && (
                 <Badge variant="secondary">{filteredStaff.length}명</Badge>
               )}
             </CardTitle>
             <CardDescription>
               스태프 권한이 부여된 사용자 목록입니다.
             </CardDescription>
           </CardHeader>
           <CardContent>
             {isLoading ? (
               <div className="space-y-4">
                 {[1, 2, 3].map((i) => (
                   <Skeleton key={i} className="h-12 w-full" />
                 ))}
               </div>
             ) : filteredStaff && filteredStaff.length > 0 ? (
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>이메일</TableHead>
                     <TableHead>이름</TableHead>
                     <TableHead>권한</TableHead>
                     <TableHead>부여일</TableHead>
                  <TableHead>담당 class</TableHead>
                     <TableHead className="w-[80px]"></TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredStaff.map((item) => (
                     <TableRow key={item.id}>
                       <TableCell>{item.profile?.email || '-'}</TableCell>
                       <TableCell>{item.profile?.full_name || '-'}</TableCell>
                       <TableCell>
                         <Badge variant="default" className="gap-1">
                           <UserCog className="w-3 h-3" />
                           스태프
                         </Badge>
                       </TableCell>
                       <TableCell>
                         {new Date(item.created_at).toLocaleDateString('ko-KR')}
                       </TableCell>
                      <TableCell>
                        {item.assignedLectures && item.assignedLectures.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.assignedLectures.map((lecture) => (
                              <Badge key={lecture.id} variant="outline" className="text-xs">
                                {lecture.title}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                       <TableCell>
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => setDeleteId(item.id)}
                         >
                           <Trash2 className="w-4 h-4 text-destructive" />
                         </Button>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             ) : (
               <div className="flex flex-col items-center justify-center py-12">
                 <Users className="w-12 h-12 text-muted-foreground mb-4" />
                 <p className="text-muted-foreground text-center">
                   등록된 스태프가 없습니다.
                 </p>
               </div>
             )}
           </CardContent>
         </Card>
       </div>
 
       <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>스태프 권한을 제거하시겠습니까?</AlertDialogTitle>
             <AlertDialogDescription>
               스태프 권한이 제거되고 수강생 권한으로 변경됩니다.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>취소</AlertDialogCancel>
             <AlertDialogAction
               onClick={() => deleteId && removeMutation.mutate(deleteId)}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
               권한 제거
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </DashboardLayout>
   );
 }