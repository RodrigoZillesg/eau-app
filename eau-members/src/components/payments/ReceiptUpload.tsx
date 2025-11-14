import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Label } from '../ui/Label';
import { StorageService } from '../../lib/supabase/storage';
import { showNotification } from '../../lib/notifications';

export interface ReceiptUploadProps {
  registrationId: string;
  receiptUrl: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

/**
 * ReceiptUpload Component
 *
 * Handles file upload for payment receipts with validation and preview.
 * Supports PDF, JPG, and PNG files up to 5MB.
 *
 * @example
 * ```tsx
 * <ReceiptUpload
 *   registrationId={registration.id}
 *   receiptUrl={payment.receipt_url}
 *   onChange={(url) => updatePayment('receipt_url', url)}
 * />
 * ```
 */
export function ReceiptUpload({
  registrationId,
  receiptUrl,
  onChange,
  disabled = false,
  required = false,
  error,
  className = ''
}: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('error', 'Only PDF, JPG, and PNG files are allowed');
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'File size must be less than 5MB');
      e.target.value = ''; // Reset input
      return;
    }

    setUploading(true);

    try {
      const publicUrl = await StorageService.uploadPaymentReceipt(registrationId, file);
      onChange(publicUrl);
      showNotification('success', 'Receipt uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      showNotification('error', error.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input for re-upload
    }
  };

  const handleRemove = () => {
    onChange('');
    showNotification('success', 'Receipt removed');
  };

  return (
    <div className={className}>
      <Label>
        Receipt
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="mt-1 space-y-2">
        {/* Upload button or current file */}
        {receiptUrl ? (
          <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-300 rounded-lg">
            <FileText className="w-5 h-5 text-gray-500" />
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm text-indigo-600 hover:text-indigo-700 truncate"
            >
              View Receipt
            </a>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-1 text-red-600 hover:text-red-700"
                title="Remove receipt"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <label
            className={`
              flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg
              transition-colors cursor-pointer
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50 hover:border-indigo-400'}
              ${error ? 'border-red-500' : 'border-gray-300'}
            `}
          >
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={disabled || uploading}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
            />
            <Upload className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-700">
              {uploading ? 'Uploading...' : 'Upload Receipt'}
            </span>
          </label>
        )}

        <p className="text-xs text-gray-500">
          PDF, JPG, or PNG (max 5MB)
        </p>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
