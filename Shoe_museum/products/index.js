import { supabase } from "../admin/supabaseClient.js";

const grid = document.getElementById("productsGrid");
const params = new URLSearchParams(location.search);
const brand = params.get("brand");

let ALL_PRODUCTS = [];

async function loadProducts() {
  let query = supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      price,
      product_variants(image_gallery),
      brands!products_brand_id_fkey(slug)
    `);

  if (brand) {
    query = query.eq("brands.slug", brand);
  }

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return;
  }

  ALL_PRODUCTS = data || [];

  // expose for filters.js
  window.ALL_PRODUCTS = ALL_PRODUCTS;
  window.renderProducts = renderProducts;

  renderProducts(ALL_PRODUCTS);
}

function renderProducts(products) {
  grid.innerHTML = "";

  if (!products || products.length === 0) {
    grid.innerHTML = "<p>No products found</p>";
    return;
  }

  products.forEach(p => {
    const v = p.product_variants?.find(i => i.image_gallery?.length);
    const img = v
      ? supabase.storage
          .from("products")
          .getPublicUrl(v.image_gallery[0]).data.publicUrl
      : "";

    grid.innerHTML += `
      <a href="product.html?slug=${p.slug}" class="product-card">
        <img src="${img}" alt="${p.name}">
        <h3>${p.name}</h3>
        <span>₹${p.price}</span>
      </a>
    `;
  });
}

loadProducts();
