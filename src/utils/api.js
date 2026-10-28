export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');
export function getToken(){return localStorage.getItem('replast_token')||'';}
export async function api(path, options={}){
 const headers={...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(options.headers||{})};
 const token=getToken(); if(token) headers.Authorization=`Bearer ${token}`;
 const response=await fetch(`${API_BASE}${path}`,{...options,headers});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){if(response.status===401){localStorage.removeItem('replast_token');localStorage.removeItem('replast_current_user');}throw new Error(data.message||`Request failed (${response.status})`);}
 return data;
}
