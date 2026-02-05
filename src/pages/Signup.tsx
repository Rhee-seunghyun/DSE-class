 import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import doableLogo from '@/assets/doable-logo.png';
import { EmailVerificationDialog } from '@/components/auth/EmailVerificationDialog';
 import { RoleSelectionDialog } from '@/components/auth/RoleSelectionDialog';
 import { PendingApprovalDialog } from '@/components/auth/PendingApprovalDialog';
 import { StudentApplicationGuideDialog } from '@/components/auth/StudentApplicationGuideDialog';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
   const [showRoleSelection, setShowRoleSelection] = useState(false);
   const [showPendingApproval, setShowPendingApproval] = useState(false);
   const [showStudentGuide, setShowStudentGuide] = useState(false);
   const [selectedRole, setSelectedRole] = useState<'staff' | 'speaker' | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

   const validateForm = () => {
     if (!fullName || !email || !licenseNumber || !password || !confirmPassword) {
      toast({
        variant: 'destructive',
         title: '입력 오류',
         description: '모든 필드를 입력해주세요.',
      });
       return false;
    }
    
     if (password !== confirmPassword) {
       toast({
         variant: 'destructive',
         title: '비밀번호 불일치',
         description: '비밀번호가 일치하지 않습니다.',
       });
       return false;
    }
     
     if (password.length < 6) {
       toast({
         variant: 'destructive',
         title: '비밀번호 오류',
         description: '비밀번호는 6자 이상이어야 합니다.',
       });
       return false;
     }
     
     return true;
   };

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!validateForm()) return;

     setIsLoading(true);

     // Master email bypasses whitelist check
     const MASTER_EMAIL = 'omsrheesh@gmail.com';
     const isMasterEmail = email.toLowerCase() === MASTER_EMAIL;
     
     if (isMasterEmail) {
       await proceedWithSignup(true);
       return;
     }
     
     // Check if email is in whitelist
      const { data: whitelistCheck, error: whitelistError } = await supabase
        .rpc('check_whitelist_email', { _email: email.toLowerCase() });
 
      if (!whitelistError && whitelistCheck && whitelistCheck.length > 0) {
       // Email is in whitelist - proceed with student signup
       await proceedWithSignup(false);
     } else {
       // Email not in whitelist - show role selection
       setIsLoading(false);
       setShowRoleSelection(true);
    }
   };
 
   const proceedWithSignup = async (isMasterEmail: boolean) => {
     const { error } = await signUp(email, password, fullName, licenseNumber || undefined);

     if (error) {
       toast({
         variant: 'destructive',
         title: '회원가입 실패',
         description: error.message || '회원가입 중 오류가 발생했습니다.',
       });
       setIsLoading(false);
       return;
     }
     
     // Update whitelist to mark as registered (only for whitelisted accounts)
     if (!isMasterEmail) {
       await supabase
         .from('whitelist')
         .update({ is_registered: true })
         .eq('email', email.toLowerCase());
     }
 
     // Show email verification dialog
     setShowVerificationDialog(true);
    setIsLoading(false);
  };
 
   const handleRoleSelect = async (role: 'student' | 'staff' | 'speaker') => {
     setShowRoleSelection(false);
     
     if (role === 'student') {
       // Student needs to apply through application form
       setShowStudentGuide(true);
       return;
     }
     
     // Staff or Speaker - proceed with signup (pending approval)
     setSelectedRole(role);
     setIsLoading(true);
     
     const { error } = await signUp(email, password, fullName, licenseNumber || undefined);
 
     if (error) {
       toast({
         variant: 'destructive',
         title: '회원가입 실패',
         description: error.message || '회원가입 중 오류가 발생했습니다.',
       });
       setIsLoading(false);
       return;
     }
     
     // Show pending approval dialog
     setShowPendingApproval(true);
     setIsLoading(false);
   };

  return (
    <div className="min-h-screen overflow-auto flex flex-col lg:flex-row">
      {/* Left side - Signup Form */}
      <div className="flex-1 lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-8 lg:py-0" style={{ backgroundColor: '#ffffff' }}>
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-foreground mb-2" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Sign up
          </h1>
          <p className="text-foreground text-base mb-6 lg:mb-12">
            사전 등록된 이메일로만 가입이 가능합니다
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="fullName" className="block text-base text-foreground mb-2">
                이름
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full h-12 px-4 bg-[#f0f0f0] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-base text-foreground mb-2">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 px-4 bg-[#f0f0f0] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="licenseNumber" className="block text-base text-foreground mb-2">
                면허번호
              </label>
              <input
                id="licenseNumber"
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                required
                className="w-full h-12 px-4 bg-[#f0f0f0] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-base text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-12 px-4 bg-[#f0f0f0] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-base text-foreground mb-2">
                Password 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-12 px-4 bg-[#f0f0f0] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            <div className="pt-8 space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-medium text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#E94560' }}
              >
                {isLoading ? '가입 중...' : 'Sign up'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full h-12 text-base font-medium border transition-opacity"
                style={{ borderColor: '#E94560', color: '#E94560', backgroundColor: 'transparent' }}
              >
                로그인으로 돌아가기
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Logo */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center min-h-screen" style={{ backgroundColor: '#f1f1f1' }}>
        <img
          src={doableLogo}
          alt="DoABLE"
          className="w-2/3 max-w-3xl h-auto"
          draggable={false}
        />
      </div>

      {/* Email Verification Dialog */}
      <EmailVerificationDialog
        open={showVerificationDialog}
        email={email}
        onConfirm={() => {
          setShowVerificationDialog(false);
          navigate('/login');
        }}
      />
       
       <RoleSelectionDialog
         open={showRoleSelection}
         onSelect={handleRoleSelect}
         onClose={() => setShowRoleSelection(false)}
       />
       
       {selectedRole && (
         <PendingApprovalDialog
           open={showPendingApproval}
           role={selectedRole}
           onConfirm={() => {
             setShowPendingApproval(false);
             navigate('/login');
           }}
         />
       )}
       
       <StudentApplicationGuideDialog
         open={showStudentGuide}
         onConfirm={() => {
           setShowStudentGuide(false);
           navigate('/login');
         }}
       />
    </div>
  );
}
