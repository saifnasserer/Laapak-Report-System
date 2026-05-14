'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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

    Wifi,
    Bluetooth,
    Battery,
    Speaker,
    Camera,
    Mic,
    Keyboard,
    MousePointer2,
    Monitor as MonitorIcon,
    Thermometer,
    Zap,
    Info,
    ShoppingCart,
    Send,
    ExternalLink,
    Package,
    Truck,
    RefreshCw,
    Copy,
    Trophy,
    Sparkles,
    PartyPopper,
    Layers,
    ChevronDown,
    Activity,
    Usb
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useRouter } from '@/i18n/routing';
import api, { confirmReport } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { WhatsAppShareModal } from '@/components/reports/WhatsAppShareModal';
import { TrackingCodeModal } from '@/components/reports/TrackingCodeModal';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PaymentMethodModal } from '@/components/invoices/PaymentMethodModal';

const ACCESSORIES_CATEGORY_ID = 'pcat_01KJX49W9EFHXGNJKY27C27X53';

const MEDUSA_PUBLISHABLE_KEY = 'pk_bd9f45a9c0ade51d0ea290181c841fae2ed8e5436cd6fd60285fcd5b80841dfa';
const MEDUSA_BASE_URL = '/medusa';

interface ReportViewProps {
    id: string;
    locale: string;
    viewMode: 'admin' | 'client' | 'public';
}

