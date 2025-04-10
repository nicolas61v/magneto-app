# CV Analyzer

Una aplicación moderna desarrollada con Next.js que utiliza inteligencia artificial para extraer, procesar y estructurar información de currículums vitae mediante análisis de imágenes.

## Descripción General

CV Analyzer es una herramienta que simplifica el proceso de extracción de información de hojas de vida. Sube una imagen de un CV, y la aplicación utilizará Google Vision AI para extraer el texto y Google AI Studio (Gemini) para analizar y estructurar la información en un formato utilizable, con la posibilidad de exportar el resultado como PDF.

## Tecnologías Utilizadas

### Frontend
- **Next.js 14**: Framework React con renderizado del lado del servidor
- **TypeScript**: Tipado estático para JavaScript
- **TailwindCSS**: Framework CSS utilitario para estilizado
- **React Hooks**: Gestión del estado y efectos secundarios

### Backend & Servicios
- **Firebase**:
  - **Storage**: Almacenamiento de imágenes de CV
  - **Firestore** (opcional): Almacenamiento de datos procesados
- **Google Cloud Vision AI**: Extracción de texto de imágenes (OCR)
- **Google AI Studio (Gemini)**: Procesamiento y estructuración del texto mediante IA
- **Next.js API Routes**: Endpoints para procesamiento seguro en el servidor

### Utilidades
- **jsPDF**: Generación de documentos PDF
- **jsPDF-AutoTable**: Tablas formateadas para PDF

## Arquitectura y Estructura del Proyecto

```
src
 ┣ app                      # Rutas y páginas de Next.js
 ┃ ┣ api                    # API Routes para backend
 ┃ ┃ ┗ process-cv           # Endpoint para procesar CV
 ┃ ┃ ┃ ┗ route.ts           # Lógica de procesamiento con Gemini AI
 ┃ ┣ dashboard              # Página principal de la aplicación
 ┃ ┃ ┣ layout.tsx           # Layout contenedor para el dashboard
 ┃ ┃ ┗ page.tsx             # Componente principal del dashboard
 ┃ ┗ page.tsx               # Página de inicio (redirección)
 ┣ components               # Componentes reutilizables
 ┃ ┣ cv                     # Componentes específicos para CV
 ┃ ┃ ┣ FileUploader.tsx     # Carga de archivos a Firebase
 ┃ ┃ ┣ PdfGenerator.tsx     # Generación de PDF
 ┃ ┃ ┗ ResultViewer.tsx     # Visualización de datos estructurados
 ┃ ┣ layout                 # Componentes de estructura
 ┃ ┃ ┣ Navbar.tsx           # Barra de navegación
 ┃ ┗ ui                     # Componentes de interfaz genéricos
 ┃   ┣ Button.tsx           # Botón reutilizable
 ┃   ┣ Input.tsx            # Input reutilizable
 ┃   ┗ Loader.tsx           # Indicador de carga
 ┣ hooks                    # Custom hooks de React
 ┃ ┣ useFileUpload.ts       # Hook para subir archivos a Firebase
 ┃ ┣ useGeminiAI.ts         # Hook para interactuar con Gemini AI
 ┃ ┣ usePdfGeneration.ts    # Hook para generar PDFs
 ┃ ┗ useVisionAI.ts         # Hook para interactuar con Vision AI
 ┣ services                 # Servicios y conexiones externas
 ┃ ┣ firebase.ts            # Configuración de Firebase
 ┃ ┣ geminiAI.ts            # Servicio para Google AI Studio
 ┃ ┣ pdfService.ts          # Servicio de generación de PDF
 ┃ ┗ visionAI.ts            # Servicio para Google Vision AI
 ┣ types                    # Definiciones de tipos TypeScript
 ┃ ┣ api.ts                 # Tipos para respuestas API
 ┃ ┣ components.ts          # Tipos para props de componentes
 ┃ ┗ cv.ts                  # Tipos para datos del CV
 ┗ utils                    # Utilidades y helpers
   ┣ constants.ts           # Constantes de la aplicación
   ┣ formatters.ts          # Formato de datos
   ┗ validators.ts          # Validación de datos
```

## Flujo de Trabajo de la Aplicación

### 1. Subida de Imagen
- El usuario accede al dashboard (`/dashboard`)
- Sube una imagen que contiene un CV usando el componente `FileUploader`
- La imagen se almacena en Firebase Storage
- Se obtiene una URL para la imagen almacenada

### 2. Extracción de Texto
- La URL de la imagen se envía a Google Vision AI a través del endpoint `/api/extract-text`
- Vision AI aplica OCR (reconocimiento óptico de caracteres) para extraer todo el texto visible
- El texto extraído se devuelve al frontend en formato plano

### 3. Procesamiento con IA
- El texto extraído se envía a Google Gemini AI a través del endpoint `/api/process-cv`
- Gemini AI recibe un prompt especializado que le indica cómo procesar el texto:
  ```
  Actúa como un asistente de RRHH experto en análisis de currículums.
  Analiza el siguiente texto extraído de un CV y estructúralo en formato JSON.
  ```
- La IA analiza el texto e identifica:
  - Información personal (nombre, email, teléfono)
  - Experiencia laboral
  - Educación
  - Habilidades
  - Idiomas y otros datos relevantes
- Devuelve una estructura JSON organizada con toda la información

### 4. Visualización de Resultados
- El componente `ResultViewer` recibe los datos estructurados
- Muestra la información en secciones organizadas para mejor comprensión
- Proporciona una vista clara y legible del CV procesado

