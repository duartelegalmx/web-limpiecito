# Duarte Legal Ensenada — Sitio web

Sitio estático + una Cloudflare Pages Function para el diagnóstico con IA.

## Estructura

```
/index.html              Página principal
/css/styles.css          Estilos
/js/main.js              Reveals al scroll + calculadora de viabilidad
/functions/api/analyze.js  Pages Function: proxy seguro a la API de Anthropic
```

## Desplegar en Cloudflare Pages

1. Sube esta carpeta a un repositorio (GitHub/GitLab) **o** usa despliegue directo:
   `npx wrangler pages deploy .` desde esta carpeta.
2. En Cloudflare Pages, crea el proyecto apuntando a la raíz de esta carpeta.
   - Build command: *(ninguno)* · Output directory: `/`
3. **Configura la clave de la IA** (obligatorio para la calculadora):
   - Dashboard → Pages → tu proyecto → *Settings* → *Environment variables*
   - Añade `ANTHROPIC_API_KEY` con tu clave de https://console.anthropic.com
4. Redespliega. Listo.

Sin la variable configurada, el sitio funciona igual pero la calculadora
mostrará un mensaje de error invitando a contactar por WhatsApp.

## Personalizar

- **WhatsApp:** busca `wa.me/526461510992` en `index.html` (3 enlaces).
- **Agenda en línea:** los enlaces "AGENDAR" apuntan a `#contacto`;
  reemplázalos con tu URL de Calendly/Cal.com cuando la tengas.
- **Testimonios:** los tres testimonios de `index.html` son texto de muestra —
  reemplázalos con testimonios reales antes de lanzar.
- **Modelo de IA:** en `functions/api/analyze.js` (`model: 'claude-haiku-4-5'`).
