/* ================================
   LA BAIE DU DRAGON — script.js
   ================================ */

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

document.addEventListener("DOMContentLoaded", function () {
  initNav();
  initBackToTop();
  initReveal();
  initYear();
  initPublicContent();
  initLoginForm();
  initDashboard();
});

/* ---------- Menu mobile ---------- */
function initNav() {
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");
  if (!navToggle || !siteNav) return;

  navToggle.addEventListener("click", function () {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".site-nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      siteNav.classList.remove("is-open");
      navToggle.classList.remove("is-open");
    });
  });
}

function initBackToTop() {
  const btn = document.querySelector(".back-to-top");
  if (!btn) return;
  window.addEventListener("scroll", throttle(function () {
    btn.classList.toggle("is-visible", window.scrollY > 500);
  }, 120));
  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || elements.length === 0) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
  elements.forEach((el) => observer.observe(el));
}

function initYear() {
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
}

function throttle(callback, delay) {
  let last = 0;
  return function () {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      callback.apply(this, arguments);
    }
  };
}

/* ---------- Contenu dynamique (pages publiques) ---------- */
function initPublicContent() {
  const hasAccueil = document.body.hasAttribute("data-page-accueil");
  const hasCarte = document.body.hasAttribute("data-page-carte");
  if (!hasAccueil && !hasCarte) return;

  fetchContent()
    .then(function (content) {
      if (!content) return;
      if (hasAccueil) renderAccueil(content);
      if (hasCarte) renderCarte(content);
    })
    .catch(function () {
      // En cas d'erreur réseau, le contenu par défaut déjà présent dans le HTML reste affiché.
    });
}

function fetchContent() {
  return fetch("./.netlify/functions/get-content", { cache: "no-store" }).then(function (res) {
    if (!res.ok) throw new Error("Erreur chargement contenu");
    return res.json();
  });
}

/* ---------- Détection média (image / vidéo / youtube-vimeo) ---------- */
function mediaKind(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("vimeo.com")) return "vimeo";
  if (/\.(mp4|webm|ogg)(\?.*)?$/.test(u)) return "video";
  return "image";
}

function youtubeEmbed(url) {
  let id = "";
  const short = url.match(/youtu\.be\/([\w-]+)/);
  const long = url.match(/[?&]v=([\w-]+)/);
  if (short) id = short[1];
  else if (long) id = long[1];
  return id ? "https://www.youtube.com/embed/" + id + "?autoplay=1&mute=1&loop=1&playlist=" + id + "&controls=0" : null;
}

function vimeoEmbed(url) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? "https://player.vimeo.com/video/" + match[1] + "?autoplay=1&muted=1&loop=1&background=1" : null;
}

function buildMediaNode(url) {
  const kind = mediaKind(url);
  if (kind === "video") {
    const v = document.createElement("video");
    v.src = url; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
    return v;
  }
  if (kind === "youtube") {
    const embed = youtubeEmbed(url);
    if (!embed) return null;
    const iframe = document.createElement("iframe");
    iframe.src = embed; iframe.allow = "autoplay; encrypted-media"; iframe.setAttribute("frameborder", "0");
    return iframe;
  }
  if (kind === "vimeo") {
    const embed = vimeoEmbed(url);
    if (!embed) return null;
    const iframe = document.createElement("iframe");
    iframe.src = embed; iframe.allow = "autoplay; fullscreen"; iframe.setAttribute("frameborder", "0");
    return iframe;
  }
  if (kind === "image") {
    const img = document.createElement("img");
    img.src = url; img.alt = "";
    return img;
  }
  return null;
}

