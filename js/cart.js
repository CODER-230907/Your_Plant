// cart.js - simple cart persisted in localStorage
import { loadJSON, saveJSON, uid } from './utils.js';

const KEY='ns_cart';

export function getCart(){ 
  return loadJSON(KEY, []); 
}

export function saveCart(c){ 
  saveJSON(KEY, c); 
}

export function addToCart(item){ 
  const c = getCart(); 
  const found = c.find(x=>x.id===item.id); 
  if(found){ 
    found.qty = Math.min((found.qty||1) + (item.qty||1), 999); 
  } else { 
    c.push({ 
      id:item.id, 
      name:item.name, 
      price:item.price, 
      qty:item.qty||1 
    }); 
  } 
  saveCart(c); 
}

export function removeFromCart(id){ 
  let c = getCart(); 
  c = c.filter(x=>x.id!==id); 
  saveCart(c); 
}

export function updateQty(id, qty){ 
  const c = getCart(); 
  const it = c.find(x=>x.id===id); 
  if(it){ 
    it.qty = qty; 
    saveCart(c); 
  } 
}

export function clearCart(){ 
  saveCart([]); 
}

export function cartCount(){ 
  return getCart().reduce((s,i)=>s + (i.qty||0), 0); 
}

export function getCartTotal() {
  return getCart().reduce((total, item) => total + (item.price * item.qty), 0);
}