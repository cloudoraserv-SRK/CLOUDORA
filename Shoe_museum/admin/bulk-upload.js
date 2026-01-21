import { supabase } from "./supabaseClient.js";
import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm";

const fileInput = document.getElementById("excelFile");
const previewBtn = document.getElementById("previewBtn");
const uploadBtn = document.getElementById("uploadBtn");
const table = document.getElementById("previewTable");
const log = document.getElementById("log");
const progress = document.getElementById("progress");

let rows = [];

/* PREVIEW */
previewBtn.onclick = async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Excel select karo");

  const data = await file.arrayBuffer();
  const wb = XLSX.read(data);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  rows = XLSX.utils.sheet_to_json(sheet);

  renderTable(rows);
};

/* TABLE RENDER */
function renderTable(data){
  table.querySelector("thead").innerHTML =
    `<tr>${Object.keys(data[0]).map(h=>`<th>${h}</th>`).join("")}</tr>`;

  table.querySelector("tbody").innerHTML = data.map((r,i)=>`
    <tr data-i="${i}">
      ${Object.keys(r).map(k=>`
        <td contenteditable data-k="${k}">${r[k] ?? ""}</td>
      `).join("")}
    </tr>
  `).join("");
}

/* READ EDITED DATA */
function getEditedRows(){
  const out = [];
  table.querySelectorAll("tbody tr").forEach(tr=>{
    const row = {};
    tr.querySelectorAll("td").forEach(td=>{
      row[td.dataset.k] = td.innerText.trim();
    });
    out.push(row);
  });
  return out;
}

/* UPLOAD */
uploadBtn.onclick = async () => {
  const data = getEditedRows();
  progress.max = data.length;
  progress.value = 0;
  log.textContent = "";

  let done = 0;

  for (let r of data) {
    try {
      /* PRODUCT */
      const { data: product } = await supabase
        .from("products")
        .upsert({
          slug: r.slug,
          name: r.name,
          brand_id: r.brand_id,
          category_id: r.category_id,
          mrp: r.mrp,
          price: r.price,
          discount: r.discount || 0,
          active: r.active === "TRUE" || r.active === true
        }, { onConflict: "slug" })
        .select("id")
        .single();

      /* VARIANTS */
      const colors = String(r.color).split("|");
      const sizes = String(r.sizes).split("|");

      for (let c of colors) {
        const { data: v } = await supabase
          .from("product_variants")
          .upsert({
            product_id: product.id,
            color_name: c.trim(),
            image_gallery: []
          }, { onConflict:"product_id,color_name" })
          .select("id")
          .single();

        for (let s of sizes) {
          await supabase.from("variant_stock").upsert({
            variant_id: v.id,
            size: s.replace(/[\[\]"]/g,"").trim(),
            stock: 10
          });
        }
      }

      log.textContent += `✅ ${r.slug}\n`;
    } catch (e) {
      log.textContent += `❌ ${r.slug}\n`;
    }

    progress.value = ++done;
  }

  log.textContent += "\nDONE. Images product-edit se upload karo.";
};
