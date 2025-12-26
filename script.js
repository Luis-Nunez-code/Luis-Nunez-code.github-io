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
const chips = Array.from(document.querySelectorAll("#gallery .chip"));
const thumbs = Array.from(document.querySelectorAll("#gallery .thumb"));

function setActiveChip(btn) {
  chips.forEach(c => c.classList.remove("is-active"));
  btn.classList.add("is-active");
}

function filterGallery(tag) {
  thumbs.forEach(t => {
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
  return thumbs.filter(t => !t.classList.contains("is-hidden"));
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

function openModalFromThumb(thumbEl) {
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

// Open modal
thumbs.forEach(t => t.addEventListener("click", () => openModalFromThumb(t)));

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
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop || 0;

    // Progreso por píxeles (no depende del final de la página)
    const startOffsetPx = 0;    // ignora los primeros px si quieres (ej: 200)
    const fillEveryPx   = 2600; // px necesarios para "llenar" la mini gráfica

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
  window.addEventListener("resize", () => {
    update(getScrollProgress());
  });
})();
