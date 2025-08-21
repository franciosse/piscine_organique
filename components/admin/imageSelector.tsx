// components/admin/ImageSelector.tsx
'use client';

import { useState, useEffect } from 'react';

interface ImageItem {
  name: string;
  url: string;
  size?: number;
  created?: string;
  subDir: string;
}

interface ImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  filter?: 'lessons' | 'general' | 'all';
}

export default function ImageSelector({ isOpen, onClose, onSelect, filter = 'all' }: ImageSelectorProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(filter === 'all' ? 'lessons' : filter);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/images');
      const data = await response.json();
      console.log('Images chargées:', data); // Debug
      setImages(data.images || []);
    } catch (error) {
      console.error('Erreur lors du chargement des images:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = image.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filter === 'all' ? 
      (selectedCategory === 'all' || image.subDir === selectedCategory) : 
      image.subDir === filter;
    return matchesSearch && matchesCategory;
  });

  const handleImageSelect = (imageUrl: string) => {
    onSelect(imageUrl);
    onClose();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Sélectionner une image</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Rechercher une image..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {filter === 'all' && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="lessons">Leçons</option>
                <option value="general">Général</option>
                <option value="all">Toutes</option>
              </select>
            )}
            
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {filteredImages.length} image{filteredImages.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Images Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">
                {searchTerm ? 'Aucune image trouvée pour cette recherche' : 'Aucune image disponible'}
              </p>
              <p className="text-sm text-gray-400">
                Ajoutez des images dans <code className="bg-gray-100 px-1 rounded">/public/images/lessons/</code>
              </p>
              {images.length === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    💡 Pour tester, ajoutez quelques images dans le dossier <code>/public/images/lessons/</code> et redémarrez le serveur
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map((image, index) => (
                <div
                  key={index}
                  onClick={() => handleImageSelect(image.url)}
                  className="relative group cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all duration-200"
                >
                  {/* Image container avec aspect ratio fixe */}
                  <div className="aspect-square relative bg-gray-100 overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      onError={(e) => {
                        console.error('Erreur chargement image:', image.url);
                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%236b7280">❌</text></svg>';
                      }}
                      onLoad={() => console.log('Image chargée:', image.url)}
                    />
                  </div>
                  
                  {/* Overlay avec infos au hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                    <div className="text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="text-sm font-medium mb-1">Sélectionner</div>
                      {image.size && (
                        <div className="text-xs">{formatFileSize(image.size)}</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Nom du fichier - toujours visible */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-95 p-2">
                    <p className="text-xs text-gray-700 truncate font-medium" title={image.name}>
                      {image.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {image.subDir} {image.size && `• ${formatFileSize(image.size)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              💡 Tip: Ajoutez vos images dans <code className="bg-gray-100 px-1 rounded">/public/images/lessons/</code> et redémarrez le serveur
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}