import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, useTheme, alpha } from '@mui/material';
import {
  DragIndicator as DragIcon,
  OpenWith as ResizeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { TemplateContentBlock } from '../types/pdfTemplate';

interface DraggableResizableBlockProps {
  block: TemplateContentBlock;
  pageWidth: number;
  pageHeight: number;
  scale: number;
  isSelected: boolean;
  onSelect: (block: TemplateContentBlock) => void;
  onUpdate: (blockId: string, updates: Partial<TemplateContentBlock>) => void;
  onEdit: (block: TemplateContentBlock) => void;
  onDelete: (blockId: string) => void;
  onToggleVisibility: (blockId: string) => void;
}

const DraggableResizableBlock: React.FC<DraggableResizableBlockProps> = ({
  block,
  pageWidth,
  pageHeight,
  scale,
  isSelected,
  onSelect,
  onUpdate,
  onEdit,
  onDelete,
  onToggleVisibility
}) => {
  const theme = useTheme();
  const blockRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });

  // Convert mm to pixels (assuming 96 DPI)
  const mmToPx = (mm: number) => (mm * 96) / 25.4;
  const pxToMm = (px: number) => (px * 25.4) / 96;

  // Get block dimensions
  const x = mmToPx(block.xPosition || 20) * scale;
  const y = mmToPx(block.yPosition || (block.position * 50 + 20)) * scale;
  const width = mmToPx(block.width || 170) * scale;
  const height = mmToPx(block.height || 40) * scale;

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - x,
      y: e.clientY - y
    });
    onSelect(block);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      width: width,
      height: height,
      x: e.clientX,
      y: e.clientY
    });
    onSelect(block);
  };

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isResizing) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Convert back to mm and constrain to page bounds
        const xMm = Math.max(0, Math.min(pxToMm(newX / scale), pageWidth - (block.width || 170)));
        const yMm = Math.max(0, Math.min(pxToMm(newY / scale), pageHeight - (block.height || 40)));
        
        onUpdate(block.id, {
          xPosition: xMm,
          yPosition: yMm
        });
      } else if (isResizing && !isDragging) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(20, resizeStart.width + deltaX);
        const newHeight = Math.max(20, resizeStart.height + deltaY);
        
        // Convert back to mm
        const widthMm = pxToMm(newWidth / scale);
        const heightMm = pxToMm(newHeight / scale);
        
        onUpdate(block.id, {
          width: widthMm,
          height: heightMm
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, block, scale, pageWidth, pageHeight, onUpdate]);

  // Get block icon based on type
  const getBlockIcon = () => {
    switch (block.blockType) {
      case 'logo': return '🖼️';
      case 'header': return '📄';
      case 'footer': return '📄';
      case 'company_info': return '🏢';
      case 'customer_info': return '👤';
      case 'service_list': return '📋';
      case 'pricing_table': return '💰';
      case 'signature': return '✍️';
      case 'terms': return '📜';
      default: return '📝';
    }
  };

  return (
    <Box
      ref={blockRef}
      onClick={() => onSelect(block)}
      sx={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
        border: '2px solid',
        borderColor: isSelected ? theme.palette.primary.main : 'transparent',
        backgroundColor: block.isVisible 
          ? alpha(theme.palette.background.paper, 0.8)
          : alpha(theme.palette.action.disabled, 0.3),
        borderRadius: 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
        opacity: block.isVisible ? 1 : 0.5,
        '&:hover': {
          borderColor: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          '& .block-controls': {
            opacity: 1
          }
        },
        userSelect: 'none'
      }}
    >
      {/* Drag Handle */}
      <Box
        onMouseDown={handleDragStart}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      />

      {/* Content */}
      <Box sx={{ p: 1, pointerEvents: 'none' }}>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span style={{ fontSize: '1.2em' }}>{getBlockIcon()}</span>
          {block.name}
        </Typography>
      </Box>

      {/* Controls (show on hover) */}
      <Box
        className="block-controls"
        sx={{
          position: 'absolute',
          top: -32,
          right: 0,
          display: 'flex',
          gap: 0.5,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 1,
          boxShadow: 2,
          p: 0.5,
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'all'
        }}
      >
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(block);
          }}
          title="Bearbeiten"
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(block.id);
          }}
          title={block.isVisible ? "Ausblenden" : "Einblenden"}
        >
          {block.isVisible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
          color="error"
          title="Löschen"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Resize Handle */}
      <Box
        onMouseDown={handleResizeStart}
        sx={{
          position: 'absolute',
          bottom: -4,
          right: -4,
          width: 16,
          height: 16,
          backgroundColor: theme.palette.primary.main,
          borderRadius: '50%',
          cursor: 'nwse-resize',
          display: isSelected ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          '&:hover': {
            transform: 'scale(1.2)'
          }
        }}
      >
        <ResizeIcon sx={{ fontSize: 10, color: 'white' }} />
      </Box>

      {/* Size indicator */}
      {(isDragging || isResizing) && (
        <Box
          sx={{
            position: 'absolute',
            bottom: -20,
            left: 0,
            fontSize: '10px',
            backgroundColor: theme.palette.background.paper,
            padding: '2px 4px',
            borderRadius: '2px',
            boxShadow: 1,
            pointerEvents: 'none'
          }}
        >
          {Math.round(pxToMm(width / scale))} × {Math.round(pxToMm(height / scale))} mm
        </Box>
      )}
    </Box>
  );
};

export default DraggableResizableBlock;