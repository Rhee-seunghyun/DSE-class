import { useAuth } from '@/hooks/useAuth';

interface DynamicWatermarkProps {
  className?: string;
}

export function DynamicWatermark({ className = '' }: DynamicWatermarkProps) {
  const { profile } = useAuth();

  if (!profile) return null;

  // Include name, email, and license number in watermark
  const watermarkLines = [
    profile.full_name,
    profile.email,
    profile.license_number ? `면허번호: ${profile.license_number}` : '',
  ].filter(Boolean);

  return (
    <div className={`watermark ${className}`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: 'rotate(-45deg)',
          }}
        >
          <div className="flex flex-col gap-32">
            {Array.from({ length: 7 }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex gap-24">
                {Array.from({ length: 5 }).map((_, colIndex) => (
                  <div
                    key={colIndex}
                    className="whitespace-nowrap text-foreground/10 text-sm md:text-base font-medium"
                  >
                    {watermarkLines.map((line, lineIndex) => (
                      <div key={lineIndex}>{line}</div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
