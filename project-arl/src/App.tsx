import { useEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import Desk from './pages/Desk'
import ReferralDetail from './pages/ReferralDetail'
import NewReferral from './pages/NewReferral'
import Track from './pages/Track'

function Nav() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">ARL</span>
          <span>
            Project ARL
            <small>VPS Lakeshore · ECHS</small>
          </span>
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end className="hide-sm">Overview</NavLink>
          <NavLink to="/track">Track referral</NavLink>
          <NavLink to="/desk">Referral desk</NavLink>
          <NavLink to="/desk/new" className="btn btn-primary" style={{ color: '#fff' }}>+ New</NavLink>
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
        <Route path="/desk" element={<Desk />} />
        <Route path="/desk/new" element={<NewReferral />} />
        <Route path="/desk/:id" element={<ReferralDetail />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </>
  )
}
