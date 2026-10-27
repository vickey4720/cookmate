/**
 * CookMate - Admin Panel Frontend Logic
 * Strictly implements Reference Image 1: Live real-time preview card updates,
 * file reader preview, character counter, and order status updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements for Add Food Item Live Preview
  const foodNameInput = document.getElementById('admin-food-name');
  const priceInput = document.getElementById('admin-food-price');
  const discountInput = document.getElementById('admin-discount-price');
  const categorySelect = document.getElementById('admin-food-category');
  const descTextarea = document.getElementById('admin-food-desc');
  const prepTimeInput = document.getElementById('admin-prep-time');
  const servingSizeInput = document.getElementById('admin-serving-size');
  const ratingInput = document.getElementById('admin-rating');
  const fileInput = document.getElementById('admin-food-file');
  const fileNameDisplay = document.getElementById('admin-file-name');
  const charCounter = document.getElementById('admin-desc-count');
  const resetBtn = document.getElementById('admin-reset-btn');

  // Preview Card Elements
  const previewName = document.getElementById('preview-food-name');
  const previewRating = document.getElementById('preview-food-rating');
  const previewTime = document.getElementById('preview-food-time');
  const previewServing = document.getElementById('preview-food-serving');
  const previewDesc = document.getElementById('preview-food-desc');
  const previewCurrentPrice = document.getElementById('preview-current-price');
  const previewOrigPrice = document.getElementById('preview-original-price');
  const previewImage = document.getElementById('preview-food-img');

  function updateLivePreview() {
    // 1. Food Name
    if (previewName && foodNameInput) {
      previewName.textContent = foodNameInput.value.trim() || 'Food Item Name';
    }

    // 2. Rating
    if (previewRating && ratingInput) {
      const val = parseFloat(ratingInput.value) || 4.5;
      previewRating.innerHTML = `⭐ ${val.toFixed(1)}`;
    }

    // 3. Time & Serving
    if (previewTime && prepTimeInput) {
      previewTime.innerHTML = `🕒 ${prepTimeInput.value.trim() || '20 mins'}`;
    }
    if (previewServing && servingSizeInput) {
      previewServing.innerHTML = `👥 ${servingSizeInput.value.trim() || '2 persons'}`;
    }

    // 4. Description & Character Counter
    if (descTextarea) {
      const len = descTextarea.value.length;
      if (charCounter) charCounter.textContent = `${len}/200`;
      if (previewDesc) {
        previewDesc.textContent = descTextarea.value.trim() || 'Delicious food item with fresh ingredients prepared by expert chefs.';
      }
    }

    // 5. Prices
    if (priceInput && previewCurrentPrice) {
      const regularPrice = parseFloat(priceInput.value) || 0;
      const discountPrice = discountInput ? parseFloat(discountInput.value) : null;

      if (discountPrice && discountPrice > 0 && discountPrice < regularPrice) {
        previewCurrentPrice.textContent = `₹${discountPrice.toFixed(0)}`;
        if (previewOrigPrice) {
          previewOrigPrice.textContent = `₹${regularPrice.toFixed(0)}`;
          previewOrigPrice.style.display = 'inline';
        }
      } else {
        previewCurrentPrice.textContent = regularPrice > 0 ? `₹${regularPrice.toFixed(0)}` : '₹199';
        if (previewOrigPrice) previewOrigPrice.style.display = 'none';
      }
    }
  }

  // Bind live change listeners
  [foodNameInput, priceInput, discountInput, categorySelect, descTextarea, prepTimeInput, servingSizeInput, ratingInput].forEach(el => {
    if (el) {
      el.addEventListener('input', updateLivePreview);
      el.addEventListener('change', updateLivePreview);
    }
  });

  // Image Upload Preview via FileReader
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (fileNameDisplay) fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
          if (previewImage) previewImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Reset Button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      setTimeout(() => {
        if (fileNameDisplay) fileNameDisplay.textContent = 'No file chosen';
        if (previewImage) previewImage.src = '/static/images/pizza.jpg';
        updateLivePreview();
      }, 50);
    });
  }

  // Initial update
  updateLivePreview();
});

// Admin Order Status Update
async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/admin/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Order status updated successfully', 'success');
      setTimeout(() => window.location.reload(), 800);
    } else {
      showToast(data.error || 'Failed to update order status', 'error');
    }
  } catch (err) {
    showToast('Network error updating status', 'error');
  }
}

// Admin Toggle Food Item Availability
async function toggleFoodAvailability(foodId) {
  try {
    const res = await fetch(`/admin/food/${foodId}/toggle-availability`, {
      method: 'POST'
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      setTimeout(() => window.location.reload(), 600);
    } else {
      showToast(data.error || 'Failed to update availability', 'error');
    }
  } catch (err) {
    showToast('Network error updating food availability', 'error');
  }
}
