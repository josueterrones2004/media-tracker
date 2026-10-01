# Media Tracker

Media Tracker es una aplicación web para registrar, organizar y compartir las películas, series, libros y videojuegos que consumes.

El proyecto combina una biblioteca personal con funciones sociales: perfiles públicos, seguidores, actividad reciente, reviews, favoritos y seguimiento del progreso.

Actualmente se encuentra en una etapa temprana de desarrollo.

## Demo

Media Tracker está desplegado en Vercel:

https://media-tracker-five-swart.vercel.app

## Funciones principales

Media Tracker permite gestionar cuatro tipos de contenido:

- Películas
- Series
- Libros
- Videojuegos

Cada usuario puede mantener su propia biblioteca utilizando estados como:

- Pendiente
- Viendo
- Leyendo
- Jugando
- Abandonado
- Completado / visto / leído

Los estados activos pueden eliminarse volviendo a pulsarlos.

En el caso de las series, quitar una serie de "Viendo" no elimina los capítulos que ya fueron registrados como vistos.

## Reviews y puntuaciones

Los usuarios pueden registrar una película, serie, libro o videojuego aunque no escriban una review.

Cada registro puede contener:

- Puntuación de 0.5 a 5 estrellas
- Medias estrellas
- Like / dislike
- Review escrita opcional
- Spoilers
- Rewatch
- Relectura
- Replay
- Fecha del registro

Las reviews pueden editarse o eliminarse posteriormente.

El borrado utiliza un diálogo propio de Media Tracker en lugar del popup nativo del navegador.

## Series

Las series tienen seguimiento individual de episodios.

Media Tracker conserva:

- Temporada
- Número de episodio
- Nombre del episodio
- Fecha de visualización
- Rewatch

El progreso de episodios se mantiene incluso si la serie deja de estar marcada como "Viendo".

## Videojuegos

Los videojuegos pueden estar:

- Jugando
- Pendientes
- Abandonados
- Completados

Los juegos completados funcionan como el resto de medios: al pulsar sobre uno se abre directamente su registro/review.

También es posible registrar replays sin eliminar completados anteriores.

## Perfiles

Cada usuario dispone de un perfil personalizable con:

- Nombre visible
- Username
- Bio
- Avatar
- Banner
- Recorte personalizado de imágenes
- Películas favoritas
- Series favoritas
- Libros favoritos
- Juegos favoritos
- Secciones configurables
- Actividad reciente
- Seguidores
- Seguidos

Los perfiles pueden tener roles especiales como:

- Owner
- Beta Tester

## Social

Media Tracker incluye funciones sociales para descubrir lo que están consumiendo otros usuarios.

Actualmente incluye:

- Seguir y dejar de seguir usuarios
- Perfiles públicos
- Seguidores y seguidos
- Feed de actividad
- Likes en actividades
- Reviews de personas seguidas
- Notificaciones
- Búsqueda de usuarios

## Inicio

El dashboard principal muestra un resumen de la biblioteca del usuario, incluyendo contenido pendiente o en progreso, actividad reciente y reviews de personas seguidas.

## Búsqueda

La aplicación dispone de búsqueda para encontrar:

- Películas
- Series
- Libros
- Videojuegos
- Usuarios

## Aplicación instalable

Media Tracker puede instalarse como una aplicación web progresiva.

En navegadores compatibles aparece una opción para instalar Media Tracker directamente desde la web.

Una vez instalada:

- Aparece un icono en la pantalla de inicio
- Se abre en modo standalone
- No necesita abrirse manualmente desde una pestaña del navegador

En iPhone y iPad se muestra una pequeña guía explicando cómo usar:

Compartir → Añadir a pantalla de inicio → Añadir

## Changelog dentro de la aplicación

Cuando se publica una nueva versión, Media Tracker puede mostrar automáticamente un changelog al usuario.

El changelog se muestra una sola vez por versión en cada navegador.

---

# Tecnologías

El proyecto utiliza:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- TMDB
- Open Library
- IGDB
- Vercel

Supabase se utiliza para autenticación, perfiles, biblioteca, reviews, actividad y funciones sociales.

