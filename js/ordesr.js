// orders.js - Order history and management
import { loadJSON, saveJSON, uid } from './utils.js';

const KEY = {
  ORDERS: 'ns_orders',
  ORDER_ITEMS: 'ns_order_items_'
};

export function createOrder(customerId, items, total) {
  const orders = loadJSON(KEY.ORDERS, []);
  const orderId = uid();
  
  const order = {
    id: orderId,
    customerId,
    items: items.map(item => ({
      plantId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.qty
    })),
    total,
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  orders.unshift(order);
  saveJSON(KEY.ORDERS, orders);
  
  // Save order items separately for better querying
  saveJSON(KEY.ORDER_ITEMS + orderId, items);
  
  return order;
}

export function getCustomerOrders(customerId) {
  const orders = loadJSON(KEY.ORDERS, []);
  return orders.filter(order => order.customerId === customerId)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getAllOrders() {
  return loadJSON(KEY.ORDERS, []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function updateOrderStatus(orderId, status) {
  const orders = loadJSON(KEY.ORDERS, []);
  const order = orders.find(o => o.id === orderId);
  
  if (order) {
    order.status = status;
    order.updatedAt = new Date().toISOString();
    saveJSON(KEY.ORDERS, orders);
    return true;
  }
  
  return false;
}

export function getOrderStats() {
  const orders = getAllOrders();
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
  
  return {
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100
  };
}