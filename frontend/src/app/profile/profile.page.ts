import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonModal, IonicModule, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PhotoService } from '../services/photo.service';
import { addIcons } from 'ionicons';
import { arrowBack, grid, logOut, camera, close, trash, locationOutline, expand } from 'ionicons/icons';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar style="--background: #111; --color: #fff;">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home" text="" style="color: #fff;"></ion-back-button>
        </ion-buttons>
        <ion-title style="color: #fff;">{{ user?.username || 'Perfil' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="logout()" style="color: #fff;">
            <ion-icon name="log-out" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content style="--background: #0a0a0f;">
      <!-- Header del perfil -->
      <div class="profile-header">
        <div class="avatar">
          <ion-icon name="camera" style="font-size: 40px; color: rgba(255,255,255,0.7);"></ion-icon>
        </div>
        <div class="stats">
          <div class="stat">
            <span class="stat-number">{{ myPhotos.length }}</span>
            <span class="stat-label">Fotos</span>
          </div>
        </div>
        <div class="username">{{ user?.username }}</div>
        <div class="email">{{ user?.email }}</div>
      </div>

      <!-- Grid de fotos -->
      <div class="photo-grid">
        <div class="grid-item" *ngFor="let photo of myPhotos" (click)="openPhoto(photo)">
          <img [src]="photo.image" loading="lazy" />
        </div>
      </div>

      <div *ngIf="myPhotos.length === 0 && !loading" class="empty-state">
        <ion-icon name="camera" style="font-size: 48px; color: rgba(255,255,255,0.3);"></ion-icon>
        <p>Aún no has subido fotos</p>
      </div>
    </ion-content>

    <!-- Modal detalle foto (mismo estilo que el mapa) -->
    <ion-modal #detailModal [isOpen]="isModalOpen" (didDismiss)="onModalDismiss()">
      <ng-template>
        <ion-header>
          <ion-toolbar style="--background: #111; --color: #fff;">
            <ion-title style="color: #fff;">Detalle</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="confirmDelete()" style="color: #ff4d4d;">
                <ion-icon name="trash" slot="icon-only"></ion-icon>
              </ion-button>
              <ion-button (click)="dismissModal()" style="color: #fff;">
                <ion-icon name="close" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content style="--background: #111;">
          <div style="padding: 20px; display: flex; flex-direction: column; gap: 20px;">
            <!-- Mini mapa -->
            <div style="width: 100%; height: 30vh; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5); background: #212121;">
              <div id="profileMiniMap" style="width: 100%; height: 100%; background: #212121;"></div>
            </div>
            <!-- Foto -->
            <div (click)="isFullScreen = true" style="width: 100%; height: 55vh; background: #1a1a1a; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); padding: 10px; cursor: pointer;">
              <img *ngIf="selectedPhoto" [src]="selectedPhoto.image" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />
            </div>
            <!-- Dirección -->
            <div style="color: #fff; padding-top: 10px;">
              <h2 style="color: #fff; margin-top: 0; font-size: 1.2rem; display: flex; align-items: center; gap: 5px;">
                <ion-icon name="location-outline"></ion-icon> Ubicación
              </h2>
              <p style="color: #fff; font-size: 1.4rem; font-weight: bold; line-height: 1.3; margin-top: 5px;">{{ selectedPhotoAddress }}</p>
            </div>
            <div style="height: 40px;"></div>
          </div>
        </ion-content>
        <!-- Visor Foto Completa Overlay (Renderizado dentro del modal) -->
        <div *ngIf="isFullScreen" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 99999; display: flex; justify-content: center; align-items: center;">
          <img *ngIf="selectedPhoto" [src]="selectedPhoto.image" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          <ion-fab vertical="top" horizontal="end" slot="fixed" style="position: absolute; top: 10px; right: 10px;">
            <ion-fab-button size="small" color="dark" (click)="isFullScreen = false" style="--box-shadow: none; --background: rgba(255,255,255,0.2);">
              <ion-icon name="close"></ion-icon>
            </ion-fab-button>
          </ion-fab>
        </div>
      </ng-template>
    </ion-modal>


  `,
  styles: [`
    .profile-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      border: 2px solid rgba(255,255,255,0.15);
    }
    .stats {
      display: flex;
      gap: 32px;
      margin-bottom: 12px;
    }
    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stat-number {
      font-size: 1.3rem;
      font-weight: 700;
      color: #fff;
    }
    .stat-label {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.5);
    }
    .username {
      font-size: 1.1rem;
      font-weight: 600;
      color: #fff;
    }
    .email {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.5);
      margin-top: 2px;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2px;
      padding: 2px;
    }
    .grid-item {
      aspect-ratio: 1;
      overflow: hidden;
      cursor: pointer;
    }
    .grid-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.2s;
    }
    .grid-item:active img {
      opacity: 0.7;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 12px;
    }
    .empty-state p {
      color: rgba(255,255,255,0.4);
      font-size: 0.95rem;
    }
  `]
})
export class ProfilePage implements OnInit {
  @ViewChild('detailModal') detailModal!: IonModal;
  user: any;
  myPhotos: any[] = [];
  loading = true;
  isModalOpen = false;
  isFullScreen = false;
  selectedPhoto: any = null;
  selectedPhotoAddress = '';

  constructor(
    private authService: AuthService,
    private photoService: PhotoService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {
    addIcons({ arrowBack, grid, logOut, camera, close, trash, locationOutline, expand });
  }

  ngOnInit() {
    this.user = this.authService.currentUser;
    this.loadMyPhotos();
  }

  loadMyPhotos() {
    this.loading = true;
    this.photoService.getMyPhotos().subscribe({
      next: (res: any) => {
        this.myPhotos = (res.data || []).map((p: any) => ({
          ...p,
          lat: p.location?.coordinates?.[1],
          lng: p.location?.coordinates?.[0]
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openPhoto(photo: any) {
    this.selectedPhoto = photo;
    this.isModalOpen = true;
    this.selectedPhotoAddress = 'Buscando dirección...';
    setTimeout(() => {
      this.initMiniMap(photo);
      this.getAddress(photo.lat, photo.lng);
    }, 350);
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedPhoto = null;
  }

  dismissModal() {
    this.detailModal?.dismiss();
  }

  onModalDismiss() {
    this.isModalOpen = false;
    this.selectedPhoto = null;
  }

  async confirmDelete() {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar foto',
      message: '¿Seguro que quieres eliminar esta foto? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Eliminar', 
          role: 'destructive', 
          cssClass: 'alert-danger',
          handler: () => { this.deletePhoto(); } 
        }
      ]
    });
    await alert.present();
  }

  async deletePhoto() {
    if (!this.selectedPhoto) return;

    const loading = await this.loadingCtrl.create({
      message: 'Eliminando foto...',
      spinner: 'crescent',
      cssClass: 'upload-loading'
    });
    await loading.present();

    this.photoService.deletePhoto(this.selectedPhoto._id).subscribe({
      next: async () => {
        await loading.dismiss();
        this.myPhotos = this.myPhotos.filter(p => p._id !== this.selectedPhoto._id);
        this.dismissModal();
        this.toastCtrl.create({ message: 'Foto eliminada', duration: 2000, position: 'top', color: 'success' }).then(t => t.present());
      },
      error: async (err) => {
        await loading.dismiss();
        this.toastCtrl.create({ message: err.error?.message || 'Error al eliminar', duration: 2000, color: 'danger' }).then(t => t.present());
      }
    });
  }

  initMiniMap(photo: any) {
    const el = document.getElementById('profileMiniMap');
    if (!el || !photo.lat || !photo.lng) return;
    const darkStyles = [
      { elementType: "geometry", stylers: [{ color: "#212121" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2c2c" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
    ];
    const map = new (window as any).google.maps.Map(el, {
      center: { lat: photo.lat, lng: photo.lng },
      zoom: 16,
      disableDefaultUI: true,
      gestureHandling: 'none',
      styles: darkStyles,
      backgroundColor: '#212121'
    });
    const navMarker = new (window as any).google.maps.Marker({
      position: { lat: photo.lat, lng: photo.lng },
      map,
      title: 'Ir a esta ubicación'
    });

    navMarker.addListener('click', () => {
      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${photo.lat},${photo.lng}`;
      window.open(navUrl, '_blank');
    });
  }

  getAddress(lat: number, lng: number) {
    if (!lat || !lng) { this.selectedPhotoAddress = 'Sin ubicación'; return; }
    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        this.selectedPhotoAddress = results[0].formatted_address.split(',')[0].trim();
      } else {
        this.selectedPhotoAddress = 'Ubicación desconocida';
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
