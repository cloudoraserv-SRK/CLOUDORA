import { supabase } from "../admin/supabaseClient.js";

/* =========================
   GET SLUG
========================= */
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

if (!slug) {
  document.getElementById("productName").innerText = "Product not found";
  throw new Error("No slug");
}

/* =========================
   LOAD PRODUCT
========================= */
async function loadProduct() {
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      price,
      image_gallery,
      colors,
      brands!products_brand_id_fkey ( slug ),
      categories!products_category_id_fkey ( slug )
    `)
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !product) {
    document.getElementById("productName").innerText = "Product not found";
    return;
  }

  /* TEXT */
  document.getElementById("productName").innerText = product.name;
  document.getElementById("productPrice").innerText = `₹${product.price}`;

  /* IMAGES (SUPABASE STORAGE) */
  const main = document.querySelector(".gallery-main");
  const thumbs = document.getElementById("thumbs");

  main.innerHTML = "";
  thumbs.innerHTML = "";

  const images = Array.isArray(product.image_gallery)
    ? product.image_gallery
    : [];

  images.forEach((path, i) => {
    const url = supabase.storage
      .from("products")
      .getPublicUrl(path).data.publicUrl;

    if (i === 0) {
      main.innerHTML = `<img src="${url}" />`;
    }

    const t = document.createElement("img");
    t.src = url;
    t.onclick = () => (main.innerHTML = `<img src="${url}" />`);
    thumbs.appendChild(t);
  });

  /* ADD TO CART */
  document.getElementById("addToCartBtn").onclick = () => {
    addToCart(product);
  };

  loadRelated(product.id);
}

loadProduct();

/* =========================
   RELATED PRODUCTS
========================= */
async function loadRelated(currentId) {
  const { data } = await supabase
    .from("products")
    .select("name,slug,price,image_gallery")
    .neq("id", currentId)
    .eq("active", true)
    .limit(4);

  const grid = document.getElementById("relatedGrid");
  grid.innerHTML = "";

  data?.forEach(p => {
    let imgUrl = "";

    if (Array.isArray(p.image_gallery) && p.image_gallery.length > 0) {
      imgUrl = supabase.storage
        .from("products")
        .getPublicUrl(p.image_gallery[0]).data.publicUrl;
    }

    grid.innerHTML += `
      <a href="product.html?slug=${p.slug}" class="product-card">
        <img src="${imgUrl}">
        <h4>${p.name}</h4>
        <span>₹${p.price}</span>
      </a>
    `;
  });
}

/* =========================
   CART (LOCAL)
========================= */
function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  cart.push({
    id: product.id,
    name: product.name,
    price: product.price,
    slug,
    qty: 1
  });

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart");
}
