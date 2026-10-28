import React, { useState } from "react";
import { ImagePlus, Upload, Recycle, Home, CheckCircle2, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import SuccessModal from "../../components/SuccessModal";

const emptyForm = {
  plasticType: "PET Bottles",
  quantity: "",
  description: "",
  houseLandmark: "",
  street: "",
  pincode: "",
  city: ""
};

export default function Pickup() {
  const { addPickup } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState("");
  const [imageName, setImageName] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const update = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const imageChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      e.target.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setImage("");
      setImageName("");
      e.target.value = "";
      setError("Image must be smaller than 8 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setImageName(file.name);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const submit = async e => {
    e.preventDefault();

    const quantity = Number(form.quantity);
    const valid =
      form.plasticType &&
      quantity > 0 &&
      form.description.trim() &&
      form.street.trim() &&
      /^\d{6}$/.test(form.pincode.trim()) &&
      form.city.trim() &&
      image;

    if (!valid) {
      setError("Please complete the required plastic details, address fields and upload an image before submitting.");
      return;
    }

    const address = [form.houseLandmark.trim(), form.street.trim(), form.city.trim(), form.pincode.trim()]
      .filter(Boolean)
      .join(", ");

    const result = await addPickup({
      ...form,
      quantity,
      address,
      image,
      lat: null,
      lng: null
    });
    if (!result.ok) { setError(result.message); return; }

    setForm(emptyForm);
    setImage("");
    setImageName("");
    setError("");
    setOpen(true);
  };

  const submitDisabled =
    !form.plasticType ||
    Number(form.quantity) <= 0 ||
    !form.description.trim() ||
    !form.street.trim() ||
    !/^\d{6}$/.test(form.pincode.trim()) ||
    !form.city.trim() ||
    !image;

  return (
    <div>
      <div className="page-title">
        <div>
          <span className="eyebrow">RECYCLE RESPONSIBLY</span>
          <h1>Request a pickup</h1>
          <p>Enter your pickup address and upload a photo of your plastic waste.</p>
        </div>
        <div className="title-icon"><Recycle /></div>
      </div>

      <form className="form-panel" onSubmit={submit}>
        <div className="form-grid">
          <label>
            Plastic type
            <select name="plasticType" value={form.plasticType} onChange={update}>
              <option>PET Bottles</option>
              <option>HDPE</option>
              <option>LDPE</option>
              <option>PP</option>
              <option>Mixed Plastic</option>
            </select>
          </label>

          <label>
            Quantity (kg)
            <input type="number" min="0.1" step="0.1" name="quantity" value={form.quantity} onChange={update} placeholder="e.g. 5" required />
          </label>

          <label className="full-span">
            Description
            <textarea name="description" value={form.description} onChange={update} placeholder="Describe the plastic waste, condition, approximate count, etc." rows="4" required />
          </label>

          <div className="full-span address-details-panel">
            <div className="address-section-title">
              <div>
                <h3><Home size={18} /> Pickup address</h3>
                <p>Keep it simple. Enter the address where our recycling team should collect the waste.</p>
              </div>
            </div>

            <div className="simple-address-grid">
              <label>
                Flat No. / Landmark <span className="optional-label">(optional)</span>
                <input name="houseLandmark" value={form.houseLandmark} onChange={update} placeholder="e.g. Flat 204 / Near Malla Reddy University" />
              </label>

              <label>
                Street Name *
                <input name="street" value={form.street} onChange={update} placeholder="e.g. Maisammaguda Main Road" required />
              </label>

              <label>
                Pincode *
                <input
                  name="pincode"
                  inputMode="numeric"
                  maxLength="6"
                  value={form.pincode}
                  onChange={e => update({ target: { name: "pincode", value: e.target.value.replace(/\D/g, "").slice(0, 6) } })}
                  placeholder="e.g. 500043"
                  required
                />
              </label>

              <label>
                City *
                <input name="city" value={form.city} onChange={update} placeholder="e.g. Hyderabad" required />
              </label>
            </div>

            <div className="address-note">
              <CheckCircle2 size={16} /> No map or location service is required. Your typed address is used for pickup.
            </div>
          </div>

          <div className="full-span upload-box">
            <label className="upload-label">
              <ImagePlus size={28} />
              <strong>Upload plastic images</strong>
              <span>JPG, PNG or WEBP · required for admin AI verification</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={imageChange} required />
            </label>
            {image && (
              <div className="upload-preview-wrap">
                <img className="upload-preview" src={image} alt="Plastic preview" />
                <small>{imageName}</small>
              </div>
            )}
          </div>
        </div>

        {error && <div className="address-error"><AlertCircle size={16} />{error}</div>}

        <div className="form-footer">
          <span>Address: {form.city ? [form.houseLandmark, form.street, form.city, form.pincode].filter(Boolean).join(", ") : "Enter your pickup address"}</span>
          <button className="btn btn-primary" disabled={submitDisabled}>
            <Upload size={17} />Submit pickup request
          </button>
        </div>
      </form>

      <SuccessModal
        open={open}
        title="Request successfully sent"
        message="Your pickup request is now waiting for recycling-center approval and AI image verification."
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
