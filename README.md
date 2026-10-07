# PhotoPin

> Aplicación móvil full-stack de fotografía geolocalizada enfocada en la exploración turística y descubrimiento visual.

PhotoPin permite capturar, explorar y compartir ubicaciones turísticas a través de fotografías geolocalizadas. La plataforma extrae automáticamente metadatos espaciales (EXIF), agrupa interactivamente puntos de interés en el mapa y ofrece una gestión segura de usuarios y contenido multimedia en la nube.

---

## Características Principales

- **Exploración Interactiva:** Integración con la API de Google Maps con clustering dinámico de marcadores para una navegación fluida con alto volumen de puntos.
- **Extracción de Metadatos EXIF:** Detección y procesamiento automático de geolocalización y datos técnicos al subir una imagen.
- **Autenticación y Seguridad:** Registro e inicio de sesión seguros mediante tokens JWT y encriptación de contraseñas con bcryptjs.
- **Gestión Multimedia en Cloud:** Subida y optimización automatizada de imágenes integrada con Cloudinary.
- **Privacidad y RGPD:** Arquitectura diseñada respetando directivas de protección de datos y permisos granulares de ubicación.

---

## Stack Tecnológico

### Frontend y Móvil
- Ionic 8 + Angular
- RxJS (Programación reactiva y manejo de flujos asíncronos)
- Google Maps JavaScript API (Marker Clustering)
- Capacitor / Plugins nativos (Cámara, Geolocalización)

### Backend y APIs
- Node.js + Express.js (Arquitectura RESTful modular)
- JWT (JSON Web Tokens) + bcryptjs (Seguridad y autorización)
- Multer (Gestión de subida de archivos multipart)

### Base de Datos y Almacenamiento
- MongoDB + Mongoose ODM
- Cloudinary SDK (Almacenamiento de assets multimedia en la nube)

---

## Arquitectura del Proyecto

```text
photopin/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Controladores de peticiones HTTP
│   │   ├── models/           # Esquemas de Mongoose (User, Photo, Pin)
│   │   ├── routes/           # Endpoints de la API REST
│   │   ├── middlewares/      # Verificación de JWT y subida de archivos
│   │   └── utils/            # Extracción de metadatos EXIF y helpers
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── components/   # Componentes UI reutilizables
    │   │   ├── pages/        # Vistas (Mapa, Perfil, Galería, Auth)
    │   └── services/         # Servicios HTTP y gestión de estado reactivo
