import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, PenTool, Package, Monitor, Briefcase, Wrench } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

interface Asset {
    id: string;
    name: string;
    type: string;
    acquisition_date: string;
    acquisition_cost: number;
    current_value: number;
    description: string;
}

interface AssetsTabProps {
    cashBalance: number;
    inventoryValue: number;
}

export function AssetsTab({ cashBalance, inventoryValue }: AssetsTabProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newAsset, setNewAsset] = useState<Partial<Asset>>({
        type: 'Impresora',
        acquisition_date: new Date().toISOString().split('T')[0],
        acquisition_cost: 0,
        current_value: 0
    });

    const assetTypes = [
        { value: 'Impresora', label: 'Impresora 3D', icon: Monitor },
        { value: 'Herramienta', label: 'Herramienta', icon: Wrench },
        { value: 'Mobiliario', label: 'Mobiliario', icon: Briefcase },
        { value: 'Insumo', label: 'Insumo Mayor', icon: Package },
        { value: 'Otro', label: 'Otro', icon: PenTool },
    ];

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('assets')
                .select('*')
                .eq('active', true)
                .order('acquisition_date', { ascending: false });

            if (error) throw error;
            setAssets(data || []);
        } catch (error) {
            console.error('Error fetching assets:', error);
            toast.error("Error al cargar activos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleCreateAsset = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("No hay usuario autenticado");
                return;
            }

            const { error } = await supabase
                .from('assets')
                .insert([{
                    ...newAsset,
                    user_id: user.id,
                    active: true
                }]);

            if (error) throw error;

            toast.success("Activo registrado correctamente");
            setIsDialogOpen(false);
            setNewAsset({
                type: 'Impresora',
                acquisition_date: new Date().toISOString().split('T')[0],
                acquisition_cost: 0,
                current_value: 0,
                name: '',
                description: ''
            });
            fetchAssets();
        } catch (error: any) {
            toast.error("Error al crear activo: " + error.message);
        }
    };

    const handleDeleteAsset = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este activo?")) return;
        try {
            const { error } = await supabase
                .from('assets')
                .update({ active: false })
                .eq('id', id);

            if (error) throw error;
            toast.success("Activo eliminado");
            fetchAssets();
        } catch (error) {
            toast.error("Error al eliminar activo");
        }
    };

    const totalAssetsValue = assets.reduce((sum, asset) => sum + (Number(asset.current_value) || 0), 0);
    const totalBusinessValue = totalAssetsValue + inventoryValue + cashBalance;

    return (
        <div className="space-y-6">
            {/* Business Valuation Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-4 bg-slate-900 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-slate-400">Valor Total del Negocio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black tracking-tight">
                            ${totalBusinessValue.toLocaleString('es-CL')}
                        </div>
                        <p className="text-sm text-slate-400 mt-2">
                            Suma de Activos Fijos + Inventario + Caja
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Activos Fijos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            ${totalAssetsValue.toLocaleString('es-CL')}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Máquinas y Equipos</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Inventario</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            ${inventoryValue.toLocaleString('es-CL')}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Material y Stock</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Capital (Caja)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            ${cashBalance.toLocaleString('es-CL')}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Disponibilidad inmediata</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Inventario de Activos</CardTitle>
                        <CardDescription>Gestiona tus máquinas, herramientas y equipos</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-slate-900 text-white hover:bg-slate-800">
                                <Plus className="w-4 h-4 mr-2" />
                                Nuevo Activo
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Registrar Nuevo Activo</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Nombre</Label>
                                    <Input
                                        value={newAsset.name || ''}
                                        onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                                        placeholder="Ej: Ender 3 V2 #1"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Tipo</Label>
                                        <Select
                                            value={newAsset.type}
                                            onValueChange={val => setNewAsset({ ...newAsset, type: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {assetTypes.map(t => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Fecha Adquisición</Label>
                                        <Input
                                            type="date"
                                            value={newAsset.acquisition_date}
                                            onChange={e => setNewAsset({ ...newAsset, acquisition_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Costo Adquisición</Label>
                                        <Input
                                            type="number"
                                            value={newAsset.acquisition_cost}
                                            onChange={e => setNewAsset({ ...newAsset, acquisition_cost: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Valor Actual</Label>
                                        <Input
                                            type="number"
                                            value={newAsset.current_value}
                                            onChange={e => setNewAsset({ ...newAsset, current_value: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Descripción / Notas</Label>
                                    <Input
                                        value={newAsset.description || ''}
                                        onChange={e => setNewAsset({ ...newAsset, description: e.target.value })}
                                        placeholder="Serial, estado, ubicación..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={handleCreateAsset} className="bg-slate-900 text-white">Guardar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="text-right">Costo Orig.</TableHead>
                                <TableHead className="text-right">Valor Actual</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assets.map((asset) => (
                                <TableRow key={asset.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{asset.name}</span>
                                            <span className="text-xs text-slate-500 truncate max-w-[200px]">{asset.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                            {asset.type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {new Date(asset.acquisition_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right text-slate-500">
                                        ${asset.acquisition_cost.toLocaleString('es-CL')}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-900">
                                        ${asset.current_value.toLocaleString('es-CL')}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteAsset(asset.id)}
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {assets.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        No hay activos registrados
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
