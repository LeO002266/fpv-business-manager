import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Quotation } from '../types.js';
import { formatCurrency, formatDate } from './api.js';

export function generateInvoicePDF(invoiceData: any) {
  const { invoice, items = [], payments = [] } = invoiceData;
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Header Background Accent
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 110, 'F');

  // Business Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(248, 250, 252);
  doc.text(invoice.org_name || 'AeroShots FPV & Media Productions', margin, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(invoice.org_address || 'Rajnagar Base, Durg District, Chhattisgarh', margin, 62);
  doc.text(`Phone: ${invoice.org_phone || '+91 98765 43210'} | Email: ${invoice.org_email || 'contact@aeroshotsfpv.com'}`, margin, 75);
  if (invoice.org_gstin) {
    doc.text(`GSTIN / Tax ID: ${invoice.org_gstin}`, margin, 88);
  }

  // Invoice Title Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('TAX INVOICE', pageWidth - margin, 50, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);
  doc.text(`Invoice #: ${invoice.invoice_number}`, pageWidth - margin, 70, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Date: ${formatDate(invoice.issue_date)}`, pageWidth - margin, 85, { align: 'right' });
  if (invoice.due_date) {
    doc.text(`Due: ${formatDate(invoice.due_date)}`, pageWidth - margin, 98, { align: 'right' });
  }

  // Bill To & Shoot Info Section
  const billTop = 135;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, billTop, pageWidth - (margin * 2), 75, 6, 6, 'F');

  // Left: Client Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text('BILLED TO:', margin + 15, billTop + 20);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.client_company || invoice.client_name, margin + 15, billTop + 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const contact = invoice.contact_person ? `Attn: ${invoice.contact_person}` : '';
  const addr = invoice.client_address ? `${invoice.client_address}, ${invoice.client_city || ''}` : '';
  doc.text(`${contact ? contact + ' | ' : ''}${invoice.client_phone || ''}`, margin + 15, billTop + 50);
  doc.text(addr || 'Location: Chhattisgarh, India', margin + 15, billTop + 63);

  // Right: Project Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text('PROJECT / SHOOT DETAILS:', pageWidth / 2 + 10, billTop + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Project: ${invoice.project_name || 'FPV Aerial Videography'}`, pageWidth / 2 + 10, billTop + 36);
  if (invoice.shoot_date) {
    doc.text(`Shoot Date: ${formatDate(invoice.shoot_date)}`, pageWidth / 2 + 10, billTop + 50);
  }
  if (invoice.project_location) {
    doc.text(`Location: ${invoice.project_location}`, pageWidth / 2 + 10, billTop + 63);
  }

  // Items Table
  const tableRows = items.map((item: any, index: number) => [
    index + 1,
    item.description,
    item.item_type === 'Travel_Reimbursement' ? 'Travel Reimbursement' : 'Service',
    item.quantity,
    formatCurrency(item.unit_price, invoice.currency),
    formatCurrency(item.amount, invoice.currency)
  ]);

  autoTable(doc, {
    startY: 230,
    head: [['#', 'Description', 'Category', 'Qty', 'Unit Rate', 'Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 110 },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 70, halign: 'right' },
      5: { cellWidth: 80, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;

  // Totals Breakdown Right
  const totalsX = pageWidth - margin - 220;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(totalsX, finalY, 220, 115, 6, 6, 'F');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', totalsX + 15, finalY + 20);
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - margin - 15, finalY + 20, { align: 'right' });

  if (Number(invoice.tax_amount) > 0) {
    doc.text(`Tax (${invoice.tax_percent}%):`, totalsX + 15, finalY + 38);
    doc.text(formatCurrency(invoice.tax_amount, invoice.currency), pageWidth - margin - 15, finalY + 38, { align: 'right' });
  }

  if (Number(invoice.discount_amount) > 0) {
    doc.text('Discount:', totalsX + 15, finalY + 54);
    doc.text(`-${formatCurrency(invoice.discount_amount, invoice.currency)}`, pageWidth - margin - 15, finalY + 54, { align: 'right' });
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(totalsX + 10, finalY + 62, pageWidth - margin - 10, finalY + 62);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Invoice:', totalsX + 15, finalY + 77);
  doc.text(formatCurrency(invoice.total_amount, invoice.currency), pageWidth - margin - 15, finalY + 77, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129); // green
  doc.text('Amount Received:', totalsX + 15, finalY + 93);
  doc.text(formatCurrency(invoice.amount_paid, invoice.currency), pageWidth - margin - 15, finalY + 93, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(225, 29, 72); // rose
  doc.text('Balance Due:', totalsX + 15, finalY + 108);
  doc.text(formatCurrency(invoice.balance_due, invoice.currency), pageWidth - margin - 15, finalY + 108, { align: 'right' });

  // Payment Details & Notes Left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('PAYMENT DETAILS & TERMS:', margin, finalY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('UPI ID: aeroshots@upi | Bank Transfer: HDFC Bank A/C: 50200012345678', margin, finalY + 35);
  doc.text('IFSC: HDFC0001234 | Account Name: AeroShots FPV Productions', margin, finalY + 48);

  if (invoice.notes) {
    doc.text(`Notes: ${invoice.notes}`, margin, finalY + 65, { maxWidth: totalsX - margin - 20 });
  }

  // Footer & Authorized Signatory
  const footerY = pageHeight - 60;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 15, pageWidth - margin, footerY - 15);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for choosing AeroShots FPV! This is a system-generated electronic invoice.', margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Authorized Signatory', pageWidth - margin, footerY, { align: 'right' });

  doc.save(`${invoice.invoice_number}.pdf`);
}
