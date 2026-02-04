import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { logSecurityEvent } from '@/lib/supabase';

interface UseCaptureProtectionOptions {
  lectureId?: string;
  lectureTitle?: string;
  enabled?: boolean;
}

interface UseCaptureProtectionReturn {
  logAttempt: (eventType: string) => Promise<void>;
  showWarningDialog: boolean;
  dismissWarningDialog: () => void;
}

export function useCaptureProtection({
  lectureId,
  lectureTitle,
  enabled = true,
}: UseCaptureProtectionOptions = {}): UseCaptureProtectionReturn {
  const { user, profile } = useAuth();
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  const dismissWarningDialog = useCallback(() => {
    setShowWarningDialog(false);
  }, []);

  const logAttempt = useCallback(async (eventType: string) => {
    await logSecurityEvent(
      user?.id || null,
      lectureId || null,
      eventType,
      lectureTitle,
      profile?.email
    );
    setShowWarningDialog(true);
  }, [user?.id, lectureId, lectureTitle, profile?.email]);

  useEffect(() => {
    if (!enabled) return;

    // Prevent PrintScreen key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        logAttempt('printscreen_key');
      }
      
      // Prevent common screenshot shortcuts
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        logAttempt('screenshot_shortcut');
      }
      
      // Prevent Cmd+Shift+3, Cmd+Shift+4 (Mac screenshot)
      if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
        e.preventDefault();
        logAttempt('mac_screenshot');
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logAttempt('context_menu');
    };

    // Attempt to detect visibility changes (might indicate screenshot)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User might be taking screenshot via OS
        logAttempt('visibility_hidden');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Disable text selection and dragging on protected content
    const style = document.createElement('style');
    style.id = 'capture-protection-styles';
    style.textContent = `
      .protected-content {
        user-select: none !important;
        -webkit-user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      .protected-content img {
        pointer-events: none !important;
        -webkit-user-drag: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      const protectionStyle = document.getElementById('capture-protection-styles');
      if (protectionStyle) {
        protectionStyle.remove();
      }
    };
  }, [enabled, logAttempt]);

  return { logAttempt, showWarningDialog, dismissWarningDialog };
}
