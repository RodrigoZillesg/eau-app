import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import './SearchableSelect.css'

interface Option {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  emptyMessage = 'No options found',
  className = '',
  disabled = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === value)
  const selectedLabel = selectedOption?.label || placeholder

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-white border rounded-lg
          flex items-center justify-between gap-2
          transition-colors
          ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-gray-400 cursor-pointer'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
          ${!selectedOption ? 'text-gray-500' : 'text-gray-900'}
        `}
      >
        <span className="truncate">{selectedLabel}</span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <X
              className="w-4 h-4 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto searchable-select-list">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-8 text-center text-gray-500 text-sm">
                {emptyMessage}
              </div>
            ) : (
              <ul className="py-1">
                {filteredOptions.map((option) => {
                  const isSelected = option.value === value
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={`
                          w-full px-3 py-2 text-left flex items-center justify-between gap-2
                          transition-colors
                          ${isSelected
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50 text-gray-900'
                          }
                        `}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer with count */}
          {filteredOptions.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
              {filteredOptions.length} of {options.length} {options.length === 1 ? 'option' : 'options'}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
