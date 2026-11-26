let documentosCache = {};
let documentoActivo = null;

function normalizarEstado(estado) {
  return String(estado || "").trim().toUpperCase();
}

async function cargarDocumentos() {
  const respuesta = await fetch(CONFIG.LOCAL_DATA_PATH, { cache: "no-store" });
  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar ${CONFIG.LOCAL_DATA_PATH}`);
  }

  const datos = await respuesta.json();
  documentosCache = datos.documentos || datos;

  if (!documentosCache || typeof documentosCache !== "object") {
    throw new Error("El JSON local no tiene un formato válido");
  }
}

function mostrarPanelDocumento(index) {
  const documento = documentosCache[String(index)];
  if (!documento) {
    mostrarDocumentoNoEncontrado(index);
    return;
  }

  documentoActivo = documento;
  const esValido = normalizarEstado(documento.estado) === "VERIFICADO";
  const badge = document.getElementById("doc-estado");
  const titulo = document.getElementById("doc-titulo");
  const meta = document.getElementById("doc-meta");
  const temario = document.getElementById("doc-temario");
  const enlace = document.getElementById("doc-link");

  badge.textContent = esValido ? "VERIFICADO" : "NO VERIFICADO";
  badge.className = esValido ? "estado-badge" : "estado-badge invalido";
  titulo.textContent = documento.titulo || "Documento";
  meta.textContent = [
    documento.institucion,
    documento.horas,
    documento.codigo ? `Cód. ${documento.codigo}` : ""
  ].filter(Boolean).join(" · ");

  temario.textContent = documento.temario
    ? `Detalle: ${documento.temario}`
    : "Detalle no disponible";
  temario.dataset.full = temario.textContent;
  temario.dataset.short = documento.codigo
    ? `Código: ${documento.codigo} · Estado: ${documento.estado}`
    : `Estado: ${documento.estado || "DESCONOCIDO"}`;

  const alternar = document.getElementById("btn-alternar");
  alternar.textContent = "Ver código";

  if (documento.url) {
    enlace.href = documento.url;
    enlace.style.display = "inline-flex";
  } else {
    enlace.removeAttribute("href");
    enlace.style.display = "none";
  }

  document.getElementById("hud").classList.add("visible");
}

function mostrarDocumentoNoEncontrado(index) {
  const badge = document.getElementById("doc-estado");
  badge.textContent = "NO REGISTRADO";
  badge.className = "estado-badge invalido";
  document.getElementById("doc-titulo").textContent = "Documento no encontrado";
  document.getElementById("doc-meta").textContent = `Marcador ${index}`;
  document.getElementById("doc-temario").textContent =
    "No existe información asociada a este marcador.";
  document.getElementById("doc-link").style.display = "none";
  document.getElementById("hud").classList.add("visible");
}

function ocultarPanelDocumento() {
  document.getElementById("hud").classList.remove("visible");
  documentoActivo = null;
}

document.addEventListener("DOMContentLoaded", async () => {
  const aviso = document.getElementById("estado-camara");

  try {
    await cargarDocumentos();
  } catch (error) {
    console.error(error);
    aviso.innerHTML =
      "<strong>No se pudo cargar el validador</strong><span>Revisa validador/data/documentos.json.</span>";
  }

  const alternar = document.getElementById("btn-alternar");
  alternar.addEventListener("click", () => {
    const temario = document.getElementById("doc-temario");
    if (temario.textContent === temario.dataset.full) {
      temario.textContent = temario.dataset.short;
      alternar.textContent = "Ver detalle";
    } else {
      temario.textContent = temario.dataset.full;
      alternar.textContent = "Ver código";
    }
  });

  document.getElementById("btn-cerrar").addEventListener("click", ocultarPanelDocumento);

  for (let index = 0; index < CONFIG.TARGET_COUNT; index += 1) {
    const target = document.querySelector(`#target-${index}`);
    if (!target) continue;

    target.addEventListener("targetFound", () => {
      aviso.classList.add("oculto");
      mostrarPanelDocumento(index);
    });

    target.addEventListener("targetLost", () => {
      ocultarPanelDocumento();
    });
  }

  const scene = document.querySelector("a-scene");
  scene.addEventListener("arReady", () => {
    aviso.innerHTML =
      "<strong>Cámara lista</strong><span>Apunta la cámara hacia el documento.</span>";
  });
  scene.addEventListener("arError", (event) => {
    console.error("Error de MindAR", event);
    aviso.innerHTML =
      "<strong>No se pudo iniciar MindAR</strong><span>Revisa permisos y el archivo targets.mind.</span>";
  });
});
