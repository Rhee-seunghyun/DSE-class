import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import doableLogo from '@/assets/doable-logo.png';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: '비밀번호 불일치',
        description: '비밀번호가 일치하지 않습니다.',
      });
      return;
    }

    setIsLoading(true);

    // Check if email is in whitelist
    const { data: whitelistEntry, error: whitelistError } = await supabase
      .from('whitelist')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (whitelistError || !whitelistEntry) {
      toast({
        variant: 'destructive',
        title: '가입 불가',
        description: '사전 등록된 이메일만 가입이 가능합니다. 관리자에게 문의해주세요.',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName, whitelistEntry.license_number || undefined);

    if (error) {
      toast({
        variant: 'destructive',
        title: '회원가입 실패',
        description: error.message || '회원가입 중 오류가 발생했습니다.',
      });
    } else {
      // Update whitelist to mark as registered
      await supabase
        .from('whitelist')
        .update({ is_registered: true })
        .eq('email', email.toLowerCase());

      toast({
        title: '회원가입 완료',
        description: '이메일 인증 후 로그인해주세요.',
      });
      navigate('/login');
    }

    setIsLoading(false);
  };

  return (
    <div className="h-screen overflow-hidden flex">
      {/* Left side - Signup Form */}
      <div className="w-1/2 flex flex-col justify-center px-16 xl:px-24" style={{ backgroundColor: '#ffffff' }}>
        <div className="w-full max-w-md">
          <h1 className="text-6xl font-light tracking-tight text-foreground mb-2" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Sign up
          </h1>
          <p className="text-foreground text-base mb-12">
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
      <div className="hidden lg:flex w-1/2 items-center justify-center" style={{ backgroundColor: '#f1f1f1' }}>
        <img
          src={doableLogo}
          alt="DoABLE"
          className="w-2/3 max-w-3xl h-auto"
          draggable={false}
        />
      </div>
    </div>
  );
}
