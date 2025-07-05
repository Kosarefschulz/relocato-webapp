import jsPDF from 'jspdf';
import { LayoutTemplate, LayoutPage, LayoutElement, TextProperties, ImageProperties, TableProperties, ShapeProperties, VariableProperties, QRCodeProperties, SignatureProperties } from '../types/layoutEditor';
import QRCode from 'qrcode';
import 'jspdf-autotable';

export const generateLayoutPDF = async (template: LayoutTemplate, data?: any): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: template.settings.orientation,
    unit: 'mm',
    format: template.settings.pageSize.toLowerCase() as any,
  });

  // Process each page
  for (let pageIndex = 0; pageIndex < template.pages.length; pageIndex++) {
    if (pageIndex > 0) {
      doc.addPage();
    }

    const page = template.pages[pageIndex];
    
    // Set page background
    if (page.backgroundColor) {
      doc.setFillColor(page.backgroundColor);
      doc.rect(0, 0, page.width, page.height, 'F');
    }

    // Add background image if exists
    if (page.background) {
      try {
        doc.addImage(page.background, 'JPEG', 0, 0, page.width, page.height);
      } catch (error) {
        console.error('Error adding background image:', error);
      }
    }

    // Sort elements by z-index
    const sortedElements = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);

    // Render each element
    for (const element of sortedElements) {
      if (!element.visible) continue;

      await renderElement(doc, element, data, template.settings);
    }
  }

  return doc.output('blob');
};

const renderElement = async (
  doc: jsPDF,
  element: LayoutElement,
  data: any,
  settings: LayoutTemplate['settings']
) => {
  const { position, size, rotation } = element;

  // Save current graphics state
  if (rotation) {
    doc.saveGraphicsState();
    // Translate to element center, rotate, then translate back
    const centerX = position.x + size.width / 2;
    const centerY = position.y + size.height / 2;
    // Save and apply rotation transform
    // jsPDF doesn't expose internal.write in TypeScript, so we need to handle rotation differently
    // For now, we'll skip rotation as it requires accessing internal APIs
  }

  switch (element.type) {
    case 'text':
      await renderText(doc, element, data);
      break;
    case 'image':
      await renderImage(doc, element);
      break;
    case 'table':
      await renderTable(doc, element, data);
      break;
    case 'shape':
      await renderShape(doc, element);
      break;
    case 'variable':
      await renderVariable(doc, element, data);
      break;
    case 'qrcode':
      await renderQRCode(doc, element);
      break;
    case 'signature':
      await renderSignature(doc, element);
      break;
  }

  // Restore graphics state
  if (rotation) {
    doc.restoreGraphicsState();
  }
};

const renderText = async (doc: jsPDF, element: LayoutElement, data: any) => {
  const props = element.properties as TextProperties;
  const { position, size } = element;

  // Set text properties
  doc.setFontSize(props.fontSize);
  doc.setFont(props.fontFamily.toLowerCase().replace(' ', ''), props.fontWeight === 'bold' ? 'bold' : props.fontStyle);
  doc.setTextColor(props.color);

  // Background
  if (props.backgroundColor) {
    doc.setFillColor(props.backgroundColor);
    doc.rect(position.x, position.y, size.width, size.height, 'F');
  }

  // Calculate text position based on alignment
  let textX = position.x + props.padding;
  let textY = position.y + props.padding + props.fontSize * 0.35; // Approximate baseline adjustment

  if (props.textAlign === 'center') {
    textX = position.x + size.width / 2;
  } else if (props.textAlign === 'right') {
    textX = position.x + size.width - props.padding;
  }

  // Split text into lines
  const lines = doc.splitTextToSize(props.content, size.width - 2 * props.padding);
  
  // Draw each line
  lines.forEach((line: string, index: number) => {
    doc.text(line, textX, textY + index * props.fontSize * props.lineHeight, {
      align: props.textAlign === 'justify' ? 'left' : props.textAlign,
    });
  });

  // Shadow effect
  if (props.shadow) {
    // Note: jsPDF doesn't support shadows directly in the standard API
    // Shadow rendering is skipped for now
  }
};

const renderImage = async (doc: jsPDF, element: LayoutElement) => {
  const props = element.properties as ImageProperties;
  const { position, size } = element;

  try {
    // Set opacity if needed
    // Note: opacity not directly supported in standard jsPDF

    // Add border if specified
    if (props.border) {
      doc.setDrawColor(props.border.color);
      doc.setLineWidth(props.border.width);
      
      if (props.border.style === 'dashed') {
        doc.setLineDashPattern([5, 3], 0);
      } else if (props.border.style === 'dotted') {
        doc.setLineDashPattern([1, 2], 0);
      }
      
      doc.rect(position.x, position.y, size.width, size.height, 'S');
      doc.setLineDashPattern([], 0); // Reset dash pattern
    }

    // Add image
    doc.addImage(props.src, 'JPEG', position.x, position.y, size.width, size.height);

    // Reset opacity (not needed without opacity support)
  } catch (error) {
    console.error('Error rendering image:', error);
    // Draw placeholder
    doc.setDrawColor('#cccccc');
    doc.rect(position.x, position.y, size.width, size.height, 'S');
    doc.setFontSize(10);
    doc.text('Image not found', position.x + size.width / 2, position.y + size.height / 2, { align: 'center' });
  }
};

