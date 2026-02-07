import { supabase } from "./admin/supabaseClient.js";

const BRANDS = [
  { id: "dce9420f-a42c-4732-a3c6-577ca05c0c91", target: "libertyProducts" },
  { id: "088b3745-49c1-4758-94ee-89620865a9d2", target: "woodlandProducts" },
  { id: "6e499e55-a97e-4904-a2a3-328f83e6155d", target: "pierreCardinProducts" },
  { id: "c292b420-168e-468f-a6f2-21d57e5d0f3a", target: "redTapeProducts" },
  { id: "7baeefbc-deb0-4fc4-92f5-189fa87af30a", target: "medifeetProducts" }
];

document.addEventListener("DOMContentLoaded", () => {
  BRANDS.forEach(b => loadBrand(b.id, b.target));
  updateCartCount();
});

async function loadBrand(brandId, targetId) {
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      price,
      short_description
    `)
    .eq("brand_id", brandId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  const container = document.getElementById(targetId);
  if (!container) return;
  container.innerHTML = "";

  products.forEach(p => {
    container.insertAdjacentHTML(
      "beforeend",
      `
      <div class="product-card" data-slug="${p.slug}">
        <img src="assets/images/placeholder.png" alt="${p.name}">
        <h4>${p.name}</h4>
        <p class="desc">${p.short_description || ""}</p>
        <div class="card-footer">
          <span class="price">₹${p.price}</span>
          <button class="add-btn"
            data-id="${p.id}"
            data-name="${p.name}"
            data-price="${p.price}">
            Add to Cart
          </button>
        </div>
      </div>
      `
    );
  });

  container.querySelectorAll(".product-card").forEach(card => {
    card.onclick = () => {
      location.href = `products/product.html?slug=${card.dataset.slug}`;
    };
  });

  container.querySelectorAll(".add-btn").forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      addToCart(btn.dataset.id, btn.dataset.name, +btn.dataset.price);
    };
  });
}

/* CART */
function addToCart(id, name, price) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const found = cart.find(i => i.id === id);

  if (found) found.qty++;
  else cart.push({ id, name, price, qty: 1 });

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const el = document.getElementById("cartCount");
  if (el) el.textContent = cart.reduce((s, i) => s + i.qty, 0);
}
