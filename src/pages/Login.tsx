import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import doableLogo from '@/assets/doable-logo.png';
import { FindIdDialog } from '@/components/auth/FindIdDialog';
import { FindPasswordDialog } from '@/components/auth/FindPasswordDialog';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFindId, setShowFindId] = useState(false);
  const [showFindPassword, setShowFindPassword] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        variant: 'destructive',
        title: '로그인 실패',
        description: '이메일 또는 비밀번호를 확인해주세요.',
      });
    } else {
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen overflow-hidden flex flex-col lg:flex-row">
      {/* Left side - Login Form */}
      <div className="flex-1 lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-8 lg:py-0" style={{ backgroundColor: '#ffffff' }}>
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-foreground mb-2" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Welcome
          </h1>
          <p className="text-foreground text-base mb-8 lg:mb-16">
            Please enter your details
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
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
              <label htmlFor="password" className="block text-base text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 px-4 bg-[#f0f0f0] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-4 text-sm">
              <button
                type="button"
                onClick={() => setShowFindId(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                아이디 찾기
              </button>
              <button
                type="button"
                onClick={() => setShowFindPassword(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                비밀번호 찾기
              </button>
            </div>

            <div className="pt-8 space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-medium text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#E94560' }}
              >
                {isLoading ? '로그인 중...' : 'Sign in'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="w-full h-12 text-base font-medium border transition-opacity"
                style={{ borderColor: '#E94560', color: '#E94560', backgroundColor: 'transparent' }}
              >
                Sign up
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Logo */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center" style={{ backgroundColor: '#f1f1f1' }}>
        <img
          src={doableLogo}
          alt="DoABLE"
          className="w-2/3 max-w-3xl h-auto"
          draggable={false}
        />
      </div>

      <FindIdDialog open={showFindId} onOpenChange={setShowFindId} />
      <FindPasswordDialog open={showFindPassword} onOpenChange={setShowFindPassword} />
    </div>
  );
}
