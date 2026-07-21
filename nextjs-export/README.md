# FinanzasClaras - Guía de Configuración Rápida

¡Felicitaciones! Tienes listo tu código para **FinanzasClaras**, un gestor de gastos personales optimizado para dispositivos móviles y empaquetado como una Progressive Web App (PWA).

Sigue estos sencillos pasos para tener tu aplicación en la nube conectada a tu base de datos de Supabase y disponible para instalar en tu celular.

---

## 1. Configuración de Base de Datos en Supabase

1. Crea un proyecto gratuito en [Supabase](https://supabase.com/).
2. Ve al panel **SQL Editor** en la barra lateral izquierda.
3. Haz clic en **New query** (Nueva consulta).
4. Copia y pega el contenido del archivo `supabase_schema.sql` (que se encuentra en este directorio) en el editor.
5. Presiona el botón **Run** (Ejecutar) para crear las tablas `transacciones`, `perfil_ingresos` y configurar las políticas RLS.

---

## 2. Configurar Variables de Entorno en Next.js

Crea un archivo llamado `.env.local` en la raíz de tu proyecto Next.js y añade las siguientes líneas con tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_public_key
```

*Nota: Puedes encontrar estas claves en la sección **Project Settings > API** dentro del panel de Supabase.*

---

## 3. Instalación de Dependencias

Ejecuta el siguiente comando en tu terminal para instalar las dependencias necesarias:

```bash
npm install @supabase/supabase-js
```

---

## 4. Despliegue en Vercel (Con un Clic)

1. Sube tu código a un repositorio en **GitHub**.
2. Regístrate o inicia sesión en [Vercel](https://vercel.com/).
3. Haz clic en **Add New... > Project** e importa tu repositorio.
4. En la sección **Environment Variables**, añade las mismas dos variables que pusiste en tu `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Haz clic en **Deploy**. ¡Tu aplicación estará en vivo en menos de 1 minuto!

---

## 5. Instalar como Aplicación Móvil (PWA)

Una vez desplegado en Vercel (con HTTPS activo):
- **En iOS (iPhone):** Abre el enlace en Safari, pulsa el botón **Compartir** (icono con la flecha hacia arriba) y selecciona **Añadir a la pantalla de inicio**.
- **En Android:** Abre el enlace en Chrome, aparecerá un banner sugiriendo "Añadir FinanzasClaras a la pantalla de inicio", o bien toca los tres puntos verticales y selecciona **Instalar aplicación**.
