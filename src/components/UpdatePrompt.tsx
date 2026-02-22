import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW()

    if (!needRefresh) return null

    return (
        <div className="fixed top-4 left-4 right-4 z-[9999] flex items-center justify-between gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-in slide-in-from-top duration-300 max-w-lg mx-auto">
            <p className="text-sm font-medium">Nueva versión disponible</p>
            <button
                onClick={() => updateServiceWorker(true)}
                className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors shrink-0"
            >
                Actualizar
            </button>
        </div>
    )
}
