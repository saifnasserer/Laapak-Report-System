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

    const StatCard = ({ title, value, icon, color, subTitle }: any) => (
        <Card className="relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-10 ${color}`} />
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white`}>
                        {icon}
                    </div>
                </div>
                <div className="space-y-1">
                    <h3 className="text-2xl font-bold">{value}</h3>
                    <p className="text-sm text-secondary/70 font-medium">{title}</p>
                    {subTitle && <p className="text-xs text-secondary/50">{subTitle}</p>}
                </div>
            </CardContent>
        </Card>
    );

    const locations = data?.locations || [];
    const stats = data?.statistics || {};
    const movements = data?.recentMovements || [];

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary">
                            <Wallet className="h-8 w-8" />
                            <h1 className="text-3xl font-bold tracking-tight">إدارة الأموال</h1>
                        </div>
                        <p className="text-secondary font-medium">تتبع الخزائن، المحافظ الرقمية، والحسابات البنكية</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => openModal('transfer')} className="gap-2">
                            <ArrowRightLeft className="h-4 w-4" /> تحويل
                        </Button>
                        <Button onClick={() => openModal('deposit')} variant="outline" className="gap-2 text-green-600 border-green-200 hover:bg-green-50">
                            <Download className="h-4 w-4" /> إيداع
                        </Button>
                        <Button onClick={() => openModal('withdrawal')} variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
                            <Upload className="h-4 w-4" /> سحب
                        </Button>
                        <Button onClick={fetchData} variant="ghost" size="icon">
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="إجمالي الرصيد"
                        value={`${Number(stats.totalBalance || 0).toLocaleString()} ج.م`}
                        icon={<Coins className="h-6 w-6" />}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="مواقع الأموال"
                        value={stats.totalLocations || 0}
                        icon={<MapPin className="h-6 w-6" />}
                        color="bg-indigo-500"
                    />
                    <StatCard
                        title="إجمالي الحركات"
                        value={stats.totalMovements || 0}
                        icon={<History className="h-6 w-6" />}
                        color="bg-amber-500"
                    />
                    <StatCard
                        title="حركات اليوم"
                        value={stats.todayMovements || 0}
                        icon={<Calendar className="h-6 w-6" />}
                        color="bg-emerald-500"
                        subTitle="عمليات مالية تم تسجيلها اليوم"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Payment Methods / Locations */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Landmark className="h-5 w-5 text-primary" />
                                    الحسابات والأرصدة
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="p-8 text-center text-secondary/50">جاري التحميل...</div>
                                ) : locations.length > 0 ? (
                                    <div className="divide-y">
                                        {locations.map((loc: any) => (
                                            <div key={loc.id} className="p-4 hover:bg-surface-variant/30 transition-colors flex justify-between items-center group">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${loc.type === 'bank' ? 'bg-blue-100 text-blue-600' :
                                                        loc.type === 'wallet' ? 'bg-purple-100 text-purple-600' :
                                                            'bg-emerald-100 text-emerald-600'
                                                        }`}>
                                                        {loc.type === 'bank' ? <Landmark className="h-4 w-4" /> :
                                                            loc.type === 'wallet' ? <Wallet className="h-4 w-4" /> :
                                                                <Coins className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{loc.name_ar}</p>
                                                        <p className="text-xs text-secondary/60 capitalize">{loc.type}</p>
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold font-mono">{Number(loc.balance).toLocaleString()}</p>
                                                    <p className="text-[10px] text-secondary/40">ج.م</p>
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
                        <Card className="h-full">
                            <CardHeader className="border-b flex flex-row items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <History className="h-5 w-5 text-primary" />
                                    آخر الحركات المالية
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="p-12 text-center text-secondary/50">جاري تحميل السجل...</div>
                                ) : movements.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-right">
                                            <thead className="bg-surface-variant/30 text-secondary/70 font-medium">
                                                <tr>
                                                    <th className="p-4">نوع الحركة</th>
                                                    <th className="p-4">المبلغ</th>
                                                    <th className="p-4">من / إلى</th>
                                                    <th className="p-4">التاريخ</th>
                                                    <th className="p-4">البيان</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {movements.map((move: any) => (
                                                    <tr key={move.id} className="hover:bg-surface-variant/10">
                                                        <td className="p-4">
                                                            <Badge variant={
                                                                move.movement_type === 'deposit' ? 'success' :
                                                                    move.movement_type === 'withdrawal' ? 'destructive' :
                                                                        'default' // transfer uses default (primary)
                                                            } className="gap-1">
                                                                {move.movement_type === 'deposit' ? <Download className="h-3 w-3" /> :
                                                                    move.movement_type === 'withdrawal' ? <Upload className="h-3 w-3" /> :
                                                                        <ArrowRightLeft className="h-3 w-3" />}
                                                                {move.movement_type === 'deposit' ? 'إيداع' :
                                                                    move.movement_type === 'withdrawal' ? 'سحب' : 'تحويل'}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4 font-bold font-mono">
                                                            {Number(move.amount).toLocaleString()} ج.م
                                                        </td>
                                                        <td className="p-4 text-secondary/80">
                                                            {move.movement_type === 'transfer' ? (
                                                                <div className="flex items-center gap-1">
                                                                    <span>{move.fromLocation?.name_ar}</span>
                                                                    <ArrowRightLeft className="h-3 w-3 text-secondary/40" />
                                                                    <span>{move.toLocation?.name_ar}</span>
                                                                </div>
                                                            ) : move.movement_type === 'deposit' ? (
                                                                <span>إلى: {move.toLocation?.name_ar}</span>
                                                            ) : (
                                                                <span>من: {move.fromLocation?.name_ar}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-secondary/60 text-xs">
                                                            {new Date(move.movement_date).toLocaleDateString('en-GB')}
                                                            <div className="text-[10px]">{new Date(move.movement_date).toLocaleTimeString('en-GB')}</div>
                                                        </td>
                                                        <td className="p-4 text-secondary/60 max-w-[200px] truncate" title={move.description}>
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
                locations={locations}
            />
        </DashboardLayout>
    );
}
