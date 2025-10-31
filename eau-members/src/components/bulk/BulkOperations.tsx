import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, MinusSquare, Trash2, Download, Mail, Edit, UserCheck, XCircle, AlertTriangle } from 'lucide-react';
import { showNotification } from '../../lib/notifications';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: (selectedIds: string[]) => Promise<void>;
  confirmMessage?: string;
  variant?: 'default' | 'danger' | 'success';
  requireConfirmation?: boolean;
}

interface BulkOperationsProps {
  items: Array<{ id: string; [key: string]: any }>;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  actions: BulkAction[];
  isLoading?: boolean;
  className?: string;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  items,
  selectedIds,
  onSelectionChange,
  actions,
  isLoading = false,
  className = ''
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<BulkAction | null>(null);
  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null);

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length;
  const noneSelected = selectedIds.length === 0;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(item => item.id));
    }
  };

  const handleActionClick = async (action: BulkAction) => {
    if (selectedIds.length === 0) {
      showNotification('Please select at least one item', 'warning');
      return;
    }

    if (action.requireConfirmation) {
      setSelectedAction(action);
      setShowConfirmDialog(action);
    } else {
      await executeAction(action);
    }
  };

  const executeAction = async (action: BulkAction) => {
    try {
      setIsExecuting(true);
      await action.action(selectedIds);
      onSelectionChange([]);
      showNotification(`${action.label} completed for ${selectedIds.length} item(s)`, 'success');
    } catch (error) {
      console.error(`Error executing ${action.label}:`, error);
      showNotification(`Failed to ${action.label.toLowerCase()}`, 'error');
    } finally {
      setIsExecuting(false);
      setShowConfirmDialog(null);
      setSelectedAction(null);
    }
  };

  const getActionVariantClass = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      <div className={`flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm ${className}`}>
        <div className="flex items-center gap-4">
          {/* Select All Checkbox */}
          <button
            onClick={handleSelectAll}
            disabled={isLoading || isExecuting}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
            title={allSelected ? 'Deselect all' : someSelected ? 'Select all' : 'Select all'}
          >
            {allSelected ? (
              <CheckSquare className="w-5 h-5 text-indigo-600" />
            ) : someSelected ? (
              <MinusSquare className="w-5 h-5 text-indigo-400" />
            ) : (
              <Square className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              {allSelected
                ? `All ${items.length} selected`
                : someSelected
                ? `${selectedIds.length} selected`
                : 'Select all'}
            </span>
          </button>

          {/* Action Buttons */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 pl-4 border-l border-gray-300">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  disabled={isLoading || isExecuting}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    getActionVariantClass(action.variant)
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={action.label}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Count */}
        <div className="text-sm text-gray-500">
          {items.length} total item{items.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Action</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {showConfirmDialog.confirmMessage ||
                    `Are you sure you want to ${showConfirmDialog.label.toLowerCase()} ${selectedIds.length} item(s)?`}
                </p>
                {showConfirmDialog.variant === 'danger' && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    This action cannot be undone.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                disabled={isExecuting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedAction && executeAction(selectedAction)}
                disabled={isExecuting}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  getActionVariantClass(showConfirmDialog.variant)
                } disabled:opacity-50`}
              >
                {isExecuting ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Checkbox component for individual items
export const BulkCheckbox: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      disabled={disabled}
      className="p-1 hover:bg-gray-100 rounded transition-colors"
      aria-label={checked ? 'Deselect item' : 'Select item'}
    >
      {checked ? (
        <CheckSquare className="w-5 h-5 text-indigo-600" />
      ) : (
        <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
      )}
    </button>
  );
};