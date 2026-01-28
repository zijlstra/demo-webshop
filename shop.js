const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏", category: "Fruits" },
  banana: { name: "Banana", emoji: "🍌", category: "Fruits" },
  lemon: { name: "Lemon", emoji: "🍋", category: "Fruits" },
  tomato: { name: "Tomato", emoji: "🍅", category: "Vegetables" },
  cucumber: { name: "Cucumber", emoji: "🥒", category: "Vegetables" },
};

function getBasket() {
  try {
    const basket = localStorage.getItem("basket");
    if (!basket) return [];
    const parsed = JSON.parse(basket);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Error parsing basket from localStorage:", error);
    return [];
  }
}

function getCurrentCategory() {
  try {
    const category = localStorage.getItem("currentCategory");
    return category || "Fruits";
  } catch (error) {
    console.warn("Error getting category:", error);
    return "Fruits";
  }
}

function setCurrentCategory(category) {
  localStorage.setItem("currentCategory", category);
}

function getProductsByCategory(category) {
  return Object.entries(PRODUCTS)
    .filter(([_, product]) => product.category === category)
    .reduce((acc, [key, product]) => {
      acc[key] = product;
      return acc;
    }, {});
}

function getAllCategories() {
  const categories = new Set(Object.values(PRODUCTS).map(p => p.category));
  return Array.from(categories);
}

function addToBasket(product) {
  const basket = getBasket();
  basket.push(product);
  localStorage.setItem("basket", JSON.stringify(basket));
}

function clearBasket() {
  localStorage.removeItem("basket");
}

function getSmoothie() {
  try {
    const smoothie = localStorage.getItem("smoothie");
    return smoothie === "true";
  } catch (error) {
    console.warn("Error getting smoothie preference:", error);
    return false;
  }
}

function setSmoothie(enabled) {
  localStorage.setItem("smoothie", enabled ? "true" : "false");
}

function computeSmoothieFlavor() {
  const basket = getBasket();
  if (basket.length === 0) return null;
  const fruits = basket.map(productKey => PRODUCTS[productKey]?.name).filter(Boolean);
  const uniqueFruits = [...new Set(fruits)];
  if (uniqueFruits.length === 0) return null;
  if (uniqueFruits.length === 1) return uniqueFruits[0];
  return "Blended: " + uniqueFruits.join(" + ");
}

function renderBasket() {
  const basket = getBasket();
  const basketList = document.getElementById("basketList");
  const cartButtonsRow = document.querySelector(".cart-buttons-row");
  if (!basketList) return;
  basketList.innerHTML = "";
  if (basket.length === 0) {
    basketList.innerHTML = "<li>No products in basket.</li>";
    if (cartButtonsRow) cartButtonsRow.style.display = "none";
    return;
  }
  basket.forEach((product) => {
    const item = PRODUCTS[product];
    if (item) {
      const li = document.createElement("li");
      li.innerHTML = `<span class='basket-emoji'>${item.emoji}</span> <span>${item.name}</span>`;
      basketList.appendChild(li);
    }
  });
  renderSmoothieOption();
  if (cartButtonsRow) cartButtonsRow.style.display = "flex";
}

function renderSmoothieOption() {
  const basket = getBasket();
  let smoothieContainer = document.getElementById("smoothieContainer");
  if (!smoothieContainer) return;
  
  if (basket.length === 0) {
    smoothieContainer.style.display = "none";
    return;
  }
  
  smoothieContainer.style.display = "block";
  const smoothieCheckbox = document.getElementById("smoothieCheckbox");
  const smoothieFlavorDiv = document.getElementById("smoothieFlavor");
  
  if (smoothieCheckbox) {
    smoothieCheckbox.checked = getSmoothie();
  }
  
  if (smoothieCheckbox?.checked && smoothieFlavorDiv) {
    const flavor = computeSmoothieFlavor();
    if (flavor) {
      smoothieFlavorDiv.textContent = "🥤😊 Smoothie flavour: " + flavor;
      smoothieFlavorDiv.style.display = "block";
    } else {
      smoothieFlavorDiv.style.display = "none";
    }
  } else if (smoothieFlavorDiv) {
    smoothieFlavorDiv.style.display = "none";
  }
}

function renderBasketIndicator() {
  const basket = getBasket();
  let indicator = document.querySelector(".basket-indicator");
  if (!indicator) {
    const basketLink = document.querySelector(".basket-link");
    if (!basketLink) return;
    indicator = document.createElement("span");
    indicator.className = "basket-indicator";
    basketLink.appendChild(indicator);
  }
  if (basket.length > 0) {
    indicator.textContent = basket.length;
    indicator.style.display = "flex";
  } else {
    indicator.style.display = "none";
  }
}

// Call this on page load and after basket changes
if (document.readyState !== "loading") {
  renderBasketIndicator();
} else {
  document.addEventListener("DOMContentLoaded", renderBasketIndicator);
}

// Patch basket functions to update indicator
const origAddToBasket = window.addToBasket;
window.addToBasket = function (product) {
  origAddToBasket(product);
  renderBasketIndicator();
  renderSmoothieOption();
};
const origClearBasket = window.clearBasket;
window.clearBasket = function () {
  origClearBasket();
  renderBasketIndicator();
  renderSmoothieOption();
};
