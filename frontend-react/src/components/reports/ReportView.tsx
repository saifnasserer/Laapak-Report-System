'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Video,
    ChevronLeft,
    ChevronRight,
    Check,
    CreditCard,
    FileText,
    Cpu,
    ShieldCheck,
    Image as ImageIcon,
    CheckCircle2,
    User,
    Smartphone,
    Clock,
    Edit,
    Printer,
    Share2,
    XCircle,
    AlertCircle,
    Calendar,
    Monitor,
    Database,
    HardDrive,
    Search,
    Plus,
    Minus,
    RotateCcw,
    Hash,
    ArrowRight,
    Wifi,
    Bluetooth,
    Battery,
    Speaker,
    Camera,
    Mic,
    Keyboard,
    Mouse,
    Monitor as MonitorIcon,
    Thermometer,
    Zap,
    Info,
    ShoppingCart,
    Send,
    ExternalLink,
    Package
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useRouter } from '@/i18n/routing';
import api, { confirmReport } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { WhatsAppShareModal } from '@/components/reports/WhatsAppShareModal';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

// WooCommerce Configuration
const WOO_BASE_URL = 'https://laapak.com';
const WOO_CONSUMER_KEY = 'ck_a00837182f934a0f93d63877b3e33e127cefc11b';
const WOO_CONSUMER_SECRET = 'cs_2186f8d150aa716f9c6b3d1c66e9c96f5e6b209d';
const ACCESSORIES_CATEGORY_ID = 462;

interface ReportViewProps {
    id: string;
    locale: string;
    viewMode: 'admin' | 'client' | 'public';
}

