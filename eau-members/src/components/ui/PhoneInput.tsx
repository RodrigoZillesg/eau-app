import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Country {
  code: string
  name: string
  flag: string
  dialCode: string
  format: string
  maxLength: number
}

const countries: Country[] = [
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', format: '### ### ###', maxLength: 9 },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', format: '(###) ###-####', maxLength: 10 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', format: '(##) #####-####', maxLength: 11 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', format: '#### ### ###', maxLength: 10 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', format: '(###) ###-####', maxLength: 10 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', format: '### ########', maxLength: 11 },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', format: '## ## ## ## ##', maxLength: 10 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', format: '##-####-####', maxLength: 11 },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', format: '### #### ####', maxLength: 11 },
]

interface PhoneInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function PhoneInput({ value = '', onChange, placeholder, disabled, className = '' }: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Parse current value to extract country code and number
  const getCurrentCountryAndNumber = (phoneValue: string) => {
    if (!phoneValue) return { country: countries[0], number: '' }
    
    const country = countries.find(c => phoneValue.startsWith(c.dialCode)) || countries[0]
    const number = phoneValue.replace(country.dialCode, '').replace(/\s/g, '')
    return { country, number }
  }

  const { country: selectedCountry, number: phoneNumber } = getCurrentCountryAndNumber(value)

  const formatPhoneNumber = (number: string, format: string, maxLength: number) => {
    // Remove all non-digits
    const digits = number.replace(/\D/g, '')
    
    // Limit to max length
    const limitedDigits = digits.slice(0, maxLength)
    
    // Apply format
    let formatted = ''
    let digitIndex = 0
    
    for (let i = 0; i < format.length && digitIndex < limitedDigits.length; i++) {
      if (format[i] === '#') {
        formatted += limitedDigits[digitIndex]
        digitIndex++
      } else {
        formatted += format[i]
      }
    }
    
    return formatted
  }

  const handleCountrySelect = (country: Country) => {
    const formattedNumber = formatPhoneNumber(phoneNumber, country.format, country.maxLength)
    onChange(`${country.dialCode} ${formattedNumber}`.trim())
    setIsOpen(false)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value
    const formattedNumber = formatPhoneNumber(newNumber, selectedCountry.format, selectedCountry.maxLength)
    onChange(`${selectedCountry.dialCode} ${formattedNumber}`.trim())
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Country Selector */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-2 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {isOpen && (
            <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto min-w-[280px]">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                  onClick={() => handleCountrySelect(country)}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="font-medium">{country.dialCode}</span>
                  <span className="text-gray-600">{country.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={formatPhoneNumber(phoneNumber, selectedCountry.format, selectedCountry.maxLength)}
          onChange={handleNumberChange}
          placeholder={placeholder || selectedCountry.format.replace(/#/g, '0')}
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}