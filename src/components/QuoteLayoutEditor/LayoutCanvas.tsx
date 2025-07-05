import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback, useEffect } from 'react';
import { Box, Paper } from '@mui/material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { LayoutTemplate, LayoutPage, LayoutElement, EditorState, Position, Size } from '../../types/layoutEditor';
import { motion } from 'framer-motion';

interface LayoutCanvasProps {
  template: LayoutTemplate;
  currentPage: LayoutPage;
  editorState: EditorState;
  onUpdateElement: (elementId: string, updates: Partial<LayoutElement>) => void;
  onSelectElement: (elementId: string | null) => void;
  quoteData?: any;
}

interface DraggedElement {
  id: string;
  type: string;
  position: Position;
}

// Einzelnes Element im Canvas
const CanvasElement: React.FC<{
  element: LayoutElement;
  isSelected: boolean;
  zoom: number;
  onUpdate: (updates: Partial<LayoutElement>) => void;
  onSelect: () => void;
  quoteData?: any;
}> = ({ element, isSelected, zoom, onUpdate, onSelect, quoteData }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: 'ELEMENT',
    item: { id: element.id, type: element.type, position: element.position } as DraggedElement,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Make element draggable
  drag(ref);

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.size.width,
      height: element.size.height,
    });
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStart) return;

      const deltaX = (e.clientX - resizeStart.x) / (zoom / 100);
      const deltaY = (e.clientY - resizeStart.y) / (zoom / 100);

      onUpdate({
        size: {
          width: Math.max(20, resizeStart.width + deltaX),
          height: Math.max(20, resizeStart.height + deltaY),
        },
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeStart(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, zoom, onUpdate]);

  // Render element content based on type
  const renderContent = () => {
    const props = element.properties;

    switch (props.type) {
      case 'text':
        return (
          <div
            style={{
              fontFamily: props.fontFamily,
              fontSize: props.fontSize,
              fontWeight: props.fontWeight,
              fontStyle: props.fontStyle,
              textAlign: props.textAlign,
              color: props.color,
              backgroundColor: props.backgroundColor,
              padding: props.padding,
              lineHeight: props.lineHeight,
              letterSpacing: props.letterSpacing,
              width: '100%',
              height: '100%',
            }}
          >
            {props.content}
          </div>
        );

      case 'image':
        return (
          <img
            src={props.src}
            alt={props.alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: props.fit,
              opacity: props.opacity,
              borderRadius: props.borderRadius,
            }}
          />
        );

      case 'shape':
        if (props.shapeType === 'rectangle') {
          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: props.fillColor,
                border: `${props.strokeWidth}px ${props.strokeStyle} ${props.strokeColor}`,
                borderRadius: props.borderRadius,
              }}
            />
          );
        } else if (props.shapeType === 'circle') {
          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: props.fillColor,
                border: `${props.strokeWidth}px ${props.strokeStyle} ${props.strokeColor}`,
                borderRadius: '50%',
              }}
            />
          );
        }
        break;

      case 'variable':
        const value = quoteData?.[props.variableName] || props.fallback || `{{${props.variableName}}}`;
        return (
          <div
            style={{
              fontFamily: props.style.fontFamily,
              fontSize: props.style.fontSize,
              fontWeight: props.style.fontWeight,
              color: props.style.color,
              width: '100%',
              height: '100%',
            }}
          >
            {value}
          </div>
        );

      default:
        return <div>Unsupported element type</div>;
    }
  };

  return (
    <div
      ref={ref}
      onClick={onSelect}
      style={{
        position: 'absolute',
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        zIndex: element.zIndex,
        boxSizing: 'border-box',
        border: isSelected ? '2px solid #1976d2' : '1px solid transparent',
        borderRadius: 4,
      }}
    >
      {renderContent()}
      
      {/* Resize handles */}
      {isSelected && !element.locked && (
        <>
          {/* Bottom-right resize handle */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            style={{
              position: 'absolute',
              right: -4,
              bottom: -4,
              width: 8,
              height: 8,
              backgroundColor: '#1976d2',
              cursor: 'se-resize',
              borderRadius: '50%',
            }}
          />
        </>
      )}
    </div>
  );
};

// Main Canvas Component
const LayoutCanvas = forwardRef<any, LayoutCanvasProps>(
  ({ template, currentPage, editorState, onUpdateElement, onSelectElement, quoteData }, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Calculate canvas size based on zoom
    useEffect(() => {
      const scale = editorState.zoom / 100;
      setCanvasSize({
        width: currentPage.width * 3.779527559 * scale, // mm to px conversion
        height: currentPage.height * 3.779527559 * scale,
      });
    }, [currentPage, editorState.zoom]);

    // Drop functionality for the canvas
    const [, drop] = useDrop({
      accept: 'ELEMENT',
      drop: (item: DraggedElement, monitor) => {
        const clientOffset = monitor.getClientOffset();
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        
        if (clientOffset && canvasRect) {
          const scale = editorState.zoom / 100;
          const x = (clientOffset.x - canvasRect.left) / scale;
          const y = (clientOffset.y - canvasRect.top) / scale;
          
          // Snap to grid if enabled
          let finalX = x;
          let finalY = y;
          
          if (template.settings.snapToGrid) {
            const gridSize = template.settings.gridSize;
            finalX = Math.round(x / gridSize) * gridSize;
            finalY = Math.round(y / gridSize) * gridSize;
          }
          
          onUpdateElement(item.id, {
            position: { x: finalX, y: finalY },
          });
        }
      },
    });

    // Combine refs
    drop(canvasRef);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      exportToImage: async () => {
        // Implementation for exporting canvas to image
      },
    }));

    // Render grid
    const renderGrid = () => {
      if (!editorState.showGrid) return null;
      
      const gridSize = template.settings.gridSize * 3.779527559; // Convert mm to px
      const scale = editorState.zoom / 100;
      const scaledGridSize = gridSize * scale;
      
      return (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <pattern
              id="grid"
              width={scaledGridSize}
              height={scaledGridSize}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={1} cy={1} r={0.5} fill="#ccc" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      );
    };

    // Render rulers
    const renderRulers = () => {
      if (!editorState.showRulers) return null;
      
      // Ruler implementation would go here
      return null;
    };

    return (
      <DndProvider backend={HTML5Backend}>
        <Paper
          elevation={3}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#fff',
          }}
        >
          <div
            ref={canvasRef}
            style={{
              position: 'relative',
              width: canvasSize.width,
              height: canvasSize.height,
              backgroundColor: currentPage.backgroundColor || '#ffffff',
              backgroundImage: currentPage.background ? `url(${currentPage.background})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              margin: 'auto',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onSelectElement(null);
              }
            }}
          >
            {renderGrid()}
            {renderRulers()}
            
            {/* Render all elements */}
            {currentPage.elements.map((element) => (
              <CanvasElement
                key={element.id}
                element={element}
                isSelected={element.id === editorState.selectedElementId}
                zoom={editorState.zoom}
                onUpdate={(updates) => onUpdateElement(element.id, updates)}
                onSelect={() => onSelectElement(element.id)}
                quoteData={quoteData}
              />
            ))}
          </div>
        </Paper>
      </DndProvider>
    );
  }
);

LayoutCanvas.displayName = 'LayoutCanvas';

export default LayoutCanvas;