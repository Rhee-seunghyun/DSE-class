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
 
 interface FindIdDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export function FindIdDialog({ open, onOpenChange }: FindIdDialogProps) {
   const [fullName, setFullName] = useState('');
   const [licenseNumber, setLicenseNumber] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [foundEmail, setFoundEmail] = useState<string | null>(null);
   const { toast } = useToast();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsLoading(true);
 
     const { data, error } = await supabase
       .from('profiles')
       .select('email')
       .eq('full_name', fullName)
       .eq('license_number', licenseNumber)
       .single();
 
     if (error || !data) {
       toast({
         variant: 'destructive',
         title: '조회 실패',
         description: '일치하는 계정을 찾을 수 없습니다. 이름과 면허번호를 확인해주세요.',
       });
       setFoundEmail(null);
     } else {
       // Mask the email for privacy
       const email = data.email;
       const [localPart, domain] = email.split('@');
       const maskedLocal = localPart.length > 3 
         ? localPart.slice(0, 3) + '*'.repeat(Math.min(localPart.length - 3, 5))
         : localPart;
       setFoundEmail(`${maskedLocal}@${domain}`);
     }
 
     setIsLoading(false);
   };
 
   const handleClose = (open: boolean) => {
     if (!open) {
       setFullName('');
       setLicenseNumber('');
       setFoundEmail(null);
     }
     onOpenChange(open);
   };
 
   return (
     <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>아이디 찾기</DialogTitle>
         </DialogHeader>
         
         {foundEmail ? (
           <div className="space-y-4 py-4">
             <p className="text-sm text-muted-foreground">
               회원님의 아이디(이메일)는 다음과 같습니다:
             </p>
             <p className="text-lg font-medium text-center py-2 bg-muted rounded">
               {foundEmail}
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
               <Label htmlFor="find-name">이름</Label>
               <Input
                 id="find-name"
                 type="text"
                 placeholder="이름을 입력하세요"
                 value={fullName}
                 onChange={(e) => setFullName(e.target.value)}
                 required
                 className="bg-[#f0f0f0] border-0"
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="find-license">면허번호</Label>
               <Input
                 id="find-license"
                 type="text"
                 placeholder="면허번호를 입력하세요"
                 value={licenseNumber}
                 onChange={(e) => setLicenseNumber(e.target.value)}
                 required
                 className="bg-[#f0f0f0] border-0"
               />
             </div>
             <p className="text-xs text-muted-foreground">
               가입 시 등록한 이름과 면허번호를 입력하시면 아이디(이메일)를 찾을 수 있습니다.
             </p>
             <Button 
               type="submit" 
               disabled={isLoading}
               className="w-full"
               style={{ backgroundColor: '#E94560' }}
             >
               {isLoading ? '조회 중...' : '아이디 찾기'}
             </Button>
           </form>
         )}
       </DialogContent>
     </Dialog>
   );
 }