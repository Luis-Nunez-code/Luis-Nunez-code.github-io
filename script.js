// ================= YEAR IN FOOTER =================
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ================= CHART.JS (RESTORE YOUR GRAPHS) =================

function radarOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: { stepSize: 2, backdropColor: "transparent" },
        grid: { color: "#00000025" },
        angleLines: { color: "#00000025" },
        pointLabels: { color: "#111111ef", font: { size: 12, weight: "600" } }
      }
    },
    plugins: { legend: { display: false } }
  };
}

if (window.Chart) {
  // Hard skills radar
  new Chart(document.getElementById("hardSkillsChart"), {
    type: "radar",
    data: {
      labels: ["Data Analysis","Python","SQL","Power BI","Automation"],
      datasets: [{
        data: [9,8,8,8,9],
        fill: true,
        backgroundColor: "rgba(17,17,17,.15)",
        borderColor: "#111",
        borderWidth: 2
      }]
    },
    options: radarOptions()
  });

  // Soft skills radar
  new Chart(document.getElementById("softSkillsChart"), {
    type: "radar",
    data: {
      labels: ["Communication","Problem Solving","Attention to Detail","Process Thinking","Autonomy"],
      datasets: [{
        data: [8,9,9,8,9],
        fill: true,
        backgroundColor: "rgba(17,17,17,.15)",
        borderColor: "#111",
        borderWidth: 2
      }]
    },
    options: radarOptions()
  });

  // Your palette (Inferno-ish)
  const toolColors = [
    "#003f5c",
    "#444e86",
    "#955196",
    "#dd5182",
    "#ff6e54",
    "#ffa600"
  ];

  // Stacked bars: DO NOT cap at 10
  new Chart(document.getElementById("toolsTimelineChart"), {
    type: "bar",
    data: {
      labels: ["2017","2018","2019","2020","2021","2022","2023","2024"],
      datasets: [
        { label: "Excel",          data: [7,8,8,7,6,6,5,5], backgroundColor: toolColors[0] },
        { label: "CRM",            data: [6,7,7,7,6,6,5,5], backgroundColor: toolColors[1] },
        { label: "SQL",            data: [2,3,4,5,6,7,8,8], backgroundColor: toolColors[2] },
        { label: "Python",         data: [0,1,2,3,6,7,8,12], backgroundColor: toolColors[3] },
        { label: "Power Automate", data: [0,0,1,2,4,6,7,10], backgroundColor: toolColors[4] },
        { label: "Power BI",       data: [0,0,1,2,4,6,7,10], backgroundColor: toolColors[5] }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      // Prevent clipping of ticks/labels/legend
      layout: {
        padding: { top: 18, right: 12, bottom: 8, left: 26 }
      },

      plugins: {
        legend: { position: "top" },
        tooltip: { mode: "index", intersect: false }
      },

      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,

          // Let Chart.js choose, but hint an upper range
          suggestedMax: 60,

          grace: "6%",
          ticks: { padding: 8, stepSize: 10 }
        }
      }
    }
  });
}

// ================= GALLERY FILTERS =================
const chips = Array.from(document.querySelectorAll("#gallery .chip, .gallery-controls .chip"));
const thumbsPortfolio = Array.from(document.querySelectorAll("#gallery .thumb, #galleryGrid .thumb, .gallery .thumb"));
const thumbsBeyond    = Array.from(document.querySelectorAll("#beyondCarousel .bw-item"));

// Active list for the modal (so navigation stays inside the group you opened)
let activeThumbs = thumbsPortfolio;

function setActiveChip(btn) {
  chips.forEach(c => c.classList.remove("is-active"));
  btn.classList.add("is-active");
}

function filterGallery(tag) {
  thumbsPortfolio.forEach(t => {
    const tags = (t.dataset.tags || "").split(/\s+/).filter(Boolean);
    const show = tag === "all" || tags.includes(tag);
    t.classList.toggle("is-hidden", !show);
  });
}

chips.forEach(btn => {
  btn.addEventListener("click", () => {
    setActiveChip(btn);
    filterGallery(btn.dataset.filter);
  });
});

// ================= MODAL / LIGHTBOX =================
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");
const modalViewer = document.getElementById("modalViewer");
const btnPrev = document.querySelector(".modal__prev");
const btnNext = document.querySelector(".modal__next");

