import { Invoice, Quote } from '../types/database.types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useProfileStore } from '../stores/profileStore';

// Add the missing type for jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateInvoicePDF = (invoice: Invoice): jsPDF => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Get company information from profile store
  const profile = useProfileStore.getState().profile || {
    company: 'CxTrack',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  };
  
  // Add company logo/header
  doc.setFontSize(20);
  doc.setTextColor(66, 70, 229); // Primary color
  doc.text('CXTRACK', 20, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Invoice', 20, 30);
  
  // Add invoice details
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  // Invoice number and dates
  doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, 40);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 20, 45);
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 50);
  
  // Status
  doc.setFontSize(10);
  let statusColor;
  switch(invoice.status) {
    case 'Paid':
      statusColor = [39, 174, 96]; // Green
      break;
    case 'Issued':
      statusColor = [41, 128, 185]; // Blue
      break;
    case 'Draft':
      statusColor = [149, 165, 166]; // Gray
      break;
    case 'Cancelled':
      statusColor = [192, 57, 43]; // Red
      break;
    case 'Disputed':
      statusColor = [142, 68, 173]; // Purple
      break;
    case 'Part paid':
      statusColor = [243, 156, 18]; // Orange
      break;
    case 'On hold':
      statusColor = [211, 84, 0]; // Dark orange
      break;
    default:
      statusColor = [149, 165, 166]; // Gray
  }
  
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`Status: ${invoice.status}`, 150, 40);
  doc.setTextColor(60, 60, 60);
  
  // Customer information
  doc.text('Bill To:', 20, 60);
  doc.text(invoice.customer_name, 20, 65);
  if (invoice.customer_email) {
    doc.text(invoice.customer_email, 20, 70);
  }
  if (invoice.customer_address) {
    const addressLines = invoice.customer_address.split('\n');
    addressLines.forEach((line, index) => {
      doc.text(line, 20, 75 + (index * 5));
    });
  }
  
  // Company information from profile
  doc.text('From:', 150, 60);
  doc.text(profile.company || 'CxTrack', 150, 65);
  doc.text(profile.phone || 'company@example.com', 150, 70);
  doc.text(profile.address || '123 Business Street', 150, 75);
  doc.text(`${profile.city || 'City'}, ${profile.state || 'State'} ${profile.zipCode || 'ZIP'}`, 150, 80);
  doc.text(profile.country || 'Country', 150, 85);
  
  // Invoice items table
  const tableColumn = ["Item", "Quantity", "Unit Price", "Total"];
  const tableRows = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `$${item.unit_price.toFixed(2)}`,
    `$${item.total.toFixed(2)}`
  ]);
  
  doc.autoTable({
    startY: 95,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Primary color
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    margin: { top: 95 }
  });
  
  // Calculate the Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Add totals
  doc.text('Subtotal:', 130, finalY);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 170, finalY);
  
  // Display tax rate and tax amount
  const taxRatePercent = (invoice.tax_rate * 100).toFixed(2);
  doc.text(`Tax (${taxRatePercent}%):`, 130, finalY + 5);
  doc.text(`$${invoice.tax.toFixed(2)}`, 170, finalY + 5);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 130, finalY + 15);
  doc.text(`$${invoice.total.toFixed(2)}`, 170, finalY + 15);
  
  // Add notes if any
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Notes:', 20, finalY + 30);
    doc.text(invoice.notes, 20, finalY + 35);
  }
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Thank you for your business!',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc;
};

export const generateQuotePDF = (quote: Quote): jsPDF => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Get company information from profile store
  const profile = useProfileStore.getState().profile || {
    company: 'CxTrack',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  };
  
  // Add company logo/header
  doc.setFontSize(20);
  doc.setTextColor(66, 70, 229); // Primary color
  doc.text('CXTRACK', 20, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Quote', 20, 30);
  
  // Add quote details
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  // Quote number and dates
  doc.text(`Quote Number: ${quote.quote_number}`, 20, 40);
  doc.text(`Date: ${new Date(quote.date).toLocaleDateString()}`, 20, 45);
  doc.text(`Expiry Date: ${new Date(quote.expiry_date).toLocaleDateString()}`, 20, 50);
  
  // Status
  doc.setFontSize(10);
  let statusColor;
  switch(quote.status) {
    case 'Sent':
      statusColor = [41, 128, 185]; // Blue
      break;
    case 'Accepted':
      statusColor = [39, 174, 96]; // Green
      break;
    case 'Declined':
      statusColor = [192, 57, 43]; // Red
      break;
    case 'Expired':
      statusColor = [243, 156, 18]; // Orange
      break;
    default:
      statusColor = [149, 165, 166]; // Gray
  }
  
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`Status: ${quote.status}`, 150, 40);
  doc.setTextColor(60, 60, 60);
  
  // Customer information
  doc.text('To:', 20, 60);
  doc.text(quote.customer_name, 20, 65);
  if (quote.customer_email) {
    doc.text(quote.customer_email, 20, 70);
  }
  if (quote.customer_address) {
    const addressLines = quote.customer_address.split('\n');
    addressLines.forEach((line, index) => {
      doc.text(line, 20, 75 + (index * 5));
    });
  }
  
  // Company information from profile
  doc.text('From:', 150, 60);
  doc.text(profile.company || 'CxTrack', 150, 65);
  doc.text(profile.phone || 'company@example.com', 150, 70);
  doc.text(profile.address || '123 Business Street', 150, 75);
  doc.text(`${profile.city || 'City'}, ${profile.state || 'State'} ${profile.zipCode || 'ZIP'}`, 150, 80);
  doc.text(profile.country || 'Country', 150, 85);
  
  // Quote items table
  const tableColumn = ["Item", "Quantity", "Unit Price", "Total"];
  const tableRows = quote.items.map(item => [
    item.description,
    item.quantity.toString(),
    `$${item.unit_price.toFixed(2)}`,
    `$${item.total.toFixed(2)}`
  ]);
  
  doc.autoTable({
    startY: 95,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Primary color
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    margin: { top: 95 }
  });
  
  // Calculate the Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Add totals
  doc.text('Subtotal:', 130, finalY);
  doc.text(`$${quote.subtotal.toFixed(2)}`, 170, finalY);
  
  // Display tax rate and tax amount
  const taxRatePercent = (quote.tax_rate * 100).toFixed(2);
  doc.text(`Tax (${taxRatePercent}%):`, 130, finalY + 5);
  doc.text(`$${quote.tax.toFixed(2)}`, 170, finalY + 5);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 130, finalY + 15);
  doc.text(`$${quote.total.toFixed(2)}`, 170, finalY + 15);
  
  // Add message if any
  if (quote.message) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Message:', 20, finalY + 30);
    doc.text(quote.message, 20, finalY + 35);
  }
  
  // Add notes if any
  if (quote.notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Notes:', 20, finalY + 45);
    doc.text(quote.notes, 20, finalY + 50);
  }
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'Thank you for considering our services!',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc;
};

export const downloadInvoicePDF = (invoice: Invoice): void => {
  const doc = generateInvoicePDF(invoice);
  doc.save(`Invoice-${invoice.invoice_number}.pdf`);
};

export const downloadQuotePDF = (quote: Quote): void => {
  const doc = generateQuotePDF(quote);
  doc.save(`Quote-${quote.quote_number}.pdf`);
};

export const printInvoicePDF = (invoice: Invoice): void => {
  const doc = generateInvoicePDF(invoice);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

export const printQuotePDF = (quote: Quote): void => {
  const doc = generateQuotePDF(quote);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};