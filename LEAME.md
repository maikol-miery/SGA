# Sistema de Gestión Académica y Convivir (PWA & Offline-First)

Aplicación web progresiva diseñada para instituciones educativas, optimizada para trabajar en condiciones de intermitencia de red y cortes eléctricos.

## Características Principales

1. **Código 100% en Español:** Todos los tipos, variables, esquemas de base de datos, métodos de stores e interfaces de usuario están en español.
2. **Motor del Convivir (4.0 pts fijos por módulo):**
   - 2.0 pts en Presentación Formal + 2.0 pts en Conducta.
   - Descuentos de -0.5 pts por falta con motivo obligatorio.
   - Bloqueo a 0.0 pts por Falta Muy Grave (exclusivo para coordinadoras de nivel).
   - Generador automático de texto de observaciones listo para transcribir.
3. **Planilla de Calificaciones (Escala 1 al 20):**
   - Columnas dinámicas A, B, C, D, E con leyenda configurable.
   - Columna F fija (Convivir = 4 pts).
   - Validación estricta: suma $(A+B+C+D+E)+4 = 20$ pts.
   - Sumatoria y definitiva reactiva en tiempo real.
4. **Modo Transcripción Rápida (PC):**
   - Interfaz de alto contraste para transcripción ágil al portal del colegio.
   - Navegación con teclado (`Arriba`, `Abajo`, `Enter`).
   - Botón de copiado de observación al portapapeles en 1 clic.
5. **Control Diario de Clases:**
   - Registro de temas dados, desarrollo de la jornada y tareas asignadas.
6. **Calendario y Fechas Límite:**
   - Evaluaciones docentes (azul) y fechas institucionales de coordinación (rojo, inmutables para docentes).
7. **Offline-First:**
   - Cola de sincronización local persistida en `localStorage` con reintento automático al restablecer la conexión (`window.ononline`).
   - SQLite local integrado mediante `better-sqlite3` en el servidor Nitro.

## Cómo Iniciar en Desarrollo

```powershell
pnpm run dev
```
o
```powershell
npm run dev
```

La aplicación estará disponible de inmediato en `http://localhost:3000`.