let galleryItems = [];
let currentIndex = 0;

// Zoom / pan state
let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// ✅ evita que el click “fantasma” al soltar un drag haga reset
let didDrag = false;
let downX = 0;
let downY = 0;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function applyTransform() {
  if (!modalImg) return;
  modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

function resetZoom() {
  scale = 1;
  translateX = 0;
  translateY = 0;
  didDrag = false;

  if (!modalImg) return;
  modalImg.style.transform = "";
  modalImg.classList.remove("is-zoomed");
  modalImg.style.cursor = "zoom-in";
}

function getVisibleThumbs() {
  return (activeThumbs || []).filter(t => !t.classList.contains("is-hidden"));
}

function buildGalleryItems() {
  const visibleThumbs = getVisibleThumbs();
  galleryItems = visibleThumbs
    .map(t => {
      const img = t.querySelector("img");
      if (!img) return null;
      return {
        thumbEl: t,
        src: t.dataset.full || img.dataset.full || img.src,
        alt: img.alt || ""
      };
    })
    .filter(Boolean);
}

function setModalImageByIndex(idx) {
  buildGalleryItems();
  if (!galleryItems.length || !modalImg) return;

  currentIndex = (idx + galleryItems.length) % galleryItems.length;
  const item = galleryItems[currentIndex];

  modalImg.src = item.src;
  modalImg.alt = item.alt;

  // Al cambiar de imagen, reset zoom/pan
  resetZoom();
}

function openModalFromThumb(thumbEl, list) {
  activeThumbs = list || thumbsPortfolio;
  buildGalleryItems();
  const idx = galleryItems.findIndex(it => it.thumbEl === thumbEl);
  currentIndex = idx >= 0 ? idx : 0;

  if (!modal) return;
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";

  setModalImageByIndex(currentIndex);
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
  resetZoom();
}

// Open modal (portfolio)
thumbsPortfolio.forEach(t => t.addEventListener("click", () => openModalFromThumb(t, thumbsPortfolio)));
// Open modal (beyond work)
thumbsBeyond.forEach(t => t.addEventListener("click", () => openModalFromThumb(t, thumbsBeyond)));
// Close modal only if data-close="true"
modal?.addEventListener("click", e => {
  const target = e.target;
  if (target?.dataset?.close === "true") closeModal();
});

// Navigation
btnNext?.addEventListener("click", e => {
  e.stopPropagation();
  setModalImageByIndex(currentIndex + 1);
});
btnPrev?.addEventListener("click", e => {
  e.stopPropagation();
  setModalImageByIndex(currentIndex - 1);
});

// Keyboard
document.addEventListener("keydown", e => {
  if (!modal?.classList.contains("is-open")) return;
  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowRight") setModalImageByIndex(currentIndex + 1);
  if (e.key === "ArrowLeft") setModalImageByIndex(currentIndex - 1);
});

// ================= ZOOM & PAN =================

// Prevent native drag
modalImg?.addEventListener("dragstart", e => e.preventDefault());

// Click toggle zoom (pero ignorar si hubo drag)
modalImg?.addEventListener("click", e => {
  e.stopPropagation();

  if (didDrag) {
    didDrag = false;
    return;
  }

  if (scale === 1) {
    scale = 2;
    modalImg.classList.add("is-zoomed");
    modalImg.style.cursor = "grab";
    applyTransform();
  } else {
    resetZoom();
  }
});

// Wheel zoom
modalViewer?.addEventListener(
  "wheel",
  e => {
    if (!modal?.classList.contains("is-open")) return;

    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = clamp(scale * factor, 1, 6);

    scale = newScale;

    if (scale === 1) {
      translateX = 0;
      translateY = 0;
      modalImg?.classList.remove("is-zoomed");
      if (modalImg) modalImg.style.cursor = "zoom-in";
    } else {
      modalImg?.classList.add("is-zoomed");
      if (modalImg) modalImg.style.cursor = isDragging ? "grabbing" : "grab";
    }

    applyTransform();
  },
  { passive: false }
);

// Pan only when zoomed
modalImg?.addEventListener("pointerdown", e => {
  if (scale <= 1) return;

  isDragging = true;
  didDrag = false;

  downX = e.clientX;
  downY = e.clientY;

  dragStartX = e.clientX - translateX;
  dragStartY = e.clientY - translateY;

  modalImg.setPointerCapture(e.pointerId);
  modalImg.style.cursor = "grabbing";

  e.preventDefault();
  e.stopPropagation();
});

modalImg?.addEventListener("pointermove", e => {
  if (!isDragging) return;

  const dx = e.clientX - downX;
  const dy = e.clientY - downY;

  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) didDrag = true;

  translateX = e.clientX - dragStartX;
  translateY = e.clientY - dragStartY;

  applyTransform();
});

