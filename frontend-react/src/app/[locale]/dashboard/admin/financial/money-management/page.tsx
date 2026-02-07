'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
    Wallet,
    Landmark,
    Coins,
    ArrowRightLeft,
    Download,
    Upload,
    RefreshCw,
    History,
    Calendar,
    MapPin
} from 'lucide-react';
import MoneyActionModals from '@/components/financial/MoneyActionModals';

export default function MoneyManagementPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'transfer' | 'deposit' | 'withdrawal';
    }>({
        isOpen: false,
        type: 'transfer'
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/money/dashboard');
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching money dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (type: 'transfer' | 'deposit' | 'withdrawal') => {
        setModalConfig({ isOpen: true, type });
    };

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    const locations = data?.locations || [];
    const uniqueLocations = locations.filter((loc: any, index: number, self: any[]) =>
        index === self.findIndex((t: any) => t.id === loc.id)
    );
    const movements = data?.recentMovements || [];
    const totalBalance = uniqueLocations.reduce((sum: number, loc: any) => sum + Number(loc.balance || 0), 0);

    return (
        <DashboardLayout>
            <div className="space-y-10 max-w-6xl mx-auto pb-10 px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                            <span className="p-3 bg-primary/10 rounded-[1.5rem] text-primary shadow-sm">
                                <Wallet size={28} />
                            </span>
                            إدارة الأموال
                        </h1>
                        <p className="text-secondary/70 font-medium mt-2 mr-16">
                            تتبع الخزائن، المحافظ الرقمية، والحسابات البنكية
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => openModal('transfer')} className="h-12 rounded-full px-6 gap-2 bg-primary text-white hover:scale-105 transition-all font-bold shadow-lg shadow-primary/20">
                            <ArrowRightLeft className="h-4 w-4" /> تحويل
                        </Button>
                        <Button onClick={() => openModal('deposit')} variant="outline" className="h-12 rounded-full px-6 gap-2 bg-white/60 backdrop-blur-sm text-green-600 border-green-200 hover:bg-green-50 hover:scale-105 transition-all font-bold">
                            <Download className="h-4 w-4" /> إيداع
                        </Button>
                        <Button onClick={() => openModal('withdrawal')} variant="outline" className="h-12 rounded-full px-6 gap-2 bg-white/60 backdrop-blur-sm text-red-600 border-red-200 hover:bg-red-50 hover:scale-105 transition-all font-bold">
                            <Upload className="h-4 w-4" /> سحب
                        </Button>
                    </div>
                </div>

                {/* Summary Stats & Accounts Row */}
                <div className="space-y-6">
                    {/* Summary Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 flex items-center justify-between overflow-hidden relative group">
                            <div className="absolute -right-6 -bottom-6 text-primary/5 transition-transform duration-500 group-hover:scale-110 pointer-events-none">
                                <Wallet size={140} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-primary/60 mb-1">إجمالي الرصيد المتاح</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black font-mono text-primary leading-none">{totalBalance.toLocaleString()}</span>
                                    <span className="text-sm font-bold text-primary/50 uppercase">ج.م</span>
                                </div>
                            </div>
                            <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary relative z-10 shadow-inner">
                                <Wallet size={32} />
                            </div>
                        </div>

                        <div className="bg-white/40 backdrop-blur-md border border-primary/10 rounded-[2.5rem] p-8 flex items-center justify-between overflow-hidden relative group">
                            <div className="absolute -right-6 -bottom-6 text-secondary/5 pointer-events-none">
                                <Landmark size={140} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-secondary/60 mb-1">الحسابات النشطة</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black font-mono text-foreground leading-none">{uniqueLocations.length}</span>
                                    <span className="text-sm font-bold text-secondary/40 font-medium">حساب</span>
                                </div>
                            </div>
                            <div className="w-16 h-16 bg-surface-variant/50 rounded-[1.5rem] flex items-center justify-center text-secondary relative z-10 shadow-inner">
                                <Landmark size={32} />
                            </div>
                        </div>
                    </div>

                    {/* Accounts Horizontal Section */}
                    <div className="bg-white/30 backdrop-blur-sm border border-primary/5 rounded-[2.5rem] p-3 shadow-sm">
                        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none px-2 pt-2">
                            {isLoading ? (
                                [1, 2, 3, 4].map(i => (
                                    <div key={i} className="min-w-[200px] h-16 bg-surface-variant/40 animate-pulse rounded-2xl" />
                                ))
                            ) : uniqueLocations.length > 0 ? (
                                uniqueLocations.map((loc: any) => (
                                    <div key={loc.id} className="min-w-[220px] flex items-center gap-3 p-3 rounded-2xl hover:bg-white/60 transition-all group flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                                            ${loc.type === 'bank' ? 'bg-blue-100/50 text-blue-600' :
                                                loc.type === 'wallet' ? 'bg-purple-100/50 text-purple-600' :
                                                    'bg-green-100/50 text-green-600'}`}>
                                            {loc.type === 'bank' ? <Landmark size={18} /> :
                                                loc.type === 'wallet' ? <Wallet size={18} /> :
                                                    <Coins size={18} />}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-sm text-foreground truncate">{loc.name_ar}</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-black font-mono text-primary text-base">{Number(loc.balance || 0).toLocaleString()}</span>
                                                <span className="text-[10px] text-secondary/40 font-bold">ج.م</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center w-full py-4 text-xs font-bold opacity-30">لا توجد حسابات</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Movements Section - Full Width Tabular */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                <History size={20} />
                            </div>
                            <h2 className="text-xl font-black">سجل الحركات المالية</h2>
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchData} className="rounded-full text-secondary/40 hover:text-primary hover:bg-primary/5 transition-all">
                            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {/* Table Header (Hidden on Mobile) */}
                        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-3 text-[11px] font-black text-secondary/40 uppercase tracking-widest border-b border-primary/5">
                            <div className="col-span-1">التاريخ</div>
                            <div className="col-span-2">المعاملة</div>
                            <div className="col-span-4">البيان</div>
                            <div className="col-span-3 text-center">الحساب</div>
                            <div className="col-span-2 text-left">المبلغ</div>
                        </div>

                        {isLoading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-surface-variant/40 animate-pulse rounded-3xl" />
                            ))
                        ) : movements.length > 0 ? (
                            movements.map((move: any) => (
                                <div key={move.id} className="group relative rounded-3xl transition-all duration-300 bg-white/40 hover:bg-primary/[0.03] border border-primary/5 hover:border-primary/10">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-4 p-4 lg:px-8">
                                        {/* Date Column */}
                                        <div className="col-span-1 flex flex-row lg:flex-col items-center lg:items-start gap-2 lg:gap-0">
                                            <span className="text-sm font-bold text-foreground">
                                                {new Date(move.movement_date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                            </span>
                                            <span className="text-[10px] font-medium text-secondary/40">
                                                {new Date(move.movement_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {/* Type Column */}
                                        <div className="col-span-2 flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner
                                                ${move.movement_type === 'deposit' ? 'bg-green-100 text-green-600' :
                                                    move.movement_type === 'withdrawal' ? 'bg-red-100 text-red-600' :
                                                        'bg-primary/10 text-primary'}`}>
                                                {move.movement_type === 'deposit' ? <Download size={18} /> :
                                                    move.movement_type === 'withdrawal' ? <Upload size={18} /> :
                                                        <ArrowRightLeft size={18} />}
                                            </div>
                                            <Badge variant={
                                                move.movement_type === 'deposit' ? 'success' :
                                                    move.movement_type === 'withdrawal' ? 'destructive' : 'primary'
                                            } className="px-3 py-1 font-black text-[10px] min-w-[60px] text-center justify-center">
                                                {move.movement_type === 'deposit' ? 'إيداع' :
                                                    move.movement_type === 'withdrawal' ? 'سحب' : 'تحويل'}
                                            </Badge>
                                        </div>

                                        {/* Description Column */}
                                        <div className="col-span-4 pl-4 border-r border-primary/5 lg:border-none">
                                            <p className="text-sm font-medium text-secondary/60 leading-relaxed group-hover:text-foreground transition-colors">
                                                {move.description || <span className="italic opacity-30">بدون بيان للمقارنة</span>}
                                            </p>
                                        </div>

                                        {/* Accounts Column */}
                                        <div className="col-span-3 flex items-center justify-center">
                                            <div className="flex items-center gap-2 bg-black/[0.03] px-4 py-1.5 rounded-full border border-primary/5 group-hover:bg-white/80 transition-all">
                                                {move.movement_type === 'transfer' ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-red-500/80">{move.fromLocation?.name_ar}</span>
                                                        <ArrowRightLeft className="h-3 w-3 text-secondary/20" />
                                                        <span className="text-xs font-bold text-green-500/80">{move.toLocation?.name_ar}</span>
                                                    </div>
                                                ) : move.movement_type === 'deposit' ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black opacity-30 uppercase tracking-tighter">إلى</span>
                                                        <span className="text-xs font-bold text-green-600/80">{move.toLocation?.name_ar}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black opacity-30 uppercase tracking-tighter">من</span>
                                                        <span className="text-xs font-bold text-red-600/80">{move.fromLocation?.name_ar}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Amount Column */}
                                        <div className="col-span-2 text-left lg:border-r lg:border-primary/5 lg:pr-6">
                                            <div className="flex flex-row-reverse lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-2 lg:gap-0">
                                                <div className={`font-black text-xl font-mono ${move.movement_type === 'deposit' ? 'text-green-600' :
                                                    move.movement_type === 'withdrawal' ? 'text-red-600' : 'text-primary'
                                                    }`}>
                                                    <span className="ml-1 text-sm opacity-50">{move.movement_type === 'withdrawal' ? '-' : move.movement_type === 'deposit' ? '+' : ''}</span>
                                                    {Number(move.amount).toLocaleString()}
                                                    <span className="text-[11px] mr-1 opacity-50">ج.م</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white/20 rounded-[3rem] border border-dashed border-primary/10">
                                <History size={48} className="mx-auto mb-4 opacity-10" />
                                <h3 className="font-bold text-xl text-secondary/40">سجل حركات فارغ</h3>
                                <p className="text-secondary/30 text-sm">لم يتم تسجيل أي حركات مالية هنا</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <MoneyActionModals
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                onSuccess={() => { fetchData(); }}
                type={modalConfig.type}
                locations={uniqueLocations}
            />
        </DashboardLayout>
    );
}
