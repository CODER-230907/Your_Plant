// auth.js - Enhanced auth with better session management
import { loadJSON, saveJSON, uid } from './utils.js';

const KEY = {
  CUSTOMERS:'ns_customers', 
  SELLERS:'ns_sellers', 
  SESS:'ns_session'
};

export function getSession(){ 
  try{
    return JSON.parse(localStorage.getItem(KEY.SESS) || 'null'); 
  }catch(e){
    return null;
  } 
}

export function setSession(s){ 
  try{ 
    localStorage.setItem(KEY.SESS, JSON.stringify(s)); 
  }catch(e){
    console.error('setSession',e); 
  } 
}

export function ensureDemoUsers(){ 
  if(!localStorage.getItem(KEY.SELLERS)){
    const s = [ 
      { 
        id:'seller_demo_1', 
        name:'GreenLeaf Nursery', 
        email:'green@demo', 
        password:btoa('demo'), 
        createdAt:new Date().toISOString(),
        bio: 'Specializing in organic plants and trees'
      }, 
      { 
        id:'seller_demo_2', 
        name:'IndoorPro Plants', 
        email:'indoor@demo', 
        password:btoa('demo'), 
        createdAt:new Date().toISOString(),
        bio: 'Your indoor plant experts'
      } 
    ];
    saveJSON(KEY.SELLERS, s);
  }
  
  if(!localStorage.getItem(KEY.CUSTOMERS)){
    const c = [ 
      { 
        id:'cust_demo_1', 
        name:'Alice Johnson', 
        email:'alice@demo', 
        password:btoa('demo'), 
        createdAt:new Date().toISOString(), 
        saved:[], 
        orders:[],
        phone: '+91 9876543210',
        address: '123 Garden Street, Bangalore'
      } 
    ];
    saveJSON(KEY.CUSTOMERS, c);
  }
}

export function register(role, email, pw, name){ 
  if(!email||!pw||!name) return {ok:false,error:'missing'}; 
  if(role==='admin') return {ok:false,error:'no-admin'}; 
  
  const key = role==='seller'?KEY.SELLERS:KEY.CUSTOMERS; 
  const arr = loadJSON(key,[]); 
  if(arr.find(u=>u.email===email)) return {ok:false,error:'exists'}; 
  
  const id = uid(); 
  const user = { 
    id, 
    name, 
    email, 
    password:btoa(pw), 
    createdAt:new Date().toISOString(), 
    saved:[], 
    orders:[] 
  }; 
  
  arr.unshift(user); 
  saveJSON(key,arr); 
  setSession({ role, id }); 
  return {ok:true,user}; 
}

export function login(role,email,pw){ 
  if(!email||!pw) return {ok:false,error:'missing'}; 
  
  if(role==='admin'){ 
    if(pw==='DT2025'){ 
      setSession({role:'admin',id:'admin_1'}); 
      return {ok:true}; 
    } 
    return {ok:false,error:'invalid'}; 
  }
  
  const key = role==='seller'?KEY.SELLERS:KEY.CUSTOMERS; 
  const arr = loadJSON(key,[]); 
  const user = arr.find(u=>u.email===email && u.password===btoa(pw)); 
  if(!user) return {ok:false,error:'invalid'}; 
  
  setSession({role,id:user.id}); 
  return {ok:true,user}; 
}

export function logout(){ 
  localStorage.removeItem(KEY.SESS); 
}

export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  
  const key = session.role === 'seller' ? KEY.SELLERS : KEY.CUSTOMERS;
  const users = loadJSON(key, []);
  return users.find(u => u.id === session.id) || null;
}