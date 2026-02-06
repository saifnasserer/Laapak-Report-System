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
    // const t = useTranslations('Financial');
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
    const stats = data?.statistics || {};
    const movements = data?.recentMovements || [];

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                                <span className="p-3 bg-primary/10 rounded-3xl text-primary">
                                    <Wallet size={28} />
                                </span>
                                إدارة الأموال
                            </h1>
                            <p className="text-secondary/70 font-medium mt-2 mr-16">
                                تتبع الخزائن، المحافظ الرقمية، والحسابات البنكية
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => openModal('transfer')} className="h-11 rounded-full px-6 gap-2 bg-primary text-white hover:scale-105 transition-all font-bold">
                            <ArrowRightLeft className="h-4 w-4" /> تحويل
                        </Button>
                        <Button onClick={() => openModal('deposit')} variant="outline" className="h-11 rounded-full px-6 gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:scale-105 transition-all font-bold">
                            <Download className="h-4 w-4" /> إيداع
                        </Button>
                        <Button onClick={() => openModal('withdrawal')} variant="outline" className="h-11 rounded-full px-6 gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:scale-105 transition-all font-bold">
                            <Upload className="h-4 w-4" /> سحب
                        </Button>
                    </div>
                </div>



                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Payment Methods / Locations */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card variant="glass" className="bg-white/40 backdrop-blur-sm border-primary/20 rounded-[3rem] overflow-hidden">
                            <CardHeader className="border-b border-primary/10 pb-4">
                                <CardTitle className="text-lg flex items-center gap-3 font-bold">
                                    <div className="p-2 bg-primary/10 rounded-2xl text-primary">
                                        <Landmark className="h-5 w-5" />
                                    </div>
                                    الحسابات والأرصدة
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="p-8 text-center text-secondary/50">جاري التحميل...</div>
                                ) : uniqueLocations.length > 0 ? (
                                    <div className="divide-y divide-primary/10">
                                        {uniqueLocations.map((loc: any) => (
                                            <div key={loc.id} className="p-4 hover:bg-white/60 transition-colors flex justify-between items-center group cursor-default">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2.5 rounded-2xl transition-all duration-300 group-hover:scale-110 ${loc.type === 'bank' ? 'bg-blue-100/50 text-blue-600' :
                                                        loc.type === 'wallet' ? 'bg-purple-100/50 text-purple-600' :
                                                            'bg-green-100/50 text-green-600'
                                                        }`}>
                                                        {loc.type === 'bank' ? <Landmark className="h-5 w-5" /> :
                                                            loc.type === 'wallet' ? <Wallet className="h-5 w-5" /> :
                                                                <Coins className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-base text-foreground">{loc.name_ar}</p>
                                                        <p className="text-xs text-secondary/60 capitalize font-medium">{loc.type}</p>
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-black font-mono text-lg text-primary">{Number(loc.balance || 0).toLocaleString()}</p>
                                                    <p className="text-[10px] text-secondary/40 font-bold">ج.م</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-secondary/50">لا توجد حسابات مضافة</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Movements */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card variant="glass" className="h-full bg-white/40 backdrop-blur-sm border-primary/20 rounded-[3rem] overflow-hidden">
                            <CardHeader className="border-b border-primary/10 flex flex-row items-center justify-between pb-4">
                                <CardTitle className="text-lg flex items-center gap-3 font-bold">
                                    <div className="p-2 bg-primary/10 rounded-2xl text-primary">
                                        <History className="h-5 w-5" />
                                    </div>
                                    آخر الحركات المالية
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="p-12 text-center text-secondary/50">جاري تحميل السجل...</div>
                                ) : movements.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-right">
                                            <thead className="bg-primary/5 text-secondary/80 font-bold">
                                                <tr>
                                                    <th className="p-4 rounded-tr-xl">نوع الحركة</th>
                                                    <th className="p-4">المبلغ</th>
                                                    <th className="p-4">من / إلى</th>
                                                    <th className="p-4">التاريخ</th>
                                                    <th className="p-4 rounded-tl-xl">البيان</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-primary/10">
                                                {movements.map((move: any) => (
                                                    <tr key={move.id} className="hover:bg-white/60 transition-colors">
                                                        <td className="p-4">
                                                            <Badge variant={
                                                                move.movement_type === 'deposit' ? 'success' :
                                                                    move.movement_type === 'withdrawal' ? 'destructive' :
                                                                        'primary' // transfer uses primary
                                                            } className="gap-1.5 px-3 py-1 font-bold">
                                                                {move.movement_type === 'deposit' ? <Download className="h-3.5 w-3.5" /> :
                                                                    move.movement_type === 'withdrawal' ? <Upload className="h-3.5 w-3.5" /> :
                                                                        <ArrowRightLeft className="h-3.5 w-3.5" />}
                                                                {move.movement_type === 'deposit' ? 'إيداع' :
                                                                    move.movement_type === 'withdrawal' ? 'سحب' : 'تحويل'}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4 font-black font-mono text-foreground">
                                                            {Number(move.amount).toLocaleString()} ج.م
                                                        </td>
                                                        <td className="p-4 text-secondary/80 font-medium">
                                                            {move.movement_type === 'transfer' ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-bold text-red-500/80">{move.fromLocation?.name_ar}</span>
                                                                    <ArrowRightLeft className="h-3 w-3 text-secondary/40" />
                                                                    <span className="font-bold text-green-500/80">{move.toLocation?.name_ar}</span>
                                                                </div>
                                                            ) : move.movement_type === 'deposit' ? (
                                                                <span className="font-bold text-green-600/80">إلى: {move.toLocation?.name_ar}</span>
                                                            ) : (
                                                                <span className="font-bold text-red-600/80">من: {move.fromLocation?.name_ar}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-secondary/60 text-xs font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar size={12} className="opacity-50" />
                                                                {new Date(move.movement_date).toLocaleDateString('en-GB')}
                                                            </div>
                                                            <div className="text-[10px] opacity-70 mt-0.5 mr-4">{new Date(move.movement_date).toLocaleTimeString('en-GB')}</div>
                                                        </td>
                                                        <td className="p-4 text-secondary/60 max-w-[200px] truncate font-medium" title={move.description}>
                                                            {move.description || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-secondary/50">لا توجد حركات مسجلة مؤخراً</div>
                                )}
                            </CardContent>
                        </Card>
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
