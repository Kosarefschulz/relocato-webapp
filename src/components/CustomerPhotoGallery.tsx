import React, { useState, useEffect, useRef } from 'react';
import { customerPhotosService, CustomerPhoto } from '../services/customerPhotosService';

interface CustomerPhotoGalleryProps {
  customerId: string;
}

const CustomerPhotoGallery: React.FC<CustomerPhotoGalleryProps> = ({ customerId }) => {
  const [photos, setPhotos] = useState<CustomerPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<CustomerPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPhotos();
  }, [customerId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await customerPhotosService.getCustomerPhotos(customerId);
      setPhotos(data);
      setError(null);
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Fehler beim Laden der Fotos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} ist keine gültige Bilddatei`);
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} ist zu groß (max. 10MB)`);
        }

        const photo = await customerPhotosService.uploadPhoto(customerId, file);
        setUploadProgress(((index + 1) / files.length) * 100);
        return photo;
      });

      const newPhotos = await Promise.all(uploadPromises);
      setPhotos(prev => [...newPhotos, ...prev]);
      setError(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Fehler beim Hochladen der Fotos');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm('Möchten Sie dieses Foto wirklich löschen?')) return;

    try {
      await customerPhotosService.deletePhoto(photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setSelectedPhoto(null);
      setError(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Fehler beim Löschen des Fotos');
    }
  };

  const handleDownloadPhoto = async (photo: CustomerPhoto) => {
    try {
      const blob = await customerPhotosService.downloadPhoto(photo.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Fehler beim Herunterladen des Fotos');
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Kundenfotos ({photos.length})
        </h3>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                   text-white rounded-lg transition-all duration-200 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Hochladen... {Math.round(uploadProgress)}%</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 4v16m8-8H4" />
              </svg>
              <span>Fotos hinzufügen</span>
            </>
          )}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400">Noch keine Fotos vorhanden</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-blue-400 hover:text-blue-300 transition-colors"
          >
            Erste Fotos hochladen
          </button>
        </div>
      ) : (
        <>
          {/* Photo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-800 
                         hover:ring-2 hover:ring-blue-500 transition-all duration-200"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.file_name}
                  className="w-full h-32 object-cover"
                />
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                    <span className="text-white text-xs truncate max-w-[80%]">
                      {photo.file_name}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPhoto(photo);
                        }}
                        className="p-1 bg-white/20 backdrop-blur-sm rounded hover:bg-white/30 transition-colors"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id);
                        }}
                        className="p-1 bg-white/20 backdrop-blur-sm rounded hover:bg-red-500/50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lightbox Modal */}
          {selectedPhoto && (
            <div 
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <div className="relative max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-white">
                    <h4 className="font-semibold">{selectedPhoto.file_name}</h4>
                    <p className="text-sm text-gray-400">
                      {new Date(selectedPhoto.uploaded_at).toLocaleString('de-DE')} • 
                      {(selectedPhoto.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhoto(null);
                    }}
                    className="p-2 text-white hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.file_name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
                
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPhoto(selectedPhoto);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                             transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Herunterladen
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(selectedPhoto.id);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg 
                             transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerPhotoGallery;