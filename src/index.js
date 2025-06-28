let allOutfits = [];
let currentView = 'all';

const LOCAL_API_URL = 'http://localhost:3000/outfits';
const EXTERNAL_API_URL = 'https://fakestoreapi.com/products?limit=6';

//fetch outfits from local JSON server
async function fetchOutfits() {
  const response = await fetch(LOCAL_API_URL);
  if (!response.ok) throw new Error('Failed to fetch outfits');
  const data = await response.json();
  console.log("Fetched outfits:", data);
  return data.map(o => ({ ...o, liked: o.liked === true || o.liked === 'true', isBlurred: false }));
}

//update liked status in server
async function patchOutfitLike(outfitId, liked) {
  return await fetch(`${LOCAL_API_URL}/${outfitId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liked })
  });
}

//fetch complementary items from external API
async function fetchComplementaryItems() {
  const response = await fetch(EXTERNAL_API_URL);
  if (!response.ok) throw new Error('Failed to fetch products');
  const data = await response.json();
  console.log("Fetched complementary items:", data);
  return data;
}

// utilities
function resetSearchAndFilters() {
  document.querySelector('#searchOutfits').value = '';
  document.querySelector('#styleFilter').value = '';
}

function showToast(message, duration = 3000) {
  const toast = document.querySelector('#toastNotification');
  if (!toast) return;
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
  const root = document.documentElement;
  const isDark = root.classList.toggle('dark');
  localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
  document.querySelector('#theme-toggle-dark-icon').classList.toggle('hidden', isDark);
  document.querySelector('#theme-toggle-light-icon').classList.toggle('hidden', !isDark);
}

function createOutfitCard(item) {
  const card = document.createElement('div');
  card.className = `card outfit-card${item.isBlurred ? ' blurred' : ''}`;
  card.dataset.id = item.id;

  card.innerHTML = `
    <div class="card-image-wrapper">
      <img src="${item.avatar || 'https://placehold.co/400x300'}" alt="${item.name}" class="card-image">
      <button class="like-button" data-id="${item.id}">
        <img src="${item.liked ? './Icons/heart-filled.png' : './Icons/heart.png'}" alt="like" class="heart-icon" />
      </button>
      <div class="description-overlay">
        <p>${item.description || 'No description available.'}</p>
      </div>
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

// Render cards (outfits or products)
function renderCards(items, container, isOutfit = true) {
  container.innerHTML = '';
  if (!items.length) {
    container.innerHTML = `<p style="text-align:center; color:gray;">No items found matching your criteria.</p>`;
    return;
  }

  items.forEach(item => {
    const card = isOutfit ? createOutfitCard(item) : createProductCard(item);
    container.appendChild(card);
  });

  if (isOutfit) setupLikeButtons(container);
}

// Like button setup
function setupLikeButtons(scope = document) {
  const likeButtons = scope.querySelectorAll('.like-button');
  likeButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const outfitId = parseInt(button.getAttribute('data-id'));
      await toggleLike(outfitId);
    });
  });
}

function toggleBlur(id) {
  const outfit = allOutfits.find(o => o.id == id);
  if (!outfit) return;
  outfit.isBlurred = !outfit.isBlurred;
  document.querySelector(`.outfit-card[data-id="${id}"]`)?.classList.toggle('blurred');

  const complementarySection = document.querySelector('#complementaryItemsSection');
  if (complementarySection) {
    if (outfit.isBlurred) {
      complementarySection.classList.remove('hidden');
      loadComplementaryItems();
    } else {
      complementarySection.classList.add('hidden');
      document.querySelector('#complementaryItemsContainer').innerHTML = '';
    }
  }
}

