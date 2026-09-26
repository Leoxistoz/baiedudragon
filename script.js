/* ================================
   LA BAIE DU DRAGON — script.js
   ================================ */

document.addEventListener("DOMContentLoaded", function () {
  initNav();
  initBackToTop();
  initReveal();
  initYear();
  initPublicContent(); // index.html + carte.html
  initLoginForm(); // admin.html
  initDashboard(); // dashboard.html
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

/* ---------- Retour en haut ---------- */
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

/* ---------- Animations reveal ---------- */
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
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
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

/* ---------- Contenu dynamique (pages publiques) ----------
   Les pages index.html et carte.html contiennent déjà le contenu
   "par défaut" directement dans le HTML (donc jamais de page vide,
   et un bon référencement). Ce script va simplement vérifier s'il
   existe un contenu plus récent (modifié depuis le tableau de bord)
   et, si oui, met à jour la page avec.
------------------------------------------------------------- */
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
      // En cas d'erreur réseau, on garde simplement le contenu par défaut déjà affiché.
    });
}

function fetchContent() {
  return fetch("./.netlify/functions/get-content", { cache: "no-store" }).then(function (res) {
    if (!res.ok) throw new Error("Erreur chargement contenu");
    return res.json();
  });
}

function renderAccueil(c) {
  setText("[data-field='nom']", c.identite && c.identite.nom);
  setText("[data-field='tagline']", c.identite && c.identite.tagline);
  setText("[data-field='description']", c.identite && c.identite.description);
  setText("[data-field='telephone_affiche']", c.contact && c.contact.telephone_affiche);
  setAttrAll("[data-field='telephone_href']", "href", "tel:" + (c.contact && c.contact.telephone));
  setText("[data-field='adresse']", c.contact && (c.contact.adresse + ", " + c.contact.code_postal + " " + c.contact.ville));
  setAttr("[data-field='maps_href']", "href", c.contact && c.contact.google_maps_url);

  const hoursBody = document.querySelector("[data-field='horaires']");
  if (hoursBody && c.horaires) {
    hoursBody.innerHTML = "";
    ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"].forEach(function (jour) {
      const tr = document.createElement("tr");
      tr.innerHTML = "<td>" + capitalize(jour) + "</td><td>" + escapeHtml(c.horaires[jour] || "") + "</td>";
      hoursBody.appendChild(tr);
    });
  }

  const highlightsList = document.querySelector("[data-field='highlights']");
  if (highlightsList && Array.isArray(c.highlights)) {
    highlightsList.innerHTML = "";
    c.highlights.forEach(function (h) {
      const li = document.createElement("li");
      li.textContent = h;
      highlightsList.appendChild(li);
    });
  }
}

function renderCarte(c) {
  setText("[data-field='menu_note']", c.carte && c.carte.note);

  const container = document.querySelector("[data-field='menu_categories']");
  if (!container || !c.carte || !Array.isArray(c.carte.categories)) return;

  container.innerHTML = "";
  c.carte.categories.forEach(function (cat) {
    const section = document.createElement("div");
    section.className = "menu-category reveal is-visible";

    const h2 = document.createElement("h2");
    h2.textContent = cat.nom;
    section.appendChild(h2);

    (cat.plats || []).forEach(function (plat) {
      const item = document.createElement("div");
      item.className = "menu-item";
      item.innerHTML =
        "<div><div class='menu-item-name'>" + escapeHtml(plat.nom) + "</div>" +
        "<div class='menu-item-desc'>" + escapeHtml(plat.description || "") + "</div></div>" +
        "<div class='menu-item-price'>" + escapeHtml(plat.prix || "") + "</div>";
      section.appendChild(item);
    });

    container.appendChild(section);
  });
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el && value !== undefined && value !== null) el.textContent = value;
}
function setAttr(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el && value) el.setAttribute(attr, value);
}
function setAttrAll(selector, attr, value) {
  if (!value) return;
  document.querySelectorAll(selector).forEach(function (el) {
    el.setAttribute(attr, value);
  });
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (m) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
  });
}

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
    logoutBtn.addEventListener("click", function () {
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

  const addCategoryBtn = document.querySelector("#add-category");
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", function () {
      const menuRoot = document.querySelector("#menu-editor");
      const nextIndex = document.querySelectorAll("#menu-editor .menu-editor-cat").length;
      menuRoot.appendChild(buildCategoryBlock({ nom: "", plats: [] }, nextIndex));
    });
  }
}

