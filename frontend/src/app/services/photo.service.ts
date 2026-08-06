import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  private apiUrl = `${environment.apiUrl}/photos`;

  constructor(private http: HttpClient) { }

  getPhotos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/map`);
  }

  getMyPhotos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my`);
  }

  getFavorites(): Observable<any> {
    return this.http.get(`${this.apiUrl}/favorites`);
  }

  toggleFavorite(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/favorite/${id}`, {});
  }

  
  uploadPhoto(photoDataUrl: string, data: any): Observable<any> {
    return new Observable((observer) => {
      (async () => {
        try {
            console.log('Comprimiendo imagen...');
            const compressedDataUrl = await this.compressImage(photoDataUrl, 8);
            const imageBlob = this.dataUrlToBlob(compressedDataUrl);

            console.log('Blob final — tipo:', imageBlob.type, '— tamaño:', (imageBlob.size / 1024 / 1024).toFixed(2), 'MB');

            const formData = new FormData();
            formData.append('title',       data.title || '');
            formData.append('description', data.description || '');
            formData.append('lat',         String(data.lat));
            formData.append('lng',         String(data.lng));
            formData.append('image',       imageBlob, 'camera_photo.jpg');

          console.log('📡 [Frontend] Enviando FormData al servidor...');

          const token = localStorage.getItem('token');
          const headers: any = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await window.fetch(`${this.apiUrl}/newPhoto`, {
            method: 'POST',
            headers,
            body: formData
          });

          const resData = await res.json();
          if (!res.ok) throw new Error(resData.message || 'Error en la subida');

          console.log('✅ [Frontend] Subida completada con éxito');
          observer.next(resData);
          observer.complete();

        } catch (err: any) {
          console.error('❌ [Frontend] Error en uploadPhoto:', err);
          observer.error(err);
        }
      })();
    });
  }

  /** Convierte "data:image/png;base64,xxxx" en un Blob real */
  private dataUrlToBlob(dataUrl: string): Blob {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }

  deletePhoto(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  private compressImage(dataUrl: string, maxSizeMB: number = 8): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');

        const MAX_PX = 2048;
        let { width, height } = img;
        if (width > MAX_PX || height > MAX_PX) {
          if (width > height) {
            height = Math.round((height * MAX_PX) / width);
            width = MAX_PX;
          } else {
            width = Math.round((width * MAX_PX) / height);
            height = MAX_PX;
          }
        }

        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        const maxBytes = maxSizeMB * 1024 * 1024;
        const qualities = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35];

        for (const q of qualities) {
          const compressed = canvas.toDataURL('image/jpeg', q);
          const bytes = Math.round((compressed.length * 3) / 4);
          console.log(`🗜️ Calidad ${q} → ${(bytes / 1024 / 1024).toFixed(2)} MB`);
          if (bytes <= maxBytes) {
            resolve(compressed);
            return;
          }
        }

        resolve(canvas.toDataURL('image/jpeg', 0.25));
      };
      img.src = dataUrl;
    });
  }
}
