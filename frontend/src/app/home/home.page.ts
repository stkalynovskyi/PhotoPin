import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { IonicModule, ToastController, LoadingController, ActionSheetController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PhotoService } from '../services/photo.service';
import { AuthService } from '../services/auth.service';
import { addIcons } from 'ionicons';
import { camera, refresh, locate, close, locationOutline, checkmarkCircle, alertCircle, location, navigate, add, search, trash,heart, heartOutline, layers, map, star, starOutline, gitMerge, closeCircle,  bookmarks, bookmarksOutline, playSkipBack, playSkipForward, stopCircle, personCircle, logOut  } from 'ionicons/icons';
import exifr from 'exifr';
import { RouteService } from '../services/route.service';
import { FormsModule } from '@angular/forms';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import {style} from "@angular/animations";

declare var google: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule,FormsModule]
})
export class HomePage implements OnInit, AfterViewInit {

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  map: any;
  photos: any[] = [];
  markers: any[] = [];
  userMarker: any;
  userLocation: { lat: number, lng: number } | null = null;
  clusterer: any = null;
  nearbyPhotos: any[] = [];
  favoritePhotos: any[] = [];
  routePins: any[] = [];

  isModalOpen = false;
  selectedPhoto: any = null;
  isFullScreenPhotoOpen = false;
  isUploading = false;
  isMenuOpen = false;
  isDeleteConfirmOpen = false;
  isSatellite = false;
  isFavoritesModalOpen = false;
  isMapSearchOpen = false;
  isRouteModeActive = false;
  directionsService: any = null;
  directionsRenderer: any = null;
  isRoutePanelOpen = false;
  isNavigating = false;
  currentNavIndex = 0;
  savedRoutes: any[] = [];
  isSavedRoutesModalOpen = false;
  isSaveRouteModalOpen = false;
  pendingRouteName = '';
  deleteRouteAlertButtons: any[] = [];
  routeToDelete: any = null;
  isRoutesSheetOpen = false;
  filterMode: 'all' | 'mine' = 'all';


  isConfirmLocationModalOpen = false;
  pendingPhotoBase64: string | null = null;
  pendingPhotoSrc: string | null = null;
  confirmMap: any;

  selectedPhotoAddress: string = '';
  gpsWatchId: string | null = null;
  currentStep: string = '';
  distanceToNext: string = '';

  readonly valenciaCoords = { lat: 39.4699, lng: -0.3763 };

  readonly darkBwStyles = [
    { elementType: "geometry", stylers: [{ color: "#212121" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
    { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
    { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
  ];

  constructor(
    private photoService: PhotoService,
    private ngZone: NgZone,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private routeService: RouteService,
    private authService: AuthService,
    private actionSheetCtrl: ActionSheetController,
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController
  ) {
    addIcons({ camera, refresh, locate, close, locationOutline, checkmarkCircle, alertCircle, location, navigate, add, search, trash, heart, heartOutline, layers, map, star, starOutline, gitMerge, closeCircle,  bookmarks, bookmarksOutline, playSkipBack, playSkipForward, stopCircle, personCircle, logOut  });
  }

  ngOnInit() {
    this.loadPinsData();
    this.loadSavedRoutes();
    this.loadFavorites();
  }

  loadFavorites() {
    this.photoService.getFavorites().subscribe({
      next: (res) => {
        const data = res.data || [];
        this.favoritePhotos = data.map((p: any) => ({
          ...p,
          lat: p.location?.coordinates?.[1],
          lng: p.location?.coordinates?.[0]
        }));
      },
      error: (err) => console.error("Error cargando favoritos:", err)
    });
  }

  ngAfterViewInit() {
    this.init2DMap();
  }

  init2DMap() {
    setTimeout(() => {
      if (typeof google !== 'undefined' && google.maps) {
        const mapOptions = {
          center: this.valenciaCoords,
          zoom: 14,
          minZoom: 3,
          restriction: {
            latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
            strictBounds: true,
          },
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: true,
          zoomControl: false,
          keyboardShortcuts: false,
          styles: this.darkBwStyles,
          backgroundColor: '#212121'

        };

        this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);

        this.renderMarkers();
        this.locateUser();
      } else {
        console.error("Error crítico: El script de Google Maps no está cargado.");
      }
    }, 500);
  }

  locateUser() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          this.map.setCenter(this.userLocation);
          this.map.setZoom(16);

          if (!this.userMarker) {
            this.userMarker = new google.maps.Marker({
              position: this.userLocation,
              map: this.map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
              title: 'Estás aquí'
            });
          } else {
            this.userMarker.setPosition(this.userLocation);
          }
        },
        (error) => console.warn("Error de GPS", error),
        { enableHighAccuracy: true }
      );
    }
  }

