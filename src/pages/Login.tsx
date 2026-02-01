import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-16 xl:px-24 bg-white">
        <div className="w-full max-w-md">
          <h1 className="text-5xl font-light tracking-tight text-foreground mb-1" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Welcome
          </h1>
          <p className="text-foreground text-base mb-12">
            Please enter your details
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
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
                className="w-full border-0 border-b border-gray-300 bg-transparent py-2 text-foreground focus:border-primary focus:outline-none focus:ring-0"
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
                className="w-full border-0 border-b border-gray-300 bg-transparent py-2 text-foreground focus:border-primary focus:outline-none focus:ring-0"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-medium text-white rounded-md transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#E94560' }}
            >
              {isLoading ? '로그인 중...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>

      {/* Right side - Logo */}
      <div className="hidden lg:flex flex-1 items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <h1 className="text-6xl font-bold tracking-tight">
            <span className="text-foreground">Do</span>
            <span style={{ color: '#E94560' }}>ABLE</span>
          </h1>
          <p className="text-lg font-semibold tracking-[0.3em] mt-2" style={{ color: '#E94560' }}>
            DENTAL SEDATION COURSE
          </p>
        </div>
      </div>
    </div>
  );
}
