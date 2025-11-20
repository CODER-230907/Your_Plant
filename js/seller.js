// seller.js - Seller dashboard and inventory management
import { listPlants, savePlants, getPlant } from './plants.js';
import { getAllOrders } from './orders.js';
import { loadJSON, saveJSON, uid } from './utils.js';

export function getSellerPlants(sellerId) {
  const plants = listPlants();
  return plants.filter(plant => plant.vendor_id === sellerId);
}

export function addSellerPlant(sellerId, plantData) {
  const plants = listPlants();
  const newPlant = {
    id: uid(),
    ...plantData,
    vendor_id: sellerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  plants.unshift(newPlant);
  savePlants(plants);
  return newPlant;
}

export function updateSellerPlant(sellerId, plantId, plantData) {
  const plants = listPlants();
  const plantIndex = plants.findIndex(p => p.id === plantId && p.vendor_id === sellerId);
  
  if (plantIndex !== -1) {
    plants[plantIndex] = {
      ...plants[plantIndex],
      ...plantData,
      updatedAt: new Date().toISOString()
    };
    savePlants(plants);
    return plants[plantIndex];
  }
  
  return null;
}

export function deleteSellerPlant(sellerId, plantId) {
  const plants = listPlants();
  const filteredPlants = plants.filter(p => !(p.id === plantId && p.vendor_id === sellerId));
  
  if (filteredPlants.length !== plants.length) {
    savePlants(filteredPlants);
    return true;
  }
  
  return false;
}

export function getSellerAnalytics(sellerId) {
  const sellerPlants = getSellerPlants(sellerId);
  const orders = getAllOrders();
  
  // Calculate sales from orders that include seller's plants
  let totalSales = 0;
  let salesCount = 0;
  
  orders.forEach(order => {
    order.items.forEach(item => {
      const plant = getPlant(item.plantId);
      if (plant && plant.vendor_id === sellerId) {
        totalSales += item.price * item.quantity;
        salesCount += item.quantity;
      }
    });
  });
  
  const lowStockCount = sellerPlants.filter(p => p.stock < 5).length;
  
  return {
    totalProducts: sellerPlants.length,
    totalSales: Math.round(totalSales * 100) / 100,
    salesCount,
    lowStockCount
  };
}

export function renderSellerProducts(sellerId, container) {
  const plants = getSellerPlants(sellerId);
  
  if (!plants.length) {
    container.innerHTML = '<div style="color:#666;text-align:center;padding:20px">No products yet. Add your first plant!</div>';
    return;
  }
  
  container.innerHTML = plants.map(plant => `
    <div class="product-item" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid #eee">
      <div>
        <strong>${plant.name}</strong>
        <div style="font-size:13px;color:#666">${plant.species || 'No species'}</div>
        <div style="font-size:13px">
          ₹${plant.price} • Stock: ${plant.stock} • Type: ${plant.type}
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn small edit-product" data-id="${plant.id}">Edit</button>
        <button class="btn small secondary delete-product" data-id="${plant.id}">Delete</button>
      </div>
    </div>
  `).join('');
}