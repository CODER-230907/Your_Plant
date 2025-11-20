// main.js - Enhanced with new features
import { ensurePlants, listPlants, createPlantCardElement, getPlant, addReview, makeReservation, savePlants } from './plants.js';
import { ensureDemoUsers, getSession, login, register, setSession } from './auth.js';
import { getCart, addToCart, removeFromCart, updateQty, clearCart, cartCount } from './cart.js';
import { createOrder, getCustomerOrders } from './orders.js';
import { getSellerPlants, addSellerPlant, updateSellerPlant, deleteSellerPlant, getSellerAnalytics, renderSellerProducts } from './seller.js';
import { getAllUsers, deleteUser, renderUsersList, renderProductsList, renderOrdersList, deletePlant, updateOrderStatus } from './admin.js';
import { loadJSON, saveJSON } from './utils.js';

// init
ensurePlants(); 
ensureDemoUsers();

const PAGE_SIZE = 6;
let pageIndex = 0; 
let lastFiltered = [];

function $(id){ return document.getElementById(id); }

// UI refs
const grid = $('plantsGrid'); 
const loadMore = $('loadMore'); 
const globalSearch = $('globalSearch'); 
const sortBy = $('sortBy'); 
const tagList = $('tagList'); 
const typeList = $('typeList'); 
const filterType = $('filterType');

// Enhanced UI initialization
function initUI() {
  buildFilters(); 
  filterAndSort(); 
  updateCartCount();
  updateUserInterface();
}

function updateUserInterface() {
  const session = getSession();
  const profileBtn = $('openProfile');
  const sellerBtn = $('openSellerDashboard');
  const adminBtn = $('openAdminPanel');
  
  // Show/hide buttons based on role
  if (session) {
    profileBtn.style.display = 'inline-block';
    
    if (session.role === 'seller') {
      sellerBtn.style.display = 'inline-block';
    } else if (session.role === 'admin') {
      adminBtn.style.display = 'inline-block';
    } else {
      sellerBtn.style.display = 'none';
      adminBtn.style.display = 'none';
    }
  } else {
    profileBtn.style.display = 'none';
    sellerBtn.style.display = 'none';
    adminBtn.style.display = 'none';
  }
}

// render initial filters
function buildFilters(){ 
  const plants = listPlants(); 
  const types = Array.from(new Set(plants.map(p=>p.type||'other'))); 
  filterType.innerHTML = '<option value="all">All types</option>' + types.map(t=>`<option value="${t}">${t}</option>`).join(''); 
  
  // tags
  const tags = Array.from(new Set((plants.flatMap(p=>p.tags||[])))); 
  tagList.innerHTML = tags.map(t=>`<button class="tag" data-tag="${t}">${t}</button>`).join(''); 
  typeList.innerHTML = types.map(t=>`<button class="tag" data-type="${t}">${t}</button>`).join(''); 
}

function filterAndSort(){ 
  const q = (globalSearch.value||'').toLowerCase(); 
  const plants = listPlants(); 
  let res = plants.filter(p=> (p.name+' '+(p.species||'')+' '+(p.tags||[]).join(' ')).toLowerCase().includes(q));
  
  const ft = filterType.value; 
  if(ft && ft!=='all') res = res.filter(p=>p.type===ft);
  
  const min = Number(document.getElementById('priceMin').value||0); 
  const max = Number(document.getElementById('priceMax').value||0);
  if(min) res = res.filter(p=>p.price >= min); 
  if(max) res = res.filter(p=>p.price <= max);
  
  const s = sortBy.value; 
  if(s==='price') res.sort((a,b)=> (a.price||0)-(b.price||0)); 
  else if(s==='stock') res.sort((a,b)=> (b.stock||0)-(a.stock||0)); 
  else res.sort((a,b)=> (''+a.name).localeCompare(b.name));
  
  lastFiltered = res; 
  pageIndex = 0; 
  renderPage(); 
}

function renderPage(){ 
  const start = pageIndex * PAGE_SIZE; 
  const slice = lastFiltered.slice(start, start + PAGE_SIZE); 
  if(pageIndex===0) grid.innerHTML=''; 
  slice.forEach(p=> grid.appendChild(createPlantCardElement(p))); 
  pageIndex++; 
  if(pageIndex * PAGE_SIZE >= lastFiltered.length) loadMore.style.display='none'; 
  else loadMore.style.display='inline-block'; 
}

