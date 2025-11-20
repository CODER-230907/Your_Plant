// plants.js - plant data management + render helpers
import { loadJSON, saveJSON, uid, placeholderSvg } from './utils.js';

const KEY = { PLANTS:'ns_plants', REV_PREFIX:'ns_reviews_', RES:'ns_reservations' };

export function ensurePlants(){ 
  if(!localStorage.getItem(KEY.PLANTS)){
    if(window.FALLBACK_ALL && window.FALLBACK_ALL.length){ 
      saveJSON(KEY.PLANTS, window.FALLBACK_ALL); 
    } else { 
      const sample = [
        { 
          id:'tree0001', 
          name:'Neem', 
          species:'Azadirachta indica', 
          price:299, 
          stock:12, 
          type:'trees', 
          tags:['medicinal','shade'], 
          image:'', 
          info:'Hardy tree, good for large gardens',
          vendor_id:'seller_demo_1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id:'indoor0001',
          name:'Snake Plant',
          species:'Sansevieria trifasciata',
          price:249,
          stock:6,
          type:'indoor',
          tags:['low-light','air-purifying'],
          image:'',
          info:'Low maintenance indoor plant',
          vendor_id:'seller_demo_2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]; 
      saveJSON(KEY.PLANTS, sample); 
    }
  }
}

export function listPlants(){ return loadJSON(KEY.PLANTS, []); }
export function savePlants(arr){ saveJSON(KEY.PLANTS, arr); }
export function getPlant(id){ return listPlants().find(p=>p.id===id); }

export function makeReservation(customerId, plantId, qty){ 
  const plants = listPlants(); 
  const p = plants.find(x=>x.id===plantId); 
  if(!p) return { ok:false, error:'Plant not found' }; 
  if(p.stock < qty) return { ok:false, error:'Not enough stock' }; 
  p.stock = p.stock - qty;
  p.updatedAt = new Date().toISOString();
  savePlants(plants); 
  const res = loadJSON(KEY.RES,[]); 
  const rec = { id: uid(), customerId, plantId, plantName: p.name, qty, status:'pending', createdAt:new Date().toISOString() }; 
  res.unshift(rec); 
  saveJSON(KEY.RES, res); 
  return { ok:true, rec }; 
}

export function getReviewsFor(plantId){ return loadJSON(KEY.REV_PREFIX + plantId, []); }
export function addReview(plantId, name, text){ 
  if(!text) return; 
  const key = KEY.REV_PREFIX + plantId; 
  const arr = loadJSON(key, []); 
  arr.unshift({ id: uid(), name: name||'Anonymous', text, createdAt: new Date().toISOString() }); 
  saveJSON(key, arr); 
}

// Render helpers
export function createPlantCardElement(p){ 
  const el = document.createElement('div'); 
  el.className='plant-card'; 
  el.dataset.id=p.id; 
  const imgSrc = p.image || placeholderSvg(p.name); 
  el.innerHTML = `
    <img loading="lazy" src="${imgSrc}" alt="${p.name}" />
    <h3>${p.name}</h3>
    <p style="margin:6px 0 4px 0;color:#556">${p.species||''}</p>
    <p class="price">₹${p.price||0}</p>
    <p class="stock">Stock: ${p.stock||0}</p>
  `;
  el.addEventListener('click', ()=>{ window.dispatchEvent(new CustomEvent('nursery_show', { detail: p.id })); });
  return el; 
}