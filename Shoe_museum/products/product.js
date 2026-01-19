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
      slug,
      mrp,
      price,
      short_description,
      long_description,
      sizes,
      colors,
      image_gallery,
      brands!products_brand_id_fkey ( name, slug ),
      categories!products_category_id_fkey ( name, slug )
    `)
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !product) {
    document.getElementById("productName").innerText = "Product not found";
    return;
  }

  /* TEXT */
  productName.innerText = product.name;
  productDesc.innerText = product.short_description || "";
  productPrice.innerText = `₹${product.price}`;

  if (product.mrp) {
    document.getElementById("productMrp").innerText = `₹${product.mrp}`;
  }

  document.getElementById("longDesc").innerText =
    product.long_description || "";

  /* SIZES */
  const sizeBox = document.getElementById("sizes");
  if (Array.isArray(product.sizes)) {
    sizeBox.innerHTML = product.sizes
      .map(s => `<span class="size">${s}</span>`)
      .join("");
  }

  /* COLORS */
  const colorBox = document.getElementById("colors");
  if (Array.isArray(product.colors)) {
    colorBox.innerHTML = product.colors
      .map(c => `<span class="color" style="background:${c}"></span>`)
      .join("");
  }

  /* IMAGES */
  const main = document.getElementById("galleryMain");
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
      main.innerHTML = `<img src="${url}">`;
    }

    const t = document.createElement("img");
    t.src = url;
    t.onclick = () => (main.innerHTML = `<img src="${url}">`);
    thumbs.appendChild(t);
  });

  /* ADD TO CART */
  addToCartBtn.onclick = () => addToCart(product);

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

  relatedGrid.innerHTML = "";

  data?.forEach(p => {
    const img =
      p.image_gallery?.[0]
        ? supabase.storage.from("products")
            .getPublicUrl(p.image_gallery[0]).data.publicUrl
        : "";

    relatedGrid.innerHTML += `
      <a href="product.html?slug=${p.slug}" class="related-card">
        <img src="${img}">
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

  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.qty += 1;
  else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      slug: product.slug,
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart");
}
