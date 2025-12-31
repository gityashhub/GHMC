import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Helper to convert number to words (Indian numbering system)
const numberToWords = (num: number): string => {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num.toString().length > 9) return 'overflow';
  
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';

  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  
  return str.trim();
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

export const generateInvoicePDF = async (invoiceData: any) => {
  const doc = new jsPDF();
  
  // Colors
  const greenColor = '#2E7D32'; // Approximate green from logo
  const blackColor = '#000000';

  // --- Header ---
  // Logo
  try {
    const logoUrl = '/logo.png';
    const logoImg = await loadImage(logoUrl);
    // Add logo at top left
    doc.addImage(logoImg, 'PNG', 10, 5, 25, 20);
  } catch (error) {
    console.warn('Logo loading failed', error);
  }

  doc.setTextColor(greenColor);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('GUJARAT HAZARDWEST', 105, 15, { align: 'center' });
  doc.text('MANAGEMENT CO.', 105, 23, { align: 'center' });

  // Address
  doc.setTextColor(blackColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Plot No. 586, near LDH food agro, mokshi, Ta-savli, Dist.- Vadodara -391775', 105, 30, { align: 'center' });
  
  // Add a small truck icon or symbol if possible, otherwise just text. 
  // The image has a truck icon. I'll skip it for now.

  // Line below header
  doc.setLineWidth(0.5);
  doc.line(10, 32, 200, 32);

  // --- Title ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 105, 38, { align: 'center' });
  doc.line(10, 40, 200, 40);

  // --- Invoice Details Grid ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const startY = 40;
  const col1 = 10;
  const col2 = 35;
  const col3 = 110;
  const col4 = 135;

  // Row 1
  doc.text('Inv. No.', col1 + 2, startY + 5);
  doc.text(invoiceData.invoiceNo || '-', col2 + 2, startY + 5);
  doc.text('PO. No.', col3 + 2, startY + 5);
  doc.text(invoiceData.poNo || 'On Call', col4 + 2, startY + 5);
  doc.line(10, startY + 7, 200, startY + 7);

  // Row 2
  doc.text('Inv. Date', col1 + 2, startY + 12);
  doc.text(invoiceData.date ? format(new Date(invoiceData.date), 'dd.MM.yyyy') : '-', col2 + 2, startY + 12);
  doc.text('Po. Date', col3 + 2, startY + 12);
  doc.text(invoiceData.poDate || '-', col4 + 2, startY + 12);
  doc.line(10, startY + 14, 200, startY + 14);

  // Row 3
  doc.text('GST No.', col1 + 2, startY + 19);
  doc.text('24ABDFG3216E1ZZ', col2 + 2, startY + 19);
  doc.text('Vehical No.', col3 + 2, startY + 19);
  doc.text(invoiceData.vehicleNo || '-', col4 + 2, startY + 19);
  doc.line(10, startY + 21, 200, startY + 21);

  // Draw vertical lines for the grid
  doc.line(10, 40, 10, 61); // Left border
  doc.line(35, 40, 35, 61); // After Label 1
  doc.line(110, 40, 110, 61); // Middle
  doc.line(135, 40, 135, 61); // After Label 2
  doc.line(200, 40, 200, 61); // Right border

  // --- Billed To & Shipped To ---
  const addressY = 61;
  const midX = 105;

  doc.setFont('helvetica', 'bold');
  doc.text('Billed to :', 12, addressY + 5);
  doc.text('Shipped to :', midX + 2, addressY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(invoiceData.customerName || '', 12, addressY + 10);
  doc.text(invoiceData.customerName || '', midX + 2, addressY + 10);

  doc.setFont('helvetica', 'normal');
  const addressLines = doc.splitTextToSize(invoiceData.customerAddress || 'Address not provided', 90);
  doc.text(addressLines, 12, addressY + 15);
  doc.text(addressLines, midX + 2, addressY + 15);

  // GSTIN for customer
  if (invoiceData.customerGst) {
      doc.setFont('helvetica', 'bold');
      doc.text(`GSTIN: ${invoiceData.customerGst}`, 12, addressY + 30); // Adjust Y based on address length
  }

  // Box for Billed/Shipped
  doc.rect(10, 61, 190, 35); // Outer box
  doc.line(midX, 61, midX, 96); // Vertical separator

  // --- Item Table ---
  const tableStartY = 96;

  const tableHead = [['Sr. No.', 'Description of goods/service', 'HSN code', 'Qty.', 'Unit', 'Rate', 'Amount']];
  
  const tableBody = invoiceData.items.map((item: any, index: number) => [
    index + 1,
    { content: item.description + (item.subDescription ? '\n' + item.subDescription : ''), styles: { fontStyle: 'bold' } },
    item.hsnCode || '999432',
    item.quantity,
    item.unit,
    Number(item.rate).toFixed(2),
    Number(item.amount).toLocaleString('en-IN')
  ]);

  // Add empty rows to fill space if needed, or just let autoTable handle it.
  
  // Calculate totals
  const subTotal = invoiceData.subTotal;
  const cgst = invoiceData.cgst;
  const sgst = invoiceData.sgst;
  const grandTotal = invoiceData.grandTotal;

  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fontStyle: 'bold',
      halign: 'center',
      fillColor: [255, 255, 255]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 15 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 25 }
    },
    didDrawPage: (data) => {
      // Optional: Header/Footer on each page
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY;

  // --- Totals ---
  // Sub Total
  doc.rect(10, finalY, 190, 6);
  doc.setFont('helvetica', 'bold');
  doc.text('Sub Total', 140, finalY + 4);
  doc.text(Number(subTotal).toLocaleString('en-IN'), 198, finalY + 4, { align: 'right' });
  finalY += 6;

  // CGST
  doc.rect(10, finalY, 190, 6);
  doc.setFont('helvetica', 'normal');
  doc.text('CGST (9%)', 12, finalY + 4);
  doc.text(Number(cgst).toLocaleString('en-IN'), 198, finalY + 4, { align: 'right' });
  finalY += 6;

  // SGST
  doc.rect(10, finalY, 190, 6);
  doc.text('SGST (9%)', 12, finalY + 4);
  doc.text(Number(sgst).toLocaleString('en-IN'), 198, finalY + 4, { align: 'right' });
  finalY += 6;

  // Grand Total
  doc.rect(10, finalY, 190, 7);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total', 140, finalY + 5);
  doc.text(Number(grandTotal).toLocaleString('en-IN'), 198, finalY + 5, { align: 'right' });
  finalY += 7;

  // --- Amount in Words ---
  doc.rect(10, finalY, 190, 8);
  doc.setFont('helvetica', 'bold');
  doc.text('In Words: ', 12, finalY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${numberToWords(Math.round(grandTotal))} Only`, 35, finalY + 5);
  finalY += 8;

  // --- Terms & Conditions ---
  doc.rect(10, finalY, 190, 35);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & conditions', 12, finalY + 5);
  doc.line(10, finalY + 6, 110, finalY + 6); // Underline title partially

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('1. E.& O.E', 12, finalY + 10);
  doc.text('2. Subjected to vadodara juridiction', 12, finalY + 15);
  doc.text('3. Company\'s PAN: ABDFG3216E', 12, finalY + 20);
  doc.text('We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.', 12, finalY + 30);
  
  finalY += 35;

  // --- Footer (Bank Details & Signature) ---
  const footerHeight = 40;
  doc.rect(10, finalY, 190, footerHeight);
  
  // Vertical separator
  doc.line(110, finalY, 110, finalY + footerHeight);

  // Bank Details (Left)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank detail', 12, finalY + 5);
  doc.line(12, finalY + 6, 30, finalY + 6); // Underline

  doc.setFont('helvetica', 'normal');
  doc.text('Bank Name: The Kalupur Commercial Co-Op. Bank Ltd.', 12, finalY + 12);
  doc.text('Name: GUJARAT HAZARDWEST MANAGEMENT CO.', 12, finalY + 17);
  doc.text('Bank A/c No.: 02420101464', 12, finalY + 22);
  doc.text('IFSC Code: KCCB0VDD024', 12, finalY + 27);
  doc.text('Payment Terms: Immediate', 12, finalY + 32);

  // Signature (Right)
  doc.setFontSize(8);
  doc.text('For GUJARAT HAZARDWEST MANAGEMENT CO.', 112, finalY + 5);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SHIVRAJSINH', 112, finalY + 15);
  doc.text('RAYSANGJI', 112, finalY + 22);
  doc.text('GOHIL', 112, finalY + 29);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Autorised Signatory', 160, finalY + 35, { align: 'right' });

  // Bottom text
  doc.setFontSize(8);
  doc.text('This is computergenerated invoice', 105, finalY + footerHeight + 4, { align: 'center' });

  // Save PDF
  doc.save(`Invoice_${invoiceData.invoiceNo}.pdf`);
};
