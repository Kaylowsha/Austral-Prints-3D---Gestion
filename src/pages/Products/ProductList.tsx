import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit2, Package, Search, X, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import ProductForm from "./ProductForm"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import ConfirmDialog from "@/components/ConfirmDialog"

export default function ProductList() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [productToDelete, setProductToDelete] = useState<string | null>(null)

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name')

        if (!error && data) {
            setProducts(data)
        }
        setLoading(false)
    }

    const deleteProduct = async () => {
        if (!productToDelete) return
        try {
            const { error } = await supabase.from('products').delete().eq('id', productToDelete)
            if (error) throw error
            toast.success('Producto eliminado')
            fetchProducts()
        } catch (error: any) {
            toast.error('Error al eliminar producto', { description: error.message })
        } finally {
            setProductToDelete(null)
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto pb-24">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Catálogo de Productos</h1>
                    <p className="text-sm text-slate-500 font-medium font-medium">Precios base y especificaciones técnicas</p>
                </div>
                <ProductForm onSuccess={fetchProducts} />
            </header>

            {/* Search */}
            <div className="relative group max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <Input
                    placeholder="Buscar producto por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 border-slate-200 focus:border-indigo-300 focus:ring-indigo-100 rounded-xl"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-10">Cargando...</div>
            ) : products.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-lg border border-dashed text-slate-500 flex flex-col items-center gap-2">
                    <Package size={48} className="text-slate-300" />
                    <p>No tienes productos registrados aún.</p>
                    <Button variant="link">Crear el primero</Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map(product => (
                        <Card key={product.id} className="hover:shadow-md transition-shadow relative group">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <ProductForm
                                    product={product}
                                    onSuccess={fetchProducts}
                                    trigger={
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 bg-white/80 backdrop-blur-sm shadow-sm">
                                            <Edit2 size={16} />
                                        </Button>
                                    }
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setProductToDelete(product.id)}
                                    className="h-8 w-8 text-slate-400 hover:text-rose-600 bg-white/80 backdrop-blur-sm shadow-sm"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-semibold text-slate-800 line-clamp-1 pr-8">
                                    {product.name}
                                </CardTitle>
                                <div className="text-sm font-bold text-indigo-600">
                                    ${product.base_price?.toLocaleString('es-CL')}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-slate-500 space-y-1">
                                    <p>Peso: {product.weight_grams}g</p>
                                    <p>Tiempo: {product.print_time_mins} min</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {filteredProducts.length === 0 && !loading && products.length > 0 && (
                <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                    <p className="font-bold uppercase tracking-widest text-xs">Sin coincidencias</p>
                    <p className="text-xs mt-1">Prueba con otro nombre de producto.</p>
                </div>
            )}

            <ConfirmDialog
                open={!!productToDelete}
                onOpenChange={(open) => !open && setProductToDelete(null)}
                onConfirm={deleteProduct}
                title="¿Eliminar Producto?"
                description="Esta acción eliminará el producto del catálogo. Los pedidos existentes que lo usen no se verán afectados, pero no se podrá seleccionar para nuevos pedidos."
                confirmText="Eliminar"
                variant="destructive"
            />
        </div>
    )
}
