let documentosCache = {};
let documentoActivo = null;
let origenActivo = null;
let datosDisponibles = false;

function normalizarEstado(estado) {
  return String(estado || "").trim().toUpperCase();
}

function normalizarCodigo(codigo) {
  return String(codigo || "").trim().replace(/\s+/g, "").toUpperCase();
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

function mostrarDocumento(documento, origen) {
  documentoActivo = documento;
  origenActivo = origen;
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
  alternar.disabled = false;
  alternar.textContent = "Ver código";

  if (esEnlaceWeb(documento.url)) {
    enlace.href = documento.url;
    enlace.style.display = "inline-flex";
  } else {
    enlace.removeAttribute("href");
    enlace.style.display = "none";
  }

  document.getElementById("hud").classList.add("visible");
}

function esEnlaceWeb(valor) {
  if (typeof valor !== "string") return false;

  try {
    const url = new URL(valor);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function mostrarDocumentoNoEncontrado(identificador, origen) {
  documentoActivo = null;
  origenActivo = origen;
  const badge = document.getElementById("doc-estado");
  badge.textContent = "NO REGISTRADO";
  badge.className = "estado-badge invalido";
  document.getElementById("doc-titulo").textContent = "Documento no encontrado";
  document.getElementById("doc-meta").textContent = identificador;
  document.getElementById("doc-temario").textContent =
    "No existe un registro con este código en el archivo local.";
  document.getElementById("doc-link").removeAttribute("href");
  document.getElementById("doc-link").style.display = "none";
  document.getElementById("btn-alternar").disabled = true;
  document.getElementById("hud").classList.add("visible");
}

function ocultarPanelDocumento() {
  document.getElementById("hud").classList.remove("visible");
  documentoActivo = null;
  origenActivo = null;
}

function buscarPorCodigo(codigo) {
  const buscado = normalizarCodigo(codigo);
  return Object.values(documentosCache).filter((documento) =>
    normalizarCodigo(documento?.codigo) === buscado
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  const aviso = document.getElementById("estado-camara");
  const formulario = document.getElementById("form-busqueda");
  const entradaCodigo = document.getElementById("input-codigo");

  try {
    await cargarDocumentos();
  } catch (error) {
    console.error(error);
    aviso.innerHTML =
      "<strong>No se pudo cargar el validador</strong><span>Revisa data/certificados.json.</span>";
  }

  formulario.addEventListener("submit", (event) => {
    event.preventDefault();
    const codigo = entradaCodigo.value.trim();

    if (!datosDisponibles) {
      aviso.innerHTML =
        "<strong>Datos no disponibles</strong><span>No se puede validar hasta cargar data/certificados.json.</span>";
      return;
    }

    if (!normalizarCodigo(codigo)) {
      entradaCodigo.focus();
      return;
    }

    const coincidencias = buscarPorCodigo(codigo);
    if (coincidencias.length === 1) {
      mostrarDocumento(coincidencias[0], { tipo: "manual" });
      return;
    }

    const motivo = coincidencias.length > 1
      ? "Hay más de un registro con este código. Corrige data/certificados.json."
      : "No existe en data/certificados.json.";
    mostrarDocumentoNoEncontrado(`Código: ${codigo}`, { tipo: "manual" });
    document.getElementById("doc-temario").textContent = motivo;
  });

  const alternar = document.getElementById("btn-alternar");
  alternar.addEventListener("click", () => {
    if (!documentoActivo) return;
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
      if (!datosDisponibles) return;
      aviso.classList.add("oculto");
      const documento = documentosCache[String(index)];
      if (documento) {
        mostrarDocumento(documento, { tipo: "ar", index });
      } else {
        mostrarDocumentoNoEncontrado(`Marcador ${index}`, { tipo: "ar", index });
      }
    });

    target.addEventListener("targetLost", () => {
      if (origenActivo?.tipo === "ar" && origenActivo.index === index) {
        ocultarPanelDocumento();
        aviso.classList.remove("oculto");
        aviso.innerHTML =
          "<strong>Cámara lista</strong><span>Apunta la cámara hacia el documento.</span>";
      }
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
