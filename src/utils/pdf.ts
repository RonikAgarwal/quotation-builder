import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { QuotationState } from '../types';

export async function generatePDF(state: QuotationState, grandTotal: number) {
  const doc = new jsPDF();

  // Helper to load image
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });
  };

  // Define layout bounds
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;

  // --- Header Section ---
  try {
    const logo = await loadImage('/logo.png');
    // Centered logo, 24x24
    doc.addImage(logo, 'PNG', pageWidth / 2 - 12, 10, 24, 24);
  } catch (e) {
    console.warn('Could not load logo for PDF', e);
  }

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SHREE GANESH HARDWARE', pageWidth / 2, 42, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Quotation', pageWidth / 2, 50, { align: 'center' });

  // Party Name and Date
  doc.setFontSize(11);
  const partyText = state.partyName ? `Party Name: ${state.partyName}` : 'Party Name: _________________';
  doc.text(partyText, marginLeft, 65);

  const dateText = state.date ? `Date: ${state.date}` : `Date: ${new Date().toLocaleDateString()}`;
  doc.text(dateText, pageWidth - marginRight, 65, { align: 'right' });

  let imageMap: Record<string, boolean> = {};
  try {
    const res = await fetch('/image-map.json');
    imageMap = await res.json();
  } catch (e) {}

  const loadedImages = new Map<string, HTMLImageElement>();
  for (const item of state.items) {
    if (item.customImageBase64 && !loadedImages.has(item.id)) {
      try {
        const img = await loadImage(item.customImageBase64);
        loadedImages.set(item.id, img);
      } catch (e) {}
    } else if (item.familyId && imageMap[item.familyId] && !loadedImages.has(item.familyId)) {
      try {
        const img = await loadImage(`/product-images/${item.familyId}.jpg`);
        loadedImages.set(item.familyId, img);
      } catch (e) {}
    }
  }

  // --- Table Section ---
  const hasImages = loadedImages.size > 0;

  // We extract the table rows
  const tableData = state.items.map((item, index) => {
    // Format numeric columns
    const discPrice = typeof item.discountedPrice === 'number' ? item.discountedPrice.toFixed(2) : '-';
    const qty = typeof item.quantity === 'number' ? item.quantity.toString() : '-';
    
    const lineTotal = (typeof item.discountedPrice === 'number' && typeof item.quantity === 'number') 
      ? Math.round(item.discountedPrice * item.quantity).toFixed(2) 
      : '-';

    // Combine Name and Subtitle cleanly into one column.
    const productCell = item.subtitle ? `${item.name}\n(${item.subtitle})` : item.name;

    const row = [
      (index + 1).toString(),
    ];
    if (hasImages) {
      row.push(''); // Placeholder for Image
    }
    row.push(productCell, discPrice, qty, lineTotal);
    return row;
  });

  const headRow = ['#'];
  if (hasImages) {
    headRow.push('Img');
  }
  headRow.push('Product', 'Price', 'Qty', 'Total');

  const columnStyles: any = {
    0: { halign: 'center', cellWidth: 10 },
  };
  let colIdx = 1;
  if (hasImages) {
    columnStyles[colIdx++] = { halign: 'center', cellWidth: 15 }; // Img
  }
  columnStyles[colIdx++] = { halign: 'left' }; // Product
  columnStyles[colIdx++] = { halign: 'right', cellWidth: 22 }; // Price
  columnStyles[colIdx++] = { halign: 'center', cellWidth: 12 }; // Qty
  columnStyles[colIdx++] = { halign: 'right', cellWidth: 25 }; // Total

  autoTable(doc, {
    startY: 75,
    rowPageBreak: 'avoid', // Prevents rows from splitting across pages
    head: [headRow],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [40, 40, 40],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles,
    styles: {
      fontSize: 10,
      cellPadding: 3,
      valign: 'middle',
      minCellHeight: 16, // Ensure cells are tall enough for images
    },
    didDrawCell: function (data) {
      // Draw image in column 1 (if present)
      if (hasImages && data.section === 'body' && data.column.index === 1) {
        const item = state.items[data.row.index];
        if (item) {
          const img = item.customImageBase64 ? loadedImages.get(item.id) : (item.familyId ? loadedImages.get(item.familyId) : undefined);
          if (img) {
            const dim = 12; // 12x12 image
            const x = data.cell.x + (data.cell.width - dim) / 2;
            const y = data.cell.y + (data.cell.height - dim) / 2;
            doc.addImage(img, 'JPEG', x, y, dim, dim);
          }
        }
      }
    }
  });

  // --- Footer Section ---
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const grandTotalText = `Grand Total: Rs. ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  doc.text(grandTotalText, pageWidth - marginRight, finalY, { align: 'right' });

  // Save the document
  const safePartyName = state.partyName.trim() ? state.partyName.replace(/[^a-z0-9]/gi, '_') : 'Quotation';
  doc.save(`${safePartyName}_${state.date}.pdf`);
}
