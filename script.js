// Year in footer
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ================= GALLERY FILTERS ================= */
const chips = Array.from(document.querySelectorAll(".chip"));
const thumbs = Array.from(document.querySelectorAll(".thumb"));

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

/* ================= MODAL / LIGHTBOX ================= */
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

function applyTransform() {
  if (!modalImg) return;
  modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

function resetZoom() {
  scale = 1;
  translateX = 0;
  translateY = 0;
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
  galleryItems = visibleThumbs.map(t => {
    const img = t.querySelector("img");
    return {
      src: t.dataset.full || img.src,
      alt: img.alt || "Image preview"
    };
  });
  return visibleThumbs;
}

function setModalImageByIndex(idx) {
  if (!galleryItems.length || !modalImg) return;

  currentIndex = (idx + galleryItems.length) % galleryItems.length;
  const item = galleryItems[currentIndex];

  modalImg.src = item.src;
  modalImg.alt = item.alt;
  resetZoom();
}

function openModalFromThumb(thumb) {
  const visibleThumbs = buildGalleryItems();
  currentIndex = Math.max(0, visibleThumbs.indexOf(thumb));

  modal?.classList.add("is-open");
  modal?.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  setModalImageByIndex(currentIndex);
}

function closeModal() {
  modal?.classList.remove("is-open");
  modal?.setAttribute("aria-hidden", "true");
  if (modalImg) {
    modalImg.src = "";
    modalImg.alt = "";
  }
  document.body.style.overflow = "";
  resetZoom();
}

/* Open modal */
thumbs.forEach(t => t.addEventListener("click", () => openModalFromThumb(t)));

/* Close modal */
modal?.addEventListener("click", e => {
  if (e.target?.dataset?.close === "true") closeModal();
});

/* Navigation buttons */
btnNext?.addEventListener("click", e => {
  e.stopPropagation();
  setModalImageByIndex(currentIndex + 1);
});
btnPrev?.addEventListener("click", e => {
  e.stopPropagation();
  setModalImageByIndex(currentIndex - 1);
});

/* Keyboard navigation */
document.addEventListener("keydown", e => {
  if (!modal?.classList.contains("is-open")) return;
  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowRight") setModalImageByIndex(currentIndex + 1);
  if (e.key === "ArrowLeft") setModalImageByIndex(currentIndex - 1);
});

/* ================= ZOOM & PAN ================= */
modalImg?.addEventListener("click", e => {
  e.stopPropagation();
  if (scale === 1) {
    scale = 2;
    modalImg.classList.add("is-zoomed");
    modalImg.style.cursor = "grab";
    applyTransform();
  } else {
    resetZoom();
  }
});

modalViewer?.addEventListener("wheel", e => {
  if (!modal?.classList.contains("is-open")) return;
  e.preventDefault();

  const delta = e.deltaY > 0 ? -0.15 : 0.15;
  scale = Math.min(5, Math.max(1, scale + delta));

  if (scale === 1) {
    resetZoom();
  } else {
    modalImg?.classList.add("is-zoomed");
    if (modalImg) modalImg.style.cursor = "grab";
    applyTransform();
  }
}, { passive: false });

modalImg?.addEventListener("pointerdown", e => {
  if (scale <= 1) return;
  isDragging = true;
  dragStartX = e.clientX - translateX;
  dragStartY = e.clientY - translateY;
  modalImg.setPointerCapture(e.pointerId);
  modalImg.style.cursor = "grabbing";
});

modalImg?.addEventListener("pointermove", e => {
  if (!isDragging) return;
  translateX = e.clientX - dragStartX;
  translateY = e.clientY - dragStartY;
  applyTransform();
});

["pointerup","pointerleave","pointercancel"].forEach(evt => {
  modalImg?.addEventListener(evt, () => {
    isDragging = false;
    if (scale > 1 && modalImg) modalImg.style.cursor = "grab";
  });
});

/* Swipe navigation (only when not zoomed) */
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
    dx < 0 ? setModalImageByIndex(currentIndex + 1)
           : setModalImageByIndex(currentIndex - 1);
  }
});

/* ================= CONTACT FORM ================= */
const form = document.getElementById("contactForm");
const YOUR_EMAIL = "luisrodolfoarias@outlook.es";

form?.addEventListener("submit", e => {
  e.preventDefault();

  const data = new FormData(form);
  const name = (data.get("name") || "").toString().trim();
  const email = (data.get("email") || "").toString().trim();
  const message = (data.get("message") || "").toString().trim();

  if (!name || !email || !message) {
    alert("Please fill out all fields.");
    return;
  }

  const subject = encodeURIComponent(`Website contact — ${name}`);
  const body = encodeURIComponent(
`Name: ${name}
Email: ${email}

Message:
${message}`
  );

  window.location.href = `mailto:${YOUR_EMAIL}?subject=${subject}&body=${body}`;
});

/* ================= CHARTS ================= */
function radarOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: { stepSize: 2, backdropColor: "transparent" },
        grid: { color: "#e8e8e8" },
        angleLines: { color: "#e8e8e8" },
        pointLabels: { color: "#111", font: { size: 12, weight: "600" } }
      }
    },
    plugins: { legend: { display: false } }
  };
}

if (window.Chart) {
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

  // Bar chart: keep compact (key fix)


  new Chart(document.getElementById("toolsTimelineChart"), {
    type: "bar",
    data: {
      labels: ["2017","2018","2019","2020","2021","2022","2023","2024"],
      datasets: [
        { label: "Excel", data: [7,8,8,7,6,6,5,5] },
        { label: "CRM", data: [6,7,7,7,6,6,5,5] },
        { label: "SQL", data: [2,3,4,5,6,7,8,8] },
        { label: "Python", data: [0,1,2,3,6,7,8,9] },
        { label: "Power Automate", data: [0,0,1,2,4,6,7,8] },
        { label: "Power BI", data: [0,0,1,2,4,6,7,8] }
      ]
    },

    options: {
        responsive: true,
        maintainAspectRatio: false,

        // <-- esto evita recortes de labels/ticks/legend
        layout: {
            padding: { top: 18, right: 12, bottom: 8, left: 16 }
        },

        plugins: {
            legend: {
            position: "top"
            },
            tooltip: { mode: "index", intersect: false }
        },

        scales: {
            x: { stacked: true },
            y: {
            stacked: true,
            min: 0,
            max: 10,

            // <-- esto evita que el "10" de arriba se corte
            grace: "5%",
            ticks: { padding: 6 }
            }
        }
    }
  });
}
