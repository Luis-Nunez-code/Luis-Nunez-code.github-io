// Año en footer
document.getElementById("year").textContent = new Date().getFullYear();

// ---- GALERÍA: filtros ----
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

// ---- MODAL / Lightbox ----
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");

function openModal(src, alt) {
  modalImg.src = src;
  modalImg.alt = alt || "Imagen ampliada";
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  modalImg.src = "";
  modalImg.alt = "";
  document.body.style.overflow = "";
}

thumbs.forEach(t => {
  t.addEventListener("click", () => {
    const img = t.querySelector("img");
    openModal(t.dataset.full || img.src, img.alt);
  });
});

modal.addEventListener("click", (e) => {
  if (e.target?.dataset?.close === "true") closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
});

// ---- FORMULARIO: mailto (estático para GitHub Pages) ----
// EDITAR: pon aquí tu correo real:
const YOUR_EMAIL = "luisrodolfoarias@outlook.es";

const form = document.getElementById("contactForm");
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const name = (data.get("name") || "").toString().trim();
  const email = (data.get("email") || "").toString().trim();
  const message = (data.get("message") || "").toString().trim();

  const subject = encodeURIComponent(`Contacto desde CV web — ${name}`);
  const body = encodeURIComponent(
`Nombre: ${name}
Email: ${email}

Mensaje:
${message}
`
  );

  // Abre el cliente de correo del visitante
  window.location.href = `mailto:${YOUR_EMAIL}?subject=${subject}&body=${body}`;

});
