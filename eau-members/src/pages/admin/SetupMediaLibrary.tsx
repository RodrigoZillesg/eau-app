import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { supabase } from '../../lib/supabase/client'
import { showNotification } from '../../lib/notifications'
import { Loader } from 'lucide-react'
import { setupStorage } from '../../scripts/setupStorage'

export function SetupMediaLibrary() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])
  
  const setupDatabase = async () => {
    setLoading(true)
    setResults([])
    const logs: string[] = []
    
    try {
      // 1. Setup storage bucket first
      logs.push('Setting up storage bucket...')
      setResults([...logs])
      
      const storageSetup = await setupStorage()
      if (storageSetup) {
        logs.push('✅ Storage bucket ready')
      } else {
        logs.push('⚠️ Storage bucket setup failed (may already exist)')
      }
      setResults([...logs])
      
      // 2. Test if tables exist by trying to query them
      logs.push('Checking database tables...')
      setResults([...logs])
      
      // Check media_folders
      const { error: foldersCheck } = await supabase
        .from('media_folders')
        .select('id')
        .limit(1)
      
      if (foldersCheck) {
        logs.push('⚠️ media_folders table not found - please run SQL script manually')
        logs.push('Copy the content from database/media_library_schema_fixed.sql')
        logs.push('and execute it in Supabase SQL Editor')
      } else {
        logs.push('✅ media_folders table exists')
        
        // Insert default folders
        const defaultFolders = [
          { name: 'Events', path: '/events/' },
          { name: 'Members', path: '/members/' },
          { name: 'CPD', path: '/cpd/' },
          { name: 'General', path: '/general/' },
          { name: 'Banners', path: '/banners/' },
          { name: 'Icons', path: '/icons/' }
        ]
        
        for (const folder of defaultFolders) {
          const { error } = await supabase
            .from('media_folders')
            .upsert(folder, { 
              onConflict: 'path'
            })
          
          if (!error) {
            logs.push(`✅ Created folder: ${folder.name}`)
          }
        }
      }
      setResults([...logs])
      
      // Check media_files
      const { error: filesCheck } = await supabase
        .from('media_files')
        .select('id')
        .limit(1)
      
      if (filesCheck) {
        logs.push('⚠️ media_files table not found')
      } else {
        logs.push('✅ media_files table exists')
      }
      setResults([...logs])
      
      // Check media_usage
      const { error: usageCheck } = await supabase
        .from('media_usage')
        .select('id')
        .limit(1)
      
      if (usageCheck) {
        logs.push('⚠️ media_usage table not found')
      } else {
        logs.push('✅ media_usage table exists')
      }
      setResults([...logs])
      
      // Add some sample images if tables exist and are empty
      if (!filesCheck) {
        const { count } = await supabase
          .from('media_files')
          .select('*', { count: 'exact', head: true })
        
        if (count === 0) {
          logs.push('Adding sample images...')
          setResults([...logs])
          
          const sampleImages = [
            {
              filename: 'conference-event.jpg',
              original_filename: 'conference-event.jpg',
              file_type: 'image/jpeg',
              file_size: 102400,
              mime_type: 'image/jpeg',
              url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
              thumbnail_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200',
              medium_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
              title: 'Conference Event',
              category: 'events',
              status: 'active',
              is_public: true
            },
            {
              filename: 'business-meeting.jpg',
              original_filename: 'business-meeting.jpg',
              file_type: 'image/jpeg',
              file_size: 98304,
              mime_type: 'image/jpeg',
              url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
              thumbnail_url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=200',
              medium_url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600',
              title: 'Business Meeting',
              category: 'events',
              status: 'active',
              is_public: true
            },
            {
              filename: 'networking-event.jpg',
              original_filename: 'networking-event.jpg',
              file_type: 'image/jpeg',
              file_size: 110592,
              mime_type: 'image/jpeg',
              url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800',
              thumbnail_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=200',
              medium_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600',
              title: 'Networking Event',
              category: 'events',
              status: 'active',
              is_public: true
            },
            {
              filename: 'workshop.jpg',
              original_filename: 'workshop.jpg',
              file_type: 'image/jpeg',
              file_size: 94208,
              mime_type: 'image/jpeg',
              url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
              thumbnail_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=200',
              medium_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600',
              title: 'Workshop',
              category: 'events',
              status: 'active',
              is_public: true
            }
          ]
          
          for (const image of sampleImages) {
            const { error } = await supabase
              .from('media_files')
              .insert(image)
            
            if (!error) {
              logs.push(`✅ Added sample image: ${image.title}`)
            }
          }
          setResults([...logs])
        }
      }
      
      logs.push('')
      logs.push('🎉 Media Library setup completed!')
      logs.push('')
      logs.push('ℹ️ If any tables are missing, please:')
      logs.push('1. Go to Supabase SQL Editor')
      logs.push('2. Copy the SQL from database/media_library_schema_fixed.sql')
      logs.push('3. Execute the script')
      setResults([...logs])
      
      showNotification('success', 'Media Library setup completed!')
      
    } catch (error) {
      console.error('Setup error:', error)
      logs.push(`❌ Error: ${error.message}`)
      setResults([...logs])
      showNotification('error', 'Failed to setup Media Library')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Media Library Setup</h1>
        
        <p className="text-gray-600 mb-6">
          This will check and setup the Media Library system. If tables don't exist, 
          you'll need to run the SQL script manually in Supabase.
        </p>
        
        <Button 
          onClick={setupDatabase}
          disabled={loading}
          className="mb-6"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Running setup...
            </>
          ) : (
            'Run Setup'
          )}
        </Button>
        
        {results.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Setup Log:</h3>
            <div className="space-y-1 font-mono text-sm">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`${
                    result.includes('✅') ? 'text-green-600' :
                    result.includes('❌') ? 'text-red-600' :
                    result.includes('⚠️') ? 'text-yellow-600' :
                    result.includes('🎉') ? 'text-primary-600 font-semibold' :
                    result.includes('ℹ️') ? 'text-blue-600' :
                    'text-gray-700'
                  }`}
                >
                  {result || '\u00A0'}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}