import { supabase } from '../lib/supabase/client'

interface MediaFile {
  id: string
  folder_id?: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  mime_type?: string
  url: string
  thumbnail_url?: string
  medium_url?: string
  large_url?: string
  width?: number
  height?: number
  alt_text?: string
  title?: string
  description?: string
  category: string
  tags?: string[]
  status: 'active' | 'archived' | 'deleted'
  is_public: boolean
  uploaded_by?: string
  created_at: string
  updated_at: string
}

interface MediaFolder {
  id: string
  name: string
  parent_id?: string
  path: string
  created_by?: string
  created_at: string
  updated_at: string
}

interface MediaUsage {
  id: string
  media_file_id: string
  entity_type: string
  entity_id: string
  field_name?: string
  created_at: string
}

class MediaService {
  private static async createMediaFileRecord(
    filename: string,
    file: File | Blob,
    metadata: any,
    uploadData: any
  ): Promise<MediaFile> {
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filename)
    
    // Get file metadata
    const fileSize = file instanceof File ? file.size : (file as Blob).size
    const fileType = file instanceof File ? file.type : 'image/jpeg'
    
    // Create thumbnails (in a real app, this would be done server-side)
    const thumbnailUrl = publicUrl + '?width=150&height=150&resize=cover'
    const mediumUrl = publicUrl + '?width=800&height=600&resize=fit'
    const largeUrl = publicUrl + '?width=1920&height=1080&resize=fit'
    
