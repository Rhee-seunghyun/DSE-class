import { useState, useMemo, useCallback, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  Pencil, 
  Trash2,
  X,
  Mail,
  Phone,
  GripVertical,
  Eye,
   MessageSquare,
   Download,
   Lock
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusMultiSelect } from './StatusMultiSelect';
import { ApplicationDetailDialog } from './ApplicationDetailDialog';
import { maskEmail, maskLicenseNumber, maskPhoneNumber } from '@/lib/dataMasking';
 import * as XLSX from 'xlsx';
 import { useIsMobile } from '@/hooks/use-mobile';
 import { StudentCard } from './StudentCard';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';

export interface StudentData {
  id: string;
  student_name: string | null;
  license_number: string | null;
  email: string;
  phone_number: string | null;
  payment_confirmed: boolean;
  business_registration: boolean;
  invoice_issued: boolean;
  survey_completed: boolean;
  certificate_sent: boolean;
  is_new_student?: boolean;
  is_registered?: boolean;
  form_response_id?: string | null;
  admin_memo?: string | null;
  created_at?: string;
}

interface StudentTableProps {
  students: StudentData[];
  lectureId?: string;
  onEdit: (student: StudentData) => void;
  onDelete: (studentId: string) => void;
  onCheckboxChange: (studentId: string, field: keyof StudentData, value: boolean) => void;
  onMemoChange?: (studentId: string, memo: string) => void;
}

type SortDirection = 'asc' | 'desc' | null;
type SortField = keyof StudentData | null;

interface ColumnFilter {
  [key: string]: string[];
}

interface ColumnWidths {
  [key: string]: number;
}

const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  rowNumber: 48,
  isNew: 48,
  is_registered: 80,
  student_name: 80,
  license_number: 80,
  email: 140,
  phone_number: 120,
  status_flags: 64,
  admin_memo: 80,
  actions: 100,
};

// 신/재 + 승인/대기 상태에 따른 색상 (모노톤)
const getStatusStyle = (isNew: boolean, isRegistered: boolean) => {
  if (isNew && isRegistered) {
    // 신-승인: 가장 진한 색
    return 'bg-foreground text-background font-semibold';
  } else if (isNew && !isRegistered) {
    // 신-대기: 중간 진한 색
    return 'bg-muted-foreground text-background';
  } else if (!isNew && isRegistered) {
    // 재-승인: 연한 색
    return 'bg-muted text-foreground';
  } else {
    // 재-대기: 가장 연한 색
    return 'bg-muted/50 text-muted-foreground';
  }
};

const getStatusLabel = (isNew: boolean, isRegistered: boolean) => {
  const prefix = isNew ? '신' : '재';
  const suffix = isRegistered ? '승인' : '대기';
  return `${prefix}-${suffix}`;
};

