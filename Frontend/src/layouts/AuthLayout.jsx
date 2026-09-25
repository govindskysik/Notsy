import { Outlet } from "react-router-dom";
import { assets } from '../assets/assets.js'

const AuthLayout = () => {
  return (
    <div className="auth-shell">
      <div className="auth-ambient auth-ambient-left" />
      <div className="auth-ambient auth-ambient-right" />
      <div className="auth-branding">
        <div className="auth-brand-lockup">
          <span className="auth-brand-mark"><img src={assets.logo} alt="" /></span>
          <span>NOTSY</span>
        </div>
        <p className="auth-heading">A clearer place<br /><em>to think.</em></p>
      </div>
      <div className="auth-card">
        <Outlet/>
      </div>
      <p className="auth-caption">Your notes, questions, and next idea.</p>
    </div>
  );
};

export default AuthLayout;