    // Try to save to database, but don't fail if table doesn't exist
    try {
      const { data, error } = await supabase
        .from('media_files')
        .insert({
          filename,
          original_filename: file instanceof File ? file.name : 'uploaded-image.jpg',
          file_type: fileType,
          file_size: fileSize,
          mime_type: fileType,
          url: publicUrl,
          thumbnail_url: thumbnailUrl,
          medium_url: mediumUrl,
          large_url: largeUrl,
          title: metadata.title,
          alt_text: metadata.alt_text,
          description: metadata.description,
          category: metadata.category || 'general',
          tags: metadata.tags || [],
          folder_id: metadata.folder_id,
          status: 'active',
          is_public: false
        })
        .select()
        .single()
      
      if (error) {
        console.warn('Could not save media metadata to database:', error)
        // Return a minimal MediaFile object even if database save fails
        return {
          id: filename,
          filename,
          original_filename: file instanceof File ? file.name : 'uploaded-image.jpg',
          file_type: fileType,
          file_size: fileSize,
          mime_type: fileType,
          url: publicUrl,
          thumbnail_url: thumbnailUrl,
          medium_url: mediumUrl,
          large_url: largeUrl,
          title: metadata.title,
          alt_text: metadata.alt_text,
          description: metadata.description,
          category: metadata.category || 'general',
          tags: metadata.tags || [],
          status: 'active' as const,
          is_public: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
      
      return data
    } catch (dbError) {
      console.warn('Database not configured, returning file info without metadata:', dbError)
      // Return file info without database
      return {
        id: filename,
        filename,
        original_filename: file instanceof File ? file.name : 'uploaded-image.jpg',
        file_type: fileType,
        file_size: fileSize,
        mime_type: fileType,
        url: publicUrl,
        thumbnail_url: thumbnailUrl,
        medium_url: mediumUrl,
        large_url: largeUrl,
        title: metadata.title,
        alt_text: metadata.alt_text,
        description: metadata.description,
        category: metadata.category || 'general',
        tags: metadata.tags || [],
        status: 'active' as const,
        is_public: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }
  
  static async uploadImage(file: File | Blob, metadata: {
    title?: string
    alt_text?: string
    description?: string
    category?: string
    tags?: string[]
    folder_id?: string
  } = {}): Promise<MediaFile> {
    try {
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(7)
      const extension = file instanceof File ? 
        file.name.split('.').pop() : 
        'jpg'
      const filename = `${timestamp}-${randomString}.${extension}`
      
      // Try to upload directly first
      console.log('Attempting to upload file:', filename)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        console.error('Upload error details:', {
          error: uploadError,
          message: uploadError.message,
          statusCode: uploadError.statusCode
        })
        
        // If bucket doesn't exist, try to create it
        if (uploadError.message?.includes('Bucket not found')) {
          console.log('Bucket not found, attempting to create...')
          
          // Try to create the bucket
          const { data: createData, error: createError } = await supabase.storage.createBucket('media', {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 10485760 // 10MB
          })
          
          if (createError) {
            console.error('Could not create bucket:', createError)
            
            // If we can't create, try using the bucket anyway (it might exist but we can't list)
            console.log('Retrying upload after bucket creation attempt...')
            const { data: retryData, error: retryError } = await supabase.storage
              .from('media')
              .upload(filename, file, {
                cacheControl: '3600',
                upsert: false
              })
            
            if (retryError) {
              console.error('Retry failed:', retryError)
              throw new Error(`Storage error: ${retryError.message}. Please check Supabase Storage configuration.`)
            }
            
            // If retry succeeded, use that data
            return this.createMediaFileRecord(filename, file, metadata, retryData)
          } else {
            console.log('Bucket created successfully, retrying upload...')
            
            // Bucket created, retry upload
            const { data: retryData, error: retryError } = await supabase.storage
              .from('media')
              .upload(filename, file, {
                cacheControl: '3600',
                upsert: false
              })
            
            if (retryError) {
              throw new Error(`Upload failed after creating bucket: ${retryError.message}`)
            }
            
            return this.createMediaFileRecord(filename, file, metadata, retryData)
          }
        }
        
        throw uploadError
      }
      
      // Upload succeeded, create the media file record
      return this.createMediaFileRecord(filename, file, metadata, uploadData)
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }
  
  static async getMediaFiles(filters?: {
    category?: string
    folder_id?: string
    search?: string
    tags?: string[]
    limit?: number
    offset?: number
  }): Promise<MediaFile[]> {
    let query = supabase
      .from('media_files')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    
    if (filters?.folder_id) {
      query = query.eq('folder_id', filters.folder_id)
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }
    
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,alt_text.ilike.%${filters.search}%`)
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters?.limit || 20) - 1)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching media files:', error)
      throw error
    }
    
    return data || []
  }
  
  static async getMediaFile(id: string): Promise<MediaFile | null> {
    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching media file:', error)
      throw error
    }
    
    return data
  }
  
  static async updateMediaFile(id: string, updates: Partial<MediaFile>): Promise<MediaFile> {
    const { data, error } = await supabase
      .from('media_files')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating media file:', error)
      throw error
    }
    
    return data
  }
  
  static async deleteMediaFile(id: string): Promise<void> {
    // First get the file to delete from storage
    const file = await this.getMediaFile(id)
    
    if (!file) {
      throw new Error('Media file not found')
    }
    
    // Mark as deleted in database (soft delete)
    const { error: dbError } = await supabase
      .from('media_files')
      .update({ status: 'deleted' })
      .eq('id', id)
    
    if (dbError) {
      console.error('Error deleting media file:', dbError)
      throw dbError
    }
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('media')
      .remove([file.filename])
    
    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Don't throw here, file is already marked as deleted in DB
    }
  }
  
  static async getFolders(): Promise<MediaFolder[]> {
    const { data, error } = await supabase
      .from('media_folders')
      .select('*')
      .order('path')
    
    if (error) {
      console.error('Error fetching folders:', error)
      throw error
    }
    
    return data || []
  }
  
  static async createFolder(name: string, parent_id?: string): Promise<MediaFolder> {
    let path = '/'
    
    if (parent_id) {
      const parent = await supabase
        .from('media_folders')
        .select('path')
        .eq('id', parent_id)
        .single()
      
      if (parent.data) {
        path = parent.data.path + name + '/'
      }
    } else {
      path = '/' + name + '/'
    }
    
    const { data, error } = await supabase
      .from('media_folders')
      .insert({
        name,
        parent_id,
        path
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating folder:', error)
      throw error
    }
    
    return data
  }
  
  static async trackUsage(media_file_id: string, entity_type: string, entity_id: string, field_name?: string): Promise<void> {
    const { error } = await supabase
      .from('media_usage')
      .upsert({
        media_file_id,
        entity_type,
        entity_id,
        field_name
      })
    
    if (error) {
      console.error('Error tracking media usage:', error)
      throw error
    }
  }
  
  static async getMediaUsage(media_file_id: string): Promise<MediaUsage[]> {
    const { data, error } = await supabase
      .from('media_usage')
      .select('*')
      .eq('media_file_id', media_file_id)
    
    if (error) {
      console.error('Error fetching media usage:', error)
      throw error
    }
    
    return data || []
  }
  
  static async getMediaStatistics() {
    const { data, error } = await supabase
      .rpc('get_media_statistics')
    
    if (error) {
      console.error('Error fetching media statistics:', error)
      throw error
    }
    
    return data
  }
}

export { MediaService }
export type { MediaFile, MediaFolder, MediaUsage }