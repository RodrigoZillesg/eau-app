import { useEffect, useState } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showCurrencySelector?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  currency = 'AUD',
  onCurrencyChange,
  placeholder = '0.00',
  disabled = false,
  className = '',
  showCurrencySelector = false
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Format number to display with commas and 2 decimals
  const formatCurrency = (num: number): string => {
    if (num === 0) return '';
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parse display value to number
  const parseValue = (str: string): number => {
    const cleaned = str.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Update display when value prop changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Select all on focus for easy editing
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numericValue = parseValue(displayValue);
    setDisplayValue(formatCurrency(numericValue));
    onChange(numericValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Allow only numbers, comma, and one decimal point
    const cleaned = input.replace(/[^\d.,]/g, '');

    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    let formatted = parts[0];
    if (parts.length > 1) {
      // Keep only first 2 decimal places
      formatted = parts[0] + '.' + parts[1].substring(0, 2);
    }

    setDisplayValue(formatted);

    // Update parent with numeric value
    const numericValue = parseValue(formatted);
    onChange(numericValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      // Allow: home, end, left, right
      (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }

    // Ensure that it is a number or decimal point
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
        (e.keyCode < 96 || e.keyCode > 105) &&
        e.keyCode !== 190 && e.keyCode !== 110) {
      e.preventDefault();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 bg-white">
        {/* Currency Code/Selector */}
        {showCurrencySelector && onCurrencyChange ? (
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            disabled={disabled}
            className="px-4 py-3 bg-gray-50 border-r border-gray-300 rounded-l-lg text-sm font-semibold text-gray-700 focus:outline-none disabled:bg-gray-100"
          >
            <option value="AUD">AUD</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="NZD">NZD</option>
          </select>
        ) : (
          <div className="px-4 py-3 bg-gray-50 border-r border-gray-300 rounded-l-lg">
            <span className="text-sm font-semibold text-gray-700">{currency}</span>
          </div>
        )}

        {/* Amount Input */}
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-4 py-3 text-lg font-medium text-gray-900 bg-white rounded-r-lg focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      {/* Helper text */}
      <p className="mt-1 text-xs text-gray-500">
        Enter amount in {currency} (e.g., 25.00)
      </p>
    </div>
  );
}
