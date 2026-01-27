import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useState, useEffect } from 'react'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

import MainLayout from '@/layouts/MainLayout'
import ProductList from '@/pages/Products/ProductList'
import KanbanBoard from '@/pages/Orders/KanbanBoard'
import FinancePage from '@/pages/Finance/FinancePage'
import InventoryPage from '@/pages/Inventory/InventoryPage'
import AuditPage from '@/pages/AuditPage'
import QuotationPage from '@/pages/Quotation/QuotationPage'
import ClientsPage from '@/pages/Clients/ClientsPage'
import ProductionAnalysisPage from '@/pages/Finance/ProductionAnalysisPage'

// Placeholders to avoid build errors if files missing
// const OrdersPage = () => <div className="p-4">Pedidos (En construcción)</div>

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Cargando...</div>
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />

        {/* Protected Routes */}
        {session ? (
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/orders" element={<KanbanBoard />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/quotation" element={<QuotationPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/analysis" element={<ProductionAnalysisPage />} />
            <Route path="/audit" element={<AuditPage />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App
