import { useState, useMemo, useCallback, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
  Eye
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { StatusMultiSelect } from './StatusMultiSelect';
import { ApplicationDetailDialog } from './ApplicationDetailDialog';

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
}

interface StudentTableProps {
  students: StudentData[];
  onEdit: (student: StudentData) => void;
  onDelete: (studentId: string) => void;
  onCheckboxChange: (studentId: string, field: keyof StudentData, value: boolean) => void;
}

type SortDirection = 'asc' | 'desc' | null;
type SortField = keyof StudentData | null;

interface ColumnFilter {
  [key: string]: string;
}

interface ColumnWidths {
  [key: string]: number;
}

const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  isNew: 48,
  is_registered: 56,
  student_name: 80,
  license_number: 80,
  email: 140,
  phone_number: 120,
  status_flags: 64,
  actions: 100,
};

export function StudentTable({ students, onEdit, onDelete, onCheckboxChange }: StudentTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filters, setFilters] = useState<ColumnFilter>({});
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(DEFAULT_COLUMN_WIDTHS);
  const resizingRef = useRef<{ column: string; startX: number; startWidth: number } | null>(null);
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentData | null>(null);

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

  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
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
    Object.entries(filters).forEach(([column, filterValue]) => {
      if (filterValue) {
        result = result.filter(student => {
          const value = student[column as keyof StudentData];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(filterValue.toLowerCase());
        });
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

  const getSortIcon = (field: keyof StudentData) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-3 h-3" /> : 
      <ArrowDown className="w-3 h-3" />;
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

  const renderColumnHeader = (field: keyof StudentData, label: React.ReactNode, sortable = true, filterable = true) => {
    const hasFilter = !!filters[field];
    
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
          {filterable && (
            <Popover open={activeFilterColumn === field} onOpenChange={(open) => setActiveFilterColumn(open ? field : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${hasFilter ? 'text-primary' : ''}`}
                >
                  <Filter className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="필터..."
                    value={filters[field] || ''}
                    onChange={(e) => handleFilterChange(field, e.target.value)}
                    className="h-8 text-xs"
                  />
                  {hasFilter && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => clearFilter(field)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <ResizeHandle column={field} />
      </div>
    );
  };

  const renderCheckboxHeader = (field: keyof StudentData, label: string) => {
    return (
      <div className="flex items-center gap-1 pr-2">
        <span className="text-xs truncate">{label}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => handleSort(field)}
        >
          {getSortIcon(field)}
        </Button>
        <ResizeHandle column={field} />
      </div>
    );
  };

  const handleStatusChange = (studentId: string, field: string, value: boolean) => {
    onCheckboxChange(studentId, field as keyof StudentData, value);
  };

  return (
    <>
      <ScrollArea className="h-[500px] w-full">
        <div className="min-w-max">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: columnWidths.isNew }} className="text-xs text-center relative">
                  <div className="flex items-center justify-center pr-2">
                    신/재
                    <ResizeHandle column="isNew" />
                  </div>
                </TableHead>
                <TableHead style={{ width: columnWidths.is_registered }} className="text-center relative">
                  {renderCheckboxHeader('is_registered' as keyof StudentData, '승인')}
                </TableHead>
                <TableHead style={{ width: columnWidths.student_name }} className="relative">
                  {renderColumnHeader('student_name', '이름')}
                </TableHead>
                <TableHead style={{ width: columnWidths.license_number }} className="relative">
                  {renderColumnHeader('license_number', '면허')}
                </TableHead>
                <TableHead style={{ width: columnWidths.email }} className="relative">
                  {renderColumnHeader('email', <Mail className="w-4 h-4" />)}
                </TableHead>
                <TableHead style={{ width: columnWidths.phone_number }} className="relative">
                  {renderColumnHeader('phone_number', <Phone className="w-4 h-4" />)}
                </TableHead>
                <TableHead style={{ width: columnWidths.status_flags }} className="text-center relative">
                  <div className="flex items-center justify-center pr-2">
                    <span className="text-xs">관리</span>
                    <ResizeHandle column="status_flags" />
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
                    <TableCell style={{ width: columnWidths.isNew }} className="text-xs text-center font-medium">
                      <span className={student.is_new_student !== false ? 'text-primary' : 'text-muted-foreground'}>
                        {student.is_new_student !== false ? '신' : '재'}
                      </span>
                    </TableCell>
                    <TableCell style={{ width: columnWidths.is_registered }} className="text-center">
                      <Checkbox
                        checked={student.is_registered || false}
                        onCheckedChange={(checked) => 
                          onCheckboxChange(student.id, 'is_registered' as keyof StudentData, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell style={{ width: columnWidths.student_name }} className="text-sm truncate">{student.student_name || '-'}</TableCell>
                    <TableCell style={{ width: columnWidths.license_number }} className="text-sm truncate">{student.license_number || '-'}</TableCell>
                    <TableCell style={{ width: columnWidths.email }} className="text-sm truncate">{student.email || '-'}</TableCell>
                    <TableCell style={{ width: columnWidths.phone_number }} className="text-sm truncate">{student.phone_number || '-'}</TableCell>
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
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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

      {/* Application Detail Dialog */}
      <ApplicationDetailDialog
        open={!!selectedStudentForDetail}
        onOpenChange={(open) => !open && setSelectedStudentForDetail(null)}
        formResponseId={selectedStudentForDetail?.form_response_id || null}
        studentName={selectedStudentForDetail?.student_name || null}
        studentEmail={selectedStudentForDetail?.email || ''}
      />
    </>
  );
}
