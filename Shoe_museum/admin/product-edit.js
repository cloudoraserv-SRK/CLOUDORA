import { supabase } from "./supabaseClient.js";

const id = new URLSearchParams(location.search).get("id");
if (!id) location.href = "products.html";

// fields
const name = document.getElementById("name");
const slug = document.getElementById("slug");
const mrp = document.getElementById("mrp");
const price = document.getElementById("price");
const discount = document.getElementById("discount");
const shortDesc = document.getElementById("shortDesc");
const longDesc = document.getElementById("longDesc");
const active = document.getElementById("active");

const brand = document.getElementById("brand");
const category = document.getElementById("category");

const imageInput = document.getElementById("images");
const imageGallery = document.getElementById("imageGallery");

const saveBtn = document.getElementById("saveProduct");

let product;

// ---------------- LOAD PRODUCT ----------------
async function loadProduct() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert("Product not found");
    return;
  }

product = data;
product.image_gallery = product.image_gallery || [];

  name.value = data.name || "";
  slug.value = data.slug || "";
  mrp.value = data.mrp || "";
  price.value = data.price || "";
  discount.value = data.discount || "";
  shortDesc.value = data.short_description || "";
  longDesc.value = data.long_description || "";
  active.checked = data.active;

  await loadBrands();
  await loadCategories();

  brand.value = data.brand_id || "";
  category.value = data.category_id || "";

  renderImages();
}

// ---------------- BRANDS ----------------
async function loadBrands() {
  const { data } = await supabase.from("brands").select("*");
  brand.innerHTML = `<option value="">Select Brand</option>`;
  data.forEach(b => {
    brand.innerHTML += `<option value="${b.id}">${b.name}</option>`;
  });
}

// ---------------- CATEGORIES ----------------
async function loadCategories() {
  const { data } = await supabase.from("categories").select("*");
  category.innerHTML = `<option value="">Select Category</option>`;
  data.forEach(c => {
    category.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });
}

// ---------------- IMAGES ----------------
function renderImages() {
  imageGallery.innerHTML = "";

  (product.image_gallery || []).forEach((path, index) => {
    const div = document.createElement("div");
    div.className = "img-box";

    div.innerHTML = `
      <img src="${supabase.storage
        .from("products")
        .getPublicUrl(path).data.publicUrl}">
      <button onclick="deleteImage(${index})">✕</button>
    `;

    imageGallery.appendChild(div);
  });
}

window.deleteImage = async (index) => {
  const path = product.image_gallery[index];

  await supabase.storage.from("products").remove([path]);

  product.image_gallery.splice(index, 1);

  await supabase
    .from("products")
    .update({ image_gallery: product.image_gallery })
    .eq("id", id);

  renderImages();
};

// upload new images
imageInput.onchange = async () => {
  for (let file of imageInput.files) {
    const filePath = `${slug.value}/${Date.now()}-${file.name}`;


    await supabase.storage
      .from("products")
      .upload(filePath, file, { upsert: true });

    product.image_gallery.push(filePath);
  }
if (!slug.value) {
  alert("Slug is required before uploading images");
  return;
}

  await supabase
    .from("products")
    .update({ image_gallery: product.image_gallery })
    .eq("id", id);

  renderImages();
};

// ---------------- SAVE PRODUCT ----------------
saveBtn.onclick = async () => {
  await supabase.from("products").update({
    name: name.value,
    slug: slug.value,
    mrp: mrp.value,
    price: price.value,
    discount: discount.value || null,
    short_description: shortDesc.value,
    long_description: longDesc.value,
    active: active.checked,
    brand_id: brand.value || null,
    category_id: category.value || null
  }).eq("id", id);

  alert("Product saved");
};

loadProduct();
