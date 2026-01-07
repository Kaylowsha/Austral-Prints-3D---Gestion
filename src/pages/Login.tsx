import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
// import { useNavigate } from 'react-router-dom' 

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [isPasswordLogin, setIsPasswordLogin] = useState(true)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isPasswordLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                toast.success('¡Bienvenido!')
            } else {
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        shouldCreateUser: true
                    }
                })
                if (error) throw error
                toast.success('¡Enlace mágico enviado!', {
                    description: 'Revisa tu correo para iniciar sesión.'
                })
            }
        } catch (error: any) {
            toast.error('Error al iniciar sesión', {
                description: error.message === 'Invalid login credentials'
                    ? 'Credenciales incorrectas o usuario no creado en Supabase.'
                    : error.message
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-0 bg-white/90 backdrop-blur">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Austral Prints 3D</CardTitle>
                    <CardDescription className="text-slate-500">Gestión de Impresión 3D</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                                Correo Electrónico
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="usuario@australprints.com"
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                                required
                                className="bg-white border-slate-200 focus:ring-indigo-500"
                            />
                        </div>

                        {isPasswordLogin && (
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                                    Contraseña
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e: any) => setPassword(e.target.value)}
                                    required
                                    className="bg-white border-slate-200 focus:ring-indigo-500"
                                />
                            </div>
                        )}

                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6" type="submit" disabled={loading}>
                            {loading ? 'Procesando...' : (isPasswordLogin ? 'Iniciar Sesión' : 'Enviar Enlace Mágico')}
                        </Button>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => setIsPasswordLogin(!isPasswordLogin)}
                                className="text-sm text-indigo-600 hover:underline font-medium"
                            >
                                {isPasswordLogin ? 'Usar enlace mágico por correo' : 'Usar correo y contraseña'}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
