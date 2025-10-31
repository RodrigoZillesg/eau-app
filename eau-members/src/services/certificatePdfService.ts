import jsPDF from 'jspdf';

interface CertificateData {
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  certificateNumber: string;
  issueDate: string;
  cpdPoints?: number;
  cpdCategory?: string;
}

export class CertificatePdfService {
  /**
   * Generate a professional PDF certificate
   */
  static generatePDF(data: CertificateData): jsPDF {
    // Create new PDF document in landscape orientation
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Add border
    pdf.setDrawColor(0, 84, 159); // EA Blue
    pdf.setLineWidth(2);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Add inner border
    pdf.setLineWidth(0.5);
    pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Title - CERTIFICATE OF ATTENDANCE
    pdf.setFontSize(36);
    pdf.setTextColor(0, 84, 159); // EA Blue
    pdf.text('CERTIFICATE OF ATTENDANCE', pageWidth / 2, 40, { align: 'center' });

    // Subtitle
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text('This is to certify that', pageWidth / 2, 55, { align: 'center' });

    // Recipient Name
    pdf.setFontSize(28);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    pdf.text(data.recipientName, pageWidth / 2, 75, { align: 'center' });

    // Has attended
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text('has successfully attended', pageWidth / 2, 90, { align: 'center' });

    // Event Title
    pdf.setFontSize(22);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    // Split long titles if necessary
    const maxWidth = pageWidth - 60;
    const lines = pdf.splitTextToSize(data.eventTitle, maxWidth);
    let yPosition = 105;
    lines.forEach((line: string) => {
      pdf.text(line, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
    });

    // Event Date
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Date: ${data.eventDate}`, pageWidth / 2, yPosition + 5, { align: 'center' });

    // CPD Points (if applicable)
    if (data.cpdPoints && data.cpdPoints > 0) {
      yPosition += 15;
      pdf.setFontSize(16);
      pdf.setTextColor(0, 84, 159); // EA Blue
      pdf.setFont(undefined, 'bold');
      pdf.text(`CPD Points Awarded: ${data.cpdPoints}`, pageWidth / 2, yPosition, { align: 'center' });
      
      if (data.cpdCategory) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Category: ${data.cpdCategory}`, pageWidth / 2, yPosition + 7, { align: 'center' });
      }
    }

    // Footer Section
    const footerY = pageHeight - 45;

    // English Australia Logo Text (placeholder)
    pdf.setFontSize(18);
    pdf.setTextColor(0, 84, 159);
    pdf.setFont(undefined, 'bold');
    pdf.text('ENGLISH AUSTRALIA', pageWidth / 2, footerY, { align: 'center' });

    // Certificate details
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont(undefined, 'normal');
    
    // Left side - Certificate Number
    pdf.text(`Certificate No: ${data.certificateNumber}`, 30, footerY + 15);
    
    // Right side - Issue Date
    pdf.text(`Issue Date: ${data.issueDate}`, pageWidth - 30, footerY + 15, { align: 'right' });

    // Center - Verification note
    pdf.setFontSize(9);
    pdf.text('This certificate can be verified at eauapp.platty.tech', pageWidth / 2, footerY + 15, { align: 'center' });

    // Signature line (placeholder)
    const signatureY = footerY - 15;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    
    // Left signature line
    pdf.line(50, signatureY, 110, signatureY);
    pdf.setFontSize(10);
    pdf.text('Authorised Signature', 80, signatureY + 5, { align: 'center' });

    // Right signature line
    pdf.line(pageWidth - 110, signatureY, pageWidth - 50, signatureY);
    pdf.text('Date', pageWidth - 80, signatureY + 5, { align: 'center' });

    return pdf;
  }

  /**
   * Generate PDF and return as Blob
   */
  static generatePDFBlob(data: CertificateData): Blob {
    const pdf = this.generatePDF(data);
    return pdf.output('blob');
  }

  /**
   * Generate PDF and return as base64 string
   */
  static generatePDFBase64(data: CertificateData): string {
    const pdf = this.generatePDF(data);
    return pdf.output('datauristring').split(',')[1];
  }

  /**
   * Generate PDF and trigger download
   */
  static downloadPDF(data: CertificateData, filename?: string): void {
    const pdf = this.generatePDF(data);
    const defaultFilename = `certificate-${data.certificateNumber}.pdf`;
    pdf.save(filename || defaultFilename);
  }

  /**
   * Generate a sample certificate for testing
   */
  static generateSamplePDF(): jsPDF {
    return this.generatePDF({
      recipientName: 'John Smith',
      eventTitle: 'Professional Development Workshop: Innovative Teaching Methods in ESL',
      eventDate: '10 January 2025',
      certificateNumber: 'EA-2025-123456',
      issueDate: new Date().toLocaleDateString('en-AU'),
      cpdPoints: 2,
      cpdCategory: 'Attend English Australia PD event'
    });
  }
}