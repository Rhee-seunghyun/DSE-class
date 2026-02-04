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

  // Create a large grid to cover rotated area (rotation increases needed coverage)
  const rows = 12;
  const cols = 8;

  return (
    <div className={`${className}`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Expanded container for 45-degree rotation coverage */}
        <div 
          className="absolute"
          style={{
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            transform: 'rotate(-45deg)',
            transformOrigin: 'center center',
          }}
        >
          <div 
            className="w-full h-full flex flex-col justify-center items-center"
            style={{ gap: '80px' }}
          >
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div 
                key={rowIndex} 
                className="flex justify-center items-center w-full"
                style={{ gap: '120px' }}
              >
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <div
                    key={colIndex}
                    className="whitespace-nowrap text-foreground/15 text-xs font-medium"
                  >
                    {watermarkText}
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
