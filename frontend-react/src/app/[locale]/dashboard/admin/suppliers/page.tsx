'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Plus, MoreHorizontal, LayoutDashboard, Store, Wallet, CreditCard, ArrowUpRight, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { SupplierModal } from '@/components/suppliers/SupplierModal';

export default function SuppliersAdminPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({ total_debt: 0, total_paid: 0, balance: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState<any>(null);

    const resetForm = () => {
        setIsEditMode(false);
        setCurrentSupplier(null);
    };

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
            const summaryRes = await api.get('/suppliers/summary');
            setSuppliers(summaryRes.data.data || []);
            setSummary(summaryRes.data.data ? {
                total_debt: summaryRes.data.data.reduce((acc: number, s: any) => acc + Number(s.total_debt || 0), 0),
                total_paid: summaryRes.data.data.reduce((acc: number, s: any) => acc + Number(s.total_paid || 0), 0),
                balance: summaryRes.data.data.reduce((acc: number, s: any) => acc + Number(s.balance || 0), 0)
            } : { total_debt: 0, total_paid: 0, balance: 0 });
        } catch (error) {
            console.error('Failed to fetch suppliers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleOpenCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (supplier: any) => {
        setCurrentSupplier(supplier);
        setIsEditMode(true);
        setIsModalOpen(true);
        setActiveMenuId(null);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا المورد؟ لا يمكن الحذف إذا وجد بيانات مرتبطة به.')) return;

        try {
            await api.delete(`/suppliers/${id}`);
            setSuppliers(prev => prev.filter(s => s.id !== id));
            setActiveMenuId(null);
        } catch (error: any) {
            console.error('Failed to delete supplier:', error);
            alert(error.response?.data?.message || 'فشل حذف المورد');
        }
    };

    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);

    const toggleMenu = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeMenuId === id) {
            setActiveMenuId(null);
            setMenuPosition(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setActiveMenuId(id);
            setMenuPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX
            });
        }
    };

    useEffect(() => {
        const handleClickOutside = () => {
            setActiveMenuId(null);
            setMenuPosition(null);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const filteredSuppliers = suppliers.filter(s =>
    (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.includes(searchTerm) ||
        s.code?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                            <span className="p-3 bg-primary/10 rounded-[1.5rem] text-primary">
                                <Store size={28} />
                            </span>
                            الموردين
                        </h1>
                        <p className="text-secondary/70 font-medium mt-2 mr-16">
                            إدارة مصادر الأجهزة والحسابات المالية للموردين
                        </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-auto md:min-w-[300px]">
                            <Search className="absolute right-4 top-3.5 h-4 w-4 text-secondary/40" />
                            <Input
                                placeholder="ابحث باسم المورد أو الكود..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-11 h-12 rounded-full border-primary/20 bg-white/60 backdrop-blur-sm focus:bg-white transition-all font-bold"
                            />
                        </div>
                        <Button
                            onClick={handleOpenCreate}
                            className="rounded-full bg-primary text-white font-black h-12 px-8 shadow-xl shadow-primary/20 hover:scale-105 transition-all flex flex-row items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            إضافة مورد
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative group rounded-[2.5rem] p-1 bg-white/40">
                        <div className="flex items-center justify-between p-6 rounded-[2.3rem] bg-white/60 backdrop-blur-sm border border-primary/10 h-full">
                            <div>
                                <p className="text-secondary/40 text-xs font-bold uppercase tracking-wider mb-2 text-red-500">إجمالي المديونية</p>
                                <h3 className="text-4xl font-black text-secondary flex items-baseline gap-1">
                                    {Number(summary.total_debt || 0).toLocaleString()} <span className="text-sm opacity-50 font-normal">ج.م</span>
                                </h3>
                            </div>
                            <div className="w-14 h-14 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center">
                                <CreditCard size={28} />
                            </div>
                        </div>
                    </div>

                    <div className="relative group rounded-[2.5rem] p-1 bg-white/40">
                        <div className="flex items-center justify-between p-6 rounded-[2.3rem] bg-white/60 backdrop-blur-sm border border-primary/10 h-full">
                            <div>
                                <p className="text-secondary/40 text-xs font-bold uppercase tracking-wider mb-2 text-emerald-500">إجمالي المسدد</p>
                                <h3 className="text-4xl font-black text-secondary flex items-baseline gap-1">
                                    {Number(summary.total_paid || 0).toLocaleString()} <span className="text-sm opacity-50 font-normal">ج.م</span>
                                </h3>
                            </div>
                            <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                <Wallet size={28} />
                            </div>
                        </div>
                    </div>

                    <div className="relative group rounded-[2.5rem] p-1 bg-white/40">
                        <div className="flex items-center justify-between p-6 rounded-[2.3rem] bg-white/60 backdrop-blur-sm border border-primary/10 h-full">
                            <div>
                                <p className="text-secondary/40 text-xs font-bold uppercase tracking-wider mb-2 text-primary">الرصيد المتبقي</p>
                                <h3 className="text-4xl font-black text-secondary flex items-baseline gap-1">
                                    {Number(summary.balance || 0).toLocaleString()} <span className="text-sm opacity-50 font-normal">ج.م</span>
                                </h3>
                            </div>
                            <div className="w-14 h-14 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                                <ArrowUpRight size={28} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Suppliers List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-surface-variant/50 animate-pulse rounded-[3rem]" />
                            ))}
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div className="text-center py-20 bg-white/30 rounded-[3rem] border border-dashed border-primary/10">
                            <div className="w-20 h-20 bg-surface-variant/30 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary/30">
                                <Store size={40} />
                            </div>
                            <h3 className="font-bold text-xl text-secondary/70">لا يوجد موردين</h3>
                            <p className="text-secondary/40">لم يتم العثور على موردين مطابقين للبحث</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredSuppliers.map((s) => (
                                <div
                                    key={s.id}
                                    className="relative group rounded-[3.2rem] p-1 transition-all duration-300 bg-white/40 hover:bg-white/60"
                                >
                                    <div
                                        onClick={() => router.push(`/${locale}/dashboard/admin/suppliers/${s.id}`)}
                                        className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-[3rem] bg-white/60 backdrop-blur-sm border border-primary/10 cursor-pointer hover:border-primary/20 transition-all font-bold"
                                    >
                                        <div className="flex items-center gap-5 w-full md:w-auto">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center font-black text-xl capitalize shrink-0">
                                                {s.name?.[0]}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-lg text-foreground">{s.name}</h3>
                                                    <Badge variant="outline" className="font-mono bg-white text-[10px] px-2 border-primary/10 text-primary uppercase">
                                                        {s.code || '---'}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-secondary/60">
                                                    <span className="font-mono bg-surface-variant/50 px-2 py-0.5 rounded-full text-xs dir-ltr">{s.phone || '---'}</span>
                                                    <span>المسئول: {s.contact_person || 'لا يوجد'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                                            <div className="flex flex-wrap items-center gap-6 text-left md:text-right pr-4">
                                                <div>
                                                    <div className="text-[10px] text-secondary/40 font-black uppercase tracking-widest mb-1 opacity-60">المديونية</div>
                                                    <div className="font-black text-xl font-mono text-red-600">
                                                        {Number(s.total_debt || 0).toLocaleString()}
                                                        <span className="text-[10px] mr-1 opacity-50 font-bold">ج.م</span>
                                                    </div>
                                                </div>
                                                <div className="w-px h-8 bg-black/5 hidden md:block"></div>
                                                <div>
                                                    <div className="text-[10px] text-secondary/40 font-black uppercase tracking-widest mb-1 opacity-60">المسدد</div>
                                                    <div className="font-black text-xl font-mono text-emerald-600">
                                                        {Number(s.total_paid || 0).toLocaleString()}
                                                        <span className="text-[10px] mr-1 opacity-50 font-bold">ج.م</span>
                                                    </div>
                                                </div>
                                                <div className="w-px h-8 bg-black/5 hidden md:block"></div>
                                                <div>
                                                    <div className="text-[10px] text-secondary/40 font-black uppercase tracking-widest mb-1 opacity-60">الرصيد</div>
                                                    <div className={`font-black text-2xl font-mono ${Number(s.balance || 0) > 0 ? 'text-red-600' : 'text-primary'}`}>
                                                        {Math.abs(Number(s.balance || 0)).toLocaleString()}
                                                        <span className="text-xs mr-1 opacity-50 font-bold">ج.م</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-full w-11 h-11 bg-surface-variant hover:bg-primary hover:text-white transition-all p-0"
                                                    onClick={(e) => toggleMenu(s.id, e)}
                                                >
                                                    <MoreHorizontal size={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <SupplierModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                isEditMode={isEditMode}
                initialData={currentSupplier}
                onSuccess={(s) => {
                    if (isEditMode) {
                        setSuppliers(prev => prev.map(item => item.id === s.id ? { ...item, ...s } : item));
                    } else {
                        setSuppliers(prev => [s, ...prev]);
                    }
                    setIsModalOpen(false);
                }}
            />

            {/* Portal Action Menu */}
            {activeMenuId !== null && menuPosition && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed z-[9999] bg-white border border-black/5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-200 min-w-[12rem] p-2"
                    style={{
                        top: menuPosition.top + 8,
                        left: menuPosition.left - 160,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="w-full text-right px-4 py-3 text-sm font-black hover:bg-primary/5 hover:text-primary rounded-xl transition-all flex items-center justify-between gap-3 group"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/${locale}/dashboard/admin/suppliers/${activeMenuId}`);
                            setActiveMenuId(null);
                        }}
                    >
                        <span>عرض الملف الشخصي</span>
                        <LayoutDashboard size={18} className="text-secondary/20 group-hover:text-primary/40" />
                    </button>
                    <button
                        className="w-full text-right px-4 py-3 text-sm font-black hover:bg-black/5 rounded-xl transition-all flex items-center justify-between gap-3 group"
                        onClick={(e) => {
                            e.stopPropagation();
                            const supplier = suppliers.find(s => s.id === activeMenuId);
                            if (supplier) handleOpenEdit(supplier);
                        }}
                    >
                        <span>تعديل البيانات</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mr-auto" />
                    </button>
                    <div className="h-px bg-black/5 my-1 mx-2" />
                    <button
                        className="w-full text-right px-4 py-3 text-sm font-black text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center justify-between gap-3 group"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(activeMenuId);
                        }}
                    >
                        <span>حذف المورد</span>
                        <Trash2 size={18} className="text-red-200 group-hover:text-red-500/40" />
                    </button>
                </div>,
                document.body
            )}
        </DashboardLayout>
    );
}