async function toggleLike(id) {
  const outfit = allOutfits.find(o => o.id == id);
  if (!outfit) return;

  outfit.liked = !outfit.liked;
  updateFavoritesCount();

  const heartIcon = document.querySelector(`.outfit-card[data-id="${id}"] .heart-icon`);
  if (heartIcon) heartIcon.src = outfit.liked ? './Icons/heart-filled.png' : './Icons/heart.png';

  try {
    await patchOutfitLike(id, outfit.liked);
    showToast(outfit.liked ? 'Try it out yourself!' : 'Removed from favorites');
    const favoritesContainer = document.querySelector('#favoritesContainer');
    const noFavoritesMessage = document.querySelector('#noFavoritesMessage');

    if (favoritesContainer) {
      if (outfit.liked) {
        // Add to favorites if not already there
        let cardInFavorites = favoritesContainer.querySelector(`.outfit-card[data-id="${id}"]`);
        if (!cardInFavorites) {
          const newCard = createOutfitCard(outfit);
          favoritesContainer.appendChild(newCard);
          setupLikeButtons(newCard);
        }

        // Auto-scroll to favorites section to show newly added outfit
        favoritesContainer.scrollIntoView({ behavior: 'smooth' });

        if (noFavoritesMessage) noFavoritesMessage.classList.add('hidden');
      } else {
        // Remove from favorites if unliked
        const cardInFavorites = favoritesContainer.querySelector(`.outfit-card[data-id="${id}"]`);
        if (cardInFavorites) cardInFavorites.remove();

        const remainingFavorites = allOutfits.filter(o => o.liked);
        if (noFavoritesMessage) noFavoritesMessage.classList.toggle('hidden', remainingFavorites.length > 0);
      }
    }
  } catch {
    outfit.liked = !outfit.liked; // rollback
    updateFavoritesCount();
    showToast('Failed to update like status');
  }
}

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
  const container = currentView === 'all' ? document.querySelector('#outfitsContainer') : document.querySelector('#favoritesContainer');
  const outfits = currentView === 'all' ? allOutfits : allOutfits.filter(o => o.liked);

  const filtered = outfits.filter(o =>
    (o.name.toLowerCase().includes(term) || o.description.toLowerCase().includes(term)) &&
    (!selectedStyle || o.style === selectedStyle)
  );

  renderCards(filtered, container, true);
}

async function loadComplementaryItems() {
  const container = document.querySelector('#complementaryItemsContainer');
  container.innerHTML = '<p>Loading...</p>';
  try {
    const items = await fetchComplementaryItems();
    renderCards(items, container, false);
  } catch {
    container.innerHTML = '<p style="color:red;">Failed to load items.</p>';
  }
}

async function initializeApp() {
  document.querySelector('#loadingIndicator').classList.remove('hidden');

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('color-theme');
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }

  try {
    allOutfits = await fetchOutfits();
    populateStyleFilter(allOutfits);
    renderCards(allOutfits, document.querySelector('#outfitsContainer'), true);
    updateFavoritesCount();
  } catch {
    document.querySelector('#errorMessage').classList.remove('hidden');
  } finally {
    document.querySelector('#loadingIndicator').classList.add('hidden');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();

  document.querySelector('#darkModeToggle')?.addEventListener('click', toggleTheme);
  document.querySelector('#searchOutfits')?.addEventListener('input', filterAndRenderOutfits);
  document.querySelector('#styleFilter')?.addEventListener('change', filterAndRenderOutfits);
  document.querySelector('#discoverItemsBtn')?.addEventListener('click', loadComplementaryItems);

  document.querySelector('#viewFavoritesBtn')?.addEventListener('click', () => {
    currentView = 'favorites';
    filterAndRenderOutfits();
    document.querySelector('#favoritesSection').classList.remove('hidden');
    document.querySelector('#outfitsMainSection').classList.add('hidden');
  });

  document.querySelector('#backToAllLooksBtn')?.addEventListener('click', () => {
    currentView = 'all';
    filterAndRenderOutfits();
    document.querySelector('#favoritesSection').classList.add('hidden');
    document.querySelector('#outfitsMainSection').classList.remove('hidden');
  });

  document.querySelector('#newsletter')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.querySelector('#newsletterEmail').value.trim();
    const message = document.querySelector('#newsletterMessage');
    if (email && email.includes('@')) {
      message.textContent = `Thank you for subscribing, ${email}!`;
      message.style.color = '#d4edda';
    } else {
      message.textContent = 'Please enter a valid email address.';
      message.style.color = '#f8d7da';
    }
    message.classList.remove('hidden');
    setTimeout(() => message.classList.add('hidden'), 5000);
  });
});
