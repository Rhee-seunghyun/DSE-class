import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import doableLogo from '@/assets/doable-logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="h-screen overflow-hidden flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-16 xl:px-24" style={{ backgroundColor: '#ffffff' }}>
        <div className="w-full max-w-md">
          <h1 className="text-6xl font-light tracking-tight text-foreground mb-2" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Welcome
          </h1>
          <p className="text-foreground text-base mb-16">
            Please enter your details
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-8 text-base font-medium text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#E94560' }}
            >
              {isLoading ? '로그인 중...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>

      {/* Right side - Logo */}
      <div className="hidden lg:flex flex-1 items-center justify-center" style={{ backgroundColor: '#f1f1f1' }}>
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
