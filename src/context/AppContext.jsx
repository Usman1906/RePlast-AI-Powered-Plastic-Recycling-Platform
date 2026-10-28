import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken } from '../utils/api';
const AppContext=createContext(null);
const emptyState={users:[],pickups:[],notifications:[],orders:[],products:[]};
export function AppProvider({children}){
 const [state,setState]=useState(emptyState);
 const [currentUser,setCurrentUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('replast_current_user')||'null')}catch{return null}});
 const [loading,setLoading]=useState(Boolean(getToken()));
 const [cart,setCartState]=useState([]);
 const getCartKey=()=>`replast_cart_${currentUser?.id}`;
 const refreshState=async()=>{
  if(!getToken())return;
  const data=await api('/bootstrap');
  setState({users:data.users||[],pickups:data.pickups||[],notifications:data.notifications||[],orders:data.orders||[],products:data.products||[]});
  setCurrentUser(data.user); localStorage.setItem('replast_current_user',JSON.stringify(data.user));
 };
 useEffect(()=>{let active=true;(async()=>{if(!getToken()){setLoading(false);return;}try{const data=await api('/bootstrap');if(!active)return;setState({users:data.users||[],pickups:data.pickups||[],notifications:data.notifications||[],orders:data.orders||[],products:data.products||[]});setCurrentUser(data.user);localStorage.setItem('replast_current_user',JSON.stringify(data.user));}catch{if(active){setCurrentUser(null);localStorage.removeItem('replast_current_user');}}finally{if(active)setLoading(false);}})();return()=>{active=false}},[]);
 useEffect(()=>{if(!currentUser?.id){setCartState([]);return;}try{setCartState(JSON.parse(localStorage.getItem(getCartKey())||'[]'))}catch{setCartState([])}},[currentUser?.id]);
 const login=async(email,password)=>{try{const data=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});localStorage.setItem('replast_token',data.token);localStorage.setItem('replast_current_user',JSON.stringify(data.user));setCurrentUser(data.user);setState({users:data.bootstrap.users||[],pickups:data.bootstrap.pickups||[],notifications:data.bootstrap.notifications||[],orders:data.bootstrap.orders||[],products:data.bootstrap.products||[]});return {ok:true,user:data.user};}catch(e){return {ok:false,message:e.message}}};
 const signup=async({name,email,phone,password})=>{try{const data=await api('/auth/signup',{method:'POST',body:JSON.stringify({name,email,phone,password})});localStorage.setItem('replast_token',data.token);localStorage.setItem('replast_current_user',JSON.stringify(data.user));setCurrentUser(data.user);setState({users:data.bootstrap.users||[],pickups:data.bootstrap.pickups||[],notifications:data.bootstrap.notifications||[],orders:data.bootstrap.orders||[],products:data.bootstrap.products||[]});return {ok:true,user:data.user};}catch(e){return {ok:false,message:e.message}}};
 const logout=()=>{localStorage.removeItem('replast_token');localStorage.removeItem('replast_current_user');setCurrentUser(null);setState(emptyState);setCartState([])};
 const addPickup=async(payload)=>{try{const pickup=await api('/pickups',{method:'POST',body:JSON.stringify(payload)});await refreshState();return {ok:true,pickup};}catch(e){return {ok:false,message:e.message}}};
 const setPickupAIResult=async(id,result)=>{try{await api(`/pickups/${id}/ai`,{method:'PATCH',body:JSON.stringify(result)});await refreshState();return {ok:true};}catch(e){return {ok:false,message:e.message}}};
 const approvePickup=async(id,rewardPoints,availableDates,slots)=>{try{await api(`/pickups/${id}/approve`,{method:'POST',body:JSON.stringify({rewardPoints,availableDates,slots})});await refreshState();return {ok:true};}catch(e){return {ok:false,message:e.message}}};
 const rejectPickup=async(id)=>{try{await api(`/pickups/${id}/reject`,{method:'POST',body:'{}'});await refreshState();return {ok:true};}catch(e){return {ok:false,message:e.message}}};
 const schedulePickup=async(id,date,slot)=>{try{await api(`/pickups/${id}/schedule`,{method:'POST',body:JSON.stringify({date,slot})});await refreshState();return {ok:true};}catch(e){return {ok:false,message:e.message}}};
 const updatePickupStatus=async(id,status)=>{try{await api(`/pickups/${id}/status`,{method:'PATCH',body:JSON.stringify({status})});await refreshState();return {ok:true};}catch(e){return {ok:false,message:e.message}}};
 const markNotificationsRead=async()=>{try{await api('/notifications/read',{method:'PATCH',body:'{}'});setState(s=>({...s,notifications:s.notifications.map(n=>n.userId===currentUser?.id?{...n,read:true}:n)}));}catch{}};
 const redeem=async(product,quantity)=>purchaseCart([{...product,quantity}]);
 const purchaseCart=async(items)=>{try{const order=await api('/orders',{method:'POST',body:JSON.stringify({items:items.map(({id,quantity})=>({id,quantity}))})});await refreshState();return {ok:true,order};}catch(e){return {ok:false,message:e.message}}};
 const setCart=(items)=>{setCartState(items);if(currentUser?.id)localStorage.setItem(getCartKey(),JSON.stringify(items));window.dispatchEvent(new Event('replast-cart-change'));};
 const addToCart=(product)=>{const existing=cart.find(x=>x.id===product.id);if(existing)setCart(cart.map(x=>x.id===product.id?{...x,quantity:x.quantity+1}:x));else setCart([...cart,{...product,cartId:Date.now(),quantity:1}]);};
 const removeFromCart=(cartId)=>setCart(cart.filter(x=>x.cartId!==cartId));
 const changeQty=(cartId,quantity)=>setCart(cart.map(x=>x.cartId===cartId?{...x,quantity:Math.max(1,quantity)}:x));
 const clearCart=()=>setCart([]);

 const addProduct=async(formData)=>{try{await api('/admin/products',{method:'POST',body:formData});await refreshState();return {ok:true};}catch(e){return {ok:false,message:e.message}}};
 const updateProduct=async(id,updates)=>{try{await api(`/admin/products/${id}`,{method:'PATCH',body:updates instanceof FormData?updates:JSON.stringify(updates)});await refreshState();return {ok:true};}catch(e){return {ok:false,message:e.message}}};
 const deleteProduct=async(id)=>{try{await api(`/admin/products/${id}`,{method:'DELETE'});await refreshState();return {ok:true};}catch(e){return {ok:false,message:e.message}}};
 const deleteUser=async(id)=>{try{await api(`/admin/users/${id}`,{method:'DELETE'});await refreshState();return {ok:true};}catch(e){return {ok:false,message:e.message}}};
 const updateUser=async(id,updates)=>{try{await api(`/admin/users/${id}`,{method:'PATCH',body:JSON.stringify(updates)});await refreshState();return {ok:true};}catch(e){return {ok:false,message:e.message}}};
 const user=currentUser?.role==='user'?(state.users.find(u=>u.id===currentUser.id)||currentUser):currentUser;
 const userPickups=state.pickups.filter(p=>p.userId===currentUser?.id);
 const userNotifications=state.notifications.filter(n=>n.userId===currentUser?.id);
 const value=useMemo(()=>({...state,user,currentUser,loading,login,signup,logout,refreshState,addPickup,setPickupAIResult,approvePickup,rejectPickup,schedulePickup,updatePickupStatus,markNotificationsRead,redeem,purchaseCart,cart,addToCart,removeFromCart,changeQty,clearCart,userPickups,userNotifications,deleteUser,updateUser,addProduct,updateProduct,deleteProduct}),[state,currentUser,loading,cart]);
 return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export const useApp=()=>useContext(AppContext);
