// statement.js
let allOutfits = [];
let currentView = 'all';

// APIs js
const LOCAL_API_URL = 'http://localhost:3000/outfits';
const EXTERNAL_API_URL = 'https://fakestoreapi.com/products?limit=6';

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
    body: JSON.stringify({ liked: liked }) // Send as boolean true/false
  });
}

async function fetchComplementaryItems() {
  try {
    const response = await fetch(EXTERNAL_API_URL);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Fetched complementary items:", data);
    return data;
  } catch (error) {
    console.error("Error fetching complementary items:", error);
    throw error; // Re-throw to be caught by loadComplementaryItems
  }
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
  if (darkIcon) darkIcon.classList.toggle('hidden', isDark);
  if (lightIcon) lightIcon.classList.toggle('hidden', !isDark);
}

function toggleMenu() {
  const menuLinks = document.querySelector('.menu-links');
  const hamburgerIcon = document.querySelector('.hamburger-icon');
  if (menuLinks) menuLinks.classList.toggle('open');
  if (hamburgerIcon) hamburgerIcon.classList.toggle('open');
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
  outfit.isBlurred = !outfit.isBlurred;
  const card = document.querySelector(`.outfit-card[data-id="${id}"]`);
  if (card) card.classList.toggle('blurred');

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
  }

  try {
    await patchOutfitLike(id, outfit.liked);
    showToast(outfit.liked ? 'Try it out yourself!' : 'Removed from favorites');

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

// *** MODIFIED FUNCTION: renderFavoritesView for section switching and logging ***
function renderFavoritesView() {
  console.log("renderFavoritesView called");
  currentView = 'favorites';
  const outfitsMainSection = document.querySelector('#outfitsMainSection');
  const favoritesSection = document.querySelector('#favoritesSection');
  const complementaryItemsSection = document.querySelector('#complementaryItemsSection');

  console.log("Sections found (renderFavoritesView):", {
    outfitsMainSection: !!outfitsMainSection, // true if found, false if null
    favoritesSection: !!favoritesSection,
    complementaryItemsSection: !!complementaryItemsSection
  });

  if (outfitsMainSection) outfitsMainSection.classList.add('hidden');
  if (complementaryItemsSection) complementaryItemsSection.classList.add('hidden');
  if (favoritesSection) favoritesSection.classList.remove('hidden');
  
  console.log("Classes applied (renderFavoritesView):", {
      outfitsMainSectionHidden: outfitsMainSection?.classList.contains('hidden'),
      favoritesSectionHidden: favoritesSection?.classList.contains('hidden'), // Should be false
      complementaryItemsSectionHidden: complementaryItemsSection?.classList.contains('hidden')
  });

  filterAndRenderOutfits();
  resetSearchAndFilters();
}

// *** MODIFIED FUNCTION: renderAllOutfitsView for section switching and logging ***
function renderAllOutfitsView() {
    console.log("renderAllOutfitsView called");
    currentView = 'all';
    const outfitsMainSection = document.querySelector('#outfitsMainSection');
    const favoritesSection = document.querySelector('#favoritesSection');
    const complementaryItemsSection = document.querySelector('#complementaryItemsSection');

    console.log("Sections found (renderAllOutfitsView):", {
      outfitsMainSection: !!outfitsMainSection,
      favoritesSection: !!favoritesSection,
      complementaryItemsSection: !!complementaryItemsSection
    });

    if (outfitsMainSection) outfitsMainSection.classList.remove('hidden');
    if (favoritesSection) favoritesSection.classList.add('hidden');
    if (complementaryItemsSection) complementaryItemsSection.classList.add('hidden');

    console.log("Classes applied (renderAllOutfitsView):", {
        outfitsMainSectionHidden: outfitsMainSection?.classList.contains('hidden'), // Should be false
        favoritesSectionHidden: favoritesSection?.classList.contains('hidden'),
        complementaryItemsSectionHidden: complementaryItemsSection?.classList.contains('hidden')
    });

    resetSearchAndFilters();
    filterAndRenderOutfits();
}

async function loadComplementaryItems() {
  const loadingIndicator = document.querySelector('#loadingComplementaryItems');
  const errorContainer = document.querySelector('#complementaryItemsError');
  const itemsContainer = document.querySelector('#complementaryItemsContainer');

  if (loadingIndicator) loadingIndicator.classList.remove('hidden');
  if (errorContainer) errorContainer.classList.add('hidden');
  if (itemsContainer) itemsContainer.innerHTML = '';

  try {
    const items = await fetchComplementaryItems();
    if (itemsContainer) renderCards(items, itemsContainer, false);
  } catch (err) {
    console.error("Error loading complementary items:", err);
    if (errorContainer) {
        errorContainer.classList.remove('hidden');
        errorContainer.innerHTML = `
            <p style="text-align: center; color: red;">
                Could not load suggested items. Please try again.
            </p>
        `;
    }
  } finally {
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
  }
}

async function initializeApp() {
  const loadingIndicator = document.querySelector('#loadingIndicator');
  const errorMessage = document.querySelector('#errorMessage');
  const outfitsMainSection = document.querySelector('#outfitsMainSection');
  const complementaryItemsSection = document.querySelector('#complementaryItemsSection');
  const favoritesSection = document.querySelector('#favoritesSection');
  const outfitsContainer = document.querySelector('#outfitsContainer');
  const favoritesContainer = document.querySelector('#favoritesContainer');
  const noFavoritesMessage = document.querySelector('#noFavoritesMessage');

  if (loadingIndicator) loadingIndicator.classList.remove('hidden');
  if (errorMessage) errorMessage.classList.add('hidden');

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('color-theme');
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }

  try {
    allOutfits = await fetchOutfits();
    populateStyleFilter(allOutfits);

    if (outfitsContainer) {
        renderCards(allOutfits, outfitsContainer);
    }

    if (favoritesContainer) {
        const initialFavorites = allOutfits.filter(o => o.liked);
        renderCards(initialFavorites, favoritesContainer, true);
        if (noFavoritesMessage) noFavoritesMessage.classList.toggle('hidden', initialFavorites.length > 0);
    }
    
    // Ensure correct initial view is shown (All Looks)
    if (outfitsMainSection) outfitsMainSection.classList.remove('hidden');
    if (complementaryItemsSection) complementaryItemsSection.classList.add('hidden');
    if (favoritesSection) favoritesSection.classList.add('hidden');
    currentView = 'all';

    updateFavoritesCount();

  } catch (err) {
    console.error("Initialization error:", err);
    if (errorMessage) {
      errorMessage.classList.remove('hidden');
      errorMessage.innerHTML = `
        <p style="text-align: center; color: red;">
          Oops! Could not load curated looks. Ensure <code>json-server</code> is running:<br>
          <code style="display:block; background:#f0f0f0; padding:4px; border-radius:4px;">json-server --watch db.json --port 3000</code>
        </p>`;
    }
  } finally {
    if (loadingIndicator) loadingIndicator.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();

  document.querySelector('#darkModeToggle')?.addEventListener('click', toggleTheme);
  document.querySelector('#searchOutfits')?.addEventListener('input', filterAndRenderOutfits);
  document.querySelector('#styleFilter')?.addEventListener('change', filterAndRenderOutfits);
  
  const viewFavoritesBtn = document.querySelector('#viewFavoritesBtn');
  const backToAllLooksBtn = document.querySelector('#backToAllLooksBtn');

  // Log to check if buttons are found in the DOM
  console.log("Buttons found on DOMContentLoaded:", {
      viewFavoritesBtn: !!viewFavoritesBtn,
      backToAllLooksBtn: !!backToAllLooksBtn
  });

  if (viewFavoritesBtn) {
    viewFavoritesBtn.addEventListener('click', () => {
      console.log("#viewFavoritesBtn clicked!");
      renderFavoritesView();
      const favoritesSection = document.querySelector('#favoritesSection');
      if (favoritesSection) {
        favoritesSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  } else {
    console.warn("Element with ID '#viewFavoritesBtn' not found!");
  }

  if (backToAllLooksBtn) {
    backToAllLooksBtn.addEventListener('click', () => {
        console.log("#backToAllLooksBtn clicked!");
        renderAllOutfitsView();
    });
  } else {
    console.warn("Element with ID '#backToAllLooksBtn' not found!");
  }

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

  document.querySelector('#discoverItemsBtn')?.addEventListener('click', loadComplementaryItems);
});