function fillDashboardForm(c) {
  setValue("#f-nom", c.identite && c.identite.nom);
  setValue("#f-tagline", c.identite && c.identite.tagline);
  setValue("#f-description", c.identite && c.identite.description);
  setValue("#f-telephone", c.contact && c.contact.telephone);
  setValue("#f-telephone-affiche", c.contact && c.contact.telephone_affiche);
  setValue("#f-adresse", c.contact && c.contact.adresse);
  setValue("#f-code-postal", c.contact && c.contact.code_postal);
  setValue("#f-ville", c.contact && c.contact.ville);
  setValue("#f-maps-url", c.contact && c.contact.google_maps_url);
  setValue("#f-instagram", c.reseaux && c.reseaux.instagram);
  setValue("#f-facebook", c.reseaux && c.reseaux.facebook);

  ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"].forEach(function (jour) {
    setValue("#f-horaire-" + jour, c.horaires && c.horaires[jour]);
  });

  setValue("#f-highlights", Array.isArray(c.highlights) ? c.highlights.join("\n") : "");
  setValue("#f-menu-note", c.carte && c.carte.note);

  const menuRoot = document.querySelector("#menu-editor");
  if (menuRoot && c.carte && Array.isArray(c.carte.categories)) {
    menuRoot.innerHTML = "";
    c.carte.categories.forEach(function (cat, catIndex) {
      menuRoot.appendChild(buildCategoryBlock(cat, catIndex));
    });
  }
}

function buildCategoryBlock(cat, catIndex) {
  const wrap = document.createElement("div");
  wrap.className = "menu-editor-cat";
  wrap.setAttribute("data-cat-index", catIndex);

  const title = document.createElement("input");
  title.type = "text";
  title.value = cat.nom || "";
  title.placeholder = "Nom de la catégorie (ex: Entrées)";
  title.className = "cat-name-input";
  title.style.marginBottom = "12px";
  wrap.appendChild(title);

  const itemsRoot = document.createElement("div");
  itemsRoot.className = "cat-items";
  wrap.appendChild(itemsRoot);

  (cat.plats || []).forEach(function (plat) {
    itemsRoot.appendChild(buildPlatRow(plat));
  });

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "icon-btn";
  addBtn.textContent = "+ Ajouter un plat";
  addBtn.addEventListener("click", function () {
    itemsRoot.appendChild(buildPlatRow({ nom: "", description: "", prix: "" }));
  });
  wrap.appendChild(addBtn);

  const removeCatBtn = document.createElement("button");
  removeCatBtn.type = "button";
  removeCatBtn.className = "icon-btn danger";
  removeCatBtn.style.marginLeft = "8px";
  removeCatBtn.textContent = "Supprimer la catégorie";
  removeCatBtn.addEventListener("click", function () { wrap.remove(); });
  wrap.appendChild(removeCatBtn);

  return wrap;
}

function buildPlatRow(plat) {
  const row = document.createElement("div");
  row.className = "menu-editor-item";
  row.innerHTML =
    "<input type='text' class='plat-nom' placeholder='Nom du plat' value=\"" + escapeAttr(plat.nom) + "\">" +
    "<input type='text' class='plat-desc' placeholder='Description' value=\"" + escapeAttr(plat.description) + "\">" +
    "<input type='text' class='plat-prix' placeholder='Prix' value=\"" + escapeAttr(plat.prix) + "\">";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "icon-btn danger";
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", function () { row.remove(); });
  row.appendChild(removeBtn);

  return row;
}

function addMenuItemRow(catIndex) {
  const cat = document.querySelector("[data-cat-index='" + catIndex + "'] .cat-items");
  if (cat) cat.appendChild(buildPlatRow({ nom: "", description: "", prix: "" }));
}

function escapeAttr(v) {
  return String(v || "").replace(/"/g, "&quot;");
}

function setValue(selector, value) {
  const el = document.querySelector(selector);
  if (el && value !== undefined && value !== null) el.value = value;
}

function saveDashboard() {
  const horaires = {};
  ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"].forEach(function (jour) {
    const el = document.querySelector("#f-horaire-" + jour);
    horaires[jour] = el ? el.value : "";
  });

  const categories = [];
  document.querySelectorAll("#menu-editor .menu-editor-cat").forEach(function (catEl) {
    const nom = catEl.querySelector(".cat-name-input").value.trim();
    const plats = [];
    catEl.querySelectorAll(".menu-editor-item").forEach(function (row) {
      const nomPlat = row.querySelector(".plat-nom").value.trim();
      if (!nomPlat) return;
      plats.push({
        nom: nomPlat,
        description: row.querySelector(".plat-desc").value.trim(),
        prix: row.querySelector(".plat-prix").value.trim()
      });
    });
    if (nom) categories.push({ nom, plats });
  });

  const payload = {
    identite: {
      nom: val("#f-nom"),
      tagline: val("#f-tagline"),
      description: val("#f-description")
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
    highlights: val("#f-highlights").split("\n").map((s) => s.trim()).filter(Boolean),
    carte: {
      note: val("#f-menu-note"),
      categories: categories
    },
    photos: (dashboardContent && dashboardContent.photos) || []
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

function val(selector) {
  const el = document.querySelector(selector);
  return el ? el.value : "";
}

function showSaveMessage(message, isError) {
  const box = document.querySelector("#save-message");
  if (!box) return;
  box.textContent = message;
  box.className = isError ? "form-error" : "form-success";
}