  loadPinsData() {
    const source = this.filterMode === 'mine'
      ? this.photoService.getMyPhotos()
      : this.photoService.getPhotos();

    source.subscribe({
      next: (res) => {
        const data = res.data || res;
        this.photos = data.map((p: any) => ({
          ...p,
          lat: p.location.coordinates[1],
          lng: p.location.coordinates[0],
          image: p.image
        }));
        this.renderMarkers();
      },
      error: (err) => console.error("Error al descargar fotos:", err)
    });
  }

  setFilterMode(mode: 'all' | 'mine') {
    this.filterMode = mode;
    this.loadPinsData();
  }

  async createCircularMarker(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 60;
      canvas.height = 60;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(imageUrl);

      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        ctx.beginPath();
        ctx.arc(30, 30, 28, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, 60, 60);

        ctx.beginPath();
        ctx.arc(30, 30, 28, 0, Math.PI * 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        resolve(canvas.toDataURL());
      };

      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  }


  openModal(photo: any) {
    this.selectedPhoto = photo;
    this.isModalOpen = true;
    this.selectedPhotoAddress = 'Buscando dirección exacta...';
    this.nearbyPhotos = this.getPhotosNearby(photo, 100);
    this.loadNearbyAddresses();

    setTimeout(() => {
      this.initMiniMap(photo);
      this.getAddressFromCoords(photo.lat, photo.lng);
    }, 350);


  }

  getAddressFromCoords(lat: number, lng: number) {
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat: lat, lng: lng };

