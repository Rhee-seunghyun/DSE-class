import { useState, useMemo } from 'react';
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
  Phone
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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

export function StudentTable({ students, onEdit, onDelete, onCheckboxChange }: StudentTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filters, setFilters] = useState<ColumnFilter>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

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

  const renderColumnHeader = (field: keyof StudentData, label: React.ReactNode, sortable = true, filterable = true) => {
    const hasFilter = !!filters[field];
    
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs">{label}</span>
        <div className="flex items-center">
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
      </div>
    );
  };

  const renderCheckboxHeader = (field: keyof StudentData, label: string) => {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs">{label}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => handleSort(field)}
        >
          {getSortIcon(field)}
        </Button>
      </div>
    );
  };

  return (
    <ScrollArea className="h-[500px] w-full">
      <div className="min-w-max">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-xs">No.</TableHead>
              <TableHead className="w-12 text-xs text-center">신규/재</TableHead>
              <TableHead className="min-w-[80px]">
                {renderColumnHeader('student_name', '이름')}
              </TableHead>
              <TableHead className="min-w-[80px]">
                {renderColumnHeader('license_number', '면허')}
              </TableHead>
              <TableHead className="min-w-[120px]">
                {renderColumnHeader('email', <Mail className="w-4 h-4" />)}
              </TableHead>
              <TableHead className="min-w-[100px]">
                {renderColumnHeader('phone_number', <Phone className="w-4 h-4" />)}
              </TableHead>
              <TableHead className="w-16 text-center">
                {renderCheckboxHeader('payment_confirmed', '입금')}
              </TableHead>
              <TableHead className="w-16 text-center">
                {renderCheckboxHeader('business_registration', '사업자')}
              </TableHead>
              <TableHead className="w-16 text-center">
                {renderCheckboxHeader('invoice_issued', '계산서')}
              </TableHead>
              <TableHead className="w-16 text-center">
                {renderCheckboxHeader('survey_completed', '설문')}
              </TableHead>
              <TableHead className="w-16 text-center">
                {renderCheckboxHeader('certificate_sent', 'Certi')}
              </TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedStudents.length > 0 ? (
              filteredAndSortedStudents.map((student, index) => (
                <TableRow key={student.id}>
                  <TableCell className="text-xs">{index + 1}</TableCell>
                  <TableCell className="text-xs text-center font-medium">
                    <span className={student.is_new_student !== false ? 'text-primary' : 'text-muted-foreground'}>
                      {student.is_new_student !== false ? '신' : '재'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{student.student_name || '-'}</TableCell>
                  <TableCell className="text-sm">{student.license_number || '-'}</TableCell>
                  <TableCell className="text-sm">{student.email || '-'}</TableCell>
                  <TableCell className="text-sm">{student.phone_number || '-'}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={student.payment_confirmed}
                      onCheckedChange={(checked) => 
                        onCheckboxChange(student.id, 'payment_confirmed', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={student.business_registration}
                      onCheckedChange={(checked) => 
                        onCheckboxChange(student.id, 'business_registration', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={student.invoice_issued}
                      onCheckedChange={(checked) => 
                        onCheckboxChange(student.id, 'invoice_issued', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={student.survey_completed}
                      onCheckedChange={(checked) => 
                        onCheckboxChange(student.id, 'survey_completed', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={student.certificate_sent}
                      onCheckedChange={(checked) => 
                        onCheckboxChange(student.id, 'certificate_sent', checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
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
                <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
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
  );
}
