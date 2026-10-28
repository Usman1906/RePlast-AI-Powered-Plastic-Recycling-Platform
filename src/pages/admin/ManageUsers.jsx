import React, { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function ManageUsers(){
 const {users,pickups,deleteUser,updateUser}=useApp(); const [q,setQ]=useState(""); const [message,setMessage]=useState(""); const [busyId,setBusyId]=useState(null);
 const remove=async id=>{if(!window.confirm("Delete this user and their associated pickup/order history? This cannot be undone."))return;setBusyId(id);const r=await deleteUser(id);setBusyId(null);setMessage(r.ok?"User deleted.":r.message);};
 const toggle=async u=>{setBusyId(u.id);const r=await updateUser(u.id,{isActive:u.isActive===false});setBusyId(null);setMessage(r.ok?`Account ${u.isActive===false?"enabled":"disabled"}.`:r.message);};
 const changePoints=async u=>{const value=window.prompt(`Set reward points for ${u.name}:`,String(u.points));if(value===null)return;const points=Number(value);if(!Number.isInteger(points)||points<0){setMessage("Points must be a non-negative whole number.");return;}setBusyId(u.id);const r=await updateUser(u.id,{points});setBusyId(null);setMessage(r.ok?"Reward balance updated.":r.message);};
 const list=users.filter(u=>u.role==="user"&&(u.name+" "+u.email).toLowerCase().includes(q.toLowerCase()));
 return <div><div className="page-title"><div><span className="eyebrow">COMMUNITY</span><h1>Manage users</h1><p>View user participation, recycling activity and reward balances.</p></div></div>
 <div className="panel">{message&&<div className="alert">{message}</div>}<div className="toolbar"><div className="search"><Search size={18}/><input placeholder="Search by name or email..." value={q} onChange={e=>setQ(e.target.value)}/></div><span className="muted">{list.length} users</span></div>
 <div className="table-wrap"><table><thead><tr><th>User</th><th>Contact</th><th>Pickups</th><th>Recycled</th><th>Wallet</th><th>Account</th><th>Manage</th></tr></thead><tbody>{list.map(u=>{const ps=pickups.filter(p=>p.userId===u.id);return <tr key={u.id}><td><div className="user-cell"><div className="avatar">{u.name[0]}</div><div><strong>{u.name}</strong><small>#{u.id}</small></div></div></td><td>{u.email}<br/><small>{u.phone}</small></td><td>{ps.length}</td><td>{u.recycledKg.toFixed(1)} kg</td><td><b className="points">{u.points} pts</b></td><td>{u.isActive===false?"Disabled":"Active"}</td><td><div className="user-actions"><button className="btn btn-secondary small" disabled={busyId===u.id} onClick={()=>toggle(u)}>{u.isActive===false?"Enable":"Disable"}</button><button className="btn btn-secondary small" disabled={busyId===u.id} onClick={()=>changePoints(u)}>Edit points</button><button className="btn btn-danger small" disabled={busyId===u.id} onClick={()=>remove(u.id)}><Trash2 size={14}/>Delete</button></div></td></tr>})}</tbody></table></div></div>
 </div>;
}
