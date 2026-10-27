// ============ STATE ============
const FAV_KEY = "cookmate_favourites";
let favourites = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"));

function saveFavourites() {
  localStorage.setItem(FAV_KEY, JSON.stringify([...favourites]));
}

function toggleFavourite(id) {
  if (favourites.has(id)) favourites.delete(id);
  else favourites.add(id);
  saveFavourites();
  refreshFavToggles();
  if (!document.getElementById("view-favourites").hidden) renderFavourites();
}

function refreshFavToggles() {
  document.querySelectorAll(".fav-toggle").forEach(btn => {
    const id = btn.dataset.id;
    const active = favourites.has(id);
    btn.classList.toggle("is-fav", active);
    btn.textContent = active ? "♥" : "♡";
  });
}

// ============ CARD / MODAL RENDERING ============
function cardTile(recipe, size) {
  const [c1, c2] = recipe.gradient;
  return `background: linear-gradient(135deg, ${c1}, ${c2});`;
}

function renderCard(recipe) {
  const isFav = favourites.has(recipe.id);
  return `
    <article class="recipe-card">
      <div class="card-photo" style="${cardTile(recipe)}">
        <span aria-hidden="true">${recipe.emoji}</span>
        <button class="fav-toggle ${isFav ? "is-fav" : ""}" data-id="${recipe.id}" title="Save to favourites" aria-label="Toggle favourite">${isFav ? "♥" : "♡"}</button>
      </div>
      <div class="card-body">
        <h3 class="card-name">${recipe.name}</h3>
        <p class="card-category">${recipe.category}</p>
        <p class="card-time">🕒 ${recipe.time} mins</p>
        <button class="btn btn-outline view-recipe-btn" data-id="${recipe.id}">View Recipe</button>
      </div>
    </article>
  `;
}

function renderGrid(container, recipes) {
  container.innerHTML = recipes.map(renderCard).join("");
}

function findRecipe(id) {
  return RECIPES.find(r => r.id === id);
}

function openRecipeModal(id) {
  const r = findRecipe(id);
  if (!r) return;
  const isFav = favourites.has(r.id);
  const modalContent = document.getElementById("modalContent");
  modalContent.innerHTML = `
    <div class="modal-photo" style="${cardTile(r)}">${r.emoji}</div>
    <div class="modal-body">
      <span class="modal-cat">${r.category}</span>
      <h2 class="modal-title">${r.name}</h2>
      <div class="modal-meta">
        <span>🕒 ${r.time} mins</span>
        <span>🍽️ Serves ${r.servings}</span>
      </div>
      <div class="modal-section-title">Ingredients</div>
      <ul>${r.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
      <div class="modal-section-title">Steps</div>
      <ol>${r.steps.map(s => `<li>${s}</li>`).join("")}</ol>
      <button class="btn btn-accent modal-fav-btn" id="modalFavBtn" data-id="${r.id}">
        ${isFav ? "♥ Saved to Favourites" : "♡ Save to Favourites"}
      </button>
    </div>
  `;
  document.getElementById("recipeModal").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("recipeModal").hidden = true;
  document.body.style.overflow = "";
}

// ============ EVENT DELEGATION (cards + modal) ============
document.addEventListener("click", (e) => {
  const favBtn = e.target.closest(".fav-toggle");
  if (favBtn) {
    toggleFavourite(favBtn.dataset.id);
    return;
  }
  const viewBtn = e.target.closest(".view-recipe-btn");
  if (viewBtn) {
    openRecipeModal(viewBtn.dataset.id);
    return;
  }
  const modalFavBtn = e.target.closest("#modalFavBtn");
  if (modalFavBtn) {
    toggleFavourite(modalFavBtn.dataset.id);
    const isFav = favourites.has(modalFavBtn.dataset.id);
    modalFavBtn.textContent = isFav ? "♥ Saved to Favourites" : "♡ Save to Favourites";
    return;
  }
});

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("recipeModal").addEventListener("click", (e) => {
  if (e.target.id === "recipeModal") closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ============ NAV / VIEW SWITCHING ============
const views = {
  home: document.getElementById("view-home"),
  favourites: document.getElementById("view-favourites"),
  surprise: document.getElementById("view-surprise"),
};

function showView(name) {
  Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; });
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.nav === name);
  });
  document.getElementById("navToggle").parentElement === null;
  document.querySelector(".main-nav").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (name === "favourites") renderFavourites();
  if (name === "surprise") showRandomRecipe();
}

document.querySelectorAll("[data-nav]").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    showView(el.dataset.nav);
  });
});

document.getElementById("navToggle").addEventListener("click", () => {
  document.querySelector(".main-nav").classList.toggle("open");
});

// ============ FAVOURITES VIEW ============
function renderFavourites() {
  const grid = document.getElementById("favouritesGrid");
  const empty = document.getElementById("favouritesEmpty");
  const favRecipes = RECIPES.filter(r => favourites.has(r.id));
  if (favRecipes.length === 0) {
    grid.innerHTML = "";
    empty.hidden = false;
  } else {
    empty.hidden = true;
    renderGrid(grid, favRecipes);
  }
}

// ============ SURPRISE ME ============
function showRandomRecipe() {
  const r = RECIPES[Math.floor(Math.random() * RECIPES.length)];
  document.getElementById("surpriseCard").innerHTML = renderCard(r);
}

document.getElementById("surpriseBtn").addEventListener("click", () => {
  showView("surprise");
});
document.getElementById("surpriseAgainBtn").addEventListener("click", showRandomRecipe);

// ============ SEARCH: BY DISH NAME ============
function searchByDish(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return RECIPES.filter(r =>
    r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
  );
}

// ============ SEARCH: BY INGREDIENTS ============
function searchByIngredients(query) {
  const terms = query.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
  if (terms.length === 0) return [];
  const scored = RECIPES.map(r => {
    const haystack = (r.tags.join(" ") + " " + r.ingredients.join(" ")).toLowerCase();
    const matches = terms.filter(t => haystack.includes(t)).length;
    return { r, matches };
  }).filter(x => x.matches > 0);
  scored.sort((a, b) => b.matches - a.matches);
  return scored.map(x => x.r);
}

function showResults(title, recipes) {
  const section = document.getElementById("resultsSection");
  const grid = document.getElementById("resultsGrid");
  const empty = document.getElementById("resultsEmpty");
  document.getElementById("resultsTitle").textContent = title;
  section.hidden = false;
  if (recipes.length === 0) {
    grid.innerHTML = "";
    empty.hidden = false;
  } else {
    empty.hidden = true;
    renderGrid(grid, recipes);
  }
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("dishSearchBtn").addEventListener("click", () => {
  const q = document.getElementById("dishSearch").value;
  showResults(`Results for "${q.trim()}"`, searchByDish(q));
});
document.getElementById("dishSearch").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("dishSearchBtn").click();
});

document.getElementById("ingredientSearchBtn").addEventListener("click", () => {
  const q = document.getElementById("ingredientSearch").value;
  showResults(`Recipes using "${q.trim()}"`, searchByIngredients(q));
});
document.getElementById("ingredientSearch").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("ingredientSearchBtn").click();
});

document.getElementById("clearResults").addEventListener("click", () => {
  document.getElementById("resultsSection").hidden = true;
  document.getElementById("dishSearch").value = "";
  document.getElementById("ingredientSearch").value = "";
});

// ============ INITIAL RENDER ============
function init() {
  const popular = RECIPES.slice(0, 5);
  renderGrid(document.getElementById("popularGrid"), popular);
}
init();