export default function ReportView({ id, locale, viewMode }: ReportViewProps) {
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(1);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [cartItems, setCartItems] = useState<any[]>([]);

    // Warehouse Assignment State
    const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
    const [sourceDetails, setSourceDetails] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'vodafone_cash' | 'instapay' | null>(null);

    const [shareModalOpen, setShareModalOpen] = useState(false);
    const toggleCartItem = (product: any) => {
        setCartItems(prev => {
            const isSelected = prev.find(item => item.id === product.id);
            if (isSelected) {
                return prev.filter(item => item.id !== product.id);
            }
            return [...prev, product];
        });
    };

    const isRtl = locale === 'ar';

    const steps = [
        { id: 1, title: 'البيانات والمواصفات' },
        { id: 2, title: 'المعاينة الخارجية' },
        { id: 3, title: 'الفحص التقني' },
        { id: 4, title: 'الفحص الداخلي' },
        { id: 5, title: 'إضافات مهمة!' },
        { id: 6, title: 'المالية والفوترة' },
        { id: 7, title: 'تأكيد ومشاركة' },
    ];

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/reports/${id}`);
                const reportData = response.data.report;
                setReport(reportData);
                setIsConfirmed(!!reportData.is_confirmed);
                if (reportData.selected_accessories) {
                    setCartItems(reportData.selected_accessories);
                }
                setError(null);
            } catch (err: any) {
                console.error('Failed to fetch report:', err);
                setError('فشل في تحميل تفاصيل التقرير.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [id]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (products.length === 0) {
                try {
                    setIsLoadingProducts(true);
                    const auth = btoa(`${WOO_CONSUMER_KEY}:${WOO_CONSUMER_SECRET}`);
                    const response = await axios.get(`${WOO_BASE_URL}/wp-json/wc/v3/products`, {
                        params: {
                            category: ACCESSORIES_CATEGORY_ID,
                            status: 'publish',
                            per_page: 20
                        },
                        headers: {
                            'Authorization': `Basic ${auth}`
                        }
                    });
                    setProducts(response.data);
                } catch (err) {
                    console.error('Failed to fetch products:', err);
                } finally {
                    setIsLoadingProducts(false);
                }
            }
        };

        fetchProducts();
    }, [activeStep, products.length]);

    const calculateFinalTotal = () => {
        const baseTotal = parseFloat(report.amount || 0) + cartItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
        let fee = 0;
        let feeReason = '';

        if (selectedPaymentMethod === 'cash') {
            fee = baseTotal * 0.01;
            feeReason = ' (رسوم شركة الشحن 1%)';
        } else if (selectedPaymentMethod === 'vodafone_cash') {
            fee = baseTotal * 0.01;
            feeReason = ' (رسوم سحب فودافون 1%)';
        }

        return {
            baseTotal,
            fee,
            finalTotal: baseTotal + fee,
            feeReason
        };
    };

    const handleConfirmOrder = () => {
        setPaymentModalOpen(true);
    };

    const handleFinalConfirmation = async () => {
        if (!selectedPaymentMethod) return;

        try {
            const { baseTotal, fee, finalTotal, feeReason } = calculateFinalTotal();
            await confirmReport(id, cartItems, selectedPaymentMethod);
            setIsConfirmed(true);
            setReport((prev: any) => ({ ...prev, payment_method: selectedPaymentMethod }));
            setPaymentModalOpen(false);

            const paymentLabels: any = {
                'cash': 'كاش عند الاستلام (للمندوب)',
                'vodafone_cash': 'فودافون كاش - عند الاستلام',
                'instapay': 'انستاباي - عند الاستلام'
            };

            let messageText = `مساء الخير انا راجعت التقرير وجاهز آكد الأوردر\n\n`;
            messageText += `طريقة الدفع: ${paymentLabels[selectedPaymentMethod]}\n`;
            messageText += `إجمالي الجهاز والإضافات: ${baseTotal.toLocaleString()} ج.م\n`;
            if (fee > 0) {
                messageText += `الرسوم الإضافية: ${fee.toLocaleString()} ج.م ${feeReason}\n`;
            }
            messageText += `الإجمالي النهائي المطلوب: ${finalTotal.toLocaleString()} ج.م`;
            messageText += `\n* الدفع عند الاستلام *`;

            const message = encodeURIComponent(messageText);
            const phone = '201013148007';
            window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
        } catch (err) {
            console.error('Failed to confirm report:', err);
        }
    };

    const handlePrint = (invoiceId: string) => {
        const token = localStorage.getItem('token');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        const printUrl = `${baseUrl}/invoices/${invoiceId}/print?token=${token}`;
        window.open(printUrl, '_blank');
    };

    const handleAssignToWarehouse = async () => {
        if (!sourceDetails.trim()) {
            alert('يرجى إدخال تفاصيل المصدر');
            return;
        }

        try {
            setIsAssigning(true);

            // 1. Find or Create Laapak Client
            let laapakClient;
            const clientsResponse = await api.get('/clients?search=Laapak');
            const clients = clientsResponse.data.clients || [];
            laapakClient = clients.find((c: any) => c.name.toLowerCase() === 'laapak' || c.name === 'لابك');

            if (!laapakClient) {
                // Create Laapak client if not exists
                const createResponse = await api.post('/clients', {
                    name: 'Laapak',
                    phone: '0000000000', // Placeholder
                    email: 'warehouse@laapak.com',
                    address: 'Laapak Warehouse',
                    orderCode: 'LPK0000'
                });
                laapakClient = createResponse.data;
            }

            // 2. Update Report
            const updatedNotes = (report.notes || '') + `\nSource: ${sourceDetails}`;
            await api.put(`/reports/${id}`, {
                client_id: laapakClient.id,
                notes: updatedNotes
            });

            // 3. Update Local State
            setReport((prev: any) => ({ ...prev, client_id: laapakClient.id, client_name: laapakClient.name, notes: updatedNotes }));
            setWarehouseModalOpen(false);
            setSourceDetails('');
            alert('تم إضافة الجهاز للمخزن بنجاح');

        } catch (err) {
            console.error('Failed to assign to warehouse:', err);
            alert('فشل في إضافة الجهاز للمخزن');
        } finally {
            setIsAssigning(false);
        }
    };

    const statusMap: any = {
        'completed': { label: 'مكتمل', variant: 'success' },
        'مكتمل': { label: 'مكتمل', variant: 'success' },
        'pending': { label: 'قيد الانتظار', variant: 'warning' },
        'قيد الانتظار': { label: 'قيد الانتظار', variant: 'warning' },
        'active': { label: 'قيد الانتظار', variant: 'warning' },
        'نشط': { label: 'قيد الانتظار', variant: 'warning' },
        'cancelled': { label: 'ملغي', variant: 'destructive' },
        'ملغي': { label: 'ملغي', variant: 'destructive' },
        'ملغى': { label: 'ملغي', variant: 'destructive' },
    };

    const getStatusInfo = (status: string) => {
        return statusMap[status] || { label: status || 'غير معروف', variant: 'outline' };
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-secondary animate-pulse">جاري التحميل...</div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
                <div className="text-destructive text-xl font-bold">{error || 'التقرير غير موجود'}</div>
                <Button onClick={() => router.back()} variant="outline">العودة للخلف</Button>
            </div>
        );
    }

    const renderStepContent = () => {
        switch (activeStep) {
            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-12"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            <div className="space-y-8">
                                <h3 className="text-xl font-black text-primary/80 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">01</span>
                                    بيانات العميل والطلب
                                </h3>
                                <div className="space-y-6 px-2 md:px-11">
                                    <div className="group">
                                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1 group-hover:text-primary/60 transition-colors">اسم العميل</p>
                                        <p className="text-xl md:text-2xl font-bold text-secondary">{report.client_name}</p>
                                    </div>
                                    <div className="group">
                                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1 group-hover:text-primary/60 transition-colors">رقم الهاتف</p>
                                        <p className="text-xl md:text-2xl font-bold text-secondary dir-ltr inline-block">{report.client_phone}</p>
                                    </div>
                                    <div className="group">
                                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1 group-hover:text-primary/60 transition-colors">العنوان</p>
                                        <p className="text-base md:text-lg font-medium text-secondary/80">{report.client_address || 'لم يتم تحديد عنوان'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h3 className="text-xl font-black text-primary/80 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">02</span>
                                    هوية الجهاز والتحقق
                                </h3>
                                <div className="space-y-6 px-2 md:px-11">
                                    <div className="group">
                                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1 group-hover:text-primary/60 transition-colors">موديل الجهاز</p>
                                        <div className="flex items-center gap-3">
                                            <Smartphone className="text-primary/40" size={24} />
                                            <p className="text-xl md:text-2xl font-bold text-secondary">{report.device_model}</p>
                                        </div>
                                    </div>
                                    <div className="group">
                                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1 group-hover:text-primary/60 transition-colors">الرقم التسلسلي (IMEI/SN)</p>
                                        <p className="text-xl md:text-2xl font-mono font-bold text-secondary/60 bg-surface-variant/20 px-3 py-1 rounded-xl inline-block">{report.serial_number || 'N/A'}</p>
                                    </div>
                                    <div className="flex items-center gap-6 md:gap-12">
                                        <div className="group">
                                            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">رقم الطلب</p>
                                            <p className="text-base md:text-lg font-black text-primary">#{report.order_number || report.id}</p>
                                        </div>
                                        <div className="group">
                                            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">تاريخ الفحص</p>
                                            <p className="text-base md:text-lg font-bold text-secondary/80">{report.inspection_date ? new Date(report.inspection_date).toLocaleDateString('ar-EG') : '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-12 border-t border-black/5">
                            <h3 className="text-xl font-black text-primary/80 flex items-center gap-3 mb-8">
                                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">03</span>
                                المواصفات التقنية
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-2 md:px-11">
                                {[
                                    { label: 'Processor', value: report.cpu || 'Not Specified', icon: <Cpu size={20} /> },
                                    { label: 'Graphics', value: report.gpu || 'Not Specified', icon: <Monitor size={20} /> },
                                    { label: 'Memory', value: report.ram || 'Not Specified', icon: <Database size={20} /> },
                                    { label: 'Storage', value: report.storage || 'Not Specified', icon: <HardDrive size={20} /> }
                                ].map((spec, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-surface-variant/10 border border-black/5 hover:bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group">
                                        <div className="w-12 h-12 shrink-0 rounded-xl bg-white flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors shadow-sm">
                                            {spec.icon}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-0.5">{spec.label}</p>
                                            <p className="font-bold text-secondary truncate text-sm md:text-base">{spec.value || '-'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        className="space-y-12"
                    >
                        <ExternalExaminationSection report={report} onImageClick={setSelectedImage} />
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-12"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl md:text-2xl font-black text-secondary flex items-center gap-3">
                                <ShieldCheck className="text-primary" size={28} />
                                سجل الفحص التقني
                            </h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-[10px] font-bold text-secondary/40 uppercase">يعمل بكفاءة</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-[10px] font-bold text-secondary/40 uppercase"> غير موجود بالجهاز</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {(() => {
                                let tests = [];
                                try {
                                    tests = typeof report.hardware_status === 'string' ? JSON.parse(report.hardware_status) : (report.hardware_status || []);
                                } catch (e) { console.error(e); }

                                const filteredTests = tests.filter((t: any) => t.type !== 'note');

                                if (filteredTests.length === 0) {
                                    return (
                                        <div className="py-12 text-center border-2 border-dashed border-green-100 rounded-[2.5rem] opacity-40">
                                            <p className="text-sm font-black text-secondary/40">لا توجد فحوصات فنية حالياً</p>
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        <div className="hidden md:block overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm">
                                            <table className="w-full text-right border-collapse">
                                                <thead>
                                                    <tr className="bg-green-50/50 border-b border-green-100/50">
                                                        <th className="px-6 py-4 text-[11px] font-black text-green-700/60 uppercase tracking-widest">اختبار المكون</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-green-700/60 uppercase tracking-widest text-center w-40">الحالة التشغيلية</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredTests.map((test: any, idx: number) => {
                                                        const status = test.status || 'neutral';
                                                        return (
                                                            <tr key={idx} className="border-b border-green-50/30 last:border-0 hover:bg-green-50/20 transition-colors group">
                                                                <td className="px-6 py-5">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={cn(
                                                                            "p-2.5 rounded-xl transition-colors",
                                                                            status === 'pass' ? "bg-green-50 text-green-600" : "bg-black/5 text-secondary/30"
                                                                        )}>
                                                                            {getComponentIcon(test.componentName || '')}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-secondary text-lg group-hover:text-green-700 transition-colors">
                                                                                {getComponentTitle(test.componentName || '')}
                                                                            </span>
                                                                            <span className="text-[11px] text-secondary/40 font-medium">تم فحص الوظائف وتحليل الأداء</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <div className="flex justify-center">
                                                                        {status === 'pass' ? (
                                                                            <div className="bg-green-500 text-white px-3 py-1.5 md:px-5 md:py-2 rounded-full text-[11px] font-black uppercase tracking-tight shadow-md flex items-center gap-2 cursor-default">
                                                                                <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-white animate-pulse" />
                                                                                تم الفحص
                                                                            </div>
                                                                        ) : (
                                                                            <div className="bg-green-50/50 text-green-600/40 border border-green-100/50 px-3 py-1.5 md:px-5 md:py-2 rounded-full text-[11px] font-black uppercase tracking-tight flex items-center gap-2 cursor-default">
                                                                                تم التحقق
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="md:hidden space-y-2">
                                            {filteredTests.map((test: any, idx: number) => {
                                                const status = test.status || 'neutral';
                                                return (
                                                    <div key={idx} className="p-3 rounded-xl bg-white border border-green-100 shadow-sm flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className={cn(
                                                                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                                                status === 'pass' ? "bg-green-50 text-green-600" : "bg-black/5 text-secondary/30"
                                                            )}>
                                                                {getComponentIcon(test.componentName || '')}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-bold text-secondary text-xs truncate">
                                                                    {getComponentTitle(test.componentName || '')}
                                                                </span>
                                                                <span className="text-[9px] text-secondary/40 font-medium truncate uppercase tracking-tight">فحص الأداء والوظائف</span>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0">
                                                            {status === 'pass' ? (
                                                                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                                                                    <Check size={14} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-full bg-green-50 text-green-600/40 border border-green-100 flex items-center justify-center">
                                                                    <div className="w-1 h-1 rounded-full bg-current" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-12"
                    >
                        <InternalInspectionSection report={report} onImageClick={setSelectedImage} />
                    </motion.div>
                );
            case 5:
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <ShoppingCart size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-secondary">اضافات مهمة !</h3>
                                <p className="text-sm text-secondary/60">اكتشف أفضل الخيارات لحماية جهازك وزيادة كفاءته</p>
                            </div>
                        </div>

                        {isLoadingProducts ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map((n) => (
                                    <div key={n} className="h-64 rounded-3xl bg-surface-variant/10 animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product: any) => {
                                    const isInCart = cartItems.find(item => item.id === product.id);
                                    return (
                                        <div key={product.id} className="group bg-white rounded-[2rem] border border-black/5 p-4 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all flex flex-col">
                                            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-surface-variant/5 mb-4 relative">
                                                {product.images && product.images[0] ? (
                                                    <img src={product.images[0].src} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-secondary/20">
                                                        <Package size={48} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-3 flex-1">
                                                <h4 className="font-bold text-secondary group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">{product.name}</h4>
                                                <div className="flex items-center justify-between mt-auto">
                                                    <p className="text-xl font-black text-primary">{product.price} <span className="text-[10px] font-bold">ج.م</span></p>
                                                    <Button
                                                        onClick={() => toggleCartItem(product)}
                                                        className={cn(
                                                            "rounded-xl px-4 py-2 text-xs font-black transition-all",
                                                            isInCart
                                                                ? "bg-red-50 text-red-500 hover:bg-red-100 border-red-100"
                                                                : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                                                        )}
                                                    >
                                                        {isInCart ? 'حذف من الطلب' : 'إضافة للطلب'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                );
            case 6:
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-12"
                    >
                        <div className="space-y-12 max-w-4xl mx-auto w-full">
                            <div className="flex flex-col items-center justify-center gap-8 pb-12 border-b border-black/5 text-center">
                                <div className="space-y-2">
                                    <h3 className="text-xl md:text-3xl font-black text-secondary flex items-center justify-center gap-3">
                                        <CreditCard className="text-primary" size={28} />
                                        المبالغ والفوترة
                                    </h3>
                                    <p className="text-sm text-secondary/40 font-medium max-w-lg mx-auto">ملخص الحسابات والفواتير المرتبطة بهذا الطلب</p>
                                </div>
                                <div className="bg-primary/[0.03] p-8 md:p-10 rounded-[3rem] border border-primary/10 w-full max-w-md text-center shadow-xl shadow-primary/[0.02]">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">الاجمالي</p>
                                    <div className="flex items-baseline justify-center gap-2">
                                        <h2 className="text-4xl md:text-6xl font-black text-primary">
                                            {(parseFloat(report.amount || 0) + cartItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0)).toLocaleString()}
                                        </h2>
                                        <span className="text-xl font-bold text-primary/60">ج.م</span>
                                    </div>
                                </div>
                            </div>

                            {cartItems.length > 0 && (
                                <div className="space-y-6 w-full px-6">
                                    <div className="flex items-center gap-3 justify-center">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <ShoppingCart size={20} />
                                        </div>
                                        <h4 className="text-lg font-bold text-secondary">إضافات للطلب (Accessories)</h4>
                                    </div>
                                    <div className="space-y-3 max-w-2xl mx-auto">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-black/5 shadow-sm hover:border-primary/20 transition-all">
                                                <div className="flex items-center gap-4 text-right">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-variant/5">
                                                        {item.images?.[0] && <img src={item.images[0].src} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <span className="font-bold text-secondary text-sm">{item.name}</span>
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-black text-primary">{item.price} <span className="text-[10px] font-bold">ج.م</span></p>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-4 border-t border-black/5 flex justify-between items-center px-2">
                                            <span className="text-secondary/40 font-bold uppercase tracking-widest text-[10px]">إجمالي الإضافات</span>
                                            <span className="text-lg font-black text-primary">
                                                {cartItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0).toLocaleString()} ج.م
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-8 w-full">
                                <div className="flex items-center justify-between px-6 max-w-3xl mx-auto">
                                    <h4 className="text-lg font-bold text-secondary">الفواتير المرتبطة</h4>
                                    <Badge variant={report.invoice_created ? 'success' : 'warning'} className="rounded-full px-4 py-1">
                                        {report.invoice_created ? 'تم إنشاء الفواتير' : 'في انتظار الفوترة'}
                                    </Badge>
                                </div>

                                <div className="px-6 max-w-3xl mx-auto w-full">
                                    {report.relatedInvoices && report.relatedInvoices.length > 0 ? (
                                        <div className="space-y-4">
                                            {report.relatedInvoices.map((inv: any) => (
                                                <div
                                                    key={inv.id}
                                                    onClick={() => handlePrint(inv.id)}
                                                    className="flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 rounded-3xl bg-surface-variant/10 border border-black/5 hover:bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group gap-4 md:gap-0"
                                                >
                                                    <div className="flex items-center gap-4 md:gap-6">
                                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-secondary text-sm md:text-base">فاتورة #{inv.id}</p>
                                                            <p className="text-[10px] text-secondary/40 font-medium">{inv.date ? new Date(inv.date).toLocaleDateString('ar-EG') : '-'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between md:justify-end gap-3 md:gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-black/5">
                                                        <p className="text-sm md:text-lg font-black text-secondary">{parseFloat(inv.total).toLocaleString()} ج.م</p>
                                                        <div className="flex items-center gap-3">
                                                            <Badge variant={inv.paymentStatus === 'paid' ? 'success' : 'warning'} className="text-[10px] px-3 py-0.5 rounded-full">
                                                                {inv.paymentStatus === 'paid' ? 'مدفوعة' : 'معلقة'}
                                                            </Badge>
                                                            <ChevronLeft size={18} className="text-secondary/20 group-hover:text-primary transition-colors" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 bg-surface-variant/5 rounded-[3rem] border-2 border-dashed border-black/5 flex flex-col items-center justify-center text-secondary/40 gap-4">
                                            <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center">
                                                <FileText size={32} />
                                            </div>
                                            <p className="font-bold">لا توجد فواتير مرتبطة حالياً</p>
                                            {/* {viewMode === 'admin' && (
                                                <Button variant="outline" size="sm" className="mt-2 rounded-2xl" icon={<Plus size={18} />}>إنشاء فاتورة الآن</Button>
                                            )} */}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 7:
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="space-y-12"
                    >
                        <div className="text-center space-y-6 max-w-2xl mx-auto">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                                <CheckCircle2 size={48} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-secondary">إتمام مراجعة التقرير</h3>
                                <p className="text-secondary/60 font-medium">يمكنك الآن تأكيد الطلب أو مشاركته مع العميل.</p>
                            </div>

                            {isConfirmed && (report.payment_method || selectedPaymentMethod) && (
                                <div className="mt-4 p-4 rounded-2xl bg-green-50 border border-green-100 flex flex-col items-center gap-2">
                                    <span className="text-[10px] font-black text-green-700/40 uppercase tracking-widest">طريقة الدفع المختارة</span>
                                    <div className="flex items-center gap-2 text-green-700">
                                        {(() => {
                                            const method = report.payment_method || selectedPaymentMethod;
                                            const label = method === 'cash' ? 'كاش عند الاستلام' :
                                                method === 'vodafone_cash' ? 'فودافون كاش' : 'انستاباي';
                                            return (
                                                <>
                                                    {method === 'cash' ? <CreditCard size={18} /> :
                                                        method === 'vodafone_cash' ? <Smartphone size={18} /> : <Zap size={18} />}
                                                    <span className="font-bold">{label}</span>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <p className="text-[10px] font-bold text-green-600/60">* الدفع عند الاستلام *</p>
                                </div>
                            )}

                            {cartItems.length > 0 && !isConfirmed && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3 justify-center text-primary"
                                >
                                    <AlertCircle size={20} className="shrink-0" />
                                    <p className="text-sm font-bold">يرجى تأكيد الطلب لإضافة الأصناف المختارة (Accessories)</p>
                                </motion.div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-6">
                            <div
                                onClick={!isConfirmed ? handleConfirmOrder : undefined}
                                className={cn(
                                    "px-10 md:px-12 py-8 rounded-[2.5rem] bg-white border-2 transition-all cursor-pointer group flex items-center gap-6 w-full md:w-auto md:min-w-[420px] justify-center relative overflow-hidden",
                                    isConfirmed
                                        ? "border-green-500/30 bg-green-50/10"
                                        : "border-red-500/40 hover:border-red-500 hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-1 shadow-xl shadow-red-500/5 bg-red-50/5"
                                )}
                            >
                                {isConfirmed ? (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="text-xl font-black text-secondary">تم تأكيد الأوردر</span>
                                            <p className="text-xs font-bold text-green-600/60">شكراً لثقتك في لابق</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
                                            <ShoppingCart size={32} />
                                        </div>
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="text-xl font-black text-secondary group-hover:text-red-600 transition-colors">تأكيد الأوردر (دفع عند الاستلام)</span>
                                            <p className="text-sm font-bold text-secondary/40">تأكيد وطريقة الدفع ومشاركة واتساب</p>
                                        </div>
                                        <div className="absolute top-0 right-0 p-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        </div>
                                    </>
                                )}
                            </div>
                            {[
                                {
                                    title: 'مشاركة واتساب',
                                    // desc: 'إرسال رابط التقرير للعميل مباشرة',
                                    icon: <Share2 />,
                                    color: 'primary',
                                    action: () => {
                                        const shareUrl = `${window.location.origin}/${locale}/reports/${id}`;
                                        if (viewMode === 'admin') {
                                            navigator.clipboard.writeText(shareUrl);
                                            // Simple alert for feedback since no toast is available
                                            alert('تم نسخ الرابط بنجاح');
                                        } else {
                                            const shareMessage = `شوف تقرير الفحص من هنا:\n${shareUrl}`;
                                            window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
                                        }
                                    }
                                },
                                ...(viewMode === 'admin' ? [
                                    { title: 'تعديل البيانات', desc: 'تحديث المواصفات أو نتائج الفحص', icon: <Edit />, color: 'secondary', action: () => router.push(`/dashboard/admin/reports/${id}/edit`) },
                                    { title: 'إضافة للمخزن', desc: 'تسجيل الجهاز في قاعدة بيانات المخزن', icon: <Package />, color: 'secondary', action: () => setWarehouseModalOpen(true) }
                                ] : [])
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    onClick={item.action}
                                    className="px-10 md:px-12 py-8 rounded-[2.5rem] bg-white border border-black/5 hover:border-primary/20 hover:-translate-y-1 transition-all cursor-pointer group flex items-center gap-6 w-full md:w-auto md:min-w-[380px] justify-center"
                                >
                                    <div className={cn(
                                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all group-hover:scale-110 shrink-0",
                                        item.color === 'primary' ? "bg-primary/10 text-primary" : "bg-black/5 text-secondary/40"
                                    )}>
                                        {React.cloneElement(item.icon as React.ReactElement<any>, { size: 32 })}
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-xl font-black text-secondary leading-tight">{item.title}</h4>
                                        {item.desc && <p className="text-sm text-secondary/40 mt-1">{item.desc}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {viewMode === 'admin' && (
                            <div className="pt-12 border-t border-black/5 flex flex-col items-center gap-8">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.5em] mb-4">Final Status Control</p>
                                    <div className="flex gap-4 p-2 bg-surface-variant/10 rounded-[2rem] border border-black/5">
                                        <button className="px-8 py-3 rounded-[1.5rem] text-sm font-bold bg-white shadow-sm text-secondary">قيد المعالجة</button>
                                        <button className="px-8 py-3 rounded-[1.5rem] text-sm font-bold bg-green-500 text-white shadow-lg shadow-green-500/20">اعتماد كمكتمل</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFF] text-secondary selection:bg-primary/10 selection:text-primary relative p-4 md:p-8 overflow-x-hidden">
            {/* Payment Selection Modal */}
            <Modal
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                title="تأكيد طريقة الدفع"
                className="max-w-md"
            >
                <div className="space-y-6">
                    <p className="text-secondary/60 text-sm">بالنسبة للدفع ف فية ٣ طرق (الدفع عند الاستلام) ، يرجى اختيار الأنسب لك:</p>

                    <div className="space-y-3">
                        {[
                            {
                                id: 'instapay',
                                title: 'انستاباي (الأفضل)',
                                desc: 'دفع عند الاستلام - مش بيخصم اي حاجة زيادة',
                                icon: <Zap className="text-indigo-500" />,
                                color: 'indigo'
                            },
                            {
                                id: 'cash',
                                title: 'كاش عند الاستلام',
                                desc: 'المندوب بيستلم المبلغ بزيادة ١٪ عشان شركة الشحن بتخصمهم',
                                icon: <CreditCard className="text-orange-500" />,
                                color: 'orange'
                            },
                            {
                                id: 'vodafone_cash',
                                title: 'فودافون كاش',
                                desc: 'زياده ١٪ ع المبلغ رسوم سحب فودافون - دفع عند الاستلام',
                                icon: <Smartphone className="text-red-500" />,
                                color: 'red'
                            }
                        ].map((method) => (
                            <div
                                key={method.id}
                                onClick={() => setSelectedPaymentMethod(method.id as any)}
                                className={cn(
                                    "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 hover:shadow-md",
                                    selectedPaymentMethod === method.id
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-black/5 bg-white hover:border-primary/20"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    method.id === 'instapay' ? "bg-indigo-50" :
                                        method.id === 'cash' ? "bg-orange-50" : "bg-red-50"
                                )}>
                                    {method.icon}
                                </div>
                                <div className="text-right">
                                    <h4 className="font-bold text-secondary">{method.title}</h4>
                                    <p className="text-[11px] text-secondary/50 leading-relaxed mt-0.5">{method.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedPaymentMethod && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-4 rounded-2xl bg-surface-variant/20 border border-black/5 space-y-2"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-secondary/60">الإجمالي الأساسي:</span>
                                <span className="font-bold text-secondary">{calculateFinalTotal().baseTotal.toLocaleString()} ج.م</span>
                            </div>
                            {calculateFinalTotal().fee > 0 && (
                                <div className="flex justify-between items-center text-red-500">
                                    <span className="text-xs">الرسوم الإضافية (1%):</span>
                                    <span className="font-bold">+{calculateFinalTotal().fee.toLocaleString()} ج.م</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-black/5 flex justify-between items-center">
                                <span className="font-black text-secondary">الإجمالي النهائي:</span>
                                <span className="text-xl font-black text-primary">{calculateFinalTotal().finalTotal.toLocaleString()} ج.م</span>
                            </div>
                        </motion.div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={handleFinalConfirmation}
                            className="flex-1 rounded-2xl py-6 text-base font-black"
                            disabled={!selectedPaymentMethod}
                        >
                            تأكيد وإرسال
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setPaymentModalOpen(false)}
                            className="rounded-2xl px-6"
                        >
                            إلغاء
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Warehouse Assignment Modal */}
            <Modal
                isOpen={warehouseModalOpen}
                onClose={() => setWarehouseModalOpen(false)}
                title="إضافة الجهاز للمخزن"
            >
                <div className="space-y-6">
                    <p className="text-secondary/60">
                        سيتم نقل هذا الجهاز إلى ملكية <strong>Laapak</strong> وإضافته للمخزون.
                        يرجى تحديد مصدر الجهاز.
                    </p>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary">مصدر الجهاز</label>
                        <Input
                            placeholder="مثال: شراء من العميل محمد أحمد، استيراد خارجي..."
                            value={sourceDetails}
                            onChange={(e) => setSourceDetails(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setWarehouseModalOpen(false)}>إلغاء</Button>
                        <Button onClick={handleAssignToWarehouse} disabled={isAssigning}>
                            {isAssigning ? 'جاري الإضافة...' : 'تأكيد الإضافة للمخزن'}
                        </Button>
                    </div>
                </div>
            </Modal>
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[60%] md:w-[40%] h-[40%] bg-primary/5 rounded-full blur-[80px] md:blur-[120px] animate-pulse" />
                <div className="absolute top-[20%] -right-[10%] w-[50%] md:w-[30%] h-[50%] bg-surface-variant/20 rounded-full blur-[60px] md:blur-[100px]" />
            </div>

            <div className="relative max-w-7xl mx-auto space-y-8 md:space-y-16">
                <header className={cn(
                    "flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8",
                    isRtl ? "pr-14 md:pr-0" : "pl-14 md:pl-0"
                )}>
                    <div className="space-y-4">
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-secondary leading-[1.1]">
                            تفاصيل <span className="text-primary">التقرير</span>
                        </h1>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-20 items-start">
                    <div className="w-full lg:hidden mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-secondary/40 uppercase tracking-widest">المرحلة {activeStep} من 7</span>
                            <span className="text-xs font-bold text-primary">{Math.round((activeStep / 7) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden mb-6">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${(activeStep / 7) * 100}%` }}
                                transition={{ duration: 0.5, ease: "circOut" }}
                            />
                        </div>
                        {/* Mobile Step Navigator */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1 snap-x">
                            {steps.map((step) => {
                                const isActive = activeStep === step.id;
                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => setActiveStep(step.id)}
                                        className={cn(
                                            "flex-shrink-0 px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all snap-start border",
                                            isActive
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                : "bg-white text-secondary/40 border-black/5"
                                        )}
                                    >
                                        {step.title}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <aside className="hidden lg:block lg:w-72 sticky top-24 space-y-12">
                        <div className="space-y-6">
                            <p className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.5em] pr-4">إجراءات الفحص</p>
                            <nav className="space-y-2">
                                {steps.map((step) => {
                                    const isActive = activeStep === step.id;
                                    return (
                                        <button
                                            key={step.id}
                                            onClick={() => setActiveStep(step.id)}
                                            className={cn(
                                                "w-full flex items-center gap-6 py-4 px-4 rounded-3xl transition-all duration-500 group relative",
                                                isActive ? "bg-white shadow-xl shadow-black/[0.03]" : "hover:bg-black/[0.02]"
                                            )}
                                        >
                                            <span className={cn(
                                                "text-lg font-black transition-colors duration-500",
                                                isActive ? "text-primary" : "text-secondary/20 group-hover:text-secondary/40"
                                            )}>
                                                {step.id.toString().padStart(2, '0')}
                                            </span>
                                            <span className={cn(
                                                "text-sm font-bold transition-all duration-500 text-right flex-1",
                                                isActive ? "text-secondary" : "text-secondary/40 group-hover:text-secondary/60"
                                            )}>
                                                {step.title}
                                            </span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="active-indicator"
                                                    className="absolute left-4 w-1.5 h-6 bg-primary rounded-full"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    <main className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeStep} className="pb-32">
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>

                        <div className="fixed bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4 p-2 md:p-3 bg-white/90 backdrop-blur-3xl rounded-full border border-black/5 shadow-2xl z-50 ring-1 ring-black/[0.02] w-[95%] md:w-auto max-w-lg justify-between md:justify-center">
                            {activeStep > 1 && (
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="rounded-full h-11 md:h-14 px-3 md:px-8 font-black hover:bg-black/5 disabled:opacity-0 transition-opacity text-xs md:text-base flex-1 md:flex-initial"
                                    onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                                    icon={<ChevronRight size={18} />}
                                >
                                    السابق
                                </Button>
                            )}

                            <div className={cn(
                                "hidden md:flex gap-2 px-4",
                                activeStep === 1 && "md:hidden"
                            )}>
                                {steps.map((s) => (
                                    <div
                                        key={s.id}
                                        className={cn(
                                            "w-2 h-2 rounded-full transition-all duration-500",
                                            activeStep === s.id ? "bg-primary w-8" : "bg-black/10"
                                        )}
                                    />
                                ))}
                            </div>

                            <Button
                                size="lg"
                                className={cn(
                                    "rounded-full h-11 md:h-14 px-4 md:px-10 font-black shadow-xl shadow-primary/20 text-xs md:text-base flex-1 md:flex-initial",
                                    activeStep === 1 && "flex-1 md:w-full max-w-none"
                                )}
                                onClick={() => {
                                    if (activeStep < 7) setActiveStep(prev => prev + 1);
                                    else {
                                        if (viewMode === 'admin') router.push(`/dashboard/admin/reports`);
                                        else if (viewMode === 'client') router.push(`/dashboard/client`);
                                        else router.push(`/`);
                                    }
                                }}
                            >
                                {activeStep === 7 ? 'إغلاق' : 'التالي'}
                                {activeStep < 7 && <ChevronLeft size={16} className="mr-1 md:mr-2" />}
                            </Button>
                        </div>
                    </main>
                </div>
            </div>

            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md"
                    >
                        <motion.button
                            className="fixed top-8 right-8 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-[140]"
                            onClick={() => setSelectedImage(null)}
                        >
                            <XCircle size={24} />
                        </motion.button>

                        <TransformWrapper minScale={1} centerOnInit={true} initialScale={1}>
                            {({ zoomIn, zoomOut, resetTransform }) => (
                                <>
                                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[140] flex items-center gap-2 p-2 bg-white/10 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl">
                                        <button onClick={() => zoomIn()} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full text-white transition-all active:scale-90"><Plus size={20} /></button>
                                        <button onClick={() => zoomOut()} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full text-white transition-all active:scale-90"><Minus size={20} /></button>
                                        <div className="w-px h-6 bg-white/10 mx-1" />
                                        <button onClick={() => resetTransform()} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full text-white transition-all active:scale-90"><RotateCcw size={18} /></button>
                                    </div>

                                    <TransformComponent wrapperClass="!w-screen !h-screen cursor-move" contentClass="w-full h-full flex items-center justify-center">
                                        <img src={selectedImage} alt="Inspection Detail" className="max-w-[90%] max-h-[90%] object-contain rounded-2xl shadow-2xl pointer-events-none" />
                                    </TransformComponent>
                                </>
                            )}
                        </TransformWrapper>
                    </motion.div>
                )}

                {/* WhatsApp Share Modal */}
                <WhatsAppShareModal
                    isOpen={shareModalOpen}
                    onClose={() => setShareModalOpen(false)}
                    report={report}
                    locale={locale}
                />
            </AnimatePresence>
        </div>
    );
}

// Sub-components and Helper functions
function ExternalExaminationSection({ report, onImageClick }: { report: any, onImageClick: (url: string) => void }) {
    let media: any[] = [];
    try {
        media = typeof report.external_images === 'string' ? JSON.parse(report.external_images) : (report.external_images || []);
    } catch (e) { console.error(e); }

    const images = media.filter((m: any) => m.type === 'image' || !m.type);
    const video = media.find((m: any) => m.type === 'video' || m.type === 'youtube');
    const [selectedMedia, setSelectedMedia] = useState<any>(video || images[0] || null);

    return (
        <div className="space-y-6 lg:space-y-12">
            <div className="aspect-video w-full bg-black rounded-2xl lg:rounded-[2.5rem] overflow-hidden shadow-lg lg:shadow-2xl ring-1 ring-black/5 relative group">
                {selectedMedia ? (
                    selectedMedia.type === 'video' || selectedMedia.type === 'youtube' ? (
                        selectedMedia.url.includes('youtube.com') || selectedMedia.url.includes('youtu.be') ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${(selectedMedia.url.match(/(?:v=|youtu\.be\/)([^&]+)/) || [])[1]}`}
                                className="w-full h-full border-0"
                                allowFullScreen
                                title="External Examination Video"
                            />
                        ) : (
                            <video src={selectedMedia.url} className="w-full h-full object-contain" controls autoPlay muted playsInline />
                        )
                    ) : (
                        <img src={selectedMedia.url} alt="Selected" className="w-full h-full object-contain bg-black/90 cursor-zoom-in" onClick={() => onImageClick(selectedMedia.url)} />
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/20">
                        <ImageIcon size={64} />
                        <p className="mt-4 font-bold">No Media Selected</p>
                    </div>
                )}
            </div>

            <div className="flex gap-2 md:gap-4 overflow-x-auto pb-4 px-1 snap-x no-scrollbar">
                {video && (
                    <button onClick={() => setSelectedMedia(video)} className={cn("flex-shrink-0 w-16 h-16 md:w-32 md:h-32 rounded-lg md:rounded-2xl overflow-hidden border-2 transition-all relative group snap-start", selectedMedia === video ? "border-primary ring-2 md:ring-4 ring-primary/20 scale-105" : "border-transparent opacity-60 hover:opacity-100")}>
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/40 transition-colors"><Video className="text-white drop-shadow-lg" size={20} /></div>
                        <div className="w-full h-full bg-secondary" />
                    </button>
                )}
                {images.map((img: any, idx: number) => (
                    <button key={idx} onClick={() => setSelectedMedia(img)} className={cn("flex-shrink-0 w-16 h-16 md:w-32 md:h-32 rounded-lg md:rounded-2xl overflow-hidden border-2 transition-all snap-start", selectedMedia === img ? "border-primary ring-2 md:ring-4 ring-primary/20 scale-105" : "border-transparent opacity-60 hover:opacity-100")}>
                        <img src={img.url} alt={getComponentNameArabic(img.component || img.name)} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { id: 'case', name: 'جسم الجهاز (Case)', condition: report.case_condition, notes: report.case_notes, icon: <Package size={18} /> },
                    { id: 'screen', name: 'الشاشة (Screen)', condition: report.screen_condition, notes: report.screen_notes, icon: <Monitor size={18} /> },
                    { id: 'keyboard', name: 'الكيبورد (Keyboard)', condition: report.keyboard_condition, notes: report.keyboard_notes, icon: <Keyboard size={18} /> },
                    { id: 'battery', name: 'البطارية (Battery)', condition: report.battery_condition, notes: report.battery_notes, icon: <Zap size={18} /> }
                ].map((part) => (
                    <div key={part.id} className="p-4 rounded-3xl bg-white border border-black/5 flex flex-col gap-3 group hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary/40 flex items-center justify-center group-hover:text-primary transition-colors">
                                    {part.icon}
                                </div>
                                <span className="font-bold text-secondary text-sm">{part.name}</span>
                            </div>
                            {part.condition && (
                                <Badge
                                    className={cn(
                                        "rounded-full px-3 py-1 text-[10px] font-black",
                                        part.condition === 'excellent' ? "bg-green-500 text-white" :
                                            part.condition === 'good' ? "bg-blue-500 text-white" :
                                                part.condition === 'fair' ? "bg-orange-500 text-white" :
                                                    "bg-red-500 text-white"
                                    )}
                                >
                                    {part.condition === 'excellent' ? 'ممتاز' :
                                        part.condition === 'good' ? 'جيد' :
                                            part.condition === 'fair' ? 'مقبول' : 'ضعيف'}
                                </Badge>
                            )}
                        </div>
                        {part.notes && (
                            <p className="text-xs text-secondary/60 bg-black/[0.02] p-3 rounded-xl font-medium leading-relaxed">
                                {part.notes}
                            </p>
                        )}
                    </div>
                ))}
            </div> */}

            {report.notes && (
                <div className="p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] bg-primary/[0.03] border border-primary/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors" />
                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">ملاحظات الفحص الظاهري</h4>
                    <p className="text-sm md:text-xl font-medium text-secondary/80 leading-relaxed whitespace-pre-wrap">{report.notes}</p>
                </div>
            )}
        </div>
    );
}

function InternalInspectionSection({ report, onImageClick }: { report: any, onImageClick: (url: string) => void }) {
    let media = [];
    try {
        media = typeof report.external_images === 'string' ? JSON.parse(report.external_images) : (report.external_images || []);
    } catch (e) { }

    const testScreenshots = media.filter((m: any) => m.type === 'test_screenshot');
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-black text-secondary pr-3 border-r-4 border-primary">الفحص المتقدم</h3>
            {testScreenshots.length > 0 ? (
                <div className="space-y-3">
                    {testScreenshots.map((item: any, idx: number) => {
                        const isOpen = openIndex === idx;
                        const componentName = item.component || item.name || '';
                        return (
                            <div key={idx} className={cn("bg-white border rounded-[1.5rem] overflow-hidden transition-all duration-300", isOpen ? "border-primary/20 shadow-lg" : "border-black/5 hover:border-black/10 shadow-sm")}>
                                <button onClick={() => setOpenIndex(isOpen ? null : idx)} className="w-full px-4 md:px-6 py-4 md:py-5 flex items-center justify-between group text-right">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", isOpen ? "bg-primary text-white" : "bg-black/[0.03] text-secondary/40 group-hover:bg-primary/10 group-hover:text-primary")}>
                                            {getComponentIcon(componentName)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-secondary text-base">{getComponentTitle(componentName)}</span>
                                            {/* <span className="text-[10px] text-secondary/40 font-bold uppercase tracking-wider">Advanced Technical Test | فحص فني متقدم</span> */}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 text-[10px] font-black h-6 px-3 rounded-full">(PASSED)</Badge>
                                        <div className={cn("transition-transform duration-300", isOpen ? "rotate-90 text-primary" : "text-secondary/20")}><ChevronLeft size={20} /></div>
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                                            <div className="px-6 pb-8 pt-4 border-t border-black/[0.03]">
                                                <div className="w-full aspect-video md:aspect-[21/9] bg-black/[0.02] rounded-2xl md:rounded-3xl overflow-hidden border border-black/5 cursor-zoom-in group/img relative" onClick={() => onImageClick(item.url)}>
                                                    <img src={item.url} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="نتيجة فحص فني متقدم" />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center"><Search className="text-white" size={32} /></div>
                                                </div>
                                                <div className="space-y-4 md:space-y-6">
                                                    <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-black/[0.02] border border-black/[0.03]">
                                                        <h5 className="text-[10px] font-black text-secondary/30 uppercase tracking-widest mb-2 md:mb-3">شرح تفصيلي للفحص</h5>
                                                        <p className="text-secondary/70 text-sm md:text-base leading-relaxed font-bold">{item.comment || getTestDescription(componentName)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-12 text-center border-2 border-dashed border-black/5 rounded-[2.5rem] opacity-40"><ImageIcon className="mx-auto mb-4 text-secondary/20" size={48} /><p className="text-sm font-black text-secondary/40">لا توجد صور أو فحوصات تقنية مسجلة</p></div>
            )}
        </div>
    );
}

const getComponentNameArabic = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('keyboard')) return 'فحص لوحة المفاتيح';
    if (n.includes('screen')) return 'فحص الشاشة الخارجي';
    return name || 'صورة المعاينة';
};

const getComponentIcon = (name: string) => {
    const lowerName = (name || '').toLowerCase();
    if (lowerName.includes('cpu')) return <Cpu size={14} />;
    if (lowerName.includes('gpu')) return <MonitorIcon size={14} />;
    if (lowerName.includes('battery')) return <Battery size={14} />;
    if (lowerName.includes('ssd') || lowerName.includes('hdd')) return <HardDrive size={14} />;
    if (lowerName.includes('keyboard')) return <Keyboard size={14} />;
    if (lowerName.includes('screen') || lowerName.includes('display')) return <MonitorIcon size={14} />;
    if (lowerName.includes('ram')) return <Database size={14} />;
    if (lowerName.includes('wifi')) return <Wifi size={14} />;
    if (lowerName.includes('bluetooth')) return <Bluetooth size={14} />;
    return <Search size={14} />;
};

const getComponentTitle = (name: string) => {
    const lowerName = (name || '').toLowerCase();
    if (lowerName === 'info') return 'تفاصيل اللابتوب';
    if (lowerName === 'cpu' || lowerName.includes('processor')) return 'اختبار البروسيسور';
    if (lowerName === 'gpu' || lowerName.includes('graphics')) return 'اختبار كارت الشاشة';
    if (lowerName.includes('battery')) return 'اختبار البطارية';
    if (lowerName.includes('ssd') || lowerName.includes('hdd') || lowerName.includes('storage')) return 'اختبار الهارد';
    if (lowerName.includes('keyboard')) return 'اختبار الكيبورد';
    if (lowerName === 'dxdiag') return 'اختبار DxDiag';
    if (lowerName.includes('screen') || lowerName.includes('display')) return 'فحص جودة الشاشة والبكسلات';
    return name ? `اختبار ${name}` : 'فحص فني';
};

const getTestDescription = (name: string) => {
    const comp = (name || '').toLowerCase();
    if (comp.includes('cpu')) return 'Stress Test للبروسيسور بيختبر قوة المعالج تحت ضغط تقيل، علشان يشوف لو هيقدر يشتغل بكفاءة في أقصى ظروف، وبيكشف لو في مشاكل زي السخونية أو الأداء الضعيف.';
    if (comp.includes('gpu')) return 'برنامج FurMark بيعمل stress test لكارت الشاشة، يعني بيشغله بأقصى طاقته علشان يشوف هيسخن قد إيه ويقدر يستحمل الضغط ولا لأ.';
    if (comp.includes('battery')) return 'الصورة دي لقطة من شاشة بتبين تفاصيل حالة بطارية اللابتوب، من خلال الـ BIOS . الهدف إنك تتأكد إن البطارية شغالة كويس وسليمة.';
    if (comp.includes('hdd') || comp.includes('ssd') || comp.includes('storage')) return 'برنامج Hard Disk Sentinel بيكشف حالة الهارد، سواء HDD أو SSD، وبيقولك لو في مشاكل زي الباد سيكتور أو أداء ضعيف.';
    if (comp.includes('keyboard')) return 'اختبار زرار الكيبورد بيشوف إذا كانت كل الزراير شغالة صح ولا لأ. بتضغط على كل زر وبتشوف لو الجهاز بيستجيب.';
    if (comp.includes('info')) return 'الشاشة اللي بتعرض معلومات الجهاز بتوريك حاجات زي ال (Serial Number) ، نوع المعالج (CPU)، الرامات (Memory)، كارت الشاشة (GPU)، ونسخة الـ BIOS.';
    if (comp.includes('dxdiag')) return 'أداة dxdiag بتجمعلك معلومات عن الجهاز، زي كارت الشاشة، المعالج، الرامات، ونظام التشغيل، وكمان بتكشف لو في مشاكل في الـ DirectX.';
    return "الصورة دي بتوضح نتايج الاختبارات اللي اتعملت على الجهاز عشان نقيس الأداء ونتأكد إن كل حاجة حالتها ممتازة.";
};