/* ---------- Accueil ---------- */
function renderAccueil(c) {
  setText("[data-field='nom']", c.identite && c.identite.nom);
  setText("[data-field='tagline']", c.identite && c.identite.tagline);
  setText("[data-field='description']", c.identite && c.identite.description);
  setText("[data-field='telephone_affiche']", c.contact && c.contact.telephone_affiche);
  setAttrAll("[data-field='telephone_href']", "href", "tel:" + (c.contact && c.contact.telephone));
  setText("[data-field='adresse']", c.contact && (c.contact.adresse + ", " + c.contact.code_postal + " " + c.contact.ville));
  setAttrAll("[data-field='maps_href']", "href", c.contact && c.contact.google_maps_url);

  renderHoraires(c.horaires);

  // Média héro : la vidéo est prioritaire sur l'image si les deux sont renseignées.
  const heroWrap = document.querySelector("[data-field='hero_media']");
  if (heroWrap && c.media) {
    const url = c.media.hero_video || c.media.hero_image;
    if (url) {
      const node = buildMediaNode(url);
      if (node) {
        const placeholder = heroWrap.querySelector(".media-placeholder");
        if (placeholder) placeholder.remove();
        heroWrap.insertBefore(node, heroWrap.firstChild);
      }
    }
  }

  // Points forts
  const highlightsRoot = document.querySelector("[data-field='highlights']");
  if (highlightsRoot && Array.isArray(c.highlights)) {
    highlightsRoot.innerHTML = "";
    c.highlights.forEach(function (h) {
      const card = document.createElement("div");
      card.className = "product-card reveal is-visible";

      const media = document.createElement("div");
      media.className = "product-media";
      if (h.image) {
        const img = document.createElement("img");
        img.src = h.image; img.alt = h.titre || "";
        media.appendChild(img);
      } else {
        media.innerHTML = "<div class='media-placeholder'>Photo à ajouter</div>";
      }
      card.appendChild(media);

      const title = document.createElement("h3");
      title.className = "product-title";
      title.textContent = h.titre || "";
      card.appendChild(title);

      const text = document.createElement("p");
      text.textContent = h.texte || "";
      card.appendChild(text);

      highlightsRoot.appendChild(card);
    });
  }

  // Galerie
  const galleryRoot = document.querySelector("[data-field='galerie']");
  const gallerySection = document.querySelector("[data-field='galerie-section']");
  if (galleryRoot && c.media && Array.isArray(c.media.galerie) && c.media.galerie.length > 0) {
    galleryRoot.innerHTML = "";
    c.media.galerie.forEach(function (photo) {
      const item = document.createElement("div");
      item.className = "gallery-item reveal is-visible";
      const img = document.createElement("img");
      img.src = photo.url; img.alt = photo.alt || "";
      item.appendChild(img);
      galleryRoot.appendChild(item);
    });
    if (gallerySection) gallerySection.style.display = "";
  }
}

function renderHoraires(horaires) {
  const hoursBody = document.querySelector("[data-field='horaires']");
  if (!hoursBody || !horaires) return;
  hoursBody.innerHTML = "";
  DAYS.forEach(function (jour) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td>" + capitalize(jour) + "</td><td>" + escapeHtml(horaires[jour] || "") + "</td>";
    hoursBody.appendChild(tr);
  });
}

/* ---------- Carte ---------- */
function renderCarte(c) {
  setText("[data-field='menu_note']", c.carte && c.carte.note);

  const container = document.querySelector("[data-field='menu_categories']");
  if (!container || !c.carte || !Array.isArray(c.carte.categories)) return;

  container.innerHTML = "";
  c.carte.categories.forEach(function (cat) {
    const section = document.createElement("div");
    section.className = "menu-category reveal is-visible";

    const head = document.createElement("div");
    head.className = "menu-category-head";
    if (cat.image) {
      const imgWrap = document.createElement("div");
      imgWrap.className = "menu-category-image";
      imgWrap.innerHTML = "<img src=\"" + escapeAttr(cat.image) + "\" alt=\"\">";
      head.appendChild(imgWrap);
    }
    const h2 = document.createElement("h2");
    h2.textContent = cat.nom;
    head.appendChild(h2);
    section.appendChild(head);

    (cat.sous_categories || []).forEach(function (sub) {
      const subEl = document.createElement("div");
      subEl.className = "menu-subcategory";
      if (sub.nom) {
        const h3 = document.createElement("h3");
        h3.textContent = sub.nom;
        subEl.appendChild(h3);
      }

      const plats = sub.plats || [];
      const hasPhotos = plats.some((p) => !!p.image);

      if (hasPhotos) {
        const grid = document.createElement("div");
        grid.className = "menu-dish-grid";
        plats.forEach(function (plat) {
          grid.appendChild(buildDishCard(plat));
        });
        subEl.appendChild(grid);
      } else {
        const list = document.createElement("div");
        list.className = "menu-dish-list";
        plats.forEach(function (plat) {
          list.appendChild(buildDishRow(plat));
        });
        subEl.appendChild(list);
      }

      section.appendChild(subEl);
    });

    container.appendChild(section);
  });
}

