import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Pen, Highlighter, Eraser, Trash2, Undo } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tool = 'pen' | 'highlighter' | 'eraser' | 'none';

interface DrawingCanvasProps {
  width: number;
  height: number;
  className?: string;
  showToolbar?: boolean;
  onToolbarToggle?: () => void;
}

interface DrawAction {
  type: 'path';
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
  opacity: number;
}

const COLORS = [
  '#000000', // Black
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#22C55E', // Green
  '#F59E0B', // Orange
  '#8B5CF6', // Purple
];

const HIGHLIGHTER_COLORS = [
  '#FBBF24', // Yellow
  '#34D399', // Green
  '#60A5FA', // Blue
  '#F472B6', // Pink
  '#A78BFA', // Purple
  '#FB923C', // Orange
];

export function DrawingCanvas({ width, height, className, showToolbar = false }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('none');
  const [penColor, setPenColor] = useState('#000000');
  const [highlighterColor, setHighlighterColor] = useState('#FBBF24');
  const [lineWidth, setLineWidth] = useState(3);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  // Reset tool when toolbar is hidden
  useEffect(() => {
    if (!showToolbar) {
      setTool('none');
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
    
    const coords = getCoordinates(e);
    setIsDrawing(true);
    setCurrentPath([coords]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'none') return;

    const coords = getCoordinates(e);
    const newPath = [...currentPath, coords];
    setCurrentPath(newPath);

    // Draw current stroke
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
    if (!isDrawing || tool === 'none') return;

    if (currentPath.length >= 2) {
      const newAction: DrawAction = {
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
  };

  const clearAll = () => {
    setActions([]);
  };

  const handleToolSelect = (selectedTool: Tool) => {
    setTool(tool === selectedTool ? 'none' : selectedTool);
  };

  return (
    <div 
      ref={containerRef}
      className={cn('relative', className)}
    >
      {/* Toolbar - controlled by parent */}
      <div 
        className={cn(
          'absolute top-2 left-2 z-20 flex items-center gap-1 bg-background/95 backdrop-blur-sm p-1.5 rounded-lg shadow-lg border transition-all duration-300',
          showToolbar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
      >
        {/* Pen Tool */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={tool === 'pen' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleToolSelect('pen')}
            >
              <Pen className="h-4 w-4" style={{ color: tool === 'pen' ? penColor : undefined }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="space-y-2">
              <div className="flex gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'w-6 h-6 rounded-full border-2',
                      penColor === color ? 'border-primary' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setPenColor(color);
                      setTool('pen');
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">굵기</span>
                <Slider
                  value={[lineWidth]}
                  onValueChange={([val]) => setLineWidth(val)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-20"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlighter Tool */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={tool === 'highlighter' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleToolSelect('highlighter')}
            >
              <Highlighter className="h-4 w-4" style={{ color: tool === 'highlighter' ? highlighterColor : undefined }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex gap-1">
              {HIGHLIGHTER_COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    'w-6 h-6 rounded-full border-2',
                    highlighterColor === color ? 'border-primary' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setHighlighterColor(color);
                    setTool('highlighter');
                  }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Eraser */}
        <Button
          variant={tool === 'eraser' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handleToolSelect('eraser')}
        >
          <Eraser className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Undo */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={undo}
          disabled={actions.length === 0}
        >
          <Undo className="h-4 w-4" />
        </Button>

        {/* Clear */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={clearAll}
          disabled={actions.length === 0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas - z-index 0 so toolbar (z-20) stays on top */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={cn(
          'absolute inset-0 w-full h-full z-0',
          tool !== 'none' ? 'cursor-crosshair' : 'pointer-events-none'
        )}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
}
