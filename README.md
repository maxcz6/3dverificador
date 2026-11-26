# Verificador WebAR de certificados

Aplicación web de realidad aumentada que reconoce un certificado con la cámara
del teléfono y presenta información del documento, modelos 3D y un video
superpuestos sobre el marcador.

La aplicación es estática: no utiliza Supabase, base de datos ni servidor API.
Los datos iniciales se leen desde `data/certificados.json`.

## Cómo funciona

1. `index.html` carga A-Frame, MindAR, los modelos GLB, el video y la escena AR.
2. MindAR usa `targets/targets.mind` para buscar el certificado en la cámara.
   El archivo contiene un marcador, con índice `0`, generado desde `cert3d.png`.
3. Al encontrarlo, `js/app.js` muestra los datos asociados a la clave `"0"` de
   `data/certificados.json`. El estado se considera verificado cuando su valor
   es `VERIFICADO` (sin distinguir mayúsculas y minúsculas).
4. El video ocupa el marcador completo y los modelos 3D aparecen fuera de sus
   bordes laterales. La ficha de información se muestra a la izquierda. El video
   se reproduce en bucle mientras el certificado está detectado y se pausa al
   perderlo.
5. Al perder el marcador, se oculta la ficha de información y se vuelve a
   mostrar el aviso para apuntar la cámara.

> La verificación depende de los datos estáticos del JSON. No es una firma
> digital ni una validación contra una entidad externa; los archivos del sitio
> pueden inspeccionarse desde el navegador.

## Tecnologías y versiones

| Tecnología | Versión o formato | Uso |
| --- | --- | --- |
| HTML, CSS y JavaScript | JavaScript nativo, sin paso de compilación | Interfaz, estilos y lógica |
| A-Frame | 1.5.0 | Escena y objetos 3D en el navegador |
| MindAR Image Tracking | 1.2.5 | Detección del certificado impreso |
| JSON | — | Datos locales de certificados |
| glTF Binary | `.glb` | Modelos 3D |
| MPEG-4 | `.mp4`, 1280 × 720 | Video superpuesto |

A-Frame y MindAR se cargan desde CDN en `index.html`. El repositorio no define
un `package.json` ni requiere instalar dependencias con npm. La versión de la
herramienta que generó `targets/targets.mind` no está registrada en el proyecto.

## Estructura

```text
3dverificador/
├── index.html
├── README.md
├── css/
│   └── styles.css
├── js/
│   ├── config.js
│   └── app.js
├── data/
│   └── certificados.json
├── targets/
│   ├── README.md
│   └── targets.mind
├── assets/
│   ├── SAM_Instituto_Excelencia_AR.glb
│   └── sello.glb
├── cert3d.png
├── vdo.mp4
└── vercel.json
```

`cert3d.png` es la imagen de referencia del marcador. La escena carga el
marcador compilado (`targets/targets.mind`), no el PNG directamente.

## Requisitos

- Teléfono o dispositivo con cámara y un navegador compatible con WebGL.
- Permiso de cámara concedido al sitio.
- Servir la aplicación desde `localhost` durante el desarrollo o desde un sitio
  HTTPS publicado. Los navegadores normalmente bloquean la cámara en páginas
  HTTP que no sean locales.
- Conexión a Internet para descargar A-Frame y MindAR desde sus CDN.

## Manual de usuario

1. Abre la dirección HTTPS del sitio en el navegador del teléfono.
2. Acepta el permiso para usar la cámara.
3. Apunta la cámara al certificado correspondiente a `cert3d.png`. Mantén el
   documento bien iluminado, enfocado y dentro del encuadre.
4. Cuando MindAR reconozca el marcador, aparecerán la ficha del certificado,
   los modelos 3D y el video.
5. Si apartas la cámara o el marcador deja de verse, la ficha se oculta y el
   video se pausa. Vuelve a apuntar al certificado para reanudar la experiencia.

## Ejecutar localmente

No abras `index.html` directamente como archivo: la cámara y la carga de los
recursos requieren servir la carpeta por HTTP local. En PowerShell:

```powershell
cd C:\ruta\a\3dverificador
py -m http.server 8000
```

Luego abre `http://localhost:8000` en el navegador y concede el permiso de
cámara. Para detener el servidor, vuelve a la terminal y presiona `Ctrl+C`.

## Actualizar los datos

Edita `data/certificados.json`. Cada clave corresponde al índice de un marcador
MindAR. La clave `"0"` es el certificado que reconoce actualmente la aplicación:

```json
{
  "documentos": {
    "0": {
      "codigo": "CODIGO-DEL-CERTIFICADO",
      "titulo": "Nombre del certificado",
      "institucion": "Institución emisora",
      "horas": "120 horas",
      "estado": "VERIFICADO",
      "temario": "Descripción o contenido"
    }
  }
}
```

La configuración actual (`js/config.js`) busca un marcador. Aunque el JSON
pueda contener otras claves, estas no se mostrarán hasta añadir sus marcadores
correspondientes y ajustar la configuración.

## Cambiar recursos AR

- **Video:** reemplaza `vdo.mp4` en la carpeta principal. Se espera un video MP4
  reproducible por el navegador. El plano llena el marcador y recorta el centro
  del video 16:9 para adaptarlo al certificado sin deformarlo. La posición y el
  recorte se configuran en `index.html`.
- **Modelos:** reemplaza o ajusta los archivos `.glb` en `assets/`. Sus rutas,
  posiciones, escalas y rotaciones están definidas en `index.html`.
- **Marcador:** si cambia la imagen del certificado, vuelve a generar
  `targets/targets.mind` con el marcador correspondiente. Actualiza el índice
  usado en `index.html`, `js/config.js` y `data/certificados.json`. Consulta
  también `targets/README.md`.

## Publicación

El proyecto está preparado como sitio estático y contiene `vercel.json` para
configurar URLs limpias en Vercel. Publica la carpeta raíz del repositorio y
asegúrate de incluir `targets/targets.mind`, `data/certificados.json`, los
modelos y `vdo.mp4`. Usa HTTPS en producción para que el navegador permita
acceder a la cámara.

## Solución de problemas

- **No aparece la cámara:** revisa el permiso del navegador y utiliza
  `localhost` o HTTPS.
- **No reconoce el certificado:** confirma que estás usando el documento
  correspondiente a `cert3d.png`, que `targets/targets.mind` está publicado y
  que hay buena iluminación y poco reflejo.
- **No aparece la información:** valida el JSON y que el certificado esté bajo
  la clave `"0"` con el formato mostrado arriba.
- **No se reproduce el video:** confirma que `vdo.mp4` esté en la carpeta
  principal y que el navegador pueda reproducirlo.
- **No cargan los modelos:** revisa que los dos archivos `.glb` estén en
  `assets/` con los nombres y mayúsculas exactos indicados en `index.html`.
