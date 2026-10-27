/**
 * CookMate - Main Shared Frontend JavaScript
 * Handles navigation, toast notifications, cart drawer, modal, and auth state.
 */

// Toast notification helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';
  if (type === 'heart') icon = '❤️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Global Cart State and Slide-Over Drawer
let cartState = [];

async function loadCart() {
  try {
    const res = await fetch('/api/cart');
    const data = await res.json();
    if (data.success) {
      cartState = data.cart || [];
      updateCartUI();
    }
  } catch (err) {
    console.error('Failed to load cart:', err);
  }
}

function updateCartUI() {
  const badge = document.getElementById('nav-cart-badge');
  const count = cartState.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  // Slide-over drawer elements
  const itemsContainer = document.getElementById('cart-drawer-items');
  const totalAmountEl = document.getElementById('cart-drawer-total');
  const checkoutBtn = document.getElementById('cart-drawer-checkout-btn');

  // Food order page sidebar elements (matching Reference Image 5)
  const sidebarItemsContainer = document.getElementById('sidebar-cart-items');
  const sidebarTotalEl = document.getElementById('sidebar-cart-total');
  const sidebarCountEl = document.getElementById('sidebar-cart-count');
  const sidebarCheckoutBtn = document.getElementById('sidebar-cart-checkout-btn');

  if (sidebarCountEl) sidebarCountEl.textContent = count;

  let subtotal = 0;
  cartState.forEach(item => {
    const price = item.discount_price ? item.discount_price : item.price;
    subtotal += price * item.quantity;
  });

  if (totalAmountEl) totalAmountEl.textContent = `₹${subtotal.toFixed(2)}`;
  if (sidebarTotalEl) sidebarTotalEl.textContent = `₹${subtotal.toFixed(2)}`;

  if (cartState.length === 0) {
    if (itemsContainer) {
      itemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <div class="empty-icon">🛒</div>
          <h4>Your Cart is Empty</h4>
          <p>Explore delicious dishes from our food menu and add them here!</p>
          <a href="/food-order" class="btn btn-primary btn-sm" style="margin-top: 14px;">Browse Food Menu</a>
        </div>
      `;
    }
    if (sidebarItemsContainer) {
      sidebarItemsContainer.innerHTML = `
        <div style="text-align: center; padding: 24px 10px; color: #94a3b8; font-size: 0.9rem;">
          Your cart is empty. Add dishes from the menu!
        </div>
      `;
    }
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    if (sidebarCheckoutBtn) sidebarCheckoutBtn.style.display = 'none';
    return;
  }

  if (checkoutBtn) checkoutBtn.style.display = 'inline-flex';
  if (sidebarCheckoutBtn) sidebarCheckoutBtn.style.display = 'inline-flex';

  // Render drawer items
  if (itemsContainer) {
    itemsContainer.innerHTML = cartState.map(item => {
      const price = item.discount_price ? item.discount_price : item.price;
      return `
        <div class="cart-item-row" data-id="${item.food_item_id}">
          <img src="${item.image_url}" alt="${item.name}" class="cart-item-thumb" onerror="this.src='/static/images/pizza.jpg'">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₹${price.toFixed(2)}</div>
            <div class="cart-qty-ctrls">
              <button class="qty-btn" onclick="changeCartQty(${item.food_item_id}, -1)">−</button>
              <span class="cart-qty-num">${item.quantity}</span>
              <button class="qty-btn" onclick="changeCartQty(${item.food_item_id}, 1)">+</button>
              <button class="cart-remove-btn" onclick="removeCartItem(${item.food_item_id})" title="Remove item">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render sidebar cart items (Strictly matching Reference Image 5)
  if (sidebarItemsContainer) {
    sidebarItemsContainer.innerHTML = cartState.map(item => {
      const price = item.discount_price ? item.discount_price : item.price;
      return `
        <div class="sidebar-cart-row" data-id="${item.food_item_id}">
          <img src="${item.image_url}" alt="${item.name}" class="sidebar-cart-thumb" onerror="this.src='/static/images/pizza.jpg'">
          <div class="sidebar-cart-info">
            <div class="sidebar-cart-name">${item.name}</div>
            <div class="sidebar-cart-price">₹${price.toFixed(2)}</div>
          </div>
          <div class="sidebar-cart-controls">
            <button class="qty-btn" onclick="changeCartQty(${item.food_item_id}, -1)">−</button>
            <span class="sidebar-cart-qty">${item.quantity}</span>
            <button class="qty-btn" onclick="changeCartQty(${item.food_item_id}, 1)">+</button>
            <button class="sidebar-cart-trash" onclick="removeCartItem(${item.food_item_id})" title="Remove item">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }
}

async function clearCart() {
  if (!cartState || cartState.length === 0) return;
  for (const item of cartState) {
    try {
      await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_item_id: item.food_item_id })
      });
    } catch (e) {}
  }
  showToast('Cart cleared', 'info');
  loadCart();
}

async function addToCart(foodId, quantity = 1) {
  try {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_item_id: foodId, quantity })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Item added to cart!', 'success');
      loadCart();
      openCartDrawer();
    } else {
      if (data.require_auth) {
        showToast('Please sign in to order food items.', 'error');
        setTimeout(() => { window.location.href = '/signin'; }, 1200);
      } else {
        showToast(data.error || 'Failed to add item to cart', 'error');
      }
    }
  } catch (err) {
    showToast('Network error while adding to cart', 'error');
  }
}

async function changeCartQty(foodId, delta) {
  const item = cartState.find(i => i.food_item_id === foodId);
  if (!item) return;
  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    removeCartItem(foodId);
    return;
  }

  try {
    const res = await fetch('/api/cart/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_item_id: foodId, quantity: newQty })
    });
    const data = await res.json();
    if (data.success) {
      loadCart();
    }
  } catch (err) {
    console.error('Failed to update cart quantity:', err);
  }
}

async function removeCartItem(foodId) {
  try {
    const res = await fetch('/api/cart/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_item_id: foodId })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Item removed from cart', 'info');
      loadCart();
    }
  } catch (err) {
    console.error('Failed to remove cart item:', err);
  }
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer-overlay');
  if (drawer) drawer.classList.add('open');
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer-overlay');
  if (drawer) drawer.classList.remove('open');
}

// Global Favorite Toggle
async function toggleFavorite(mealId, mealName, mealThumb, mealCategory, btnEl) {
  try {
    const res = await fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meal_id: mealId,
        meal_name: mealName,
        meal_thumb: mealThumb,
        meal_category: mealCategory
      })
    });
    const data = await res.json();
    if (data.success) {
      const isFav = data.is_favorite;
      if (btnEl) {
        btnEl.classList.toggle('is-fav', isFav);
        btnEl.innerHTML = isFav ? '❤️' : '🤍';
      }
      showToast(data.message, 'heart');
      // If we are on favorites page, reload favorites list
      if (window.location.pathname === '/favorites' && !isFav) {
        const card = btnEl.closest('.recipe-card');
        if (card) card.remove();
      }
    } else {
      if (data.require_auth) {
        showToast('Please sign in to save your favorite recipes.', 'error');
        setTimeout(() => { window.location.href = '/signin'; }, 1500);
      } else {
        showToast(data.error || 'Failed to update favorite', 'error');
      }
    }
  } catch (err) {
    showToast('Network error while toggling favorite', 'error');
  }
}

// User Dropdown Toggle
document.addEventListener('DOMContentLoaded', () => {
  const userBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => {
      userDropdown.classList.remove('show');
    });
  }

  // Mobile nav toggle
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('site-nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Close modals on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCartDrawer();
      const modal = document.getElementById('recipe-detail-modal');
      if (modal) modal.classList.remove('open');
    }
  });

  // Initial cart load
  loadCart();
});
