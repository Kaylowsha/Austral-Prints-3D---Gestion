import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

interface ResetPasswordProps {
    onComplete: () => void
}

export default function ResetPassword({ onComplete }: ResetPasswordProps) {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres')
            return
        }

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            toast.success('Contraseña actualizada correctamente')
            onComplete()
        } catch (error: any) {
            toast.error('Error al actualizar contraseña', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-0 bg-white/90 backdrop-blur">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                        Nueva Contraseña
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        Ingresá tu nueva contraseña para continuar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                                Nueva Contraseña
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e: any) => setPassword(e.target.value)}
                                required
                                className="bg-white border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="confirm" className="text-sm font-semibold text-slate-700">
                                Confirmar Contraseña
                            </label>
                            <Input
                                id="confirm"
                                type="password"
                                placeholder="Repetí la contraseña"
                                value={confirmPassword}
                                onChange={(e: any) => setConfirmPassword(e.target.value)}
                                required
                                className="bg-white border-slate-200"
                            />
                        </div>
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : 'Guardar Contraseña'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
