# 🏫 Sistema de Gestión Académica, Control de Convivir y Diario de Clases (PWA & Offline-First)

Aplicación Web Progresiva (PWA) de alto rendimiento orientada a unidades educativas y colegios. Diseñada bajo la filosofía **Offline-First**, permitiendo a docentes y directivos registrar notas, incidencias disciplinarias y diarios de clase sin interrupciones por caídas de internet o fallas de suministro eléctrico.

---

## 🌟 Características Principales

1. **Código 100% en Español:**
   - Modelado de datos, tablas SQLite, interfaces TypeScript, Pinia Stores y vistas implementados totalmente en español sin anglicismos técnicos innecesarios.

2. **Motor Disciplinario "Convivir" (4.0 pts institucionales fijos):**
   - Cada estudiante inicia con **4.0 puntos** (2.0 pts Presentación Formal + 2.0 pts Conducta).
   - Descuentos táctiles rápidos de **-0.5 pts** con motivos frecuentes o redacción personalizada.
   - **Falta Muy Grave (Candado de Coordinación):** Exclusivo para coordinadoras de nivel (Primaria, Media Baja y Media Alta), bloqueando el puntaje a **0.0 pts** e inhabilitando modificaciones del docente.
   - **Autogenerador de Observaciones Oficiales:** Concatena automáticamente todas las incidencias y sanciones en un texto limpio listo para copiar y transcribir.

3. **Planilla Dinámica de Calificaciones (Escala 1 al 20):**
   - Columnas configurables **A, B, C, D, E** con asignación de nombres de evaluación y puntajes máximos.
   - Columna **F fija (Convivir = 4.0 pts)**.
   - Validación estricta que asegura que $(A + B + C + D + E) + 4 = 20.0\text{ pts}$.
   - Sumatoria definitiva calculada en tiempo real.

4. **Modo Transcripción Rápida (PC):**
   - Interfaz compacta de alto contraste para transcripción ágil hacia sistemas administrativos web.
   - Navegación ágil mediante teclado (`Flecha Arriba`, `Flecha Abajo`, `Enter`).
   - Copiado de la observación disciplinaria al portapapeles con 1 solo clic.

5. **Gestor de Lapsos, Módulos y Tipos de Evaluación:**
   - Creación de módulos por lapso académico (I, II y III Lapso).
   - Tipificación de evaluaciones: *Regular / Ordinaria*, *Recuperación*, *Nivelación* o *Proyecto*.
   - Control de ponderación acumulada del lapso (100%).

6. **Motor de Exportación Oficial (PDF y Excel):**
   - **Excel (.xlsx):** Planilla del módulo actual y consolidado por lapso con condición académica.
   - **PDF:** Documentos membretados y formateados profesionalmente para archivo físico o firmas de secretaría.

7. **Control Diario de Clases y Calendario:**
   - Registro de temas impartidos, desarrollo de la jornada y tareas para el hogar.
   - Calendario institucional con evaluaciones docentes (azul) y fechas límite de coordinación (rojo, inmutables para docentes).

8. **Arquitectura Offline-First:**
   - Cola de sincronización local persistente (`localStorage`).
   - Detección automática del estado de red (`window.ononline`).
   - Base de datos local integrada mediante SQLite (`better-sqlite3`) en Nitro.

---

## 🛠️ Stack Tecnológico

- **Framework Full-Stack:** Nuxt 3 (Vue 3 Composition API `<script setup lang="ts">`, Nitro Engine).
- **Estilos y UI:** Tailwind CSS + Diseño adaptativo (Sidebar para escritorio / Bottom Bar táctil para móviles).
- **Gestión de Estado:** Pinia.
- **Base de Datos:** SQLite local mediante `better-sqlite3`.
- **Exportaciones:** `jspdf`, `jspdf-autotable`, `xlsx`.
- **Iconografía:** `lucide-vue-next`.

---

## 🚀 Instalación y Despliegue Local

### Requisitos Previos:
- Node.js 20 LTS o superior
- PNPM (recomendado) o NPM

### Pasos para ejecutar:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   cd TU_REPOSITORIO
   ```

2. **Instalar dependencias:**
   ```bash
   pnpm install
   # o
   npm install
   ```

3. **Iniciar en modo desarrollo:**
   ```bash
   pnpm run dev
   # o
   npm run dev
   ```

4. **Acceder a la aplicación:**
   Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 👥 Perfiles de Prueba Pre-cargados (Semilla)

El sistema incluye automáticamente datos iniciales con estudiantes, módulos y usuarios para probar en vivo los 4 roles:

| Rol | Usuario de Prueba | Alcance / Permisos |
| :--- | :--- | :--- |
| **Docente** | *Prof. Carlos Mendoza* | Calificaciones, diario de clases e incidencias leves en sus secciones. |
| **Coordinadora Primaria** | *Lic. María Fernández* | Supervisión y sanción de Falta Muy Grave en 1º a 6º Grado. |
| **Coordinadora Media Baja** | *Prof. Roberto Gómez* | Supervisión y sanción de Falta Muy Grave en 1º a 3º Año. |
| **Coordinadora Media Alta** | *Dra. Patricia Salazar* | Supervisión y sanción de Falta Muy Grave en 4º y 5º Año. |