["pointerup", "pointerleave", "pointercancel"].forEach(evt => {
  modalImg?.addEventListener(evt, () => {
    isDragging = false;
    if (scale > 1 && modalImg) modalImg.style.cursor = "grab";
  });
});

// ================= SWIPE (only when NOT zoomed) =================
let swipeStartX = 0;
let swipeStartY = 0;

modalViewer?.addEventListener("pointerdown", e => {
  swipeStartX = e.clientX;
  swipeStartY = e.clientY;
});

modalViewer?.addEventListener("pointerup", e => {
  if (!modal?.classList.contains("is-open") || scale > 1) return;

  const dx = e.clientX - swipeStartX;
  const dy = e.clientY - swipeStartY;

  if (Math.abs(dx) > 60 && Math.abs(dy) < 50) {
    dx < 0 ? setModalImageByIndex(currentIndex + 1) : setModalImageByIndex(currentIndex - 1);
  }
});
// ================= MINI SCROLL CHART (HEADER) =================
(function initMiniScrollChart(){
  const canvas = document.getElementById("scrollChart");
  if (!canvas || typeof Chart === "undefined") return;

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function getScrollProgress(){
    const scroller = document.scrollingElement || document.documentElement || document.body;
    const scrollTop = scroller.scrollTop || 0;

    // Progreso por píxeles (no depende del final de la página)
    const startOffsetPx = 0;    // ignora los primeros px si quieres (ej: 200)
    const fillEveryPx   = 9500; // px necesarios para "llenar" la mini gráfica

    const raw = (scrollTop - startOffsetPx) / Math.max(1, fillEveryPx);
    return clamp(raw, 0, 1);
  }

  // Dataset base (puedes cambiarlo por datos reales si quieres)
  const N = 60;
  const labels = Array.from({length: N}, (_, i) => i + 1);
  const lineAll = labels.map(i => Math.round(20 + 10*Math.sin(i/6) + i*0.35));
  const barsAll = labels.map(i => Math.max(0, Math.round(8 + 6*Math.cos(i/7))));

  const maxY = Math.max(...lineAll, ...barsAll) * 1.15;

  let rafId = null;
const scrollChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          type: "line",
          label: "Line",
          data: [],
          borderWidth: 2,
      borderColor: "#7c3aed",
          pointRadius: 0,
          tension: 0.35
        },
        {
          type: "bar",
          label: "Bars",
          data: [],
          borderWidth: 0,
      backgroundColor: "#f97316",
          barPercentage: 0.9,
          categoryPercentage: 1.0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false, beginAtZero: true, min: 0, max: maxY }
      }
    }
  });

  function update(p){
    const k = Math.max(1, Math.round(p * N));

    const line = Array(N).fill(null);
    const bars = Array(N).fill(null);

    for (let i = 0; i < k; i++){
      line[i] = lineAll[i];
      bars[i] = barsAll[i];
    }

    scrollChart.data.datasets[0].data = line;
    scrollChart.data.datasets[1].data = bars;
    scrollChart.update("none");
  }

  function apply(){
    rafId = null;
    const p = getScrollProgress();
    update(p);
  }

  function onScroll(){
    if (!rafId) rafId = requestAnimationFrame(apply);
  }

  // init
  update(getScrollProgress());

  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("scroll", onScroll, { passive: true, capture: true });
  document.body?.addEventListener?.("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    update(getScrollProgress());
  });
})();


