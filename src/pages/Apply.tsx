import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';


interface FormQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer' | 'long_answer' | 'description';
  options: string[] | null;
  has_other: boolean;
  is_required: boolean;
  order_index: number;
}

export default function Apply() {
  const { formId } = useParams<{ formId: string }>();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otherValues, setOtherValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Fetch form details
  const { data: form, isLoading: formLoading, error: formError } = useQuery({
    queryKey: ['public-form', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('application_forms')
        .select('*')
        .eq('id', formId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!formId,
  });

  // Fetch form questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['public-form-questions', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_questions')
        .select('*')
        .eq('form_id', formId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as FormQuestion[];
    },
    enabled: !!formId && !!form,
  });

  // Submit response mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      // Find name and email from answers (first two short_answer questions typically)
      let applicantName = '';
      let applicantEmail = '';
      let licenseNumber = '';
      let phoneNumber = '';
      let isNewStudent = true; // Default to new student

      questions?.forEach((q, index) => {
        const answer = answers[q.id];
        const questionLower = q.question_text.toLowerCase();
        
        if (questionLower.includes('이름') || questionLower.includes('성함') || questionLower.includes('name')) {
          applicantName = answer || '';
        }
        if (questionLower.includes('이메일') || questionLower.includes('email')) {
          applicantEmail = answer || '';
        }
        if (questionLower.includes('면허') || questionLower.includes('license')) {
          licenseNumber = answer || '';
        }
        if (questionLower.includes('연락처') || questionLower.includes('전화') || questionLower.includes('phone')) {
          phoneNumber = answer || '';
        }
        // 5th question (index 4) determines new/returning student
        if (index === 4) {
          const answerValue = answer || '';
          // "재수강" or contains "재" means returning student
          if (answerValue.includes('재수강') || answerValue.includes('재')) {
            isNewStudent = false;
          }
        }
      });

      // Fallback: use first two short answers if name/email not found
      const shortAnswerQuestions = questions?.filter(q => q.question_type === 'short_answer') || [];
      if (!applicantName && shortAnswerQuestions.length > 0) {
        applicantName = answers[shortAnswerQuestions[0].id] || 'Unknown';
      }
      if (!applicantEmail && shortAnswerQuestions.length > 1) {
        applicantEmail = answers[shortAnswerQuestions[1].id] || '';
      }

      // Prepare final answers (merge other values)
      const finalAnswers: Record<string, string> = {};
      questions?.forEach(q => {
        let answer = answers[q.id] || '';
        if (answer === '__OTHER__' && otherValues[q.id]) {
          answer = `기타: ${otherValues[q.id]}`;
        }
        finalAnswers[q.id] = answer;
      });

      // 1. Save to form_responses for viewing responses later
      const { data: responseData, error: responseError } = await supabase
        .from('form_responses')
        .insert({
          form_id: formId,
          applicant_name: applicantName,
          applicant_email: applicantEmail,
          license_number: licenseNumber || null,
          answers: finalAnswers,
          status: 'pending',
        })
        .select('id')
        .single();

      if (responseError) throw responseError;

      // 2. Directly insert into whitelist (Class DB) with is_registered = false
      const { error: whitelistError } = await supabase
        .from('whitelist')
        .insert({
          lecture_id: form!.lecture_id,
          speaker_id: form!.speaker_id,
          email: applicantEmail,
          student_name: applicantName,
          license_number: licenseNumber || null,
          phone_number: phoneNumber || null,
          is_new_student: isNewStudent,
          is_registered: false, // Not approved yet (Pre-student)
          form_response_id: responseData.id,
        });

      if (whitelistError) throw whitelistError;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success('신청서가 제출되었습니다!');
    },
    onError: (error) => {
      toast.error('제출 실패: ' + error.message);
    },
  });

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleOtherChange = (questionId: string, value: string) => {
    setOtherValues(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const missingRequired = questions?.filter(q => 
      q.is_required && 
      q.question_type !== 'description' && 
      !answers[q.id]
    );

    if (missingRequired && missingRequired.length > 0) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    // Check if "other" is selected but not filled
    const missingOther = questions?.filter(q => 
      answers[q.id] === '__OTHER__' && !otherValues[q.id]
    );

    if (missingOther && missingOther.length > 0) {
      toast.error('기타 항목을 입력해주세요.');
      return;
    }

    submitMutation.mutate();
  };

  if (formLoading || questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (formError || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">신청서를 찾을 수 없습니다</CardTitle>
            <CardDescription>
              유효하지 않거나 비활성화된 신청서입니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-primary" />
            </div>
            <CardTitle>신청이 완료되었습니다!</CardTitle>
            <CardDescription>
              신청서가 성공적으로 제출되었습니다.<br />
              담당자가 검토 후 연락드리겠습니다.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Form Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && (
              <CardDescription className="whitespace-pre-wrap text-base mt-2">
                {form.description}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Questions */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {questions?.map((question) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                {question.question_type === 'description' ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {question.question_text}
                    </p>
                  </div>
                ) : (
                  <>
                    <Label className="text-base font-medium flex items-start gap-1 mb-4">
                      <span>{question.question_text}</span>
                      {question.is_required && (
                        <span className="text-destructive">*</span>
                      )}
                    </Label>

                    {question.question_type === 'short_answer' && (
                      <Input
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="답변을 입력하세요"
                      />
                    )}

                    {question.question_type === 'long_answer' && (
                      <Textarea
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="답변을 입력하세요"
                        className="min-h-[120px]"
                      />
                    )}

                    {question.question_type === 'multiple_choice' && question.options && (
                      <RadioGroup
                        value={answers[question.id] || ''}
                        onValueChange={(value) => handleAnswerChange(question.id, value)}
                        className="space-y-2"
                      >
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                            <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                        {question.has_other && (
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="__OTHER__" id={`${question.id}-other`} />
                            <Label htmlFor={`${question.id}-other`} className="font-normal cursor-pointer">
                              기타:
                            </Label>
                            <Input
                              value={otherValues[question.id] || ''}
                              onChange={(e) => handleOtherChange(question.id, e.target.value)}
                              onFocus={() => handleAnswerChange(question.id, '__OTHER__')}
                              placeholder="직접 입력"
                              className="flex-1"
                            />
                          </div>
                        )}
                      </RadioGroup>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                제출 중...
              </>
            ) : (
              '신청서 제출'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