// show detail
window.addEventListener('nursery_show', (e)=>{ 
  const id=e.detail; 
  const p = getPlant(id); 
  if(!p) return; 
  document.getElementById('mainView').style.display='none'; 
  document.getElementById('detailView').style.display='block'; 
  $('d_name').textContent = p.name; 
  $('d_species').textContent = p.species||''; 
  $('d_img').src = p.image || ''; 
  $('d_img').alt = p.name;
  $('d_info').textContent = p.info||''; 
  $('d_price').textContent = '₹'+(p.price||0); 
  $('d_stock').textContent = 'Stock: '+(p.stock||0); 
  
  // reviews
  const rev = loadJSON('ns_reviews_'+p.id, []); 
  const list = $('reviewsList'); 
  list.innerHTML = (rev.length? rev.map(r=>`
    <div class="review">
      <strong>${r.name}</strong>
      <div style="font-size:13px;color:#666">${r.text}</div>
      <div style="font-size:12px;color:#999">${new Date(r.createdAt).toLocaleString()}</div>
    </div>
  `).join('') : '<div style="color:#666">No reviews yet.</div>');
  
  location.hash = 'plant='+p.id;
});

// back link
$('backLink').addEventListener('click',(ev)=>{ 
  ev.preventDefault(); 
  document.getElementById('detailView').style.display='none'; 
  document.getElementById('mainView').style.display='flex'; 
  history.pushState('', document.title, window.location.pathname + window.location.search); 
});

