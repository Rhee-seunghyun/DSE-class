 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { UserCheck, Mic, Users } from 'lucide-react';
 
 interface RoleSelectionDialogProps {
   open: boolean;
   onSelect: (role: 'student' | 'staff' | 'speaker') => void;
   onClose: () => void;
 }
 
 export function RoleSelectionDialog({ open, onSelect, onClose }: RoleSelectionDialogProps) {
   return (
     <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>가입 유형 선택</DialogTitle>
           <DialogDescription>
             사전 등록되지 않은 이메일입니다. 가입 유형을 선택해주세요.
           </DialogDescription>
         </DialogHeader>
         
         <div className="flex flex-col gap-3 mt-4">
           <Button
             variant="outline"
             className="h-auto p-4 justify-start gap-4"
             onClick={() => onSelect('student')}
           >
             <UserCheck className="h-6 w-6 text-primary" />
             <div className="text-left">
               <div className="font-medium">수강생</div>
               <div className="text-sm text-muted-foreground">
                 세미나 수강을 원하시는 분
               </div>
             </div>
           </Button>
           
           <Button
             variant="outline"
             className="h-auto p-4 justify-start gap-4"
             onClick={() => onSelect('speaker')}
           >
             <Mic className="h-6 w-6 text-primary" />
             <div className="text-left">
               <div className="font-medium">연자 (Speaker)</div>
               <div className="text-sm text-muted-foreground">
                 강의를 진행하시는 분
               </div>
             </div>
           </Button>
           
           <Button
             variant="outline"
             className="h-auto p-4 justify-start gap-4"
             onClick={() => onSelect('staff')}
           >
             <Users className="h-6 w-6 text-primary" />
             <div className="text-left">
               <div className="font-medium">스태프 (Staff)</div>
               <div className="text-sm text-muted-foreground">
                 운영을 담당하시는 분
               </div>
             </div>
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 }