// ================= BEYOND WORK CAROUSEL =================
(function initBeyondCarousel(){
  const root = document.getElementById("beyondCarousel");
  if (!root) return;

  const viewport = root.querySelector(".bw-viewport");
  const track = root.querySelector(".bw-track");
  const items = Array.from(root.querySelectorAll(".bw-item"));
  const prev = root.querySelector(".bw-prev");
  const next = root.querySelector(".bw-next");

  if (!viewport || !track || !items.length) return;

  let idx = 0;

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function update(){
    items.forEach((el, i) => el.classList.toggle("is-active", i === idx));

    // Center active card inside viewport
    const active = items[idx];
    const vpW = viewport.clientWidth;

    const maxScroll = Math.max(0, track.scrollWidth - vpW);
    const target = (active.offsetLeft + active.offsetWidth / 2) - (vpW / 2);
    const x = clamp(target, 0, maxScroll);

    track.style.transform = `translateX(${-x}px)`;
  }

  function go(delta){
    idx = (idx + delta + items.length) % items.length;
    update();
  }

  prev?.addEventListener("click", () => go(-1));
  next?.addEventListener("click", () => go(1));

  // Keyboard (when focused inside the carousel)
  root.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });

  // Click-to-center (only when the card is NOT active).
  // If the card is already active, we let the click continue so the lightbox can open.
  items.forEach((el, i) => {
    el.addEventListener("click", (e) => {
      if (i !== idx) {
        idx = i;
        update();

        // Prevent the lightbox from opening on the first click (center first).
        e.stopImmediatePropagation();
        e.preventDefault();
      }
      // else: allow bubble handler (openModalFromThumb) to run
    }, { capture: true });
  });

  window.addEventListener("resize", () => update(), { passive: true });

  // init
  update();
})();

