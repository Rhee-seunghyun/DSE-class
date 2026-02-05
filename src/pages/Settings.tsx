 import { useState } from 'react';
 import { DashboardLayout } from '@/components/layout/DashboardLayout';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { useAuth } from '@/hooks/useAuth';
 import { useToast } from '@/hooks/use-toast';
 import { supabase } from '@/lib/supabase';
 import { User, Lock } from 'lucide-react';
 
 export default function Settings() {
   const { user, profile, refreshProfile } = useAuth();
   const { toast } = useToast();
   
   // Profile state
   const [fullName, setFullName] = useState(profile?.full_name || '');
   const [licenseNumber, setLicenseNumber] = useState(profile?.license_number || '');
   const [isProfileLoading, setIsProfileLoading] = useState(false);
   
   // Password state
   const [currentPassword, setCurrentPassword] = useState('');
   const [newPassword, setNewPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [isPasswordLoading, setIsPasswordLoading] = useState(false);
 
   const handleProfileUpdate = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return;
     
     setIsProfileLoading(true);
     
     const { error } = await supabase
       .from('profiles')
       .update({
         full_name: fullName,
         license_number: licenseNumber || null,
       })
       .eq('user_id', user.id);
     
     if (error) {
       toast({
         variant: 'destructive',
         title: '프로필 수정 실패',
         description: error.message,
       });
     } else {
       toast({
         title: '프로필이 수정되었습니다',
       });
       await refreshProfile();
     }
     
     setIsProfileLoading(false);
   };
 
   const handlePasswordChange = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (newPassword !== confirmPassword) {
       toast({
         variant: 'destructive',
         title: '비밀번호 불일치',
         description: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
       });
       return;
     }
     
     if (newPassword.length < 6) {
       toast({
         variant: 'destructive',
         title: '비밀번호 오류',
         description: '비밀번호는 최소 6자 이상이어야 합니다.',
       });
       return;
     }
     
     setIsPasswordLoading(true);
     
     const { error } = await supabase.auth.updateUser({
       password: newPassword,
     });
     
     if (error) {
       toast({
         variant: 'destructive',
         title: '비밀번호 변경 실패',
         description: error.message,
       });
     } else {
       toast({
         title: '비밀번호가 변경되었습니다',
       });
       setCurrentPassword('');
       setNewPassword('');
       setConfirmPassword('');
     }
     
     setIsPasswordLoading(false);
   };
 
   return (
     <DashboardLayout>
      <div className="max-w-2xl mx-auto sm:mx-0">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">설정</h1>
         
         <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
            <TabsTrigger value="profile" className="gap-2 text-xs sm:text-sm">
               <User className="w-4 h-4" />
              <span className="hidden sm:inline">프로필 관리</span>
              <span className="sm:hidden">프로필</span>
             </TabsTrigger>
            <TabsTrigger value="account" className="gap-2 text-xs sm:text-sm">
               <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">계정 관리</span>
              <span className="sm:hidden">계정</span>
             </TabsTrigger>
           </TabsList>
           
           <TabsContent value="profile">
             <Card>
               <CardHeader>
                 <CardTitle>프로필 정보</CardTitle>
                 <CardDescription>
                   이름과 면허번호를 수정할 수 있습니다.
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <form onSubmit={handleProfileUpdate} className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="email">이메일</Label>
                     <Input
                       id="email"
                       type="email"
                       value={profile?.email || ''}
                       disabled
                       className="bg-muted"
                     />
                     <p className="text-xs text-muted-foreground">
                       이메일은 변경할 수 없습니다.
                     </p>
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="fullName">이름</Label>
                     <Input
                       id="fullName"
                       type="text"
                       value={fullName}
                       onChange={(e) => setFullName(e.target.value)}
                       required
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="licenseNumber">면허번호</Label>
                     <Input
                       id="licenseNumber"
                       type="text"
                       value={licenseNumber}
                       onChange={(e) => setLicenseNumber(e.target.value)}
                       placeholder="면허번호를 입력하세요 (선택)"
                     />
                   </div>
                   
                   <Button 
                     type="submit" 
                     disabled={isProfileLoading}
                     className="w-full"
                   >
                     {isProfileLoading ? '저장 중...' : '프로필 저장'}
                   </Button>
                 </form>
               </CardContent>
             </Card>
           </TabsContent>
           
           <TabsContent value="account">
             <Card>
               <CardHeader>
                 <CardTitle>비밀번호 변경</CardTitle>
                 <CardDescription>
                   새로운 비밀번호를 설정합니다.
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <form onSubmit={handlePasswordChange} className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="newPassword">새 비밀번호</Label>
                     <Input
                       id="newPassword"
                       type="password"
                       value={newPassword}
                       onChange={(e) => setNewPassword(e.target.value)}
                       required
                       placeholder="최소 6자 이상"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                     <Input
                       id="confirmPassword"
                       type="password"
                       value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)}
                       required
                       placeholder="비밀번호를 다시 입력하세요"
                     />
                   </div>
                   
                   <Button 
                     type="submit" 
                     disabled={isPasswordLoading}
                     className="w-full"
                   >
                     {isPasswordLoading ? '변경 중...' : '비밀번호 변경'}
                   </Button>
                 </form>
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       </div>
     </DashboardLayout>
   );
 }