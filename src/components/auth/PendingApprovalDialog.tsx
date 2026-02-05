 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Clock } from 'lucide-react';
 
 interface PendingApprovalDialogProps {
   open: boolean;
   role: 'staff' | 'speaker';
   onConfirm: () => void;
 }
 
 export function PendingApprovalDialog({ open, role, onConfirm }: PendingApprovalDialogProps) {
   const roleLabel = role === 'speaker' ? '연자' : '스태프';
   
   return (
     <Dialog open={open}>
       <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
         <DialogHeader>
           <div className="flex justify-center mb-4">
             <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
               <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
             </div>
           </div>
           <DialogTitle className="text-center">가입 신청 완료</DialogTitle>
           <DialogDescription className="text-center space-y-2">
             <p>
               {roleLabel} 계정 가입 신청이 완료되었습니다.
             </p>
             <p>
               관리자의 승인 후 로그인이 가능합니다.
             </p>
             <p className="text-sm text-muted-foreground mt-4">
               이메일로 발송된 인증 링크를 클릭하여 이메일 인증을 완료해주세요.
             </p>
           </DialogDescription>
         </DialogHeader>
         
         <div className="flex justify-center mt-4">
           <Button onClick={onConfirm} style={{ backgroundColor: '#E94560' }}>
             확인
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 }