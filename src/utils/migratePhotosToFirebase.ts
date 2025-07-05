import googleDriveService from '../services/googleDriveService';
import { blobStorageService } from '../services/blobStorageService';

/**
 * Migriert alle Fotos von localStorage zu Firebase Storage
 */
export async function migratePhotosToFirebase() {
  try {
    console.log('🔄 Starte Migration von localStorage zu Firebase Storage...');
    
    // Lade alle Fotos aus localStorage
    const localStorageKey = 'customerPhotos';
    const storedData = localStorage.getItem(localStorageKey);
    
    if (!storedData) {
      console.log('✅ Keine Fotos in localStorage gefunden');
      return { success: true, migrated: 0, failed: 0 };
    }
    
    const allPhotos = JSON.parse(storedData);
    console.log(`📷 ${allPhotos.length} Fotos gefunden`);
    
    let migratedCount = 0;
    let failedCount = 0;
    
    // Gruppiere Fotos nach Kunden-ID
    const photosByCustomer = allPhotos.reduce((acc: any, photo: any) => {
      if (!acc[photo.customerId]) {
        acc[photo.customerId] = [];
      }
      acc[photo.customerId].push(photo);
      return acc;
    }, {});
    
    // Migriere Fotos für jeden Kunden
    for (const [customerId, photos] of Object.entries(photosByCustomer)) {
      console.log(`👤 Migriere ${(photos as any[]).length} Fotos für Kunde ${customerId}`);
      
      for (const photo of photos as any[]) {
        try {
          // Überspringe wenn schon in Firebase (ID beginnt mit firebase_)
          if (photo.id?.startsWith('firebase_')) {
            console.log(`⏭️ Überspringe bereits migriertes Foto: ${photo.fileName}`);
            continue;
          }
          
          // Konvertiere base64 zu Blob wenn vorhanden
          if (photo.webViewLink?.startsWith('data:') || photo.base64Thumbnail?.startsWith('data:')) {
            const base64Data = photo.webViewLink || photo.base64Thumbnail;
            const response = await fetch(base64Data);
            const blob = await response.blob();
            const file = new File([blob], photo.fileName, { type: photo.mimeType || 'image/jpeg' });
            
            // Upload zu Blob Storage
            const result = await blobStorageService.uploadFile(
              customerId,
              file,
              photo.category || 'Sonstiges'
            );
            
            if (result) {
              migratedCount++;
              console.log(`✅ Migriert: ${photo.fileName}`);
            } else {
              failedCount++;
              console.error(`❌ Fehler bei: ${photo.fileName}`);
            }
          } else {
            console.warn(`⚠️ Kein Bild-Data für: ${photo.fileName}`);
            failedCount++;
          }
        } catch (error) {
          console.error(`❌ Fehler bei Migration von ${photo.fileName}:`, error);
          failedCount++;
        }
      }
    }
    
    // Optional: localStorage nach erfolgreicher Migration leeren
    if (migratedCount > 0 && failedCount === 0) {
      console.log('🗑️ Lösche localStorage Daten nach erfolgreicher Migration');
      localStorage.removeItem(localStorageKey);
    }
    
    console.log(`✅ Migration abgeschlossen: ${migratedCount} erfolgreich, ${failedCount} fehlgeschlagen`);
    
    return {
      success: true,
      migrated: migratedCount,
      failed: failedCount,
      total: allPhotos.length
    };
  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
}

/**
 * Prüft ob eine Migration notwendig ist
 */
export function needsMigration(): boolean {
  const localPhotos = localStorage.getItem('customerPhotos');
  return !!localPhotos && JSON.parse(localPhotos).length > 0;
}