---

# Historial del proyecto

## 15 de septiembre de 2026

Se crea el proyecto base utilizando Create Next App.

Esta versión todavía correspondía principalmente al scaffold inicial de Next.js.

## v0.1.0 — 25 de septiembre de 2026

Primera versión funcional de Media Tracker.

### Biblioteca

Se introduce el sistema principal para registrar contenido.

Incluye:

- Películas
- Series
- Libros
- Estados de biblioteca
- Reviews
- Like / dislike
- Rewatch y relectura

### Series

Se añade seguimiento individual de episodios y temporadas.

Los episodios vistos pueden almacenarse de forma independiente al estado general de la serie.

### Perfiles

Se introduce el sistema de perfiles con:

- Avatar
- Banner
- Bio
- Username
- Favoritos
- Secciones configurables
- Actividad reciente

### Social

Se crea la primera versión del sistema social:

- Perfiles públicos
- Seguidores
- Seguidos
- Feed de actividad
- Likes
- Reviews sociales

### Juegos

Durante esta primera etapa de desarrollo también se incorpora el seguimiento de videojuegos.

### Navegación y búsqueda

Se añaden las primeras vistas de biblioteca, búsqueda y navegación entre las principales áreas de la aplicación.

---

# Changelog

## v0.2.0 — 30 de septiembre de 2026

Primera actualización importante de Media Tracker.

### Nuevo sistema de puntuaciones

Se añade un sistema de puntuación de cinco estrellas.

Permite utilizar:

- 0.5
- 1
- 1.5
- 2
- 2.5
- 3
- 3.5
- 4
- 4.5
- 5

La puntuación es opcional.

### Reviews opcionales

Ya no es obligatorio escribir texto al registrar contenido.

Ahora es posible guardar un registro únicamente con una puntuación, un like o incluso sin review escrita.

### Edición de reviews

Las reviews existentes pueden modificarse.

Se pueden cambiar:

- Texto
- Puntuación
- Like
- Spoilers
- Rewatch
- Relectura
- Replay

### Eliminación de reviews

Las reviews ahora pueden borrarse desde su modal.

Se reemplaza el diálogo nativo del navegador por un popup diseñado específicamente para Media Tracker.

### Mejor gestión de la biblioteca

Los estados de biblioteca ahora funcionan como toggles.

Si un elemento ya está marcado como:

- Pendiente
- Viendo
- Leyendo
- Jugando
- Abandonado

volver a pulsar el mismo estado lo elimina de esa categoría.

### Progreso de series persistente

Quitar una serie de "Viendo" ya no afecta los capítulos registrados.

El historial de episodios permanece guardado.

### Mejoras en videojuegos

Los juegos completados ahora abren su review directamente en lugar de redirigir automáticamente a la ficha del juego.

También se mejora el soporte para replays.

### Rediseño visual

Se revisan las principales áreas de Media Tracker:

- Inicio
- Películas
- Series
- Libros
- Juegos
- Perfil
- Social
- Navegación

Se mejora especialmente el comportamiento responsive y la experiencia en dispositivos móviles.

### Perfiles

Se rediseña la página de perfil.

Se mejora:

- Banner
- Avatar
- Distribución de contenido
- Favoritos
- Actividad reciente
- Pendientes
- Navegación móvil
- Estadísticas sociales

### Social

Se reorganiza la página Social y la búsqueda de usuarios.

También se mejora la presentación de actividad y reviews.

### PWA

Media Tracker pasa a poder instalarse como aplicación.

Incluye:

- Web App Manifest
- Icono de aplicación
- Modo standalone
- Prompt de instalación en navegadores compatibles
- Guía específica para instalación en iOS

### Changelog integrado

Se añade un sistema de changelog dentro de Media Tracker.

Cada nueva versión puede mostrar automáticamente sus novedades una única vez al usuario.

---

# Estado del proyecto

Media Tracker continúa en una etapa pre-alpha.

La aplicación puede contener errores, funciones incompletas y cambios de diseño o comportamiento entre versiones.

El proyecto se desarrolla principalmente como proyecto personal y de portfolio.