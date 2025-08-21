// app/api/images/route.ts
import { NextResponse } from 'next/server';
import { join } from 'path';
import { readdir, stat } from 'fs/promises';
import { withAdminAuth } from '@/app/api/_lib/route-helpers';


export const GET = withAdminAuth(async (req, adminUser) => {
  try {
    const imagesPath = join(process.cwd(), 'public', 'images');
    
    const getImagesFromDir = async (dirPath: string, subDir: string = ''): Promise<any[]> => {
      try {
        const items = await readdir(dirPath);
        let images: any[] = [];

        for (const item of items) {
          const itemPath = join(dirPath, item);
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
    console.error('❌ Erreur listage images:', error);
    return NextResponse.json({ 
      images: [], 
      total: 0,
      categories: [],
      error: 'Erreur lors du listage des images'
    });
  }
});