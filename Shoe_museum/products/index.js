import { supabase } from "../admin/supabaseClient.js";

const grid = document.getElementById("productsGrid");

document.addEventListener("DOMContentLoaded", loadProducts);

async function loadProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      price,
      short_description
    `)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    grid.innerHTML = "<p>Error loading products</p>";
    return;
  }

  renderProducts(data || []);
}

function renderProducts(products) {
  grid.innerHTML = "";

  if (!products.length) {
    grid.innerHTML = "<p>No products found</p>";
    return;
  }

  products.forEach(p => {
    grid.insertAdjacentHTML(
      "beforeend",
      `
      <a href="product.html?slug=${p.slug}" class="product-card">
        <img src="../assets/images/placeholder.png">
        <h3>${p.name}</h3>
        <span>₹${p.price}</span>
      </a>
      `
    );
  });
}
