import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { showNotification } from '../lib/notifications';

export interface BulkOperationOptions {
  entity: 'members' | 'institutions' | 'events' | 'cpd_activities';
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useBulkOperations = (options: BulkOperationOptions) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      }
      return [...prev, id];
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  // Bulk Delete Operation
  const bulkDelete = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from(options.entity)
        .delete()
        .in('id', ids);

      if (error) throw error;

      showNotification(`Successfully deleted ${ids.length} item(s)`, 'success');
      clearSelection();
      options.onSuccess?.();
    } catch (error) {
      console.error('Bulk delete error:', error);
      showNotification('Failed to delete items', 'error');
      options.onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  }, [options, clearSelection]);

  // Bulk Update Operation
  const bulkUpdate = useCallback(async (ids: string[], updates: Record<string, any>) => {
    if (ids.length === 0) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from(options.entity)
        .update(updates)
        .in('id', ids);

      if (error) throw error;

      showNotification(`Successfully updated ${ids.length} item(s)`, 'success');
      clearSelection();
      options.onSuccess?.();
    } catch (error) {
      console.error('Bulk update error:', error);
      showNotification('Failed to update items', 'error');
      options.onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  }, [options, clearSelection]);

  // Bulk Export Operation
  const bulkExport = useCallback(async (ids: string[], format: 'csv' | 'json' = 'csv') => {
    if (ids.length === 0) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase
        .from(options.entity)
        .select('*')
        .in('id', ids);

      if (error) throw error;

      if (format === 'csv') {
        exportToCSV(data || [], options.entity);
      } else {
        exportToJSON(data || [], options.entity);
      }

      showNotification(`Exported ${ids.length} item(s)`, 'success');
    } catch (error) {
      console.error('Bulk export error:', error);
      showNotification('Failed to export items', 'error');
      options.onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  }, [options]);

  // Bulk Email Operation (for members)
  const bulkEmail = useCallback(async (ids: string[], template: string, subject: string) => {
    if (ids.length === 0) return;
    if (options.entity !== 'members') {
      showNotification('Email can only be sent to members', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      // Get member emails
      const { data: members, error } = await supabase
        .from('members')
        .select('email, first_name, last_name')
        .in('id', ids);

      if (error) throw error;

      // Send emails via backend
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/v1/email/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipients: members,
          template,
          subject
        })
      });

      if (!response.ok) throw new Error('Failed to send emails');

      showNotification(`Emails sent to ${ids.length} member(s)`, 'success');
      clearSelection();
      options.onSuccess?.();
    } catch (error) {
      console.error('Bulk email error:', error);
      showNotification('Failed to send emails', 'error');
      options.onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  }, [options, clearSelection]);

  // Helper function to export data as CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Helper function to export data as JSON
  const exportToJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Predefined bulk actions
  const defaultActions = useMemo(() => {
    const actions = [
      {
        id: 'export-csv',
        label: 'Export CSV',
        icon: null,
        action: (ids: string[]) => bulkExport(ids, 'csv'),
        requireConfirmation: false
      },
      {
        id: 'export-json',
        label: 'Export JSON',
        icon: null,
        action: (ids: string[]) => bulkExport(ids, 'json'),
        requireConfirmation: false
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: null,
        action: bulkDelete,
        variant: 'danger' as const,
        requireConfirmation: true,
        confirmMessage: 'This will permanently delete the selected items. This action cannot be undone.'
      }
    ];

    // Add entity-specific actions
    if (options.entity === 'members') {
      actions.unshift({
        id: 'send-email',
        label: 'Send Email',
        icon: null,
        action: async (ids: string[]) => {
          // This would open a modal for email composition
          showNotification('Email feature coming soon', 'info');
        },
        requireConfirmation: false
      });
    }

    if (options.entity === 'events') {
      actions.unshift(
        {
          id: 'publish',
          label: 'Publish',
          icon: null,
          action: (ids: string[]) => bulkUpdate(ids, { status: 'published' }),
          variant: 'success' as const,
          requireConfirmation: true
        },
        {
          id: 'unpublish',
          label: 'Unpublish',
          icon: null,
          action: (ids: string[]) => bulkUpdate(ids, { status: 'draft' }),
          requireConfirmation: true
        }
      );
    }

    if (options.entity === 'cpd_activities') {
      actions.unshift(
        {
          id: 'approve',
          label: 'Approve',
          icon: null,
          action: (ids: string[]) => bulkUpdate(ids, { status: 'approved', approved_at: new Date().toISOString() }),
          variant: 'success' as const,
          requireConfirmation: true
        },
        {
          id: 'reject',
          label: 'Reject',
          icon: null,
          action: (ids: string[]) => bulkUpdate(ids, { status: 'rejected' }),
          variant: 'danger' as const,
          requireConfirmation: true
        }
      );
    }

    return actions;
  }, [options.entity, bulkDelete, bulkUpdate, bulkExport]);

  return {
    selectedIds,
    setSelectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    isProcessing,
    bulkDelete,
    bulkUpdate,
    bulkExport,
    bulkEmail,
    defaultActions
  };
};