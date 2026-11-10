import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../config/api";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck, Sparkles } from "lucide-react";

const LOGO_SRC = "/logo.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      const res = await forgotPassword(email.trim());
      alert(res.message);
      navigate("/auth");
    } catch (err) {
      alert(err?.message || "Unable to send the reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ffd-forgot-page">
      <style>{`
        @keyframes ffdForgotFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(18px, -16px, 0); }
        }
        @keyframes ffdForgotIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ffdForgotShine {
          from { transform: translateX(-140%) skewX(-18deg); }
          to { transform: translateX(430%) skewX(-18deg); }
        }
        .ffd-forgot-page, .ffd-forgot-page * { box-sizing: border-box; }
        .ffd-forgot-page {
          position: relative;
          isolation: isolate;
          display: grid;
          place-items: center;
          width: 100%;
          min-height: 100dvh;
          overflow: hidden;
          padding: 24px;
          color: #12251f;
          background:
            radial-gradient(circle at 8% 12%, rgba(167,243,208,.48), transparent 27%),
            radial-gradient(circle at 92% 88%, rgba(153,246,228,.38), transparent 29%),
            #f5faf7;
          font-family: inherit;
        }
        .ffd-forgot-orb {
          position: fixed;
          z-index: -1;
          width: 270px;
          height: 270px;
          border-radius: 50%;
          filter: blur(48px);
          pointer-events: none;
          opacity: .6;
          animation: ffdForgotFloat 9s ease-in-out infinite;
        }
        .ffd-forgot-orb.one { top: -90px; left: -80px; background: rgba(16,185,129,.24); }
        .ffd-forgot-orb.two { right: -100px; bottom: -100px; background: rgba(45,212,191,.22); animation-delay: -3s; }
        .ffd-forgot-shell {
          display: grid;
          grid-template-columns: minmax(280px, .88fr) minmax(420px, 1.12fr);
          width: min(100%, 980px);
          min-height: 590px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.9);
          border-radius: 30px;
          background: rgba(255,255,255,.88);
          box-shadow: 0 28px 85px rgba(16, 55, 42, .13);
          backdrop-filter: blur(18px);
          animation: ffdForgotIn .55s cubic-bezier(.22,1,.36,1) both;
        }
        .ffd-forgot-brand {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          padding: 38px;
          color: #fff;
          background:
            radial-gradient(circle at 92% 8%, rgba(110,231,183,.3), transparent 27%),
            linear-gradient(145deg, #064432 0%, #08785d 55%, #0ca984 100%);
        }
        .ffd-forgot-brand::after {
          content: "";
          position: absolute;
          right: -125px;
          bottom: -145px;
          width: 330px;
          height: 330px;
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 50%;
          box-shadow: 0 0 0 34px rgba(255,255,255,.035), 0 0 0 70px rgba(255,255,255,.025);
          pointer-events: none;
        }
        .ffd-forgot-brand-top, .ffd-forgot-brand-bottom { position: relative; z-index: 1; }
        .ffd-forgot-brand-logo {
          display: grid;
          place-items: center;
          width: 74px;
          height: 74px;
          padding: 7px;
          border-radius: 21px;
          background: #fff;
          box-shadow: 0 14px 30px rgba(0,0,0,.16);
          animation: ffdForgotFloat 5s ease-in-out infinite;
        }
        .ffd-forgot-brand-logo img { width: 100%; height: 100%; object-fit: contain; }
        .ffd-forgot-brand-name { margin-top: 18px; font-size: 20px; font-weight: 950; letter-spacing: -.04em; }
        .ffd-forgot-brand-name span { color: #a7f3d0; }
        .ffd-forgot-brand-title { max-width: 360px; margin: 55px 0 0; font-size: clamp(34px, 4vw, 48px); line-height: 1.02; letter-spacing: -.055em; font-weight: 950; }
        .ffd-forgot-brand-title span { color: #a7f3d0; }
        .ffd-forgot-brand-copy { max-width: 340px; margin-top: 15px; color: rgba(236,253,245,.76); font-size: 13px; line-height: 1.7; }
        .ffd-forgot-benefit { display: flex; align-items: center; gap: 11px; margin-top: 12px; padding: 12px 13px; border: 1px solid rgba(255,255,255,.13); border-radius: 15px; background: rgba(255,255,255,.08); color: #ecfdf5; font-size: 11px; font-weight: 750; }
        .ffd-forgot-benefit-icon { display: grid; place-items: center; width: 30px; height: 30px; flex: 0 0 30px; border-radius: 10px; background: rgba(255,255,255,.13); }
        .ffd-forgot-form-side { display: grid; place-items: center; padding: 48px; background: rgba(255,255,255,.94); }
        .ffd-forgot-form { width: 100%; max-width: 410px; }
        .ffd-forgot-mobile-brand { display: none; }
        .ffd-forgot-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 38px;
          padding: 0 12px;
          border: 1px solid #e5eee9;
          border-radius: 11px;
          background: #f8fbf9;
          color: #476157;
          cursor: pointer;
          font-size: 11px;
          font-weight: 850;
          transition: .2s ease;
        }
        .ffd-forgot-back:hover { border-color: #a7f3d0; background: #ecfdf5; color: #047857; transform: translateX(-2px); }
        .ffd-forgot-icon {
          display: grid;
          place-items: center;
          width: 62px;
          height: 62px;
          margin-top: 38px;
          border: 1px solid #d1fae5;
          border-radius: 19px;
          background: linear-gradient(145deg, #ecfdf5, #d1fae5);
          color: #047857;
          box-shadow: 0 12px 26px rgba(5,150,105,.12);
        }
        .ffd-forgot-eyebrow { margin-top: 24px; color: #059669; font-size: 9px; font-weight: 950; letter-spacing: .19em; text-transform: uppercase; }
        .ffd-forgot-title { margin: 8px 0 0; color: #10231c; font-size: clamp(30px, 3.5vw, 39px); line-height: 1.05; letter-spacing: -.05em; font-weight: 950; }
        .ffd-forgot-description { margin-top: 11px; color: #71837a; font-size: 13px; line-height: 1.65; }
        .ffd-forgot-field-label { display: block; margin: 28px 0 8px 2px; color: #53675e; font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        .ffd-forgot-input-wrap { display: flex; align-items: center; gap: 11px; min-height: 54px; padding: 0 15px; border: 1px solid #dce8e1; border-radius: 14px; background: #f9fcfa; color: #82958b; transition: .2s ease; }
        .ffd-forgot-input-wrap:focus-within { border-color: #34d399; background: #fff; box-shadow: 0 0 0 4px rgba(16,185,129,.09); }
        .ffd-forgot-input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: #14271f; font: inherit; font-size: 14px; font-weight: 650; }
        .ffd-forgot-input::placeholder { color: #a0afa7; font-weight: 500; }
        .ffd-forgot-hint { margin: 9px 2px 0; color: #8a9a92; font-size: 10px; line-height: 1.5; }
        .ffd-forgot-submit {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          min-height: 52px;
          margin-top: 24px;
          overflow: hidden;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(110deg, #047857, #059669 55%, #0d9488);
          color: white;
          box-shadow: 0 12px 25px rgba(5,150,105,.2);
          cursor: pointer;
          font-size: 13px;
          font-weight: 900;
          transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
        }
        .ffd-forgot-submit::after { content: ""; position: absolute; inset: 0 auto 0 -35%; width: 25%; background: rgba(255,255,255,.2); transform: skewX(-18deg); }
        .ffd-forgot-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 30px rgba(5,150,105,.27); }
        .ffd-forgot-submit:hover:not(:disabled)::after { animation: ffdForgotShine .8s ease; }
        .ffd-forgot-submit:active:not(:disabled) { transform: scale(.99); }
        .ffd-forgot-submit:disabled { cursor: not-allowed; opacity: .65; }
        .ffd-forgot-footnote { display: flex; align-items: flex-start; gap: 8px; margin-top: 22px; padding: 12px; border: 1px solid #e3f3ea; border-radius: 13px; background: #f3fbf6; color: #668074; font-size: 10px; line-height: 1.5; }
        .ffd-forgot-footer { margin-top: 32px; color: #9aaba2; text-align: center; font-size: 9px; font-weight: 750; }
        @media (max-width: 820px) {
          .ffd-forgot-page { display: block; min-height: 100dvh; padding: 0; background: linear-gradient(180deg, #eaf8f0 0%, #f7fbf8 34%, #f7fbf8 100%); }
          .ffd-forgot-shell { display: block; width: 100%; min-height: 100dvh; border: 0; border-radius: 0; background: transparent; box-shadow: none; backdrop-filter: none; }
          .ffd-forgot-brand { display: none; }
          .ffd-forgot-form-side { display: block; min-height: 100dvh; padding: 18px 17px 30px; background: transparent; }
          .ffd-forgot-form { max-width: 470px; margin: 0 auto; padding-top: 8px; }
          .ffd-forgot-mobile-brand { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 4px 0 34px; }
          .ffd-forgot-mobile-logo { display: grid; place-items: center; width: 46px; height: 46px; padding: 4px; border: 1px solid #d6f2e2; border-radius: 14px; background: #fff; box-shadow: 0 8px 18px rgba(15,80,55,.08); }
          .ffd-forgot-mobile-logo img { width: 100%; height: 100%; object-fit: contain; }
          .ffd-forgot-mobile-name { color: #16382a; font-size: 17px; font-weight: 950; letter-spacing: -.04em; }
          .ffd-forgot-mobile-name span { color: #059669; }
          .ffd-forgot-mobile-tagline { margin-top: 2px; color: #8ca096; font-size: 8px; font-weight: 850; letter-spacing: .1em; }
          .ffd-forgot-icon { width: 55px; height: 55px; margin-top: 29px; border-radius: 17px; }
          .ffd-forgot-eyebrow { margin-top: 20px; }
          .ffd-forgot-title { font-size: 32px; }
          .ffd-forgot-description { max-width: 390px; font-size: 12px; }
          .ffd-forgot-field-label { margin-top: 24px; }
          .ffd-forgot-footer { margin-top: 27px; }
        }
        @media (max-width: 380px) {
          .ffd-forgot-form-side { padding-left: 13px; padding-right: 13px; }
          .ffd-forgot-title { font-size: 29px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ffd-forgot-orb, .ffd-forgot-shell { animation: none !important; }
          .ffd-forgot-back, .ffd-forgot-submit, .ffd-forgot-input-wrap { transition: none !important; }
        }
      `}</style>

      <div className="ffd-forgot-orb one" aria-hidden="true" />
      <div className="ffd-forgot-orb two" aria-hidden="true" />

      <section className="ffd-forgot-shell" aria-label="FarmFreshDairy password reset">
        <aside className="ffd-forgot-brand">
          <div className="ffd-forgot-brand-top">
            <div className="ffd-forgot-brand-logo">
              <img src={LOGO_SRC} alt="Farm Fresh Dairy logo" />
            </div>
            <div className="ffd-forgot-brand-name">
              FarmFresh<span>Dairy</span>
            </div>
            <h1 className="ffd-forgot-brand-title">
              Your fresh start,
              <span> made simple.</span>
            </h1>
            <p className="ffd-forgot-brand-copy">
              Get back to managing your daily milk deliveries, subscriptions and orders with ease.
            </p>
          </div>
          <div className="ffd-forgot-brand-bottom">
            <div className="ffd-forgot-benefit">
              <span className="ffd-forgot-benefit-icon"><ShieldCheck size={16} /></span>
              Secure account recovery
            </div>
            <div className="ffd-forgot-benefit">
              <span className="ffd-forgot-benefit-icon"><Sparkles size={16} /></span>
              Freshness delivered daily
            </div>
          </div>
        </aside>

        <section className="ffd-forgot-form-side">
          <div className="ffd-forgot-form">
            <div className="ffd-forgot-mobile-brand">
              <div className="ffd-forgot-mobile-logo"><img src={LOGO_SRC} alt="" /></div>
              <div>
                <div className="ffd-forgot-mobile-name">FarmFresh<span>Dairy</span></div>
                <div className="ffd-forgot-mobile-tagline">FRESHNESS DELIVERED DAILY</div>
              </div>
            </div>

            <button type="button" className="ffd-forgot-back" onClick={() => navigate("/auth")}>
              <ArrowLeft size={14} /> Back to sign in
            </button>

            <div className="ffd-forgot-icon"><Mail size={25} strokeWidth={1.8} /></div>
            <div className="ffd-forgot-eyebrow">ACCOUNT RECOVERY</div>
            <h2 className="ffd-forgot-title">Forgot your password?</h2>
            <p className="ffd-forgot-description">
              No worries. Enter the email address registered with your account and we’ll send you a secure link to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <label className="ffd-forgot-field-label" htmlFor="forgot-email">Registered email address</label>
              <div className="ffd-forgot-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input
                  id="forgot-email"
                  className="ffd-forgot-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  maxLength={254}
                  required
                />
              </div>
              <p className="ffd-forgot-hint">Use the same email address you used when creating your FarmFreshDairy account.</p>
              <button className="ffd-forgot-submit" type="submit" disabled={loading || !email.trim()}>
                <span>{loading ? "Sending reset link…" : "Send reset link"}</span>
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="ffd-forgot-footnote">
              <ShieldCheck size={15} />
              <span>For your security, password reset links should only be used by the account owner.</span>
            </div>
            <div className="ffd-forgot-footer">© {new Date().getFullYear()} Farm Fresh Dairy · Freshness delivered daily</div>
          </div>
        </section>
      </section>
    </main>
  );
}
