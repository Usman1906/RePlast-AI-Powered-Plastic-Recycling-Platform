import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Trash2,
  WalletCards,
  X
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Link } from "react-router-dom";

export default function Cart() {
  const { cart, removeFromCart, changeQty, user, purchaseCart, clearCart } = useApp();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [method, setMethod] = useState("upi");
  const [paymentStep, setPaymentStep] = useState("method");
  const [paymentError, setPaymentError] = useState("");
  const [paymentData, setPaymentData] = useState({ upi: "", card: "", expiry: "", cvv: "" });
  const [order, setOrder] = useState(null);
  const [receiptVisible, setReceiptVisible] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (paymentStep !== "processing") return;
    const timer = window.setTimeout(async () => {
      const result = await purchaseCart(cart);
      if (!result.ok) {
        setPaymentError(result.message);
        setPaymentStep("details");
        return;
      }
      clearCart();
      setOrder(result.order);
      setPaymentStep("success");
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [paymentStep]); // processing intentionally runs once per payment attempt

  const openPayment = () => {
    if (!cart.length) return;
    if ((user?.points || 0) < total) {
      setPaymentError(`You need ${total - (user?.points || 0)} more reward points to complete this purchase.`);
      setPaymentOpen(true);
      setPaymentStep("details");
      return;
    }
    setPaymentError("");
    setPaymentStep("method");
    setPaymentOpen(true);
  };

  const continuePayment = () => {
    setPaymentError("");
    if (method === "upi" && !paymentData.upi.trim()) {
      setPaymentError("Enter a valid UPI ID to continue.");
      return;
    }
    if (method === "card") {
      if (paymentData.card.replace(/\s/g, "").length !== 16) {
        setPaymentError("Enter a valid 16-digit card number.");
        return;
      }
      if (!paymentData.expiry.trim() || paymentData.cvv.trim().length !== 3) {
        setPaymentError("Enter a valid expiry date and 3-digit CVV.");
        return;
      }
    }
    setPaymentStep("processing");
  };

  const closePayment = () => {
    if (paymentStep === "processing") return;
    setPaymentOpen(false);
    setPaymentStep("method");
    setPaymentError("");
  };

  const finishSuccess = () => {
    setPaymentOpen(false);
    setPaymentStep("method");
    setReceiptVisible(true);
  };

  if (!cart.length && !receiptVisible) {
    return (
      <div>
        <div className="page-title">
          <div>
            <span className="eyebrow">YOUR CART</span>
            <h1>Eco Shop cart</h1>
            <p>Review your products before completing your purchase.</p>
          </div>
        </div>
        <div className="empty-page">
          <ShoppingBag size={48} />
          <h2>Your cart is empty</h2>
          <p>Explore the Eco Shop and add a product to purchase.</p>
          <Link className="btn btn-primary" to="/shopping">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">
        <div>
          <span className="eyebrow">YOUR CART</span>
          <h1>Eco Shop cart</h1>
          <p>Review your products before completing your purchase.</p>
        </div>
        <Link className="btn btn-secondary" to="/shopping"><ArrowLeft size={17} /> Continue shopping</Link>
      </div>

      {receiptVisible && order ? (
        <div className="panel purchase-receipt">
          <div className="receipt-icon"><CheckCircle2 size={48} /></div>
          <span className="eyebrow">ORDER CONFIRMED</span>
          <h2>Payment successful</h2>
          <p>Your order has been confirmed and {order.total} reward points were deducted from your Eco Wallet.</p>
          <div className="receipt-grid">
            <div><span>Order ID</span><strong>#{order.id}</strong></div>
            <div><span>Date</span><strong>{order.date}</strong></div>
            <div><span>Payment</span><strong>Reward Points</strong></div>
            <div><span>Total</span><strong>{order.total} pts</strong></div>
          </div>
          <Link className="btn btn-primary" to="/shopping">Shop again</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="panel">
            {cart.map(item => (
              <div className="cart-row" key={item.cartId}>
                <div className="cart-product-icon">{item.emoji}</div>
                <div className="cart-info">
                  <strong>{item.name}</strong>
                  <span>{item.price} points each</span>
                </div>
                <div className="qty">
                  <button aria-label={`Decrease ${item.name}`} onClick={() => changeQty(item.cartId, item.quantity - 1)}><Minus size={15} /></button>
                  <b>{item.quantity}</b>
                  <button aria-label={`Increase ${item.name}`} onClick={() => changeQty(item.cartId, item.quantity + 1)}><Plus size={15} /></button>
                </div>
                <strong>{item.price * item.quantity} pts</strong>
                <button className="icon-btn danger" aria-label={`Remove ${item.name}`} onClick={() => removeFromCart(item.cartId)}><Trash2 size={17} /></button>
              </div>
            ))}
          </div>

          <div className="panel checkout">
            <WalletCards size={30} />
            <span>Eco Wallet</span>
            <strong>{user?.points || 0} pts</strong>
            <div className="checkout-line"><span>Cart total</span><b>{total} pts</b></div>
            <button className="btn btn-primary full" onClick={openPayment}>
              <CreditCard size={17} /> Buy now
            </button>
            <small>Payment is completed through the secure checkout popup. Reward points are deducted only after successful payment confirmation.</small>
          </div>
        </div>
      )}

      {paymentOpen && (
        <div className="modal-backdrop payment-backdrop" role="dialog" aria-modal="true" aria-label="Payment checkout">
          <div className="payment-modal">
            {paymentStep !== "processing" && (
              <button className="modal-close" onClick={closePayment} aria-label="Close payment"><X size={17} /></button>
            )}

            {paymentStep === "success" ? (
              <div className="payment-success">
                <div className="payment-success-icon"><CheckCircle2 size={54} /></div>
                <span className="eyebrow">PAYMENT COMPLETE</span>
                <h2>Purchase successful</h2>
                <p>Your payment was processed successfully.</p>
                <div className="payment-summary">
                  <span>Order #{order?.id}</span>
                  <strong>{order?.total} pts</strong>
                </div>
                <button className="btn btn-primary full" onClick={finishSuccess}>View order confirmation</button>
              </div>
            ) : paymentStep === "processing" ? (
              <div className="payment-processing">
                <div className="payment-spinner" />
                <h2>Processing payment</h2>
                <p>Securely confirming your payment and creating your order...</p>
                <small>Do not close this window.</small>
              </div>
            ) : (
              <>
                <div className="payment-header">
                  <div>
                    <span className="eyebrow">SECURE CHECKOUT</span>
                    <h2>Complete your purchase</h2>
                  </div>
                  <div className="secure-badge"><LockKeyhole size={14} /> Secure</div>
                </div>

                <div className="payment-total">
                  <span>Amount to pay</span>
                  <strong>{total} reward points</strong>
                  <small>Available balance: {user?.points || 0} pts</small>
                </div>

                {paymentStep === "method" && (
                  <>
                    <div className="payment-methods">
                      <button className={method === "upi" ? "payment-method active" : "payment-method"} onClick={() => setMethod("upi")}>
                        <Smartphone size={20} /><span><b>UPI</b><small>Google Pay, PhonePe, Paytm</small></span>
                      </button>
                      <button className={method === "card" ? "payment-method active" : "payment-method"} onClick={() => setMethod("card")}>
                        <CreditCard size={20} /><span><b>Card</b><small>Debit or credit card</small></span>
                      </button>
                      <button className={method === "wallet" ? "payment-method active" : "payment-method"} onClick={() => setMethod("wallet")}>
                        <WalletCards size={20} /><span><b>Eco Wallet</b><small>Use reward points</small></span>
                      </button>
                    </div>
                    <button className="btn btn-primary full" onClick={() => setPaymentStep("details")}>Continue</button>
                  </>
                )}

                {paymentStep === "details" && (
                  <>
                    {paymentError && <div className="alert error">{paymentError}</div>}
                    {method === "upi" && (
                      <label className="payment-field">UPI ID
                        <input value={paymentData.upi} onChange={e => setPaymentData({ ...paymentData, upi: e.target.value })} placeholder="name@upi" autoFocus />
                      </label>
                    )}
                    {method === "card" && (
                      <div className="payment-form-grid">
                        <label className="payment-field full-span">Card number
                          <input inputMode="numeric" maxLength={19} value={paymentData.card} onChange={e => setPaymentData({ ...paymentData, card: e.target.value.replace(/[^\d\s]/g, "") })} placeholder="1234 5678 9012 3456" autoFocus />
                        </label>
                        <label className="payment-field">Expiry
                          <input maxLength={5} value={paymentData.expiry} onChange={e => setPaymentData({ ...paymentData, expiry: e.target.value })} placeholder="MM/YY" />
                        </label>
                        <label className="payment-field">CVV
                          <input type="password" maxLength={3} inputMode="numeric" value={paymentData.cvv} onChange={e => setPaymentData({ ...paymentData, cvv: e.target.value.replace(/\D/g, "") })} placeholder="123" />
                        </label>
                      </div>
                    )}
                    {method === "wallet" && (
                      <div className="wallet-payment-note">
                        <ShieldCheck size={22} />
                        <div><strong>Eco Wallet selected</strong><p>{total} points will be deducted after you confirm this purchase.</p></div>
                      </div>
                    )}
                    <div className="payment-actions">
                      <button className="btn btn-secondary" onClick={() => setPaymentStep("method")}>Back</button>
                      <button className="btn btn-primary" onClick={continuePayment}>Pay {total} pts</button>
                    </div>
                  </>
                )}

                <div className="payment-footer"><LockKeyhole size={13} /> Protected checkout · Demo payment flow</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
