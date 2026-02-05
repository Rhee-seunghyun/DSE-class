 import { Button } from '@/components/ui/button';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Pencil, Trash2, Eye, Mail, Phone, MessageSquare } from 'lucide-react';
 import { StudentData } from './StudentTable';
 import { StatusMultiSelect } from './StatusMultiSelect';
 import { maskEmail, maskLicenseNumber, maskPhoneNumber } from '@/lib/dataMasking';
 
 interface StudentCardProps {
   student: StudentData;
   rowNumber: number;
   onEdit: (student: StudentData) => void;
   onDelete: (studentId: string) => void;
   onViewDetail: (student: StudentData) => void;
   onApprovalClick: (student: StudentData) => void;
   onStatusChange: (studentId: string, field: string, value: boolean) => void;
   onMemoClick: (student: StudentData) => void;
 }
 
 const getStatusStyle = (isNew: boolean, isRegistered: boolean) => {
   if (isNew && isRegistered) {
     return 'bg-foreground text-background';
   } else if (isNew && !isRegistered) {
     return 'bg-muted-foreground text-background';
   } else if (!isNew && isRegistered) {
     return 'bg-muted text-foreground';
   } else {
     return 'bg-muted/50 text-muted-foreground';
   }
 };
 
 const getStatusLabel = (isNew: boolean, isRegistered: boolean) => {
   const prefix = isNew ? '신규' : '재수강';
   const suffix = isRegistered ? '승인' : '대기';
   return `${prefix} · ${suffix}`;
 };
 
 export function StudentCard({
   student,
   rowNumber,
   onEdit,
   onDelete,
   onViewDetail,
   onApprovalClick,
   onStatusChange,
   onMemoClick,
 }: StudentCardProps) {
   const isNew = student.is_new_student !== false;
   const isRegistered = student.is_registered || false;
 
   return (
     <Card className="mb-3">
       <CardContent className="p-4">
         {/* Header: Number, Name, Status */}
         <div className="flex items-center justify-between mb-3">
           <div className="flex items-center gap-2">
             <span className="text-xs text-muted-foreground font-medium">#{rowNumber}</span>
             <span className="font-medium">{student.student_name || '-'}</span>
           </div>
           <Button
             variant="ghost"
             size="sm"
             className={`h-7 px-2 text-xs rounded ${getStatusStyle(isNew, isRegistered)}`}
             onClick={() => onApprovalClick(student)}
           >
             {getStatusLabel(isNew, isRegistered)}
           </Button>
         </div>
 
         {/* Info Grid */}
         <div className="grid grid-cols-2 gap-2 text-sm mb-3">
           <div className="flex items-center gap-1 text-muted-foreground">
             <Mail className="w-3 h-3" />
             <span className="truncate text-xs">{maskEmail(student.email)}</span>
           </div>
           <div className="flex items-center gap-1 text-muted-foreground">
             <Phone className="w-3 h-3" />
             <span className="truncate text-xs">{maskPhoneNumber(student.phone_number) || '-'}</span>
           </div>
           <div className="text-muted-foreground">
             <span className="text-xs">면허: {maskLicenseNumber(student.license_number) || '-'}</span>
           </div>
         </div>
 
         {/* Status and Actions */}
         <div className="flex items-center justify-between pt-2 border-t">
           <StatusMultiSelect
             paymentConfirmed={student.payment_confirmed}
             businessRegistration={student.business_registration}
             invoiceIssued={student.invoice_issued}
             surveyCompleted={student.survey_completed}
             certificateSent={student.certificate_sent}
             onStatusChange={(field, value) => onStatusChange(student.id, field, value)}
           />
           <div className="flex gap-1">
             <Button
               variant="ghost"
               size="icon"
               className={`h-8 w-8 ${student.admin_memo ? 'text-primary' : 'text-muted-foreground'}`}
               onClick={() => onMemoClick(student)}
             >
               <MessageSquare className="w-4 h-4" />
             </Button>
             <Button
               variant="ghost"
               size="icon"
               className="h-8 w-8"
               onClick={() => onViewDetail(student)}
             >
               <Eye className="w-4 h-4" />
             </Button>
             <Button
               variant="ghost"
               size="icon"
               className="h-8 w-8"
               onClick={() => onEdit(student)}
             >
               <Pencil className="w-4 h-4" />
             </Button>
             <Button
               variant="ghost"
               size="icon"
               className="h-8 w-8 text-destructive"
               onClick={() => onDelete(student.id)}
             >
               <Trash2 className="w-4 h-4" />
             </Button>
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }