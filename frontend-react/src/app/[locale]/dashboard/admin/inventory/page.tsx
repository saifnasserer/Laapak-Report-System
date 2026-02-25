'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, ShoppingCart, Edit, Package, DollarSign, Calendar, User, Layers } from 'lucide-react';

import api from '@/lib/api';
import { use } from 'react';
import { cn } from '@/lib/utils';
import { ClientModal } from '@/components/clients/ClientModal';
import { Modal } from '@/components/ui/Modal';
import { useRouter } from '@/i18n/routing';

export default function InventoryPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sell Modal State
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [selectedReportForSale, setSelectedReportForSale] = useState<any>(null);
    const [salePrice, setSalePrice] = useState('');
    const [clientSearch, setClientSearch] = useState('');
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [isSelling, setIsSelling] = useState(false);
    const [showClientResults, setShowClientResults] = useState(false);

    // New Client State
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    React.useEffect(() => {
        const fetchReports = async () => {
            try {
                setIsLoading(true);
                const response = await api.get('/reports?fetch_mode=all_reports');
                const allReports = response.data;
                const laapakReports = allReports.filter((r: any) =>
                    r.client_name?.toLowerCase().includes('laapak') ||
                    r.client_name?.toLowerCase().includes('لابك')
                );
                setReports(laapakReports);
                setError(null);
            } catch (err: any) {
                console.error('Failed to fetch inventory:', err);
                setError('فشل في تحميل المخزن. يرجى المحاولة لاحقاً.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, []);

    // Fetch clients for search
    React.useEffect(() => {
        if (isSellModalOpen) {
            const fetchClients = async () => {
                try {
                    const res = await api.get('/clients');
                    setClients(res.data.clients || []);
                } catch (e) {
                    console.error(e);
                }
            };
            fetchClients();
        }
    }, [isSellModalOpen]);

    const handleSellClick = (report: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedReportForSale(report);
        setSalePrice(report.cost || '');
        setClientSearch('');
        setSelectedClient(null);
        setIsClientModalOpen(false);
        setIsSellModalOpen(true);
    };

    const handleConfirmSale = async () => {
        if (!selectedClient) {
            alert('يرجى اختيار العميل');
            return;
        }
        if (!salePrice) {
            alert('يرجى تحديد سعر البيع');
            return;
        }

        try {
            setIsSelling(true);
            let finalClient = selectedClient;

            const invoicePayload = {
                client_id: finalClient.id,
                date: new Date().toISOString().split('T')[0],
                items: [{
                    description: `${selectedReportForSale.device_model}`,
                    amount: salePrice,
                    quantity: 1,
                    report_id: selectedReportForSale.id,
                    cost_price: Number(selectedReportForSale.device_price) || 0
                }],
                subtotal: parseFloat(salePrice),
                taxRate: 0,
                tax: 0,
                discount: 0,
                total: parseFloat(salePrice),
                paymentMethod: 'cash',
                paymentStatus: 'unpaid',
                notes: `بيع جهاز من المخزن. المصدر: ${getSourceFromNotes(selectedReportForSale.notes)}`,
                report_ids: [selectedReportForSale.id]
            };

            const invoiceRes = await api.post('/invoices', invoicePayload);

            await api.put(`/reports/${selectedReportForSale.id}`, {
                status: 'completed',
                client_id: finalClient.id,
                client_name: finalClient.name,
                client_phone: finalClient.phone,
                client_address: finalClient.address || '-',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                inspection_date: new Date().toISOString(),
                notes: selectedReportForSale.notes + `\nSOLD TO: ${finalClient.name} on ${new Date().toLocaleDateString()}`
            });

            setIsSellModalOpen(false);
            router.push(`/dashboard/admin/invoices?highlight=${invoiceRes.data.id}`);
            setReports(prev => prev.filter(r => r.id !== selectedReportForSale.id));

        } catch (err) {
            console.error('Sale failed:', err);
            alert('فشل في إتمام عملية البيع');
        } finally {
            setIsSelling(false);
        }
    };

    const filteredReports = reports.filter(report =>
        report.device_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.notes && report.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getSourceFromNotes = (notes: string) => {
        if (!notes) return '-';
        const match = notes.match(/Source: (.*)/) || notes.match(/المصدر: (.*)/);
        return match ? match[1] : '-';
    };

    const totalStockCount = reports.length;
    const totalInventoryValue = reports.reduce((sum, r) => sum + (parseFloat(r.device_price || r.amount || 0) || 0), 0);
    const uniqueModelsCount = new Set(reports.map(r => r.device_model)).size;

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                <Modal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} title="بيع جهاز من المخزن">
                    <div className="space-y-6">
                        <div className="bg-surface-variant/20 p-4 rounded-xl">
                            <p className="text-secondary/60 text-sm">الجهاز المحدد:</p>
                            <p className="font-bold text-lg">{selectedReportForSale?.device_model}</p>
                            <p className="font-mono text-sm text-secondary/40">{selectedReportForSale?.serial_number}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-secondary">العميل</label>
                                <div className="space-y-2 relative">
                                    <Input
                                        placeholder="بحث عن عميل..."
                                        value={clientSearch}
                                        onChange={(e) => {
                                            setClientSearch(e.target.value);
                                            setShowClientResults(true);
                                            setSelectedClient(null);
                                        }}
                                        onFocus={() => setShowClientResults(true)}
                                        className="rounded-full h-12 bg-white/60 backdrop-blur-sm focus:bg-white transition-all font-bold"
                                    />
                                    {showClientResults && clientSearch && (
                                        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-black/5 rounded-2xl shadow-xl max-h-40 overflow-y-auto mt-1">
                                            {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.phone && c.phone.includes(clientSearch))).map(client => (
                                                <div
                                                    key={client.id}
                                                    className="p-3 hover:bg-black/5 cursor-pointer flex justify-between px-4"
                                                    onClick={() => {
                                                        setSelectedClient(client);
                                                        setClientSearch(client.name);
                                                        setShowClientResults(false);
                                                    }}
                                                >
                                                    <span className="font-bold">{client.name}</span>
                                                    <span className="font-mono text-sm opacity-50">{client.phone}</span>
                                                </div>
                                            ))}
                                            {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                                                <div className="p-3 text-center opacity-50 text-sm">لا توجد نتائج</div>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center px-1">
                                        <Button variant="ghost" size="sm" onClick={() => setIsClientModalOpen(true)} className="text-primary text-xs">
                                            + عميل جديد
                                        </Button>
                                        {selectedClient && <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">تم اختيار: {selectedClient.name}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-secondary">سعر البيع</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={salePrice}
                                        onChange={(e) => setSalePrice(e.target.value)}
                                        className="font-mono font-bold text-lg h-12 rounded-full pl-12 bg-white/60"
                                    />
                                    <span className="absolute left-4 top-3 text-secondary/40 font-bold text-sm">ج.م</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-black/5">
                            <Button variant="outline" onClick={() => setIsSellModalOpen(false)} className="rounded-full h-12 px-6">إلغاء</Button>
                            <Button onClick={handleConfirmSale} disabled={isSelling} className="rounded-full h-12 px-8 font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                {isSelling ? 'جاري المعالجة...' : 'تأكيد البيع'}
                            </Button>
                        </div>
                    </div>
                </Modal>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                                <span className="p-3 bg-primary/10 rounded-[1.5rem] text-primary">
                                    <Package size={28} />
                                </span>
                                إدارة المخزن
                            </h1>
                            <p className="text-secondary/70 font-medium mt-2 mr-16">
                                متابعة الأجهزة المتوفرة في المخزن
                            </p>
                        </div>

                        <div className="relative w-full md:w-auto md:min-w-[300px]">
                            <Search className="absolute right-4 top-3.5 h-4 w-4 text-secondary/40" />
                            <Input
                                placeholder="بحث بالموديل أو السيريال..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-11 h-12 rounded-full border-primary/20 bg-white/60 backdrop-blur-sm focus:bg-white transition-all font-bold"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative group rounded-[2.5rem] p-1 bg-white/40">
                            <div className="flex items-center justify-between p-6 rounded-[2.3rem] bg-white/60 backdrop-blur-sm border border-primary/10 h-full">
                                <div>
                                    <p className="text-secondary/40 text-xs font-bold uppercase tracking-wider mb-2">العدد الكلي</p>
                                    <h3 className="text-4xl font-black text-primary">{totalStockCount}</h3>
                                </div>
                                <div className="w-14 h-14 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                                    <Package size={28} />
                                </div>
                            </div>
                        </div>

                        <div className="relative group rounded-[2.5rem] p-1 bg-white/40">
                            <div className="flex items-center justify-between p-6 rounded-[2.3rem] bg-white/60 backdrop-blur-sm border border-primary/10 h-full">
                                <div>
                                    <p className="text-secondary/40 text-xs font-bold uppercase tracking-wider mb-2">القيمة التقديرية</p>
                                    <h3 className="text-4xl font-black text-secondary flex items-baseline gap-1">
                                        {totalInventoryValue.toLocaleString()} <span className="text-sm opacity-50 font-normal">ج.م</span>
                                    </h3>
                                </div>
                                <div className="w-14 h-14 rounded-3xl bg-surface-variant text-secondary/60 flex items-center justify-center">
                                    <DollarSign size={28} />
                                </div>
                            </div>
                        </div>

                        <div className="relative group rounded-[2.5rem] p-1 bg-white/40">
                            <div className="flex items-center justify-between p-6 rounded-[2.3rem] bg-white/60 backdrop-blur-sm border border-primary/10 h-full">
                                <div>
                                    <p className="text-secondary/40 text-xs font-bold uppercase tracking-wider mb-2">موديلات متنوعة</p>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-4xl font-black text-blue-600">
                                            {uniqueModelsCount}
                                        </h3>
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-[10px] font-bold">موديل</span>
                                    </div>
                                </div>
                                <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Layers size={28} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-surface-variant/50 animate-pulse rounded-[3rem]" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center text-destructive font-bold bg-destructive/5 rounded-[3rem]">{error}</div>
                    ) : filteredReports.length === 0 ? (
                        <div className="text-center py-20 bg-white/30 rounded-[3rem] border border-dashed border-primary/10">
                            <div className="w-20 h-20 bg-surface-variant/30 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary/30">
                                <Package size={40} />
                            </div>
                            <h3 className="font-bold text-xl text-secondary/70">لا توجد أجهزة</h3>
                            <p className="text-secondary/40">لا توجد أجهزة مطابقة للبحث في المخزن</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="relative group rounded-[3.2rem] p-1 transition-all duration-300 bg-white/40 hover:bg-white/60"
                                >
                                    <div
                                        onClick={() => router.push(`/dashboard/admin/reports/${report.id}`)}
                                        className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-[3rem] bg-white/60 backdrop-blur-sm border border-primary/10 cursor-pointer hover:border-primary/20 transition-all font-bold"
                                    >
                                        <div className="flex items-center gap-5 w-full md:w-auto">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-black/5 flex items-center justify-center text-secondary/60 shrink-0">
                                                <Package size={28} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-lg text-foreground">{report.device_model}</h3>
                                                    <Badge variant="outline" className="font-mono bg-white text-[10px] px-2 border-primary/10 text-primary">
                                                        #{report.id}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-secondary/60">
                                                    <span className="font-mono bg-surface-variant/50 px-2 py-0.5 rounded-full text-xs">S/N: {report.serial_number || '-'}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {new Date(report.created_at || report.createdAt).toLocaleDateString('en-GB')}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <User size={12} />
                                                        {getSourceFromNotes(report.notes)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                            <Button
                                                onClick={(e) => handleSellClick(report, e)}
                                                className="rounded-full h-11 px-6 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-600/10 hover:shadow-green-600/20 active:scale-95 transition-all text-sm gap-2"
                                            >
                                                <ShoppingCart size={16} />
                                                بيع فوري
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/admin/reports/${report.id}/edit`);
                                                }}
                                                className="rounded-full w-11 h-11 bg-surface-variant hover:bg-primary hover:text-white transition-all"
                                            >
                                                <Edit size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <ClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onSuccess={(client) => {
                    setSelectedClient(client);
                    setClientSearch(client.name);
                    setIsClientModalOpen(false);
                    api.get('/clients').then(res => setClients(res.data.clients || []));
                }}
            />
        </DashboardLayout>
    );
}
