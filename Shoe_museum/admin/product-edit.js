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

  /* ===== VARIANTS UI ===== */
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

  let product = { variants: [], image_gallery: [] };

  /* ================= LOAD PRODUCT ================= */
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
    product.variants ||= [];
    product.image_gallery ||= [];

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

    renderColors();
    renderImages();
  }

  /* ================= VARIANTS ================= */

  addColor.onclick = () => {
    if (!newColor.value.trim()) return;

    product.variants.push({
      color: newColor.value.trim(),
      sizes: []
    });

    newColor.value = "";
    renderColors();
  };

  function renderColors() {
    colorSelect.innerHTML = "";
    product.variants.forEach((v, i) => {
      colorSelect.innerHTML += `<option value="${i}">${v.color}</option>`;
    });
    renderSizes();
  }

  addSize.onclick = () => {
    const ci = colorSelect.value;
    if (ci === "") return;

    const size = newSize.value;
    const stock = Number(newStock.value);
    if (!size || !stock) return;

    const sizes = product.variants[ci].sizes;
    const existing = sizes.find(s => s.size === size);

    if (existing) {
      existing.stock = stock;
    } else {
      sizes.push({ size, stock });
    }

    newSize.value = "";
    newStock.value = "";
    renderSizes();
  };

  function renderSizes() {
    sizeList.innerHTML = "";
    const v = product.variants[colorSelect.value];
    if (!v) return;

    v.sizes.forEach((s, i) => {
      sizeList.innerHTML += `
        <div>
          Size ${s.size} | Stock ${s.stock}
          <button data-i="${i}" class="delSize">✕</button>
        </div>
      `;
    });

    sizeList.querySelectorAll(".delSize").forEach(btn => {
      btn.onclick = () => {
        v.sizes.splice(btn.dataset.i, 1);
        renderSizes();
      };
    });
  }

  colorSelect.onchange = renderSizes;

  /* ================= IMAGES (OLD SYSTEM) ================= */

  function renderImages() {
    imageGallery.innerHTML = "";

    product.image_gallery.forEach((path, index) => {
      const div = document.createElement("div");
      div.className = "img-box";
      div.innerHTML = `
        <img src="${img(path)}">
        <button data-i="${index}">✕</button>
      `;
      div.querySelector("button").onclick = () => deleteImage(index);
      imageGallery.appendChild(div);
    });
  }

  async function deleteImage(index) {
    const path = product.image_gallery[index];
    await supabase.storage.from("products").remove([path]);
    product.image_gallery.splice(index, 1);

    await supabase
      .from("products")
      .update({ image_gallery: product.image_gallery })
      .eq("id", id);

    renderImages();
  }

  imageInput.onchange = async () => {
    if (!slug.value) {
      alert("Slug required before uploading images");
      return;
    }

    for (let file of imageInput.files) {
      const path = `${slug.value}/${Date.now()}-${file.name}`;
      await supabase.storage.from("products").upload(path, file, { upsert: true });
      product.image_gallery.push(path);
    }

    await supabase
      .from("products")
      .update({ image_gallery: product.image_gallery })
      .eq("id", id);

    renderImages();
  };

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
      brand_id: brand.value || null,
      category_id: category.value || null,
      variants: product.variants,
      image_gallery: product.image_gallery
    }).eq("id", id);

    alert("Product saved");
  };

  /* ================= HELPERS ================= */
  function img(path) {
    return supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
  }

  async function loadBrands() {
    const { data } = await supabase.from("brands").select("*");
    brand.innerHTML = data.map(b => `<option value="${b.id}">${b.name}</option>`).join("");
  }

  async function loadCategories() {
    const { data } = await supabase.from("categories").select("*");
    category.innerHTML = data.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  }

  loadProduct();
});