function buildDishCard(plat) {
  const card = document.createElement("div");
  card.className = "menu-dish";
  card.innerHTML =
    "<div class='menu-dish-media'>" +
      (plat.image ? "<img src=\"" + escapeAttr(plat.image) + "\" alt=\"\">" : "") +
    "</div>" +
    "<div class='menu-dish-name'>" + escapeHtml(plat.nom) + "</div>" +
    "<div class='menu-dish-desc'>" + escapeHtml(plat.description || "") + "</div>" +
    "<div class='menu-dish-price'>" + escapeHtml(plat.prix || "") + "</div>";
  return card;
}

function buildDishRow(plat) {
  const row = document.createElement("div");
  row.className = "menu-dish-row";
  row.innerHTML =
    "<div><div class='menu-dish-name'>" + escapeHtml(plat.nom) + "</div>" +
    "<div class='menu-dish-desc'>" + escapeHtml(plat.description || "") + "</div></div>" +
    "<div class='menu-dish-price'>" + escapeHtml(plat.prix || "") + "</div>";
  return row;
}

/* ---------- Utilitaires ---------- */
function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el && value !== undefined && value !== null) el.textContent = value;
}
function setAttrAll(selector, attr, value) {
  if (!value) return;
  document.querySelectorAll(selector).forEach(function (el) {
    el.setAttribute(attr, value);
  });
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function escapeHtml(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, function (m) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
  });
}
function escapeAttr(v) { return String(v || "").replace(/"/g, "&quot;"); }

/* ---------- Connexion (admin.html) ---------- */
function initLoginForm() {
  const form = document.querySelector("#login-form");
  if (!form) return;
  const errorBox = document.querySelector("#login-error");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (errorBox) errorBox.textContent = "";
    const password = document.querySelector("#login-password").value;

    fetch("./.netlify/functions/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password })
    })
      .then(function (res) { return res.json().then((data) => ({ ok: res.ok, data })); })
      .then(function (result) {
        if (result.ok && result.data.ok) {
          window.location.href = "dashboard.html";
        } else if (errorBox) {
          errorBox.textContent = (result.data && result.data.error) || "Connexion impossible.";
        }
      })
      .catch(function () {
        if (errorBox) errorBox.textContent = "Erreur réseau, réessaie.";
      });
  });
}

/* ---------- Tableau de bord (dashboard.html) ---------- */
let dashboardContent = null;

function initDashboard() {
  const root = document.querySelector("#dashboard-root");
  if (!root) return;

  const logoutBtn = document.querySelector("#logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      fetch("./.netlify/functions/logout", { method: "POST" }).finally(function () {
        window.location.href = "admin.html";
      });
    });
  }

  fetchContent()
    .then(function (content) {
      dashboardContent = content;
      fillDashboardForm(content);
    })
    .catch(function () {
      showSaveMessage("Impossible de charger le contenu actuel.", true);
    });

  const form = document.querySelector("#dashboard-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      saveDashboard();
    });
  }

  const addHighlightBtn = document.querySelector("#add-highlight");
  if (addHighlightBtn) {
    addHighlightBtn.addEventListener("click", function () {
      document.querySelector("#highlights-editor").appendChild(buildHighlightRow({ titre: "", texte: "", image: "" }));
    });
  }

  const addPhotoBtn = document.querySelector("#add-photo");
  if (addPhotoBtn) {
    addPhotoBtn.addEventListener("click", function () {
      document.querySelector("#gallery-editor").appendChild(buildGalleryRow({ url: "", alt: "" }));
    });
  }

  const addCategoryBtn = document.querySelector("#add-category");
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", function () {
      document.querySelector("#menu-editor").appendChild(
        buildCategoryBlock({ nom: "", image: "", sous_categories: [{ nom: "", plats: [] }] })
      );
    });
  }
}

