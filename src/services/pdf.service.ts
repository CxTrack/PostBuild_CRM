import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote } from './quote.service';
import { Invoice } from './invoice.service';
import { formatPhoneDisplay } from '../utils/phone.utils';
import { getTermsLabel } from '../config/paymentTerms';

interface OrganizationInfo {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  template_color?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export const pdfService = {
  async generateQuotePDF(quote: Quote, organizationInfo: OrganizationInfo): Promise<void> {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Template color (default slate-600 if no template)
      const headerColor: [number, number, number] = organizationInfo.template_color
        ? hexToRgb(organizationInfo.template_color)
        : [71, 85, 105];

      // Logo
      let logoStartX = 15;
      if (organizationInfo.logo_url) {
        const logoBase64 = await fetchImageAsBase64(organizationInfo.logo_url);
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', 15, yPos - 5, 20, 20);
          logoStartX = 40;
        }
      }

      // Accent bar
      doc.setFillColor(...headerColor);
      doc.rect(0, 0, pageWidth, 3, 'F');

      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...headerColor);
      doc.text('QUOTE', pageWidth - 15, yPos, { align: 'right' });
      doc.setTextColor(0);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(organizationInfo.name, logoStartX, yPos);
      yPos += 5;

      doc.setFontSize(9);
      if (organizationInfo.address) {
        doc.text(organizationInfo.address, logoStartX, yPos);
        yPos += 4;
      }

      const cityStateLine = [
        organizationInfo.city,
        organizationInfo.state,
        organizationInfo.postal_code
      ].filter(Boolean).join(', ');

      if (cityStateLine) {
        doc.text(cityStateLine, logoStartX, yPos);
        yPos += 4;
      }

      if (organizationInfo.country) {
        doc.text(organizationInfo.country, logoStartX, yPos);
        yPos += 4;
      }

      if (organizationInfo.phone) {
        doc.text(formatPhoneDisplay(organizationInfo.phone), logoStartX, yPos);
        yPos += 4;
      }

      if (organizationInfo.email) {
        doc.text(organizationInfo.email, logoStartX, yPos);
        yPos += 4;
      }