const renderTable = async (doc: jsPDF, element: LayoutElement, data: any) => {
  const props = element.properties as TableProperties;
  const { position } = element;

  // Prepare table data
  const headers = props.showHeaders ? props.headers : [];
  const body = props.rows;

  // Use autoTable plugin
  (doc as any).autoTable({
    startY: position.y,
    margin: { left: position.x },
    head: headers.length > 0 ? [headers] : undefined,
    body: body,
    theme: 'plain',
    styles: {
      fontSize: props.cellStyle.fontSize,
      cellPadding: props.cellStyle.padding,
      lineColor: props.cellStyle.borderColor,
      lineWidth: props.cellStyle.borderWidth,
    },
    headStyles: {
      fillColor: props.headerStyle.backgroundColor,
      textColor: props.headerStyle.color,
      fontStyle: props.headerStyle.fontWeight,
      fontSize: props.headerStyle.fontSize,
    },
    alternateRowStyles: props.alternateRowColor ? {
      fillColor: props.alternateRowColor,
    } : undefined,
  });
};

const renderShape = async (doc: jsPDF, element: LayoutElement) => {
  const props = element.properties as ShapeProperties;
  const { position, size } = element;

  // Set colors and styles
  if (props.fillColor) {
    doc.setFillColor(props.fillColor);
  }
  doc.setDrawColor(props.strokeColor);
  doc.setLineWidth(props.strokeWidth);

  if (props.strokeStyle === 'dashed') {
    doc.setLineDashPattern([5, 3], 0);
  } else if (props.strokeStyle === 'dotted') {
    doc.setLineDashPattern([1, 2], 0);
  }

  switch (props.shapeType) {
    case 'rectangle':
      if (props.borderRadius) {
        doc.roundedRect(
          position.x,
          position.y,
          size.width,
          size.height,
          props.borderRadius,
          props.borderRadius,
          props.fillColor ? 'FD' : 'S'
        );
      } else {
        doc.rect(position.x, position.y, size.width, size.height, props.fillColor ? 'FD' : 'S');
      }
      break;

    case 'circle':
      const radius = Math.min(size.width, size.height) / 2;
      doc.circle(
        position.x + size.width / 2,
        position.y + size.height / 2,
        radius,
        props.fillColor ? 'FD' : 'S'
      );
      break;

    case 'line':
      doc.line(position.x, position.y, position.x + size.width, position.y + size.height);
      
      // Add arrow head if specified
      if (props.arrowHead === 'arrow') {
        const angle = Math.atan2(size.height, size.width);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6; // 30 degrees
        
        const endX = position.x + size.width;
        const endY = position.y + size.height;
        
        doc.line(
          endX,
          endY,
          endX - arrowLength * Math.cos(angle - arrowAngle),
          endY - arrowLength * Math.sin(angle - arrowAngle)
        );
        doc.line(
          endX,
          endY,
          endX - arrowLength * Math.cos(angle + arrowAngle),
          endY - arrowLength * Math.sin(angle + arrowAngle)
        );
      }
      break;
  }

  // Reset dash pattern
  doc.setLineDashPattern([], 0);
};

const renderVariable = async (doc: jsPDF, element: LayoutElement, data: any) => {
  const props = element.properties as VariableProperties;
  const { position, size } = element;

  // Get value from data
  let value = data?.[props.variableName] || props.fallback || `{{${props.variableName}}}`;

  // Format value if needed
  if (props.format === 'currency' && typeof value === 'number') {
    value = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  } else if (props.format === 'date' && value instanceof Date) {
    value = value.toLocaleDateString('de-DE');
  }

  // Render as text
  const textElement: LayoutElement = {
    ...element,
    type: 'text',
    properties: {
      type: 'text',
      content: String(value),
      ...props.style,
    } as TextProperties,
  };

  await renderText(doc, textElement, data);
};

const renderQRCode = async (doc: jsPDF, element: LayoutElement) => {
  const props = element.properties as QRCodeProperties;
  const { position, size } = element;

  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(props.data, {
      errorCorrectionLevel: props.errorCorrectionLevel,
      margin: props.margin,
      color: {
        dark: props.darkColor,
        light: props.lightColor,
      },
      width: size.width * 4, // Higher resolution for better quality
    });

    // Add QR code image
    doc.addImage(qrDataUrl, 'PNG', position.x, position.y, size.width, size.height);
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Draw placeholder
    doc.setDrawColor('#cccccc');
    doc.rect(position.x, position.y, size.width, size.height, 'S');
    doc.setFontSize(8);
    doc.text('QR Code Error', position.x + size.width / 2, position.y + size.height / 2, { align: 'center' });
  }
};

const renderSignature = async (doc: jsPDF, element: LayoutElement) => {
  const props = element.properties as SignatureProperties;
  const { position, size } = element;

  // Draw signature line
  doc.setDrawColor(props.lineColor);
  doc.setLineWidth(props.lineWidth);
  const lineY = position.y + size.height - 20;
  doc.line(position.x, lineY, position.x + size.width, lineY);

  // Add label
  doc.setFontSize(10);
  doc.setTextColor('#666666');
  doc.text(props.label, position.x, lineY + 5);

  // Add date field if enabled
  if (props.showDate) {
    const dateX = position.x + size.width - 60;
    doc.text('Datum:', dateX, lineY + 5);
    doc.line(dateX + 20, lineY, position.x + size.width, lineY);
  }

  // Add name field if enabled
  if (props.showName) {
    const nameY = lineY + 15;
    doc.text('Name:', position.x, nameY + 5);
    doc.line(position.x + 20, nameY, position.x + size.width / 2, nameY);
  }
};