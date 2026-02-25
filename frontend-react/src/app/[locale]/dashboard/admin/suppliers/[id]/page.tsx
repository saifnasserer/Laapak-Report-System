'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Store,
    ArrowLeft,
    Calendar,
    CreditCard,
    Wallet,
    ArrowUpRight,
    Package,
    FileText,
    Edit,
    Plus,
    History,
    ChevronLeft,
    TrendingUp,
    Edit2,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { SupplierModal } from '@/components/suppliers/SupplierModal';
import { cn } from '@/lib/utils';

export default function SupplierProfilePage({ params }: { params: Promise<{ locale: string, id: string }> }) {
    const { locale, id } = use(params);
    const router = useRouter();
    const [supplier, setSupplier] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'reports' | 'expenses'>('reports');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCostModalOpen, setIsCostModalOpen] = useState(false);
    const [selectedReportForCost, setSelectedReportForCost] = useState<any>(null);
    const [isUpdatingCost, setIsUpdatingCost] = useState(false);

    const fetchSupplierData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/suppliers/${id}`);
            setSupplier(response.data.data);
        } catch (error) {
            console.error('Failed to fetch supplier data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSupplierData();
    }, [id]);

    const handleUpdateCost = async (reportId: string, itemId: number | null, newCost: number) => {
        setIsUpdatingCost(true);
        try {
            if (itemId) {
                const response = await api.put(`/financial/cost-price/${itemId}`, {
                    cost_price: newCost
                });
                if (response.data.success) {
                    await fetchSupplierData();
                    setIsCostModalOpen(false);
                }
            } else {
                // Fallback: Update report device_price if no invoice item exists
                const response = await api.put(`/reports/${reportId}`, {
                    device_price: newCost
                });
                if (response.status === 200) {
                    await fetchSupplierData();
                    setIsCostModalOpen(false);
                }
            }
        } catch (error) {
            console.error('Error updating cost:', error);
            alert('فشل في تحديث التكلفة');
        } finally {
            setIsUpdatingCost(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="p-20 text-center font-black text-secondary/40 animate-pulse">جاري تحميل بيانات المورد...</div>
            </DashboardLayout>
        );
    }

    if (!supplier) {
        return (
            <DashboardLayout>
                <div className="p-20 text-center">
                    <h2 className="text-2xl font-black text-destructive">المورد غير موجود</h2>
                    <Button onClick={() => router.back()} className="mt-4">العودة</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-20">
                {/* Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="w-12 h-12 p-0 rounded-full bg-white/50 hover:bg-white/80 backdrop-blur-sm border border-black/5 flex-shrink-0"
                        >
                            <ArrowLeft size={24} />
                        </Button>
                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center font-black text-2xl capitalize shrink-0 shadow-inner">
                            {supplier.name?.[0]}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black tracking-tight text-foreground">{supplier.name}</h1>
                                {supplier.code && (
                                    <Badge variant="outline" className="font-mono bg-white text-xs px-3 py-1 border-primary/10 text-primary uppercase">
                                        {supplier.code}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-secondary/50 font-bold flex items-center gap-2">
                                <Store size={16} />
                                {supplier.contact_person || 'لا يوجد مسئول تواصل'} • <span className="dir-ltr">{supplier.phone || 'بدون رقم هاتف'}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(true)}
                            className="rounded-full bg-white/60 backdrop-blur-sm border-black/5 h-12 px-6 font-bold hover:bg-white/80 gap-2 shadow-sm"
                        >
                            <Edit size={18} />
                            تعديل البيانات
                        </Button>
                        <Button
                            onClick={() => router.push(`/${locale}/dashboard/admin/reports/new?supplier_id=${id}`)}
                            className="rounded-full bg-primary text-white h-12 px-8 font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all gap-2"
                        >
                            <Plus size={20} />
                            إضافة جهاز من المورد
                        </Button>
                    </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative group rounded-[2.5rem] p-1 bg-white/40">
                        <div className="flex items-center justify-between p-6 rounded-[2.3rem] bg-white/60 backdrop-blur-sm border border-primary/10 h-full transition-all hover:border-primary/20">
                            <div>
                                <p className="text-secondary/40 text-[10px] font-bold uppercase tracking-widest mb-2">إجمالي المشتريات</p>
                                <h3 className="text-3xl font-black text-red-600 flex items-baseline gap-1">
                                    {Number(supplier.total_debt || 0).toLocaleString()}
                                    <span className="text-xs text-red-600/50 font-bold">ج.م</span>
                                </h3>
                            </div>
                            <div className="w-14 h-14 rounded-3xl bg-red-500/10 text-red-600 flex items-center justify-center">
                                <CreditCard size={28} />
                            </div>
                        </div>
                    </div>

                    <div className="relative group rounded-[2.5rem] p-1 bg-white/40">
                        <div className="flex items-center justify-between p-6 rounded-[2.3rem] bg-white/60 backdrop-blur-sm border border-primary/10 h-full transition-all hover:border-primary/20">
                            <div>
                                <p className="text-secondary/40 text-[10px] font-bold uppercase tracking-widest mb-2">إجمالي النقدية المدفوعة</p>
                                <h3 className="text-3xl font-black text-emerald-600 flex items-baseline gap-1">
                                    {Number(supplier.total_paid || 0).toLocaleString()}
                                    <span className="text-xs text-emerald-600/50 font-bold">ج.م</span>
                                </h3>
                            </div>
                            <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                <Wallet size={28} />
                            </div>
                        </div>
                    </div>

                    <div className="relative group rounded-[2.5rem] p-1 bg-white/40">
                        <div className="flex items-center justify-between p-6 rounded-[2.3rem] bg-white/60 backdrop-blur-sm border border-primary/10 h-full transition-all hover:border-primary/20">
                            <div>
                                <p className="text-secondary/40 text-[10px] font-bold uppercase tracking-widest mb-2">الرصيد المتبقي للمورد</p>
                                <h3 className="text-3xl font-black text-primary flex items-baseline gap-1">
                                    {Number(supplier.balance || 0).toLocaleString()}
                                    <span className="text-xs text-primary/50 font-bold">ج.م</span>
                                </h3>
                            </div>
                            <div className="w-14 h-14 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                                <ArrowUpRight size={28} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Tabbed Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 bg-black/[0.02] p-1.5 rounded-2xl border border-black/5 w-fit">
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                                activeTab === 'reports' ? "bg-white text-primary shadow-sm" : "text-secondary/40 hover:text-secondary"
                            )}
                        >
                            <Package size={18} />
                            الأجهزة المستوردة ({supplier.reports?.length || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('expenses')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                                activeTab === 'expenses' ? "bg-white text-primary shadow-sm" : "text-secondary/40 hover:text-secondary"
                            )}
                        >
                            <History size={18} />
                            سجل الدفعات ({supplier.expenses?.length || 0})
                        </button>
                    </div>

                    <div className="mt-6 md:mt-8">
                        {activeTab === 'reports' ? (
                            <div className="space-y-4">
                                {supplier.reports && supplier.reports.length > 0 ? supplier.reports.map((r: any) => {
                                    const displayCost = Number(r.device_price || 0);

                                    const invoiceSellPrice = r.invoiceItems?.[0]?.totalAmount;
                                    const reportSellPrice = r.amount;
                                    const displaySellPrice = (invoiceSellPrice !== null && invoiceSellPrice !== undefined && Number(invoiceSellPrice) > 0)
                                        ? Number(invoiceSellPrice)
                                        : Number(reportSellPrice || 0);

                                    const hasMissingCost = displayCost === 0;

                                    return (
                                        <div
                                            key={r.id}
                                            className={`relative group rounded-[3.2rem] p-1 transition-all duration-300 ${hasMissingCost
                                                ? 'bg-gradient-to-l from-amber-500/10 to-transparent hover:from-amber-500/20'
                                                : 'bg-white/40 hover:bg-white/60'
                                                }`}
                                        >
                                            <div className={`
                                                    flex flex-col md:flex-row items-center justify-between gap-6 p-6 
                                                    rounded-[3rem] bg-white/60 backdrop-blur-sm border 
                                                    ${hasMissingCost ? 'border-amber-500/30' : 'border-primary/10'} 
                                                    transition-all font-bold
                                                `}>
                                                {/* Left: Icon & Info */}
                                                <div className="flex items-center gap-5 w-full md:w-auto">
                                                    <div className={`
                                                            w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner
                                                            ${hasMissingCost ? 'bg-amber-500/10 text-amber-600' : 'bg-black/5 text-secondary/60'}
                                                        `}>
                                                        <Package size={28} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-lg text-foreground truncate">{r.device_model}</h3>
                                                            <Badge variant="outline" className="font-mono bg-white text-[10px] px-2 border-primary/10 text-primary">
                                                                #{r.id.slice(-6).toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-secondary/60">
                                                            <span className="font-mono bg-surface-variant/50 px-2 py-0.5 rounded-full text-xs">
                                                                S/N: {r.serial_number || '---'}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={12} />
                                                                {r.inspection_date ? format(new Date(r.inspection_date), 'dd/MM/yyyy') : '---'}
                                                            </span>
                                                            <Badge variant={r.status === 'completed' ? 'primary' : 'outline'} className="rounded-full text-[10px] h-5">
                                                                {r.status === 'completed' ? 'مكتمل' : r.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Middle: Status Warning if missing cost */}
                                                {hasMissingCost && (
                                                    <div className="hidden lg:flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100 animate-pulse">
                                                        <AlertCircle size={16} />
                                                        <span className="text-xs font-black">يرجى تحديد التكلفة</span>
                                                    </div>
                                                )}

                                                {/* Right: Cost & Actions */}
                                                <div className="flex items-center justify-between w-full md:w-auto gap-8 pl-2">
                                                    <div className="flex items-center gap-6 text-left md:text-right">
                                                        <div>
                                                            <div className="text-[10px] text-secondary/40 font-black uppercase tracking-widest mb-1 opacity-60">سعر البيع</div>
                                                            <div className="font-black text-xl font-mono text-emerald-600">
                                                                {displaySellPrice.toLocaleString()}
                                                                <span className="text-[10px] mr-1 opacity-50 font-bold">ج.م</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-px h-8 bg-black/5 hidden md:block"></div>
                                                        <div>
                                                            <div className="text-[10px] text-secondary/40 font-black uppercase tracking-widest mb-1 opacity-60">سعر التكلفة</div>
                                                            <div className={`font-black text-2xl font-mono ${hasMissingCost ? 'text-amber-500' : 'text-primary'}`}>
                                                                {displayCost.toLocaleString()}
                                                                <span className="text-xs mr-1 opacity-50 font-bold">ج.م</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedReportForCost(r);
                                                                setIsCostModalOpen(true);
                                                            }}
                                                            size="icon"
                                                            variant="ghost"
                                                            className={`
                                                                    rounded-full w-12 h-12 transition-all 
                                                                    ${hasMissingCost
                                                                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20'
                                                                    : 'bg-primary/5 text-primary hover:bg-primary hover:text-white'}
                                                                `}
                                                        >
                                                            <Edit2 size={20} />
                                                        </Button>
                                                        <Button
                                                            onClick={() => router.push(`/${locale}/dashboard/admin/reports/${r.id}/edit`)}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="rounded-full w-12 h-12 bg-black/5 text-secondary hover:bg-black/10 transition-all"
                                                        >
                                                            <ChevronLeft size={22} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-20 text-secondary/30 font-bold">
                                        <Package size={40} className="mx-auto mb-3 opacity-20" />
                                        لا توجد أجهزة مسجلة لهذا المورد
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {supplier.expenses && supplier.expenses.length > 0 ? supplier.expenses.map((ex: any) => (
                                    <div
                                        key={ex.id}
                                        className="relative group rounded-[3.2rem] p-1 transition-all duration-300 bg-white/40 hover:bg-white/60"
                                    >
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-[3rem] bg-white/60 backdrop-blur-sm border border-primary/10 transition-all font-bold">
                                            <div className="flex items-center gap-5 w-full md:w-auto">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-black/5 flex items-center justify-center text-secondary/60 shrink-0">
                                                    <History size={28} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-lg text-foreground">{ex.name_ar || ex.name}</h3>
                                                        <Badge variant="outline" className="font-mono bg-white text-[10px] px-2 border-primary/10 text-primary">
                                                            #{ex.id}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-secondary/60">
                                                        <span className="flex items-center gap-1 font-mono">
                                                            <Calendar size={12} />
                                                            {ex.date ? format(new Date(ex.date), 'dd/MM/yyyy') : '---'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <CreditCard size={12} />
                                                            {ex.payment_method || 'نقدي'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between w-full md:w-auto gap-8 pl-2">
                                                <div className="text-left md:text-right">
                                                    <div className="text-xs text-secondary/50 mb-1 font-medium italic opacity-60">المبلغ المدفوع</div>
                                                    <div className="font-black text-2xl font-mono text-green-600">
                                                        {Number(ex.amount || 0).toLocaleString()}
                                                        <span className="text-xs mr-1 opacity-50 font-bold">ج.م</span>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => router.push(`/${locale}/dashboard/admin/financial/expenses`)}
                                                    size="icon"
                                                    variant="ghost"
                                                    className="rounded-full w-12 h-12 bg-black/5 text-secondary hover:bg-black/10 transition-all"
                                                >
                                                    <ChevronLeft size={22} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-20 text-secondary/30 font-bold">
                                        <History size={40} className="mx-auto mb-3 opacity-20" />
                                        لا توجد دفعات مسجلة لهذا المورد
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SupplierModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                isEditMode={true}
                initialData={supplier}
                onSuccess={(s) => {
                    setSupplier((prev: any) => ({ ...prev, ...s }));
                    setIsModalOpen(false);
                }}
            />

            {/* Cost Editing Modal */}
            <Modal
                isOpen={isCostModalOpen}
                onClose={() => {
                    setIsCostModalOpen(false);
                    fetchSupplierData();
                }}
                title="تعديل التكاليف"
                className="max-w-[600px]"
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-2xl text-primary">
                                <Edit2 size={20} />
                            </div>
                            <span className="font-bold text-lg text-secondary">قائمة بنود الفاتورة</span>
                        </div>
                        <Badge variant="outline" className="font-mono bg-white/50 border-primary/20 px-3 py-1 rounded-full uppercase tracking-tighter">
                            #{selectedReportForCost?.id?.slice(-6).toUpperCase()}
                        </Badge>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
                        {(() => {
                            const items = (selectedReportForCost?.invoiceItems && selectedReportForCost.invoiceItems.length > 0)
                                ? selectedReportForCost.invoiceItems.map((item: any) => ({
                                    ...item,
                                    description: item.item_description || selectedReportForCost.device_model,
                                    id: item.id || item.item_id,
                                    sale_price: item.totalAmount || 0
                                }))
                                : [{
                                    id: null,
                                    description: selectedReportForCost?.device_model,
                                    cost_price: selectedReportForCost?.device_price,
                                    sale_price: selectedReportForCost?.amount,
                                    quantity: 1
                                }];

                            return (
                                <div className="grid gap-3">
                                    {items.map((item: any, idx: number) => (
                                        <div key={item.id || idx} className="group p-4 bg-black/[0.02] hover:bg-black/[0.04] border border-primary/10 rounded-[2rem] transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="font-bold text-secondary text-sm">{item.description}</div>
                                                <Badge variant="secondary" className="font-mono bg-white text-[10px] px-2 rounded-full">
                                                    x{item.quantity}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-secondary/40 uppercase px-2">سعر التكلفة (للقطعة)</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            defaultValue={item.cost_price || ''}
                                                            className={`h-11 rounded-full bg-white border-primary/20 focus:border-primary transition-all font-mono text-right dir-rtl ${!item.cost_price ? 'ring-2 ring-amber-500/20' : ''}`}
                                                            placeholder="0.00"
                                                            onBlur={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (!isNaN(val) && val !== item.cost_price) {
                                                                    handleUpdateCost(selectedReportForCost.id, item.id, val);
                                                                }
                                                            }}
                                                        />
                                                        <span className="absolute left-3 top-3 text-[10px] text-secondary/30 font-bold">ج.م</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 opacity-60">
                                                    <Label className="text-[10px] font-black text-secondary/40 uppercase px-2">سعر البيع</Label>
                                                    <div className="h-11 flex items-center justify-end px-5 bg-black/5 rounded-full font-mono font-black text-xs text-secondary/60">
                                                        {Number(item.sale_price || 0).toLocaleString()} ج.م
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

                    <div className="pt-6 border-t border-primary/10 flex gap-3 mt-4">
                        <Button
                            onClick={() => setIsCostModalOpen(false)}
                            className="w-full h-12 rounded-full font-black bg-primary text-white active:scale-[0.98] transition-all"
                        >
                            {isUpdatingCost ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'حفظ وإغلاق'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