      yPos = 45;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Quote Number:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(quote.quote_number, 50, yPos);

      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Date:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(quote.quote_date).toLocaleDateString(), 50, yPos);

      if (quote.expiry_date) {
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Valid Until:', 15, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date(quote.expiry_date).toLocaleDateString(), 50, yPos);
      }

      yPos = 45;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', pageWidth - 80, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(quote.customer_name, pageWidth - 80, yPos);

      if (quote.customer_email) {
        yPos += 5;
        doc.text(quote.customer_email, pageWidth - 80, yPos);
      }

      if (quote.customer_address) {
        yPos += 5;
        const addressLines = this.formatAddress(quote.customer_address);
        addressLines.forEach(line => {
          doc.text(line, pageWidth - 80, yPos);
          yPos += 5;
        });
      }

      yPos = 80;
      const tableData = quote.items.map(item => [
        item.product_name,
        item.description || '',
        item.quantity.toString(),
        `$${item.unit_price.toFixed(2)}`,
        item.discount_percentage ? `${item.discount_percentage}%` : '-',
        `$${item.line_total.toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Item', 'Description', 'Qty', 'Unit Price', 'Discount', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: headerColor, textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'center' },
          5: { halign: 'right' },
        },
        margin: { left: 15, right: 15 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;

      const totalsX = pageWidth - 70;
      let totalsY = finalY;

      doc.setFontSize(10);
      doc.text('Subtotal:', totalsX, totalsY);
      doc.text(`$${quote.subtotal.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
      totalsY += 6;

      if (quote.discount_amount && quote.discount_amount > 0) {
        doc.text('Discount:', totalsX, totalsY);
        doc.text(`-$${quote.discount_amount.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
        totalsY += 6;
      }

      doc.text('Tax:', totalsX, totalsY);
      doc.text(`$${quote.tax_amount.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
      totalsY += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Total:', totalsX, totalsY);
      doc.text(`$${quote.total_amount.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });

      if (quote.notes || quote.terms || quote.payment_terms) {
        totalsY += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        if (quote.payment_terms) {
          doc.text('Payment Terms:', 15, totalsY);
          totalsY += 5;
          doc.setFont('helvetica', 'normal');
          doc.text(quote.payment_terms, 15, totalsY);
          totalsY += 10;
        }

        if (quote.notes) {
          doc.setFont('helvetica', 'bold');
          doc.text('Notes:', 15, totalsY);
          totalsY += 5;
          doc.setFont('helvetica', 'normal');
          const noteLines = doc.splitTextToSize(quote.notes, pageWidth - 30);
          doc.text(noteLines, 15, totalsY);
          totalsY += noteLines.length * 5 + 5;
        }

        if (quote.terms) {
          doc.setFont('helvetica', 'bold');
          doc.text('Terms & Conditions:', 15, totalsY);
          totalsY += 5;
          doc.setFont('helvetica', 'normal');
          const termLines = doc.splitTextToSize(quote.terms, pageWidth - 30);
          doc.text(termLines, 15, totalsY);
        }
      }

      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      doc.save(`Quote-${quote.quote_number}.pdf`);
    } catch (error) {
      throw error;
    }
  },

  async generateInvoicePDF(invoice: Invoice, organizationInfo: OrganizationInfo, paymentLinkUrl?: string): Promise<void> {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Template color (default slate-600 if no template)
      const headerColor: [number, number, number] = organizationInfo.template_color
        ? hexToRgb(organizationInfo.template_color)
        : [71, 85, 105];

      // Logo
      let logoStartX = 15;
      if (organizationInfo.logo_url) {
        const logoBase64 = await fetchImageAsBase64(organizationInfo.logo_url);
        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', 15, yPos - 5, 20, 20);
          logoStartX = 40;
        }
      }

      // Accent bar
      doc.setFillColor(...headerColor);
      doc.rect(0, 0, pageWidth, 3, 'F');

      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...headerColor);
      doc.text('INVOICE', pageWidth - 15, yPos, { align: 'right' });
      doc.setTextColor(0);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(organizationInfo.name, logoStartX, yPos);
      yPos += 5;

      doc.setFontSize(9);
      if (organizationInfo.address) {
        doc.text(organizationInfo.address, logoStartX, yPos);
        yPos += 4;
      }

      const cityStateLine = [
        organizationInfo.city,
        organizationInfo.state,
        organizationInfo.postal_code
      ].filter(Boolean).join(', ');

      if (cityStateLine) {
        doc.text(cityStateLine, logoStartX, yPos);
        yPos += 4;
      }

      if (organizationInfo.country) {
        doc.text(organizationInfo.country, logoStartX, yPos);
        yPos += 4;
      }

      if (organizationInfo.phone) {
        doc.text(formatPhoneDisplay(organizationInfo.phone), logoStartX, yPos);
        yPos += 4;
      }

      if (organizationInfo.email) {
        doc.text(organizationInfo.email, logoStartX, yPos);
        yPos += 4;
      }

      yPos = 45;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Number:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.invoice_number, 55, yPos);

      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Date:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(invoice.invoice_date).toLocaleDateString(), 55, yPos);

      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Due Date:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(invoice.due_date).toLocaleDateString(), 55, yPos);

      yPos = 45;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', pageWidth - 80, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.customer_name, pageWidth - 80, yPos);

      if (invoice.customer_email) {
        yPos += 5;
        doc.text(invoice.customer_email, pageWidth - 80, yPos);
      }

      if (invoice.customer_address) {
        yPos += 5;
        const addressLines = this.formatAddress(invoice.customer_address);
        addressLines.forEach(line => {
          doc.text(line, pageWidth - 80, yPos);
          yPos += 5;
        });
      }

      yPos = 95;
      const tableData = invoice.items.map(item => [
        item.product_name,
        item.description || '',
        item.quantity.toString(),
        `$${item.unit_price.toFixed(2)}`,
        item.discount_percentage ? `${item.discount_percentage}%` : '-',
        `$${item.line_total.toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Item', 'Description', 'Qty', 'Unit Price', 'Discount', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: headerColor, textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'center' },
          5: { halign: 'right' },
        },
        margin: { left: 15, right: 15 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;

      const totalsX = pageWidth - 70;
      let totalsY = finalY;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', totalsX, totalsY);
      doc.text(`$${invoice.subtotal.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
      totalsY += 6;

      if (invoice.discount_amount && invoice.discount_amount > 0) {
        doc.text('Discount:', totalsX, totalsY);
        doc.text(`-$${invoice.discount_amount.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
        totalsY += 6;
      }

      doc.text('Tax:', totalsX, totalsY);
      doc.text(`$${invoice.tax_amount.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
      totalsY += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Total:', totalsX, totalsY);
      doc.text(`$${invoice.total_amount.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
      totalsY += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      if (invoice.amount_paid && invoice.amount_paid > 0) {
        doc.text('Amount Paid:', totalsX, totalsY);
        doc.text(`-$${invoice.amount_paid.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
        totalsY += 6;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Amount Due:', totalsX, totalsY);
      doc.text(`$${invoice.amount_due.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });

      // Payment link section for invoices
      if (paymentLinkUrl && invoice.status !== 'paid') {
        totalsY += 15;
        doc.setFillColor(...headerColor);
        doc.roundedRect(15, totalsY - 3, pageWidth - 30, 20, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255);
        doc.text('Pay Online', 25, totalsY + 5);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(paymentLinkUrl, 25, totalsY + 12);
        doc.setTextColor(0);
        totalsY += 20;
      }

      if (invoice.notes || invoice.terms || invoice.payment_terms) {
        totalsY += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        if (invoice.payment_terms) {
          doc.text('Payment Terms:', 15, totalsY);
          totalsY += 5;
          doc.setFont('helvetica', 'normal');
          doc.text(getTermsLabel(invoice.payment_terms), 15, totalsY);
          totalsY += 10;
        }

        if (invoice.notes) {
          doc.setFont('helvetica', 'bold');
          doc.text('Notes:', 15, totalsY);
          totalsY += 5;
          doc.setFont('helvetica', 'normal');
          const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 30);
          doc.text(noteLines, 15, totalsY);
          totalsY += noteLines.length * 5 + 5;
        }

        if (invoice.terms) {
          doc.setFont('helvetica', 'bold');
          doc.text('Terms & Conditions:', 15, totalsY);
          totalsY += 5;
          doc.setFont('helvetica', 'normal');
          const termLines = doc.splitTextToSize(invoice.terms, pageWidth - 30);
          doc.text(termLines, 15, totalsY);
        }
      }

      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      doc.save(`Invoice-${invoice.invoice_number}.pdf`);
    } catch (error) {
      throw error;
    }
  },

  formatAddress(address: any): string[] {
    if (!address) return [];

    // Handle JSON string
    if (typeof address === 'string') {
      try {
        const parsed = JSON.parse(address);
        if (typeof parsed === 'object' && parsed !== null) {
          return this.formatAddress(parsed);
        }
      } catch {
        // Not JSON, treat as plain string
        return [address];
      }
    }

    const lines: string[] = [];

    if (address.street) lines.push(address.street);
    if (address.street2) lines.push(address.street2);

    const cityStateLine = [address.city, address.state, address.postal_code]
      .filter(Boolean)
      .join(', ');
    if (cityStateLine) lines.push(cityStateLine);

    if (address.country) lines.push(address.country);

    return lines;
  },
};
