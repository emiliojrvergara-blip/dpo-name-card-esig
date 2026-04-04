import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import PublicCard from './pages/PublicCard'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useApp()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin(user.email)) return <Navigate to="/dashboard" replace />
  return children
}

function RootRedirect() {
  const { user, isAdmin } = useApp()
  if (!user) return <Navigate to="/login" replace />
  if (user.adminOnly || isAdmin(user.email)) return <Navigate to="/admin" replace />
  return <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <Admin />
          </ProtectedRoute>
        }
      />
      {/* Public card — no login required */}
      <Route path="/card/:userId" element={<PublicCard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </HashRouter>
  )
}
