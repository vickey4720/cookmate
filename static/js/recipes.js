/**
 * CookMate - TheMealDB Recipes Integration
 * Independent recipe discovery powered by TheMealDB API.
 */

const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

// Active User Favorites IDs Set (loaded from backend)
let userFavoriteIds = new Set();

async function fetchUserFavorites() {
  try {
    const res = await fetch('/api/favorites/ids');
    const data = await res.json();
    if (data.success) {
      userFavoriteIds = new Set(data.favorite_ids || []);
    }
  } catch (e) {
    console.warn('Could not load user favorite IDs:', e);
  }
}

// Fetch categories from TheMealDB
async function loadRecipeCategories() {
  const container = document.getElementById('recipe-categories-bar');
  if (!container) return;

  try {
    const res = await fetch(`${THEMEALDB_BASE}/categories.php`);
    const data = await res.json();
    if (data.categories) {
      const topCategories = data.categories.slice(0, 10);
      container.innerHTML = `
        <button class="category-chip active" onclick="filterByCategory('All', this)">All</button>
        ${topCategories.map(c => `
          <button class="category-chip" onclick="filterByCategory('${c.strCategory}', this)">
            ${c.strCategory}
          </button>
        `).join('')}
      `;
    }
  } catch (err) {
    console.error('Error fetching categories from TheMealDB:', err);
  }
}

// Search recipes by query
async function searchRecipes(query = '') {
  const grid = document.getElementById('recipes-grid');
  const emptyEl = document.getElementById('recipes-empty');
  const loadingEl = document.getElementById('recipes-loading');

  if (loadingEl) loadingEl.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';
  if (grid) grid.innerHTML = '';

  try {
    const url = query.trim()
      ? `${THEMEALDB_BASE}/search.php?s=${encodeURIComponent(query.trim())}`
      : `${THEMEALDB_BASE}/search.php?s=chicken`;

    const res = await fetch(url);
    const data = await res.json();

    if (loadingEl) loadingEl.style.display = 'none';

    if (!data.meals || data.meals.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    renderRecipeCards(data.meals);
  } catch (err) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (emptyEl) {
      emptyEl.textContent = 'Unable to connect to recipe server. Please check your internet connection.';
      emptyEl.style.display = 'block';
    }
    console.error('TheMealDB error:', err);
  }
}

// Filter recipes by category
async function filterByCategory(category, btnEl) {
  document.querySelectorAll('.category-chip').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const grid = document.getElementById('recipes-grid');
  const emptyEl = document.getElementById('recipes-empty');
  const loadingEl = document.getElementById('recipes-loading');

  if (loadingEl) loadingEl.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';
  if (grid) grid.innerHTML = '';

  try {
    if (category === 'All') {
      await searchRecipes('');
      return;
    }

    const res = await fetch(`${THEMEALDB_BASE}/filter.php?c=${encodeURIComponent(category)}`);
    const data = await res.json();

    if (loadingEl) loadingEl.style.display = 'none';

    if (!data.meals || data.meals.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    renderRecipeCards(data.meals, category);
  } catch (err) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    console.error('Filter error:', err);
  }
}