function fillDashboardForm(c) {
  setValue("#f-nom", c.identite && c.identite.nom);
  setValue("#f-tagline", c.identite && c.identite.tagline);
  setValue("#f-description", c.identite && c.identite.description);
  setValue("#f-hero-image", c.media && c.media.hero_image);
  setValue("#f-hero-video", c.media && c.media.hero_video);
  setValue("#f-telephone", c.contact && c.contact.telephone);
  setValue("#f-telephone-affiche", c.contact && c.contact.telephone_affiche);
  setValue("#f-adresse", c.contact && c.contact.adresse);
  setValue("#f-code-postal", c.contact && c.contact.code_postal);
  setValue("#f-ville", c.contact && c.contact.ville);
  setValue("#f-maps-url", c.contact && c.contact.google_maps_url);
  setValue("#f-instagram", c.reseaux && c.reseaux.instagram);
  setValue("#f-facebook", c.reseaux && c.reseaux.facebook);
  DAYS.forEach(function (jour) {
    setValue("#f-horaire-" + jour, c.horaires && c.horaires[jour]);
  });
  setValue("#f-menu-note", c.carte && c.carte.note);

  const highlightsRoot = document.querySelector("#highlights-editor");
  if (highlightsRoot) {
    highlightsRoot.innerHTML = "";
    (c.highlights || []).forEach(function (h) { highlightsRoot.appendChild(buildHighlightRow(h)); });
  }

  const galleryRoot = document.querySelector("#gallery-editor");
  if (galleryRoot) {
    galleryRoot.innerHTML = "";
    ((c.media && c.media.galerie) || []).forEach(function (p) { galleryRoot.appendChild(buildGalleryRow(p)); });
  }

  const menuRoot = document.querySelector("#menu-editor");
  if (menuRoot && c.carte && Array.isArray(c.carte.categories)) {
    menuRoot.innerHTML = "";
    c.carte.categories.forEach(function (cat) { menuRoot.appendChild(buildCategoryBlock(cat)); });
  }
}

function buildHighlightRow(h) {
  const row = document.createElement("div");
  row.className = "dish-row";
  row.style.gridTemplateColumns = "1.2fr 2fr 1.4fr auto";
  row.innerHTML =
    "<input type='text' class='h-titre' placeholder='Titre' value=\"" + escapeAttr(h.titre) + "\">" +
    "<input type='text' class='h-texte' placeholder='Texte' value=\"" + escapeAttr(h.texte) + "\">" +
    "<input type='text' class='h-image' placeholder='Lien photo (optionnel)' value=\"" + escapeAttr(h.image) + "\">";
  const removeBtn = document.createElement("button");
  removeBtn.type = "button"; removeBtn.className = "icon-btn danger small"; removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", function () { row.remove(); });
  row.appendChild(removeBtn);
  return row;
}

function buildGalleryRow(p) {
  const row = document.createElement("div");
  row.className = "dish-row";
  row.style.gridTemplateColumns = "2.5fr 2fr auto";
  row.innerHTML =
    "<input type='text' class='g-url' placeholder='Lien de la photo' value=\"" + escapeAttr(p.url) + "\">" +
    "<input type='text' class='g-alt' placeholder='Description (optionnel)' value=\"" + escapeAttr(p.alt) + "\">";
  const removeBtn = document.createElement("button");
  removeBtn.type = "button"; removeBtn.className = "icon-btn danger small"; removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", function () { row.remove(); });
  row.appendChild(removeBtn);
  return row;
}

