import { useAuth } from '@/hooks/useAuth';

interface DynamicWatermarkProps {
  className?: string;
}

export function DynamicWatermark({ className = '' }: DynamicWatermarkProps) {
  const { profile } = useAuth();

  if (!profile) return null;

  // Include name, email, and license number in watermark
  const watermarkText = [
    profile.full_name,
    profile.email,
    profile.license_number ? `면허번호: ${profile.license_number}` : '',
  ].filter(Boolean).join(' · ');

  // 5x5 grid for PDF area
  const rows = 5;
  const cols = 5;

  return (
    <div className={`${className}`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none flex items-center justify-center">
        <div 
          className="flex flex-col items-center justify-center"
          style={{ 
            transform: 'rotate(-45deg)',
            gap: '80px',
          }}
        >
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div 
              key={rowIndex} 
              className="flex items-center justify-center"
              style={{ gap: '80px' }}
            >
              {Array.from({ length: cols }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="whitespace-nowrap text-foreground/10 text-xs font-medium"
                >
                  {watermarkText}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
