 import { useState } from 'react';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { useToast } from '@/hooks/use-toast';
 import { supabase } from '@/lib/supabase';
 
 interface FindPasswordDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function FindPasswordDialog({ open, onOpenChange }: FindPasswordDialogProps) {
   const [email, setEmail] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [isSent, setIsSent] = useState(false);
   const { toast } = useToast();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsLoading(true);
 
     const { error } = await supabase.auth.resetPasswordForEmail(email, {
       redirectTo: `${window.location.origin}/login`,
     });
 
     if (error) {
       toast({
         variant: 'destructive',
         title: '오류',
         description: '비밀번호 재설정 이메일을 보내는데 실패했습니다.',
       });
     } else {
       setIsSent(true);
       toast({
         title: '이메일 전송 완료',
         description: '비밀번호 재설정 링크가 이메일로 전송되었습니다.',
       });
     }
 
     setIsLoading(false);
   };
 
   const handleClose = (open: boolean) => {
     if (!open) {
       setEmail('');
       setIsSent(false);
     }
     onOpenChange(open);
   };
 
   return (
     <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>비밀번호 찾기</DialogTitle>
         </DialogHeader>
         
         {isSent ? (
           <div className="space-y-4 py-4">
             <p className="text-sm text-muted-foreground">
               비밀번호 재설정 링크가 <strong>{email}</strong>로 전송되었습니다.
               이메일을 확인해주세요.
             </p>
             <Button 
               onClick={() => handleClose(false)} 
               className="w-full"
               style={{ backgroundColor: '#E94560' }}
             >
               확인
             </Button>
           </div>
         ) : (
           <form onSubmit={handleSubmit} className="space-y-4 py-4">
             <div className="space-y-2">
               <Label htmlFor="reset-email">이메일</Label>
               <Input
                 id="reset-email"
                 type="email"
                 placeholder="가입한 이메일을 입력하세요"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
                 className="bg-[#f0f0f0] border-0"
               />
             </div>
             <p className="text-xs text-muted-foreground">
               가입 시 사용한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
             </p>
             <Button 
               type="submit" 
               disabled={isLoading}
               className="w-full"
               style={{ backgroundColor: '#E94560' }}
             >
               {isLoading ? '전송 중...' : '재설정 링크 보내기'}
             </Button>
           </form>
         )}
       </DialogContent>
     </Dialog>
   );
 }