import React, { useState } from "react";
import { CheckCircle2, XCircle, CalendarClock, Truck, ScanLine, LoaderCircle, ShieldCheck, AlertTriangle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import StatusBadge from "../../components/StatusBadge";
import { classifyPlastic } from "../../utils/plasticClassifier";
import { API_ORIGIN } from "../../utils/api";

function RequestCard({ p, user, onApprove, onReject, onStatus, onAIResult }) {
 const [points,setPoints]=useState(Math.round(Number(p.quantity)*100));
 const [dates,setDates]=useState("2026-10-10,2026-10-11,2026-10-12");
 const [slotText,setSlotText]=useState("09:00 AM - 10:00 AM,12:00 PM - 01:00 PM,03:00 PM - 04:00 PM,05:00 PM - 06:00 PM");
 const [scanning,setScanning]=useState(false);
 const [scanError,setScanError]=useState("");
 const [actionError,setActionError]=useState("");
 const approve=async()=>{setActionError("");const r=await onApprove(p.id,points,dates.split(",").map(x=>x.trim()).filter(Boolean),slotText.split(",").map(x=>x.trim()).filter(Boolean));if(!r?.ok)setActionError(r?.message||"Approval failed.");};
 const scan=async()=>{
   if(!p.image) return setScanError("No image was uploaded with this request.");
   setScanning(true); setScanError("");
   try {
     const img=new Image(); img.src=p.image.startsWith("data:") || p.image.startsWith("http") ? p.image : `${API_ORIGIN}${p.image}`;
     await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});
     const result=await classifyPlastic(img);
     const saved=await onAIResult(p.id,result); if(saved?.ok===false) setScanError(saved.message||"Could not save AI result.");
   } catch(e) { setScanError("AI scan could not be completed. Please try again with a clear JPG or PNG image."); }
   finally { setScanning(false); }
 };
 const aiReady=Boolean(p.aiClassification);
 const isPlastic=p.aiClassification==="plastic";
 return <div className="request-card">
   <div className="request-head"><div><h3>{p.plasticType} · {p.quantity} kg</h3><p>Requested by <b>{user?.name}</b> · {p.createdAt}</p></div><StatusBadge status={p.status}/></div>
   <div className="request-body">
     <div><span>Address</span><strong>{p.address}</strong></div><div><span>Description</span><strong>{p.description}</strong></div>
     {p.image?<img className="request-image" src={p.image.startsWith("data:") || p.image.startsWith("http") ? p.image : `${API_ORIGIN}${p.image}`} alt="Uploaded waste"/>:<div className="ai-warning"><AlertTriangle size={16}/> No verification image available.</div>}
   </div>
   {p.status==="pending"&&<>
     <div className="ai-scan-panel">
       <div><span className="ai-label"><ShieldCheck size={16}/> TensorFlow AI verification</span>
       {aiReady?<p className={isPlastic?"ai-positive":"ai-negative"}><strong>{isPlastic?"PLASTIC":"NOT PLASTIC"}</strong> · {Math.round((p.aiConfidence||0)*100)}% confidence</p>:<p>Scan the uploaded image before approval. TensorFlow.js analyzes the image locally in this browser.</p>}</div>
       <button className="btn btn-secondary" onClick={scan} disabled={scanning||!p.image}>{scanning?<><LoaderCircle size={16} className="spin"/>Scanning...</>:<><ScanLine size={16}/>Scan image</>}</button>
     </div>
     {scanError&&<div className="ai-error">{scanError}</div>}
     {aiReady&&<div className="ai-labels">Top AI labels: {(p.aiLabels||[]).slice(0,3).map(x=>`${x.label} (${Math.round(x.confidence*100)}%)`).join(" · ")}</div>}
     {aiReady&&isPlastic&&<div className="approval-controls"><label>Reward points<input type="number" min="0" value={points} onChange={e=>setPoints(e.target.value)}/></label><label>Available dates<input value={dates} onChange={e=>setDates(e.target.value)} /></label><label className="wide-control">Time slots<input value={slotText} onChange={e=>setSlotText(e.target.value)} /></label><div className="approval-actions"><button className="btn btn-primary" onClick={approve}><CheckCircle2 size={17}/>Approve & assign slots</button><button className="btn btn-danger" onClick={()=>onReject(p.id)}><XCircle size={17}/>Reject</button></div></div>}
     {aiReady&&!isPlastic&&<div className="ai-warning"><AlertTriangle size={16}/> AI classified this image as non-plastic. Approval is blocked until a valid plastic image is uploaded and scanned.</div>}
   </>}
   {p.status==="scheduled"&&<div className="admin-status-actions"><span>📅 {p.date} · ⏰ {p.slot}</span><button className="btn btn-secondary small" onClick={()=>onStatus(p.id,"picked")}><Truck size={15}/> Mark picked up</button></div>}
   {p.status==="picked"&&<div className="admin-status-actions"><span>Ready for recycling verification.</span><button className="btn btn-primary small" onClick={()=>onStatus(p.id,"recycled")}><CheckCircle2 size={15}/> Mark recycled</button></div>}
   {p.status==="recycled"&&<div className="success-strip">✓ Recycling completed · {p.rewardPoints} points awarded</div>}
 </div>;
}

export default function CreateSchedules(){
 const {pickups,users,approvePickup,rejectPickup,updatePickupStatus,setPickupAIResult}=useApp(); const [filter,setFilter]=useState("all");
 const list=pickups.filter(p=>filter==="all"||p.status===filter);
 return <div><div className="page-title"><div><span className="eyebrow">AI VERIFICATION & OPERATIONS</span><h1>Recycling approvals</h1><p>Scan uploaded images with TensorFlow AI, verify plastic, then approve and assign available pickup slots.</p></div><div className="title-icon"><CalendarClock/></div></div>
 <div className="filter-tabs">{["all","pending","approved","scheduled","picked","recycled","rejected"].map(x=><button className={filter===x?"active":""} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div>
 <div className="request-list">{list.map(p=><RequestCard key={p.id} p={p} user={users.find(u=>u.id===p.userId)} onApprove={approvePickup} onReject={rejectPickup} onStatus={updatePickupStatus} onAIResult={setPickupAIResult}/>)}{!list.length&&<div className="empty-page"><CalendarClock/><h2>No requests in this status</h2><p>New user pickup requests will appear here.</p></div>}</div>
 </div>;
}
