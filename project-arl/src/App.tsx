import { useEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import Desk from './pages/Desk'
import ReferralDetail from './pages/ReferralDetail'
import NewReferral from './pages/NewReferral'
import Track from './pages/Track'
import DoctorLogin from './pages/DoctorLogin'
import DoctorPortal from './pages/DoctorPortal'
import DoctorReferral from './pages/DoctorReferral'
import StaffLogin from './pages/StaffLogin'
import Admin from './pages/Admin'
import RequireStaff from './components/RequireStaff'
import { useStore } from './lib/store'
import logoWhite from './assets/lakeshore-logo-white.png'

function Nav() {
  const { staff, staffLogout, doctor, logout } = useStore()
  return (
    <header className="nav">
      <div className="container nav-inner">
        <NavLink to="/" className="brand" aria-label="Project ARL home">
          <img src={logoWhite} alt="VPS Lakeshore" />
          <span className="brand-product">
            Project ARL
            <small>ECHS referral loop</small>
          </span>
        </NavLink>
        <nav className="nav-links">
          {staff ? (
            // Signed-in staff see only what they use every day.
            <>
              <NavLink to="/desk" end>Referrals</NavLink>
              {staff.role === 'Admin' && <NavLink to="/admin">Admin</NavLink>}
              <button className="nav-signout" onClick={staffLogout}>Sign out</button>
              <NavLink to="/desk/new" className="btn btn-light hide-sm">+ Add referral</NavLink>
            </>
          ) : doctor ? (
            <>
              <NavLink to="/doctor" end>Your patients</NavLink>
              <button className="nav-signout" onClick={logout}>Sign out</button>
            </>
          ) : (
            <>
              <NavLink to="/" end className="hide-sm">Overview</NavLink>
              <NavLink to="/track" className="hide-sm">Track referral</NavLink>
              <NavLink to="/doctor">For doctors</NavLink>
              <NavLink to="/desk">Staff sign in</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default function App() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/track" element={<Track />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/desk" element={<RequireStaff><Desk /></RequireStaff>} />
        <Route path="/desk/new" element={<RequireStaff><NewReferral /></RequireStaff>} />
        <Route path="/desk/:id" element={<RequireStaff><ReferralDetail /></RequireStaff>} />
        <Route path="/admin" element={<RequireStaff roles={['Admin']}><Admin /></RequireStaff>} />
        <Route path="/doctor" element={<DoctorPortal />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor/:id" element={<DoctorReferral />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </>
  )
}