### 5. Generación de PDF
- El usuario puede generar un PDF con el botón en la interfaz
- El componente `PdfGenerator` toma los datos estructurados
- Utiliza jsPDF para crear un documento con formato profesional
- El usuario puede descargar el PDF para compartir o archivar

## Componentes Principales y su Funcionamiento

### FileUploader
Este componente gestiona la carga de imágenes de CV a Firebase Storage:
- Permite la selección de archivos de imagen
- Valida el tipo y tamaño del archivo
- Muestra el progreso de carga
- Notifica cuando la carga está completa o si hay errores

### ResultViewer
Muestra los datos estructurados del CV:
- Organiza la información en secciones lógicas
- Visualiza datos personales, experiencia, educación y habilidades
- Se adapta a diferentes tamaños de pantalla
- Proporciona acciones como generar PDF

### API Routes

#### `/api/extract-text`
Endpoint para la extracción de texto mediante Vision AI:
- Recibe la URL de la imagen almacenada en Firebase
- Se comunica con Google Vision AI para OCR
- Devuelve el texto extraído y nivel de confianza

#### `/api/process-cv`
Endpoint clave que utiliza Gemini AI para procesar el texto:
- Recibe el texto extraído del CV
- Utiliza un prompt especializado para análisis de CV
- Se comunica con Google AI Studio (Gemini)
- Procesa la respuesta para asegurar un formato JSON válido
- Maneja casos de error y respuestas inesperadas
- Devuelve los datos estructurados del CV

## Configuración y Uso de APIs Externas

### Firebase
La aplicación utiliza Firebase para almacenamiento:
- **Storage**: Almacena las imágenes de CV subidas por los usuarios
- Configuración en `src/services/firebase.ts`
- Requiere credenciales de Firebase (apiKey, authDomain, etc.)

### Google Vision AI
Servicio de OCR para extraer texto de imágenes:
- API configurada en `src/services/visionAI.ts`
- Utiliza la librería `@google-cloud/vision`
- Requiere credenciales de Google Cloud (archivo JSON)

### Google AI Studio (Gemini)
Motor de IA para procesamiento de lenguaje natural:
- API configurada en `src/services/geminiAI.ts`
- Utiliza la librería `@google/generative-ai`
- Requiere una API key de Google AI Studio
- El prompt especializado está en `src/app/api/process-cv/route.ts`

## Instalación y Configuración

### Requisitos Previos
- Node.js 18.x o superior
- Cuenta de Firebase
- Cuenta de Google Cloud con Vision AI habilitado
- Acceso a Google AI Studio (Gemini)

### Pasos de Configuración

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/cv-analyzer.git
   cd cv-analyzer
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crear un archivo `.env.local` en la raíz:
   ```
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id

   # Google Cloud
   GOOGLE_APPLICATION_CREDENTIALS=ruta-a-tu-archivo-de-credenciales.json
   GOOGLE_AI_STUDIO_API_KEY=tu-api-key-de-gemini
   ```

4. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Acceder a la aplicación**
   Abrir [http://localhost:3000](http://localhost:3000) en el navegador

## Casos de Uso

### Departamentos de Recursos Humanos
- Procesamiento rápido de CVs recibidos
- Extracción automática de datos para sistemas de ATS
- Comparación estructurada entre candidatos

### Agencias de Reclutamiento
- Análisis masivo de perfiles
- Extracción de palabras clave y habilidades
- Categorización automática de candidatos

### Uso Personal
- Digitalización de tu propio CV
- Extracción de información para portales de empleo
- Generación de versiones resumidas en formato PDF

## Extensiones Potenciales

- **Análisis de Sentimiento**: Evaluar el tono y estilo de escritura del CV
- **Comparador de Perfiles**: Herramienta para comparar múltiples CVs
- **Sugerencias de Mejora**: Recomendaciones para mejorar el contenido del CV
- **Integración con ATS**: Conexión con sistemas de seguimiento de aplicaciones
- **Análisis de Categoría Profesional**: Clasificación automática por sector y nivel
- **Detección de Palabras Clave**: Identificación de términos relevantes para el mercado laboral

## Funcionamiento Técnico Detallado

### Hooks Personalizados

#### useFileUpload
Hook que gestiona la subida de archivos a Firebase Storage:
- Inicia la carga con `uploadBytes` de Firebase
- Controla el progreso de la carga
- Genera y devuelve la URL del archivo subido

#### useVisionAI
Hook que gestiona la comunicación con Vision AI:
- Envía la URL de la imagen al endpoint `/api/extract-text`
- Maneja estados de carga y errores
- Devuelve el texto extraído

#### useGeminiAI
Hook que gestiona la comunicación con Gemini AI:
- Envía el texto extraído al endpoint `/api/process-cv`
- Maneja estados de procesamiento y errores
- Devuelve los datos estructurados

#### usePdfGeneration
Hook que gestiona la generación de PDF:
- Toma los datos estructurados del CV
- Crea un documento jsPDF con formato profesional
- Devuelve la URL del PDF generado

## Consideraciones de Rendimiento

- **Tamaño de las Imágenes**: Recomendado no superar los 5MB para un procesamiento óptimo
- **Tipos de Archivo**: Mejores resultados con formatos .jpg, .png y .pdf
- **Calidad de Imagen**: Mayor precisión en extracción con imágenes claras y nítidas
- **Tiempo de Procesamiento**: Aproximadamente 5-15 segundos para el flujo completo
- **Limitaciones de API**: Considerar los límites de las APIs gratuitas (cuotas diarias)

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

Desarrollado con ❤️ usando Next.js, Firebase y Google AI
