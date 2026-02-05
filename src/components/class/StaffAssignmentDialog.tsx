 import { useState } from 'react';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Loader2, Search, Plus, X, UserCog } from 'lucide-react';
 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 
 interface StaffAssignmentDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   lectureId: string;
   lectureTitle: string;
 }
 
 interface StaffMember {
   id: string;
   user_id: string;
   profile?: {
     email: string;
     full_name: string;
   };
 }
 
 export function StaffAssignmentDialog({
   open,
   onOpenChange,
   lectureId,
   lectureTitle,
 }: StaffAssignmentDialogProps) {
   const queryClient = useQueryClient();
   const [searchTerm, setSearchTerm] = useState('');
 
   // 모든 Staff 목록 조회
   const { data: allStaff, isLoading: staffLoading } = useQuery({
     queryKey: ['all-staff'],
     queryFn: async () => {
       const { data: roles, error } = await supabase
         .from('user_roles')
         .select('*')
         .eq('role', 'staff');
 
       if (error) throw error;
 
       const staffWithProfiles: StaffMember[] = [];
       for (const role of roles || []) {
         const { data: profile } = await supabase
           .from('profiles')
           .select('email, full_name')
           .eq('user_id', role.user_id)
           .single();
 
         staffWithProfiles.push({
           id: role.id,
           user_id: role.user_id,
           profile: profile || undefined,
         });
       }
 
       return staffWithProfiles;
     },
     enabled: open,
   });
 
   // 해당 강의에 할당된 Staff 목록 조회
   const { data: assignedStaff } = useQuery({
     queryKey: ['lecture-staff-assignments', lectureId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('staff_lecture_assignments')
         .select('*')
         .eq('lecture_id', lectureId);
 
       if (error) throw error;
       return data || [];
     },
     enabled: open && !!lectureId,
   });
 
   // Staff 할당 추가
   const assignMutation = useMutation({
     mutationFn: async (staffUserId: string) => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error('로그인이 필요합니다.');
 
       const { error } = await supabase
         .from('staff_lecture_assignments')
         .insert({
           staff_user_id: staffUserId,
           lecture_id: lectureId,
           assigned_by: user.id,
         });
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['lecture-staff-assignments', lectureId] });
       queryClient.invalidateQueries({ queryKey: ['staff-assignments'] });
       toast.success('Staff가 클래스에 배정되었습니다.');
     },
     onError: (error: Error) => {
       toast.error('배정 실패: ' + error.message);
     },
   });
 
   // Staff 할당 제거
   const unassignMutation = useMutation({
     mutationFn: async (staffUserId: string) => {
       const { error } = await supabase
         .from('staff_lecture_assignments')
         .delete()
         .eq('staff_user_id', staffUserId)
         .eq('lecture_id', lectureId);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['lecture-staff-assignments', lectureId] });
       queryClient.invalidateQueries({ queryKey: ['staff-assignments'] });
       toast.success('Staff 배정이 해제되었습니다.');
     },
     onError: (error: Error) => {
       toast.error('배정 해제 실패: ' + error.message);
     },
   });
 
   const assignedStaffIds = assignedStaff?.map((a) => a.staff_user_id) || [];
 
   const filteredStaff = allStaff?.filter(
     (staff) =>
       staff.profile?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
       staff.profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
   );
 
   const assignedStaffList = filteredStaff?.filter((s) =>
     assignedStaffIds.includes(s.user_id)
   );
   const unassignedStaffList = filteredStaff?.filter(
     (s) => !assignedStaffIds.includes(s.user_id)
   );
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-md">
         <DialogHeader>
           <DialogTitle>Staff 관리</DialogTitle>
           <DialogDescription>
             "{lectureTitle}" 클래스 담당 Staff를 관리합니다.
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           {/* 검색 */}
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
               placeholder="이메일 또는 이름으로 검색"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10"
             />
           </div>
 
           {/* 배정된 Staff */}
           {assignedStaffList && assignedStaffList.length > 0 && (
             <div className="space-y-2">
               <Label className="text-sm font-medium">배정된 Staff</Label>
               <div className="flex flex-wrap gap-2">
                 {assignedStaffList.map((staff) => (
                   <Badge
                     key={staff.user_id}
                     variant="secondary"
                     className="gap-1 pr-1"
                   >
                     <UserCog className="w-3 h-3" />
                     {staff.profile?.full_name || staff.profile?.email}
                     <Button
                       variant="ghost"
                       size="icon"
                       className="h-4 w-4 ml-1 hover:bg-destructive/20"
                       onClick={() => unassignMutation.mutate(staff.user_id)}
                       disabled={unassignMutation.isPending}
                     >
                       <X className="w-3 h-3" />
                     </Button>
                   </Badge>
                 ))}
               </div>
             </div>
           )}
 
           {/* 배정 가능한 Staff */}
           <div className="space-y-2">
             <Label className="text-sm font-medium">배정 가능한 Staff</Label>
             {staffLoading ? (
               <div className="flex items-center justify-center py-4">
                 <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
               </div>
             ) : unassignedStaffList && unassignedStaffList.length > 0 ? (
               <div className="space-y-2 max-h-48 overflow-y-auto">
                 {unassignedStaffList.map((staff) => (
                   <div
                     key={staff.user_id}
                     className="flex items-center justify-between p-2 rounded-md border bg-card"
                   >
                     <div className="text-sm">
                       <div className="font-medium">
                         {staff.profile?.full_name || '-'}
                       </div>
                       <div className="text-muted-foreground text-xs">
                         {staff.profile?.email}
                       </div>
                     </div>
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => assignMutation.mutate(staff.user_id)}
                       disabled={assignMutation.isPending}
                     >
                       <Plus className="w-4 h-4 mr-1" />
                       배정
                     </Button>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-sm text-muted-foreground py-2">
                 {allStaff?.length === 0
                   ? '등록된 Staff가 없습니다.'
                   : '배정 가능한 Staff가 없습니다.'}
               </p>
             )}
           </div>
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             닫기
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }