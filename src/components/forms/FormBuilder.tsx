import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, AlignLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


export type QuestionType = 'multiple_choice' | 'short_answer' | 'long_answer' | 'description';

export interface FormQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  has_other?: boolean;
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
      has_other: false,
      is_required: true,
      order_index: questions.length,
    };
    onQuestionsChange([...questions, newQuestion]);
  };

  const addDescription = () => {
    const newDescription: FormQuestion = {
      id: crypto.randomUUID(),
      question_text: '',
      question_type: 'description',
      options: [],
      has_other: false,
      is_required: false,
      order_index: questions.length,
    };
    onQuestionsChange([...questions, newDescription]);
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

  const toggleOtherOption = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      updateQuestion(questionId, { has_other: !question.has_other });
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      const newQuestions = arrayMove(questions, oldIndex, newIndex).map(
        (q, index) => ({ ...q, order_index: index })
      );
      onQuestionsChange(newQuestions);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {questions.map((question) => (
              <SortableQuestionCard
                key={question.id}
                question={question}
                questions={questions}
                updateQuestion={updateQuestion}
                deleteQuestion={deleteQuestion}
                addOption={addOption}
                updateOption={updateOption}
                deleteOption={deleteOption}
                toggleOtherOption={toggleOtherOption}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={addQuestion} className="flex-1 gap-2">
          <Plus className="w-4 h-4" />
          질문 추가
        </Button>
        <Button variant="outline" onClick={addDescription} className="flex-1 gap-2">
          <AlignLeft className="w-4 h-4" />
          설명 추가
        </Button>
      </div>
    </div>
  );
}

interface SortableQuestionCardProps {
  question: FormQuestion;
  questions: FormQuestion[];
  updateQuestion: (id: string, updates: Partial<FormQuestion>) => void;
  deleteQuestion: (id: string) => void;
  addOption: (questionId: string) => void;
  updateOption: (questionId: string, optionIndex: number, value: string) => void;
  deleteOption: (questionId: string, optionIndex: number) => void;
  toggleOtherOption: (questionId: string) => void;
}

function SortableQuestionCard({
  question,
  questions,
  updateQuestion,
  deleteQuestion,
  addOption,
  updateOption,
  deleteOption,
  toggleOtherOption,
}: SortableQuestionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="bg-card">
      <CardContent className="pt-4">
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center pt-2 text-muted-foreground cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-4">
            {question.question_type === 'description' ? (
              <>
                <div className="flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    설명
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteQuestion(question.id)}
                    className="text-destructive hover:text-destructive ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  value={question.question_text}
                  onChange={(e) =>
                    updateQuestion(question.id, { question_text: e.target.value })
                  }
                  placeholder="섹션 설명을 입력하세요"
                  className="min-h-[80px]"
                />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Q{questions.filter(q => q.question_type !== 'description').findIndex(q => q.id === question.id) + 1}
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
                        has_other: value === 'multiple_choice' ? question.has_other : false,
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
                    {question.has_other && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                        <Input
                          value="기타..."
                          disabled
                          className="flex-1 bg-muted"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleOtherOption(question.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addOption(question.id)}
                        className="text-muted-foreground"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        옵션 추가
                      </Button>
                      {!question.has_other && (
                        <>
                          <span className="text-muted-foreground text-sm leading-8">또는</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleOtherOption(question.id)}
                            className="text-muted-foreground"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            '기타' 추가
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {question.question_type === 'short_answer' && (
                  <Input disabled placeholder="단답형 텍스트" className="bg-muted" />
                )}

                {question.question_type === 'long_answer' && (
                  <Textarea disabled placeholder="주관식 텍스트" className="bg-muted" />
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
