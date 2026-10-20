import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import Layout from './components/Layout'
import Home from './pages/Home'
import Journeys from './pages/Journeys'
import JourneyDetail from './pages/JourneyDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Book from './pages/Book'
import Reserve from './pages/Reserve'
import Payment from './pages/Payment'
import MyBookings from './pages/MyBookings'
import ETicket from './pages/ETicket'
import EditBooking from './pages/EditBooking'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminBookings from './pages/AdminBookings'
import AdminJourneys from './pages/AdminJourneys'
import AdminOptions from './pages/AdminOptions'
import AdminDestinations from './pages/AdminDestinations'
import AdminQuotes from './pages/AdminQuotes'
import './index.css'

function RequireAuth({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <p className="page-status">Loading…</p>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}

function RequireAdmin({ children }) {
  const { user, ready, isAdmin } = useAuth()
  const location = useLocation()
  if (!ready) return <p className="page-status">Loading…</p>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="journeys" element={<Journeys />} />
            <Route path="journeys/:id" element={<JourneyDetail />} />
            <Route
              path="journeys/:id/book"
              element={
                <RequireAuth>
                  <Book />
                </RequireAuth>
              }
            />
            <Route
              path="reserve"
              element={
                <RequireAuth>
                  <Reserve />
                </RequireAuth>
              }
            />
            <Route
              path="bookings"
              element={
                <RequireAuth>
                  <MyBookings />
                </RequireAuth>
              }
            />
            <Route
              path="bookings/:id/pay"
              element={
                <RequireAuth>
                  <Payment />
                </RequireAuth>
              }
            />
            <Route
              path="reservations/:id/pay"
              element={
                <RequireAuth>
                  <Payment />
                </RequireAuth>
              }
            />
            <Route
              path="bookings/:id/ticket"
              element={
                <RequireAuth>
                  <ETicket />
                </RequireAuth>
              }
            />
            <Route
              path="bookings/:id/edit"
              element={
                <RequireAuth>
                  <EditBooking />
                </RequireAuth>
              }
            />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route
              path="profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="admin"
              element={
                <RequireAdmin>
                  <AdminDashboard />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/users"
              element={
                <RequireAdmin>
                  <AdminUsers />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/bookings"
              element={
                <RequireAdmin>
                  <AdminBookings />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/journeys"
              element={
                <RequireAdmin>
                  <AdminJourneys />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/options"
              element={
                <RequireAdmin>
                  <AdminOptions />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/destinations"
              element={
                <RequireAdmin>
                  <AdminDestinations />
                </RequireAdmin>
              }
            />
            <Route
              path="admin/quotes"
              element={
                <RequireAdmin>
                  <AdminQuotes />
                </RequireAdmin>
              }
            />
            <Route
              path="*"
              element={
                <section className="section">
                  <div className="container">
                    <div className="status-panel">
                      <h1>Page not found</h1>
                      <p>
                        The page you were looking for doesn’t exist, or it has moved somewhere else.
                      </p>
                      <div className="status-actions">
                        <Link to="/" className="btn btn-primary">
                          Back to home
                        </Link>
                        <Link to="/journeys" className="btn btn-outline">
                          Browse journeys
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
