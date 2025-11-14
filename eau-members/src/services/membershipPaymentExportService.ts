import { supabase } from '../lib/supabase/client';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MembershipPaymentExport {
  institution_name: string;
  institution_code: string;
  membership_type: string;
  membership_status: string;
  payment_status: string;
  amount_cents: number;
  currency: string;
  payment_method: string | null;
  payment_date: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
}

/**
 * Membership Payment Export Service
 *
 * Handles exporting membership payment data to CSV and PDF formats.
 * Includes comprehensive payment details, institution info, and summaries.
 */
export class MembershipPaymentExportService {
  /**
   * Export all membership payments to CSV
   */
  static async exportToCSV(): Promise<void> {
    try {
      // Fetch payment data with institution details
      const { data, error } = await supabase
        .from('membership_payments')
        .select(`
          *,
          institutions (
            name,
            code,
            membership_type,
            membership_status,
            payment_status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No payment data available to export');
      }

      // Transform data for CSV
      const csvData = data.map((payment: any) => ({
        'Institution Name': payment.institutions?.name || 'N/A',
        'Institution Code': payment.institutions?.code || 'N/A',
        'Membership Type': payment.institutions?.membership_type || 'N/A',
        'Membership Status': payment.institutions?.membership_status || 'N/A',
        'Payment Status': payment.institutions?.payment_status || 'N/A',
        'Amount': `$${(payment.amount_cents / 100).toFixed(2)}`,
        'Currency': payment.currency,
        'Payment Method': payment.payment_method || 'N/A',
        'Payment Date': payment.payment_date
          ? format(new Date(payment.payment_date), 'dd/MM/yyyy')
          : 'N/A',
        'Reference': payment.payment_reference || 'N/A',
        'Notes': payment.notes || 'N/A',
        'Created Date': format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')
      }));

      // Generate CSV content
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map((row) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row];
              // Escape quotes and wrap in quotes if contains comma
              const escaped = String(value).replace(/"/g, '""');
              return escaped.includes(',') ? `"${escaped}"` : escaped;
            })
            .join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `membership-payments-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return Promise.resolve();
    } catch (error: any) {
      console.error('CSV export error:', error);
      throw new Error(`Failed to export to CSV: ${error.message}`);
    }
  }

  /**
   * Export all membership payments to PDF
   */
  static async exportToPDF(): Promise<void> {
    try {
      // Fetch payment data with institution details
      const { data, error } = await supabase
        .from('membership_payments')
        .select(`
          *,
          institutions (
            name,
            code,
            membership_type,
            membership_status,
            payment_status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No payment data available to export');
      }

      // Calculate summary statistics
      const totalPayments = data.length;
      const totalAmount = data.reduce((sum, p) => sum + p.amount_cents, 0) / 100;
      const institutionsWithPayments = new Set(data.map((p: any) => p.institution_id)).size;

      // Create PDF
      const doc = new jsPDF('landscape');

      // Header
      doc.setFontSize(18);
      doc.text('Membership Payments Report', 14, 20);

      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);

      // Summary box
      doc.setFontSize(11);
      doc.text('Summary:', 14, 38);
      doc.setFontSize(10);
      doc.text(`Total Payments: ${totalPayments}`, 14, 44);
      doc.text(`Total Amount: $${totalAmount.toFixed(2)} AUD`, 14, 50);
      doc.text(`Institutions: ${institutionsWithPayments}`, 14, 56);

      // Table data
      const tableData = data.map((payment: any) => [
        payment.institutions?.name || 'N/A',
        payment.institutions?.code || 'N/A',
        payment.institutions?.membership_type || 'N/A',
        `$${(payment.amount_cents / 100).toFixed(2)}`,
        payment.currency,
        payment.payment_method || 'N/A',
        payment.payment_date
          ? format(new Date(payment.payment_date), 'dd/MM/yyyy')
          : 'N/A',
        payment.payment_reference || 'N/A'
      ]);

      // Add table
      autoTable(doc, {
        startY: 65,
        head: [
          [
            'Institution',
            'Code',
            'Type',
            'Amount',
            'Currency',
            'Method',
            'Date',
            'Reference'
          ]
        ],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 65 }
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Download
      doc.save(`membership-payments-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);

      return Promise.resolve();
    } catch (error: any) {
      console.error('PDF export error:', error);
      throw new Error(`Failed to export to PDF: ${error.message}`);
    }
  }

  /**
   * Export payments for a specific institution to CSV
   */
  static async exportInstitutionPaymentsToCSV(institutionId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('membership_payments')
        .select(`
          *,
          institutions (
            name,
            code,
            membership_type
          )
        `)
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No payment data available for this institution');
      }

      const institutionName = data[0]?.institutions?.name || 'Unknown';

      const csvData = data.map((payment: any) => ({
        'Amount': `$${(payment.amount_cents / 100).toFixed(2)}`,
        'Currency': payment.currency,
        'Payment Method': payment.payment_method || 'N/A',
        'Payment Date': payment.payment_date
          ? format(new Date(payment.payment_date), 'dd/MM/yyyy')
          : 'N/A',
        'Reference': payment.payment_reference || 'N/A',
        'Notes': payment.notes || 'N/A',
        'Created': format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')
      }));

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map((row) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row];
              const escaped = String(value).replace(/"/g, '""');
              return escaped.includes(',') ? `"${escaped}"` : escaped;
            })
            .join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `${institutionName.replace(/\s+/g, '-')}-payments-${format(new Date(), 'yyyy-MM-dd')}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return Promise.resolve();
    } catch (error: any) {
      console.error('Institution CSV export error:', error);
      throw new Error(`Failed to export institution payments: ${error.message}`);
    }
  }
}
