import { supabase } from "./admin/supabaseClient.js";

const BRAND_IDS = {
  liberty: "dce9420f-a42c-4732-a3c6-577ca05c0c91",
  woodland: "088b3745-49c1-4758-94ee-89620865a9d2",
  "pierre-cardin": "6e499e55-a97e-4904-a2a3-328f83e6155d",
  "red-tape": "c292b420-168e-468f-a6f2-21d57e5d0f3a",
  medifeet: "7baeefbc-deb0-4fc4-92f5-189fa87af30a"
};

document.addEventListener("DOMContentLoaded", () => {
  loadBrand(BRAND_IDS.liberty, "libertyProducts");
  loadBrand(BRAND_IDS.woodland, "woodlandProducts");
  initSliders();
  updateCartCount();
});

/* ================= LOAD BRAND ================= */
async function loadBrand(brandId, targetId) {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,price,short_description,image_gallery")
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

  data.forEach(p => {
    const img =
      Array.isArray(p.image_gallery) && p.image_gallery.length
        ? supabase.storage
            .from("products")
            .getPublicUrl(p.image_gallery[0]).data.publicUrl
        : "";

    container.insertAdjacentHTML(
      "beforeend",
      `
      <div class="product-card" data-slug="${p.slug}">
        <img src="${img}" alt="${p.name}">
        <h4>${p.name}</h4>
        <p class="desc">${p.short_description || ""}</p>
        <div class="card-footer">
          <span class="price">₹${p.price}</span>
          <button 
            class="add-btn"
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

  /* PRODUCT CLICK */
  container.querySelectorAll(".product-card").forEach(card => {
    card.onclick = () => {
      location.href = `products/product.html?slug=${card.dataset.slug}`;
    };
  });

  /* ADD TO CART (STOP CARD CLICK) */
  container.querySelectorAll(".add-btn").forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      addToCart(
        btn.dataset.id,
        btn.dataset.name,
        Number(btn.dataset.price)
      );
    };
  });
}

/* ================= CART ================= */
function addToCart(id, name, price) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({ id, name, price, qty: 1 });
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const el = document.getElementById("cartCount");
  if (el)
    el.textContent = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
}

/* ================= SLIDER ================= */
function initSliders() {
  document.querySelectorAll(".scroll-btn").forEach(btn => {
    btn.onclick = () => {
      const row = btn.closest(".brand-slider")
        ?.querySelector(".brand-products");
      if (!row) return;
      row.scrollBy({
        left: btn.classList.contains("right") ? 320 : -320,
        behavior: "smooth"
      });
    };
  });
}

// SEARCH
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const q = searchInput.value.trim();
    if (q)
      location.href = `products/index.html?search=${encodeURIComponent(q)}`;
  }
});


// SORT
document.getElementById("sortSelect").onchange = e => {
  const sort = e.target.value;
  const url = new URL(location.href);
  url.searchParams.set("sort", sort);
  location.href = url;
};

// FILTER (for now open products page)
document.getElementById("filterBtn").onclick = () => {
  location.href = "products/index.html";
};


