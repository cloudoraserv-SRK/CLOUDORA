import { supabase } from "./supabaseClient.js";

const tbody = document.getElementById("productsBody");

async function loadProducts() {
  const { data: products } = await supabase
  .from("products")
  .select(`
    id,
    name,
    price,
    mrp,
    active,
    brands!products_brand_id_fkey(name),
    categories!products_category_id_fkey(name)
  `)
  .order("created_at", { ascending: false });

  tbody.innerHTML = "";

  for (const p of products) {

  const { data: variants } = await supabase
    .from("product_variants")
    .select("image_gallery")
    .eq("product_id", p.id)
    .limit(1);

  let img = "—";

  if (variants?.length) {
    const gallery = variants[0].image_gallery;
    if (Array.isArray(gallery) && gallery.length) {
      img = supabase.storage
        .from("products")
        .getPublicUrl(gallery[0]).data.publicUrl;
    }
  }

  tbody.innerHTML += `
    <tr>
      <td>
  <div class="imgs">
    <img src="${img}">
  </div>
</td>

      <td>${p.name}</td>
      <td>${p.brands?.name ?? "-"}</td>
      <td>${p.categories?.name ?? "-"}</td>
      <td>₹${p.price}</td>
      <td>₹${p.mrp}</td>
      <td>${p.active ? "✅" : "❌"}</td>
      <td>
        <button onclick="editProduct('${p.id}')">Edit</button>
<button class="danger" onclick="deleteProduct('${p.id}')">Delete</button>

      </td>
    </tr>
  `;
}

}

window.editProduct = id => {
  location.href = `product-edit.html?id=${id}`;
};

window.deleteProduct = async id => {
  if (!confirm("Delete product?")) return;

  const { data: vars } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", id);

  for (let v of vars || []) {
    await supabase.from("variant_stock").delete().eq("variant_id", v.id);
  }

  await supabase.from("product_variants").delete().eq("product_id", id);
  await supabase.from("products").delete().eq("id", id);

  loadProducts();
};
window.editProduct = (id) => {
  location.href = `product-edit.html?id=${id}`;
};

window.deleteProduct = async (id) => {
  if (!confirm("Delete product?")) return;

  const { data: vars } = await supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", id);

  for (let v of vars || []) {
    await supabase.from("variant_stock").delete().eq("variant_id", v.id);
  }

  await supabase.from("product_variants").delete().eq("product_id", id);
  await supabase.from("products").delete().eq("id", id);

  loadProducts();
};

loadProducts();
