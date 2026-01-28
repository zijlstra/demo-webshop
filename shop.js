import React, { useState, useMemo } from 'react';

const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏" },
  banana: { name: "Banana", emoji: "🍌" },
  lemon: { name: "Lemon", emoji: "🍋" },
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

function addToBasket(product) {
  const basket = getBasket();
  basket.push(product);
  localStorage.setItem("basket", JSON.stringify(basket));
}

function clearBasket() {
  localStorage.removeItem("basket");
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
  if (cartButtonsRow) cartButtonsRow.style.display = "flex";
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
};
const origClearBasket = window.clearBasket;
window.clearBasket = function () {
  origClearBasket();
  renderBasketIndicator();
};

export default function Basket({ items = [] }) {
    const [smoothie, setSmoothie] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutResult, setCheckoutResult] = useState(null);

    const smoothieFlavor = useMemo(() => {
        if (!smoothie || !items || items.length === 0) return null;
        const fruits = items.map(i => (i.name || i.title || '').toLowerCase()).filter(Boolean);
        const unique = Array.from(new Set(fruits));
        if (unique.length === 0) return null;
        if (unique.length === 1) return unique[0][0].toUpperCase() + unique[0].slice(1);
        return 'Blended: ' + unique.map(s => s[0].toUpperCase() + s.slice(1)).join(' + ');
    }, [smoothie, items]);

    async function handleCheckout() {
        setCheckoutLoading(true);
        setCheckoutResult(null);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items, smoothie })
            });
            const data = await res.json();
            setCheckoutResult(data);
        } catch (err) {
            setCheckoutResult({ error: err.message || 'Checkout failed' });
        } finally {
            setCheckoutLoading(false);
        }
    }

    return (
        <div className="basket">
            {/* ...existing code listing items... */}
            <div style={{ marginTop: 12 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <input
                        type="checkbox"
                        checked={smoothie}
                        onChange={e => setSmoothie(e.target.checked)}
                    />
                    🥤 Blend selected fruits to a smoothie
                </label>
                {smoothieFlavor && (
                    <div style={{ marginTop: 6, fontStyle: 'italic' }}>
                        🥤 Smoothie flavour: {smoothieFlavor}
                    </div>
                )}
            </div>

            <div style={{ marginTop: 12 }}>
                <button onClick={handleCheckout} disabled={checkoutLoading}>
                    {checkoutLoading ? 'Processing...' : 'Checkout'}
                </button>
            </div>

            {checkoutResult && (
                <div style={{ marginTop: 10 }}>
                    {checkoutResult.error ? (
                        <span style={{ color: 'red' }}>{checkoutResult.error}</span>
                    ) : (
                        <div>
                            Order placed. {checkoutResult.smoothieFlavor ? `Smoothie: ${checkoutResult.smoothieFlavor}` : ''}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const express = require('express');
const router = express.Router();

function computeSmoothieFlavor(items = []) {
    const fruits = items.map(i => (i.name || i.title || '').toLowerCase()).filter(Boolean);
    const unique = Array.from(new Set(fruits));
    if (unique.length === 0) return null;
    if (unique.length === 1) return unique[0][0].toUpperCase() + unique[0].slice(1);
    return 'Blended: ' + unique.map(s => s[0].toUpperCase() + s.slice(1)).join(' + ');
}

router.post('/', (req, res) => {
    const { items = [], smoothie = false } = req.body || {};

    // ...existing code to create an order, validate payment etc...
    // For compatibility, continue existing order logic and attach smoothie info to response

    const order = {
        id: 'order-' + Date.now(),
        items,
        smoothie: !!smoothie
        // ...existing order fields...
    };

    const response = {
        success: true,
        orderId: order.id
        // ...existing response fields...
    };

    if (smoothie) {
        response.smoothieFlavor = computeSmoothieFlavor(items);
    }

    // ...existing code to persist order if needed...

    res.json(response);
});

module.exports = router;
