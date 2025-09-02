import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { PhoneInput } from '../../../components/ui/PhoneInput'
import { AddressAutocomplete } from '../../../components/ui/AddressAutocomplete'
import { supabase } from '../../../lib/supabase/client'
import { useAuthStore } from '../../../stores/authStore'
import { showNotification } from '../../../lib/notifications'
import { Loader2 } from 'lucide-react'

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  profession: z.string().optional(),
  experience_years: z.number().min(0).optional(),
  qualifications: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfileForm() {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const { user } = useAuthStore()
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  })

  // Watch postal code for address autocomplete
  const postalCode = watch('postal_code') || ''

  useEffect(() => {
    loadUserProfile()
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return
    
    try {
      setLoadingData(true)
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Load timeout')), 3000)
      )
      
      const queryPromise = supabase
        .from('members')
        .select('*')
        .eq('email', user.email)
        .single()
      
      let memberData = null
      let memberError = null
      
      try {
        const result = await Promise.race([queryPromise, timeoutPromise]) as { data: any, error: any }
        memberData = result.data
        memberError = result.error
      } catch (timeoutErr) {
        console.warn('Profile load timed out, using defaults')
        // Continue with empty data
      }

      if (memberError && memberError.code !== 'PGRST116') {
        console.error('Error loading member data:', memberError)
      }

      // Preencher o formulário com os dados do membro
      const formData = {
        email: user.email || '',
        first_name: memberData?.first_name || '',
        last_name: memberData?.last_name || '',
        phone: memberData?.phone || '',
        date_of_birth: memberData?.date_of_birth || '',
        address_line1: memberData?.address_line1 || '',
        address_line2: memberData?.address_line2 || '',
        city: memberData?.city || '',
        state: memberData?.state || '',
        postal_code: memberData?.postal_code || '',
        country: memberData?.country || 'Australia',
        profession: memberData?.profession || '',
        experience_years: memberData?.experience_years || 0,
        qualifications: memberData?.qualifications || '',
      }
      
      reset(formData)
      
      // Ensure phone and address fields are properly set for new components
      if (memberData?.phone) {
        setValue('phone', memberData.phone)
      }
      if (memberData?.address_line1) {
        setValue('address_line1', memberData.address_line1)
      }
      if (memberData?.city) {
        setValue('city', memberData.city)  
      }
      if (memberData?.state) {
        setValue('state', memberData.state)
      }
      if (memberData?.country) {
        setValue('country', memberData.country)
      }
      if (memberData?.postal_code) {
        setValue('postal_code', memberData.postal_code)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      showNotification('error', 'Error loading profile data')
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return

    try {
      setLoading(true)

      // Verificar se o membro existe pelo email
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('email', user.email)
        .single()

      const memberData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        date_of_birth: data.date_of_birth && data.date_of_birth !== '' ? data.date_of_birth : null,
        address_line1: data.address_line1 || null,
        address_line2: data.address_line2 || null,
        city: data.city || null,
        state: data.state || null,
        postal_code: data.postal_code || null,
        country: data.country || 'Australia',
        profession: data.profession || null,
        experience_years: data.experience_years ? Number(data.experience_years) : null,
        qualifications: data.qualifications || null,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      }

      if (existingMember) {
        // Atualizar membro existente usando o ID correto do membro
        const { error: memberError } = await supabase
          .from('members')
          .update(memberData)
          .eq('id', existingMember.id)

        if (memberError) throw memberError
      } else {
        // Criar novo membro
        const { error: memberError } = await supabase
          .from('members')
          .insert({
            ...memberData,
            membership_status: 'active',
            membership_type: 'standard',
            receive_newsletters: true,
            receive_event_notifications: true,
            created_by: user.id
          })

        if (memberError) throw memberError
      }

      showNotification('success', 'Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      showNotification('error', 'Error updating profile')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            {...register('first_name')}
            placeholder="Your first name"
          />
          {errors.first_name && (
            <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            {...register('last_name')}
            placeholder="Your last name"
          />
          {errors.last_name && (
            <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="your@email.com"
            disabled
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <PhoneInput
            value={watch('phone') || ''}
            onChange={(value) => setValue('phone', value)}
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            {...register('date_of_birth')}
          />
        </div>

        <div>
          <Label htmlFor="profession">Profession</Label>
          <Input
            id="profession"
            {...register('profession')}
            placeholder="English Teacher"
          />
        </div>

        <div>
          <Label htmlFor="experience_years">Years of Experience</Label>
          <Input
            id="experience_years"
            type="number"
            min="0"
            {...register('experience_years', { valueAsNumber: true })}
            placeholder="5"
          />
        </div>

        <div>
          <Label htmlFor="qualifications">Qualifications</Label>
          <Input
            id="qualifications"
            {...register('qualifications')}
            placeholder="CELTA, DELTA, MA TESOL"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Address</h3>
        <AddressAutocomplete
          postalCode={postalCode}
          onAddressChange={(address) => {
            if (address.address_line1) setValue('address_line1', address.address_line1)
            if (address.city) setValue('city', address.city)
            if (address.state) setValue('state', address.state)
            if (address.country) setValue('country', address.country)
          }}
          register={register}
          errors={errors}
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => loadUserProfile()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}