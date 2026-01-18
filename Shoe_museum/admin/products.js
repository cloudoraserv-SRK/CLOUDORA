import { supabase } from "./supabaseClient.js";

const list = document.getElementById("productsList");

async function loadProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Failed to load products");
    return;
  }

  list.innerHTML = "";

  data.forEach(p => {
    const div = document.createElement("div");
    div.className = "product-card";

    // first image from gallery (if exists)
    let imgHtml = `<div class="imgs empty">No image</div>`;

    if (p.image_gallery && p.image_gallery.length > 0) {
      const url = supabase.storage
        .from("products")
        .getPublicUrl(p.image_gallery[0]).data.publicUrl;

      imgHtml = `
        <div class="imgs">
          <img src="${url}" />
        </div>
      `;
    }

    div.innerHTML = `
      ${imgHtml}
      <div class="product-info">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button onclick="editProduct('${p.id}')">Edit</button>
        <button class="danger" onclick="deleteProduct('${p.id}')">Delete</button>
      </div>
    `;

    list.appendChild(div);
  });
}

window.editProduct = (id) => {
  location.href = `product-edit.html?id=${id}`;
};

window.deleteProduct = async (id) => {
  if (!confirm("Delete product?")) return;
  await supabase.from("products").delete().eq("id", id);
  loadProducts();
};

loadProducts();
