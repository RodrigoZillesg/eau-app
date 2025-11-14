import { useEffect, useState } from 'react';
import { History, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';
import { format } from 'date-fns';

interface PaymentHistoryEntry {
  id: string;
  action: 'created' | 'updated' | 'deleted';
  payment_data: any;
  changes: any;
  changed_at: string;
  changed_by_name: string | null;
  changed_by_email: string | null;
}

interface PaymentHistoryProps {
  institutionId: string;
}

/**
 * PaymentHistory Component
 *
 * Displays audit trail of all payment changes for an institution.
 * Shows who made changes, when, and what was changed.
 *
 * Features:
 * - Automatic refresh when payments change
 * - Color-coded action badges (created, updated, deleted)
 * - Detailed change tracking with before/after values
 * - User attribution with name and email
 * - Chronological timeline view
 */
export function PaymentHistory({ institutionId }: PaymentHistoryProps) {
  const [history, setHistory] = useState<PaymentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [institutionId]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('membership_payment_history_detailed')
        .select('*')
        .eq('institution_id', institutionId)
        .order('changed_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setHistory(data || []);
    } catch (err: any) {
      console.error('Error loading payment history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 text-green-800';
      case 'updated':
        return 'bg-blue-100 text-blue-800';
      case 'deleted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amountCents: number, currency: string = 'AUD') => {
    return `$${(amountCents / 100).toFixed(2)} ${currency}`;
  };

  const renderChanges = (entry: PaymentHistoryEntry) => {
    if (entry.action === 'created') {
      const data = entry.payment_data;
      return (
        <div className="text-sm text-gray-600 mt-2">
          Payment created: {formatCurrency(data.amount_cents, data.currency)}
          {data.payment_method && ` via ${data.payment_method.replace('_', ' ')}`}
        </div>
      );
    }

    if (entry.action === 'deleted') {
      const data = entry.payment_data;
      return (
        <div className="text-sm text-gray-600 mt-2">
          Payment deleted: {formatCurrency(data.amount_cents, data.currency)}
        </div>
      );
    }

    if (entry.action === 'updated' && entry.changes) {
      const old = entry.changes.old;
      const updated = entry.changes.new;
      const changedFields: string[] = [];

      // Check for amount changes
      if (old.amount_cents !== updated.amount_cents) {
        changedFields.push(
          `Amount: ${formatCurrency(old.amount_cents, old.currency)} → ${formatCurrency(updated.amount_cents, updated.currency)}`
        );
      }

      // Check for payment method changes
      if (old.payment_method !== updated.payment_method) {
        changedFields.push(
          `Method: ${old.payment_method || 'None'} → ${updated.payment_method || 'None'}`
        );
      }

      // Check for payment date changes
      if (old.payment_date !== updated.payment_date) {
        const oldDate = old.payment_date ? format(new Date(old.payment_date), 'dd/MM/yyyy') : 'None';
        const newDate = updated.payment_date ? format(new Date(updated.payment_date), 'dd/MM/yyyy') : 'None';
        changedFields.push(`Date: ${oldDate} → ${newDate}`);
      }

      // Check for reference changes
      if (old.payment_reference !== updated.payment_reference) {
        changedFields.push(
          `Reference: ${old.payment_reference || 'None'} → ${updated.payment_reference || 'None'}`
        );
      }

      return (
        <div className="text-sm text-gray-600 mt-2 space-y-1">
          {changedFields.map((change, idx) => (
            <div key={idx}>• {change}</div>
          ))}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800">Failed to load payment history</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No payment history available</p>
        <p className="text-sm text-gray-500 mt-1">Changes will appear here once payments are added or modified</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-gray-600" />
        <h4 className="font-semibold text-gray-900">Payment History</h4>
        <span className="text-sm text-gray-500">({history.length} events)</span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
          >
            {/* Header with action badge and timestamp */}
            <div className="flex items-center justify-between mb-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${getActionBadgeClass(
                  entry.action
                )}`}
              >
                {entry.action}
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(entry.changed_at), 'dd/MM/yyyy HH:mm:ss')}
              </span>
            </div>

            {/* User information */}
            {entry.changed_by_name && (
              <div className="text-sm text-gray-700 mb-2">
                <span className="font-medium">By:</span> {entry.changed_by_name}
                {entry.changed_by_email && (
                  <span className="text-gray-500"> ({entry.changed_by_email})</span>
                )}
              </div>
            )}

            {/* Changes details */}
            {renderChanges(entry)}
          </div>
        ))}
      </div>
    </div>
  );
}