// ================= GALAXY BACKGROUND (FROM OTHER PAGE) =================
(function(){
// ====== Lienzos ======
const backCanvas = document.getElementById('back');
const frontCanvas = document.getElementById('front');
const backCtx = backCanvas.getContext('2d', { alpha: true });
const frontCtx = frontCanvas.getContext('2d', { alpha: true });

// ====== Config ======
const cfg = {
  // menos puntos, pero más grande en pantalla
  count: 700,

  // esfera ocupa más espacio (relativo a la pantalla)
  baseRadiusFactor: 0.60,

  // perspectiva
  depth: 1150,

  // rotación lenta
  rotX: 0.38,
  rotSpeedY: 0.00075,
  rotSpeedX: 0.00035,

  // “separación” pausada (respiración)
  breathePeriod: 22000,
  breatheAmount: 0.26,
  driftAmount: 0.12,

  // color sutil
  baseHue: 225,
  hueRange: 20,
  hueShiftPeriod: 28000,

  // tamaño de puntos
  minSize: 0.8,
  maxSize: 2.8,

  // halo
  glow: 0.20,

  // estela (sube para más nítido, baja para más “trail”)
  bgFade: 0.10,

  // CORTE de profundidad:
  // 0..1 (más alto = menos partículas en el canvas frontal)
  split: 0.58
};

// ====== Resize ======
let dpr = 1;
function resize(){
  dpr = Math.min(2, window.devicePixelRatio || 1);

  for (const cv of [backCanvas, frontCanvas]){
    cv.width = Math.floor(innerWidth * dpr);
    cv.height = Math.floor(innerHeight * dpr);
    cv.style.width = innerWidth + "px";
    cv.style.height = innerHeight + "px";
  }
  backCtx.setTransform(dpr,0,0,dpr,0,0);
  frontCtx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize', resize);
resize();

// ====== Util ======
const clamp = (v,a,b)=>Math.max(a, Math.min(b,v));
const lerp  = (a,b,t)=>a+(b-a)*t;

// Fibonacci sphere (distribución uniforme)
function fibonacciSphere(n){
  const pts = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i=0;i<n;i++){
    const y = 1 - (i/(n-1))*2;
    const r = Math.sqrt(1 - y*y);
    const theta = phi * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    pts.push({ x, y, z });
  }
  return pts;
}

// Rotaciones
function rotateX(p, a){
  const s = Math.sin(a), c = Math.cos(a);
  return { x:p.x, y:p.y*c - p.z*s, z:p.y*s + p.z*c };
}
function rotateY(p, a){
  const s = Math.sin(a), c = Math.cos(a);
  return { x:p.x*c + p.z*s, y:p.y, z:-p.x*s + p.z*c };
}

// ====== Partículas ======
const base = fibonacciSphere(cfg.count);
const particles = base.map(p => ({
  base: p,
  phase: Math.random() * Math.PI * 2,
  driftPhase: Math.random() * Math.PI * 2,
  sizeSeed: Math.random(),
  hueOffset: (Math.random() - 0.5) * cfg.hueRange
}));

// ====== Animación ======
let t0 = performance.now();
let ax = cfg.rotX;
let ay = 0;

function drawParticle(ctx, p){
  const rad = p.size * 3.1;
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);

  g.addColorStop(0,    `hsla(${p.hue}, 85%, 88%, ${p.alpha})`);
  g.addColorStop(0.35, `hsla(${p.hue+8}, 85%, 70%, ${p.alpha * cfg.glow})`);
  g.addColorStop(1,    `hsla(${p.hue+12}, 90%, 55%, 0)`);

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
  ctx.fill();
}

function frame(now){
  const w = innerWidth, h = innerHeight;
  const cx = w * 0.5, cy = h * 0.52;

  // estela en ambos (así el “front” no deja sombras raras)
  backCtx.fillStyle = `rgba(0,0,0,${cfg.bgFade})`;
  backCtx.fillRect(0,0,w,h);

  frontCtx.clearRect(0,0,w,h);

  const t = now - t0;

  const baseRadius = Math.min(w, h) * cfg.baseRadiusFactor;

  const breathe = 0.5 - 0.5 * Math.cos((t / cfg.breathePeriod) * Math.PI * 2);
  const hueShift = 0.5 - 0.5 * Math.cos((t / cfg.hueShiftPeriod) * Math.PI * 2);

  ax += cfg.rotSpeedX;
  ay += cfg.rotSpeedY;

  const R = baseRadius * (1 + cfg.breatheAmount * (breathe - 0.5));

  const projected = [];
  for (const P of particles){
    const localDrift = 0.5 - 0.5 * Math.cos((t / cfg.breathePeriod) * Math.PI * 2 + P.driftPhase);
    const drift = 1 + cfg.driftAmount * (localDrift - 0.5);

    const v = {
      x: P.base.x * R * drift,
      y: P.base.y * R * drift,
      z: P.base.z * R * drift
    };

    let r = rotateX(v, ax);
    r = rotateY(r, ay);

    const z = r.z + cfg.depth;
    const s = cfg.depth / z;

    const x2 = cx + r.x * s;
    const y2 = cy + r.y * s;

    // Normalizamos profundidad para tamaño/alpha y para “split”
    const depthNorm = clamp((s - 0.70) / 0.75, 0, 1);

    const tw = 0.5 - 0.5 * Math.cos((t/2200) * Math.PI * 2 + P.phase);

    const baseSize = lerp(cfg.minSize, cfg.maxSize, P.sizeSeed);
    const size = baseSize * lerp(0.75, 2.05, depthNorm) * lerp(0.90, 1.16, tw);

    const alpha = lerp(0.05, 0.78, depthNorm) * lerp(0.80, 1.0, tw);

    const hue = cfg.baseHue + P.hueOffset + (hueShift - 0.5) * 10;

    projected.push({ x:x2, y:y2, z:r.z, depthNorm, size, alpha, hue });
  }

  // Orden general por z (lejos primero)
  projected.sort((a,b)=>a.z - b.z);

  // Dibujo en back o front según depthNorm
  for (const p of projected){
    const ctx = (p.depthNorm >= cfg.split) ? frontCtx : backCtx;
    drawParticle(ctx, p);
  }

  requestAnimationFrame(frame);
}

// primer frame limpio

backCtx.fillRect(0,0,innerWidth, innerHeight);
frontCtx.clearRect(0,0,innerWidth, innerHeight);

requestAnimationFrame(frame);
})();



// ================= EXPERIENCE REVEAL (INTERSECTION OBSERVER) =================
(function initExperienceReveal(){
  const items = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!items.length) return;

  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce){
    items.forEach(el => el.classList.add("is-in"));
    return;
  }

  // Stagger index for a nicer cascade
  items.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 90, 360)}ms`;
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -10% 0px" });

  items.forEach(el => io.observe(el));
})();
