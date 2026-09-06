import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import LanguageGate from './components/LanguageGate.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import { ToastProvider } from './components/admin/Toast.jsx'
import { AuthProvider } from './lib/AuthProvider.jsx'

import Home from './pages/Home.jsx'
import Products from './pages/Products.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import NotFound from './pages/NotFound.jsx'

import Login from './pages/admin/Login.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import ProductEdit from './pages/admin/ProductEdit.jsx'
import Inventory from './pages/admin/Inventory.jsx'
import Categories from './pages/admin/Categories.jsx'
import Settings from './pages/admin/Settings.jsx'

/** Reset scroll on navigation, except for in-page hash links. */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0 })
  }, [pathname, hash])
  return null
}

function PublicShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <LanguageGate />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<PublicShell><Home /></PublicShell>} />
        <Route path="/products" element={<PublicShell><Products /></PublicShell>} />
        <Route path="/product/:slug" element={<PublicShell><ProductDetail /></PublicShell>} />

        <Route
          path="/admin/*"
          element={
            <AuthProvider>
              <ToastProvider>
                <Routes>
                  <Route index element={<Login />} />
                  <Route element={<AdminLayout />}>
                    <Route path="products" element={<Dashboard />} />
                    <Route path="products/:id" element={<ProductEdit />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ToastProvider>
            </AuthProvider>
          }
        />

        <Route path="*" element={<PublicShell><NotFound /></PublicShell>} />
      </Routes>
    </>
  )
}
