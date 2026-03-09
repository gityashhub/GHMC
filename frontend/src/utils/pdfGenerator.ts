import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { formatCurrency } from './formatCurrency';

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
  const text1 = 'GUJARAT HAZARDWEST';
  const text2 = 'MANAGEMENT CO.';
  doc.text(text1, 105, 15, { align: 'center' });
  doc.text(text2, 105, 23, { align: 'center' });

  // Underline heading with same green
  doc.setDrawColor(greenColor);
  doc.setLineWidth(0.5);
  const w1 = doc.getTextWidth(text1);
  const w2 = doc.getTextWidth(text2);
  doc.line(105 - w1 / 2, 16, 105 + w1 / 2, 16);
  doc.line(105 - w2 / 2, 24, 105 + w2 / 2, 24);
  doc.setDrawColor(blackColor); // Reset draw color

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
  const col3 = 105;
  const col4 = 130;

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
  const poDateFormatted = invoiceData.poDate ? format(new Date(invoiceData.poDate), 'dd.MM.yyyy') : '-';
  doc.text(poDateFormatted, col4 + 2, startY + 12);
  doc.line(10, startY + 14, 200, startY + 14);

  // Row 3
  doc.text('GST No.', col1 + 2, startY + 19);
  doc.text('24ABDFG3216E1ZZ', col2 + 2, startY + 19);
  doc.text('Vehicle No.', col3 + 2, startY + 19);
  doc.text(invoiceData.vehicleNo || '-', col4 + 2, startY + 19);
  doc.line(10, startY + 21, 200, startY + 21);

  // Row 4 (Custom Field)
  let currentGridBottom = 61;
  if (invoiceData.customKey || invoiceData.customValue) {
    doc.text(invoiceData.customKey || 'Custom Field', col1 + 2, startY + 26);
    doc.text(invoiceData.customValue || '-', col2 + 2, startY + 26);
    doc.line(10, startY + 28, 200, startY + 28);
    currentGridBottom = 68;
  }

  // Draw vertical lines for the grid
  doc.line(10, 40, 10, currentGridBottom); // Left border
  doc.line(35, 40, 35, currentGridBottom); // After Label 1 (Column for labels)

  // These middle lines should only go down to the 3rd row (y=61) if there's a custom row spanning across
  const middleLinesBottom = (invoiceData.customKey || invoiceData.customValue) ? 61 : currentGridBottom;
  doc.line(105, 40, 105, middleLinesBottom); // Middle vertical separator
  doc.line(130, 40, 130, middleLinesBottom); // After Label 2 (Column for PO/Vehicle)

  doc.line(200, 40, 200, currentGridBottom); // Right border

  // --- Billed To & Shipped To ---
  const addressY = currentGridBottom;
  const midX = 105;

  doc.setFont('helvetica', 'bold');
  doc.text('Billed to :', 12, addressY + 5);
  doc.text('Shipped to :', midX + 2, addressY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(invoiceData.customerName || '', 12, addressY + 10);
  doc.text(invoiceData.customerName || '', midX + 2, addressY + 10);

  doc.setFont('helvetica', 'normal');
  const customerAddress = invoiceData.customerAddress || 'Address not provided';
  const addressLines = doc.splitTextToSize(customerAddress, 90);
  doc.text(addressLines, 12, addressY + 15);
  doc.text(addressLines, midX + 2, addressY + 15);

  // GSTIN for customer (Positioned dynamically below address)
  if (invoiceData.customerGst) {
    const addressHeight = addressLines.length * 4.5; // Approximate line height
    const gstinY = addressY + 15 + addressHeight + 2;
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN: ${invoiceData.customerGst}`, 12, gstinY);
  }

  // Box for Billed/Shipped
  doc.rect(10, addressY, 190, 45); // Increased height from 35 to 45
  doc.line(midX, addressY, midX, addressY + 45); // Extended vertical separator

  // --- Item Table ---
  const tableStartY = addressY + 45;

  const tableHead = [['Sr. No.', 'Description of goods/service', 'HSN code', 'Qty.', 'Unit', 'Rate', 'Amount']];

  // --- Item Table Body ---
  const tableBody: any[] = [];
  const items = invoiceData.items || [];
  const hasManifests = items.some((m: any) => m.manifestNo);
  let nextSrNo = 1;

  if (hasManifests) {
    // 1. Processing Charges Header
    tableBody.push([
      { content: String(nextSrNo++), styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Processing charges', styles: { fontStyle: 'bold' } },
      '', '', '', '', ''
    ]);

    // General Notes as Sub-header
    if (invoiceData.description) {
      tableBody.push([
        '',
        invoiceData.description,
        '', '', '', '', ''
      ]);
    }

    // "Manifest nos." Label
    tableBody.push([
      '',
      'Manifest nos.',
      '', '', '', '', ''
    ]);

    // Individual Items (Manifests)
    items.forEach((item: any) => {
      // Show Manifest No as primary, only show description if specifically provided and distinct
      const displayDescription = [item.manifestNo, item.description]
        .filter((v, i, a) => v && a.indexOf(v) === i)
        .join('\n');

      tableBody.push([
        '',
        displayDescription || item.materialName || '',
        item.hsnCode || '999432',
        item.quantity ? Number(item.quantity).toLocaleString('en-IN') : '0',
        item.unit || '',
        item.rate ? formatCurrency(item.rate) : '0.00',
        item.amount ? formatCurrency(item.amount) : '0'
      ]);
    });
  } else {
    // MANUAL Mode
    items.forEach((item: any) => {
      tableBody.push([
        { content: String(nextSrNo++), styles: { halign: 'center' } },
        item.materialName || item.description || 'Processing Charges',
        item.hsnCode || '',
        item.quantity ? Number(item.quantity).toLocaleString('en-IN') : '0',
        item.unit || '',
        item.rate ? formatCurrency(item.rate) : '0.00',
        item.amount ? formatCurrency(item.amount) : '0'
      ]);
    });
  }

  // Next Sr. No. for Additional Charges
  const hasAdditionalChargesList = invoiceData.additionalChargesList && invoiceData.additionalChargesList.length > 0;
  const hasTotalAdditionalCharges = invoiceData.additionalCharges && Number(invoiceData.additionalCharges) > 0;

  if (hasAdditionalChargesList || hasTotalAdditionalCharges) {
    tableBody.push([
      { content: String(nextSrNo++), styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Additional Charges', styles: { fontStyle: 'bold' } },
      '', '', '', '', ''
    ]);

    if (hasAdditionalChargesList) {
      invoiceData.additionalChargesList.forEach((charge: any) => {
        tableBody.push([
          '',
          charge.description || charge.materialName || 'Additional Charge',
          '',
          charge.quantity ? Number(charge.quantity).toLocaleString('en-IN') : '',
          charge.unit || '',
          charge.rate ? formatCurrency(charge.rate) : '',
          formatCurrency(charge.amount || 0)
        ]);
      });
    } else if (hasTotalAdditionalCharges) {
      // Fallback for older data with only aggregate amount
      tableBody.push([
        '',
        invoiceData.additionalChargesDescription || 'Additional Charges',
        '',
        invoiceData.additionalChargesQuantity ? Number(invoiceData.additionalChargesQuantity).toLocaleString('en-IN') : '',
        invoiceData.additionalChargesUnit || '',
        invoiceData.additionalChargesRate ? formatCurrency(invoiceData.additionalChargesRate) : '',
        formatCurrency(invoiceData.additionalCharges)
      ]);
    }
  }

  // Add empty rows to fill space if needed, or just let autoTable handle it.

  // Calculate totals
  const baseSubTotal = Number(invoiceData.subTotal || 0);
  const additionalCharges = Number(invoiceData.additionalCharges || 0);
  const subTotal = baseSubTotal + additionalCharges;

  const cgst = Number(invoiceData.cgst || 0);
  const sgst = Number(invoiceData.sgst || 0);
  // Re-calculate grand total to ensure it matches the subtotal + taxes exactly including rounding
  const grandTotal = subTotal + Math.round(cgst) + Math.round(sgst);

  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: 'plain',
    margin: { left: 10, right: 10 },
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
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
  const totalQuantity = invoiceData.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);

  // Sub Total row
  doc.rect(10, finalY, 190, 6);
  doc.setFont('helvetica', 'bold');
  doc.text('Sub Total', 98, finalY + 4, { align: 'right' });

  // Total quantity calculation needs to include additional charges quantity if it's there
  const addChargesQuantity = Number(invoiceData.additionalChargesQuantity || 0);
  const addChargesListQuantity = (invoiceData.additionalChargesList || []).reduce((sum: number, c: any) => sum + (Number(c.quantity) || 0), 0);
  const finalTotalQuantity = totalQuantity + (addChargesListQuantity || addChargesQuantity);

  doc.text(finalTotalQuantity.toLocaleString('en-IN'), 130, finalY + 4, { align: 'center' });
  doc.text(formatCurrency(subTotal), 198, finalY + 4, { align: 'right' });
  // Vertical lines through Sub Total row
  doc.line(25, finalY, 25, finalY + 6);
  doc.line(100, finalY, 100, finalY + 6);
  doc.line(120, finalY, 120, finalY + 6);
  doc.line(140, finalY, 140, finalY + 6);
  doc.line(155, finalY, 155, finalY + 6);
  doc.line(175, finalY, 175, finalY + 6);
  finalY += 6;

  // CGST
  if (Number(cgst) > 0) {
    doc.rect(10, finalY, 190, 6);
    doc.setFont('helvetica', 'normal');
    // Determine Index for CGST/SGST if they exist
    doc.text('2', 17.5, finalY + 4, { align: 'center' });
    doc.text('CGST', 27, finalY + 4);
    doc.text(formatCurrency(Math.round(Number(cgst))), 198, finalY + 4, { align: 'right' });
    // Vertical lines through CGST row
    doc.line(25, finalY, 25, finalY + 6);
    doc.line(100, finalY, 100, finalY + 6);
    doc.line(120, finalY, 120, finalY + 6);
    doc.line(140, finalY, 140, finalY + 6);
    doc.line(155, finalY, 155, finalY + 6);
    doc.line(175, finalY, 175, finalY + 6);
    finalY += 6;
  }

  // SGST
  if (Number(sgst) > 0) {
    doc.rect(10, finalY, 190, 6);
    doc.setFont('helvetica', 'normal');
    doc.text(Number(cgst) > 0 ? '3' : '2', 17.5, finalY + 4, { align: 'center' });
    doc.text('SGST', 27, finalY + 4);
    doc.text(formatCurrency(Math.round(Number(sgst))), 198, finalY + 4, { align: 'right' });
    // Vertical lines through SGST row
    doc.line(25, finalY, 25, finalY + 6);
    doc.line(100, finalY, 100, finalY + 6);
    doc.line(120, finalY, 120, finalY + 6);
    doc.line(140, finalY, 140, finalY + 6);
    doc.line(155, finalY, 155, finalY + 6);
    doc.line(175, finalY, 175, finalY + 6);
    finalY += 6;
  }

  // Grand Total
  doc.rect(10, finalY, 190, 7);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total', 98, finalY + 5, { align: 'right' });
  doc.text(formatCurrency(grandTotal), 198, finalY + 5, { align: 'right' });
  // Vertical lines through Grand Total row
  doc.line(25, finalY, 25, finalY + 7);
  doc.line(100, finalY, 100, finalY + 7);
  doc.line(120, finalY, 120, finalY + 7);
  doc.line(140, finalY, 140, finalY + 7);
  doc.line(155, finalY, 155, finalY + 7);
  doc.line(175, finalY, 175, finalY + 7);
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
  const termsText = 'Terms & conditions';
  doc.text(termsText, 12, finalY + 5);
  const termsWidth = doc.getTextWidth(termsText);
  doc.line(12, finalY + 6, 12 + termsWidth, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('E & O.E', 12, finalY + 10);
  doc.text('1. Goods once sold will not be taken back.', 12, finalY + 15);
  doc.text('2. Interest @ 18% p.a. shall be charged if the payment is not made within the stipulated time.', 12, finalY + 20);
  doc.text('3. Subject to ‘Vadodara’ Jurisdiction only.', 12, finalY + 25);
  doc.text('We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.', 12, finalY + 31);

  finalY += 35;

  // --- Footer (Bank Details & Signature) ---
  const footerHeight = 40;
  doc.rect(10, finalY, 190, footerHeight);

  // Vertical separator
  doc.line(105, finalY, 105, finalY + footerHeight);

  // Bank Details (Left)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const bankText = 'Bank detail';
  doc.text(bankText, 12, finalY + 5);
  const bankWidth = doc.getTextWidth(bankText);
  doc.line(12, finalY + 6, 12 + bankWidth, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.text('Bank Name: The Kalupur Commercial Co-Op. Bank Ltd.', 12, finalY + 12);
  doc.text('Name: GUJARAT HAZARDWEST MANAGEMENT CO.', 12, finalY + 17);
  doc.text('Bank A/c No.: 02420101464', 12, finalY + 22);
  doc.text('IFSC Code: KCCB0VDD024', 12, finalY + 27);
  doc.text('Payment Terms: ', 12, finalY + 32);

  // Signature (Right)
  const centerX = 105 + (190 / 2); // Center of the right side (105 to 200)
  doc.setFontSize(8);
  doc.text('For GUJARAT HAZARDWEST MANAGEMENT CO.', 152.5, finalY + 6, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorised Signatory', 152.5, finalY + 36, { align: 'center' });

  // Bottom text removed as requested: This is computergenerated invoice
  // doc.text('This is computergenerated invoice', 105, finalY + footerHeight + 4, { align: 'center' });

  // Save PDF
  doc.save(`Invoice_${invoiceData.invoiceNo}.pdf`);

  // Return the blob for uploading
  return doc.output('blob');
};
