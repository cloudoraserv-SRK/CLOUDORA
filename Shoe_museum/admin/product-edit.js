import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", async () => {

  const id = new URLSearchParams(location.search).get("id");
  if (!id) location.href = "products.html";

  const name = document.getElementById("name");
  const slug = document.getElementById("slug");
  const mrp = document.getElementById("mrp");
  const price = document.getElementById("price");
  const discount = document.getElementById("discount");
  const shortDesc = document.getElementById("shortDesc");
  const longDesc = document.getElementById("longDesc");
  const active = document.getElementById("active");
  const saveBtn = document.getElementById("saveProduct");

  const brand = document.getElementById("brand");
  const category = document.getElementById("category");

  const colorSelect = document.getElementById("colorSelect");
  const sizeList = document.getElementById("sizeList");

  const imageInput = document.getElementById("images");
  const imageGallery = document.getElementById("imageGallery");

  let variants = [];
  let currentVariant = null;

  /* ================= LOAD PRODUCT ================= */
  async function loadProduct() {
    const { data } = await supabase.from("products").select("*").eq("id", id).single();

    name.value = data.name ?? "";
    slug.value = data.slug ?? "";
    mrp.value = data.mrp ?? "";
    price.value = data.price ?? "";
    discount.value = data.discount ?? "";
    shortDesc.value = data.short_description ?? "";
    longDesc.value = data.long_description ?? "";
    active.checked = !!data.active;

    await loadBrands(data.brand_id);
    await loadCategories(data.category_id);
    await loadVariants();
  }

  async function loadBrands(selected) {
    const { data } = await supabase.from("brands").select("id,name");
    brand.innerHTML = data.map(b =>
      `<option value="${b.id}" ${b.id === selected ? "selected" : ""}>${b.name}</option>`
    ).join("");
  }

  async function loadCategories(selected) {
    const { data } = await supabase.from("categories").select("id,name");
    category.innerHTML = data.map(c =>
      `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${c.name}</option>`
    ).join("");
  }

  /* ================= VARIANTS ================= */
async function loadVariants() {
  const { data, error } = await supabase
    .from("product_variants")
    .select("id,color_name,image_gallery")
    .eq("product_id", id);

  if (error) {
    alert(error.message);
    return;
  }

  variants = data;
  colorSelect.innerHTML = variants
    .map((v, i) => `<option value="${i}">${v.color_name}</option>`)
    .join("");

  colorSelect.value = 0;
  selectVariant();
}

function selectVariant() {
  const index = Number(colorSelect.value);
  currentVariant = variants[index];

  if (!currentVariant) return;

  console.log("variant:", currentVariant);
  console.log("gallery:", currentVariant.image_gallery);

  // JSON fix
  if (typeof currentVariant.image_gallery === "string") {
    try {
      currentVariant.image_gallery = JSON.parse(currentVariant.image_gallery);
    } catch {
      currentVariant.image_gallery = [];
    }
  }

  if (!Array.isArray(currentVariant.image_gallery)) {
    currentVariant.image_gallery = [];
  }

  renderImages();
  loadSizes();
}


  colorSelect.onchange = selectVariant;

  /* ================= IMAGES ================= */
function renderImages() {
  imageGallery.innerHTML = "";

  currentVariant.image_gallery.forEach((path, i) => {
    const url = supabase.storage.from("products")
      .getPublicUrl(path).data.publicUrl;

    imageGallery.innerHTML += `
      <div class="img-box">
        <img src="${url}" width="100">
        <button class="remove-img" data-index="${i}">✕</button>
      </div>
    `;
  });

  // bind remove buttons
  imageGallery.querySelectorAll(".remove-img").forEach(btn => {
    btn.onclick = () => removeImage(+btn.dataset.index);
  });
}



imageInput.onchange = async () => {
  if (!currentVariant) return alert("Select color first");

  const files = [...imageInput.files];
  if (!files.length) return;

  const gallery = [...currentVariant.image_gallery];

  for (const file of files) {
    const safe = file.name.replace(/\s+/g, "-").toLowerCase();
    const path = `${slug.value}/${currentVariant.color_name}/${Date.now()}-${safe}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(path, file, { upsert: true });

    if (uploadError) return alert(uploadError.message);

    gallery.push(path);
  }

  // 🔥 IMPORTANT: update using product_id + color_name
  const { error: dbError } = await supabase
    .from("product_variants")
    .update({ image_gallery: gallery })
    .eq("product_id", id)
    .eq("color_name", currentVariant.color_name);

  if (dbError) return alert(dbError.message);

  currentVariant.image_gallery = gallery;
  imageInput.value = "";
  renderImages();
};


async function removeImage(index) {
  const path = currentVariant.image_gallery[index];
  if (!path) return;

  // 1. delete from storage
  await supabase.storage.from("products").remove([path]);

  // 2. update array
  const updated = currentVariant.image_gallery.filter((_, i) => i !== index);

  // 3. update DB
  const { error } = await supabase
    .from("product_variants")
    .update({ image_gallery: updated })
    .eq("product_id", id)
    .eq("color_name", currentVariant.color_name);

  if (error) return alert(error.message);

  currentVariant.image_gallery = updated;
  renderImages();
}

/* ================= SIZES ================= */
  async function loadSizes() {
    sizeList.innerHTML = "";
    const { data } = await supabase
      .from("variant_stock")
      .select("size,stock")
      .eq("variant_id", currentVariant.id)
      .order("size");

    data?.forEach(s => {
      sizeList.innerHTML += `<div>Size ${s.size} | Stock ${s.stock}</div>`;
    });
  }

  /* ================= SAVE PRODUCT ================= */
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
      brand_id: brand.value,
      category_id: category.value
    }).eq("id", id);

    alert("✅ Product saved successfully");
  };
async function syncImages(productSlug, color) {
  const folder = `${productSlug}/${color}`;

  const { data: files, error } = await supabase.storage
    .from("products")
    .list(folder);

  if (error) return console.error(error);

  const paths = files
    .filter(f => f.name)
    .map(f => `${folder}/${f.name}`);

  await supabase
    .from("product_variants")
    .update({ image_gallery: paths })
    .eq("product_id", id)
    .eq("color_name", color);

  console.log("Synced:", paths);
}
document.getElementById("syncImagesBtn").onclick = async () => {
  if (!currentVariant) return alert("Select color first");

  await syncImages(slug.value, currentVariant.color_name);

  // reload variant data
  await loadVariants();
};

  loadProduct();
});
