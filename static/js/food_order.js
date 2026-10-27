/**
 * CookMate - Customer Food Ordering Logic (food_order.js)
 * Strictly matches Reference Image 5 sidebar navigation,
 * dynamic filtering, sorting, and responsive interactions.
 */

function filterFoodCategory(category, itemEl) {
  // Update active state in sidebar
  document.querySelectorAll('.food-category-item').forEach(el => el.classList.remove('active'));
  if (itemEl) itemEl.classList.add('active');

  // Update title in catalog header
  const titleEl = document.getElementById('food-catalog-active-title');
  if (titleEl) {
    titleEl.textContent = category === 'All' ? 'All Food' : category;
  }

  const cards = document.querySelectorAll('.food-item-card');
  let visibleCount = 0;

  cards.forEach(card => {
    const itemCat = card.dataset.category || '';
    if (category === 'All' || itemCat.toLowerCase() === category.toLowerCase()) {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  const emptyMsg = document.getElementById('food-empty-msg');
  if (emptyMsg) {
    emptyMsg.style.display = visibleCount === 0 ? 'block' : 'none';
  }
}

function searchFoodMenu(query) {
  const q = (query || '').trim().toLowerCase();
  const cards = document.querySelectorAll('.food-item-card');
  let visibleCount = 0;

  cards.forEach(card => {
    const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
    const desc = card.querySelector('.card-desc')?.textContent.toLowerCase() || '';
    const cat = card.dataset.category?.toLowerCase() || '';

    if (!q || title.includes(q) || desc.includes(q) || cat.includes(q)) {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  const emptyMsg = document.getElementById('food-empty-msg');
  if (emptyMsg) {
    emptyMsg.style.display = visibleCount === 0 ? 'block' : 'none';
  }
}

function sortFoodCatalog(sortBy) {
  const grid = document.getElementById('food-menu-grid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.food-item-card'));

  cards.sort((a, b) => {
    const priceA = parseFloat(a.dataset.price) || 0;
    const priceB = parseFloat(b.dataset.price) || 0;
    const ratingA = parseFloat(a.dataset.rating) || 0;
    const ratingB = parseFloat(b.dataset.rating) || 0;

    if (sortBy === 'price-low') {
      return priceA - priceB;
    } else if (sortBy === 'price-high') {
      return priceB - priceA;
    } else if (sortBy === 'rating') {
      return ratingB - ratingA;
    } else {
      // Default: Most Popular / rating
      return ratingB - ratingA;
    }
  });

  cards.forEach(card => grid.appendChild(card));
}

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('food-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchFoodMenu(e.target.value);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        searchFoodMenu(e.target.value);
      }
    });
  }
});
