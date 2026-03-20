import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Pen, Highlighter, Eraser, Trash2, Undo, StickyNote, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tool = 'pen' | 'highlighter' | 'eraser' | 'text' | 'none';

interface PathAction {
  type: 'path';
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
  opacity: number;
}

interface TextAction {
  type: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
}

export type DrawAction = PathAction | TextAction;

interface DrawingCanvasProps {
  width: number;
  height: number;
  className?: string;
  showToolbar?: boolean;
  onToolbarToggle?: () => void;
  initialActions?: DrawAction[];
  onActionsChange?: (actions: DrawAction[]) => void;
}

const COLORS = [
  '#000000', '#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6',
];

const HIGHLIGHTER_COLORS = [
  '#FBBF24', '#34D399', '#60A5FA', '#F472B6', '#A78BFA', '#FB923C',
];

const STICKY_COLORS = [
  '#FEF3C7', // yellow
  '#DBEAFE', // blue
  '#D1FAE5', // green
  '#FCE7F3', // pink
  '#EDE9FE', // purple
  '#FFEDD5', // orange
];

export function DrawingCanvas({
  width,
  height,
  className,
  showToolbar = false,
  initialActions = [],
  onActionsChange,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('none');
  const [penColor, setPenColor] = useState('#000000');
  const [highlighterColor, setHighlighterColor] = useState('#FBBF24');
  const [stickyColor, setStickyColor] = useState('#FEF3C7');
  const [lineWidth, setLineWidth] = useState(3);
  const [actions, setActions] = useState<DrawAction[]>(initialActions);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [draggingNote, setDraggingNote] = useState<{ index: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    onActionsChange?.(actions);
  }, [actions, onActionsChange]);

  useEffect(() => {
    if (!showToolbar) {
      setTool('none');
      setEditingNoteIndex(null);
    }
  }, [showToolbar]);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  const redrawCanvas = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    actions.forEach((action) => {
      if (action.type !== 'path') return;
      if (action.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = action.color;
      ctx.lineWidth = action.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = action.opacity;
      ctx.moveTo(action.points[0].x, action.points[0].y);
      for (let i = 1; i < action.points.length; i++) {
        ctx.lineTo(action.points[i].x, action.points[i].y);
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }, [actions, getContext, width, height]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (tool === 'none') return;

    if (tool === 'text') {
      const coords = getCoordinates(e);
      const newAction: TextAction = {
        type: 'text',
        x: coords.x,
        y: coords.y,
        text: '',
        color: stickyColor,
      };
      const newActions = [...actions, newAction];
      setActions(newActions);
      setEditingNoteIndex(newActions.length - 1);
      return;
    }

    const coords = getCoordinates(e);
    setIsDrawing(true);
    setCurrentPath([coords]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'none' || tool === 'text') return;
    const coords = getCoordinates(e);
    const newPath = [...currentPath, coords];
    setCurrentPath(newPath);

    const ctx = getContext();
    if (!ctx || newPath.length < 2) return;
    redrawCanvas();

    ctx.beginPath();
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : (tool === 'highlighter' ? highlighterColor : penColor);
    ctx.lineWidth = tool === 'eraser' ? 20 : (tool === 'highlighter' ? lineWidth * 3 : lineWidth);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = tool === 'highlighter' ? 0.4 : 1;

    ctx.moveTo(newPath[0].x, newPath[0].y);
    for (let i = 1; i < newPath.length; i++) {
      ctx.lineTo(newPath[i].x, newPath[i].y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const stopDrawing = () => {
    if (!isDrawing || tool === 'none' || tool === 'text') return;
    if (currentPath.length >= 2) {
      const newAction: PathAction = {
        type: 'path',
        points: currentPath,
        color: tool === 'eraser' ? '#FFFFFF' : (tool === 'highlighter' ? highlighterColor : penColor),
        lineWidth: tool === 'eraser' ? 20 : (tool === 'highlighter' ? lineWidth * 3 : lineWidth),
        opacity: tool === 'highlighter' ? 0.4 : 1,
      };
      setActions([...actions, newAction]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const undo = () => {
    setActions(actions.slice(0, -1));
    setEditingNoteIndex(null);
  };

  const clearAll = () => {
    setActions([]);
    setEditingNoteIndex(null);
  };

  const handleToolSelect = (selectedTool: Tool) => {
    setTool(tool === selectedTool ? 'none' : selectedTool);
    setEditingNoteIndex(null);
  };

  const updateNoteText = (index: number, text: string) => {
    setActions(prev => prev.map((a, i) => i === index && a.type === 'text' ? { ...a, text } : a));
  };

  const deleteNote = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
    setEditingNoteIndex(null);
  };

  const handleNoteDragStart = (index: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const action = actions[index];
    if (action.type !== 'text') return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const currentScreenX = action.x / scaleX;
    const currentScreenY = action.y / scaleY;

    setDraggingNote({
      index,
      offsetX: clientX - rect.left - currentScreenX,
      offsetY: clientY - rect.top - currentScreenY,
    });
  };

  useEffect(() => {
    if (!draggingNote) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;

      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const newX = (clientX - rect.left - draggingNote.offsetX) * scaleX;
      const newY = (clientY - rect.top - draggingNote.offsetY) * scaleY;

      setActions(prev => prev.map((a, i) =>
        i === draggingNote.index && a.type === 'text'
          ? { ...a, x: Math.max(0, Math.min(width - 50, newX)), y: Math.max(0, Math.min(height - 30, newY)) }
          : a
      ));
    };

    const handleUp = () => setDraggingNote(null);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [draggingNote, width, height]);

  // Compute text notes for rendering
  const textNotes = actions
    .map((a, i) => ({ action: a, index: i }))
    .filter((item): item is { action: TextAction; index: number } => item.action.type === 'text');

  return (
    <div
      ref={containerRef}
      className={cn('relative pointer-events-none', className)}
    >
      {/* Toolbar */}
      <div
        className={cn(
          'pointer-events-auto absolute top-2 left-2 z-20 flex items-center gap-1 bg-background/95 backdrop-blur-sm p-1.5 rounded-lg shadow-lg border transition-all duration-300',
          showToolbar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
      >
        {/* Pen Tool */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={tool === 'pen' ? 'secondary' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => handleToolSelect('pen')}>
              <Pen className="h-4 w-4" style={{ color: tool === 'pen' ? penColor : undefined }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="space-y-2">
              <div className="flex gap-1">
                {COLORS.map((color) => (
                  <button key={color} className={cn('w-6 h-6 rounded-full border-2', penColor === color ? 'border-primary' : 'border-transparent')} style={{ backgroundColor: color }} onClick={() => { setPenColor(color); setTool('pen'); }} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">굵기</span>
                <Slider value={[lineWidth]} onValueChange={([val]) => setLineWidth(val)} min={1} max={10} step={1} className="w-20" />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlighter Tool */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={tool === 'highlighter' ? 'secondary' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => handleToolSelect('highlighter')}>
              <Highlighter className="h-4 w-4" style={{ color: tool === 'highlighter' ? highlighterColor : undefined }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex gap-1">
              {HIGHLIGHTER_COLORS.map((color) => (
                <button key={color} className={cn('w-6 h-6 rounded-full border-2', highlighterColor === color ? 'border-primary' : 'border-transparent')} style={{ backgroundColor: color }} onClick={() => { setHighlighterColor(color); setTool('highlighter'); }} />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Eraser */}
        <Button variant={tool === 'eraser' ? 'secondary' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => handleToolSelect('eraser')}>
          <Eraser className="h-4 w-4" />
        </Button>

        {/* Text/Sticky Note Tool */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={tool === 'text' ? 'secondary' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => handleToolSelect('text')}>
              <StickyNote className="h-4 w-4" style={{ color: tool === 'text' ? stickyColor : undefined }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex gap-1">
              {STICKY_COLORS.map((color) => (
                <button key={color} className={cn('w-6 h-6 rounded border-2', stickyColor === color ? 'border-primary' : 'border-transparent')} style={{ backgroundColor: color }} onClick={() => { setStickyColor(color); setTool('text'); }} />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Undo */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={undo} disabled={actions.length === 0}>
          <Undo className="h-4 w-4" />
        </Button>

        {/* Clear */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={clearAll} disabled={actions.length === 0}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas for drawing */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={cn(
          'absolute inset-0 w-full h-full z-0',
          (tool !== 'none' && tool !== 'text') ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
        )}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* Transparent click layer for text tool */}
      {tool === 'text' && (
        <div
          className="absolute inset-0 w-full h-full z-10 cursor-crosshair pointer-events-auto"
          onMouseDown={(e) => {
            // Only place note if clicking on empty area (not on existing note)
            if ((e.target as HTMLElement).closest('[data-sticky-note]')) return;
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const scaleX = width / rect.width;
            const scaleY = height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const newAction: TextAction = { type: 'text', x, y, text: '', color: stickyColor };
            const newActions = [...actions, newAction];
            setActions(newActions);
            setEditingNoteIndex(newActions.length - 1);
          }}
        />
      )}

      {/* Sticky note overlays */}
      {textNotes.map(({ action, index }) => {
        const container = containerRef.current;
        if (!container) return null;
        const rect = container.getBoundingClientRect();
        const scaleX = rect.width / width;
        const scaleY = rect.height / height;
        const screenX = action.x * scaleX;
        const screenY = action.y * scaleY;
        const isEditing = editingNoteIndex === index;

        return (
          <div
            key={index}
            data-sticky-note
            className="absolute pointer-events-auto z-30 rounded shadow-md border border-black/10 flex flex-col"
            style={{
              left: screenX,
              top: screenY,
              backgroundColor: action.color,
              minWidth: 120,
              maxWidth: 200,
            }}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-1 pt-0.5 cursor-default">
              <div
                className="cursor-grab active:cursor-grabbing p-0.5"
                onMouseDown={(e) => handleNoteDragStart(index, e)}
                onTouchStart={(e) => handleNoteDragStart(index, e)}
              >
                <GripVertical className="w-3 h-3 text-black/30" />
              </div>
              <button
                className="p-0.5 rounded hover:bg-black/10 transition-colors"
                onClick={() => deleteNote(index)}
              >
                <X className="w-3 h-3 text-black/40" />
              </button>
            </div>
            {/* Text area */}
            <textarea
              className="bg-transparent border-none outline-none resize-none text-xs px-1.5 pb-1.5 text-black/80 placeholder:text-black/30 w-full"
              style={{ minHeight: 40 }}
              placeholder="메모를 입력하세요..."
              value={action.text}
              onChange={(e) => updateNoteText(index, e.target.value)}
              onClick={() => setEditingNoteIndex(index)}
              autoFocus={isEditing && action.text === ''}
              rows={2}
            />
          </div>
        );
      })}
    </div>
  );
}