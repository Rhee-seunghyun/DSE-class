import { useAuth } from '@/hooks/useAuth';

interface DynamicWatermarkProps {
  className?: string;
}

export function DynamicWatermark({ className = '' }: DynamicWatermarkProps) {
  const { profile } = useAuth();

  if (!profile) return null;

  const watermarkText = `${profile.full_name} ${profile.license_number || ''}`.trim();

  return (
    <div className={`watermark ${className}`}>
      <div className="flex flex-col items-center gap-2 opacity-10">
        {/* Multiple watermark lines for better coverage */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="whitespace-nowrap text-lg md:text-2xl font-semibold">
            {watermarkText}
          </div>
        ))}
      </div>
    </div>
  );
}
