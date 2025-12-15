// Year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// ---- GALLERY: filters ----
const chips = Array.from(document.querySelectorAll(".chip"));
const thumbs = Array.from(document.querySelectorAll(".thumb"));

function setActiveChip(btn) {
  chips.forEach(c => c.classList.remove("is-active"));
  btn.classList.add("is-active");
}

function filterGallery(tag) {
  thumbs.forEach(t => {
    const tags = (t.dataset.tags || "").split(/\s+/).filter(Boolean);
    const show = tag === "all" ? true : tags.includes(tag);
    t.classList.toggle("is-hidden", !show);
  });
}

chips.forEach(btn => {
  btn.addEventListener("click", () => {
    setActiveChip(btn);
    filterGallery(btn.dataset.filter);
  });
});

// ---- MODAL / Lightbox + Navigation + Zoom/Pan ----
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");
const modalViewer = document.getElementById("modalViewer");

const btnPrev = document.querySelector(".modal__prev");
const btnNext = document.querySelector(".modal__next");

// Transform state (zoom/pan)
let scale = 1;
let translateX = 0;
let translateY = 0;

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Gallery navigation state
let galleryItems = []; // [{ src, alt }]
let currentIndex = 0;

function applyTransform() {
  modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

function setZoomedUI(isZoomed) {
  if (isZoomed) {
    modalImg.classList.add("is-zoomed");
    modalImg.style.cursor = "grab";
  } else {
    modalImg.classList.remove("is-zoomed");
    modalImg.style.cursor = "zoom-in";
  }
}

function resetZoom() {
  scale = 1;
  translateX = 0;
  translateY = 0;
  modalImg.style.transform = "";
  setZoomedUI(false);
}

function getVisibleThumbs() {
  return thumbs.filter(t => !t.classList.contains("is-hidden"));
}

function buildGalleryItemsFromVisibleThumbs() {
  const visibleThumbs = getVisibleThumbs();
  galleryItems = visibleThumbs.map(t => {
    const img = t.querySelector("img");
    return {
      src: t.dataset.full || img.src,
      alt: img.alt || "Full-size preview"
    };
  });
  return visibleThumbs;
}

function setModalImageByIndex(idx) {
  if (!galleryItems.length) return;

  // wrap-around
  currentIndex = (idx + galleryItems.length) % galleryItems.length;

  const item = galleryItems[currentIndex];
  modalImg.src = item.src;
  modalImg.alt = item.alt;

  resetZoom();
}

function openModalFromThumb(clickedThumb) {
  const visibleThumbs = buildGalleryItemsFromVisibleThumbs();
  const idx = visibleThumbs.indexOf(clickedThumb);
  currentIndex = Math.max(0, idx);

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  setModalImageByIndex(currentIndex);
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  modalImg.src = "";
  modalImg.alt = "";
  document.body.style.overflow = "";
  resetZoom();
}

// Open modal from thumbnails
thumbs.forEach(t => {
  t.addEventListener("click", () => openModalFromThumb(t));
});

// Close by clicking backdrop / close button
modal.addEventListener("click", (e) => {
  if (e.target?.dataset?.close === "true") closeModal();
});

// Buttons navigation
btnNext?.addEventListener("click", (e) => {
  e.stopPropagation();
  setModalImageByIndex(currentIndex + 1);
});

btnPrev?.addEventListener("click", (e) => {
  e.stopPropagation();
  setModalImageByIndex(currentIndex - 1);
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (!modal.classList.contains("is-open")) return;

  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowRight") setModalImageByIndex(currentIndex + 1);
  if (e.key === "ArrowLeft") setModalImageByIndex(currentIndex - 1);
});

// Click image: toggle zoom (1x <-> 2x)
modalImg.addEventListener("click", (e) => {
  e.stopPropagation();

  if (scale === 1) {
    scale = 2;
    setZoomedUI(true);
    applyTransform();
  } else {
    resetZoom();
  }
});

// Mouse wheel: smooth zoom (1x to 5x)
modalViewer.addEventListener("wheel", (e) => {
  if (!modal.classList.contains("is-open")) return;
  e.preventDefault();

  const zoomIntensity = 0.12;
  const direction = e.deltaY > 0 ? -1 : 1;
  const nextScale = Math.min(5, Math.max(1, scale + direction * zoomIntensity));

  scale = nextScale;

  if (scale === 1) {
    resetZoom();
    return;
  }

  setZoomedUI(true);
  applyTransform();
}, { passive: false });

// Drag to pan (only when zoomed)
modalImg.addEventListener("pointerdown", (e) => {
  if (scale <= 1) return;

  isDragging = true;
  dragStartX = e.clientX - translateX;
  dragStartY = e.clientY - translateY;

  modalImg.setPointerCapture(e.pointerId);
  modalImg.style.cursor = "grabbing";
});

modalImg.addEventListener("pointermove", (e) => {
  if (!isDragging) return;

  translateX = e.clientX - dragStartX;
  translateY = e.clientY - dragStartY;
  applyTransform();
});

function stopDragging() {
  isDragging = false;
  if (scale > 1) modalImg.style.cursor = "grab";
}

modalImg.addEventListener("pointerup", stopDragging);
modalImg.addEventListener("pointercancel", stopDragging);
modalImg.addEventListener("pointerleave", stopDragging);

// Double click: reset zoom
modalImg.addEventListener("dblclick", (e) => {
  e.preventDefault();
  resetZoom();
});

// Swipe navigation (horizontal) when NOT zoomed
let swipeStartX = 0;
let swipeStartY = 0;

modalViewer.addEventListener("pointerdown", (e) => {
  swipeStartX = e.clientX;
  swipeStartY = e.clientY;
});

modalViewer.addEventListener("pointerup", (e) => {
  if (!modal.classList.contains("is-open")) return;
  if (scale > 1) return; // don't swipe when zoomed

  const dx = e.clientX - swipeStartX;
  const dy = e.clientY - swipeStartY;

  if (Math.abs(dx) > 60 && Math.abs(dy) < 50) {
    if (dx < 0) setModalImageByIndex(currentIndex + 1); // swipe left -> next
    else setModalImageByIndex(currentIndex - 1);        // swipe right -> prev
  }
});

// ---- CONTACT FORM: mailto (static for GitHub Pages) ----
const YOUR_EMAIL = "luisrodolfoarias@outlook.es";
const form = document.getElementById("contactForm");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const name = (data.get("name") || "").toString().trim();
  const email = (data.get("email") || "").toString().trim();
  const message = (data.get("message") || "").toString().trim();

  if (!name || !email || !message) {
    alert("Please fill out all fields before sending.");
    return;
  }

  const subject = encodeURIComponent(`Website contact — ${name}`);
  const body = encodeURIComponent(
`Name: ${name}
Email: ${email}

Message:
${message}
`
  );

  window.location.href = `mailto:${YOUR_EMAIL}?subject=${subject}&body=${body}`;
});
