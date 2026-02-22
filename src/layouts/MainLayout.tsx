import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, ShoppingCart, Wallet, Calculator, Menu, X, Users, Package, Layers, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'

const primaryNav = [
    { icon: Home, label: 'Inicio', path: '/' },
    { icon: ShoppingCart, label: 'Pedidos', path: '/orders' },
    { icon: Calculator, label: 'Cotizar', path: '/quotation' },
    { icon: Wallet, label: 'Finanzas', path: '/finance' },
]

const menuItems = [
    { icon: Users, label: 'Clientes', path: '/clients' },
    { icon: Package, label: 'Inventario', path: '/inventory' },
    { icon: Layers, label: 'Productos', path: '/products' },
    { icon: ShieldCheck, label: 'Auditoría', path: '/audit' },
]

export default function MainLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false)
            }
        }
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showMenu])

    // Close menu on route change
    useEffect(() => {
        setShowMenu(false)
    }, [location.pathname])

    const isActive = (path: string) => location.pathname === path
    const isMenuItemActive = menuItems.some(item => isActive(item.path))

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Main Content */}
            <main className="flex-1 pb-20 md:pb-0 md:ml-56">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 md:hidden">
                <div className="flex justify-around items-center h-16 px-2 pb-[env(safe-area-inset-bottom)]">
                    {primaryNav.map((item) => {
                        const active = isActive(item.path)
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all",
                                    active ? "text-indigo-600" : "text-slate-400"
                                )}
                            >
                                <item.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                                <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>{item.label}</span>
                            </button>
                        )
                    })}

                    {/* Menu button */}
                    <div ref={menuRef} className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-all",
                                showMenu || isMenuItemActive ? "text-indigo-600" : "text-slate-400"
                            )}
                        >
                            {showMenu ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={1.8} />}
                            <span className={cn("text-[10px]", showMenu || isMenuItemActive ? "font-bold" : "font-medium")}>Menú</span>
                        </button>

                        {/* Menu overlay */}
                        {showMenu && (
                            <div className="absolute bottom-full right-0 mb-3 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 min-w-[180px] animate-in slide-in-from-bottom-3 fade-in duration-200">
                                {menuItems.map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl transition-colors w-full",
                                            isActive(item.path) ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <item.icon size={18} />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-56 bg-slate-900 text-white flex-col z-40">
                <div className="p-5 border-b border-slate-800">
                    <h1 className="text-lg font-black text-indigo-400 tracking-tight">Austral Prints</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">3D Gestión</p>
                </div>

                <nav className="flex-1 p-3 space-y-1">
                    {primaryNav.map((item) => {
                        const active = isActive(item.path)
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    "flex items-center gap-3 w-full p-3 rounded-xl transition-all text-left",
                                    active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <item.icon size={18} />
                                <span className="text-sm font-medium">{item.label}</span>
                            </button>
                        )
                    })}

                    <div className="pt-4 mt-4 border-t border-slate-800">
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest px-3 mb-2">Herramientas</p>
                        {menuItems.map((item) => {
                            const active = isActive(item.path)
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={cn(
                                        "flex items-center gap-3 w-full p-3 rounded-xl transition-all text-left",
                                        active ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                                    )}
                                >
                                    <item.icon size={16} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </nav>
            </aside>
        </div>
    )
}
