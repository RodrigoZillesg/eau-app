import { useState, useEffect } from 'react'
import { Input } from './Input'
import { Label } from './Label'
import { Loader2 } from 'lucide-react'

interface AddressData {
  address_line1?: string
  city?: string
  state?: string
  country?: string
}

interface AddressAutocompleteProps {
  postalCode: string
  onAddressChange: (address: AddressData) => void
  register: any
  errors?: any
}

export function AddressAutocomplete({ postalCode, onAddressChange, register }: AddressAutocompleteProps) {
  const [loading, setLoading] = useState(false)
  const [, setAddressData] = useState<AddressData>({})

  useEffect(() => {
    if (postalCode && postalCode.length >= 4) {
      fetchAddressData(postalCode)
    }
  }, [postalCode])

  const fetchAddressData = async (zipcode: string) => {
    if (!zipcode || zipcode.length < 4) return

    setLoading(true)
    try {
      let apiUrl = ''
      let response: Response
      let data: any

      // Australian postcode (4 digits)
      if (/^\d{4}$/.test(zipcode)) {
        apiUrl = `https://api.postcodes.io/postcodes/${zipcode}`
        try {
          response = await fetch(apiUrl)
          if (response.ok) {
            data = await response.json()
            if (data.result) {
              const address: AddressData = {
                city: data.result.admin_district || data.result.parish || '',
                state: data.result.country || data.result.region || '',
                country: 'Australia'
              }
              setAddressData(address)
              onAddressChange(address)
              return
            }
          }
        } catch (error) {
          console.warn('UK postcode API failed, trying alternative')
        }
        
        // Fallback for Australian postcodes
        const ausStates = {
          '1': 'NSW', '2': 'NSW', '3': 'VIC', '4': 'QLD', 
          '5': 'SA', '6': 'WA', '7': 'TAS', '0': 'NT'
        }
        const state = ausStates[zipcode[0] as keyof typeof ausStates] || 'NSW'
        const address: AddressData = {
          state: state,
          country: 'Australia'
        }
        setAddressData(address)
        onAddressChange(address)
        return
      }

      // US ZIP code (5 digits)
      if (/^\d{5}$/.test(zipcode)) {
        apiUrl = `http://api.zippopotam.us/us/${zipcode}`
        try {
          response = await fetch(apiUrl)
          if (response.ok) {
            data = await response.json()
            const address: AddressData = {
              city: data.places?.[0]?.['place name'] || '',
              state: data.places?.[0]?.['state abbreviation'] || '',
              country: 'United States'
            }
            setAddressData(address)
            onAddressChange(address)
            return
          }
        } catch (error) {
          console.warn('US ZIP API failed')
        }
      }

      // UK postcode (letters and numbers)
      if (/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(zipcode)) {
        apiUrl = `https://api.postcodes.io/postcodes/${zipcode.toUpperCase()}`
        try {
          response = await fetch(apiUrl)
          if (response.ok) {
            data = await response.json()
            if (data.result) {
              const address: AddressData = {
                city: data.result.admin_district || '',
                state: data.result.region || '',
                country: 'United Kingdom'
              }
              setAddressData(address)
              onAddressChange(address)
              return
            }
          }
        } catch (error) {
          console.warn('UK postcode API failed')
        }
      }

      // Brazilian CEP (8 digits or 5+3 with hyphen)
      const cleanCep = zipcode.replace(/\D/g, '')
      if (/^\d{8}$/.test(cleanCep)) {
        apiUrl = `https://viacep.com.br/ws/${cleanCep}/json/`
        try {
          response = await fetch(apiUrl)
          if (response.ok) {
            data = await response.json()
            if (!data.erro) {
              const address: AddressData = {
                address_line1: `${data.logradouro || ''}`.trim(),
                city: data.localidade || '',
                state: data.uf || '',
                country: 'Brazil'
              }
              setAddressData(address)
              onAddressChange(address)
              return
            }
          }
        } catch (error) {
          console.warn('Brazil CEP API failed')
        }
      }

      // If no API worked, just set the country based on postal code format
      let country = 'Australia' // Default
      if (/^\d{5}$/.test(zipcode)) country = 'United States'
      else if (/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(zipcode)) country = 'United Kingdom'
      else if (/^\d{8}$/.test(cleanCep)) country = 'Brazil'

      const fallbackAddress: AddressData = { country }
      setAddressData(fallbackAddress)
      onAddressChange(fallbackAddress)

    } catch (error) {
      console.error('Error fetching address data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Label htmlFor="address_line1">Address Line 1</Label>
          <div className="relative">
            <Input
              id="address_line1"
              {...register('address_line1')}
              placeholder="123 Main Street"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="address_line2">Address Line 2</Label>
          <Input
            id="address_line2"
            {...register('address_line2')}
            placeholder="Apartment 4B"
          />
        </div>

        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            {...register('city')}
            placeholder="Sydney"
          />
        </div>

        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            {...register('state')}
            placeholder="NSW"
          />
        </div>

        <div>
          <Label htmlFor="postal_code">Postal Code</Label>
          <Input
            id="postal_code"
            {...register('postal_code')}
            placeholder="2000"
          />
        </div>

        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            {...register('country')}
            placeholder="Australia"
          />
        </div>
      </div>
    </div>
  )
}