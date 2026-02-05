 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
  import { Clock, Mail } from 'lucide-react';
 
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
            <div className="flex justify-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="w-7 h-7 text-orange-600 dark:text-orange-400" />
             </div>
           </div>
            <DialogTitle className="text-center text-xl">가입 신청이 완료되었습니다</DialogTitle>
            <DialogDescription className="text-center space-y-2 pt-2">
              <p className="font-medium text-foreground">
                {roleLabel} 계정 로그인을 위해 아래 두 가지 조건이 필요합니다:
              </p>
              <div className="bg-muted/50 rounded-lg p-3 mt-3 space-y-2 text-left">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>이메일 인증: 등록한 이메일로 발송된 인증 링크를 클릭해주세요.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">2.</span>
                  <span>관리자 승인: 관리자의 승인 후 로그인이 가능합니다.</span>
                </div>
              </div>
             <p>
             </p>
              <p className="text-xs text-muted-foreground mt-3">
                메일이 오지 않으면 스팸함을 확인하거나 관리자에게 문의해주세요.
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