// Enhanced profile panel render
function renderProfile(){ 
  const sess = getSession(); 
  if(!sess) return alert('No session'); 
  
  let profileHTML = `<h3>${sess.role.toUpperCase()} Profile</h3><div>ID: ${sess.id}</div>`;
  
  if (sess.role === 'customer') {
    const orders = getCustomerOrders(sess.id);
    profileHTML += `
      <h4 style="margin-top:20px">Order History</h4>
      ${orders.length ? orders.map(order => `
        <div class="order-item" style="padding:12px;border:1px solid #eee;border-radius:8px;margin-bottom:12px">
          <div style="display:flex;justify-content:space-between">
            <strong>Order #${order.id.slice(-6)}</strong>
            <span class="status-badge ${order.status}">${order.status}</span>
          </div>
          <div style="font-size:13px;color:#666;margin:4px 0">
            ${new Date(order.createdAt).toLocaleString()} • Total: ₹${order.total}
          </div>
          <div>
            ${order.items.map(item => `
              <div style="font-size:13px">
                ${item.name} - ₹${item.price} x ${item.quantity}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('') : '<div style="color:#666">No orders yet.</div>'}
    `;
  }
  
  $('profileMain').innerHTML = profileHTML; 
  $('profilePanel').classList.remove('hidden'); 
}

// Seller Dashboard
function renderSellerDashboard() {
  const session = getSession();
  if (!session || session.role !== 'seller') return;
  
  const analytics = getSellerAnalytics(session.id);
  $('totalProducts').textContent = analytics.totalProducts;
  $('totalSales').textContent = '₹' + analytics.totalSales;
  $('lowStock').textContent = analytics.lowStockCount;
  
  renderSellerProducts(session.id, $('sellerProducts'));
  $('sellerPanel').classList.remove('hidden');
}

// Admin Panel
function renderAdminPanel(tab = 'users') {
  const session = getSession();
  if (!session || session.role !== 'admin') return;
  
  // Set active tab
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  document.querySelectorAll('.admin-tab-content').forEach(content => {
    content.classList.toggle('hidden', content.id !== 'admin' + tab.charAt(0).toUpperCase() + tab.slice(1));
  });
  
  // Render content based on tab
  switch(tab) {
    case 'users':
      renderUsersList($('usersList'));
      break;
    case 'products':
      renderProductsList($('productsList'));
      break;
    case 'orders':
      renderOrdersList($('ordersList'));
      break;
  }
  
  $('adminPanel').classList.remove('hidden');
}

// Product Form Management
function openProductForm(plantId = null) {
  const form = $('productForm');
  const deleteBtn = $('deleteProduct');
  const title = $('productFormTitle');
  
  if (plantId) {
    // Edit mode
    const plant = getPlant(plantId);
    if (plant) {
      $('productId').value = plant.id;
      $('p_name').value = plant.name;
      $('p_species').value = plant.species || '';
      $('p_price').value = plant.price;
      $('p_stock').value = plant.stock;
      $('p_type').value = plant.type || 'trees';
      $('p_tags').value = (plant.tags || []).join(', ');
      $('p_info').value = plant.info || '';
      $('p_image').value = plant.image || '';
      title.textContent = 'Edit Product';
      deleteBtn.style.display = 'inline-block';
    }
  } else {
    // Add mode
    form.reset();
    $('productId').value = '';
    title.textContent = 'Add New Product';
    deleteBtn.style.display = 'none';
  }
  
  $('productFormModal').classList.remove('hidden');
}

function saveProductForm(event) {
  event.preventDefault();
  
  const session = getSession();
  if (!session || session.role !== 'seller') return;
  
  const plantId = $('productId').value;
  const plantData = {
    name: $('p_name').value,
    species: $('p_species').value,
    price: Number($('p_price').value),
    stock: Number($('p_stock').value),
    type: $('p_type').value,
    tags: $('p_tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
    info: $('p_info').value,
    image: $('p_image').value
  };
  
  let result;
  if (plantId) {
    result = updateSellerPlant(session.id, plantId, plantData);
  } else {
    result = addSellerPlant(session.id, plantData);
  }
  
  if (result) {
    $('productFormModal').classList.add('hidden');
    renderSellerDashboard();
    filterAndSort(); // Refresh catalog
    alert(plantId ? 'Product updated!' : 'Product added!');
  } else {
    alert('Error saving product');
  }
}

// event hookups
loadMore.addEventListener('click', ()=> renderPage()); 
globalSearch.addEventListener('input', ()=> filterAndSort()); 
sortBy.addEventListener('change', ()=> filterAndSort()); 
filterType.addEventListener('change', ()=> filterAndSort()); 
document.getElementById('priceMin').addEventListener('change', ()=> filterAndSort()); 
document.getElementById('priceMax').addEventListener('change', ()=> filterAndSort());

// tag filter buttons
document.addEventListener('click',(e)=>{ 
  if(e.target.matches('.tag')){ 
    const t = e.target.dataset.tag || e.target.dataset.type; 
    if(t) { 
      globalSearch.value = t; 
      filterAndSort(); 
    } 
  } 
});

// auth + profile UI
$('openAuth').addEventListener('click', ()=> $('authModal').classList.remove('hidden'));
$('closeAuth').addEventListener('click', ()=> $('authModal').classList.add('hidden'));
$('btnRegister').addEventListener('click', ()=>{ 
  const role = $('authRole').value; 
  const email=$('a_email').value.trim(); 
  const pw=$('a_password').value.trim(); 
  const name=$('a_name').value.trim(); 
  const res = register(role,email,pw,name); 
  if(!res.ok) return alert(res.error||'error'); 
  $('authModal').classList.add('hidden'); 
  alert('Registered and logged in'); 
  updateCartCount(); 
  updateUserInterface();
});
$('btnLogin').addEventListener('click', ()=>{ 
  const role = $('authRole').value; 
  const email=$('a_email').value.trim(); 
  const pw=$('a_password').value.trim(); 
  const res = login(role,email,pw); 
  if(!res.ok) return alert('Invalid credentials'); 
  $('authModal').classList.add('hidden'); 
  alert('Logged in'); 
  updateCartCount(); 
  updateUserInterface();
});

// profile panel
$('openProfile').addEventListener('click', renderProfile);
$('closeProfile').addEventListener('click', ()=> $('profilePanel').classList.add('hidden'));

// seller dashboard
$('openSellerDashboard').addEventListener('click', () => renderSellerDashboard());
$('closeSeller').addEventListener('click', ()=> $('sellerPanel').classList.add('hidden'));

// admin panel
$('openAdminPanel').addEventListener('click', () => renderAdminPanel());
$('closeAdmin').addEventListener('click', ()=> $('adminPanel').classList.add('hidden'));

// cart UI
$('openCart').addEventListener('click', ()=>{ $('cartPanel').classList.remove('hidden'); renderCart(); }); 
$('closeCart').addEventListener('click', ()=> $('cartPanel').classList.add('hidden'));

function renderCart(){ 
  const c = getCart(); 
  const el = $('cartMain'); 
  if(!c.length) el.innerHTML='<div style="color:#666">No items</div>'; 
  else{ 
    const total = c.reduce((sum, item) => sum + (item.price * item.qty), 0);
    el.innerHTML = c.map(it=>`
      <div class="list-item" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f0f0f0">
        <div>
          <strong>${it.name}</strong>
          <div style="font-size:13px;color:#666">₹${it.price} each</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <input data-id="${it.id}" class="cartQty" type="number" value="${it.qty}" min="1" style="width:60px">
          <button data-id="${it.id}" class="removeCart btn small secondary">Remove</button>
        </div>
      </div>
    `).join('') + `
      <div style="margin-top:16px;padding-top:16px;border-top:2px solid #eee">
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold">
          <span>Total:</span>
          <span>₹${total}</span>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button id="checkoutBtn" class="btn">Checkout</button>
          <button id="clearCart" class="btn secondary">Clear Cart</button>
        </div>
      </div>
    `; 
  }
}

// Enhanced event delegation for all dynamic elements
document.addEventListener('click',(e)=>{
  // Cart management
  if(e.target.matches('.removeCart')){ 
    removeFromCart(e.target.dataset.id); 
    renderCart(); 
    updateCartCount(); 
  }
  if(e.target.id==='clearCart'){ 
    clearCart(); 
    renderCart(); 
    updateCartCount(); 
  }
  if(e.target.id==='checkoutBtn'){ 
    const c=getCart(); 
    if(!c.length) return alert('Cart empty'); 
    const sess = getSession(); 
    if(!sess || sess.role!=='customer') return alert('Login as customer to checkout'); 
    
    // Create order
    const total = c.reduce((sum, item) => sum + (item.price * item.qty), 0);
    createOrder(sess.id, c, total);
    
    // Clear cart
    clearCart(); 
    renderCart(); 
    updateCartCount(); 
    alert('Order placed successfully!'); 
    filterAndSort(); 
  }
  if(e.target.matches('.cartQty')){ 
    const id=e.target.dataset.id; 
    const q=Number(e.target.value)||1; 
    updateQty(id,q); 
    updateCartCount(); 
  }
  
  // Seller dashboard actions
  if(e.target.matches('.edit-product')) {
    openProductForm(e.target.dataset.id);
  }
  if(e.target.matches('.delete-product')) {
    if(confirm('Are you sure you want to delete this product?')) {
      const session = getSession();
      if(deleteSellerPlant(session.id, e.target.dataset.id)) {
        renderSellerDashboard();
        filterAndSort();
        alert('Product deleted');
      }
    }
  }
  
  // Admin panel actions
  if(e.target.matches('.admin-tab')) {
    renderAdminPanel(e.target.dataset.tab);
  }
  if(e.target.matches('.delete-user')) {
    if(confirm('Are you sure you want to delete this user?')) {
      if(deleteUser(e.target.dataset.id, e.target.dataset.role)) {
        renderAdminPanel('users');
        alert('User deleted');
      }
    }
  }
  if(e.target.matches('.delete-plant')) {
    if(confirm('Are you sure you want to delete this plant?')) {
      if(deletePlant(e.target.dataset.id)) {
        renderAdminPanel('products');
        filterAndSort();
        alert('Plant deleted');
      }
    }
  }
  if(e.target.matches('.update-status')) {
    if(updateOrderStatus(e.target.dataset.id, e.target.dataset.status)) {
      renderAdminPanel('orders');
      alert('Order status updated');
    }
  }
});

// Product form events
$('addNewProduct').addEventListener('click', () => openProductForm());
$('closeProductForm').addEventListener('click', () => $('productFormModal').classList.add('hidden'));
$('productForm').addEventListener('submit', saveProductForm);
$('deleteProduct').addEventListener('click', function() {
  const plantId = $('productId').value;
  const session = getSession();
  
  if(plantId && confirm('Are you sure you want to delete this product?')) {
    if(deleteSellerPlant(session.id, plantId)) {
      $('productFormModal').classList.add('hidden');
      renderSellerDashboard();
      filterAndSort();
      alert('Product deleted');
    }
  }
});

// detail page add-to-cart
$('addToCartNow').addEventListener('click', ()=>{ 
  const id = location.hash.split('=')[1]; 
  if(!id) return; 
  const p = getPlant(id); 
  const qty = Number($('qtyNow').value)||1; 
  addToCart({ id:p.id, name:p.name, price:p.price, qty }); 
  updateCartCount(); 
  alert('Added to cart'); 
});

$('reserveNow').addEventListener('click', ()=>{ 
  const sess = getSession(); 
  if(!sess || sess.role!=='customer') return alert('Login as customer to reserve'); 
  const id = location.hash.split('=')[1]; 
  const qty = Number($('qtyNow').value)||1; 
  const r = makeReservation(sess.id, id, qty); 
  if(r.ok){ 
    alert('Reserved'); 
    filterAndSort(); 
  } else alert(r.error); 
});

// reviews
$('rev_save').addEventListener('click', ()=>{ 
  const id = location.hash.split('=')[1]; 
  if(!id) return; 
  const name = $('rev_name').value.trim()||'Anonymous'; 
  const text = $('rev_text').value.trim(); 
  if(!text) return alert('Write a review'); 
  addReview(id, name, text); 
  $('rev_name').value=''; 
  $('rev_text').value=''; 
  window.dispatchEvent(new CustomEvent('nursery_show',{detail:id})); 
});

// theme
$('themeToggle').addEventListener('click', ()=>{ 
  document.body.classList.toggle('dark'); 
  $('themeToggle').textContent = document.body.classList.contains('dark')? 'Light' : 'Dark'; 
});

function updateCartCount(){ 
  $('cartCount').textContent = String(Math.max(0, getCart().reduce((s,i)=>s+(i.qty||0),0))); 
}

// initial build
initUI();

// if hash present on load
if(location.hash.startsWith('#plant=')){ 
  const id = location.hash.split('=')[1]; 
  window.dispatchEvent(new CustomEvent('nursery_show',{detail:id})); 
}