    geocoder.geocode({ location: latlng }, (results: any, status: any) => {
      this.ngZone.run(() => {
        if (status === 'OK' && results[0]) {
          const addressParts = results[0].formatted_address.split(',');
          this.selectedPhotoAddress = addressParts[0].trim();
        } else {
          this.selectedPhotoAddress = 'Ubicación desconocida';
        }
      });
    });
  }

  initMiniMap(photo: any) {
    const miniMapEl = document.getElementById('miniMapContainer');
    if (!miniMapEl) return;

    const miniMapOptions = {
      center: { lat: photo.lat, lng: photo.lng },
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      keyboardShortcuts: false,
      gestureHandling: 'none',
      styles: this.darkBwStyles,
      backgroundColor: '#212121'
    };

    const miniMap = new google.maps.Map(miniMapEl, miniMapOptions);

    const navMarker = new google.maps.Marker({
      position: { lat: photo.lat, lng: photo.lng },
      map: miniMap,
      title: 'Ir a esta ubicación'
    });

    navMarker.addListener('click', () => {
      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${photo.lat},${photo.lng}`;
      window.open(navUrl, '_blank');
    });
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedPhoto = null;
    this.isFullScreenPhotoOpen = false;
    this.selectedPhotoAddress = '';
  }

  openFullScreenPhoto() {
    this.isFullScreenPhotoOpen = true;
  }

  closeFullScreenPhoto() {
    this.isFullScreenPhotoOpen = false;
  }

  async takePhoto() {
    const loading = await this.loadingCtrl.create({
      message: 'Abriendo cámara...',
      spinner: 'crescent',
      cssClass: 'upload-loading'
    });
    await loading.present();

    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        saveToGallery: false
      });

      if (!photo.dataUrl) throw new Error('No se obtuvo ninguna foto.');

      loading.message = 'Leyendo ubicación...';

      let lat: number | null = null;
      let lng: number | null = null;
      let locationSource = '';

      try {
        const exif = await exifr.gps(photo.dataUrl);
        if (exif?.latitude && exif?.longitude) {
          lat = exif.latitude;
          lng = exif.longitude;
          locationSource = 'Ubicación extraída de la foto';
          console.log('GPS desde EXIF:', lat, lng);
        }
      } catch (exifErr) {
        console.log('ℹSin datos EXIF GPS, usando GPS del dispositivo');
      }

      if (lat === null || lng === null) {
        loading.message = 'Obteniendo ubicación GPS...';

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        locationSource = 'Ubicación del dispositivo';
        console.log('GPS desde dispositivo:', lat, lng);
      }

      this.ngZone.run(() => {
        this.userLocation = { lat: lat!, lng: lng! };
      });

      this.pendingPhotoBase64 = photo.dataUrl;
      this.pendingPhotoSrc   = photo.dataUrl;

      await loading.dismiss();
      await this.showToast(locationSource, 'success');

      this.isConfirmLocationModalOpen = true;

      setTimeout(() => {
        this.initConfirmMap(lat!, lng!);
      }, 350);

    } catch (err: any) {
      await loading.dismiss();

      const isCancelled =
        err?.message?.includes('cancelled') ||
        err?.message?.includes('canceled') ||
        err?.message?.includes('No image') ||
        err?.message?.includes('User cancelled');

      if (!isCancelled) {
        console.error('Error en takePhoto():', err);
        await this.showToast('Error al capturar la foto. Inténtalo de nuevo.', 'danger');
      }
    }
  }

  initConfirmMap(lat: number, lng: number) {
    const confirmMapEl = document.getElementById('confirmMapContainer');
    if (!confirmMapEl) return;

    const mapOptions = {
      center: { lat, lng },
      zoom: 17,
      minZoom: 3,
      restriction: {
        latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
        strictBounds: true,
      },
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      zoomControl: true,
      keyboardShortcuts: false,
      styles: this.darkBwStyles,
      backgroundColor: '#212121'
    };

    this.confirmMap = new google.maps.Map(confirmMapEl, mapOptions);
    setTimeout(() => this.initPlacesSearch(), 100);
  }

  async uploadConfirmedPhoto() {
    if (!this.confirmMap || !this.pendingPhotoBase64) return;

    const center = this.confirmMap.getCenter();
    const lat = center.lat();
    const lng = center.lng();

    const photoDataUrl = this.pendingPhotoBase64;

    this.isConfirmLocationModalOpen = false;

    const loading = await this.loadingCtrl.create({
      message: 'Subiendo foto al servidor...',
      spinner: 'crescent',
      cssClass: 'upload-loading'
    });
    await loading.present();

    try {
      await new Promise<void>((resolve, reject) => {
        this.photoService.uploadPhoto(photoDataUrl, { lat, lng }).subscribe({
          next: () => resolve(),
          error: (err) => reject(err)
        });
      });

      await loading.dismiss();
      await this.showToast('¡Foto subida correctamente!', 'success');

      this.loadPinsData();

      if (this.map) {
        this.map.panTo({ lat, lng });
        this.map.setZoom(17);
      }

    } catch (err) {
      await loading.dismiss();
      console.error('Error en uploadConfirmedPhoto():', err);
      await this.showToast('Error al subir la foto al servidor.', 'danger');
    }
  }

  closeConfirmModal() {
    this.isConfirmLocationModalOpen = false;
    this.pendingPhotoBase64 = null;
    this.pendingPhotoSrc = null;
    this.confirmMap = null;
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const icon = color === 'success' ? 'checkmark-circle' : 'alert-circle';
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      icon,
      buttons: [{ role: 'cancel', icon: 'close' }]
    });
    await toast.present();
  }

  resetCamera() {
    if (this.map) {
      if (this.userLocation) {
        this.map.panTo(this.userLocation);
        this.map.setZoom(16);
      } else {
        this.map.panTo(this.valenciaCoords);
        this.map.setZoom(14);
      }
      this.locateUser();
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  initPlacesSearch() {

    if (!google?.maps?.places?.Autocomplete) {
      console.error('La librería Places no está cargada. Revisa el script en index.html');
      return;
    }

    const input = document.getElementById('placesSearchInput') as HTMLInputElement;
    if (!input || !this.confirmMap) return;

    const autocomplete = new google.maps.places.Autocomplete(input, {
      fields: ['geometry', 'name']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;
      this.confirmMap.panTo(place.geometry.location);
      this.confirmMap.setZoom(17);
      input.blur();
    });
  }

  // Fórmula Haversine — devuelve metros entre dos coordenadas
  getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (x: number) => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

// Filtra fotos en un radio dado (metros) excluyendo la foto actual
  getPhotosNearby(photo: any, radiusMeters: number = 100): any[] {
    return this.photos
      .filter(p => p._id !== photo._id)
      .map(p => ({
        ...p,
        distanceM: Math.round(this.getDistanceMeters(photo.lat, photo.lng, p.lat, p.lng))
      }))
      .filter(p => p.distanceM <= radiusMeters)
      .sort((a, b) => a.distanceM - b.distanceM);
  }

  onNearbyTouchStart(event: TouchEvent) {
    (event.currentTarget as HTMLElement).style.transform = 'scale(0.95)';
  }

  onNearbyTouchEnd(event: TouchEvent) {
    (event.currentTarget as HTMLElement).style.transform = 'scale(1)';
  }

  loadNearbyAddresses() {
    const geocoder = new google.maps.Geocoder();

    this.nearbyPhotos.forEach((photo, index) => {
      geocoder.geocode(
        { location: { lat: photo.lat, lng: photo.lng } },
        (results: any, status: any) => {
          this.ngZone.run(() => {
            if (status === 'OK' && results[0]) {
              const parts = results[0].formatted_address.split(',');
              this.nearbyPhotos[index].address = parts[0].trim();
            } else {
              this.nearbyPhotos[index].address = 'Ubicación desconocida';
            }
          });
        }
      );
    });
  }

  async deletePhoto() {
    if (!this.selectedPhoto) return;

    const loading = await this.loadingCtrl.create({
      message: 'Eliminando foto...',
      spinner: 'crescent',
      cssClass: 'upload-loading'
    });
    await loading.present();

    try {
      await new Promise<void>((resolve, reject) => {
        this.photoService.deletePhoto(this.selectedPhoto._id).subscribe({
          next: () => resolve(),
          error: (err) => reject(err)
        });
      });

      await loading.dismiss();
      this.closeModal();
      await this.showToast('Foto eliminada correctamente', 'success');
      this.loadPinsData();

    } catch (err) {
      await loading.dismiss();
      console.error('Error al eliminar:', err);
      await this.showToast('Error al eliminar la foto', 'danger');
    }
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

  toggleMapType() {
    this.isSatellite = !this.isSatellite;
    if (this.map) {
      this.map.setMapTypeId(
        this.isSatellite
          ? google.maps.MapTypeId.HYBRID
          : google.maps.MapTypeId.ROADMAP
      );
    }
  }

  toggleFavorite(photo: any) {
    const index = this.favoritePhotos.findIndex(f => f._id === photo._id);
    if (index === -1) {
      this.favoritePhotos.push(photo);
      this.showToast('Añadido a favoritos', 'success');
    } else {
      this.favoritePhotos.splice(index, 1);
      this.showToast('Eliminado de favoritos', 'warning');
    }

    this.photoService.toggleFavorite(photo._id).subscribe({
      error: (err) => console.error("Error al guardar favorito", err)
    });
  }

  isFavorite(photo: any): boolean {
    return this.favoritePhotos.some(f => f._id === photo?._id);
  }

  openFavoritesModal() {
    this.isFavoritesModalOpen = true;
  }

  goToPhoto(photo: any) {
    this.isFavoritesModalOpen = false;
    setTimeout(() => {
      if (this.map) {
        this.map.panTo({ lat: photo.lat, lng: photo.lng });
        this.map.setZoom(18);
      }
      this.openModal(photo);
    }, 300);
  }

  openMapSearch() {
    this.isMapSearchOpen = true;
    setTimeout(() => {
      const input = document.getElementById('mapSearchInput') as HTMLInputElement;
      if (!input || !this.map) return;

      const autocomplete = new google.maps.places.Autocomplete(input, {
        fields: ['geometry', 'name']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;
        this.map.panTo(place.geometry.location);
        this.map.setZoom(15);
        this.isMapSearchOpen = false;
        input.blur();
      });

      input.focus();
    }, 200);
  }

  toggleRouteMode() {
    this.isRouteModeActive = !this.isRouteModeActive;
    if (this.isRouteModeActive) {
      this.isRoutePanelOpen = true;
      this.showToast('Toca los pins para añadirlos a la ruta 🗺️', 'success');
      this.renderMarkers(); // re-renderiza con modo ruta
    } else {
      this.clearRoute();
    }
  }

  addToRoute(photo: any) {
    const already = this.routePins.findIndex(p => p._id === photo._id);
    if (already !== -1) {
      this.routePins.splice(already, 1);
    } else {
      this.routePins.push(photo);
    }
  }

  isInRoute(photo: any): boolean {
    return this.routePins.some(p => p._id === photo._id);
  }

  getRouteIndex(photo: any): number {
    return this.routePins.findIndex(p => p._id === photo._id) + 1;
  }

  removeFromRoute(index: number) {
    this.routePins.splice(index, 1);
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
      this.directionsRenderer = null;
    }
  }

  loadSavedRoutes() {
    this.routeService.getRoutes().subscribe({
      next: (res) => this.savedRoutes = res.data || [],
      error: (err) => console.error('Error cargando rutas:', err)
    });
  }

  async drawRoute() {
    if (this.routePins.length < 2) {
      await this.showToast('Añade al menos 2 pins para trazar la ruta', 'warning');
      return;
    }

    if (!this.directionsService) {
      this.directionsService = new google.maps.DirectionsService();
    }
    if (this.directionsRenderer) this.directionsRenderer.setMap(null);

    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#FF6B00',
        strokeWeight: 6,
        strokeOpacity: 0.95
      }
    });
    this.directionsRenderer.setMap(this.map);

    let startLat: number;
    let startLng: number;

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000
      });
      startLat = position.coords.latitude;
      startLng = position.coords.longitude;
    } catch {
      // Si falla el GPS, empezar desde el primer pin
      startLat = this.routePins[0].lat;
      startLng = this.routePins[0].lng;
      await this.showToast('GPS no disponible, empezando desde el primer pin', 'warning');
    }

    const origin      = { lat: startLat, lng: startLng };
    const destination = {
      lat: this.routePins[this.routePins.length - 1].lat,
      lng: this.routePins[this.routePins.length - 1].lng
    };

    // Todos los pins son waypoints (incluido el primero)
    const waypoints = this.routePins.map(p => ({
      location: new google.maps.LatLng(p.lat, p.lng),
      stopover: true
    }));

    this.directionsService.route({
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.WALKING,
      optimizeWaypoints: false
    }, (result: any, status: any) => {
      this.ngZone.run(async () => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(result);
          this.isRoutePanelOpen = false;
          this.isNavigating = true;
          this.currentNavIndex = 0;

          this.map.setOptions({
            tilt: 45,
            zoom: 18,
            center: { lat: startLat, lng: startLng },
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            gestureHandling: 'greedy'
          });

          await this.renderMarkers();
          this.startGpsTracking();
          await this.showToast('Navegación iniciada', 'success');
        } else {
          await this.showToast('No se pudo trazar la ruta', 'danger');
        }
      });
    });
  }

  goToNextPin() {
    if (this.currentNavIndex < this.routePins.length - 1) {
      this.currentNavIndex++;
      const pin = this.routePins[this.currentNavIndex];
      this.map.panTo({ lat: pin.lat, lng: pin.lng });
      this.map.setZoom(17);
    }
  }

  goToPrevPin() {
    if (this.currentNavIndex > 0) {
      this.currentNavIndex--;
      const pin = this.routePins[this.currentNavIndex];
      this.map.panTo({ lat: pin.lat, lng: pin.lng });
      this.map.setZoom(17);
    }
  }

  openSaveRouteModal() {
    this.pendingRouteName = '';
    this.isSaveRouteModalOpen = true;
  }

  async confirmSaveRoute() {
    if (!this.pendingRouteName.trim()) {
      await this.showToast('Escribe un nombre para la ruta', 'warning');
      return;
    }
    const pins = this.routePins.map(p => ({
      photoId: p._id, image: p.image,
      lat: p.lat, lng: p.lng, address: p.address || ''
    }));
    this.routeService.saveRoute(this.pendingRouteName.trim(), pins).subscribe({
      next: async () => {
        this.isSaveRouteModalOpen = false;
        this.loadSavedRoutes();
        await this.showToast('Ruta guardada ✅', 'success');
      },
      error: async () => await this.showToast('Error al guardar la ruta', 'danger')
    });
  }

  openDeleteRouteConfirm(route: any) {
    this.routeToDelete = route;
    this.deleteRouteAlertButtons = [
      { text: 'Cancelar', role: 'cancel', handler: () => { this.routeToDelete = null; } },
      { text: 'Eliminar', role: 'destructive', handler: () => { this.confirmDeleteRoute(); } }
    ];
  }

  confirmDeleteRoute() {
    if (!this.routeToDelete) return;
    this.routeService.deleteRoute(this.routeToDelete._id).subscribe({
      next: async () => {
        this.loadSavedRoutes();
        this.routeToDelete = null;
        await this.showToast('Ruta eliminada', 'success');
      },
      error: async () => await this.showToast('Error al eliminar', 'danger')
    });
  }

  loadSavedRoute(route: any) {
    this.isSavedRoutesModalOpen = false;
    this.routePins = route.pins.map((p: any) => ({
      _id: p.photoId, image: p.image,
      lat: p.lat, lng: p.lng, address: p.address
    }));
    this.isRouteModeActive = true;
    this.isRoutePanelOpen = true;
    this.renderMarkers();
    setTimeout(() => this.drawRoute(), 300);
  }

  clearRoute() {
    this.stopGpsTracking();
    this.isRouteModeActive = false;
    this.isNavigating = false;
    this.currentNavIndex = 0;
    this.distanceToNext = '';
    this.routePins = [];
    this.isRoutePanelOpen = false;
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
      this.directionsRenderer = null;
    }
    // Restaurar vista normal
    this.map.setOptions({ tilt: 0, zoom: 14, gestureHandling: 'auto' });
    this.renderMarkers();
  }

  async renderMarkers() {
    if (!this.map) return;

    if (this.clusterer) { this.clusterer.clearMarkers(); this.clusterer = null; }
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];

    // En navegación activa: solo pins de la ruta
    // En modo selección o normal: todos los pins
    const photosToRender = this.isNavigating
      ? this.photos.filter(p => this.routePins.some(rp => rp._id === p._id))
      : this.photos;

    if (!photosToRender || photosToRender.length === 0) return;

    for (const photo of photosToRender) {
      let iconDataUrl: string;
      try {
        iconDataUrl = await this.createCircularMarker(photo.image);
      } catch {
        iconDataUrl = photo.image;
      }

      const isSelected = this.isInRoute(photo);
      const markerSize = isSelected ? 60 : 50;
      const anchor = isSelected ? 30 : 25;

      const marker = new google.maps.Marker({
        position: { lat: photo.lat, lng: photo.lng },
        title: 'Toca para ver',
        icon: {
          url: iconDataUrl,
          scaledSize: new google.maps.Size(markerSize, markerSize),
          anchor: new google.maps.Point(anchor, anchor)
        }
      });

      marker.addListener('click', () => {
        this.ngZone.run(() => {
          if (this.isRouteModeActive && !this.isNavigating) {
            this.addToRoute(photo);
            // Solo actualiza el tamaño de ESTE marker, sin re-renderizar todo
            const newSize = this.isInRoute(photo) ? 60 : 50;
            const newAnchor = this.isInRoute(photo) ? 30 : 25;
            marker.setIcon({
              url: iconDataUrl,
              scaledSize: new google.maps.Size(newSize, newSize),
              anchor: new google.maps.Point(newAnchor, newAnchor)
            });
          } else {
            this.openModal(photo);
          }
        });
      });

      this.markers.push(marker);
    }

    // Clusterer solo en modo normal, sin ruta
    if (!this.isRouteModeActive && !this.isNavigating) {
      this.clusterer = new MarkerClusterer({
        map: this.map,
        markers: this.markers,
        renderer: {
          render: ({ count, position }: any) => {
            const size = count < 10 ? 28 : count < 50 ? 34 : 40;
            const fontSize = count < 10 ? 13 : count < 50 ? 14 : 15;
            const total = size * 2 + 16;

            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}">
            <circle cx="${total/2}" cy="${total/2}" r="${size + 6}" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" stroke-width="1">
              <animate attributeName="r" values="${size+4};${size+12};${size+4}" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="${total/2}" cy="${total/2}" r="${size}" fill="rgba(30,30,40,0.92)" stroke="rgba(255,255,255,0.9)" stroke-width="2"/>
            <text x="${total/2}" y="${total/2}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="${fontSize}" font-weight="700" font-family="sans-serif">${count}</text>
          </svg>`.trim();

            const clusterMarker = new google.maps.Marker({
              position,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
                scaledSize: new google.maps.Size(total, total),
                anchor: new google.maps.Point(total / 2, total / 2)
              },
              zIndex: 1000 + count
            });

            return clusterMarker;
          }
        }
      });
    } else {
      // Modo ruta o navegación: añadir markers directamente al mapa
      this.markers.forEach(m => m.setMap(this.map));
    }
  }

  startGpsTracking() {
    // Limpia tracking anterior si existe
    if (this.gpsWatchId) {
      navigator.geolocation.clearWatch(parseInt(this.gpsWatchId));
    }

    this.gpsWatchId = String(navigator.geolocation.watchPosition(
      (position) => {
        this.ngZone.run(() => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const heading = position.coords.heading;

          // Actualizar marcador de usuario
          this.userLocation = { lat, lng };
          if (this.userMarker) this.userMarker.setPosition({ lat, lng });

          // Centrar mapa siguiendo al usuario con orientación
          this.map.moveCamera({
            center: { lat, lng },
            zoom: 18,
            tilt: 60,
            heading: heading && !isNaN(heading) ? heading : 0
          });

          // Calcular distancia al siguiente pin
          const nextPin = this.routePins[this.currentNavIndex];
          if (nextPin) {
            const dist = this.getDistanceMeters(lat, lng, nextPin.lat, nextPin.lng);
            this.distanceToNext = dist < 1000
              ? `${Math.round(dist)} m`
              : `${(dist / 1000).toFixed(1)} km`;

            // Auto-avanzar si estamos a menos de 30m del pin actual
            if (dist < 30 && this.currentNavIndex < this.routePins.length - 1) {
              this.currentNavIndex++;
              this.showToast(` Pin ${this.currentNavIndex + 1} alcanzado`, 'success');
            }

            if (dist < 30 && this.currentNavIndex === this.routePins.length - 1) {
              this.showToast(' ¡Has llegado al destino final!', 'success');
              this.stopGpsTracking();
            }
          }
        });
      },
      (err) => console.warn('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    ));
  }

  stopGpsTracking() {
    if (this.gpsWatchId !== null) {
      navigator.geolocation.clearWatch(parseInt(this.gpsWatchId));
      this.gpsWatchId = null;
    }
  }

  async openUserMenu() {
    const user = this.authService.currentUser;
    const sheet = await this.actionSheetCtrl.create({
      header: user ? ` ${user.username}` : 'Usuario',
      buttons: [
        {
          text: 'Mi perfil',
          icon: 'person-circle',
          handler: () => {
            this.router.navigateByUrl('/profile');
          }
        },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          icon: 'log-out',
          handler: () => {
            this.authService.logout();
            this.router.navigateByUrl('/login');
          }
        },
        { text: 'Cancelar', role: 'cancel', icon: 'close' }
      ]
    });
    await sheet.present();
  }

  protected readonly HTMLElement = HTMLElement;
  protected readonly style = style;
}
