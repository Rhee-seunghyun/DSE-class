import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
export type QuestionType = 'multiple_choice' | 'short_answer' | 'long_answer';

export interface FormQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  is_required: boolean;
  order_index: number;
}

interface FormBuilderProps {
  questions: FormQuestion[];
  onQuestionsChange: (questions: FormQuestion[]) => void;
}

export function FormBuilder({ questions, onQuestionsChange }: FormBuilderProps) {
  const addQuestion = () => {
    const newQuestion: FormQuestion = {
      id: crypto.randomUUID(),
      question_text: '',
      question_type: 'short_answer',
      options: [],
      is_required: true,
      order_index: questions.length,
    };
    onQuestionsChange([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    onQuestionsChange(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const deleteQuestion = (id: string) => {
    onQuestionsChange(
      questions
        .filter((q) => q.id !== id)
        .map((q, index) => ({ ...q, order_index: index }))
    );
  };

  const addOption = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      const newOptions = [...(question.options || []), ''];
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const deleteOption = (questionId: string, optionIndex: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.options) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };


  return (
    <div className="space-y-4">
      <ScrollArea className="max-h-[300px] pr-4">
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="bg-card">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <div className="flex items-center pt-2 text-muted-foreground cursor-move">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Q{index + 1}
                      </span>
                      <Input
                        value={question.question_text}
                        onChange={(e) =>
                          updateQuestion(question.id, { question_text: e.target.value })
                        }
                        placeholder="질문을 입력하세요"
                        className="flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <Select
                        value={question.question_type}
                        onValueChange={(value: QuestionType) =>
                          updateQuestion(question.id, {
                            question_type: value,
                            options: value === 'multiple_choice' ? [''] : [],
                          })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short_answer">단답형</SelectItem>
                          <SelectItem value="long_answer">주관식</SelectItem>
                          <SelectItem value="multiple_choice">객관식</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={question.is_required}
                          onCheckedChange={(checked) =>
                            updateQuestion(question.id, { is_required: checked })
                          }
                        />
                        <Label className="text-sm">필수</Label>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteQuestion(question.id)}
                        className="text-destructive hover:text-destructive ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {question.question_type === 'multiple_choice' && (
                      <div className="space-y-2 pl-4 border-l-2 border-muted">
                        {(question.options || []).map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                            <Input
                              value={option}
                              onChange={(e) =>
                                updateOption(question.id, optionIndex, e.target.value)
                              }
                              placeholder={`옵션 ${optionIndex + 1}`}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteOption(question.id, optionIndex)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addOption(question.id)}
                          className="text-muted-foreground"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          옵션 추가
                        </Button>
                      </div>
                    )}

                    {question.question_type === 'short_answer' && (
                      <Input disabled placeholder="단답형 텍스트" className="bg-muted" />
                    )}

                    {question.question_type === 'long_answer' && (
                      <Textarea disabled placeholder="주관식 텍스트" className="bg-muted" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Button variant="outline" onClick={addQuestion} className="w-full gap-2">
        <Plus className="w-4 h-4" />
        질문 추가
      </Button>
    </div>
  );
}
