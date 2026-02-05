 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { FileText } from 'lucide-react';
 
 interface StudentApplicationGuideDialogProps {
   open: boolean;
   onConfirm: () => void;
 }
 
 export function StudentApplicationGuideDialog({ open, onConfirm }: StudentApplicationGuideDialogProps) {
   return (
     <Dialog open={open}>
       <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
         <DialogHeader>
           <div className="flex justify-center mb-4">
             <div className="p-3 rounded-full bg-primary/10">
               <FileText className="h-8 w-8 text-primary" />
             </div>
           </div>
           <DialogTitle className="text-center">신청서 작성 필요</DialogTitle>
           <DialogDescription className="text-center space-y-2">
             <p>
               수강생으로 가입하시려면 먼저 세미나 신청서를 작성해야 합니다.
             </p>
             <p className="text-sm text-muted-foreground mt-4">
               세미나 신청서 링크를 통해 신청서를 작성하시면, 
               승인 후 가입이 가능합니다.
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