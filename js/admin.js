// admin.js - Admin panel for user and content management
import { listPlants, savePlants } from '../plants.js';
import { getAllOrders, updateOrderStatus } from './orders.js';
import { loadJSON } from '../utils.js';

const KEY = {
  CUSTOMERS: 'ns_customers',
  SELLERS: 'ns_sellers'
};

export function getAllUsers() {
  const customers = loadJSON(KEY.CUSTOMERS, []);
  const sellers = loadJSON(KEY.SELLERS, []);
  
  return [
    ...customers.map(c => ({ ...c, role: 'customer' })),
    ...sellers.map(s => ({ ...s, role: 'seller' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function deleteUser(userId, role) {
  const key = role === 'seller' ? KEY.SELLERS : KEY.CUSTOMERS;
  const users = loadJSON(key, []);
  const filteredUsers = users.filter(u => u.id !== userId);
  
  if (filteredUsers.length !== users.length) {
    localStorage.setItem(key, JSON.stringify(filteredUsers));
    
    // If seller is deleted, also remove their plants
    if (role === 'seller') {
      const plants = listPlants();
      const filteredPlants = plants.filter(p => p.vendor_id !== userId);
      savePlants(filteredPlants);
    }
    
    return true;
  }
  
  return false;
}

export function renderUsersList(container) {
  const users = getAllUsers();
  
  container.innerHTML = users.map(user => `
    <div class="user-item" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid #eee">
      <div>
        <strong>${user.name}</strong>
        <div style="font-size:13px;color:#666">
          ${user.email} • ${user.role} • Joined: ${new Date(user.createdAt).toLocaleDateString()}
        </div>
      </div>
      <button class="btn small secondary delete-user" data-id="${user.id}" data-role="${user.role}">
        Delete
      </button>
    </div>
  `).join('');
}

export function renderProductsList(container) {
  const plants = listPlants();
  
  container.innerHTML = plants.map(plant => `
    <div class="product-item" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid #eee">
      <div style="flex:1">
        <strong>${plant.name}</strong>
        <div style="font-size:13px;color:#666">
          ${plant.species || 'No species'} • Vendor: ${plant.vendor_id}
        </div>
        <div style="font-size:13px">
          ₹${plant.price} • Stock: ${plant.stock} • Type: ${plant.type}
        </div>
      </div>
      <button class="btn small secondary delete-plant" data-id="${plant.id}">
        Delete
      </button>
    </div>
  `).join('');
}

export function renderOrdersList(container) {
  const orders = getAllOrders();
  
  container.innerHTML = orders.map(order => `
    <div class="order-item" style="padding:12px;border-bottom:1px solid #eee">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <strong>Order #${order.id.slice(-6)}</strong>
        <span class="status-badge ${order.status}">${order.status}</span>
      </div>
      <div style="font-size:13px;color:#666">
        Customer: ${order.customerId} • Date: ${new Date(order.createdAt).toLocaleString()}
      </div>
      <div style="margin-top:8px">
        ${order.items.map(item => `
          <div style="font-size:13px">
            ${item.name} - ₹${item.price} x ${item.quantity}
          </div>
        `).join('')}
      </div>
      <div style="margin-top:8px;display:flex;gap:8px">
        <strong>Total: ₹${order.total}</strong>
        ${order.status === 'completed' ? `
          <button class="btn small secondary update-status" data-id="${order.id}" data-status="shipped">
            Mark Shipped
          </button>
        ` : order.status === 'shipped' ? `
          <button class="btn small secondary update-status" data-id="${order.id}" data-status="delivered">
            Mark Delivered
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

export function deletePlant(plantId) {
  const plants = listPlants();
  const filteredPlants = plants.filter(p => p.id !== plantId);
  
  if (filteredPlants.length !== plants.length) {
    savePlants(filteredPlants);
    return true;
  }
  
  return false;
}