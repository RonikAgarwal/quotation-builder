import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { QuotationState } from '../types';

export async function generatePDF(state: QuotationState, grandTotal: number) {
  const doc = new jsPDF();

  const loadImageWithWhiteBg = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 1.0));
        } else {
          resolve(url);
        }
      };
      img.onerror = (e) => reject(e);
    });
  };

  // Define layout bounds
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;

  // --- Header Section ---
  let logoOffset = 0;
  try {
    const logoData = await loadImageWithWhiteBg('/logo.webp');
    doc.addImage(logoData, 'JPEG', marginLeft, 12, 24, 24);
    logoOffset = 28; // 24 width + 4 padding
  } catch (e) {
    console.warn('Could not load logo for PDF', e);
  }

  const textStartX = marginLeft + logoOffset;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SHREE GANESH HARDWARE', textStartX, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Deals in: Paints, Pipes, Water Tanks, Putty, Plumbing, Sanitaryware', textStartX, 26);
  doc.text('Contact No: 98645-48325, 69015-58778', textStartX, 31);

  // Reset color to black
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', pageWidth - marginRight, 20, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateText = state.date ? `Date: ${state.date}` : `Date: ${new Date().toLocaleDateString()}`;
  doc.text(dateText, pageWidth - marginRight, 28, { align: 'right' });

  // Draw separator line
  doc.setDrawColor(220, 220, 220);
  doc.line(marginLeft, 38, pageWidth - marginRight, 38);

  // Party Name
  doc.setFontSize(11);
  const partyText = state.partyName ? `Party Name: ${state.partyName}` : 'Party Name: _______________________';
  doc.text(partyText, marginLeft, 48);

  let imageMap: Record<string, boolean> = {};
  try {
    const res = await fetch('/image-map.json');
    imageMap = await res.json();
  } catch (e) {}

  const loadedImages = new Map<string, HTMLImageElement>();
  for (const item of state.items) {
    if (item.customImageBase64 && !loadedImages.has(item.id)) {
      try {
        const img = new Image();
        img.src = item.customImageBase64;
        await new Promise((r) => { img.onload = r; img.onerror = r; });
        loadedImages.set(item.id, img);
      } catch (e) {}
    } else if (item.familyId && imageMap[item.familyId] && !loadedImages.has(item.familyId)) {
      try {
        const img = new Image();
        img.src = `/product-images/${item.familyId}.webp`;
        await new Promise((r) => { img.onload = r; img.onerror = r; });
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
    startY: 55,
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

export async function generatePDFBlob(state: QuotationState, grandTotal: number): Promise<Blob> {
  const doc = new jsPDF();

  const loadImageWithWhiteBg = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 1.0));
        } else {
          resolve(url);
        }
      };
      img.onerror = (e) => reject(e);
    });
  };

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 14;
  const marginRight = 14;

  let logoOffset = 0;
  try {
    const logoData = await loadImageWithWhiteBg('/logo.webp');
    doc.addImage(logoData, 'JPEG', marginLeft, 12, 24, 24);
    logoOffset = 28;
  } catch (e) {}

  const textStartX = marginLeft + logoOffset;
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SHREE GANESH HARDWARE', textStartX, 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Deals in: Paints, Pipes, Water Tanks, Putty, Plumbing, Sanitaryware', textStartX, 26);
  doc.text('Contact No: 98645-48325, 69015-58778', textStartX, 31);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', pageWidth - marginRight, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateText = state.date ? `Date: ${state.date}` : `Date: ${new Date().toLocaleDateString()}`;
  doc.text(dateText, pageWidth - marginRight, 28, { align: 'right' });
  doc.setDrawColor(220, 220, 220);
  doc.line(marginLeft, 38, pageWidth - marginRight, 38);
  doc.setFontSize(11);
  const partyText = state.partyName ? `Party Name: ${state.partyName}` : 'Party Name: _______________________';
  doc.text(partyText, marginLeft, 48);

  let imageMap: Record<string, boolean> = {};
  try {
    const res = await fetch('/image-map.json');
    imageMap = await res.json();
  } catch (e) {}

  const loadedImages = new Map<string, HTMLImageElement>();
  for (const item of state.items) {
    if (item.customImageBase64 && !loadedImages.has(item.id)) {
      try {
        const img = new Image();
        img.src = item.customImageBase64;
        await new Promise((r) => { img.onload = r; img.onerror = r; });
        loadedImages.set(item.id, img);
      } catch (e) {}
    } else if (item.familyId && imageMap[item.familyId] && !loadedImages.has(item.familyId)) {
      try {
        const img = new Image();
        img.src = `/product-images/${item.familyId}.webp`;
        await new Promise((r) => { img.onload = r; img.onerror = r; });
        loadedImages.set(item.familyId, img);
      } catch (e) {}
    }
  }

  const hasImages = loadedImages.size > 0;
  const tableData = state.items.map((item, index) => {
    const discPrice = typeof item.discountedPrice === 'number' ? item.discountedPrice.toFixed(2) : '-';
    const qty = typeof item.quantity === 'number' ? item.quantity.toString() : '-';
    const lineTotal = (typeof item.discountedPrice === 'number' && typeof item.quantity === 'number') 
      ? Math.round(item.discountedPrice * item.quantity).toFixed(2) 
      : '-';
    const productCell = item.subtitle ? `${item.name}\n(${item.subtitle})` : item.name;
    const row = [(index + 1).toString()];
    if (hasImages) row.push('');
    row.push(productCell, discPrice, qty, lineTotal);
    return row;
  });

  const headRow = ['#'];
  if (hasImages) headRow.push('Img');
  headRow.push('Product', 'Price', 'Qty', 'Total');

  const columnStyles: any = { 0: { halign: 'center', cellWidth: 10 } };
  let colIdx = 1;
  if (hasImages) columnStyles[colIdx++] = { halign: 'center', cellWidth: 15 };
  columnStyles[colIdx++] = { halign: 'left' };
  columnStyles[colIdx++] = { halign: 'right', cellWidth: 22 };
  columnStyles[colIdx++] = { halign: 'center', cellWidth: 12 };
  columnStyles[colIdx++] = { halign: 'right', cellWidth: 25 };

  autoTable(doc, {
    startY: 55,
    rowPageBreak: 'avoid',
    head: [headRow],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles,
    styles: { fontSize: 10, cellPadding: 3, valign: 'middle', minCellHeight: 16 },
    didDrawCell: function (data) {
      if (hasImages && data.section === 'body' && data.column.index === 1) {
        const item = state.items[data.row.index];
        if (item) {
          const img = item.customImageBase64 ? loadedImages.get(item.id) : (item.familyId ? loadedImages.get(item.familyId) : undefined);
          if (img) {
            const dim = 12;
            const x = data.cell.x + (data.cell.width - dim) / 2;
            const y = data.cell.y + (data.cell.height - dim) / 2;
            doc.addImage(img, 'JPEG', x, y, dim, dim);
          }
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const grandTotalText = `Grand Total: Rs. ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  doc.text(grandTotalText, pageWidth - marginRight, finalY, { align: 'right' });

  return doc.output('blob');
}
