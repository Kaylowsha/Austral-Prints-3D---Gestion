import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit2, Package } from "lucide-react"
import { supabase } from "@/lib/supabase"
import ProductForm from "./ProductForm"

export default function ProductList() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

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

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
                    <p className="text-sm text-slate-500">Catálogo de precios y diseños</p>
                </div>
                <ProductForm onSuccess={fetchProducts} />
            </header>

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
                    {products.map(product => (
                        <Card key={product.id} className="hover:shadow-md transition-shadow relative group">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ProductForm
                                    product={product}
                                    onSuccess={fetchProducts}
                                    trigger={
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                                            <Edit2 size={16} />
                                        </Button>
                                    }
                                />
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
        </div>
    )
}
