// app.js - multi-file app logic (client-side localStorage based)

// wrap in DOMContentLoaded to ensure elements exist
document.addEventListener('DOMContentLoaded', function(){

  const KEY = {
    CUSTOMERS: 'ns_customers',
    SELLERS: 'ns_sellers',
    PLANTS: 'ns_plants',
    REVIEWS_PREFIX: 'ns_reviews_',
    SESS: 'ns_session',
    RESERVATIONS: 'ns_reservations'
  };

  function uid(){ if(window.crypto && crypto.randomUUID) return crypto.randomUUID(); return 'id_'+Date.now()+'_'+Math.random().toString(36).slice(2,9); }
  function load(k){ try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch(e){ console.error('load parse error',e); return []; } }
  function save(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){ console.error('save error', e); } }
  function getSession(){ try{return JSON.parse(localStorage.getItem(KEY.SESS) || 'null'); }catch(e){return null;} }
  function setSession(s){ try{ localStorage.setItem(KEY.SESS, JSON.stringify(s)); }catch(e){console.error('setSession',e);} }

  // if plants JSON files exist under /plants/*.json (deployed), you may also add code to fetch them.
  // Fallback: use embedded window.FALLBACK_ALL if available.
  if(!localStorage.getItem(KEY.PLANTS)){
    if(window.FALLBACK_ALL && window.FALLBACK_ALL.length){
      save(KEY.PLANTS, window.FALLBACK_ALL);
    } else {
      // minimal fallback
      const sample = [
        { id:'tree0001', name:'Neem', species:'Azadirachta indica', price:299, stock:12, type:'trees', tags:['medicinal','shade'], info:'Hardy tree, good for large gardens', vendor_id:'seller_demo_1' },
        { id:'indoor0001', name:'Snake Plant', species:'Sansevieria trifasciata', price:249, stock:6, type:'indoor', tags:['low-light','air-purifying'], info:'Low maintenance indoor plant', vendor_id:'seller_demo_2' },
        { id:'herb0001', name:'Basil', species:'Ocimum basilicum', price:39, stock:50, type:'herbs', tags:['edible','fragrant'], info:'Great for kitchen gardens', vendor_id:'seller_demo_1' }
      ];
      save(KEY.PLANTS, sample);
    }
  }

  if(!localStorage.getItem(KEY.SELLERS)){
    const s = [ { id:'seller_demo_1', name:'GreenLeaf', email:'green@demo', password:btoa('demo'), createdAt:new Date().toISOString() }, { id:'seller_demo_2', name:'IndoorPro', email:'indoor@demo', password:btoa('demo'), createdAt:new Date().toISOString() } ];
    save(KEY.SELLERS, s);
  }
  if(!localStorage.getItem(KEY.CUSTOMERS)){
    const c = [ { id:'cust_demo_1', name:'Alice', email:'alice@demo', password:btoa('demo'), createdAt:new Date().toISOString(), saved:[], orders:[] } ];
    save(KEY.CUSTOMERS, c);
  }
  if(!localStorage.getItem('ns_vendors')){
    localStorage.setItem('ns_vendors', JSON.stringify([ { id:'seller_demo_1', name:'GreenLeaf Nursery', location:'Pune', rating:4.5 }, { id:'seller_demo_2', name:'IndoorPro', location:'Mumbai', rating:4.6 } ]));
  }

  // UI refs
  const openAuth = document.getElementById('openAuth');
  const authModal = document.getElementById('authModal');
  const closeAuth = document.getElementById('closeAuth');
  const btnLogin = document.getElementById('btnLogin');
  const btnRegister = document.getElementById('btnRegister');
  const authRole = document.getElementById('authRole');
  const a_email = document.getElementById('a_email');
  const a_password = document.getElementById('a_password');
  const a_name = document.getElementById('a_name');
  const profilePanel = document.getElementById('profilePanel');
  const profileMain = document.getElementById('profileMain');
  const closeProfile = document.getElementById('closeProfile');

  openAuth.addEventListener('click', ()=> authModal.classList.remove('hidden'));
  closeAuth.addEventListener('click', ()=> authModal.classList.add('hidden'));

  // Auth flows
  btnRegister.addEventListener('click', ()=>{
    const role = authRole.value; const email = a_email.value.trim(); const pw = a_password.value.trim(); const name = a_name.value.trim();
    if(!email || !pw || !name) return alert('Provide name, email and password');
    if(role==='admin') return alert('Admin cannot be registered via UI');
    const key = role==='seller' ? KEY.SELLERS : KEY.CUSTOMERS; const arr = load(key);
    if(arr.find(u=>u.email===email)) return alert('Email already registered');
    const id = uid(); const user = { id, name, email, password: btoa(pw), createdAt:new Date().toISOString(), saved:[], orders:[] };
    arr.unshift(user); save(key, arr); setSession({ role, id }); authModal.classList.add('hidden'); renderProfile();
  });

  btnLogin.addEventListener('click', ()=>{
    const role = authRole.value; const email = a_email.value.trim(); const pw = a_password.value.trim();
    if(!email || !pw) return alert('Provide email and password');
    if(role==='admin'){
      // admin password required: DT2025
      if(pw === 'DT2025'){ setSession({ role:'admin', id:'admin_1' }); authModal.classList.add('hidden'); renderAdmin(); profilePanel.classList.remove('hidden'); } else return alert('Invalid admin password');
      return;
    }
    const key = role==='seller' ? KEY.SELLERS : KEY.CUSTOMERS; const arr = load(key); const user = arr.find(u=>u.email===email && u.password===btoa(pw));
    if(!user) return alert('Invalid credentials'); setSession({ role, id:user.id }); authModal.classList.add('hidden'); renderProfile();
  });

  closeProfile.addEventListener('click', ()=> profilePanel.classList.add('hidden'));

  // Profile rendering
  function renderProfile(){ const sess = getSession(); if(!sess) return alert('No session'); profileMain.innerHTML=''; if(sess.role==='seller') renderSellerProfile(sess.id); else if(sess.role==='customer') renderCustomerProfile(sess.id); else if(sess.role==='admin') renderAdmin(); profilePanel.classList.remove('hidden'); }

  function renderSellerProfile(sellerId){
    const sellers = load(KEY.SELLERS);
    const seller = sellers.find(s=>s.id===sellerId);
    if(!seller) return alert('Seller not found');
    profileMain.innerHTML = `<h3>Seller: ${escapeHtml(seller.name)}</h3><div id="sellerPlants"></div><hr><h4>Edit Info</h4><input id="s_name" value="${escapeHtml(seller.name)}"><input id="s_email" value="${escapeHtml(seller.email || '')}"><div style="margin-top:8px"><button id="s_save" class="btn">Save Info</button></div><hr><h4>Add New Plant</h4><input id="p_name" placeholder="Name"><input id="p_species" placeholder="Species"><input id="p_price" placeholder="Price"><input id="p_stock" placeholder="Stock"><input id="p_type" placeholder="Type"><textarea id="p_info" placeholder="Info"></textarea><div style="margin-top:8px"><button id="p_add" class="btn">Add Plant</button></div>`;
    const allPlants = load(KEY.PLANTS);

    function refreshList(){
      const listEl = document.getElementById('sellerPlants');
      listEl.innerHTML='';
      const items = allPlants.filter(p=>p.vendor_id===sellerId);
      listEl.innerHTML = '<h4>Your plants</h4>';
      items.forEach(p=>{
        const div = document.createElement('div');
        div.className='plant-card'; div.style.cursor='initial';
        div.innerHTML = `<h4>${escapeHtml(p.name)}</h4><div>Price: ₹${p.price} | Stock: ${p.stock}</div><div style="display:flex;gap:6px;margin-top:6px"><button data-id="${p.id}" class="editPlant btn secondary">Edit</button><button data-id="${p.id}" class="delPlant btn">Delete</button></div>`;
        listEl.appendChild(div);
      });

      listEl.querySelectorAll('.delPlant').forEach(b=>b.addEventListener('click',(e)=>{
        const id=e.target.dataset.id;
        if(!confirm('Delete plant?')) return;
        const idx = allPlants.findIndex(x=>x.id===id);
        if(idx>-1){ allPlants.splice(idx,1); save(KEY.PLANTS, allPlants); cleanupRemovedPlant(id); refreshList(); renderPlants(); }
      }));

      listEl.querySelectorAll('.editPlant').forEach(b=>b.addEventListener('click',(e)=>{
        const id=e.target.dataset.id; const p = allPlants.find(x=>x.id===id); if(!p) return;
        const newPrice = prompt('New price', p.price); const newStock = prompt('New stock', p.stock);
        if(newPrice!==null) p.price = Number(newPrice);
        if(newStock!==null) p.stock = Number(newStock);
        save(KEY.PLANTS, allPlants); renderPlants(); refreshList();
        notifyCustomersOfChange(p);
      }));
    }
    refreshList();

    document.getElementById('p_add').addEventListener('click', ()=>{
      const name=document.getElementById('p_name').value.trim(); if(!name) return alert('Provide name');
      const species=document.getElementById('p_species').value.trim(); const price=Number(document.getElementById('p_price').value)||0;
      const stock=Number(document.getElementById('p_stock').value)||0; const type=document.getElementById('p_type').value.trim()||'indoor';
      const info=document.getElementById('p_info').value.trim(); const p={ id:uid(), name, species, price, stock, type, tags:[], info, vendor_id:sellerId };
      allPlants.unshift(p); save(KEY.PLANTS, allPlants); alert('Plant added'); refreshList(); renderPlants();
    });

    document.getElementById('s_save').addEventListener('click', ()=>{
      seller.name = document.getElementById('s_name').value.trim(); seller.email = document.getElementById('s_email').value.trim();
      const idx = sellers.findIndex(s=>s.id===sellerId); sellers[idx]=seller; save(KEY.SELLERS, sellers); alert('Saved'); renderProfile();
    });
  }

  function renderCustomerProfile(customerId){
    const customers = load(KEY.CUSTOMERS); const cust = customers.find(c=>c.id===customerId);
    if(!cust) return alert('Customer not found');
    profileMain.innerHTML = `<h3>Customer: ${escapeHtml(cust.name)}</h3><div id="custSaved"></div><hr><h4>Edit Info</h4><input id="c_name" value="${escapeHtml(cust.name)}"><input id="c_email" value="${escapeHtml(cust.email || '')}"><div style="margin-top:8px"><button id="c_save" class="btn">Save Info</button></div><hr><h4>Your Reservations</h4><div id="custRes"></div><hr><h4>Your Special Orders</h4><div id="custOrders"></div>`;

    document.getElementById('c_save').addEventListener('click', ()=>{
      cust.name = document.getElementById('c_name').value.trim(); cust.email = document.getElementById('c_email').value.trim();
      const arr = load(KEY.CUSTOMERS); const idx = arr.findIndex(x=>x.id===cust.id); arr[idx]=cust; save(KEY.CUSTOMERS, arr); alert('Saved');
    });

    const saved = cust.saved || [];
    const savedEl = document.getElementById('custSaved');
    function refreshSaved(){
      savedEl.innerHTML = '<h4>Saved Plants</h4>';
      const plants = load(KEY.PLANTS);
      if(!saved.length) savedEl.innerHTML += '<div style="color:#666">No saved plants</div>';
      saved.forEach(pid=>{
        const p = plants.find(x=>x.id===pid); if(!p) return;
        const div=document.createElement('div'); div.className='plant-card'; div.style.cursor='initial';
        div.innerHTML = `<strong>${escapeHtml(p.name)}</strong><div>Price: ₹${p.price}</div><div style="display:flex;gap:6px;margin-top:6px"><button data-id="${p.id}" class="removeSaved btn secondary">Remove</button></div>`;
        savedEl.appendChild(div);
      });
      savedEl.querySelectorAll('.removeSaved').forEach(b=>b.addEventListener('click',(e)=>{
        const id=e.target.dataset.id; const idx=saved.indexOf(id); if(idx>-1) saved.splice(idx,1);
        cust.saved=saved; const arr=load(KEY.CUSTOMERS); const ci=arr.findIndex(x=>x.id===cust.id); arr[ci]=cust; save(KEY.CUSTOMERS, arr); refreshSaved();
      }));
    }
    refreshSaved();

    const resEl = document.getElementById('custRes');
    function refreshRes(){
      const allRes = load(KEY.RESERVATIONS); const my = allRes.filter(r=>r.customerId===cust.id);
      if(!my.length) resEl.innerHTML = '<div style="color:#666">No reservations</div>';
      else{
        resEl.innerHTML=''; my.forEach(r=>{
          const div=document.createElement('div'); div.className='list';
          div.innerHTML = `<strong>${escapeHtml(r.plantName)}</strong><div>Qty: ${r.qty} | Status: ${escapeHtml(r.status)}</div><div style="margin-top:6px"><button data-id="${r.id}" class="cancelRes btn secondary">Cancel</button></div>`;
          resEl.appendChild(div);
        });
        resEl.querySelectorAll('.cancelRes').forEach(b=>b.addEventListener('click',(e)=>{
          const id=e.target.dataset.id; if(!confirm('Cancel reservation?')) return;
          let all = load(KEY.RESERVATIONS); const idx=all.findIndex(x=>x.id===id); if(idx>-1) all.splice(idx,1); save(KEY.RESERVATIONS, all); refreshRes();
        }));
      }
    }
    refreshRes();

    const ordEl = document.getElementById('custOrders');
    ordEl.innerHTML = (cust.orders && cust.orders.length)? cust.orders.map(o=>`<div class="list">${escapeHtml(o.description)} | Status: ${o.status || 'pending'}</div>`).join('') : '<div style="color:#666">No special orders</div>';
  }

  function renderAdmin(){
    profileMain.innerHTML = `<h3>Admin Dashboard</h3><div><button id="viewSellers" class="btn">View Sellers</button><button id="viewCustomers" class="btn secondary">View Customers</button></div><div id="adminTable" style="margin-top:12px"></div><div id="adminDetail" style="margin-top:12px"></div>`;
    document.getElementById('viewSellers').addEventListener('click', ()=> listUsers('seller'));
    document.getElementById('viewCustomers').addEventListener('click', ()=> listUsers('customer'));
  }

  function listUsers(type){
    const el = document.getElementById('adminTable'); el.innerHTML='';
    const arr = type==='seller'? load(KEY.SELLERS): load(KEY.CUSTOMERS);
    if(!arr.length){ el.innerHTML = '<div style="color:#666">No users</div>'; return; }
    const table = document.createElement('table');
    const header = document.createElement('tr'); header.innerHTML = '<th>ID</th><th>Name</th><th>Email</th><th>Created</th>'; table.appendChild(header);
    arr.forEach(u=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><a href="#" class="userLink" data-id="${u.id}" data-type="${type}">${u.id}</a></td><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td>${new Date(u.createdAt).toLocaleString()}</td>`;
      table.appendChild(tr);
    });
    el.appendChild(table);
    el.querySelectorAll('.userLink').forEach(a=>a.addEventListener('click',(e)=>{ e.preventDefault(); showUserDetail(a.dataset.type, a.dataset.id); }));
  }

  function showUserDetail(type,id){
    const detail = document.getElementById('adminDetail'); detail.innerHTML='';
    const arr = type==='seller'? load(KEY.SELLERS): load(KEY.CUSTOMERS);
    const u = arr.find(x=>x.id===id); if(!u) return;
    const div = document.createElement('div'); div.className='list';
    div.innerHTML = `<h4>${escapeHtml(u.name)} (${type})</h4><div>Email: ${escapeHtml(u.email)}</div><div>Id: ${escapeHtml(u.id)}</div><div>Created: ${new Date(u.createdAt).toLocaleString()}</div>`;
    if(type==='seller'){ const plants = load(KEY.PLANTS).filter(p=>p.vendor_id===u.id); const pHtml = plants.map(p=>`<div>${escapeHtml(p.name)} — ₹${p.price} | Stock: ${p.stock}</div>`).join(''); div.innerHTML += `<h5>Plants</h5>${pHtml || '<div style="color:#666">No plants</div>'}`; }
    else { div.innerHTML += `<h5>Saved / Basic info</h5><div>Saved count: ${(u.saved||[]).length}</div>`; const reservations = load(KEY.RESERVATIONS).filter(r=>r.customerId===u.id); div.innerHTML += `<h5>Reservations</h5>${(reservations.length?reservations.map(r=>'<div>'+escapeHtml(r.plantName)+' x'+r.qty+' ('+escapeHtml(r.status)+')'+'</div>').join(''):'<div style="color:#666">No reservations</div>')}`; }
    detail.appendChild(div);
  }

  function renderPlants(){
    const grid = document.getElementById('plantsGrid'); grid.innerHTML='';
    const q = (document.getElementById('globalSearch')&&document.getElementById('globalSearch').value||'').toLowerCase();
    const sortBy = (document.getElementById('sortBy')&&document.getElementById('sortBy').value)||'name';
    let list = load(KEY.PLANTS);
    if(q) list = list.filter(p=> (p.name + ' ' + (p.species||'') + ' ' + (p.tags||[]).join(' ')).toLowerCase().includes(q));
    if(sortBy==='price') list.sort((a,b)=> (a.price||0)-(b.price||0));
    else if(sortBy==='stock') list.sort((a,b)=> (b.stock||0)-(a.stock||0));
    else list.sort((a,b)=> ((''+a.name).localeCompare(b.name)));
    list.forEach(p=>{
      const card = document.createElement('div'); card.className='plant-card'; card.dataset.id = p.id;
      card.innerHTML = `<img src="${placeholderSvg(p.name)}"><h3>${escapeHtml(p.name)}</h3><p style="margin:6px 0 4px 0;color:#556">${escapeHtml(p.species||'')}</p><p class="price">₹${p.price||0}</p><p class="stock">Stock: ${p.stock||0}</p>`;
      card.addEventListener('click', ()=> showDetail(p.id));
      grid.appendChild(card);
    });
  }

  function placeholderSvg(text){ const txt = encodeURIComponent(text); return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='320'><rect width='100%' height='100%' fill='%23eef'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='20'>${txt}</text></svg>`; }
  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\'':'&#39;'}[m])); }

  document.getElementById('globalSearch')&&document.getElementById('globalSearch').addEventListener('input', ()=> renderPlants());
  document.getElementById('sortBy')&&document.getElementById('sortBy').addEventListener('change', ()=> renderPlants());

  function showDetail(id){
    const p = load(KEY.PLANTS).find(x=>x.id===id); if(!p) return;
    document.getElementById('mainView').style.display='none'; document.getElementById('detailView').style.display='block';
    document.getElementById('d_name').textContent = p.name; document.getElementById('d_species').textContent = p.species || '';
    document.getElementById('d_img').src = placeholderSvg(p.name); document.getElementById('d_info').textContent = p.info || '';
    document.getElementById('d_price').textContent = '₹' + (p.price||0); document.getElementById('d_stock').textContent = 'Stock: ' + (p.stock||0);
    const vendors = JSON.parse(localStorage.getItem('ns_vendors')||'[]'); const vendorsEl = document.getElementById('d_vendors'); vendorsEl.innerHTML='';
    vendors.forEach(v=>{
      const div = document.createElement('div'); div.className='vendor-card';
      div.innerHTML = `<strong>${escapeHtml(v.name)}</strong><div>Location: ${escapeHtml(v.location)}</div><div>Rating: ${v.rating} ⭐</div><div>Price: ₹${p.price + (Math.floor(Math.random()*80)-30)}</div><div style="margin-top:8px"><button class="btn reserveNow" data-plant="${p.id}" data-vendor="${v.id}">Reserve</button> <button class="btn secondary savePlant" data-plant="${p.id}">Save</button></div>`;
      vendorsEl.appendChild(div);
    });
    loadReviews(id); location.hash = 'plant='+id;

    setTimeout(()=>{
      document.querySelectorAll('.reserveNow').forEach(b=>b.addEventListener('click', ()=>{
        const sess = getSession(); if(!sess || sess.role!=='customer') return alert('Login as customer to reserve');
        const qty = Number(prompt('Qty', '1')) || 1; const res = makeReservation(sess.id, b.dataset.plant, qty);
        if(res.ok) alert('Reserved'); renderProfile();
      }));
      document.querySelectorAll('.savePlant').forEach(b=>b.addEventListener('click', ()=>{
        const sess = getSession(); if(!sess || sess.role!=='customer') return alert('Login as customer to save');
        const customers = load(KEY.CUSTOMERS); const cust = customers.find(c=>c.id===sess.id); cust.saved = cust.saved || [];
        if(!cust.saved.includes(b.dataset.plant)) cust.saved.push(b.dataset.plant);
        const ci = customers.findIndex(x=>x.id===cust.id); customers[ci]=cust; save(KEY.CUSTOMERS, customers);
        alert('Saved to your profile');
      }));
    }, 100);
  }

  document.getElementById('backLink').addEventListener('click', (e)=>{ e.preventDefault(); document.getElementById('detailView').style.display='none'; document.getElementById('mainView').style.display='flex'; history.pushState('', document.title, window.location.pathname + window.location.search); });

  function loadReviews(plantId){ const key = KEY.REVIEWS_PREFIX + plantId; const arr = JSON.parse(localStorage.getItem(key) || '[]'); const list = document.getElementById('reviewsList'); list.innerHTML = ''; if(!arr.length) list.innerHTML = '<div style="color:#666">No reviews yet.</div>'; arr.forEach(r=>{ const div = document.createElement('div'); div.className='review'; div.innerHTML = `<strong>${escapeHtml(r.name||'Anonymous')}</strong> <div style="font-size:13px;color:#666">${escapeHtml(r.text)}</div><div style="font-size:12px;color:#999">${new Date(r.createdAt).toLocaleString()}</div>`; list.appendChild(div); }); }

  document.getElementById('rev_save').addEventListener('click', ()=>{
    const plantHash = location.hash.split('=')[1]; if(!plantHash) return alert('No plant'); const name = document.getElementById('rev_name').value.trim() || 'Anonymous';
    const text = document.getElementById('rev_text').value.trim(); if(!text) return alert('Write a review'); const key = KEY.REVIEWS_PREFIX + plantHash;
    const arr = JSON.parse(localStorage.getItem(key) || '[]'); const rec = { id: uid(), name, text, createdAt: new Date().toISOString() }; arr.unshift(rec); localStorage.setItem(key, JSON.stringify(arr)); loadReviews(plantHash);
    document.getElementById('rev_name').value=''; document.getElementById('rev_text').value='';
  });

  function makeReservation(customerId, plantId, qty){
    const plants = load(KEY.PLANTS); const p = plants.find(x=>x.id===plantId); if(!p) return { ok:false, error:'Plant not found' };
    if(p.stock < qty) return { ok:false, error:'Not enough stock' }; p.stock = p.stock - qty; save(KEY.PLANTS, plants);
    const res = load(KEY.RESERVATIONS); const rec = { id: uid(), customerId, plantId, plantName: p.name, qty, status:'pending', createdAt:new Date().toISOString() }; res.unshift(rec); save(KEY.RESERVATIONS, res);
    return { ok:true, rec };
  }

  function notifyCustomersOfChange(plant){
    const customers = load(KEY.CUSTOMERS); let changed=0; customers.forEach(c=>{
      if((c.saved||[]).includes(plant.id)){ c.notifications = c.notifications || []; c.notifications.unshift({ id:uid(), type:'plant_update', plantId:plant.id, text:`${plant.name} updated: price ₹${plant.price}, stock ${plant.stock}`, at:new Date().toISOString() }); changed++; }
    });
    save(KEY.CUSTOMERS, customers); if(changed) console.log('Customers notified:', changed);
  }

  function cleanupRemovedPlant(plantId){
    const customers = load(KEY.CUSTOMERS); customers.forEach(c=>{ if(c.saved && c.saved.includes(plantId)){ c.saved = c.saved.filter(x=>x!==plantId); } }); save(KEY.CUSTOMERS, customers);
    let res = load(KEY.RESERVATIONS); res = res.filter(r=>r.plantId !== plantId); save(KEY.RESERVATIONS, res);
    localStorage.removeItem(KEY.REVIEWS_PREFIX + plantId);
  }

  renderPlants();

  window.Nursery = { load, save, KEY, uid };

}); // end DOMContentLoaded