import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShieldAlert } from 'lucide-react';

interface CaptureWarningDialogProps {
  open: boolean;
  onConfirm: () => void;
}

export function CaptureWarningDialog({
  open,
  onConfirm,
}: CaptureWarningDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl text-destructive">
            ⚠️ 경고
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            <p className="text-base font-medium text-foreground">
              무단 캡처/복제 시도가 감지되었습니다.
            </p>
            <p>
              본 강의자료의 무단 복제, 배포, 캡처는
              <br />
              <strong className="text-destructive">저작권법에 의해 법적 처벌</strong>을 받을 수 있습니다.
            </p>
            <p className="text-sm text-muted-foreground">
              모든 보안 위반 시도는 기록되며,
              <br />
              필요 시 법적 조치가 취해질 수 있습니다.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction 
            onClick={onConfirm} 
            className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
          >
            확인
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
