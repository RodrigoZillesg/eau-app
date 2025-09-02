import { useState, useEffect, useCallback } from 'react';
import { X, Upload, Search, Grid, List, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MediaService } from '../../services/mediaService';
import type { MediaFile } from '../../services/mediaService';
import { showNotification } from '../../lib/notifications';

interface MediaGalleryModalProps {
  onSelectImage: (url: string) => void;
  onClose: () => void;
  category?: string;
  currentImageUrl?: string;
}

export function MediaGalleryModal({ 
  onSelectImage, 
  onClose, 
  category = 'events',
  currentImageUrl 
}: MediaGalleryModalProps) {
  const [images, setImages] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(currentImageUrl || null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'url'>('gallery');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Default event images
  const defaultImages = [
    { id: 'default-1', name: 'Conference', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800' },
    { id: 'default-2', name: 'Meeting', url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800' },
    { id: 'default-3', name: 'Workshop', url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800' },
    { id: 'default-4', name: 'Presentation', url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800' },
    { id: 'default-5', name: 'Networking', url: 'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=800' },
    { id: 'default-6', name: 'Team Event', url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800' },
    { id: 'default-7', name: 'Training', url: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800' },
    { id: 'default-8', name: 'Business', url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800' },
    { id: 'default-9', name: 'Seminar', url: 'https://images.unsplash.com/photo-1560439514-4e9645039924?w=800' },
    { id: 'default-10', name: 'Virtual Event', url: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800' },
    { id: 'default-11', name: 'Panel', url: 'https://images.unsplash.com/photo-1582192730841-2a682d7375f9?w=800' },
    { id: 'default-12', name: 'Awards', url: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=800' }
  ];

  useEffect(() => {
    loadImages();
  }, [category]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const data = await MediaService.getMediaFiles({
        category,
        search: searchTerm
      });
      setImages(data || []);
    } catch (error) {
      console.error('Error loading images:', error);
      // If database is not ready, just use empty array
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }
      
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size must be less than 10MB');
      }

      const uploaded = await MediaService.uploadImage(file, {
        title: file.name.split('.')[0],
        category,
        alt_text: file.name
      });
      
      if (uploaded) {
        showNotification('success', 'Image uploaded successfully');
        setImages([uploaded, ...images]);
        setSelectedImage(uploaded.url);
        setActiveTab('gallery');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      // If database is not set up, still allow using the image URL directly
      if (error.message?.includes('relation') || error.message?.includes('media_files')) {
        showNotification('warning', 'Database not configured. Using direct upload.');
        // For now, just use the image directly without database
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          onSelectImage(dataUrl);
          onClose();
        };
        reader.readAsDataURL(file);
      } else {
        showNotification('error', error.message || 'Failed to upload image');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleUrlSubmit = () => {
    if (urlInput) {
      try {
        new URL(urlInput);
        onSelectImage(urlInput);
        onClose();
      } catch {
        showNotification('error', 'Please enter a valid URL');
      }
    }
  };

  const handleSelectImage = () => {
    if (selectedImage) {
      onSelectImage(selectedImage);
      onClose();
    }
  };

  const filteredImages = images.filter(img => 
    !searchTerm || 
    img.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    img.original_filename?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Select Image</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'gallery'
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Gallery
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Upload New
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'url'
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            From URL
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'gallery' ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search images..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${
                      viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${
                      viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'
                    }`}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Gallery */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                  </div>
                ) : viewMode === 'grid' ? (
                  <>
                    {/* User uploaded images */}
                    {filteredImages.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Images</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {filteredImages.map((image) => (
                            <div
                              key={image.id}
                              onClick={() => setSelectedImage(image.url)}
                              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                selectedImage === image.url
                                  ? 'border-primary-500 shadow-lg'
                                  : 'border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              <img
                                src={image.thumbnail_url || image.url}
                                alt={image.title || 'Image'}
                                className="w-full h-32 object-cover"
                              />
                              {image.title && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                  <p className="text-white text-xs truncate">{image.title}</p>
                                </div>
                              )}
                              {selectedImage === image.url && (
                                <div className="absolute top-2 right-2 bg-primary-500 rounded-full p-1">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Default images */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Stock Images</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {defaultImages.map((img) => (
                          <div
                            key={img.id}
                            onClick={() => setSelectedImage(img.url)}
                            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImage === img.url
                                ? 'border-primary-500 shadow-lg'
                                : 'border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.name}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <p className="text-white text-xs truncate">{img.name}</p>
                            </div>
                            {selectedImage === img.url && (
                              <div className="absolute top-2 right-2 bg-primary-500 rounded-full p-1">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    {/* List view for uploaded images */}
                    {filteredImages.map((image) => (
                      <div
                        key={image.id}
                        onClick={() => setSelectedImage(image.url)}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedImage === image.url
                            ? 'bg-primary-50 border border-primary-500'
                            : 'hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <img
                          src={image.thumbnail_url || image.url}
                          alt={image.title || 'Image'}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{image.title || 'Untitled'}</p>
                          <p className="text-sm text-gray-500">{image.category}</p>
                        </div>
                        {selectedImage === image.url && (
                          <Check className="h-5 w-5 text-primary-600" />
                        )}
                      </div>
                    ))}
                    
                    {/* List view for default images */}
                    <h3 className="text-sm font-semibold text-gray-700 mt-4 mb-2">Stock Images</h3>
                    {defaultImages.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedImage(img.url)}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedImage === img.url
                            ? 'bg-primary-50 border border-primary-500'
                            : 'hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{img.name}</p>
                          <p className="text-sm text-gray-500">Stock Photo</p>
                        </div>
                        {selectedImage === img.url && (
                          <Check className="h-5 w-5 text-primary-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'upload' ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div
                className={`w-full max-w-md p-8 border-2 border-dashed rounded-lg transition-colors ${
                  dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                }`}
                onDrop={handleDrop}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  disabled={uploading}
                />
                
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-12 w-12 text-primary-600 animate-spin mb-4" />
                      <p className="text-gray-600">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-700 font-medium mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>
          ) : activeTab === 'url' ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleUrlSubmit();
                  }}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter a direct link to an image file
                </p>
                
                {urlInput && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    <img
                      src={urlInput}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'block';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {activeTab === 'gallery' && (
            <Button 
              onClick={handleSelectImage}
              disabled={!selectedImage}
            >
              Select Image
            </Button>
          )}
          {activeTab === 'url' && (
            <Button 
              onClick={handleUrlSubmit}
              disabled={!urlInput}
            >
              Use This URL
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}