function buildCategoryBlock(cat) {
  const wrap = document.createElement("div");
  wrap.className = "cat-editor";

  const head = document.createElement("div");
  head.className = "cat-editor-head";
  head.innerHTML =
    "<input type='text' class='cat-name-input' placeholder='Nom de la catégorie (ex: Entrées)' value=\"" + escapeAttr(cat.nom) + "\" style='flex:1;'>" +
    "<input type='text' class='cat-image-input' placeholder='Photo de catégorie (optionnel)' value=\"" + escapeAttr(cat.image) + "\" style='flex:1;'>";
  const removeCatBtn = document.createElement("button");
  removeCatBtn.type = "button"; removeCatBtn.className = "icon-btn danger"; removeCatBtn.textContent = "Supprimer";
  removeCatBtn.addEventListener("click", function () { wrap.remove(); });
  head.appendChild(removeCatBtn);
  wrap.appendChild(head);

  const subRoot = document.createElement("div");
  subRoot.className = "sub-root";
  wrap.appendChild(subRoot);

  (cat.sous_categories && cat.sous_categories.length ? cat.sous_categories : [{ nom: "", plats: [] }]).forEach(function (sub) {
    subRoot.appendChild(buildSubcategoryBlock(sub));
  });

  const addSubBtn = document.createElement("button");
  addSubBtn.type = "button"; addSubBtn.className = "icon-btn small";
  addSubBtn.textContent = "+ Ajouter une sous-catégorie";
  addSubBtn.addEventListener("click", function () {
    subRoot.appendChild(buildSubcategoryBlock({ nom: "", plats: [] }));
  });
  wrap.appendChild(addSubBtn);

  return wrap;
}

function buildSubcategoryBlock(sub) {
  const wrap = document.createElement("div");
  wrap.className = "subcat-editor";

  const head = document.createElement("div");
  head.className = "subcat-editor-head";
  head.innerHTML =
    "<input type='text' class='subcat-name-input' placeholder=\"Nom de la sous-catégorie (laisser vide si aucune)\" value=\"" + escapeAttr(sub.nom) + "\" style='flex:1;'>";
  const removeSubBtn = document.createElement("button");
  removeSubBtn.type = "button"; removeSubBtn.className = "icon-btn danger small"; removeSubBtn.textContent = "Supprimer";
  removeSubBtn.addEventListener("click", function () { wrap.remove(); });
  head.appendChild(removeSubBtn);
  wrap.appendChild(head);

  const itemsRoot = document.createElement("div");
  itemsRoot.className = "dish-items";
  wrap.appendChild(itemsRoot);

  (sub.plats || []).forEach(function (plat) { itemsRoot.appendChild(buildPlatRow(plat)); });

  const addPlatBtn = document.createElement("button");
  addPlatBtn.type = "button"; addPlatBtn.className = "icon-btn small";
  addPlatBtn.textContent = "+ Ajouter un plat";
  addPlatBtn.addEventListener("click", function () {
    itemsRoot.appendChild(buildPlatRow({ nom: "", description: "", prix: "", image: "" }));
  });
  wrap.appendChild(addPlatBtn);

  return wrap;
}

function buildPlatRow(plat) {
  const row = document.createElement("div");
  row.className = "dish-row";
  row.innerHTML =
    "<input type='text' class='plat-nom' placeholder='Nom du plat' value=\"" + escapeAttr(plat.nom) + "\">" +
    "<input type='text' class='plat-desc' placeholder='Description' value=\"" + escapeAttr(plat.description) + "\">" +
    "<input type='text' class='plat-prix' placeholder='Prix' value=\"" + escapeAttr(plat.prix) + "\">" +
    "<input type='text' class='plat-image' placeholder='Photo (optionnel)' value=\"" + escapeAttr(plat.image) + "\">";
  const removeBtn = document.createElement("button");
  removeBtn.type = "button"; removeBtn.className = "icon-btn danger small"; removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", function () { row.remove(); });
  row.appendChild(removeBtn);
  return row;
}

