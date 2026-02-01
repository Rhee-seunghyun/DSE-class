interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-sm',
    lg: 'text-lg',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <h1 className={`font-bold tracking-tight ${sizeClasses[size]}`}>
        <span className="text-foreground">Do</span>
        <span className="text-primary">ABLE</span>
      </h1>
      <p className={`font-medium tracking-[0.2em] text-primary uppercase ${subtitleSizes[size]}`}>
        Dental Sedation Course
      </p>
    </div>
  );
}
