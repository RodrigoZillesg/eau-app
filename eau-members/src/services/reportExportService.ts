import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { notifications } from '../lib/notifications';

interface ExportOptions {
  title?: string;
  filename?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  includeTimestamp?: boolean;
  includeMetadata?: boolean;
}

export class ReportExportService {
  /**
   * Export data to CSV format
   */
  static exportToCSV(data: any[], options: ExportOptions = {}): void {
    if (data.length === 0) {
      notifications.error('No data to export');
      return;
    }

    try {
      // Get headers from first row
      const headers = Object.keys(data[0]).join(',');

      // Convert data rows to CSV
      const rows = data.map(row =>
        Object.values(row).map(value => {
          // Handle special characters and commas in values
          if (value === null || value === undefined) return '';
          const strValue = String(value);
          if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        }).join(',')
      );

      // Combine headers and rows
      const csv = [headers, ...rows].join('\n');

      // Add BOM for UTF-8 support in Excel
      const BOM = '\uFEFF';
      const csvContent = BOM + csv;

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = this.generateFilename(options.filename || 'report', 'csv', options.includeTimestamp);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notifications.success('Report exported to CSV successfully');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      notifications.error('Failed to export report to CSV');
    }
  }

  /**
   * Export data to Excel format
   */
  static exportToExcel(data: any[], options: ExportOptions = {}): void {
    if (data.length === 0) {
      notifications.error('No data to export');
      return;
    }

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Convert data to worksheet
      const ws = XLSX.utils.json_to_sheet(data);

      // Auto-size columns
      const maxWidth = 50;
      const colWidths: number[] = [];

      // Calculate column widths based on content
      const headers = Object.keys(data[0]);
      headers.forEach((header, index) => {
        let maxLength = header.length;
        data.forEach(row => {
          const value = String(row[header] || '');
          maxLength = Math.max(maxLength, value.length);
        });
        colWidths[index] = Math.min(maxLength + 2, maxWidth);
      });

      ws['!cols'] = colWidths.map(width => ({ wch: width }));

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, options.title || 'Report');

      // Add metadata if requested
      if (options.includeMetadata) {
        const metadata = {
          Title: options.title || 'Report',
          Author: options.author || 'English Australia EAU System',
          Subject: options.subject || 'Exported Report',
          Keywords: options.keywords || 'report, data, export',
          Created: new Date().toISOString(),
          'Total Records': data.length
        };

        const metaWs = XLSX.utils.json_to_sheet([metadata]);
        XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');
      }

      // Generate and download file
      const filename = this.generateFilename(options.filename || 'report', 'xlsx', options.includeTimestamp);
      XLSX.writeFile(wb, filename);

      notifications.success('Report exported to Excel successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      notifications.error('Failed to export report to Excel');
    }
  }

  /**
   * Export data to PDF format
   */
  static exportToPDF(data: any[], options: ExportOptions = {}): void {
    if (data.length === 0) {
      notifications.error('No data to export');
      return;
    }

    try {
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Set document properties
      doc.setProperties({
        title: options.title || 'Report',
        author: options.author || 'English Australia EAU System',
        subject: options.subject || 'Exported Report',
        keywords: options.keywords || 'report, data, export',
        creator: 'EAU Report Builder'
      });

      // Add title
      doc.setFontSize(18);
      doc.setTextColor(0, 102, 51); // EA Green
      doc.text(options.title || 'Report', 14, 20);

      // Add generation date
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
      doc.text(`Total Records: ${data.length}`, 14, 33);

      // Prepare table data
      const headers = Object.keys(data[0]);
      const tableHeaders = headers.map(h => h.replace(/_/g, ' ').toUpperCase());
      const tableData = data.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (value instanceof Date) return new Date(value).toLocaleDateString();
          return String(value);
        })
      );

      // Add table
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 40,
        theme: 'striped',
        headStyles: {
          fillColor: [0, 102, 51], // EA Green
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 40, right: 14, bottom: 20, left: 14 },
        didDrawPage: (data: any) => {
          // Add footer on each page
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);
          const pageCount = doc.getNumberOfPages();
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );

          // Add English Australia branding
          doc.text(
            'English Australia - Membership Management System',
            14,
            doc.internal.pageSize.getHeight() - 10
          );
        }
      });

      // Save the PDF
      const filename = this.generateFilename(options.filename || 'report', 'pdf', options.includeTimestamp);
      doc.save(filename);

      notifications.success('Report exported to PDF successfully');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      notifications.error('Failed to export report to PDF');
    }
  }

  /**
   * Export data to JSON format
   */
  static exportToJSON(data: any[], options: ExportOptions = {}): void {
    if (data.length === 0) {
      notifications.error('No data to export');
      return;
    }

    try {
      // Create JSON structure with metadata
      const exportData = {
        metadata: {
          title: options.title || 'Report',
          generated: new Date().toISOString(),
          recordCount: data.length,
          author: options.author || 'English Australia EAU System'
        },
        data: data
      };

      // Convert to JSON string with formatting
      const json = JSON.stringify(exportData, null, 2);

      // Create and download file
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = this.generateFilename(options.filename || 'report', 'json', options.includeTimestamp);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notifications.success('Report exported to JSON successfully');
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      notifications.error('Failed to export report to JSON');
    }
  }

  /**
   * Generate filename with optional timestamp
   */
  private static generateFilename(base: string, extension: string, includeTimestamp?: boolean): string {
    const sanitized = base.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (includeTimestamp) {
      const timestamp = new Date().toISOString().split('T')[0];
      return `${sanitized}_${timestamp}.${extension}`;
    }

    return `${sanitized}.${extension}`;
  }

  /**
   * Export data in multiple formats at once
   */
  static exportAll(data: any[], formats: ('csv' | 'excel' | 'pdf' | 'json')[], options: ExportOptions = {}): void {
    if (data.length === 0) {
      notifications.error('No data to export');
      return;
    }

    formats.forEach(format => {
      switch (format) {
        case 'csv':
          this.exportToCSV(data, options);
          break;
        case 'excel':
          this.exportToExcel(data, options);
          break;
        case 'pdf':
          this.exportToPDF(data, options);
          break;
        case 'json':
          this.exportToJSON(data, options);
          break;
      }
    });
  }
}