export function StudentTable({ students, lectureId, onEdit, onDelete, onCheckboxChange, onMemoChange }: StudentTableProps) {
   const isMobile = useIsMobile();
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filters, setFilters] = useState<ColumnFilter>({});
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(DEFAULT_COLUMN_WIDTHS);
  const resizingRef = useRef<{ column: string; startX: number; startWidth: number } | null>(null);
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentData | null>(null);
  const [approvalDialogStudent, setApprovalDialogStudent] = useState<StudentData | null>(null);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoValue, setMemoValue] = useState('');

  const handleSort = (field: keyof StudentData) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterToggle = (column: string, value: string) => {
    setFilters(prev => {
      const currentValues = prev[column] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      if (newValues.length === 0) {
        const newFilters = { ...prev };
        delete newFilters[column];
        return newFilters;
      }
      
      return { ...prev, [column]: newValues };
    });
  };

  const clearFilter = (column: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  const handleResizeStart = useCallback((column: string, e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = {
      column,
      startX: e.clientX,
      startWidth: columnWidths[column] || 80,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = e.clientX - resizingRef.current.startX;
      const newWidth = Math.max(40, resizingRef.current.startWidth + diff);
      setColumnWidths(prev => ({
        ...prev,
        [resizingRef.current!.column]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths]);

  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    // Apply filters
    Object.entries(filters).forEach(([column, filterValues]) => {
      if (filterValues && filterValues.length > 0) {
        if (column === 'status_flags') {
          // Special handling for status_flags - filter students that have ALL selected statuses as true
          result = result.filter(student => {
            return filterValues.every(statusField => {
              return student[statusField as keyof StudentData] === true;
            });
          });
        } else {
          result = result.filter(student => {
            const value = student[column as keyof StudentData];
            if (value === null || value === undefined) return false;
            return filterValues.includes(String(value));
          });
        }
      }
    });

    // Apply sorting
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal, 'ko');
        } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          comparison = (aVal === bVal) ? 0 : aVal ? -1 : 1;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [students, filters, sortField, sortDirection]);

  // Calculate row numbers based on created_at timestamp
  const getRowNumber = useMemo(() => {
    const sortedByCreatedAt = [...students].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return aTime - bTime;
    });
    
    const rowNumberMap = new Map<string, number>();
    sortedByCreatedAt.forEach((student, index) => {
      rowNumberMap.set(student.id, index + 1);
    });
    
    return (studentId: string) => rowNumberMap.get(studentId) || 0;
  }, [students]);

  // Get unique filter options from data
  const getFilterOptions = (column: string): { value: string; label: string }[] => {
    const uniqueValues = new Set<string>();
    students.forEach(student => {
      const value = student[column as keyof StudentData];
      if (value !== null && value !== undefined) {
        uniqueValues.add(String(value));
      }
    });
    
    if (column === 'is_new_student') {
      return [
        { value: 'true', label: '신규' },
        { value: 'false', label: '재수강' }
      ];
    }
    if (column === 'is_registered') {
      return [
        { value: 'true', label: '승인' },
        { value: 'false', label: '대기' }
      ];
    }
    if (column === 'status_flags') {
      return [
        { value: 'payment_confirmed', label: '입금' },
        { value: 'business_registration', label: '사업자' },
        { value: 'invoice_issued', label: '계산서' },
        { value: 'survey_completed', label: '설문' },
        { value: 'certificate_sent', label: '수료증' }
      ];
    }
    
    return Array.from(uniqueValues).map(v => ({ value: v, label: v }));
  };

  const ResizeHandle = ({ column }: { column: string }) => (
    <div
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize group flex items-center justify-center hover:bg-primary/30"
      onMouseDown={(e) => handleResizeStart(column, e)}
    >
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>
    </div>
  );

  const getSortIcon = (field: keyof StudentData) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-3 h-3" /> : 
      <ArrowDown className="w-3 h-3" />;
  };

  const renderColumnHeader = (field: keyof StudentData, label: React.ReactNode, sortable = true) => {
    return (
      <div className="flex items-center gap-1 pr-2">
        <span className="text-xs truncate">{label}</span>
        <div className="flex items-center shrink-0">
          {sortable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleSort(field)}
            >
              {getSortIcon(field)}
            </Button>
          )}
        </div>
        <ResizeHandle column={field} />
      </div>
    );
  };

  const renderFilterHeader = (field: string, label: string) => {
    const hasFilter = filters[field] && filters[field].length > 0;
    const options = getFilterOptions(field);
    
    return (
      <div className="flex items-center gap-1 pr-2">
        <span className="text-xs truncate">{label}</span>
        <Popover open={activeFilterColumn === field} onOpenChange={(open) => setActiveFilterColumn(open ? field : null)}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 shrink-0 ${hasFilter ? 'text-primary' : ''}`}
            >
              <Filter className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-2">
              {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field}-${option.value}`}
                    checked={(filters[field] || []).includes(option.value)}
                    onCheckedChange={() => handleFilterToggle(field, option.value)}
                  />
                  <label
                    htmlFor={`${field}-${option.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
              {hasFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => clearFilter(field)}
                >
                  <X className="w-3 h-3 mr-1" />
                  필터 초기화
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <ResizeHandle column={field} />
      </div>
    );
  };


  const handleStatusChange = (studentId: string, field: string, value: boolean) => {
    onCheckboxChange(studentId, field as keyof StudentData, value);
  };

  const handleApprovalClick = (student: StudentData) => {
    setApprovalDialogStudent(student);
  };

  const handleApprovalConfirm = (approve: boolean) => {
    if (approvalDialogStudent) {
      onCheckboxChange(approvalDialogStudent.id, 'is_registered', approve);
      setApprovalDialogStudent(null);
    }
  };

  const handleMemoClick = (student: StudentData) => {
    setEditingMemoId(student.id);
    setMemoValue(student.admin_memo || '');
  };

  const handleMemoSave = (studentId: string) => {
    if (onMemoChange) {
      onMemoChange(studentId, memoValue);
    }
    setEditingMemoId(null);
    setMemoValue('');
  };
 
   const handleExcelDownload = () => {
     const excelData = filteredAndSortedStudents.map((student) => ({
       'No': getRowNumber(student.id),
       '신/재': student.is_new_student !== false ? '신규' : '재수강',
       '승인': student.is_registered ? '승인' : '대기',
       '이름': student.student_name || '',
       '면허번호': student.license_number || '',
       '이메일': student.email,
       '연락처': student.phone_number || '',
       '입금': student.payment_confirmed ? 'O' : '',
       '사업자': student.business_registration ? 'O' : '',
       '계산서': student.invoice_issued ? 'O' : '',
       '설문': student.survey_completed ? 'O' : '',
       '수료증': student.certificate_sent ? 'O' : '',
       '메모': student.admin_memo || '',
     }));
 
     const worksheet = XLSX.utils.json_to_sheet(excelData);
     const workbook = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(workbook, worksheet, '수강생 목록');
 
     const colWidths = Object.keys(excelData[0] || {}).map(key => ({
       wch: Math.max(key.length * 2, 10)
     }));
     worksheet['!cols'] = colWidths;
 
     const fileName = `수강생목록_${new Date().toISOString().split('T')[0]}.xlsx`;
     XLSX.writeFile(workbook, fileName);
   };

  return (
    <>
       {isMobile ? (
         /* Mobile Card View */
         <div className="space-y-2">
           {filteredAndSortedStudents.length > 0 ? (
             filteredAndSortedStudents.map((student) => (
               <StudentCard
                 key={student.id}
                 student={student}
                 rowNumber={getRowNumber(student.id)}
                 onEdit={onEdit}
                 onDelete={onDelete}
                 onViewDetail={setSelectedStudentForDetail}
                 onApprovalClick={handleApprovalClick}
                 onStatusChange={handleStatusChange}
                 onMemoClick={handleMemoClick}
               />
             ))
           ) : (
             <div className="text-center text-muted-foreground py-8">
               등록된 수강생이 없습니다.
             </div>
           )}
         </div>
       ) : (
         /* Desktop Table View */
      <ScrollArea className="w-full">
        <div className="min-w-max">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: columnWidths.rowNumber }} className="text-xs text-center relative">
                  {renderColumnHeader('created_at' as keyof StudentData, 'No', true)}
                </TableHead>
                <TableHead style={{ width: columnWidths.isNew }} className="text-xs text-center relative">
                  {renderFilterHeader('is_new_student', '신/재')}
                </TableHead>
                <TableHead style={{ width: columnWidths.is_registered }} className="text-center relative">
                  {renderFilterHeader('is_registered', '승인')}
                </TableHead>
                <TableHead style={{ width: columnWidths.student_name }} className="relative">
                  {renderColumnHeader('student_name', '이름', true)}
                </TableHead>
                <TableHead style={{ width: columnWidths.license_number }} className="relative">
                  {renderColumnHeader('license_number', '면허', true)}
                </TableHead>
                <TableHead style={{ width: columnWidths.email }} className="relative">
                  {renderColumnHeader('email', <Mail className="w-4 h-4" />, false)}
                </TableHead>
                <TableHead style={{ width: columnWidths.phone_number }} className="relative">
                  {renderColumnHeader('phone_number', <Phone className="w-4 h-4" />, false)}
                </TableHead>
                <TableHead style={{ width: columnWidths.status_flags }} className="text-center relative">
                  {renderFilterHeader('status_flags', '관리')}
                </TableHead>
                <TableHead style={{ width: columnWidths.admin_memo }} className="text-center relative">
                  <div className="flex items-center justify-center pr-2">
                    <span className="text-xs">메모</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleSort('admin_memo' as keyof StudentData)}
                    >
                      {getSortIcon('admin_memo' as keyof StudentData)}
                    </Button>
                    <ResizeHandle column="admin_memo" />
                  </div>
                </TableHead>
                <TableHead style={{ width: columnWidths.actions }} className="relative">
                  <ResizeHandle column="actions" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedStudents.length > 0 ? (
                filteredAndSortedStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell style={{ width: columnWidths.rowNumber }} className="text-xs text-center font-medium text-muted-foreground">
                      {getRowNumber(student.id)}
                    </TableCell>
                    <TableCell style={{ width: columnWidths.isNew }} className="text-xs text-center font-medium">
                      <span className={student.is_new_student !== false ? 'text-primary' : 'text-muted-foreground'}>
                        {student.is_new_student !== false ? '신' : '재'}
                      </span>
                    </TableCell>
                    <TableCell style={{ width: columnWidths.is_registered }} className="text-center p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-xs rounded ${getStatusStyle(student.is_new_student !== false, student.is_registered || false)}`}
                        onClick={() => handleApprovalClick(student)}
                      >
                        {getStatusLabel(student.is_new_student !== false, student.is_registered || false)}
                      </Button>
                    </TableCell>
                    <TableCell style={{ width: columnWidths.student_name }} className="text-sm truncate">{student.student_name || '-'}</TableCell>
                    <TableCell style={{ width: columnWidths.license_number }} className="text-sm truncate" title="상세보기에서 전체 정보 확인">{maskLicenseNumber(student.license_number) || '-'}</TableCell>
                    <TableCell style={{ width: columnWidths.email }} className="text-sm truncate" title="상세보기에서 전체 정보 확인">{maskEmail(student.email) || '-'}</TableCell>
                    <TableCell style={{ width: columnWidths.phone_number }} className="text-sm truncate" title="상세보기에서 전체 정보 확인">{maskPhoneNumber(student.phone_number) || '-'}</TableCell>
                    <TableCell style={{ width: columnWidths.status_flags }} className="text-center">
                      <StatusMultiSelect
                        paymentConfirmed={student.payment_confirmed}
                        businessRegistration={student.business_registration}
                        invoiceIssued={student.invoice_issued}
                        surveyCompleted={student.survey_completed}
                        certificateSent={student.certificate_sent}
                        onStatusChange={(field, value) => handleStatusChange(student.id, field, value)}
                      />
                    </TableCell>
                    <TableCell style={{ width: columnWidths.admin_memo }} className="text-center">
                      <Popover 
                        open={editingMemoId === student.id} 
                        onOpenChange={(open) => {
                          if (open) {
                            handleMemoClick(student);
                          } else {
                            setEditingMemoId(null);
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 ${student.admin_memo ? 'text-primary' : 'text-muted-foreground'}`}
                            title={student.admin_memo || '메모 추가'}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3" align="start">
                          <div className="space-y-2">
                            <Textarea
                              placeholder="특이사항을 입력하세요..."
                              value={memoValue}
                              onChange={(e) => setMemoValue(e.target.value)}
                              className="min-h-[80px] text-sm"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingMemoId(null)}
                              >
                                취소
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleMemoSave(student.id)}
                              >
                                저장
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell style={{ width: columnWidths.actions }}>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setSelectedStudentForDetail(student)}
                          title="신청서 보기"
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
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDelete(student.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    등록된 수강생이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
       )}

      {/* Application Detail Dialog */}
      <ApplicationDetailDialog
        open={!!selectedStudentForDetail}
        onOpenChange={(open) => !open && setSelectedStudentForDetail(null)}
        formResponseId={selectedStudentForDetail?.form_response_id || null}
        studentName={selectedStudentForDetail?.student_name || null}
        studentEmail={selectedStudentForDetail?.email || ''}
      />

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={!!approvalDialogStudent} onOpenChange={(open) => !open && setApprovalDialogStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>수강생 상태 변경</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{approvalDialogStudent?.student_name || approvalDialogStudent?.email}</span>
              님의 상태를 선택해주세요.
              <br />
              <span className="text-muted-foreground text-xs mt-1 block">
                현재 상태: {approvalDialogStudent && getStatusLabel(approvalDialogStudent.is_new_student !== false, approvalDialogStudent.is_registered || false)}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleApprovalConfirm(false)}
              className="bg-muted text-muted-foreground hover:bg-muted/80"
            >
              대기
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleApprovalConfirm(true)}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              승인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       
       {/* Excel Download Button */}
       <div className="flex justify-end mt-4">
         <Button
           variant="outline"
           size="sm"
           className="gap-2"
           onClick={handleExcelDownload}
           disabled={filteredAndSortedStudents.length === 0}
         >
           <Download className="w-4 h-4" />
           엑셀 다운로드
         </Button>
       </div>
    </>
  );
}
