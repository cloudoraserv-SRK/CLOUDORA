import { supabase } from "./supabaseClient.js";

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
const addBtn = document.getElementById("addProduct");

// load brands
async function loadBrands(){
  const { data } = await supabase.from("brands").select("*");
  brand.innerHTML = `<option value="">Select Brand</option>`;
  data.forEach(b=>{
    brand.innerHTML += `<option value="${b.id}">${b.name}</option>`;
  });
}

// load categories
async function loadCategories(){
  const { data } = await supabase.from("categories").select("*");
  category.innerHTML = `<option value="">Select Category</option>`;
  data.forEach(c=>{
    category.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });
}

// create product
addBtn.onclick = async () => {
  if(!name.value || !slug.value){
    alert("Name & Slug required");
    return;
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
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
      image_gallery: []
    })
    .select()
    .single();

  if(error){
    alert(error.message);
    return;
  }

  location.href = `product-edit.html?id=${data.id}`;
};

loadBrands();
loadCategories();
