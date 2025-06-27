// statement.js
let allOutfits = [];
let currentView = 'all'; 

// APIs js
const LOCAL_API_URL = 'http://localhost:3000/outfits';
const EXTERNAL_API_URL = 'https://fakestoreapi.com/products/?limit=6';

async function fetchOutfits() {
  const response = await fetch(LOCAL_API_URL);
  if (!response.ok) throw new Error('Failed to fetch outfits');
  const data = await response.json();
  console.log("Fetched outfits:", data);
 
  return data.map(o => ({ ...o, liked: o.liked === true || o.liked === 'true', isBlurred: false }));
}

async function patchOutfitLike(outfitId, liked) {
  
  return await fetch(`${LOCAL_API_URL}/${outfitId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liked: liked })
  });
}

async function fetchComplementaryItems() {
  const response = await fetch(EXTERNAL_API_URL);
  if (!response.ok) throw new Error('Failed to fetch products');
  const data = await response.json();
  console.log("Fetched complementary items:", data);
  return data;
}

// DOM js Utilities
function resetSearchAndFilters() {
  const searchInput = document.querySelector('#searchOutfits');
  const styleFilter = document.querySelector('#styleFilter');
  if (searchInput) searchInput.value = '';
  if (styleFilter) styleFilter.value = '';
}

function showToast(message, duration = 3000) {
  const toast = document.querySelector('#toastNotification');
  if (!toast) {
      console.warn("Toast notification element not found.");
      return;
  }

  if (toast.showTimeout) {
      clearTimeout(toast.showTimeout);
  }
  if (toast.hideTimeout) {
      clearTimeout(toast.hideTimeout);
  }
  if (toast.hideCompleteTimeout) { 
      clearTimeout(toast.hideCompleteTimeout);
  }

  toast.textContent = message;

  toast.classList.remove('hidden');

  toast.showTimeout = setTimeout(() => {
      toast.classList.add('show'); 
  }, 10); 

 
  toast.hideTimeout = setTimeout(() => {
      toast.classList.remove('show');

      toast.hideCompleteTimeout = setTimeout(() => {
          toast.classList.add('hidden'); 
      }, 300); 
  }, duration);
}

function updateFavoritesCount() {
  const count = allOutfits.filter(o => o.liked).length;
  const favoritesCountElement = document.querySelector('#favoritesCount');
  if (favoritesCountElement) {
    favoritesCountElement.textContent = count;
  }
}

function toggleTheme() {
  const darkIcon = document.querySelector('#theme-toggle-dark-icon');
  const lightIcon = document.querySelector('#theme-toggle-light-icon');
  const root = document.documentElement;
  const isDark = root.classList.toggle('dark');

  localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
  if (darkIcon && lightIcon) {
    darkIcon.classList.toggle('hidden', isDark);
    lightIcon.classList.toggle('hidden', !isDark);
  }
}

function toggleMenu() {
  const menuLinks = document.querySelector('.menu-links');
  const hamburgerIcon = document.querySelector('.hamburger-icon');
  if (menuLinks && hamburgerIcon) {
    menuLinks.classList.toggle('open');
    hamburgerIcon.classList.toggle('open');
  }
}

function createOutfitCard(item) {
  const card = document.createElement('div');
  const heartSrc = item.liked ? './Icons/heart-filled.png' : './Icons/heart.png';

  card.className = `card outfit-card${item.isBlurred ? ' blurred' : ''}`;
  card.dataset.id = item.id;

  card.innerHTML = `
    <div class="card-image-wrapper">
      <img src="${item.avatar || 'https://placehold.co/400x300'}" alt="${item.name}" class="card-image">
      <button class="like-button" data-id="${item.id}">
        <img src="${heartSrc}" alt="like" class="heart-icon" />
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

function setupLikeButtonEvent(button) {
    if (button.dataset.listenerAttached) {
        return; 
    }
    button.addEventListener('click', async (e) => {
        e.stopPropagation(); 
        const outfitId = parseInt(button.getAttribute('data-id'));
        await toggleLike(outfitId); 
    });
    button.dataset.listenerAttached = 'true'; 
}

function setupOutfitCardClickEvent(card) {
    if (card.dataset.cardListenerAttached) {
        return; 
    }
    card.addEventListener('click', e => {
         if (!e.target.closest('.like-button')) {
            toggleBlur(card.dataset.id);
        }
    });
    card.dataset.cardListenerAttached = 'true'; 
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

    if (isOutfit) {
      const likeButton = card.querySelector('.like-button');
      if (likeButton) setupLikeButtonEvent(likeButton);
      setupOutfitCardClickEvent(card); 
    }
  }
}

function toggleBlur(id) {
  const outfit = allOutfits.find(o => o.id == id);
  if (!outfit) return;

  const card = document.querySelector(`.outfit-card[data-id="${id}"]`);
  if (!card) return;

  outfit.isBlurred = !outfit.isBlurred; 
  card.classList.toggle('blurred'); 

  const complementaryItemsSection = document.querySelector('#complementaryItemsSection');
  if (complementaryItemsSection) {
    if (outfit.isBlurred) {
      complementaryItemsSection.classList.remove('hidden'); 
      loadComplementaryItems();
    } else {
      complementaryItemsSection.classList.add('hidden'); 
      document.querySelector('#complementaryItemsContainer').innerHTML = ''; 
    }
  }
}

async function toggleLike(id) {
  const outfit = allOutfits.find(o => o.id == id);
  if (!outfit) return;

  const originalLikedState = outfit.liked; 
  outfit.liked = !outfit.liked; 
  updateFavoritesCount();

  const heartIconInMainGrid = document.querySelector(`#outfitsContainer .like-button[data-id="${id}"] .heart-icon`);
  if (heartIconInMainGrid) {
    heartIconInMainGrid.src = outfit.liked ? './Icons/heart-filled.png' : './Icons/heart.png';
    heartIconInMainGrid.closest('.like-button').classList.toggle('liked', outfit.liked);
  }

  try {
    await patchOutfitLike(id, outfit.liked); 
    showToast(outfit.liked ? 'Try it out yourself!' : 'Removed from favorites');

    // DOM manipulation for Favorites Container 
    const favoritesContainer = document.querySelector('#favoritesContainer');
    if (favoritesContainer) {
      const outfitCardInFavorites = favoritesContainer.querySelector(`.outfit-card[data-id="${id}"]`);

      if (outfit.liked) {
        
        if (!outfitCardInFavorites) {
          const newCardForFavs = createOutfitCard(outfit);
          favoritesContainer.appendChild(newCardForFavs);
          
          const newLikeButton = newCardForFavs.querySelector('.like-button');
          if (newLikeButton) setupLikeButtonEvent(newLikeButton);
          setupOutfitCardClickEvent(newCardForFavs);
        }
      } else { 
        if (outfitCardInFavorites) {
          outfitCardInFavorites.remove();
        }
      }
      
      const favCount = allOutfits.filter(o => o.liked).length;
      document.querySelector('#noFavoritesMessage')?.classList.toggle('hidden', favCount > 0);
    }


  } catch (error) {
    console.error("Failed to update like status:", error);
    outfit.liked = originalLikedState; 
    updateFavoritesCount(); 

    showToast('Failed to update like status');
   
    if (heartIconInMainGrid) {
      heartIconInMainGrid.src = outfit.liked ? './Icons/heart-filled.png' : './Icons/heart.png';
      heartIconInMainGrid.closest('.like-button').classList.toggle('liked', outfit.liked);
    }
  }
}

function populateStyleFilter(outfits) {
  const filter = document.querySelector('#styleFilter');
  if (!filter) return;
  filter.innerHTML = '<option value="">Filter by Style Category</option>';
  [...new Set(outfits.map(o => o.style))].sort().forEach(style => {
    const option = document.createElement('option');
    option.value = style;
    option.textContent = style;
    filter.appendChild(option);
  });
}

function filterAndRenderOutfits() {
  const term = document.querySelector('#searchOutfits')?.value.toLowerCase() || '';
  const selectedStyle = document.querySelector('#styleFilter')?.value || '';
  
  let outfitsToFilter = allOutfits;
  if (currentView === 'favorites') {
      outfitsToFilter = allOutfits.filter(o => o.liked);
  }

  const filtered = outfitsToFilter.filter(o =>
    (o.name.toLowerCase().includes(term) || (o.description && o.description.toLowerCase().includes(term))) &&
    (!selectedStyle || o.style === selectedStyle)
  );

  const targetContainer = currentView === 'all' ? document.querySelector('#outfitsContainer') : document.querySelector('#favoritesContainer');
  if (targetContainer) {
      renderCards(filtered, targetContainer, true); 
      if (currentView === 'favorites') {
        document.querySelector('#noFavoritesMessage')?.classList.toggle('hidden', filtered.length > 0);
      }
  }
}

function renderFavoritesView() {
  currentView = 'favorites'; 
  const outfitsMainSection = document.querySelector('#outfitsMainSection'); 
  const favoritesSection = document.querySelector('#favoritesSection');
  const complementaryItemsSection = document.querySelector('#complementaryItemsSection');

  
  if (outfitsMainSection) outfitsMainSection.classList.add('hidden');
  if (complementaryItemsSection) complementaryItemsSection.classList.add('hidden'); 
  if (favoritesSection) favoritesSection.classList.remove('hidden');

  
  filterAndRenderOutfits();
  resetSearchAndFilters(); 
}

function renderAllOutfitsView() {
    currentView = 'all'; 
    const outfitsMainSection = document.querySelector('#outfitsMainSection');
    const favoritesSection = document.querySelector('#favoritesSection');
    const complementaryItemsSection = document.querySelector('#complementaryItemsSection'); 

    
    if (outfitsMainSection) outfitsMainSection.classList.remove('hidden');
    if (favoritesSection) favoritesSection.classList.add('hidden');
    if (complementaryItemsSection) complementaryItemsSection.classList.add('hidden');
    
    filterAndRenderOutfits(); 
    resetSearchAndFilters(); 
}

async function loadComplementaryItems() {
  document.querySelector('#loadingComplementaryItems')?.classList.remove('hidden');
  document.querySelector('#complementaryItemsError')?.classList.add('hidden');
  document.querySelector('#complementaryItemsContainer').innerHTML = '';

  try {
    const items = await fetchComplementaryItems();
    renderCards(items, document.querySelector('#complementaryItemsContainer'), false);
  } catch (err) {
    console.error("Error loading complementary items:", err);
    document.querySelector('#complementaryItemsError')?.classList.remove('hidden');
    const p = document.createElement('p');
    p.textContent = 'Could not load suggested items. Please try again.';
    p.style.textAlign = 'center';
    p.style.color = 'red';
    document.querySelector('#complementaryItemsError')?.appendChild(p);
  } finally {
    document.querySelector('#loadingComplementaryItems')?.classList.add('hidden');
  }
}

async function initializeApp() {
  document.querySelector('#loadingIndicator')?.classList.remove('hidden');
  document.querySelector('#errorMessage')?.classList.add('hidden');

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('color-theme');
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }

  try {
    allOutfits = await fetchOutfits();
    populateStyleFilter(allOutfits);

    const outfitsContainer = document.querySelector('#outfitsContainer');
    if (outfitsContainer) {
        renderCards(allOutfits, outfitsContainer); 
    }

    const favoritesContainer = document.querySelector('#favoritesContainer');
    if (favoritesContainer) {
        const initialFavorites = allOutfits.filter(o => o.liked);
        initialFavorites.forEach(item => {
            const card = createOutfitCard(item);
            favoritesContainer.appendChild(card);
            
            const likeButton = card.querySelector('.like-button');
            if (likeButton) setupLikeButtonEvent(likeButton);
            setupOutfitCardClickEvent(card);
        });
        document.querySelector('#noFavoritesMessage')?.classList.toggle('hidden', initialFavorites.length > 0);
    }
    
    document.querySelector('#outfitsMainSection')?.classList.remove('hidden'); 
    document.querySelector('#complementaryItemsSection')?.classList.add('hidden');
    document.querySelector('#favoritesSection')?.classList.add('hidden'); 
    currentView = 'all';

    updateFavoritesCount(); 

  } catch (err) {
    console.error("Initialization error:", err);
    document.querySelector('#errorMessage')?.classList.remove('hidden');
    document.querySelector('#errorMessage').innerHTML = `
      <p style="text-align: center; color: red;">
        Oops! Could not load curated looks. Ensure <code>json-server</code> is running:<br>
        <code style="display:block; background:#f0f0f0; padding:4px; border-radius:4px;">json-server --watch db.json --port 3000</code>
      </p>`;
  } finally {
    document.querySelector('#loadingIndicator')?.classList.add('hidden');
  }
}

// Global Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();

  // Navigation and Filter Event Listeners
  document.querySelector('#darkModeToggle')?.addEventListener('click', toggleTheme);
  document.querySelector('#searchOutfits')?.addEventListener('input', filterAndRenderOutfits);
  document.querySelector('#styleFilter')?.addEventListener('change', filterAndRenderOutfits);
  
  // View Favorites Button
  document.querySelector('#viewFavoritesBtn')?.addEventListener('click', () => {
    renderFavoritesView(); 
    const favoritesSection = document.querySelector('#favoritesSection');
    if (favoritesSection) {
      favoritesSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  document.querySelector('#backToAllLooksBtn')?.addEventListener('click', () => {
      renderAllOutfitsView(); 
  });

  document.querySelector('#discoverItemsBtn')?.addEventListener('click', loadComplementaryItems);

  // Newsletter Form Event Listener
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
  } else {
    console.error("Newsletter form elements not found on DOMContentLoaded.");
  }
});