export default function ReportViewV2({ id, locale, viewMode }: ReportViewProps) {
    const t = useTranslations();
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(() => {
        const isReload = typeof window !== 'undefined' && (window.performance?.getEntriesByType?.('navigation')?.[0] as any)?.type === 'reload';
        if (isReload) {
            const saved = localStorage.getItem('lrs_activeStep');
            if (saved) return Math.min(Math.max(parseInt(saved, 10), 1), 7);
        }
        return 1;
    });

    useEffect(() => {
        localStorage.setItem('lrs_activeStep', String(activeStep));
    }, [activeStep]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
    const [sourceDetails, setSourceDetails] = useState('');
    const [warehouseSubmitting, setWarehouseSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'vodafone_cash' | 'instapay' | null>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [agentData, setAgentData] = useState<any>(null);

    const toggleCartItem = (product: any) => {
        setCartItems(prev => {
            const isSelected = prev.find(item => item.id === product.id);
            if (isSelected) {
                return prev.filter(item => item.id !== product.id);
            }
            return [...prev, product];
        });
    };

    const { width, height } = useWindowSize();

    useEffect(() => {
        if (report?.status === 'completed' || report?.status === 'مكتمل') {
            setShowConfetti(true);
        } else {
            setShowConfetti(false);
        }
    }, [report?.status]);

    const isRtl = locale === 'ar';

    const steps = [
        { id: 1, title: 'البيانات والمواصفات' },
        { id: 2, title: 'المعاينة الخارجية' },
        { id: 3, title: 'الفحص التقني' },
        { id: 4, title: 'الفحص الداخلي' },
        { id: 5, title: 'إضافات مهمة!' },
        { id: 7, title: 'تأكيد ومشاركة' },
    ];

    const isCompleted = report?.status === 'completed' || report?.status === 'مكتمل';
    const visibleSteps = steps.filter(s => !isCompleted || (s.id !== 5 && s.id !== 7));
    const lastStepId = visibleSteps[visibleSteps.length - 1]?.id ?? 7;

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/reports/${id}`);
                const reportData = response.data.report;
                setReport(reportData);
                setIsConfirmed(!!reportData.is_confirmed);

                if (reportData.selected_accessories) {
                    const accessories = typeof reportData.selected_accessories === 'string'
                        ? JSON.parse(reportData.selected_accessories)
                        : reportData.selected_accessories;
                    setCartItems(Array.isArray(accessories) ? accessories : []);
                }

                if (reportData.agent_json) {
                    try {
                        const parsed = typeof reportData.agent_json === 'string'
                            ? JSON.parse(reportData.agent_json)
                            : reportData.agent_json;
                        setAgentData(parsed);
                    } catch (e) {
                        console.error('Failed to parse agent_json:', e);
                    }
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
        if (isCompleted && (activeStep === 5 || activeStep === 7)) {
            const firstValid = visibleSteps[0]?.id ?? 1;
            setActiveStep(firstValid);
        }
    }, [report?.status]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (products.length === 0) {
                try {
                    setIsLoadingProducts(true);
                    console.log('Fetching accessories from Medusa...');
                    const response = await axios.get(`${MEDUSA_BASE_URL}/store/products`, {
                        params: {
                            category_id: [ACCESSORIES_CATEGORY_ID],
                            fields: 'id,title,handle,description,thumbnail,variants.id,variants.title,variants.prices.amount,variants.prices.currency_code,images.url',
                            limit: 50
                        },
                        headers: {
                            'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY
                        }
                    });

                    if (!response.data || !response.data.products) {
                        console.error('Invalid response from Medusa:', response.data);
                        setProducts([]);
                        return;
                    }

                    const mappedProducts = response.data.products.map((p: any) => {
                        const firstVariant = p.variants?.[0];
                        const firstPrice = firstVariant?.prices?.[0];
                        const priceAmount = firstPrice ? (firstPrice.amount ?? 0) : 0;

                        return {
                            id: p.id || p.handle || `product-${Math.random().toString(36).substr(2, 9)}`,
                            name: p.title,
                            price: priceAmount,
                            images: p.images?.map((img: any) => ({ src: img.url })) || [],
                            description: p.description
                        };
                    });

                    console.log(`Successfully fetched ${mappedProducts.length} accessories`);
                    setProducts(mappedProducts);
                } catch (err: any) {
                    console.error('Failed to fetch products from Medusa:', err.message, err.response?.data);
                } finally {
                    setIsLoadingProducts(false);
                }
            }
        };

        fetchProducts();
    }, [activeStep, products.length]);

    const calculateFinalTotal = (methodOverride?: string | null) => {
        const baseTotal = parseFloat(report.amount || 0) + cartItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
        let fee = 0;
        let feeReason = '';

        const method = methodOverride !== undefined ? methodOverride : selectedPaymentMethod;

        if (method === 'cash') {
            fee = baseTotal * 0.01;
            feeReason = ' (رسوم شركة الشحن 1%)';
        } else if (method === 'vodafone_cash') {
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

    const submitConfirmation = async (method: any) => {
        if (!method) return;

        try {
            const { baseTotal, fee, finalTotal, feeReason } = calculateFinalTotal(method);
            await confirmReport(id, cartItems, method);
            setIsConfirmed(true);
            setReport((prev: any) => ({ ...prev, payment_method: method, selected_accessories: cartItems }));
            setPaymentModalOpen(false);

            const paymentLabels: any = {
                'cash': 'كاش عند الاستلام (للمندوب)',
                'vodafone_cash': 'فودافون كاش - عند الاستلام',
                'instapay': 'انستاباي - عند الاستلام'
            };

            let messageText = `مساء الخير انا راجعت التقرير وجاهز آكد الأوردر\n\n`;
            messageText += `الجهاز: ${report.device_model}\n`;
            if (cartItems.length > 0) {
                messageText += `الإضافات: ${cartItems.map(i => i.name).join(' + ')}\n`;
            }
            messageText += `طريقة الدفع: ${paymentLabels[method]}\n\n`;
            messageText += `الإجمالي (شامل الإضافات): ${baseTotal.toLocaleString()} ج.م\n`;
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

    const handleConfirmOrder = () => {
        if (isConfirmed && report?.payment_method) {
            submitConfirmation(report.payment_method);
        } else {
            setPaymentModalOpen(true);
        }
    };

    const handleFinalConfirmation = async () => {
        if (!selectedPaymentMethod) return;
        await submitConfirmation(selectedPaymentMethod);
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
            setWarehouseSubmitting(true);

            let laapakClient;
            const clientsResponse = await api.get('/clients?search=Laapak');
            const clients = clientsResponse.data.clients || [];
            laapakClient = clients.find((c: any) => c.name.toLowerCase() === 'laapak' || c.name === 'لابك');

            if (!laapakClient) {
                const createResponse = await api.post('/clients', {
                    name: 'Laapak',
                    phone: '0000000000',
                    email: 'warehouse@laapak.com',
                    address: 'Laapak Warehouse',
                    orderCode: 'LPK0000'
                });
                laapakClient = createResponse.data;
            }

            const updatedNotes = (report.notes || '') + `\nSource: ${sourceDetails}`;
            await api.put(`/reports/${id}`, {
                client_id: laapakClient.id,
                notes: updatedNotes
            });

            setReport((prev: any) => ({ ...prev, client_id: laapakClient.id, client_name: laapakClient.name, notes: updatedNotes }));
            setWarehouseModalOpen(false);
            setSourceDetails('');
            alert('تم إضافة الجهاز للمخزن بنجاح');

        } catch (err) {
            console.error('Failed to assign to warehouse:', err);
            alert('فشل في إضافة الجهاز للمخزن');
        } finally {
            setWarehouseSubmitting(false);
        }
    };

    const updateStatus = async (newStatus: string, shippingData?: { trackingCode: string, trackingMethod: string }, paymentMethod?: string) => {
        try {
            if (newStatus === 'shipped' && !shippingData) {
                setPendingStatus(newStatus);
                setShowTrackingModal(true);
                return;
            }

            if (newStatus === 'completed' && !paymentMethod) {
                setPendingStatus(newStatus);
                setShowPaymentModal(true);
                return;
            }

            await api.put(`/reports/${id}`, {
                status: newStatus,
                ...(shippingData?.trackingCode && { tracking_code: shippingData.trackingCode }),
                ...(shippingData?.trackingMethod && { tracking_method: shippingData.trackingMethod }),
                ...(paymentMethod && { payment_method: paymentMethod })
            });

            if (newStatus === 'completed') {
                try {
                    setIsCreatingInvoice(true);

                    let extraItems: any[] = [];
                    try {
                        if (report.invoice_items) {
                            extraItems = typeof report.invoice_items === 'string'
                                ? JSON.parse(report.invoice_items)
                                : Array.isArray(report.invoice_items) ? report.invoice_items : [];
                        }

                        if (Array.isArray(report.selected_accessories) && report.selected_accessories.length > 0) {
                            const accessories = report.selected_accessories.map((item: any) => ({
                                name: typeof item === 'object' && item !== null ? (item.name || item.description || 'بند غير معروف') : item,
                                price: typeof item === 'object' && item !== null ? (item.price || item.regular_price || 0) : 0,
                                quantity: typeof item === 'object' && item !== null ? (item.quantity || 1) : 1
                            }));

                            accessories.forEach((acc: any) => {
                                const exists = extraItems.some((ei: any) => (ei.name === acc.name || ei.description === acc.name));
                                if (!exists) extraItems.push(acc);
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing report items', e);
                    }

                    const allItems = [
                        {
                            description: report.device_model,
                            amount: report.amount || 0,
                            quantity: 1,
                            totalAmount: report.amount || 0,
                            report_id: report.id,
                            cost_price: report.device_price || 0
                        },
                        ...extraItems.map((item: any) => ({
                            description: item.name || item.description || 'بند إضافي',
                            amount: item.price || item.amount || 0,
                            quantity: item.quantity || 1,
                            totalAmount: (item.price || item.amount || 0) * (item.quantity || 1),
                            report_id: report.id,
                            cost_price: 0
                        }))
                    ];

                    const calculatedTotal = allItems.reduce((acc, current) => acc + Number(current.totalAmount), 0);

                    const invoiceData = {
                        client_id: report.client_id,
                        date: new Date(),
                        report_ids: [report.id],
                        subtotal: calculatedTotal,
                        taxRate: 0,
                        tax: 0,
                        discount: 0,
                        total: calculatedTotal,
                        paymentStatus: 'completed',
                        paymentMethod: paymentMethod || 'cash',
                        items: allItems
                    };

                    await api.post('/invoices', invoiceData);
                    console.log('Auto-invoice created successfully');
                } catch (invoiceErr) {
                    console.error('Failed to auto-create invoice:', invoiceErr);
                } finally {
                    setIsCreatingInvoice(false);
                }
            }

            setReport((prev: any) => ({
                ...prev,
                status: newStatus,
                ...(shippingData?.trackingCode && { tracking_code: shippingData.trackingCode }),
                ...(shippingData?.trackingMethod && { tracking_method: shippingData.trackingMethod }),
                ...(paymentMethod && { payment_method: paymentMethod })
            }));

            if (newStatus === 'shipped') {
                setShowTrackingModal(false);
                setPendingStatus(null);
                setActiveStep(1);
            }

            if (newStatus === 'completed') {
                setPendingStatus(null);
                setShowPaymentModal(false);
                setActiveStep(7);
            }

            alert('تم تحديث الحالة بنجاح');
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('فشل في تحديث الحالة');
        }
    };

    const statusMap: any = {
        'completed': { label: 'مكتمل', variant: 'success' },
        'مكتمل': { label: 'مكتمل', variant: 'success' },
        'pending': { label: 'قيد الانتظار', variant: 'warning' },
        'قيد الانتظار': { label: 'قيد الانتظار', variant: 'warning' },
        'active': { label: 'قيد الانتظار', variant: 'warning' },
        'نشط': { label: 'قيد الانتظار', variant: 'warning' },
        'shipped': { label: 'تم الشحن', variant: 'primary' },
        'تم الشحن': { label: 'تم الشحن', variant: 'primary' },
        'cancelled': { label: 'ملغي', variant: 'destructive' },
        'ملغي': { label: 'ملغي', variant: 'destructive' },
        'ملغى': { label: 'ملغي', variant: 'destructive' },
        'new_order': { label: 'طلب خارجي', variant: 'primary' },
    };

    const getStatusInfo = (status: string) => {
        return statusMap[status] || { label: status || 'غير معروف', variant: 'outline' };
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <div className="text-secondary/40 text-sm font-bold">جاري التحميل...</div>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-destructive/5 flex items-center justify-center mx-auto">
                    <AlertCircle className="text-destructive" size={32} />
                </div>
                <div className="text-destructive text-xl font-black">{error || 'التقرير غير موجود'}</div>
                <Button onClick={() => router.back()} variant="outline" className="rounded-full">العودة للخلف</Button>
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
                        dir="rtl"
                    >
                        {(report.status === 'completed' || report.status === 'مكتمل') && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                className="relative overflow-hidden rounded-3xl bg-white border border-black/[0.03] p-6 md:p-10 shadow-sm group"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                                <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/[0.02] rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                                <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10 text-center md:text-right">
                                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-primary flex items-center justify-center text-white shadow-sm shrink-0">
                                        <Trophy size={48} />
                                    </div>
                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                            <Sparkles size={14} className="text-primary" />
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Order Completed Successfully</span>
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-black text-secondary tracking-tight">
                                            مُبارك اللابتوب 🤩
                                        </h2>
                                        <p className="text-secondary/60 text-sm md:text-base font-medium leading-relaxed max-w-2xl">
                                            {viewMode === 'admin'
                                                ? 'الأوردر ده خلص وتأكد تسليمه للعميل. عاش جداً!'
                                                : 'إحنا مبسوطين جداً إننا خدمناك! نتمنى لك تجربة ممتازة وماتترددش تكلمنا في أي وقت لو احتجت مساعدة.'}
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="mt-4 rounded-full h-11 px-6 font-bold"
                                            onClick={() => setShowConfetti(!showConfetti)}
                                        >
                                            <PartyPopper size={16} />
                                            {showConfetti ? 'وقف الاحتفال' : 'احتفل معانا!'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {(report.status === 'shipped' || report.status === 'تم الشحن') && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                className="relative overflow-hidden rounded-3xl bg-white border border-black/[0.03] p-6 md:p-10 shadow-sm group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                                <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10 text-center md:text-right">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                        <Truck size={40} />
                                    </div>
                                    <div className="flex-1 space-y-6 w-full">
                                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                                                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Shipment In Transit</span>
                                                </div>
                                                <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">
                                                    {viewMode === 'admin' ? 'تم الشحن للعميل' : 'جهازك في السكة ليك'}
                                                </h2>
                                                <p className="text-secondary/60 text-sm md:text-base font-medium leading-relaxed max-w-xl">
                                                    {viewMode === 'admin'
                                                        ? `الجهاز اتشحن عن طريق ${report.tracking_method === 'ENO' ? 'البريد المصري' : report.tracking_method}. تقدر تدوس تحت عشان تتبع الشحنة.`
                                                        : `جهازك دلوقتي مع ${report.tracking_method === 'ENO' ? 'البريد المصري' : report.tracking_method} وجاي على عنوانك. تقدر تنسخ رقم التتبع وتشوف هو فين بالظبط دلوقتي.`}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-3 w-full md:min-w-[300px]">
                                                <div
                                                    className="flex items-center justify-between gap-4 p-4 bg-surface-variant/30 border border-black/[0.03] rounded-2xl cursor-pointer hover:bg-surface-variant/70 transition-all group/copy"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(report.tracking_code || '');
                                                        setIsCopied(true);
                                                        setTimeout(() => setIsCopied(false), 2000);
                                                    }}
                                                >
                                                    <div className="text-right flex-1 min-w-0">
                                                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">{isCopied ? 'تم النسخ بنجاح' : 'رقم التتبع (اضغط للنسخ)'}</p>
                                                        <p className="text-lg md:text-xl font-mono font-bold text-secondary tracking-widest truncate">{report.tracking_code || '---'}</p>
                                                    </div>
                                                    <div className="w-11 h-11 bg-white rounded-xl shadow-sm text-primary flex items-center justify-center shrink-0">
                                                        {isCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="primary"
                                                    size="lg"
                                                    className="rounded-2xl h-13 w-full font-black shadow-sm"
                                                    onClick={() => {
                                                        const url = report.tracking_method === 'Aramex'
                                                            ? `https://www.aramex.com/eg/ar/track/results?shipmentNumber=${report.tracking_code}`
                                                            : `https://egyptpost.gov.eg/ar-eg/home/eservices/track-and-trace/`;
                                                        window.open(url, '_blank');
                                                    }}
                                                >
                                                    تتبع الشحنة
                                                    <ExternalLink size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" dir="rtl">
                            <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm space-y-6">
                                <h3 className="text-lg font-black text-secondary flex items-center gap-3">
                                    <User size={20} className="text-primary/50" />
                                    بيانات العميل
                                </h3>
                                <div className="space-y-5">
                                    <div>
                                        <p className="text-xs font-bold text-secondary/40 mb-1">اسم العميل</p>
                                        <p className="text-xl font-black text-secondary">{report.client_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-secondary/40 mb-1">رقم الهاتف</p>
                                        <p className="text-xl font-black text-secondary dir-ltr inline-block" dir="ltr">{report.client_phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-secondary/40 mb-1">العنوان</p>
                                        <p className="text-base font-medium text-secondary/80">{report.client_address || 'لم يتم تحديد عنوان'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm space-y-6">
                                <h3 className="text-lg font-black text-secondary flex items-center gap-3">
                                    <Smartphone size={20} className="text-primary/50" />
                                    هوية الجهاز
                                </h3>
                                <div className="space-y-5">
                                    <div>
                                        <p className="text-xs font-bold text-secondary/40 mb-1">موديل الجهاز</p>
                                        <p className="text-xl font-black text-secondary">{report.device_model}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-secondary/40 mb-1">الرقم التسلسلي (IMEI/SN)</p>
                                        <p className="text-lg font-mono font-bold text-secondary/60 bg-surface-variant/20 px-3 py-1 rounded-xl inline-block" dir="ltr">{report.serial_number || 'N/A'}</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div>
                                            <p className="text-xs font-bold text-secondary/40 mb-1">تاريخ الفحص</p>
                                            <p className="text-base font-bold text-secondary/80">{report.inspection_date ? new Date(report.inspection_date).toLocaleDateString('ar-EG') : '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-secondary/40 mb-1">رقم الطلب</p>
                                            <p className="text-base font-black text-primary" dir="ltr">#{report.order_number || report.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm" dir="rtl">
                            <h3 className="text-lg font-black text-secondary flex items-center gap-3 mb-6">
                                <Layers size={20} className="text-primary/50" />
                                المواصفات
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(() => {
                                    const hStatus = typeof report.hardware_status === 'string' ? JSON.parse(report.hardware_status) : (report.hardware_status || []);
                                    const getDetail = (comp: string) => {
                                        const item = hStatus.find((h: any) => h.componentName === comp);
                                        if (!item || !item.comment) return null;
                                        try { return JSON.parse(item.comment); } catch (e) { return null; }
                                    };

                                    const cpuD = getDetail('CPU');
                                    const gpuD = getDetail('GPU');
                                    const ramD = getDetail('RAM');
                                    const storageD = getDetail('Storage');
                                    const batteryD = getDetail('Battery');

                                    const cpuCores = agentData?.cpu?.cores || cpuD?.cores;
                                    const cpuTemp = agentData?.cpu?.temperature || cpuD?.temp;
                                    const storageHealth = agentData?.storage?.devices?.[0]?.health || storageD?.devices?.[0]?.health;
                                    const batteryHealth = agentData?.battery?.health || batteryD?.health;
                                    const displayRes = agentData?.display ? `${agentData.display.width}×${agentData.display.height}` : null;

                                    return [
                                        {
                                            label: 'المعالج',
                                            value: report.cpu || 'غير محدد',
                                            icon: <Cpu size={18} />,
                                            subStats: cpuCores ? `${cpuCores} نواة` : cpuD ? `${cpuD.cores} Cores | ${cpuD.temp}°C` : null
                                        },
                                        {
                                            label: 'كارت الشاشة',
                                            value: report.gpu || 'غير محدد',
                                            icon: <MonitorIcon size={18} />,
                                            subStats: gpuD?.devices?.[0] ? `${gpuD.devices[0].vram}MB VRAM` : null
                                        },
                                        {
                                            label: 'الذاكرة',
                                            value: report.ram || 'غير محدد',
                                            icon: <Database size={18} />,
                                            subStats: ramD?.speed ? `${ramD.speed}MHz ${ramD.type || ''}` : null
                                        },
                                        {
                                            label: 'التخزين',
                                            value: report.storage || 'غير محدد',
                                            icon: <HardDrive size={18} />,
                                            subStats: storageHealth ? `الصحة: ${storageHealth}%` : storageD?.devices?.[0]?.health ? `Health: ${storageD.devices[0].health}%` : null
                                        },
                                        ...(batteryHealth ? [{
                                            label: 'البطارية',
                                            value: `صحة ${batteryHealth}%`,
                                            icon: <Battery size={18} />,
                                            subStats: null
                                        }] : []),
                                        ...(displayRes ? [{
                                            label: 'الشاشة',
                                            value: displayRes,
                                            icon: <Monitor size={18} />,
                                            subStats: null
                                        }] : [])
                                    ];
                                })().map((spec, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-surface-variant/10 border border-black/[0.03] hover:bg-white hover:border-primary/10 hover:shadow-sm transition-all group"
                                    >
                                        <div className="w-11 h-11 shrink-0 rounded-xl bg-white flex items-center justify-center text-primary/50 group-hover:text-primary shadow-sm">
                                            {spec.icon}
                                        </div>
                                        <div className="flex flex-col flex-1 text-right min-w-0">
                                            <p className="text-xs font-bold text-secondary/40 uppercase mb-0.5">{spec.label}</p>
                                            <p className="font-black text-secondary truncate text-sm" dir="ltr" style={{ textAlign: 'right' }}>{spec.value || '-'}</p>
                                            {spec.subStats && (
                                                <p className="text-[10px] font-bold text-primary/60 mt-0.5" style={{ textAlign: 'right' }}>{spec.subStats}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {(report.update_history && report.update_history.length > 0) && (
                            <ReportHistorySection
                                history={typeof report.update_history === 'string'
                                    ? JSON.parse(report.update_history)
                                    : report.update_history}
                            />
                        )}
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        className="space-y-8"
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
                        className="space-y-8"
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl md:text-2xl font-black text-secondary flex items-center gap-3">
                                <ShieldCheck className="text-primary" size={24} />
                                سجل الفحص التقني
                            </h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-[10px] font-bold text-secondary/40 uppercase">شغال تمام</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-secondary/20" />
                                    <span className="text-[10px] font-bold text-secondary/40 uppercase">مش موجود بالجهاز</span>
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
                                        <div className="py-16 text-center border-2 border-dashed border-black/[0.03] rounded-3xl">
                                            <p className="text-sm font-black text-secondary/40">مفيش فحوصات فنية اتسجلت لسه</p>
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        <div className="hidden md:block overflow-hidden rounded-3xl border border-black/[0.03] bg-white shadow-sm">
                                            <table className="w-full text-right border-collapse">
                                                <thead>
                                                    <tr className="bg-surface-variant/20 border-b border-black/[0.03]">
                                                        <th className="px-6 py-4 text-[11px] font-black text-secondary/40 uppercase tracking-widest">اختبار المكون</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-secondary/40 uppercase tracking-widest text-center w-40">الحالة التشغيلية</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredTests.map((test: any, idx: number) => {
                                                        const status = test.status || 'neutral';
                                                        return (
                                                            <tr key={idx} className="border-b border-black/[0.02] last:border-0 hover:bg-surface-variant/10 transition-colors group">
                                                                <td className="px-6 py-5">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={cn(
                                                                            "p-2.5 rounded-xl transition-colors",
                                                                            status === 'pass' ? "bg-primary/5 text-primary" : "bg-black/[0.03] text-secondary/30"
                                                                        )}>
                                                                            {getComponentIcon(test.componentName || '')}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-secondary group-hover:text-primary transition-colors">
                                                                                {getComponentTitle(test.componentName || '')}
                                                                            </span>
                                                                            <span className="text-[11px] text-secondary/40 font-medium">تم فحص الوظائف وتحليل الأداء</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <div className="flex justify-center">
                                                                        {status === 'pass' ? (
                                                                            <div className="bg-primary text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tight shadow-sm flex items-center gap-2">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                                                ناجح
                                                                            </div>
                                                                        ) : (
                                                                            <div className="bg-surface-variant/20 text-secondary/40 border border-black/[0.03] px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tight flex items-center gap-2">
                                                                                متشيك عليه
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
                                                    <div key={idx} className="p-3 rounded-2xl bg-white border border-black/[0.03] shadow-sm flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className={cn(
                                                                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                                                status === 'pass' ? "bg-primary/5 text-primary" : "bg-black/[0.03] text-secondary/30"
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
                                                                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
                                                                    <Check size={14} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-full bg-surface-variant/20 text-secondary/30 border border-black/[0.03] flex items-center justify-center">
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
                        className="space-y-8"
                    >
                        <InternalInspectionSection report={report} agentData={agentData} onImageClick={setSelectedImage} />
                    </motion.div>
                );
            case 5:
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        className="space-y-6"
                        dir="rtl"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-surface-variant/10 flex items-center justify-center text-primary shrink-0">
                                    <ShoppingCart size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl md:text-2xl font-black text-secondary">إضافات مهمة</h3>
                                    <p className="text-sm text-secondary/50 font-medium">إكسسوارات ومشتملات تناسب جهازك</p>
                                </div>
                            </div>
                            {cartItems.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10"
                                >
                                    <ShoppingCart size={14} className="text-primary" />
                                    <span className="text-xs font-black text-primary">
                                        {cartItems.length} {cartItems.length === 1 ? 'إضافة' : 'إضافات'}
                                    </span>
                                </motion.div>
                            )}
                        </div>

                        {isLoadingProducts ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                                {[1, 2, 3, 4].map((n) => (
                                    <div key={n} className="space-y-3">
                                        <div className="aspect-square rounded-2xl bg-surface-variant/10 animate-pulse" />
                                        <div className="space-y-2 px-1">
                                            <div className="h-4 bg-surface-variant/10 rounded-lg animate-pulse" />
                                            <div className="h-3 w-2/3 bg-surface-variant/10 rounded-lg animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                                {products.length > 0 ? (
                                    products.map((product: any, idx: number) => {
                                        const cartItem = cartItems.find(item => item.id === product.id);
                                        return (
                                            <motion.div
                                                key={product.id}
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                whileHover={{ y: -3 }}
                                                onClick={() => toggleCartItem(product)}
                                                className={cn(
                                                    "group relative rounded-2xl p-3 md:p-4 transition-all duration-300 cursor-pointer flex flex-col",
                                                    cartItem
                                                        ? "bg-primary/5 ring-1 ring-primary/20"
                                                        : "bg-white hover:bg-surface-variant/20 hover:shadow-sm border border-black/[0.03]"
                                                )}
                                            >
                                                <div className={cn(
                                                    "aspect-square w-full rounded-xl overflow-hidden mb-3 relative",
                                                    cartItem ? "bg-white" : "bg-surface-variant/5"
                                                )}>
                                                    {product.images && product.images[0] ? (
                                                        <img
                                                            src={product.images[0].src}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-secondary/15">
                                                            <Package size={36} />
                                                        </div>
                                                    )}
                                                    {cartItem && (
                                                        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
                                                            <Check size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2 flex-1">
                                                    <h4 className={cn(
                                                        "text-sm font-bold leading-snug line-clamp-2 transition-colors",
                                                        cartItem ? "text-primary" : "text-secondary group-hover:text-primary"
                                                    )}>
                                                        {product.name}
                                                    </h4>
                                                    <div className="flex items-center justify-between mt-auto gap-2">
                                                        <div className="flex items-baseline gap-0.5">
                                                            <span className={cn(
                                                                "text-base md:text-lg font-black transition-colors",
                                                                cartItem ? "text-primary" : "text-secondary"
                                                            )}>
                                                                {product.price.toLocaleString()}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-secondary/40 mr-0.5">ج.م</span>
                                                        </div>
                                                        <motion.div
                                                            whileTap={{ scale: 0.85 }}
                                                            className={cn(
                                                                "w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0",
                                                                cartItem
                                                                    ? "bg-primary text-white shadow-sm"
                                                                    : "bg-surface-variant/10 text-secondary/40 group-hover:bg-primary/10 group-hover:text-primary"
                                                            )}
                                                        >
                                                            {cartItem ? <Minus size={15} /> : <Plus size={15} />}
                                                        </motion.div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-black/[0.03]">
                                        <div className="w-14 h-14 rounded-full bg-surface-variant/10 flex items-center justify-center mx-auto mb-4 text-secondary/20">
                                            <Package size={28} />
                                        </div>
                                        <p className="font-bold text-secondary/40 text-sm">لا توجد إضافات متاحة حالياً</p>
                                        <p className="text-xs text-secondary/30 mt-1">سيتم إضافة المزيد قريباً</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {cartItems.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="sticky bottom-0 mt-6 -mx-4 md:-mx-8 px-4 md:px-8 py-4 bg-white/90 backdrop-blur-xl border-t border-black/[0.03] shadow-lg"
                            >
                                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                                            <ShoppingCart size={18} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-secondary/50">الإجمالي مع الفاتورة</p>
                                            <p className="text-lg font-black text-primary">
                                                {cartItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0).toLocaleString()}
                                                <span className="text-[10px] font-bold mr-1">ج.م</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-secondary/40 font-medium hidden md:inline">
                                            {cartItems.length} {cartItems.length === 1 ? 'منتج مضاف' : 'منتجات مضافة'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                );

            case 7:
                const hasUnsavedChanges = (() => {
                    if (!report) return false;
                    const initialAccessories = report.selected_accessories || [];
                    const currentIds = [...cartItems].map(item => item.id).sort().join(',');
                    const initialIds = [...initialAccessories].map((item: any) => item.id).sort().join(',');
                    return currentIds !== initialIds;
                })();
                const isReallyConfirmed = isConfirmed && !hasUnsavedChanges;
                const step7BaseAmount = parseFloat(report.amount || 0);
                const step7CartTotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
                const step7GrandTotal = step7BaseAmount + step7CartTotal;

                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="space-y-6 max-w-lg mx-auto"
                        dir="rtl"
                    >
                        <div className="text-center space-y-2">
                            <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto">
                                <CheckCircle2 size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-secondary">{viewMode === 'admin' ? 'مراجعة التقرير' : 'جاهزين لاستلام جهازك؟'}</h3>
                            <p className="text-sm text-secondary/50 font-medium">
                                {viewMode === 'admin' ? 'تأكيد الأوردر النهائي أو مشاركته مع العميل' : 'أكد الأوردر عشان نجهزهولك في أسرع وقت'}
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl border border-black/[0.03] shadow-sm p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-secondary/60">الجهاز</span>
                                <span className="text-sm font-bold text-secondary">{report.device_model}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-secondary/60">الإضافات</span>
                                <span className="text-sm font-bold text-secondary">{cartItems.length} {cartItems.length === 1 ? 'إضافة' : 'إضافات'}</span>
                            </div>
                            <div className="pt-3 border-t border-black/[0.03] flex items-center justify-between">
                                <span className="text-sm font-black text-secondary">الإجمالي</span>
                                <span className="text-lg font-black text-primary tabular-nums">{step7GrandTotal.toLocaleString()} <span className="text-[10px] font-bold text-primary/60">ج.م</span></span>
                            </div>
                        </div>

                        {isConfirmed && (report.payment_method || selectedPaymentMethod) && (
                            <div className="flex items-center justify-center gap-2 py-2">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
                                    {(() => {
                                        const method = report.payment_method || selectedPaymentMethod;
                                        const label = method === 'cash' ? 'كاش' : method === 'vodafone_cash' ? 'فودافون كاش' : 'انستاباي';
                                        return (
                                            <>
                                                {method === 'cash' ? <CreditCard size={14} className="text-primary" /> :
                                                    method === 'vodafone_cash' ? <Smartphone size={14} className="text-primary" /> : <Zap size={14} className="text-primary" />}
                                                <span className="text-xs font-bold text-primary">{label}</span>
                                            </>
                                        );
                                    })()}
                                </div>
                                <span className="text-[10px] text-secondary/40">الدفع عند الاستلام</span>
                            </div>
                        )}

                        {cartItems.length > 0 && !isConfirmed && (
                            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-50/50 border border-amber-200/40 text-amber-700">
                                <AlertCircle size={16} className="shrink-0" />
                                <p className="text-xs font-bold">لازم تأكد الطلب عشان الإضافات تتسجل</p>
                            </div>
                        )}

                        {!isReallyConfirmed && (
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleConfirmOrder}
                                className="w-full py-4 px-6 rounded-full bg-primary text-white font-black text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3"
                            >
                                <ShoppingCart size={18} />
                                {isConfirmed && hasUnsavedChanges
                                    ? 'تحديث الأوردر'
                                    : (viewMode === 'admin' ? 'تأكيد وحفظ التغييرات' : 'تأكيد الأوردر')}
                            </motion.button>
                        )}

                        {isReallyConfirmed && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="py-4 px-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center gap-3"
                            >
                                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                                    <Check size={18} />
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-secondary">تم تأكيد الأوردر</p>
                                    <p className="text-[11px] font-bold text-primary/60">شكراً لثقتك في لابك</p>
                                </div>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                {
                                    title: 'مشاركة',
                                    desc: 'واتساب',
                                    icon: <Share2 size={18} />,
                                    color: 'primary',
                                    action: () => {
                                        const shareUrl = `${window.location.origin}/${locale}/reports/${id}`;
                                        if (viewMode === 'admin') {
                                            navigator.clipboard.writeText(shareUrl);
                                            alert('تم نسخ الرابط بنجاح');
                                            setShareModalOpen(true);
                                        } else {
                                            window.open(`https://wa.me/?text=${encodeURIComponent(`بص كده على تقرير فحص جهازي من لابك:\n${shareUrl}`)}`, '_blank');
                                        }
                                    }
                                },
                                ...(viewMode === 'admin' ? [
                                    { title: 'تعديل', desc: 'البيانات', icon: <Edit size={18} />, color: 'secondary', action: () => router.push(`/dashboard/admin/reports/${id}/edit`) },
                                    { title: 'المخزن', desc: 'إضافة', icon: <Package size={18} />, color: 'secondary', action: () => setWarehouseModalOpen(true) }
                                ] : [
                                    { title: 'تقريري', desc: 'الرابط', icon: <ExternalLink size={18} />, color: 'secondary', action: () => {
                                        navigator.clipboard.writeText(`${window.location.origin}/${locale}/reports/${id}`);
                                        alert('تم نسخ الرابط');
                                    }}
                                ])
                            ].map((item, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={item.action}
                                    className="flex flex-col items-center gap-2 py-5 px-3 rounded-2xl bg-white border border-black/[0.03] hover:border-primary/10 hover:shadow-sm transition-all"
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                        item.color === 'primary' ? "bg-primary/5 text-primary" : "bg-surface-variant/10 text-secondary/40"
                                    )}>
                                        {item.icon}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-secondary">{item.title}</p>
                                        <p className="text-[9px] text-secondary/40">{item.desc}</p>
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {viewMode === 'admin' && (
                            <div className="pt-4 border-t border-black/[0.03]">
                                <div className="text-center space-y-3">
                                    <p className="text-[9px] font-black text-secondary/20 uppercase tracking-[0.3em]">حالة الطلب</p>
                                    <div className="flex gap-1.5 p-1.5 bg-surface-variant/10 rounded-2xl">
                                        {[
                                            { key: 'pending', label: 'انتظار', activeClass: 'bg-primary text-white shadow-sm' },
                                            { key: 'shipped', label: 'تم الشحن', activeClass: 'bg-blue-500 text-white shadow-sm' },
                                            { key: 'completed', label: 'مكتمل', activeClass: 'bg-green-500 text-white shadow-sm' },
                                        ].map((s) => (
                                            <button
                                                key={s.key}
                                                onClick={() => updateStatus(s.key)}
                                                className={cn(
                                                    "flex-1 py-2.5 px-1 md:px-3 rounded-xl text-[10px] md:text-xs font-bold transition-all",
                                                    report.status === s.key ? s.activeClass : "bg-white text-secondary/50 hover:bg-black/[0.02]"
                                                )}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
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
        <div className="min-h-screen bg-surface-variant/10 text-secondary selection:bg-primary/5 selection:text-primary relative p-4 md:p-8 overflow-x-hidden">
            {showConfetti && <Confetti width={width} height={height} recycle={true} numberOfPieces={200} style={{ zIndex: 9999 }} />}

            <Modal
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                title="تأكيد طريقة الدفع"
                className="max-w-md"
            >
                <div className="space-y-6" dir="rtl">
                    <p className="text-secondary/60 text-sm">بالنسبة للدفع ف فية ٣ طرق (الدفع عند الاستلام) ، يرجى اختيار الأنسب لك:</p>

                    <div className="space-y-3">
                        {[
                            {
                                id: 'instapay',
                                title: 'انستاباي (الأفضل)',
                                desc: 'دفع عند الاستلام - مش بيخصم اي حاجة زيادة',
                                icon: <Zap className="text-indigo-500" />,
                            },
                            {
                                id: 'cash',
                                title: 'كاش عند الاستلام',
                                desc: 'المندوب بيستلم المبلغ بزيادة ١٪ عشان شركة الشحن بتخصمهم',
                                icon: <CreditCard className="text-orange-500" />,
                            },
                            {
                                id: 'vodafone_cash',
                                title: 'فودافون كاش',
                                desc: 'زياده ١٪ ع المبلغ رسوم سحب فودافون - دفع عند الاستلام',
                                icon: <Smartphone className="text-red-500" />,
                            }
                        ].map((method) => (
                            <div
                                key={method.id}
                                onClick={() => setSelectedPaymentMethod(method.id as any)}
                                className={cn(
                                    "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4",
                                    selectedPaymentMethod === method.id
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-black/[0.03] bg-white hover:border-primary/20"
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
                            className="p-4 rounded-2xl bg-surface-variant/10 border border-black/[0.03] space-y-2"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-secondary/60">الإجمالي الأساسي:</span>
                                <span className="font-bold text-secondary">{calculateFinalTotal().baseTotal.toLocaleString()} ج.م</span>
                            </div>
                            {calculateFinalTotal().fee > 0 && (
                                <div className="flex justify-between items-center text-destructive">
                                    <span className="text-xs">الرسوم الإضافية (1%):</span>
                                    <span className="font-bold">+{calculateFinalTotal().fee.toLocaleString()} ج.م</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-black/[0.03] flex justify-between items-center">
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

            <Modal
                isOpen={warehouseModalOpen}
                onClose={() => setWarehouseModalOpen(false)}
                title="إضافة الجهاز للمخزن"
            >
                <div className="space-y-6" dir="rtl">
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
                        <Button onClick={handleAssignToWarehouse} disabled={warehouseSubmitting}>
                            {warehouseSubmitting ? 'جاري الإضافة...' : 'تأكيد الإضافة للمخزن'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/[0.02] rounded-full blur-[80px]" />
                <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-surface-variant/10 rounded-full blur-[60px]" />
            </div>

            <div className="relative max-w-7xl mx-auto space-y-8 md:space-y-16">
                <header className={cn(
                    "flex flex-col md:flex-row md:items-end justify-between gap-6",
                    isRtl ? "pr-14 md:pr-0" : "pl-14 md:pl-0"
                )}>
                    <div className="space-y-4">
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-secondary leading-[1.1]">
                            تفاصيل <span className="text-primary">التقرير</span>
                        </h1>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
                    <div className="w-full lg:hidden mb-5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-secondary">
                                {steps.find(s => s.id === activeStep)?.title}
                            </span>
                            <span className="text-xs font-black text-secondary/30 tabular-nums">
                                {activeStep} / {visibleSteps.length}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {visibleSteps.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveStep(s.id)}
                                    className={cn(
                                        "h-2 rounded-full transition-all duration-500 flex-1",
                                        activeStep === s.id
                                            ? "bg-primary"
                                            : "bg-black/[0.06]"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <aside className="hidden lg:block lg:w-64 sticky top-24 space-y-12">
                        <div className="space-y-6">
                            <p className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.5em] pr-4">إجراءات الفحص</p>
                            <nav className="space-y-1">
                                {visibleSteps.map((step) => {
                                    const isActive = activeStep === step.id;
                                    return (
                                        <button
                                            key={step.id}
                                            onClick={() => setActiveStep(step.id)}
                                            className={cn(
                                                "w-full flex items-center gap-5 py-4 px-4 rounded-3xl transition-all duration-500 group relative",
                                                isActive ? "bg-white shadow-sm border border-black/[0.03]" : "hover:bg-black/[0.01]"
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
                                                    layoutId="active-indicator-v2"
                                                    className="absolute left-4 w-1.5 h-6 bg-primary rounded-full"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    <main className="flex-1 min-w-0 max-w-4xl w-full">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeStep} className="pb-32">
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>

                        <div className="fixed bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4 p-2 md:p-3 bg-white/90 backdrop-blur-3xl rounded-full border border-black/[0.03] shadow-sm z-50 w-[calc(100%-2rem)] md:w-auto max-w-lg justify-between md:justify-center">
                            {activeStep > 1 && (
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="rounded-full h-11 md:h-14 px-3 md:px-8 font-black hover:bg-black/[0.02] disabled:opacity-0 transition-opacity text-xs md:text-base flex-1 md:flex-initial"
                                    onClick={() => {
                                        const currentIdx = visibleSteps.findIndex(s => s.id === activeStep);
                                        const prevStep = visibleSteps[currentIdx - 1];
                                        if (prevStep) setActiveStep(prevStep.id);
                                    }}
                                    icon={<ChevronRight size={18} />}
                                >
                                    السابق
                                </Button>
                            )}

                            <div className="flex gap-1.5 px-2">
                                {visibleSteps.map((s) => {
                                    const sIdx = visibleSteps.findIndex(x => x.id === s.id);
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => setActiveStep(s.id)}
                                            className={cn(
                                                "rounded-full transition-all duration-500",
                                                activeStep === s.id
                                                    ? "bg-primary w-8 h-2.5"
                                                    : "bg-black/[0.06] hover:bg-black/[0.12] w-2.5 h-2.5"
                                            )}
                                        />
                                    );
                                })}
                            </div>

                            <Button
                                size="lg"
                                className={cn(
                                    "rounded-full h-11 md:h-14 px-4 md:px-10 font-black shadow-sm text-xs md:text-base flex-1 md:flex-initial",
                                    activeStep === 1 && "flex-1 md:w-full max-w-none"
                                )}
                                onClick={() => {
                                    const currentIdx = visibleSteps.findIndex(s => s.id === activeStep);
                                    const nextStep = visibleSteps[currentIdx + 1];
                                    if (nextStep) setActiveStep(nextStep.id);
                                    else {
                                        if (viewMode === 'admin') router.push(`/dashboard/admin/reports`);
                                        else if (viewMode === 'client') router.push(`/dashboard/client`);
                                        else router.push(`/`);
                                    }
                                }}
                            >
                                {activeStep === lastStepId ? 'إغلاق' : 'التالي'}
                                {activeStep < lastStepId && <ChevronLeft size={16} className="mr-1 md:mr-2" />}
                            </Button>
                        </div>
                    </main>
                </div>
            </div>

            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        key="image-lightbox"
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

                <WhatsAppShareModal
                    key="whatsapp-share-modal"
                    isOpen={shareModalOpen}
                    onClose={() => setShareModalOpen(false)}
                    report={report}
                    locale={locale}
                />

                <TrackingCodeModal
                    key="tracking-code-modal"
                    isOpen={showTrackingModal}
                    onClose={() => {
                        setShowTrackingModal(false);
                        setPendingStatus(null);
                    }}
                    onConfirm={(data) => {
                        if (pendingStatus) {
                            updateStatus(pendingStatus, data);
                        }
                    }}
                    report={report}
                />

                <PaymentMethodModal
                    key="payment-method-modal"
                    isOpen={showPaymentModal}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setPendingStatus(null);
                    }}
                    onConfirm={(method) => {
                        if (pendingStatus) {
                            updateStatus(pendingStatus, undefined, method);
                        }
                    }}
                    selectedMethod="cash"
                />
            </AnimatePresence>
        </div>
    );
}

function ExternalExaminationSection({ report, onImageClick }: { report: any, onImageClick: (url: string) => void }) {
    let media: any[] = [];
    try {
        media = typeof report.external_images === 'string' ? JSON.parse(report.external_images) : (report.external_images || []);
    } catch (e) { console.error(e); }

    const images = media.filter((m: any) => m.type === 'image' || !m.type);
    const video = media.find((m: any) => m.type === 'video' || m.type === 'youtube');
    const [selectedMedia, setSelectedMedia] = useState<any>(video || images[0] || null);

    return (
        <div className="space-y-6">
            <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-sm border border-black/[0.03] relative group">
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

            <div className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x no-scrollbar" dir="rtl">
                {video && (
                    <button onClick={() => setSelectedMedia(video)} className={cn("flex-shrink-0 w-16 h-16 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 transition-all relative group snap-start", selectedMedia === video ? "border-primary ring-2 ring-primary/20 scale-105" : "border-transparent opacity-60 hover:opacity-100")}>
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/40 transition-colors"><Video className="text-white" size={20} /></div>
                        <div className="w-full h-full bg-secondary" />
                    </button>
                )}
                {images.map((img: any, idx: number) => (
                    <button key={idx} onClick={() => setSelectedMedia(img)} className={cn("flex-shrink-0 w-16 h-16 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 transition-all snap-start", selectedMedia === img ? "border-primary ring-2 ring-primary/20 scale-105" : "border-transparent opacity-60 hover:opacity-100")}>
                        <img src={img.url} alt={getComponentNameArabic(img.component || img.name)} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
}

function InternalInspectionSection({ report, agentData, onImageClick }: { report: any, agentData: any, onImageClick: (url: string) => void }) {
    let media = [];
    try {
        media = typeof report.external_images === 'string' ? JSON.parse(report.external_images) : (report.external_images || []);
    } catch (e) { }

    const testScreenshots = media.filter((m: any) => m.type === 'test_screenshot');

    let hStatus: any[] = [];
    try {
        hStatus = typeof report.hardware_status === 'string' ? JSON.parse(report.hardware_status) : (report.hardware_status || []);
    } catch (e) { }

    const agentTechMap: any = agentData ? {
        Info: agentData.system,
        CPU: agentData.cpu,
        GPU: agentData.gpu,
        Battery: agentData.battery,
        Storage: agentData.storage,
        Display: agentData.display,
        Keyboard: agentData.keyboard,
        Touchpad: agentData.touchpad,
        Wifi: agentData.network,
        Bluetooth: agentData.bluetooth,
        Ports: agentData.ports,
        DxDiag: agentData.diagnosis
    } : {};

    const getItem = (comp: string) => {
        const screenshot = testScreenshots.find((s: any) => (s.component || s.name || '').toLowerCase() === comp.toLowerCase());
        const statusItem = hStatus.find((h: any) => h.componentName?.toLowerCase() === comp.toLowerCase());
        let techData = null;
        if (statusItem?.comment) {
            try { techData = JSON.parse(statusItem.comment); } catch (e) {}
        }
        return {
            component: comp,
            screenshot: screenshot?.url ? screenshot : null,
            techData: agentTechMap[comp] || techData,
            status: statusItem?.status || (screenshot?.url ? 'pass' : 'neutral')
        };
    };

    const allItems = ['Info', 'CPU', 'GPU', 'Storage', 'Keyboard', 'Battery', 'DxDiag'].map(getItem).filter((i: any) => i.screenshot);

    const [openIndex, setOpenIndex] = useState<number | null>(() => {
        const isReload = typeof window !== 'undefined' && (window.performance?.getEntriesByType?.('navigation')?.[0] as any)?.type === 'reload';
        if (isReload) {
            const saved = localStorage.getItem('lrs_inspectionOpen');
            if (saved !== null) {
                const n = parseInt(saved, 10);
                if (!isNaN(n) && n >= 0 && n < allItems.length) return n;
            }
        }
        return allItems.length > 0 ? 0 : null;
    });

    useEffect(() => {
        if (openIndex !== null) {
            localStorage.setItem('lrs_inspectionOpen', String(openIndex));
        }
    }, [openIndex]);

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-black text-secondary pr-3 border-r-4 border-primary" style={{ borderRightWidth: '4px' }}>الفحص المتقدم والنتائج التقنية</h3>
            {allItems.length > 0 ? (
                <div className="space-y-3">
                    {allItems.map((item: any, idx: number) => {
                        const isOpen = openIndex === idx;
                        return (
                            <div key={idx} className={cn("bg-white border rounded-2xl overflow-hidden transition-all duration-300", isOpen ? "border-primary/10 shadow-sm" : "border-black/[0.03] hover:border-black/5 shadow-sm")}>
                                <button onClick={() => setOpenIndex(isOpen ? null : idx)} className="w-full px-4 md:px-6 py-4 md:py-5 flex items-center justify-between group text-right" dir="rtl">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", isOpen ? "bg-primary text-white" : "bg-black/[0.02] text-secondary/40 group-hover:bg-primary/5 group-hover:text-primary")}>
                                            {getComponentIcon(item.component)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-secondary text-base">{getComponentTitle(item.component)}</span>
                                            <span className="text-[9px] text-primary/60 font-black uppercase tracking-wider">
                                                {item.screenshot ? 'لقطة شاشة الاختبار' : 'نتائج الفحص البرمجي'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" circular className={cn("text-[10px] font-black h-6 px-3", item.status === 'pass' ? "bg-primary/5 text-primary border-primary/10" : "bg-black/[0.02] text-secondary/40")}>
                                            {item.status === 'pass' ? 'PASSED' : 'CHECKED'}
                                        </Badge>
                                        <div className={cn("transition-transform duration-300", isOpen ? "rotate-90 text-primary" : "text-secondary/20")}><ChevronLeft size={20} /></div>
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                                            <div className="px-6 pb-8 pt-4 border-t border-black/[0.02]">
                                                    {item.screenshot ? (
                                                        <div className="w-full aspect-video md:aspect-[21/9] bg-black/[0.02] rounded-2xl md:rounded-3xl overflow-hidden border border-black/[0.03] cursor-zoom-in group/img relative mb-6" onClick={() => onImageClick(item.screenshot.url)}>
                                                            <img src={item.screenshot.url} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="نتيجة فحص فني متقدم" />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center"><Search className="text-white" size={32} /></div>
                                                        </div>
                                                    ) : null}
                                                    {item.techData ? (
                                                        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            {item.component.toLowerCase().includes('battery') && (
                                                                <>
                                                                    <TechStatCard label="صحة البطارية" value={`${Math.round(item.techData.health)}%`} icon={<Zap size={16} />} color="text-primary" />
                                                                    <TechStatCard label="دورات الشحن" value={`${item.techData.cycles}`} icon={<RefreshCw size={16} />} />
                                                                    <TechStatCard label="السعة الفعلية" value={`${Math.round(item.techData.full / 1000)} Wh`} icon={<Battery size={16} />} />
                                                                </>
                                                            )}
                                                            {item.component.toLowerCase().includes('cpu') && (
                                                                <>
                                                                    <TechStatCard label="عدد الأنوية" value={`${item.techData.cores}`} icon={<Cpu size={16} />} color="text-primary" />
                                                                    <TechStatCard label="درجة الحرارة" value={`${item.techData.temp}°C`} icon={<Thermometer size={16} />} />
                                                                    <TechStatCard label="L3 Cache" value={`${item.techData.cache} MB`} icon={<Database size={16} />} />
                                                                </>
                                                            )}
                                                            {(item.component.toLowerCase().includes('storage') || item.component.toLowerCase().includes('hdd') || item.component.toLowerCase().includes('ssd')) && item.techData.devices?.[0] && (
                                                                <>
                                                                    <TechStatCard label="حالة الهارد" value={`${item.techData.devices[0].health}%`} icon={<ShieldCheck size={16} />} color="text-green-600" />
                                                                    <TechStatCard label="المساحة" value={`${Math.round(item.techData.devices[0].size)} GB`} icon={<HardDrive size={16} />} />
                                                                    <TechStatCard label="النوع" value={item.techData.devices[0].type} icon={<Zap size={16} />} />
                                                                </>
                                                            )}
                                                            {item.component.toLowerCase().includes('display') && (
                                                                <>
                                                                    <TechStatCard label="دقة الشاشة" value={`${item.techData.width}×${item.techData.height}`} icon={<MonitorIcon size={16} />} color="text-primary" />
                                                                    <TechStatCard label="معدل التحديث" value={`${item.techData.refresh_rate}Hz`} icon={<Zap size={16} />} />
                                                                </>
                                                            )}
                                                            {item.component.toLowerCase().includes('gpu') && item.techData.devices?.[0] && (
                                                                <>
                                                                    <TechStatCard label="كارت الشاشة" value={item.techData.devices[0].name} icon={<MonitorIcon size={16} />} color="text-primary" />
                                                                    <TechStatCard label="VRAM" value={`${item.techData.devices[0].vram} MB`} icon={<Zap size={16} />} />
                                                                    <TechStatCard label="الشركة" value={item.techData.devices[0].vendor} icon={<CheckCircle2 size={16} />} />
                                                                </>
                                                            )}
                                                            {item.component.toLowerCase().includes('wifi') && item.techData?.devices && (
                                                                <>
                                                                    <TechStatCard label="الجهاز" value={item.techData.devices.find((d: any) => d.is_physical)?.name || item.techData.devices[0]?.name || '—'} icon={<Monitor size={16} />} />
                                                                </>
                                                            )}
                                                            {item.component.toLowerCase().includes('bluetooth') && item.techData?.controller?.name && (
                                                                <>
                                                                    <TechStatCard label="المتحكم" value={item.techData.controller.name} icon={<Cpu size={16} />} />
                                                                </>
                                                            )}
                                                            {item.component.toLowerCase().includes('port') && item.techData && (
                                                                <>
                                                                    {item.techData.usb_count != null && <TechStatCard label="منافذ USB" value={`${item.techData.usb_count} منفذ`} icon={<Usb size={16} />} color="text-primary" />}
                                                                    {item.techData.thunderbolt_count != null && <TechStatCard label="Thunderbolt" value={`${item.techData.thunderbolt_count} منفذ`} icon={<Zap size={16} />} />}
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                    <div className="space-y-4 md:space-y-6">
                                                        <div className="p-4 md:p-6 rounded-2xl bg-black/[0.02] border border-black/[0.02]">
                                                            <h5 className="text-[10px] font-black text-secondary/30 uppercase tracking-widest mb-2">شرح تفصيلي للفحص</h5>
                                                            <p className="text-secondary/70 text-sm md:text-base leading-relaxed font-bold">
                                                                {item.screenshot?.comment || getTestDescription(item.component)}
                                                            </p>
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
                <div className="py-16 text-center border-2 border-dashed border-black/[0.03] rounded-3xl"><ImageIcon className="mx-auto mb-4 text-secondary/20" size={48} /><p className="text-sm font-black text-secondary/40">مفيش أي صور أو فحوصات تقنية اتسجلت لسه</p></div>
            )}
        </div>
    );
}

function TechStatCard({ label, value, icon, color }: { label: string, value: string, icon: any, color?: string }) {
    return (
        <div className="p-4 rounded-2xl bg-white border border-black/[0.03] shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black text-secondary/30 uppercase mb-0.5">{label}</p>
                <p className={cn("text-xs font-black truncate", color || "text-secondary")}>{value}</p>
            </div>
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
    if (lowerName.includes('touchpad') || lowerName.includes('mouse')) return <MousePointer2 size={14} />;
    if (lowerName.includes('screen') || lowerName.includes('display')) return <MonitorIcon size={14} />;
    if (lowerName.includes('ram')) return <Database size={14} />;
    if (lowerName.includes('wifi')) return <Wifi size={14} />;
    if (lowerName.includes('bluetooth')) return <Bluetooth size={14} />;
    if (lowerName.includes('port') || lowerName.includes('usb')) return <Usb size={14} />;
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
    if (lowerName.includes('touchpad')) return 'اختبار لوحة اللمس';
    if (lowerName === 'dxdiag') return 'اختبار DxDiag';
    if (lowerName.includes('screen') || lowerName.includes('display')) return 'فحص جودة الشاشة والبكسلات';
    if (lowerName.includes('wifi')) return 'اختبار الواي فاي';
    if (lowerName.includes('bluetooth')) return 'اختبار البلوتوث';
    if (lowerName.includes('port') || lowerName.includes('usb')) return 'اختبار المنافذ';
    return name ? `اختبار ${name}` : 'فحص فني';
};

const getTestDescription = (name: string) => {
    const comp = (name || '').toLowerCase();
    if (comp.includes('cpu')) return 'ده Stress Test للبروسيسور، بنضغط عليه جامد عشان نتأكد إنه شغال بكفاءة 100% ومش بيهنج ولا بيسخن تحت الضغط الكبير.';
    if (comp.includes('gpu')) return 'استخدمنا FurMark وعملنا stress test لكارت الشاشة بتاعك، يعني دوسنا عليه لأقصى درجة عشان نطمن إنه شغال كويس وحرارته مظبوطة طبيعي.';
    if (comp.includes('battery')) return 'دي صورة من إعدادات الـ BIOS بتبين لك حالة البطارية من جوة. هدفنا نضمنلك إن البطارية صحتها كويسة وشغالة تمام.';
    if (comp.includes('hdd') || comp.includes('ssd') || comp.includes('storage')) return 'ببرنامج Hard Disk Sentinel كشفنا على الهارد بتاعك، وبيقولنا بالظبط حالته إيه ولو في أي باد سيكتور أو مشكلة ف الأداء مسجلينها.';
    if (comp.includes('keyboard')) return 'اختبرنا كل زراير الكيبورد واحد واحد عشان نتأكد إن مفيش زرار معلق وإنه بيستجيب تمام معاك.';
    if (comp.includes('touchpad')) return 'اختبرنا لوحة اللمس للتأكد من استجابتها للحركة والإيماءات المتعددة والنقرات.';
    if (comp.includes('wifi')) return 'تم فحص الواي فاي للتأكد من اكتشاف الشبكات وجودة الإشارة وسرعة الاتصال بالشبكات اللاسلكية.';
    if (comp.includes('bluetooth')) return 'تم فحص البلوتوث للتأكد من قدرته على اكتشاف الأجهزة المجاورة والاتصال بها بسلاسة.';
    if (comp.includes('port') || comp.includes('usb')) return 'تم فحص جميع المنافذ للتأكد من سلامتها الكهربائية وقدرتها على التعرف على الأجهزة المتصلة.';
    if (comp.includes('info')) return 'دي شاشة معلومات الجهاز الأساسية، بتوريك إن كل القطع اللي اتفقنا عليها موجودة صح (زي المعالج، والرامات، وكارت الشاشة والـ Serial Number).';
    if (comp.includes('dxdiag')) return 'ملخص أداة dxdiag، دي أداة بتجمع تقرير كامل عن الجهاز من كارت الشاشة والرامات لنظام التشغيل، وبنتأكد منها إن مفيش أي مشاكل في التعريفات.';
    return "الصورة دي بتأكد نتايج الاختبارات التقنية اللي عملناها على الجهاز، عشان نطمن تماماً إن أداءه مية مية ومفيهوش أي مشكلة.";
};

function ReportHistorySection({ history }: { history: any[] }) {
    if (!history || history.length === 0) return null;

    const sortedHistory = [...history].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm" dir="rtl">
            <h3 className="text-lg font-black text-secondary flex items-center gap-3 mb-6">
                <RefreshCw size={18} className="text-primary/50" />
                تاريخ التحديثات
            </h3>
            <div className="space-y-6">
                {sortedHistory.map((entry, i) => (
                    <div key={i} className="relative flex gap-6 pb-6 last:pb-0 group">
                        {i !== sortedHistory.length - 1 && (
                            <div className="absolute top-9 bottom-0 right-4 w-px bg-black/[0.03] group-hover:bg-primary/10 transition-colors" />
                        )}
                        <div className="w-8 h-8 shrink-0 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center text-primary z-10 shadow-sm">
                            <RefreshCw size={14} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                                <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">
                                    {new Date(entry.timestamp).toLocaleString('ar-EG', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                                {entry.status_at_update && (
                                    <Badge variant="outline" circular className="text-[9px] font-black opacity-60 bg-black/[0.02] border-none px-2 h-5 w-fit">
                                        الحالة: {entry.status_at_update}
                                    </Badge>
                                )}
                            </div>
                            <div className="text-sm font-bold text-secondary/80 leading-relaxed bg-black/[0.02] p-4 rounded-2xl border border-transparent group-hover:border-primary/10 group-hover:bg-white group-hover:shadow-sm transition-all">
                                {entry.description}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
