let documentosCache = {};
let datosDisponibles = false;

function normalizarEstado(estado) {
  return String(estado || "").trim().toUpperCase();
}

async function cargarDocumentos() {
  const respuesta = await fetch(CONFIG.LOCAL_DATA_PATH, { cache: "no-store" });
  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar ${CONFIG.LOCAL_DATA_PATH}`);
  }

  const datos = await respuesta.json();
  const documentos = datos?.documentos ?? datos;

  if (!documentos || typeof documentos !== "object" || Array.isArray(documentos)) {
    throw new Error("El JSON local no tiene un formato válido");
  }

  documentosCache = documentos;
  datosDisponibles = true;
}

function mostrarDocumento(documento) {
  const esValido = normalizarEstado(documento.estado) === "VERIFICADO";
  document.getElementById("ar-estado").setAttribute(
    "text",
    "value",
    esValido ? "VERIFICADO" : "NO VERIFICADO"
  );
  document.getElementById("ar-estado").setAttribute(
    "text",
    "color",
    esValido ? "#4ade80" : "#f87171"
  );
  document.getElementById("ar-titulo").setAttribute(
    "text",
    "value",
    documento.titulo || "Documento"
  );
  document.getElementById("ar-institucion").setAttribute(
    "text",
    "value",
    [documento.institucion, documento.horas].filter(Boolean).join(" · ")
  );
  document.getElementById("ar-codigo").setAttribute(
    "text",
    "value",
    documento.codigo ? `Código: ${documento.codigo}` : ""
  );
  document.getElementById("ar-detalle").setAttribute(
    "text",
    "value",
    documento.temario ? `Detalle: ${documento.temario}` : ""
  );
  document.getElementById("ar-panel").setAttribute("visible", true);
}

function mostrarDocumentoNoEncontrado(identificador) {
  document.getElementById("ar-estado").setAttribute("text", "value", "NO REGISTRADO");
  document.getElementById("ar-estado").setAttribute("text", "color", "#f87171");
  document.getElementById("ar-titulo").setAttribute("text", "value", "Documento no registrado");
  document.getElementById("ar-institucion").setAttribute("text", "value", identificador);
  document.getElementById("ar-codigo").setAttribute("text", "value", "");
  document.getElementById("ar-detalle").setAttribute(
    "text",
    "value",
    "No hay datos asociados a este marcador."
  );
  document.getElementById("ar-panel").setAttribute("visible", true);
}

function ocultarPanelDocumento() {
  document.getElementById("ar-panel").setAttribute("visible", false);
}

document.addEventListener("DOMContentLoaded", async () => {
  const aviso = document.getElementById("estado-camara");

  try {
    await cargarDocumentos();
  } catch (error) {
    console.error(error);
    aviso.innerHTML =
      "<strong>No se pudo cargar el validador</strong><span>Revisa data/certificados.json.</span>";
  }

  for (let index = 0; index < CONFIG.TARGET_COUNT; index += 1) {
    const target = document.querySelector(`#target-${index}`);
    if (!target) continue;

    target.addEventListener("targetFound", () => {
      if (!datosDisponibles) {
        mostrarDocumentoNoEncontrado("No se pudieron cargar los datos del certificado.");
        return;
      }
      aviso.classList.add("oculto");
      const documento = documentosCache[String(index)];
      if (documento) {
        mostrarDocumento(documento);
      } else {
        mostrarDocumentoNoEncontrado(`Marcador ${index}`);
      }
    });

    target.addEventListener("targetLost", () => {
      ocultarPanelDocumento();
      aviso.classList.remove("oculto");
      aviso.innerHTML =
        "<strong>Cámara lista</strong><span>Apunta la cámara hacia el documento.</span>";
    });
  }

  const scene = document.querySelector("a-scene");
  let arInicializado = false;
  const timeoutInicioAr = window.setTimeout(() => {
    if (arInicializado) return;
    aviso.innerHTML =
      "<strong>La cámara no respondió</strong><span>Permite el acceso a la cámara y usa HTTPS para escanear.</span>";
  }, 15000);

  scene.addEventListener("arReady", () => {
    arInicializado = true;
    window.clearTimeout(timeoutInicioAr);
    aviso.innerHTML =
      "<strong>Cámara lista</strong><span>Apunta la cámara hacia el documento.</span>";
  });
  scene.addEventListener("arError", (event) => {
    arInicializado = true;
    window.clearTimeout(timeoutInicioAr);
    console.error("Error de MindAR", event);
    aviso.innerHTML =
      "<strong>Escaneo AR no disponible</strong><span>Permite el acceso a la cámara, usa HTTPS y confirma targets/targets.mind.</span>";
  });
});