function setValue(selector, value) {
  const el = document.querySelector(selector);
  if (el && value !== undefined && value !== null) el.value = value;
}
function val(selector) {
  const el = document.querySelector(selector);
  return el ? el.value.trim() : "";
}

function saveDashboard() {
  const horaires = {};
  DAYS.forEach(function (jour) {
    const el = document.querySelector("#f-horaire-" + jour);
    horaires[jour] = el ? el.value : "";
  });

  const highlights = [];
  document.querySelectorAll("#highlights-editor .dish-row").forEach(function (row) {
    const titre = row.querySelector(".h-titre").value.trim();
    if (!titre) return;
    highlights.push({
      titre: titre,
      texte: row.querySelector(".h-texte").value.trim(),
      image: row.querySelector(".h-image").value.trim()
    });
  });

  const galerie = [];
  document.querySelectorAll("#gallery-editor .dish-row").forEach(function (row) {
    const url = row.querySelector(".g-url").value.trim();
    if (!url) return;
    galerie.push({ url: url, alt: row.querySelector(".g-alt").value.trim() });
  });

  const categories = [];
  document.querySelectorAll("#menu-editor > .cat-editor").forEach(function (catEl) {
    const nom = catEl.querySelector(".cat-name-input").value.trim();
    if (!nom) return;
    const image = catEl.querySelector(".cat-image-input").value.trim();

    const sousCategories = [];
    catEl.querySelectorAll(".sub-root > .subcat-editor").forEach(function (subEl) {
      const subNom = subEl.querySelector(".subcat-name-input").value.trim();
      const plats = [];
      subEl.querySelectorAll(".dish-items > .dish-row").forEach(function (row) {
        const platNom = row.querySelector(".plat-nom").value.trim();
        if (!platNom) return;
        plats.push({
          nom: platNom,
          description: row.querySelector(".plat-desc").value.trim(),
          prix: row.querySelector(".plat-prix").value.trim(),
          image: row.querySelector(".plat-image").value.trim()
        });
      });
      if (plats.length > 0 || subNom) sousCategories.push({ nom: subNom, plats: plats });
    });

    categories.push({ nom: nom, image: image, sous_categories: sousCategories });
  });

  const payload = {
    identite: {
      nom: val("#f-nom"),
      tagline: val("#f-tagline"),
      description: val("#f-description")
    },
    media: {
      hero_image: val("#f-hero-image"),
      hero_video: val("#f-hero-video"),
      galerie: galerie
    },
    contact: {
      telephone: val("#f-telephone"),
      telephone_affiche: val("#f-telephone-affiche"),
      adresse: val("#f-adresse"),
      code_postal: val("#f-code-postal"),
      ville: val("#f-ville"),
      google_maps_url: val("#f-maps-url")
    },
    horaires: horaires,
    reseaux: {
      instagram: val("#f-instagram"),
      facebook: val("#f-facebook")
    },
    highlights: highlights,
    carte: {
      note: val("#f-menu-note"),
      categories: categories
    }
  };

  fetch("./.netlify/functions/update-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(function (res) { return res.json().then((data) => ({ ok: res.ok, data })); })
    .then(function (result) {
      if (result.ok && result.data.ok) {
        showSaveMessage("Enregistré ! Les pages du site sont à jour.", false);
      } else {
        showSaveMessage((result.data && result.data.error) || "Erreur lors de l'enregistrement.", true);
      }
    })
    .catch(function () {
      showSaveMessage("Erreur réseau, réessaie.", true);
    });
}

function showSaveMessage(message, isError) {
  const box = document.querySelector("#save-message");
  if (!box) return;
  box.textContent = message;
  box.className = isError ? "form-error" : "form-success";
}
