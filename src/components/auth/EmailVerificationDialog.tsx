import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Mail, Clock } from 'lucide-react';

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
          <div className="flex justify-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Clock className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            가입 신청이 완료되었습니다
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            <p className="font-medium text-foreground">
              로그인을 위해 아래 두 가지 조건이 필요합니다:
            </p>
            <div className="bg-muted/50 rounded-lg p-3 mt-3 space-y-2 text-left">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>이메일 인증: <strong>{email}</strong> 주소로 발송된 인증 메일에서 링크를 클릭해주세요.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">2.</span>
                <span>관리자 승인: 관리자의 승인 후 로그인이 가능합니다.</span>
              </div>
            </div>
            <p>
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              메일이 오지 않으면 스팸함을 확인하거나 관리자에게 문의해주세요.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={onConfirm} className="w-full sm:w-auto" style={{ backgroundColor: '#E94560' }}>
            로그인 화면으로 이동
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
