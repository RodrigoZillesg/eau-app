import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, RefreshCw, Download } from 'lucide-react';
import { format } from 'date-fns';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number' | 'multiselect' | 'boolean';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
}

export interface FilterValues {
  [key: string]: any;
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  onFilterChange: (filters: FilterValues) => void;
  onSearch?: (searchText: string) => void;
  onExport?: () => void;
  onReset?: () => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showExport?: boolean;
  className?: string;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFilterChange,
  onSearch,
  onExport,
  onReset,
  searchPlaceholder = 'Search...',
  showSearch = true,
  showExport = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    // Count active filters
    const count = Object.entries(filterValues).filter(([_, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value !== '';
      if (typeof value === 'boolean') return true;
      return value != null;
    }).length;
    setActiveFiltersCount(count);
  }, [filterValues]);

  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...filterValues, [filterId]: value };
    setFilterValues(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchText);
    }
  };

  const handleReset = () => {
    setFilterValues({});
    setSearchText('');
    if (onReset) {
      onReset();
    } else {
      onFilterChange({});
      if (onSearch) {
        onSearch('');
      }
    }
  };

  const renderFilter = (filter: FilterConfig) => {
    const value = filterValues[filter.id];

    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={filter.placeholder || filter.label}
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
          />
        );

      case 'select':
        return (
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
          >
            <option value="">All {filter.label}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="relative">
            <div className="border border-gray-300 rounded-lg p-2 min-h-[42px]">
              {value && value.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {value.map((val: string) => {
                    const option = filter.options?.find(o => o.value === val);
                    return (
                      <span
                        key={val}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded"
                      >
                        {option?.label || val}
                        <button
                          type="button"
                          onClick={() => {
                            const newValue = value.filter((v: string) => v !== val);
                            handleFilterChange(filter.id, newValue);
                          }}
                          className="hover:text-indigo-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="text-gray-400">Select {filter.label}...</span>
              )}
            </div>
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto hidden group-hover:block">
              {filter.options?.map((option) => {
                const isSelected = value?.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={isSelected}
                      onChange={(e) => {
                        const currentValue = value || [];
                        const newValue = e.target.checked
                          ? [...currentValue, option.value]
                          : currentValue.filter((v: string) => v !== option.value);
                        handleFilterChange(filter.id, newValue);
                      }}
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
          />
        );

      case 'dateRange':
        return (
          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="From"
              value={value?.from || ''}
              onChange={(e) => handleFilterChange(filter.id, { ...value, from: e.target.value })}
            />
            <input
              type="date"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="To"
              value={value?.to || ''}
              onChange={(e) => handleFilterChange(filter.id, { ...value, to: e.target.value })}
            />
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={filter.placeholder || filter.label}
            value={value || ''}
            min={filter.min}
            max={filter.max}
            onChange={(e) => handleFilterChange(filter.id, e.target.value ? Number(e.target.value) : null)}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={value || false}
              onChange={(e) => handleFilterChange(filter.id, e.target.checked)}
            />
            <span className="text-sm text-gray-700">{filter.placeholder || filter.label}</span>
          </label>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Search Bar */}
      {showSearch && (
        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={searchPlaceholder}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Filters Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <Filter className="w-5 h-5" />
          <span className="font-medium">
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          )}
          {showExport && onExport && (
            <button
              type="button"
              onClick={onExport}
              className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Filters Grid */}
      {isExpanded && (
        <div className="p-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map((filter) => (
              <div key={filter.id} className="group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                {renderFilter(filter)}
              </div>
            ))}
          </div>

          {/* Quick Filters */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Quick filters:</span>
              <button
                type="button"
                onClick={() => {
                  const today = format(new Date(), 'yyyy-MM-dd');
                  handleFilterChange('date', today);
                }}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const date = new Date();
                  date.setDate(date.getDate() - 7);
                  handleFilterChange('dateRange', {
                    from: format(date, 'yyyy-MM-dd'),
                    to: format(new Date(), 'yyyy-MM-dd')
                  });
                }}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Last 7 days
              </button>
              <button
                type="button"
                onClick={() => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - 1);
                  handleFilterChange('dateRange', {
                    from: format(date, 'yyyy-MM-dd'),
                    to: format(new Date(), 'yyyy-MM-dd')
                  });
                }}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Last month
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};