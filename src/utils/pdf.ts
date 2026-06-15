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
    if (item.familyId && imageMap[item.familyId] && !loadedImages.has(item.familyId)) {
      try {
        const img = await loadImage(`/product-images/${item.familyId}.jpg`);
        loadedImages.set(item.familyId, img);
      } catch (e) {}
    }
  }

  // --- Table Section ---
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

    return [
      (index + 1).toString(),
      '', // Placeholder for Image
      productCell,
      discPrice,
      qty,
      lineTotal
    ];
  });

  autoTable(doc, {
    startY: 75,
    rowPageBreak: 'avoid', // Prevents rows from splitting across pages
    head: [['#', 'Img', 'Product', 'Price', 'Qty', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [40, 40, 40],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 15 }, // Img column
      2: { halign: 'left' },
      3: { halign: 'right', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'right', cellWidth: 25 },
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
      valign: 'middle',
      minCellHeight: 16, // Ensure cells are tall enough for images
    },
    didDrawCell: function (data) {
      // Draw image in column 1
      if (data.section === 'body' && data.column.index === 1) {
        const item = state.items[data.row.index];
        if (item && item.familyId) {
          const img = loadedImages.get(item.familyId);
          if (img) {
            const dim = 12; // 12x12 image
            const x = data.cell.x + (data.cell.width - dim) / 2;
            const y = data.cell.y + (data.cell.height - dim) / 2;
            doc.addImage(img, 'PNG', x, y, dim, dim);
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