// Render cards into the grid
function renderRecipeCards(meals, defaultCategory = '') {
  const grid = document.getElementById('recipes-grid');
  if (!grid) return;

  grid.innerHTML = meals.map(m => {
    const id = m.idMeal;
    const title = m.strMeal;
    const thumb = m.strMealThumb;
    const cat = m.strCategory || defaultCategory || 'Recipe';
    const area = m.strArea ? ` | 🌍 ${m.strArea}` : '';
    const isFav = userFavoriteIds.has(String(id));

    return `
      <article class="recipe-card" data-id="${id}">
        <div class="card-media">
          <img src="${thumb}" alt="${title}" loading="lazy" onerror="this.src='/static/images/pasta-skillet.jpg'">
          <button class="fav-btn ${isFav ? 'is-fav' : ''}" 
                  onclick="handleRecipeFav('${id}', '${title.replace(/'/g, "\\'")}', '${thumb}', '${cat}', this)"
                  title="${isFav ? 'Remove from Favorites' : 'Save to Favorites'}">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="card-body">
          <h3 class="card-title">${title}</h3>
          <div class="card-meta">
            <span>🏷️ ${cat}${area}</span>
          </div>
          <p class="card-desc">Click view recipe to see full step-by-step cooking instructions and ingredients.</p>
          <div class="card-footer">
            <button class="btn btn-outline btn-sm" onclick="openRecipeDetailModal('${id}')">
              View Recipe →
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Handle Favorite Click
function handleRecipeFav(id, name, thumb, cat, btnEl) {
  toggleFavorite(id, name, thumb, cat, btnEl);
  if (userFavoriteIds.has(String(id))) {
    userFavoriteIds.delete(String(id));
  } else {
    userFavoriteIds.add(String(id));
  }
}

// Open Recipe Detail Modal
async function openRecipeDetailModal(mealId) {
  const modal = document.getElementById('recipe-detail-modal');
  const content = document.getElementById('recipe-modal-body');
  if (!modal || !content) return;

  content.innerHTML = '<div style="padding: 40px; text-align: center; color: #666;">Loading recipe details...</div>';
  modal.classList.add('open');

  try {
    const res = await fetch(`${THEMEALDB_BASE}/lookup.php?i=${mealId}`);
    const data = await res.json();
    if (!data.meals || data.meals.length === 0) {
      content.innerHTML = '<p style="padding: 24px;">Recipe details not found.</p>';
      return;
    }

    const meal = data.meals[0];

    // Extract ingredients & measures
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ing && ing.trim()) {
        ingredients.push({
          name: ing.trim(),
          measure: measure ? measure.trim() : ''
        });
      }
    }

    const isFav = userFavoriteIds.has(String(meal.idMeal));

    content.innerHTML = `
      <div class="recipe-modal-header">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" onerror="this.src='/static/images/pasta-skillet.jpg'">
        <button class="modal-close-btn" onclick="closeRecipeModal()">✕</button>
      </div>
      <div class="recipe-modal-content">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
          <div>
            <h2 class="recipe-modal-title">${meal.strMeal}</h2>
            <div class="recipe-modal-meta">
              <span>🏷️ Category: <strong>${meal.strCategory || 'General'}</strong></span>
              ${meal.strArea ? `<span>🌍 Origin: <strong>${meal.strArea}</strong></span>` : ''}
            </div>
          </div>
          <button class="btn btn-outline btn-sm ${isFav ? 'btn-primary' : ''}" 
                  id="modal-fav-btn"
                  onclick="handleRecipeFav('${meal.idMeal}', '${meal.strMeal.replace(/'/g, "\\'")}', '${meal.strMealThumb}', '${meal.strCategory || ''}', this)">
            ${isFav ? '❤️ Saved to Favorites' : '🤍 Save to Favorites'}
          </button>
        </div>

        <div class="recipe-section-h">🛒 Ingredients & Measurements</div>
        <div class="ingredients-grid">
          ${ingredients.map(item => `
            <div class="ingredient-pill">
              <span>🥄</span>
              <div>
                <strong>${item.name}</strong>
                ${item.measure ? `<span class="measure"> — ${item.measure}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="recipe-section-h">🍳 Cooking Instructions</div>
        <div class="instructions-text">${meal.strInstructions || 'No instructions provided.'}</div>

        ${meal.strYoutube ? `
          <div class="recipe-video-box">
            <a href="${meal.strYoutube}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
              ▶ Watch Video Guide on YouTube
            </a>
          </div>
        ` : ''}
      </div>
    `;
  } catch (err) {
    content.innerHTML = '<p style="padding: 24px; color: red;">Failed to load recipe details from server.</p>';
  }
}

function closeRecipeModal() {
  const modal = document.getElementById('recipe-detail-modal');
  if (modal) modal.classList.remove('open');
}

// Initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('recipes-grid')) {
    await fetchUserFavorites();
    await loadRecipeCategories();

    // Check if URL has a search query (e.g., from home page search)
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('q');
    if (searchParam) {
      const searchInput = document.getElementById('recipe-search-input');
      if (searchInput) searchInput.value = searchParam;
      searchRecipes(searchParam);
    } else {
      searchRecipes('');
    }

    // Search button and Enter key listeners
    const searchBtn = document.getElementById('recipe-search-btn');
    const searchInput = document.getElementById('recipe-search-input');
    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', () => searchRecipes(searchInput.value));
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchRecipes(searchInput.value);
      });
    }
  }
});
