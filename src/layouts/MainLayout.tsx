import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, Package, ShoppingCart, Wallet, ShieldCheck, Layers, Calculator, Menu, Users, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export default function MainLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    const navItems = [
        { icon: Home, label: 'Inicio', path: '/' },
        { icon: Wallet, label: 'Finanzas', path: '/finance' },
        { icon: ShoppingCart, label: 'Pedidos', path: '/orders' },
        { icon: Users, label: 'Clientes', path: '/clients' },
        { icon: Package, label: 'Inventario', path: '/inventory' },
        { icon: PieChart, label: 'Costos', path: '/analysis' },
        { icon: Calculator, label: 'Cotización', path: '/quotation' },
        { icon: Layers, label: 'Productos', path: '/products' },
        { icon: ShieldCheck, label: 'Auditoría', path: '/audit' },
    ]

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Main Content Area */}
            <main className="flex-1 pb-20 md:pb-0 md:ml-64">
                <Outlet />
            </main>

            {/* Bottom Navigation (Mobile First) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 px-4 flex justify-between items-center z-50 shadow-lg md:hidden">
                {navItems.slice(0, 4).map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[64px]",
                                isActive ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    )
                })}

                <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[64px]",
                        showMobileMenu ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:bg-slate-50"
                    )}
                >
                    <Menu size={24} strokeWidth={showMobileMenu ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Más</span>
                </button>

                {/* Mobile Menu Overlay */}
                {showMobileMenu && (
                    <div className="absolute bottom-full right-4 mb-2 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 min-w-[160px] flex flex-col gap-1 animate-in slide-in-from-bottom-5 fade-in duration-200">
                        {navItems.slice(4).map((item) => (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    setShowMobileMenu(false);
                                }}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg transition-colors w-full",
                                    location.pathname === item.path ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <item.icon size={18} />
                                <span className="text-sm font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </nav>

            {/* Desktop Navigation (Simple Sidebar placeholder for larger screens) */}
            <div className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-slate-900 text-white p-4 flex-col gap-4">
                <h1 className="text-xl font-bold mb-8 text-center text-indigo-400">Austral Prints</h1>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                                isActive ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
