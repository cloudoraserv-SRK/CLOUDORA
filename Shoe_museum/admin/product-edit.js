import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", () => {

  const id = new URLSearchParams(location.search).get("id");
  if (!id) location.href = "products.html";

  /* ===== BASIC FIELDS ===== */
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
  const saveBtn = document.getElementById("saveProduct");

  /* ===== VARIANTS ===== */
  const newColor = document.getElementById("newColor");
  const addColor = document.getElementById("addColor");
  const colorSelect = document.getElementById("colorSelect");

  const newSize = document.getElementById("newSize");
  const newStock = document.getElementById("newStock");
  const addSize = document.getElementById("addSize");
  const sizeList = document.getElementById("sizeList");

  /* ===== IMAGES ===== */
  const imageInput = document.getElementById("images");
  const imageGallery = document.getElementById("imageGallery");

  let variants = [];
  let currentVariant = null;

  /* ================= LOAD PRODUCT ================= */
  async function loadProduct() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return alert("Product not found");

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

  /* ================= VARIANTS ================= */
  async function loadVariants() {
    const { data } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", id);

    variants = data || [];
    renderColors();
  }

  function renderColors() {
    colorSelect.innerHTML = "";

    variants.forEach((v, i) => {
      colorSelect.innerHTML += `<option value="${i}">${v.color_name}</option>`;
    });

    if (variants.length) {
      colorSelect.value = 0;
      selectVariant();
    }
  }

  function selectVariant() {
    currentVariant = variants[colorSelect.value];
    if (!currentVariant) return;

    // 🔥 MAIN FIX
    if (!Array.isArray(currentVariant.image_gallery)) {
      currentVariant.image_gallery = [];
    }

    renderImages();
    loadSizes();
  }

  colorSelect.onchange = selectVariant;

  /* ================= ADD COLOR ================= */
  addColor.onclick = async () => {
    if (!newColor.value.trim()) return;

    await supabase.from("product_variants").insert({
      product_id: id,
      color_name: newColor.value.trim(),
      image_gallery: []
    });

    newColor.value = "";
    loadVariants();
  };

  /* ================= IMAGES ================= */
  function renderImages() {
    imageGallery.innerHTML = "";

    currentVariant.image_gallery.forEach((path, i) => {
      imageGallery.innerHTML += `
        <div class="img-box">
          <img src="${img(path)}">
          <button class="remove-img" data-i="${i}">✕</button>
        </div>
      `;
    });

    document.querySelectorAll(".remove-img").forEach(btn => {
      btn.onclick = () => removeImage(Number(btn.dataset.i));
    });
  }

  async function removeImage(i) {
    if (!confirm("Remove image?")) return;

    const path = currentVariant.image_gallery[i];

    await supabase.storage.from("products").remove([path]);

    currentVariant.image_gallery.splice(i, 1);

    await supabase
      .from("product_variants")
      .update({ image_gallery: currentVariant.image_gallery })
      .eq("id", currentVariant.id);

    renderImages();
  }

  imageInput.onchange = async () => {
    if (!currentVariant || !slug.value) return;

    for (let file of imageInput.files) {
      const safe = file.name.replace(/\s+/g, "-");
      const path = `${slug.value}/${currentVariant.color_name}/${Date.now()}-${safe}`;

      await supabase.storage
        .from("products")
        .upload(path, file, { upsert: true });

      currentVariant.image_gallery.push(path);
    }

    await supabase
      .from("product_variants")
      .update({ image_gallery: currentVariant.image_gallery })
      .eq("id", currentVariant.id);

    imageInput.value = "";
    renderImages();
  };

  /* ================= SIZE + STOCK ================= */
  async function loadSizes() {
    sizeList.innerHTML = "";

    const { data } = await supabase
      .from("variant_stock")
      .select("*")
      .eq("variant_id", currentVariant.id)
      .order("size");

    data?.forEach(s => {
      sizeList.innerHTML += `<div>Size ${s.size} | Stock ${s.stock}</div>`;
    });
  }

  addSize.onclick = async () => {
    if (!newSize.value || !newStock.value) return;

    await supabase.from("variant_stock").upsert({
      variant_id: currentVariant.id,
      size: newSize.value,
      stock: Number(newStock.value)
    });

    newSize.value = "";
    newStock.value = "";
    loadSizes();
  };

  /* ================= SAVE ================= */
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

  /* ================= HELPERS ================= */
  function img(path) {
    return supabase.storage.from("products")
      .getPublicUrl(path).data.publicUrl;
  }

  async function loadBrands(selected) {
    const { data } = await supabase.from("brands").select("*");
    brand.innerHTML = data.map(b =>
      `<option value="${b.id}" ${b.id === selected ? "selected" : ""}>${b.name}</option>`
    ).join("");
  }

  async function loadCategories(selected) {
    const { data } = await supabase.from("categories").select("*");
    category.innerHTML = data.map(c =>
      `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${c.name}</option>`
    ).join("");
  }

  loadProduct();
});
