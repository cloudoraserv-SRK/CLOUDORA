// admin/admin.js
(async ()=>{
const fileInput = document.getElementById('csvfile');
document.getElementById('uploadBtn').onclick = async ()=>{
if (!fileInput.files.length) return alert('Choose CSV');
const f = fileInput.files[0];
const text = await f.text();
const parsed = Papa.parse(text, { header:true }).data;
for(const r of parsed){
const lead = { lead_uid: genUID(), name: r.name || r.fullname || r.Name, phone: r.phone || r.mobile, email: r.email || r.Email, source: r.source || 'csv' };
await fetch(CONFIG.BACKEND + '/api/admin/create-lead', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(lead) });
}
alert('Leads created');
};


document.getElementById('assignBtn').onclick = async ()=>{
// fetch unassigned leads
const res = await supabase.from('leads').select('*').eq('assigned',false).limit(200);
if(res.error) return alert('Error fetching leads');
const leadIds = res.data.map(l=>l.id);
const shift = document.getElementById('shiftSelect').value;
const adminId = (await getCurrentUser())?.id;
const rr = await fetch(CONFIG.BACKEND + '/api/admin/assign-leads', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ leadIds, shift, adminId }) });
const j = await rr.json(); if(j.ok) alert('Assigned ' + j.assigned.length + ' leads'); else alert('Assign error');
};
})();