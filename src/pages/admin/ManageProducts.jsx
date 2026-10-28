import React, { useEffect, useState } from "react";
import { ImagePlus, PackagePlus, Pencil, Trash2, Ban, CheckCircle2, RefreshCw } from "lucide-react";
import { api, API_ORIGIN } from "../../utils/api";

const blank = { name: "", price: "", description: "", category: "Eco Products", emoji: "♻️", stockQuantity: "0", stockStatus: "IN_STOCK", isActive: true };
export default function ManageProducts() {
  const [products, setProducts] = useState([]); const [form, setForm] = useState(blank); const [image, setImage] = useState(null);
  const [editing, setEditing] = useState(null); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const load = async () => { setLoading(true); setError(""); try { setProducts(await api("/admin/products")); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const reset = () => { setForm(blank); setImage(null); setEditing(null); const el = document.getElementById("product-image-input"); if (el) el.value = ""; };
  const submit = async (e) => { e.preventDefault(); setSaving(true); setError(""); setNotice(""); try {
    const body = new FormData(); Object.entries(form).forEach(([k,v]) => body.append(k, String(v)));
    if (image) body.append("image", image);
    const path = editing ? `/admin/products/${editing}` : "/admin/products";
    await api(path, { method: editing ? "PATCH" : "POST", body }); await load(); reset(); setNotice(editing ? "Product updated successfully." : "Product added successfully.");
  } catch (e) { setError(e.message); } finally { setSaving(false); } };
  const edit = (p) => { setEditing(p.id); setForm({ name:p.name||"", price:String(p.price||""), description:p.description||"", category:p.category||"Eco Products", emoji:p.emoji||"♻️", stockQuantity:String(p.stockQuantity??0), stockStatus:p.stockStatus||"IN_STOCK", isActive:p.isActive!==false }); setImage(null); window.scrollTo({top:0,behavior:"smooth"}); };
  const patch = async (p, updates, success) => { setError(""); setNotice(""); try { await api(`/admin/products/${p.id}`, {method:"PATCH",body:JSON.stringify(updates)}); await load(); setNotice(success); } catch(e) {setError(e.message);} };
  const archive = async (p) => { if (!window.confirm(`Remove ${p.name} from the shop? Past orders will be preserved.`)) return; try { await api(`/admin/products/${p.id}`,{method:"DELETE"}); await load(); setNotice("Product removed from the shop. Historical orders are preserved."); } catch(e) {setError(e.message);} };
  return <div>
    <div className="page-title"><div><span className="eyebrow">SHOP MANAGEMENT</span><h1>Manage products</h1><p>Add products, upload photos, update prices and control stock availability.</p></div><button className="btn btn-secondary" onClick={load}><RefreshCw size={16}/> Refresh</button></div>
    {error && <div className="alert alert-error" role="alert">{error}</div>}{notice && <div className="alert alert-success" role="status">{notice}</div>}
    <section className="panel product-admin-form"><div className="panel-head"><div><h3>{editing ? "Edit product" : "Add a new product"}</h3><p>Image, price, inventory and visibility settings.</p></div>{editing && <button className="btn btn-secondary small" type="button" onClick={reset}>Cancel edit</button>}</div>
      <form onSubmit={submit}><div className="form-grid">
        <label>Product name *<input required maxLength="180" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Recycled Tote Bag"/></label>
        <label>Price (reward points) *<input required type="number" min="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="350"/></label>
        <label>Category<input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Eco Products"/></label>
        <label>Display emoji<input value={form.emoji} onChange={e=>setForm({...form,emoji:e.target.value})} maxLength="16" placeholder="♻️"/></label>
        <label>Available stock quantity *<input required type="number" min="0" value={form.stockQuantity} onChange={e=>setForm({...form,stockQuantity:e.target.value,stockStatus:Number(e.target.value)===0?"OUT_OF_STOCK":"IN_STOCK"})}/></label>
        <label>Stock label<select value={Number(form.stockQuantity)===0?"OUT_OF_STOCK":form.stockStatus} onChange={e=>setForm({...form,stockStatus:e.target.value,stockQuantity:e.target.value==="OUT_OF_STOCK"?"0":form.stockQuantity})}><option value="IN_STOCK">In stock</option><option value="LOW_STOCK">Low stock</option><option value="OUT_OF_STOCK">Out of stock</option></select></label>
        <label className="full-span">Product description<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the product and its eco-friendly benefits"/></label>
        <label className="full-span">Product image (JPG, PNG, WEBP or GIF, max 8 MB)<input id="product-image-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required={!editing} onChange={e=>setImage(e.target.files?.[0]||null)}/>{image && <small>Selected: {image.name}</small>}</label>
        {editing && <label className="checkbox-label"><input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})}/> Visible in shop</label>}
      </div><div className="form-actions"><button className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : <><PackagePlus size={17}/>{editing ? "Save changes" : "Add product"}</>}</button></div></form>
    </section>
    <section className="panel"><div className="panel-head"><div><h3>Product inventory</h3><p>{products.length} product(s), including archived items.</p></div></div>
      {loading ? <p>Loading products…</p> : products.length===0 ? <p>No products found.</p> : <div className="admin-product-list">{products.map(p=><article className={`admin-product-row ${p.isActive===false?"product-archived":""}`} key={p.id}>
        <div className="admin-product-thumb">{p.imageUrl ? <img src={`${API_ORIGIN}${p.imageUrl}`} alt={p.name}/> : <span>{p.emoji||"♻️"}</span>}</div>
        <div className="admin-product-info"><div className="admin-product-title"><strong>{p.name}</strong><span className={`stock-pill ${(p.stockStatus||"IN_STOCK").toLowerCase().replaceAll("_","-")}`}>{p.isActive===false?"Archived":(p.stockStatus||"IN_STOCK").replaceAll("_"," ")}</span></div><p>{p.description||"No description"}</p><small>{p.category||"Eco Products"} · Stock: {p.stockQuantity??0}</small><b>{p.price} points</b></div>
        <div className="admin-product-actions"><button className="btn btn-secondary small" onClick={()=>edit(p)}><Pencil size={14}/> Edit</button>
          {p.isActive!==false && <button className="btn btn-secondary small" onClick={()=>patch(p,{stockQuantity:0,stockStatus:"OUT_OF_STOCK"},"Product marked out of stock.")}><Ban size={14}/> Out of stock</button>}
          {p.isActive!==false && <button className="btn btn-secondary small" onClick={()=>patch(p,{stockQuantity:Math.max(1,Number(p.stockQuantity)||1),stockStatus:"IN_STOCK"},"Product marked in stock.")}><CheckCircle2 size={14}/> In stock</button>}
          {p.isActive!==false && <button className="btn btn-danger small" onClick={()=>archive(p)}><Trash2 size={14}/> Remove</button>}
        </div>
      </article>)}</div>}
    </section>
  </div>;
}
