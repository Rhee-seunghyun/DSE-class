import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Mail } from 'lucide-react';

interface EmailVerificationDialogProps {
  open: boolean;
  onConfirm: () => void;
  email: string;
}

export function EmailVerificationDialog({
  open,
  onConfirm,
  email,
}: EmailVerificationDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            이메일 인증을 완료해주세요
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            <p>
              <strong>{email}</strong> 주소로 인증 메일이 발송되었습니다.
            </p>
            <p>
              이메일에서 인증 링크를 클릭한 후 로그인해주세요.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              메일이 오지 않으면 스팸함을 확인하거나 관리자에게 문의해주세요.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={onConfirm} className="w-full sm:w-auto">
            로그인 화면으로 이동
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
