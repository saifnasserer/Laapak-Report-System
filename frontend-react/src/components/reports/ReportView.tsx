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
    Package,
    Truck,
    RefreshCw,
    Copy,
    Trophy,
    Sparkles,
    PartyPopper,
    Activity,
    Usb,
    MousePointer2,
    Layers,
    Wrench,
    AlertTriangle
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
import ExternalExaminationSection from './report-view-v2/sections/ExternalExaminationSection';
import StepAccessories from './report-view-v2/steps/StepAccessories';
import ImageLightbox from './report-view-v2/modals/ImageLightbox';
import PaymentSelectionModal from './report-view-v2/modals/PaymentSelectionModal';

// WooCommerce Configuration
const ACCESSORIES_CATEGORY_ID = 'pcat_01KJX49W9EFHXGNJKY27C27X53';

// Medusa Config
const MEDUSA_PUBLISHABLE_KEY = 'pk_bd9f45a9c0ade51d0ea290181c841fae2ed8e5436cd6fd60285fcd5b80841dfa';
const MEDUSA_BASE_URL = '/medusa'; // via next.config.ts proxy

interface ReportViewProps {
    id: string;
    locale: string;
    viewMode: 'admin' | 'client' | 'public';
    initialReport?: any;
}

export default function ReportView({ id, locale, viewMode, initialReport }: ReportViewProps) {
    const t = useTranslations();
    const router = useRouter();
    const [report, setReport] = useState<any>(initialReport || null);
    const [isLoading, setIsLoading] = useState(!initialReport);
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
    const [warehouseSubmitting, setWarehouseSubmitting] = useState(false);

    // Invoice & Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);

    // Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'vodafone_cash' | 'instapay' | null>(null);

    const [shareModalOpen, setShareModalOpen] = useState(false);

    // Live Tracking State
    const [isCopied, setIsCopied] = useState(false);
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
    const [showConfetti, setShowConfetti] = useState(false);

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

                // Set initial step based on status
                if (reportData.status === 'completed' || reportData.status === 'مكتمل') {
                    setActiveStep(7);
                }

                if (reportData.selected_accessories) {
                    const accessories = typeof reportData.selected_accessories === 'string'
                        ? JSON.parse(reportData.selected_accessories)
                        : reportData.selected_accessories;
                    setCartItems(Array.isArray(accessories) ? accessories : []);
                }
                setError(null);
            } catch (err: any) {
                console.error('Failed to fetch report:', err);
                setError('فشل في تحميل تفاصيل التقرير.');
            } finally {
                setIsLoading(false);
            }
        };

        if (initialReport) {
            setReport(initialReport);
            setIsConfirmed(!!initialReport.is_confirmed);
            if (initialReport.status === 'completed' || initialReport.status === 'مكتمل') {
                setActiveStep(7);
            }
            if (initialReport.selected_accessories) {
                const accessories = typeof initialReport.selected_accessories === 'string'
                    ? JSON.parse(initialReport.selected_accessories)
                    : initialReport.selected_accessories;
                setCartItems(Array.isArray(accessories) ? accessories : []);
            }
            setIsLoading(false);
        } else {
            fetchReport();
        }
    }, [id, initialReport]);

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

                    // Map Medusa products to the format expected by the UI
                    const mappedProducts = response.data.products.map((p: any) => {
                        // Medusa V2 Price structure: variants[0].prices[0].amount
                        // Prices are in minor units (e.g., 5000 = 50.00 EGP)
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

            // Auto-create invoice if status changed to completed
            if (newStatus === 'completed') {
                try {
                    setIsCreatingInvoice(true);

                    // Parse extra invoice items safely
                    let extraItems: any[] = [];
                    try {
                        if (report.invoice_items) {
                            extraItems = typeof report.invoice_items === 'string'
                                ? JSON.parse(report.invoice_items)
                                : Array.isArray(report.invoice_items) ? report.invoice_items : [];
                        }

                        // Also check for selected_accessories
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
                    // We don't want to block the status update if invoice creation fails, 
                    // but we should probably warn the admin
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
                setActiveStep(1); // Show the tracking hero
            }

            if (newStatus === 'completed') {
                setPendingStatus(null);
                setShowPaymentModal(false);
                setActiveStep(7); // Show sharing/confirmation
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
                        className="space-y-6"
                        dir="rtl"
                    >
                        {/* Completed Banner */}
                        {(report.status === 'completed' || report.status === 'مكتمل') && (
                            <div className="relative overflow-hidden rounded-3xl bg-white border border-green-500/20 p-6 shadow-sm group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-green-500/20 transition-colors duration-700" />
                                <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                                <div className="relative flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-10 text-center md:text-right">
                                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto md:mx-0 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 shrink-0">
                                        <Trophy size={36} />
                                    </div>

                                    <div className="flex-1 space-y-3 w-full">
                                        <div className="flex items-center gap-2 justify-center md:justify-start">
                                            <Sparkles size={14} className="text-green-600 shrink-0" />
                                            <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">Order Completed Successfully</span>
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">
                                            {viewMode === 'admin' ? 'تمت المهمة بنجاح!' : 'ألف مبروك! جهازك خلص وبقى تمام'}
                                        </h2>
                                        <p className="text-secondary/60 text-sm md:text-base font-medium leading-relaxed max-w-2xl mx-auto md:mx-0">
                                            {viewMode === 'admin'
                                                ? 'الأوردر ده خلص وتأكد تسليمه للعميل. عاش جداً!'
                                                : 'إحنا مبسوطين جداً إننا خدمناك! نتمنى لك تجربة ممتازة وماتترددش تكلمنا في أي وقت لو احتجت مساعدة.'}
                                        </p>

                                        <Button
                                            variant="outline"
                                            className="border-green-500/30 text-green-700 hover:bg-green-50 hover:border-green-500/50 transition-colors gap-2 rounded-2xl h-11 px-5 font-bold bg-white/50 backdrop-blur-sm"
                                            onClick={() => setShowConfetti(!showConfetti)}
                                        >
                                            <PartyPopper size={16} />
                                            {showConfetti ? 'وقف الاحتفال' : 'احتفل معانا!'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Shipped Banner */}
                        {(report.status === 'shipped' || report.status === 'تم الشحن') && (
                            <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm">
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 text-center md:text-right">
                                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto md:mx-0 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shrink-0">
                                        <Truck size={36} />
                                    </div>

                                    <div className="flex-1 space-y-5 w-full">
                                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 md:gap-8">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Shipment In Transit</span>
                                                </div>
                                                <h2 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">
                                                    {viewMode === 'admin' ? 'تم الشحن للعميل' : 'جهازك في السكة ليك'}
                                                </h2>
                                                <p className="text-secondary/60 text-sm md:text-base font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
                                                    {viewMode === 'admin'
                                                        ? `الجهاز اتشحن عن طريق ${report.tracking_method === 'ENO' ? 'البريد المصري' : report.tracking_method}. تقدر تدوس تحت عشان تتبع الشحنة.`
                                                        : `جهازك دلوقتي مع ${report.tracking_method === 'ENO' ? 'البريد المصري' : report.tracking_method} وجاي على عنوانك. تقدر تنسخ رقم التتبع وتشوف هو فين بالظبط دلوقتي.`}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-3 w-full md:min-w-[300px]">
                                                <div
                                                    className="flex items-center justify-between gap-4 p-4 bg-black/[0.02] border border-black/[0.03] rounded-2xl cursor-pointer hover:bg-black/[0.04] transition-all group/copy w-full"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(report.tracking_code || '');
                                                        setIsCopied(true);
                                                        setTimeout(() => setIsCopied(false), 2000);
                                                    }}
                                                >
                                                    <div className="text-right flex-1 min-w-0">
                                                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">{isCopied ? 'تم النسخ بنجاح' : 'رقم التتبع (اضغط للنسخ)'}</p>
                                                        <p className="text-lg md:text-xl font-mono font-bold text-secondary tracking-widest">{report.tracking_code || '---'}</p>
                                                    </div>
                                                    <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm text-primary shrink-0">
                                                        {isCopied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="primary"
                                                    size="lg"
                                                    className="rounded-2xl h-12 w-full font-black shadow-sm flex items-center justify-center gap-3"
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
                            </div>
                        )}

                        {/* Device Identity + Client Info */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Device Identity */}
                            <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm space-y-5">
                                <h3 className="text-base font-black text-secondary flex items-center gap-3">
                                    <Smartphone size={18} className="text-primary/50" />
                                    هوية الجهاز
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-bold text-secondary/40 mb-1">موديل الجهاز</p>
                                        <p className="text-2xl font-black text-secondary">{report.device_model}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-secondary/40 mb-1">الرقم التسلسلي (IMEI/SN)</p>
                                        <p className="text-sm font-mono font-bold text-secondary/70 bg-black/[0.02] px-3 py-1.5 rounded-xl inline-block" dir="ltr">{report.serial_number || 'N/A'}</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">تاريخ الفحص</p>
                                            <p className="text-base font-bold text-secondary/80">{report.inspection_date ? new Date(report.inspection_date).toLocaleDateString('ar-EG') : '-'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">رقم الطلب</p>
                                            <p className="text-base font-black text-primary" dir="ltr">#{report.order_number || report.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Client Info */}
                            <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm space-y-5">
                                <h3 className="text-base font-black text-secondary flex items-center gap-3">
                                    <User size={18} className="text-primary/50" />
                                    بيانات العميل
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-bold text-secondary/40 mb-1">اسم العميل</p>
                                        <p className="text-xl font-black text-secondary">{report.client_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-secondary/40 mb-1">رقم الموبايل</p>
                                        <p className="text-sm font-bold text-secondary/70" dir="ltr">{report.client_phone}</p>
                                    </div>
                                    {report.client_address && (
                                        <div>
                                            <p className="text-xs font-bold text-secondary/40 mb-1">العنوان</p>
                                            <p className="text-sm font-bold text-secondary/70">{report.client_address}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Specs */}
                        <div className="rounded-3xl bg-white border border-black/[0.03] p-6 shadow-sm">
                            <h3 className="text-base font-black text-secondary flex items-center gap-3 mb-5">
                                <Layers size={18} className="text-primary/50" />
                                المواصفات
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                                    return [
                                        {
                                            label: t('dashboard.reports.specs.processor'),
                                            value: report.cpu || 'Not Specified',
                                            icon: <Cpu size={16} />,
                                            sub: cpuD ? `${cpuD.cores} Cores | ${cpuD.temp}°C` : null
                                        },
                                        {
                                            label: t('dashboard.reports.specs.graphics'),
                                            value: report.gpu || 'Not Specified',
                                            icon: <MonitorIcon size={16} />,
                                            sub: gpuD?.devices?.[0] ? `${gpuD.devices[0].vram}MB VRAM` : null
                                        },
                                        {
                                            label: t('dashboard.reports.specs.memory'),
                                            value: report.ram || 'Not Specified',
                                            icon: <Database size={16} />,
                                            sub: ramD?.speed ? `${ramD.speed}MHz ${ramD.type || ''}` : null
                                        },
                                        {
                                            label: t('dashboard.reports.specs.storage'),
                                            value: report.storage || 'Not Specified',
                                            icon: <HardDrive size={16} />,
                                            sub: storageD?.devices?.[0]?.health ? `Health: ${storageD.devices[0].health}%` : null
                                        }
                                    ].map((spec, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-black/[0.02] border border-black/[0.02] hover:bg-white hover:border-primary/10 hover:shadow-sm transition-all group">
                                            <div className="w-10 h-10 shrink-0 rounded-xl bg-white flex items-center justify-center text-primary/40 group-hover:text-primary shadow-sm transition-colors">{spec.icon}</div>
                                            <div className="flex flex-col flex-1 min-w-0 text-right">
                                                <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-0.5">{spec.label}</p>
                                                <p className="font-black text-secondary text-sm truncate" dir="ltr" style={{ textAlign: 'right' }}>{spec.value || '—'}</p>
                                                {spec.sub && <p className="text-[10px] font-bold text-primary/50 mt-0.5">{spec.sub}</p>}
                                            </div>
                                        </motion.div>
                                    ));
                                })()}
                            </div>
                        </div>

                        {/* Report History */}
                        {report.update_history && (
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
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <span className="text-[10px] font-bold text-secondary/40 uppercase">شغال تمام</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-secondary/20" />
                                    <span className="text-[10px] font-bold text-secondary/40 uppercase">يحتاج مراجعة</span>
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
                                        <div className="py-12 text-center border-2 border-dashed border-black/[0.03] rounded-3xl opacity-40">
                                            <p className="text-sm font-black text-secondary/40">مفيش فحوصات فنية اتسجلت لسه</p>
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        <div className="hidden md:block overflow-hidden rounded-3xl border border-black/[0.03] bg-white shadow-sm">
                                            <table className="w-full text-right border-collapse">
                                                <thead>
                                                    <tr className="bg-black/[0.02] border-b border-black/[0.03]">
                                                        <th className="px-6 py-4 text-[11px] font-black text-secondary/30 uppercase tracking-widest">اختبار المكون</th>
                                                        <th className="px-6 py-4 text-[11px] font-black text-secondary/30 uppercase tracking-widest text-center w-40">الحالة التشغيلية</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredTests.map((test: any, idx: number) => {
                                                        const status = test.status || 'neutral';
                                                        return (
                                                            <tr key={idx} className="border-b border-black/[0.02] last:border-0 hover:bg-black/[0.01] transition-colors group">
                                                                <td className="px-6 py-5">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={cn(
                                                                            "p-2.5 rounded-xl transition-colors",
                                                                            status === 'pass' ? "bg-primary/5 text-primary" : "bg-black/[0.03] text-secondary/30"
                                                                        )}>
                                                                            {getComponentIcon(test.componentName || '')}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-secondary text-lg group-hover:text-primary transition-colors">
                                                                                {getComponentTitle(test.componentName || '')}
                                                                            </span>
                                                                            <span className="text-[11px] text-secondary/40 font-medium">تم فحص الوظائف وتحليل الأداء</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <div className="flex justify-center">
                                                                        {status === 'pass' ? (
                                                                            <div className="bg-primary text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tight shadow-sm flex items-center gap-2 cursor-default">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                                                مية مية
                                                                            </div>
                                                                        ) : (
                                                                            <div className="bg-black/[0.02] text-secondary/30 border border-black/[0.03] px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tight flex items-center gap-2 cursor-default">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-secondary/20" />
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
                                                                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white">
                                                                    <Check size={14} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-full bg-black/[0.03] text-secondary/20 border border-black/[0.03] flex items-center justify-center">
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
                    <StepAccessories
                        products={products}
                        isLoadingProducts={isLoadingProducts}
                        cartItems={cartItems}
                        toggleCartItem={toggleCartItem}
                        calculateFinalTotal={calculateFinalTotal}
                        handleConfirmOrder={handleConfirmOrder}
                        isConfirmed={isConfirmed}
                    />
                );
            case 6: {
                const invoices = report.relatedInvoices || [];
                const totalPaid = invoices.reduce((s: number, inv: any) => s + (inv.paymentStatus === 'paid' ? parseFloat(inv.total) || 0 : 0), 0);
                const totalAmt = invoices.reduce((s: number, inv: any) => s + (parseFloat(inv.total) || 0), 0);
                const finalTotalDetails = calculateFinalTotal();
                const paymentLabels: Record<string, string> = {
                    'cash': 'كاش عند الاستلام (للمندوب)',
                    'vodafone_cash': 'فودافون كاش - عند الاستلام',
                    'instapay': 'انستاباي - عند الاستلام'
                };
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6" dir="rtl">

                        <div className="rounded-3xl bg-white border border-black/[0.03] p-5 md:p-6 shadow-sm space-y-4">
                            <h3 className="text-base font-black text-secondary flex items-center gap-3"><CreditCard size={18} className="text-primary/50" />ملخص الطلب</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-black/[0.02]">
                                    <span className="text-sm font-bold text-secondary">{report.device_model || 'اللابتوب'}</span>
                                    <span className="text-sm font-black text-secondary">{(parseFloat(report.amount || 0)).toLocaleString()} ج.م</span>
                                </div>
                                {cartItems.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center py-1.5 text-secondary/60 border-b border-black/[0.01]">
                                        <span className="text-xs font-bold flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            {item.name}
                                        </span>
                                        <span className="text-xs font-black">{(parseFloat(item.price || 0)).toLocaleString()} ج.م</span>
                                    </div>
                                ))}
                                <div className="pt-3 flex justify-between items-center text-secondary/50 text-xs">
                                    <span>الإجمالي الفرعي:</span>
                                    <span>{finalTotalDetails.baseTotal.toLocaleString()} ج.م</span>
                                </div>
                                {finalTotalDetails.fee > 0 && (
                                    <div className="flex justify-between items-center text-rose-500 text-xs">
                                        <span>الرسوم الإضافية{finalTotalDetails.feeReason}:</span>
                                        <span className="font-black">+{finalTotalDetails.fee.toLocaleString()} ج.م</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-black/[0.03] flex justify-between items-center">
                                    <span className="font-black text-secondary">الإجمالي المطلوب:</span>
                                    <span className="text-xl font-black text-primary">{finalTotalDetails.finalTotal.toLocaleString()} ج.م</span>
                                </div>
                                {isConfirmed && (report.payment_method || selectedPaymentMethod) && (
                                    <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                                        <CreditCard size={16} className="text-primary shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <h4 className="font-bold text-primary text-[11px]">طريقة الدفع المختارة</h4>
                                            <p className="text-secondary/70 text-[11px] font-bold leading-relaxed">
                                                {paymentLabels[report.payment_method || selectedPaymentMethod] || report.payment_method || selectedPaymentMethod}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {invoices.length > 0 && (
                            <div className="rounded-3xl bg-white border border-black/[0.03] p-5 md:p-6 shadow-sm space-y-4">
                                <h3 className="text-base font-black text-secondary flex items-center gap-3"><CheckCircle2 size={18} className="text-primary/50" />الفواتير</h3>
                                <div className="space-y-3">
                                    {invoices.map((inv: any, i: number) => (
                                        <div key={i} onClick={() => handlePrint(inv.id)}
                                            className="p-3.5 bg-black/[0.02] rounded-2xl flex items-center justify-between border border-black/[0.02] gap-3 cursor-pointer hover:bg-black/[0.04] transition-all group">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-0.5">فاتورة</p>
                                                <p className="font-bold text-secondary font-mono text-sm group-hover:text-primary transition-colors">#{inv.id}</p>
                                                <p className="text-[9px] text-secondary/40 mt-0.5">{inv.date ? new Date(inv.date).toLocaleDateString('ar-EG') : ''}</p>
                                            </div>
                                            <div className="text-left flex flex-col items-end gap-1">
                                                <p className="text-base md:text-lg font-black text-primary leading-none">{parseFloat(inv.total).toLocaleString()} <span className="text-xs font-bold text-secondary/40">ج.م</span></p>
                                                <span className={cn("text-[9px] font-black px-2.5 py-0.5 rounded-full border inline-block tracking-wider", inv.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100')}>{inv.paymentStatus === 'paid' ? 'مدفوعة' : 'مستحقة'}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-3 border-t border-black/[0.03] flex justify-between items-end gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-0.5">الإجمالي المدفوع</p>
                                            <p className="text-xl md:text-2xl font-black text-emerald-600">{totalPaid.toLocaleString()} <span className="text-xs md:text-sm font-bold text-secondary/40">ج.م</span></p>
                                        </div>
                                        {totalAmt > totalPaid && (
                                            <div className="text-left flex flex-col items-end">
                                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-0.5">المتبقي</p>
                                                <p className="text-base md:text-lg font-black text-rose-600">{(totalAmt - totalPaid).toLocaleString()} <span className="text-xs font-bold text-secondary/40">ج.م</span></p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="rounded-3xl bg-white border border-black/[0.03] p-5 md:p-6 shadow-sm space-y-5">
                            <div className="text-center space-y-2">
                                <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto">
                                    <CheckCircle2 size={28} />
                                </div>
                                <h3 className="text-xl font-black text-secondary">إكمال العملية</h3>
                                <p className="text-xs text-secondary/50 font-medium">اعتماد التقرير أو إجراء العمليات التالية</p>
                            </div>

                            {!isConfirmed ? (
                                <button onClick={handleConfirmOrder}
                                    className="w-full py-3.5 px-6 rounded-full bg-primary text-white font-black text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                                    <CheckCircle2 size={16} />{viewMode === 'admin' ? 'تأكيد وحفظ التغييرات' : 'تأكيد الأوردر ومتابعة الشحن'}
                                </button>
                            ) : (
                                <div className="py-3.5 px-5 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col gap-2">
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0"><Check size={16} /></div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-secondary">تم تأكيد الأوردر بنجاح</p>
                                            <p className="text-[11px] font-bold text-primary/60">
                                                {report.payment_method ? `طريقة الدفع: ${paymentLabels[report.payment_method] || report.payment_method}` : 'شكراً!'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isConfirmed && viewMode !== 'admin' && (
                                <button onClick={handleConfirmOrder}
                                    className="w-full py-3.5 px-6 rounded-full border border-black/[0.04] bg-white text-secondary hover:bg-black/[0.01] font-bold text-xs transition-all flex items-center justify-center gap-2">
                                    تعديل طريقة الدفع أو إعادة إرسال الأوردر
                                </button>
                            )}

                            {viewMode === 'admin' && (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    {[
                                        { title: 'تعديل التقرير', desc: 'تحديث البيانات', icon: <Edit size={16} />, action: () => router.push(`/dashboard/admin/reports/${id}/edit`) },
                                        { title: 'المخزن', desc: 'إضافة الجهاز', icon: <Package size={16} />, action: () => setWarehouseModalOpen(true) },
                                    ].map((item, i) => (
                                        <motion.button key={i} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={item.action}
                                            className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl bg-white border border-black/[0.03] hover:border-primary/10 hover:shadow-sm transition-all">
                                            <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center">{item.icon}</div>
                                            <div className="text-center"><p className="text-xs font-bold text-secondary">{item.title}</p><p className="text-[9px] text-secondary/40">{item.desc}</p></div>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            }
            case 7: {
                const invoices = report.relatedInvoices || [];
                const totalPaid = invoices.reduce((s: number, inv: any) => s + (inv.paymentStatus === 'paid' ? parseFloat(inv.total) || 0 : 0), 0);
                const totalAmt = invoices.reduce((s: number, inv: any) => s + (parseFloat(inv.total) || 0), 0);
                const finalTotalDetails = calculateFinalTotal();
                const paymentLabels: Record<string, string> = {
                    'cash': 'كاش عند الاستلام (للمندوب)',
                    'vodafone_cash': 'فودافون كاش - عند الاستلام',
                    'instapay': 'انستاباي - عند الاستلام'
                };
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6" dir="rtl">

                        <div className="rounded-3xl bg-white border border-black/[0.03] p-5 md:p-6 shadow-sm space-y-4">
                            <h3 className="text-base font-black text-secondary flex items-center gap-3"><CreditCard size={18} className="text-primary/50" />ملخص الطلب</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-black/[0.02]">
                                    <span className="text-sm font-bold text-secondary">{report.device_model || 'اللابتوب'}</span>
                                    <span className="text-sm font-black text-secondary">{(parseFloat(report.amount || 0)).toLocaleString()} ج.م</span>
                                </div>
                                {cartItems.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center py-1.5 text-secondary/60 border-b border-black/[0.01]">
                                        <span className="text-xs font-bold flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            {item.name}
                                        </span>
                                        <span className="text-xs font-black">{(parseFloat(item.price || 0)).toLocaleString()} ج.م</span>
                                    </div>
                                ))}
                                <div className="pt-3 flex justify-between items-center text-secondary/50 text-xs">
                                    <span>الإجمالي الفرعي:</span>
                                    <span>{finalTotalDetails.baseTotal.toLocaleString()} ج.م</span>
                                </div>
                                {finalTotalDetails.fee > 0 && (
                                    <div className="flex justify-between items-center text-rose-500 text-xs">
                                        <span>الرسوم الإضافية{finalTotalDetails.feeReason}:</span>
                                        <span className="font-black">+{finalTotalDetails.fee.toLocaleString()} ج.م</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-black/[0.03] flex justify-between items-center">
                                    <span className="font-black text-secondary">الإجمالي المطلوب:</span>
                                    <span className="text-xl font-black text-primary">{finalTotalDetails.finalTotal.toLocaleString()} ج.م</span>
                                </div>
                                {isConfirmed && (report.payment_method || selectedPaymentMethod) && (
                                    <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                                        <CreditCard size={16} className="text-primary shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <h4 className="font-bold text-primary text-[11px]">طريقة الدفع المختارة</h4>
                                            <p className="text-secondary/70 text-[11px] font-bold leading-relaxed">
                                                {paymentLabels[report.payment_method || selectedPaymentMethod] || report.payment_method || selectedPaymentMethod}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {invoices.length > 0 && (
                            <div className="rounded-3xl bg-white border border-black/[0.03] p-5 md:p-6 shadow-sm space-y-4">
                                <h3 className="text-base font-black text-secondary flex items-center gap-3"><CheckCircle2 size={18} className="text-primary/50" />الفواتير</h3>
                                <div className="space-y-3">
                                    {invoices.map((inv: any, i: number) => (
                                        <div key={i} onClick={() => handlePrint(inv.id)}
                                            className="p-3.5 bg-black/[0.02] rounded-2xl flex items-center justify-between border border-black/[0.02] gap-3 cursor-pointer hover:bg-black/[0.04] transition-all group">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-0.5">فاتورة</p>
                                                <p className="font-bold text-secondary font-mono text-sm group-hover:text-primary transition-colors">#{inv.id}</p>
                                                <p className="text-[9px] text-secondary/40 mt-0.5">{inv.date ? new Date(inv.date).toLocaleDateString('ar-EG') : ''}</p>
                                            </div>
                                            <div className="text-left flex flex-col items-end gap-1">
                                                <p className="text-base md:text-lg font-black text-primary leading-none">{parseFloat(inv.total).toLocaleString()} <span className="text-xs font-bold text-secondary/40">ج.م</span></p>
                                                <span className={cn("text-[9px] font-black px-2.5 py-0.5 rounded-full border inline-block tracking-wider", inv.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100')}>{inv.paymentStatus === 'paid' ? 'مدفوعة' : 'مستحقة'}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-3 border-t border-black/[0.03] flex justify-between items-end gap-4">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-secondary/30 uppercase tracking-wider mb-0.5">الإجمالي المدفوع</p>
                                            <p className="text-xl md:text-2xl font-black text-emerald-600">{totalPaid.toLocaleString()} <span className="text-xs md:text-sm font-bold text-secondary/40">ج.م</span></p>
                                        </div>
                                        {totalAmt > totalPaid && (
                                            <div className="text-left flex flex-col items-end">
                                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-0.5">المتبقي</p>
                                                <p className="text-base md:text-lg font-black text-rose-600">{(totalAmt - totalPaid).toLocaleString()} <span className="text-xs font-bold text-secondary/40">ج.م</span></p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="rounded-3xl bg-white border border-black/[0.03] p-5 md:p-6 shadow-sm space-y-5">
                            <div className="text-center space-y-2">
                                <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto">
                                    <CheckCircle2 size={28} />
                                </div>
                                <h3 className="text-xl font-black text-secondary">إكمال العملية</h3>
                                <p className="text-xs text-secondary/50 font-medium">اعتماد التقرير أو إجراء العمليات التالية</p>
                            </div>

                            {!isConfirmed ? (
                                <button onClick={handleConfirmOrder}
                                    className="w-full py-3.5 px-6 rounded-full bg-primary text-white font-black text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                                    <CheckCircle2 size={16} />{viewMode === 'admin' ? 'تأكيد وحفظ التغييرات' : 'تأكيد الأوردر ومتابعة الشحن'}
                                </button>
                            ) : (
                                <div className="py-3.5 px-5 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col gap-2">
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0"><Check size={16} /></div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-secondary">تم تأكيد الأوردر بنجاح</p>
                                            <p className="text-[11px] font-bold text-primary/60">
                                                {report.payment_method ? `طريقة الدفع: ${paymentLabels[report.payment_method] || report.payment_method}` : 'شكراً!'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isConfirmed && viewMode !== 'admin' && (
                                <button onClick={handleConfirmOrder}
                                    className="w-full py-3.5 px-6 rounded-full border border-black/[0.04] bg-white text-secondary hover:bg-black/[0.01] font-bold text-xs transition-all flex items-center justify-center gap-2">
                                    تعديل طريقة الدفع أو إعادة إرسال الأوردر
                                </button>
                            )}

                            {viewMode === 'admin' && (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    {[
                                        { title: 'تعديل التقرير', desc: 'تحديث البيانات', icon: <Edit size={16} />, action: () => router.push(`/dashboard/admin/reports/${id}/edit`) },
                                        { title: 'المخزن', desc: 'إضافة الجهاز', icon: <Package size={16} />, action: () => setWarehouseModalOpen(true) },
                                    ].map((item, i) => (
                                        <motion.button key={i} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={item.action}
                                            className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl bg-white border border-black/[0.03] hover:border-primary/10 hover:shadow-sm transition-all">
                                            <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center">{item.icon}</div>
                                            <div className="text-center"><p className="text-xs font-bold text-secondary">{item.title}</p><p className="text-[9px] text-secondary/40">{item.desc}</p></div>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            }
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-secondary relative p-4 md:p-8 overflow-x-hidden">
            {showConfetti && <Confetti width={width} height={height} recycle={true} numberOfPieces={200} style={{ zIndex: 9999 }} />}

            {/* Warehouse Assignment Modal */}
            <Modal
                isOpen={warehouseModalOpen}
                onClose={() => setWarehouseModalOpen(false)}
                title="إضافة الجهاز للمخزن"
            >
                <div className="space-y-6" dir="rtl">
                    <p className="text-secondary/60 text-sm">
                        سيتم نقل هذا الجهاز إلى ملكية <strong>Laapak</strong> وإضافته للمخزن.
                        يرجى تحديد مصدر الجهاز.
                    </p>
                    <div className="space-y-2 text-right">
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

            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[60%] md:w-[40%] h-[40%] bg-primary/5 rounded-full blur-[80px] md:blur-[120px] animate-pulse" />
                <div className="absolute top-[20%] -right-[10%] w-[50%] md:w-[30%] h-[50%] bg-surface-variant/20 rounded-full blur-[60px] md:blur-[100px]" />
            </div>

            <div className="relative max-w-7xl mx-auto space-y-8 md:space-y-16">
                <header className="text-center">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-secondary leading-[1.1]">
                        تفاصيل <span className="text-primary">التقرير</span>
                    </h1>
                    <p className="text-secondary/40 font-bold mt-2">{report.device_model || ''}</p>
                </header>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
                    {/* Mobile step indicator */}
                    <div className="w-full lg:hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-secondary">{steps.find(s => s.id === activeStep)?.title}</span>
                            <span className="text-xs font-black text-secondary/30 tabular-nums">{activeStep} / {steps.length}</span>
                        </div>
                        <div className="flex gap-1.5">
                            {steps.map(s => (
                                <button key={s.id} onClick={() => setActiveStep(s.id)} className={cn("h-1.5 rounded-full flex-1 transition-all duration-500", activeStep === s.id ? "bg-primary" : "bg-black/[0.06]")} />
                            ))}
                        </div>
                    </div>

                    {/* Desktop sidebar */}
                    <aside className="hidden lg:block lg:w-60 shrink-0 sticky top-24 space-y-2">
                        <p className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.5em] px-4 mb-4">إجراءات الفحص</p>
                        {steps.map(step => {
                            const isActive = activeStep === step.id;
                            return (
                                <button key={step.id} onClick={() => setActiveStep(step.id)}
                                    className={cn("w-full flex items-center gap-5 py-4 px-4 rounded-3xl transition-all duration-300 group relative text-right", isActive ? "bg-white shadow-sm border border-black/[0.03]" : "hover:bg-black/[0.01]")}>
                                    <span className={cn("text-lg font-black transition-colors", isActive ? "text-primary" : "text-secondary/20 group-hover:text-secondary/40")}>
                                        {step.id.toString().padStart(2, '0')}
                                    </span>
                                    <span className={cn("text-sm font-bold flex-1 transition-colors", isActive ? "text-secondary" : "text-secondary/40 group-hover:text-secondary/60")}>
                                        {step.title}
                                    </span>
                                    {isActive && <motion.div layoutId="sidebar-indicator" className="absolute left-4 w-1.5 h-6 bg-primary rounded-full" />}
                                </button>
                            );
                        })}
                    </aside>

                    {/* Main content */}
                    <main className="w-full flex-1 min-w-0 pb-32">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeStep}>
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>

                        {/* Floating bottom nav pill */}
                        <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 p-2 bg-white/90 backdrop-blur-3xl rounded-full border border-black/[0.04] shadow-lg z-50 w-[calc(100%-2rem)] md:w-auto max-w-sm justify-between md:justify-center">
                            {activeStep > 1 && (
                                <Button variant="ghost" className="rounded-full h-11 md:h-12 px-4 md:px-7 font-black hover:bg-black/[0.02] text-sm flex-1 md:flex-initial"
                                    onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}>
                                    <ChevronRight size={16} className="ml-1" />السابق
                                </Button>
                            )}
                            <div className="flex gap-1.5 px-2">
                                {steps.map(s => (
                                    <button key={s.id} onClick={() => setActiveStep(s.id)} className={cn("rounded-full transition-all duration-500", activeStep === s.id ? "bg-primary w-7 h-2.5" : "bg-black/[0.07] hover:bg-black/[0.12] w-2.5 h-2.5")} />
                                ))}
                            </div>
                            <Button className={cn("rounded-full h-11 md:h-12 px-5 md:px-9 font-black shadow-sm text-sm flex-1 md:flex-initial", activeStep === 1 && "flex-1")}
                                onClick={() => { if (activeStep < steps.length) setActiveStep(prev => prev + 1); else router.back(); }}>
                                {activeStep === steps.length ? 'إغلاق' : 'التالي'}{activeStep < steps.length && <ChevronLeft size={15} className="mr-1" />}
                            </Button>
                        </div>
                    </main>
                </div>
            </div>

            <AnimatePresence>
                {/* WhatsApp Share Modal */}
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

            <ImageLightbox
                selectedImage={selectedImage}
                onClose={() => setSelectedImage(null)}
            />

            <PaymentSelectionModal
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                selectedPaymentMethod={selectedPaymentMethod}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
                calculateFinalTotal={calculateFinalTotal}
                handleFinalConfirmation={handleFinalConfirmation}
            />
        </div>
    );
}

// Sub-components and Helper functions

function InternalInspectionSection({ report, onImageClick }: { report: any, onImageClick: (url: string) => void }) {
    let media = [];
    try {
        media = typeof report.external_images === 'string' ? JSON.parse(report.external_images) : (report.external_images || []);
    } catch (e) { }

    const testScreenshots = media.filter((m: any) => m.type === 'test_screenshot');
    
    // Extract technical data from hardware_status
    let hStatus: any[] = [];
    try {
        hStatus = typeof report.hardware_status === 'string' ? JSON.parse(report.hardware_status) : (report.hardware_status || []);
    } catch (e) { }

    // Components we want to show even if no screenshot exists
    const technicalComponents = ['CPU', 'GPU', 'Battery', 'Storage', 'Display'];

    // Combine both: prioritize screenshots, fallback to tech data
    const coreTests = technicalComponents.map(comp => {
        const screenshot = testScreenshots.find((s: any) => (s.component || '').toLowerCase() === comp.toLowerCase());
        const statusItem = hStatus.find((h: any) => h.componentName === comp);

        let techData = null;
        if (statusItem?.comment) {
            try { techData = JSON.parse(statusItem.comment); } catch (e) {}
        }

        return {
            component: comp,
            screenshot: screenshot,
            techData: techData,
            status: statusItem?.status || 'neutral'
        };
    }).filter(t => t.screenshot || t.techData);

    // Also include any screenshots for components not in the predefined list (e.g. Keyboard, DXDiag)
    const extraTests = testScreenshots
        .filter((s: any) => !technicalComponents.some(c => c.toLowerCase() === (s.component || '').toLowerCase()))
        .map((s: any) => ({
            component: s.component || s.name || '',
            screenshot: s,
            techData: null,
            status: 'pass' as const
        }));

    const allTests = [...coreTests, ...extraTests];

    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-black text-secondary pr-3 border-r-4 border-primary">الفحص المتقدم والنتائج التقنية</h3>
            {allTests.length > 0 ? (
                <div className="space-y-3">
                    {allTests.map((item: any, idx: number) => {
                        const isOpen = openIndex === idx;
                        const dotCls = item.status === 'pass' ? 'bg-emerald-500 border-emerald-600/20' : 'bg-blue-500 border-blue-600/20';
                        const badgeLabel = item.status === 'pass' ? 'سليم' : 'متشيك عليه';
                        return (
                            <div key={idx} className={cn("bg-white border rounded-2xl overflow-hidden transition-all duration-300", isOpen ? "border-primary/10 shadow-sm" : "border-black/[0.03] hover:border-black/[0.06] shadow-sm")}>
                                <button onClick={() => setOpenIndex(isOpen ? null : idx)} className="w-full px-5 md:px-6 py-4 md:py-5 flex items-center justify-between group text-right">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", isOpen ? "bg-primary text-white" : "bg-black/[0.02] text-secondary/30 group-hover:bg-primary/5 group-hover:text-primary")}>
                                            {getComponentIcon(item.component)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-secondary text-sm md:text-base">{getComponentTitle(item.component)}</span>
                                            <span className="text-[9px] text-primary/50 font-black uppercase tracking-wider mt-0.5">
                                                {item.screenshot ? 'لقطة شاشة الاختبار' : 'نتائج الفحص البرمجي'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-2.5 h-2.5 rounded-full border shadow-sm shrink-0", dotCls)} title={badgeLabel} />
                                        <ChevronLeft size={18} className={cn("transition-transform duration-300 text-secondary/20", isOpen && "rotate-90 text-primary")} />
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                                            <div className="px-5 md:px-6 pb-7 pt-4 border-t border-black/[0.02]">
                                                {item.screenshot ? (
                                                    <div className="w-full aspect-video md:aspect-[21/9] bg-black/[0.02] rounded-2xl md:rounded-3xl overflow-hidden border border-black/5 cursor-zoom-in group/img relative mb-6" onClick={() => onImageClick(item.screenshot.url)}>
                                                        <img src={item.screenshot.url} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" alt="نتيجة فحص فني متقدم" />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center"><Search className="text-white" size={32} /></div>
                                                    </div>
                                                ) : item.techData ? (
                                                    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {item.component === 'Battery' && (
                                                            <>
                                                                <TechStatCard label="صحة البطارية" value={`${Math.round(item.techData.health)}%`} icon={<Zap size={16} />} color="text-primary" />
                                                                <TechStatCard label="دورات الشحن" value={`${item.techData.cycles}`} icon={<RefreshCw size={16} />} />
                                                                <TechStatCard label="السعة الفعلية" value={`${Math.round(item.techData.full / 1000)} Wh`} icon={<Battery size={16} />} />
                                                            </>
                                                        )}
                                                        {item.component === 'CPU' && (
                                                            <>
                                                                <TechStatCard label="عدد الأنوية" value={`${item.techData.cores}`} icon={<Cpu size={16} />} color="text-primary" />
                                                                <TechStatCard label="درجة الحرارة" value={`${item.techData.temp}°C`} icon={<Thermometer size={16} />} />
                                                                <TechStatCard label="L3 Cache" value={`${item.techData.cache} MB`} icon={<Database size={16} />} />
                                                            </>
                                                        )}
                                                        {item.component === 'Storage' && item.techData.devices?.[0] && (
                                                            <>
                                                                <TechStatCard label="حالة الهارد" value={`${item.techData.devices[0].health}%`} icon={<ShieldCheck size={16} />} color="text-green-600" />
                                                                <TechStatCard label="المساحة" value={`${Math.round(item.techData.devices[0].size)} GB`} icon={<HardDrive size={16} />} />
                                                                <TechStatCard label="النوع" value={item.techData.devices[0].type} icon={<Zap size={16} />} />
                                                            </>
                                                        )}
                                                        {item.component === 'Display' && (
                                                            <>
                                                                <TechStatCard label="دقة الشاشة" value={`${item.techData.width}×${item.techData.height}`} icon={<MonitorIcon size={16} />} color="text-primary" />
                                                                <TechStatCard label="معدل التحديث" value={`${item.techData.refresh_rate}Hz`} icon={<Zap size={16} />} />
                                                                <TechStatCard label="فحص الألوان" value="سليم 100%" icon={<CheckCircle2 size={16} />} color="text-green-600" />
                                                            </>
                                                        )}
                                                        {item.component === 'GPU' && item.techData.devices?.[0] && (
                                                            <>
                                                                <TechStatCard label="كارت الشاشة" value={item.techData.devices[0].name} icon={<MonitorIcon size={16} />} color="text-primary" />
                                                                <TechStatCard label="VRAM" value={`${item.techData.devices[0].vram} MB`} icon={<Zap size={16} />} />
                                                                <TechStatCard label="الشركة" value={item.techData.devices[0].vendor} icon={<CheckCircle2 size={16} />} />
                                                            </>
                                                        )}
                                                    </div>
                                                ) : null}
                                                
                                                <div className="space-y-4 md:space-y-6">
                                                    <div className="p-4 md:p-5 rounded-2xl bg-black/[0.02] border border-black/[0.02]">
                                                        <h5 className="text-[10px] font-black text-secondary/30 uppercase tracking-widest mb-2">شرح تفصيلي</h5>
                                                        <p className="text-secondary/60 text-sm leading-relaxed font-medium">
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
                <div className="py-12 text-center border-2 border-dashed border-black/[0.03] rounded-3xl opacity-40"><ImageIcon className="mx-auto mb-4 text-secondary/20" size={48} /><p className="text-sm font-black text-secondary/40">مفيش أي صور أو فحوصات تقنية اتسجلت لسه</p></div>
            )}
        </div>
    );
}

function TechStatCard({ label, value, icon, color }: { label: string, value: string, icon: any, color?: string }) {
    return (
        <div className="p-4 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center gap-4">
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
    if (comp.includes('cpu')) return 'ده Stress Test للبروسيسور، بنضغط عليه جامد عشان نتأكد إنه شغال بكفاءة 100% ومش بيهنج ولا بيسخن تحت الضغط الكبير.';
    if (comp.includes('gpu')) return 'استخدمنا FurMark وعملنا stress test لكارت الشاشة بتاعك، يعني دوسنا عليه لأقصى درجة عشان نطمن إنه شغال كويس وحرارته مظبوطة طبيعي.';
    if (comp.includes('battery')) return 'دي صورة من إعدادات الـ BIOS بتبين لك حالة البطارية من جوة. هدفنا نضمنلك إن البطارية صحتها كويسة وشغالة تمام.';
    if (comp.includes('hdd') || comp.includes('ssd') || comp.includes('storage')) return 'ببرنامج Hard Disk Sentinel كشفنا على الهارد بتاعك، وبيقولنا بالظبط حالته إيه ولو في أي باد سيكتور أو مشكلة ف الأداء مسجلينها.';
    if (comp.includes('keyboard')) return 'اختبرنا كل زراير الكيبورد واحد واحد عشان نتأكد إن مفيش زرار معلق وإنه بيستجيب تمام معاك.';
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
            <h3 className="text-base font-black text-secondary flex items-center gap-3 mb-6">
                <RefreshCw size={18} className="text-primary/50" />
                تاريخ التحديثات
            </h3>
            <div className="space-y-4">
                {sortedHistory.map((entry, i) => (
                    <div key={i} className="relative flex gap-4 pb-4 last:pb-0 group">
                        {i !== sortedHistory.length - 1 && (
                            <div className="absolute top-8 bottom-0 right-3.5 w-px bg-black/[0.03] group-hover:bg-primary/20 transition-colors" />
                        )}
                        <div className="w-7 h-7 shrink-0 rounded-full bg-white border border-black/[0.03] flex items-center justify-center text-secondary/30 group-hover:text-primary group-hover:border-primary/20 transition-all z-10 shadow-sm">
                            <RefreshCw size={12} />
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-secondary/40">
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
                                    <span className="text-[9px] font-bold text-secondary/30 bg-black/[0.02] px-2 py-0.5 rounded-full">
                                        {entry.status_at_update}
                                    </span>
                                )}
                            </div>
                            <div className="text-sm font-medium text-secondary/70 leading-relaxed bg-black/[0.02] p-3.5 rounded-2xl border border-black/[0.02] group-hover:border-primary/10 group-hover:bg-white transition-all">
                                {entry.description}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
