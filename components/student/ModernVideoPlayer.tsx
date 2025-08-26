// components/student/ModernVideoPlayer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, AlertCircle } from 'lucide-react';
import logger from '@/lib/logger/logger';

interface ModernVideoPlayerProps {
  videoUrl?: string;
  title: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export function ModernVideoPlayer({ 
  videoUrl, 
  title, 
  onProgress, 
  onComplete 
}: ModernVideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsLoading(true);
  }, []);

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gradient-to-br from-emerald-100 to-green-200 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <Video className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <p className="text-emerald-800 font-medium">Vidéo non disponible</p>
          <p className="text-emerald-600 text-sm">Contenu en cours de préparation</p>
        </div>
      </div>
    );
  }

  const getEmbedUrl = (url: string) => {
    try {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(youtubeRegex);
      
      if (match) {
        const origin = isClient && typeof window !== 'undefined' ? window.location.origin : '';
        return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&rel=0&modestbranding=1&origin=${origin}`;
      }

      const vimeoRegex = /vimeo\.com\/(\d+)/;
      const vimeoMatch = url.match(vimeoRegex);
      
      if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}?byline=0&portrait=0`;
      }

      return url;
    } catch (error) {
      logger.error('Error processing video URL:', error);
      setHasError(true);
      return url;
    }
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isEmbedVideo = embedUrl && (embedUrl.includes('youtube.com') || embedUrl.includes('vimeo.com'));

  const handleVideoError = (error: any) => {
    logger.error('Video error:', error);
    setHasError(true);
    setIsLoading(false);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  if (hasError) {
    return (
      <div className="aspect-video bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl flex items-center justify-center border-2 border-red-200">
        <div className="text-center p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-800 font-medium mb-2">Erreur de chargement vidéo</p>
          <p className="text-red-600 text-sm mb-4">
            La vidéo ne peut pas être lue. Vérifiez votre connexion ou contactez le support.
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
            }}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative">
      {isClient && isLoading && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white">Chargement de la vidéo...</p>
          </div>
        </div>
      )}
      
      {isClient && (
        <>
          {isEmbedVideo ? (
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              onLoad={handleVideoLoad}
              onError={handleVideoError}
            />
          ) : (
            <video
              controls
              className="w-full h-full"
              src={embedUrl}
              onLoadedData={handleVideoLoad}
              onTimeUpdate={(e) => {
                const video = e.target as HTMLVideoElement;
                if (video.duration && onProgress) {
                  const progress = (video.currentTime / video.duration) * 100;
                  onProgress(progress);
                }
              }}
              onEnded={() => onComplete?.()}
              onError={handleVideoError}
            >
              <source src={embedUrl} type="video/mp4" />
              <p className="text-white p-4">
                Votre navigateur ne supporte pas la lecture vidéo.
              </p>
            </video>
          )}
        </>
      )}
      
      {!isClient && (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Préparation du lecteur vidéo...</p>
          </div>
        </div>
      )}
    </div>
  );
}