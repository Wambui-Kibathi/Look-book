let allOutfits = [];
let currentView = 'all';

// Local and External APIs
const LOCAL_API_URL = 'http://localhost:3000/outfits';
const EXTERNAL_API_URL = 'https://fakestoreapi.com/products?limit=6';

async function fetchOutfits() {
  const res = await fetch(LOCAL_API_URL);
  if (!res.ok) throw new Error('Failed to fetch outfits');
  const data = await res.json();
  console.log("Fetched outfits:", data);
  return data.map(o => ({ ...o, liked: o.liked === 'true', isBlurred: false }));
}

async function patchOutfitLike(outfitId, liked) {
  return await fetch(`${LOCAL_API_URL}/${outfitId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liked: liked.toString() })
  });
}

async function fetchComplementaryItems() {
  const res = await fetch(EXTERNAL_API_URL);
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  console.log("Fetched complementary items:", data);
  return data;
}

// DOM helpers
function resetSearchAndFilters() {
  document.querySelector('#searchOutfits').value = '';
  document.querySelector('#styleFilter').value = '';
}

function showToast(message, duration = 3000) {
  const toast = document.querySelector('#toastNotification');
  toast.textContent = message;
  toast.classList.remove('hidden', 'fade-out');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
  setTimeout(() => toast.classList.add('hidden'), duration + 300);
}

function updateFavoritesCount() {
  const count = allOutfits.filter(o => o.liked).length;
  document.querySelector('#favoritesCount').textContent = count;
}

function toggleTheme() {
  const darkIcon = document.querySelector('#theme-toggle-dark-icon');
  const lightIcon = document.querySelector('#theme-toggle-light-icon');
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
  darkIcon.classList.toggle('hidden', isDark);
  lightIcon.classList.toggle('hidden', !isDark);
}

function toggleMenu() {
  document.querySelector('.menu-links').classList.toggle('open');
  document.querySelector('.hamburger-icon').classList.toggle('open');
}

// Card Rendering
function createOutfitCard(item) {
  const card = document.createElement('div');
  card.className = `card outfit-card${item.isBlurred ? ' blurred' : ''}`;
  card.dataset.id = item.id;

  const heartSrc = item.liked ? './Icons/heart-filled.png' : './Icons/heart.png';

  card.innerHTML = `
    <div class="card-image-wrapper">
      <img src="${item.avatar || 'https://placehold.co/400x300'}" alt="${item.name}" class="card-image">
      <button class="like-button" data-id="${item.id}">
        <img src="${heartSrc}" alt="like" class="heart-icon" />
      </button>
      <div class="description-overlay"><p>${item.description || 'No description available.'}</p></div>
    </div>
    <h3 class="card-title">${item.name}</h3>
    <p class="card-style">Style: <span>${item.style}</span></p>
  `;
  return card;
}

function createProductCard(item) {
  const card = document.createElement('div');
  card.className = 'card product-card';
  card.innerHTML = `
    <img src="${item.image}" alt="${item.title}" class="product-image">
    <h3 class="product-title">${item.title}</h3>
    <p class="product-price">$${item.price?.toFixed(2) ?? 'N/A'}</p>
    <p class="product-category">Category: ${item.category ?? 'N/A'}</p>
  `;
  return card;
}

function renderCards(items, container, isOutfit = true) {
  container.innerHTML = '';
  if (!items.length) {
    const msg = document.createElement('p');
    msg.style.textAlign = 'center';
    msg.style.color = 'gray';
    msg.textContent = 'No items found matching your criteria.';
    container.appendChild(msg);
    return;
  }

  for (const item of items) {
    const card = isOutfit ? createOutfitCard(item) : createProductCard(item);
    container.appendChild(card);
  }

  if (isOutfit) setupLikeButtons(container);
}

function setupLikeButtons(scope = document) {
  scope.querySelectorAll('.like-button').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = parseInt(button.getAttribute('data-id'));
      await toggleLike(id);
    });
  });
}

function toggleBlur(id) {
  const outfit = allOutfits.find(o => o.id == id);
  if (!outfit) return;
  outfit.isBlurred = !outfit.isBlurred;
  document.querySelector(`.outfit-card[data-id="${id}"]`)?.classList.toggle('blurred');
}

async function toggleLike(id) {
  const outfit = allOutfits.find(o => o.id == id);
  if (!outfit) return;

  outfit.liked = !outfit.liked;
  updateFavoritesCount();

  try {
    await patchOutfitLike(id, outfit.liked);
    showToast(outfit.liked ? 'Try it out yourself!' : 'Removed from favorites');

    const heartIcon = document.querySelector(`.like-button[data-id="${id}"] .heart-icon`);
    if (heartIcon) heartIcon.src = outfit.liked ? './Icons/heart-filled.png' : './Icons/heart.png';

    renderFavorites();
  } catch {
    outfit.liked = !outfit.liked; 
    updateFavoritesCount();
    showToast('Failed to update like status');
  }
}

// Filters
function populateStyleFilter(outfits) {
  const filter = document.querySelector('#styleFilter');
  filter.innerHTML = '<option value="">Filter by Style Category</option>';
  [...new Set(outfits.map(o => o.style))].sort().forEach(style => {
    const option = document.createElement('option');
    option.value = style;
    option.textContent = style;
    filter.appendChild(option);
  });
}

function filterAndRenderOutfits() {
  const term = document.querySelector('#searchOutfits').value.toLowerCase();
  const selectedStyle = document.querySelector('#styleFilter').value;
  const outfits = currentView === 'all' ? allOutfits : allOutfits.filter(o => o.liked);

  const filtered = outfits.filter(o =>
    (o.name.toLowerCase().includes(term) || o.style.toLowerCase().includes(term)) &&
    (!selectedStyle || o.style === selectedStyle)
  );

  const container = currentView === 'all'
    ? document.querySelector('#outfitsContainer')
    : document.querySelector('#favoriteOutfitsContainer');

  renderCards(filtered, container);
}

// Favorites
function renderFavorites() {
  const favorites = allOutfits.filter(o => o.liked);
  const container = document.querySelector('#favoritesContainer');
  const noMsg = document.querySelector('#noFavoritesMessage');

  container.innerHTML = '';
  if (!favorites.length) {
    noMsg.classList.remove('hidden');
  } else {
    noMsg.classList.add('hidden');
    favorites.forEach(item => container.appendChild(createOutfitCard(item)));
  }

  setupLikeButtons(container);
}

// Complementary Items
async function loadComplementaryItems() {
  const loading = document.querySelector('#loadingComplementaryItems');
  const error = document.querySelector('#complementaryItemsError');
  const container = document.querySelector('#complementaryItemsContainer');

  loading.classList.remove('hidden');
  error.classList.add('hidden');
  container.innerHTML = '';

  try {
    const items = await fetchComplementaryItems();
    renderCards(items, container, false);
  } catch {
    error.classList.remove('hidden');
    error.innerHTML = '<p style="text-align:center; color:red;">Could not load suggested items.</p>';
  } finally {
    loading.classList.add('hidden');
  }
}

// Initialization
async function initializeApp() {
  document.querySelector('#loadingIndicator').classList.remove('hidden');
  document.querySelector('#errorMessage').classList.add('hidden');

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('color-theme');
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }

  try {
    allOutfits = await fetchOutfits();
    populateStyleFilter(allOutfits);
    renderCards(allOutfits, document.querySelector('#outfitsContainer'));
    renderFavorites();
    updateFavoritesCount();
  } catch {
    document.querySelector('#errorMessage').classList.remove('hidden');
    document.querySelector('#errorMessage').innerHTML = `
      <p style="text-align: center; color: red;">
        Oops! Could not load curated looks. Ensure <code>json-server</code> is running:<br>
        <code style="display:block; background:#f0f0f0; padding:4px; border-radius:4px;">json-server --watch db.json --port 3000</code>
      </p>`;
  } finally {
    document.querySelector('#loadingIndicator').classList.add('hidden');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();

  document.querySelector('#darkModeToggle')?.addEventListener('click', toggleTheme);
  document.querySelector('#searchOutfits')?.addEventListener('input', filterAndRenderOutfits);
  document.querySelector('#styleFilter')?.addEventListener('change', filterAndRenderOutfits);
  document.querySelector('#viewFavoritesBtn')?.addEventListener('click', () => {
    document.querySelector('#favoritesContainer').scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelector('#backToAllLooksBtn')?.addEventListener('click', () => {
    currentView = 'all';
    resetSearchAndFilters();
    filterAndRenderOutfits();
    document.querySelector('#outfitsContainer').scrollIntoView({behavior: 'smooth'});
  });

  document.querySelector('#discoverItemsBtn')?.addEventListener('click', loadComplementaryItems);

  const form = document.getElementById('newsletter');
  const emailInput = document.getElementById('newsletterEmail');
  const messageDisplay = document.getElementById('newsletterMessage');

  if (form && emailInput && messageDisplay) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (emailInput.checkValidity()) {
        messageDisplay.textContent = `Thank you for subscribing, ${email}!`;
        messageDisplay.style.color = '#d4edda';
        emailInput.value = '';
      } else {
        messageDisplay.textContent = 'Please enter a valid email address.';
        messageDisplay.style.color = '#f8d7da';
      }
      messageDisplay.classList.remove('hidden');
      setTimeout(() => messageDisplay.classList.add('hidden'), 5000);
    });
  }
});
