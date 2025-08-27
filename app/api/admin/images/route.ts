// app/api/images/route.ts
import { NextResponse } from 'next/server';
import { join, resolve, relative } from 'path';
import { readdir, stat } from 'fs/promises';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';
import logger from '@/lib/logger/logger';

export const GET = withAdminAuth(async (req, adminUser) => {
  try {
    const imagesPath = join(process.cwd(), 'public', 'images');
    const basePath = resolve(imagesPath); // Chemin de base sécurisé

    const getImagesFromDir = async (dirPath: string, subDir: string = ''): Promise<any[]> => {
      try {
        const items = await readdir(dirPath);
        let images: any[] = [];

        for (const item of items) {
          // CORRECTION SEMGREP : Validation avant path.join
          if (!isSecureFileName(item)) {
            logger.warn(`Nom de fichier potentiellement dangereux ignoré: ${item}`);
            continue;
          }

          // Ligne 20 corrigée - item est maintenant validé
          const itemPath = join(dirPath, item);
          
          // Double vérification après join()
          const resolvedItemPath = resolve(itemPath);
          if (!isPathSecure(resolvedItemPath, basePath)) {
            logger.warn(`Tentative de path traversal détectée: ${item}`);
            continue;
          }

          const stats = await stat(itemPath);
          
          if (stats.isDirectory()) {
            // Récursif pour les sous-dossiers
            const subImages = await getImagesFromDir(itemPath, item);
            images = images.concat(subImages);
          } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item)) {
            images.push({
              name: item,
              url: `/images/${subDir ? subDir + '/' : ''}${item}`,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              subDir: subDir || 'root'
            });
          }
        }
        return images;
      } catch (error) {
        console.warn(`Dossier ${dirPath} non trouvé ou inaccessible`);
        return [];
      }
    };

    const images = await getImagesFromDir(imagesPath);
    
    // Trier par date de modification (plus récent d'abord)
    images.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    return NextResponse.json({
      images,
      total: images.length,
      categories: [...new Set(images.map(img => img.subDir))]
    });
  } catch (error) {
    logger.error('❌ Erreur listage images:' + error);
    return NextResponse.json({
      images: [],
      total: 0,
      categories: [],
      error: 'Erreur lors du listage des images'
    });
  }
});

// Fonction de validation des noms de fichiers (prévention path traversal)
function isSecureFileName(fileName: string): boolean {
  // Rejeter tout ce qui pourrait être utilisé pour du path traversal
  const pathTraversalPattern = /(\.\.|\/|\\|:|\||<|>|\*|\?|"|')/;
  
  return fileName.length > 0 &&
         fileName.length <= 255 &&
         !pathTraversalPattern.test(fileName) &&
         !fileName.startsWith('.') &&
         fileName !== '.' &&
         fileName !== '..';
}

// Vérification que le chemin résolu reste dans le dossier autorisé
function isPathSecure(resolvedPath: string, basePath: string): boolean {
  const relativePath = relative(basePath, resolvedPath);
  return !relativePath.startsWith('..') && !relativePath.includes('..');
}