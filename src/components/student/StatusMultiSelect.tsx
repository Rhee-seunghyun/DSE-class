import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface StatusMultiSelectProps {
  paymentConfirmed: boolean;
  businessRegistration: boolean;
  invoiceIssued: boolean;
  surveyCompleted: boolean;
  certificateSent: boolean;
  onStatusChange: (field: string, value: boolean) => void;
}

const STATUS_OPTIONS = [
  { key: 'payment_confirmed', label: '입금', short: '입' },
  { key: 'business_registration', label: '사업자', short: '사' },
  { key: 'invoice_issued', label: '계산서', short: '계' },
  { key: 'survey_completed', label: '설문', short: '설' },
  { key: 'certificate_sent', label: 'Certi', short: 'C' },
];

export function StatusMultiSelect({
  paymentConfirmed,
  businessRegistration,
  invoiceIssued,
  surveyCompleted,
  certificateSent,
  onStatusChange,
}: StatusMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusValues: Record<string, boolean> = {
    payment_confirmed: paymentConfirmed,
    business_registration: businessRegistration,
    invoice_issued: invoiceIssued,
    survey_completed: surveyCompleted,
    certificate_sent: certificateSent,
  };

  const selectedCount = Object.values(statusValues).filter(Boolean).length;
  const selectedLabels = STATUS_OPTIONS
    .filter(opt => statusValues[opt.key])
    .map(opt => opt.short)
    .join('');

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs font-normal min-w-[40px]"
        >
          {selectedCount === 0 ? (
            <span className="text-muted-foreground">-</span>
          ) : selectedCount === 5 ? (
            <Badge variant="default" className="text-xs px-1.5 py-0">ALL</Badge>
          ) : (
            <span className="text-primary font-medium">{selectedLabels}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="center">
        <div className="space-y-2">
          {STATUS_OPTIONS.map((option) => (
            <div key={option.key} className="flex items-center space-x-2">
              <Checkbox
                id={option.key}
                checked={statusValues[option.key]}
                onCheckedChange={(checked) => onStatusChange(option.key, checked as boolean)}
              />
              <label
                htmlFor={option.key}
                className="text-sm leading-none cursor-pointer"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
