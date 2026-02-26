'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
    Smartphone,
    User,
    Hash,
    Calendar,
    Cpu,
    Monitor,
    Database,
    HardDrive,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Plus,
    Minus,
    Camera,
    Video,
    FileText,
    ChevronRight,
    ChevronLeft,
    Save,
    Receipt,
    Check,
    Image as ImageIcon,
    Clock,
    CreditCard,
    ShoppingCart,
    Filter,
    PlusCircle,
    Package,
    ArrowRight,
    Search,
    Zap,
    Keyboard as KeyboardIcon,
    MousePointer2,
    Wifi,
    Usb,
    Bluetooth,
    Link2,
    Trash2,
    SquareCheck
} from 'lucide-react';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell
} from '@/components/ui/Table';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { ClientModal } from '@/components/clients/ClientModal';
import { SupplierModal } from '@/components/suppliers/SupplierModal';

interface ReportFormProps {
    locale: string;
    reportId?: string;
}

export default function ReportForm({ locale, reportId }: ReportFormProps) {
    const t = useTranslations('dashboard.reports');
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [showClientResults, setShowClientResults] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [step, setStep] = useState(1);

    const [quickSpecs, setQuickSpecs] = useState({
        cpu: ['Core i9', 'Core i7', 'Core i5', 'Ryzen 9', 'Ryzen 7', 'Apple M3 Pro', 'Apple M2 Pro'],
        gpu: ['RTX 4090', 'RTX 4070', 'RTX 3060', '8-Core GPU', '10-Core GPU', 'Iris Xe'],
        ram: ['64GB', '32GB', '16GB', '8GB', '4GB'],
        storage: ['2TB SSD', '1TB SSD', '512GB SSD', '256GB SSD', '1TB HDD']
    });

    const [formData, setFormData] = useState({
        client_id: '',
        client_name: '',
        client_phone: '',
        client_address: '',
        device_model: '',
        serial_number: '',
        device_price: '',
        cpu: '',
        gpu: '',
        ram: '',
        storage: '',
        display_size: '',
        battery_capacity: '',
        inspection_date: new Date().toISOString().split('T')[0],
        order_number: `RP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        hardware_status: [
            { id: 1, componentName: 'CPU', nameAr: 'المعالج (CPU)', status: 'pass', comment: '' },
            { id: 2, componentName: 'GPU', nameAr: 'معالج الرسوميات (GPU)', status: 'pass', comment: '' },
            { id: 3, componentName: 'Battery', nameAr: 'البطارية (Battery)', status: 'pass', comment: '' },
            { id: 4, componentName: 'Storage', nameAr: 'وحدات التخزين (Disk)', status: 'pass', comment: '' },
            { id: 5, componentName: 'Keyboard', nameAr: 'لوحة المفاتيح (Keyboard)', status: 'pass', comment: '' },
            { id: 6, componentName: 'Display', nameAr: 'الشاشة (Screen)', status: 'pass', comment: '' },
            { id: 7, componentName: 'Touchpad', nameAr: 'لوحة اللمس (Touchpad)', status: 'pass', comment: '' },
            { id: 8, componentName: 'Wifi', nameAr: 'الواي فاي (WiFi)', status: 'pass', comment: '' },
            { id: 9, componentName: 'Bluetooth', nameAr: 'البلوتوث (Bluetooth)', status: 'pass', comment: '' },
            { id: 10, componentName: 'Ports', nameAr: 'المنافذ (Ports)', status: 'pass', comment: '' },
        ] as any[],
        test_screenshots: [
            { component: 'Info', url: '', comment: '', type: 'test_screenshot' },
            { component: 'CPU', url: '', comment: '', type: 'test_screenshot' },
            { component: 'GPU', url: '', comment: '', type: 'test_screenshot' },
            { component: 'Storage', url: '', comment: '', type: 'test_screenshot' },
            { component: 'Keyboard', url: '', comment: '', type: 'test_screenshot' },
            { component: 'Battery', url: '', comment: '', type: 'test_screenshot' },
            { component: 'DxDiag', url: '', comment: '', type: 'test_screenshot' }
        ] as any[],
        external_images: [] as any[],
        youtube_url: '',
        notes: '',
        device_source: '',
        supplier_id: '' as string | number,
        billing_enabled: false,
        amount: '0',
        tax_rate: '0',
        discount: '0',
        invoice_items: [] as { name: string, price: string }[],
        status: 'pending',
        invoice_id: null as string | null,
        update_description: ''
    });

    const searchParams = useSearchParams();
    const isUpdateMode = searchParams.get('mode') === 'update';
    const totalSteps = isUpdateMode ? 6 : 5;

    const [imageInput, setImageInput] = useState('');
    const [videoInput, setVideoInput] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Clients
                const clientsRes = await api.get('/clients');
                setClients(clientsRes.data.clients || []);

                // Fetch Suppliers
                const suppliersRes = await api.get('/suppliers');
                const loadedSuppliers = suppliersRes.data.data || [];
                setSuppliers(loadedSuppliers);

                // Fetch Frequent Specs
                const specsRes = await api.get('/reports/stats/frequent-specs');
                if (specsRes.data) {
                    setQuickSpecs(prev => ({
                        cpu: Array.from(new Set([...prev.cpu, ...(specsRes.data.cpu || [])])),
                        gpu: Array.from(new Set([...prev.gpu, ...(specsRes.data.gpu || [])])),
                        ram: Array.from(new Set([...prev.ram, ...(specsRes.data.ram || [])])),
                        storage: Array.from(new Set([...prev.storage, ...(specsRes.data.storage || [])])),
                    }));
                }

                // If edit mode, fetch report data
                if (reportId) {
                    setIsLoading(true);
                    const reportRes = await api.get(`/reports/${reportId}`);
                    const r = reportRes.data.report;

                    // Parse JSON fields
                    const hardwareStatus = typeof r.hardware_status === 'string' ? JSON.parse(r.hardware_status) : (r.hardware_status || []);
                    const allMedia = typeof r.external_images === 'string' ? JSON.parse(r.external_images) : (r.external_images || []);
                    const invoiceItems = typeof r.invoice_items === 'string' ? JSON.parse(r.invoice_items) : (r.invoice_items || []);

                    const screenshots = allMedia.filter((m: any) => m.type === 'test_screenshot');
                    const externalImgs = allMedia.filter((m: any) => m.type === 'image' || m.type === 'video' || m.type === 'youtube');

                    setFormData({
                        client_id: r.client_id || '',
                        client_name: r.client_name || '',
                        client_phone: r.client_phone || '',
                        client_address: r.client_address || '',
                        device_model: r.device_model || '',
                        serial_number: r.serial_number || '',
                        device_price: r.device_price || r.amount || '0',
                        cpu: r.cpu || '',
                        gpu: r.gpu || '',
                        ram: r.ram || '',
                        storage: r.storage || '',
                        display_size: r.display_size || '',
                        battery_capacity: r.battery_capacity || '',
                        inspection_date: new Date(r.inspection_date || r.created_at).toISOString().split('T')[0],
                        order_number: r.order_number || '',
                        hardware_status: hardwareStatus.length ? hardwareStatus : formData.hardware_status,
                        test_screenshots: screenshots.length ? screenshots : formData.test_screenshots,
                        device_source: r.device_source || (r.supplier_id ? loadedSuppliers.find((s: any) => s.id === r.supplier_id)?.name || '' : ''),
                        supplier_id: r.supplier_id || '',
                        external_images: externalImgs,
                        youtube_url: '',
                        notes: r.notes || '',
                        billing_enabled: invoiceItems.length > 0 || Number(r.amount) > 0,
                        amount: r.amount || '0',
                        tax_rate: r.tax_rate || '0',
                        discount: r.discount || '0',
                        invoice_items: invoiceItems,
                        status: r.status || 'pending',
                        invoice_id: r.invoice_id || null
                    });
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
                if (reportId) alert('فشل في تحميل بيانات التقرير');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [reportId]);

    const handleClientSelect = (client: any) => {
        setFormData(prev => ({
            ...prev,
            client_id: client.id,
            client_name: client.name,
            client_phone: client.phone,
            client_address: client.address || '',
            device_source: ''
        }));
        setShowClientResults(false);
    };

    const handleSupplierSelect = (supplier: any) => {
        setFormData(prev => ({
            ...prev,
            supplier_id: supplier.id,
            device_source: supplier.name
        }));
    };


    const handleDeviceImageAdd = () => {
        if (imageInput) {
            setFormData(prev => ({
                ...prev,
                external_images: [...prev.external_images, { url: imageInput, type: 'image' }]
            }));
            setImageInput('');
        }
    };

    const handleVideoAdd = () => {
        if (videoInput) {
            let type = 'video';
            if (videoInput.includes('youtube') || videoInput.includes('youtu.be')) type = 'youtube';
            setFormData(prev => ({
                ...prev,
                external_images: [...prev.external_images, { url: videoInput, type: type }]
            }));
            setVideoInput('');
        }
    };

    const handleInvoiceItemAdd = () => {
        setFormData(prev => ({ ...prev, invoice_items: [...prev.invoice_items, { name: '', price: '0' }] }));
    };

    const handleInvoiceItemRemove = (index: number) => {
        setFormData(prev => ({ ...prev, invoice_items: prev.invoice_items.filter((_, i) => i !== index) }));
    };

    const handleInvoiceItemChange = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newItems = [...prev.invoice_items];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, invoice_items: newItems };
        });
    };

    const getComponentIcon = (name: string) => {
        switch (name?.toLowerCase()) {
            case 'cpu': return <Cpu size={18} />;
            case 'gpu': return <Monitor size={18} />;
            case 'battery': return <Zap size={18} />;
            case 'storage': return <HardDrive size={18} />;
            case 'keyboard': return <KeyboardIcon size={18} />;
            case 'screen': case 'display': return <Monitor size={18} />;
            case 'touchpad': return <MousePointer2 size={18} />;
            case 'wifi': return <Wifi size={18} />;
            case 'bluetooth': return <Bluetooth size={18} />;
            case 'ports': return <Usb size={18} />;
            default: return <ShieldCheck size={18} />;
        }
    };

    const getComponentTitle = (name: string) => {
        switch (name?.toLowerCase()) {
            case 'cpu': return 'المعالج (CPU)';
            case 'gpu': return 'معالج الرسوميات (GPU)';
            case 'battery': return 'البطارية (Battery)';
            case 'storage': return 'وحدات التخزين (Disk)';
            case 'display': return 'الشاشة (Display)';
            case 'dxdiag': return 'مواصفات النظام (DxDiag)';
            case 'info': return 'بيانات الجهاز (Info)';
            default: return name;
        }
    };

    const handleHardwareStatusChange = (index: number, status: string, comment?: string) => {
        setFormData(prev => ({
            ...prev,
            hardware_status: prev.hardware_status.map((item, i) =>
                i === index ? { ...item, status, ...(comment !== undefined ? { comment } : {}) } : item
            )
        }));
    };

    const handleTestScreenshotAdd = (component: string, url: string) => {
        setFormData(prev => ({
            ...prev,
            test_screenshots: prev.test_screenshots.map(s => s.component === component ? { ...s, url } : s)
        }));
    };

    const handleTestScreenshotComment = (component: string, comment: string) => {
        setFormData(prev => ({
            ...prev,
            test_screenshots: prev.test_screenshots.map(s => s.component === component ? { ...s, comment } : s)
        }));
    };

    const isDirectImageLink = (url: string) => {
        if (!url) return true;
        const isImageExt = /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?.*)?$/i.test(url);
        const isViewerSite = /ibb\.co|prnt\.sc|imgur\.com\/[a-zA-Z0-9]+$/i.test(url) && !isImageExt;
        return !isViewerSite;
    };

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleNextStep = () => {
        if (step === 1) {
            const requiredFields = {
                client_name: 'اسم العميل / رقم الهاتف',
                device_model: 'اسم الجهاز',
                serial_number: 'الرقم التسلسلي (S/N)',
                device_source: 'المورد / مصدر الجهاز'
            };

            const missing = Object.entries(requiredFields)
                .filter(([key, _]) => !formData[key as keyof typeof formData])
                .map(([_, label]) => label);

            if (missing.length > 0) {
                alert(`يرجى ملء الحقول الإلزامية التالية للاستمرار:\n\n${missing.join('\n')}`);
                return;
            }
        }
        setStep(step + 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step !== totalSteps) return;

        const requiredFields = {
            client_name: 'اسم العميل',
            client_phone: 'رقم الهاتف',
            device_model: 'موديل الجهاز',
            order_number: 'رقم الطلب'
        };

        const missing = Object.entries(requiredFields)
            .filter(([key, _]) => !formData[key as keyof typeof formData])
            .map(([_, label]) => label);

        if (missing.length > 0) {
            alert(`يرجى ملء الحقول الإلزامية التالية: ${missing.join('، ')}`);
            return;
        }

        setIsLoading(true);
        try {
            // Report Data Construction
            const reportData = {
                ...formData,
                notes: formData.device_source && !formData.notes.includes('SOURCE:')
                    ? `SOURCE: ${formData.device_source}\n${formData.notes}`
                    : formData.notes,
                inspection_date: new Date(formData.inspection_date),
                hardware_status: JSON.stringify(formData.hardware_status),
                external_images: JSON.stringify([
                    ...formData.external_images,
                    ...formData.test_screenshots.filter(s => s.url)
                ]),
                invoice_items: JSON.stringify(formData.invoice_items),
                update_description: isUpdateMode ? formData.update_description : undefined
            };

            let reportId_final = reportId;
            if (reportId) {
                await api.put(`/reports/${reportId}`, reportData);
            } else {
                const res = await api.post('/reports', reportData);
                reportId_final = res.data.id;
            }

            // Simple Success Alert
            alert(reportId ? 'تم تحديث التقرير بنجاح' : 'تم حفظ التقرير بنجاح');
            router.push('/dashboard/admin/reports');
        } catch (error: any) {
            console.error('Failed to submit report:', error);
            alert('فشل في حفظ التقرير');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && reportId && step === 1 && !formData.client_name) {
        return <div className="p-12 text-center font-bold text-secondary">جاري تحميل بيانات التقرير...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header with Steps Indicator */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="w-10 h-10 p-0 rounded-full">
                        <ChevronRight size={22} className={cn(locale === 'ar' ? "" : "rotate-180")} />
                    </Button>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {isUpdateMode ? 'تحديث التقرير (History)' : (reportId ? 'تعديل التقرير' : 'إنشاء تقرير فحص')}
                        </h1>
                        <p className="text-secondary font-medium">خطوة {step} من {totalSteps}: {
                            step === 1 ? 'البيانات والمواصفات' :
                                step === 2 ? 'الاختبارات التقنية' :
                                    step === 3 ? 'لقطات شاشة الاختبار' :
                                        step === 4 ? 'المعاينة الخارجية' :
                                            step === 5 ? (isUpdateMode ? 'الفاتورة' : 'الفاتورة والحفظ') : 'وصف التعديل'
                        }</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
                        <div key={s} className={cn(
                            "w-8 h-2 rounded-full transition-all duration-300",
                            s === step ? "bg-primary w-12" : s < step ? "bg-primary/40" : "bg-black/5"
                        )} />
                    ))}
                </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card variant="glass" className="overflow-hidden border-primary/10">
                            <CardHeader className="p-8 pb-4 border-b border-black/[0.03] bg-primary/[0.01]">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl font-black text-secondary flex items-center gap-2">
                                            <User size={26} className="text-primary" />
                                            التفاصيل الاساسية
                                        </CardTitle>
                                        <p className="text-xs text-secondary/40 font-bold uppercase tracking-widest px-1">أدخل بيانات العميل وهوية الجهاز والمواصفات الأساسية</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsClientModalOpen(true)}
                                        className="rounded-full h-10 px-6 border-primary/20 text-primary hover:bg-primary/5"
                                        icon={<Plus size={16} />}
                                    >
                                        إضافة عميل جديد
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12 gap-y-6">
                                    <div className="relative z-50 space-y-2">
                                        <label className="text-[10px] font-black text-secondary/40 uppercase px-4 tracking-tighter">البحث عن عميل</label>
                                        <div className="relative">
                                            <Input
                                                name="client_name"
                                                placeholder="اسم العميل أو الهاتف..."
                                                icon={<Search size={20} />}
                                                value={formData.client_name}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormData(prev => ({ ...prev, client_name: val }));
                                                    setShowClientResults(true);
                                                }}
                                                onFocus={() => setShowClientResults(true)}
                                                className="rounded-[1.5rem] bg-black/[0.02] border-transparent h-14"
                                            />
                                            {showClientResults && (formData.client_name || clients.length > 0) && (
                                                <div className="absolute z-50 w-full mt-2 bg-white border border-black/5 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                                    <div className="max-h-64 overflow-y-auto no-scrollbar">
                                                        {clients
                                                            .filter(c =>
                                                                c.name.toLowerCase().includes(formData.client_name.toLowerCase()) ||
                                                                c.phone.includes(formData.client_name)
                                                            )
                                                            .slice(0, 5)
                                                            .map(client => (
                                                                <div
                                                                    key={client.id}
                                                                    className="px-6 py-4 hover:bg-primary/5 cursor-pointer border-b border-black/5 last:border-0 flex justify-between items-center transition-colors"
                                                                    onClick={() => handleClientSelect(client)}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-sm">{client.name}</span>
                                                                        <span className="text-[10px] text-secondary/40 font-mono tracking-tighter">{client.phone}</span>
                                                                    </div>
                                                                    <ArrowRight size={14} className="text-primary/20" />
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-secondary/40 uppercase px-4 tracking-tighter">رقم الموبايل</label>
                                            <Input
                                                name="client_phone"
                                                placeholder="رقم الموبايل"
                                                icon={<Smartphone size={18} />}
                                                value={formData.client_phone}
                                                onChange={handleChange}
                                                className="rounded-[1.5rem] bg-black/[0.02] border-transparent h-14"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-secondary/40 uppercase px-4 tracking-tighter">رقم التقرير</label>
                                            <Input
                                                name="order_number"
                                                icon={<Hash size={18} />}
                                                value={formData.order_number}
                                                onChange={handleChange}
                                                className="rounded-[1.5rem] bg-black/[0.02] border-transparent h-14 font-mono text-primary font-black text-lg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-black/[0.03]">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-secondary/40 uppercase px-4 tracking-tighter">اسم الجهاز (Device Name)</label>
                                        <Input
                                            name="device_model"
                                            placeholder="HP xxxxx X7"
                                            icon={<Monitor size={18} />}
                                            value={formData.device_model}
                                            onChange={handleChange}
                                            className="rounded-[1.5rem] bg-black/[0.02] border-transparent h-14 font-bold"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-secondary/40 uppercase px-4 tracking-tighter">الرقم التسلسلي (S/N)</label>
                                        <Input
                                            name="serial_number"
                                            placeholder="S/N Number"
                                            icon={<Hash size={18} />}
                                            value={formData.serial_number}
                                            onChange={handleChange}
                                            className="rounded-[1.5rem] bg-black/[0.02] border-transparent h-14"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-secondary/40 uppercase px-4 tracking-tighter">تاريخ الفحص</label>
                                        <Input
                                            name="inspection_date"
                                            type="date"
                                            icon={<Calendar size={18} />}
                                            value={formData.inspection_date}
                                            onChange={handleChange}
                                            className="rounded-[1.5rem] bg-black/[0.02] border-transparent h-14"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-black/[0.03] space-y-8">
                                    <div className="flex flex-col items-center gap-2">
                                        <h6 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] opacity-30">Technical Specifications</h6>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
                                        {(['cpu', 'gpu', 'ram', 'storage'] as const).map((field) => (
                                            <div key={field} className="space-y-4 group">
                                                <Input
                                                    name={field}
                                                    label={field.toUpperCase()}
                                                    placeholder={field.toUpperCase() + "..."}
                                                    icon={field === 'cpu' ? <Cpu size={18} /> : field === 'gpu' ? <Monitor size={18} /> : field === 'ram' ? <Database size={18} /> : <HardDrive size={18} />}
                                                    value={(formData as any)[field]}
                                                    onChange={handleChange}
                                                    className="rounded-2xl bg-black/[0.02] border-transparent group-hover:bg-white group-hover:border-primary/20 h-12 transition-all"
                                                />
                                                <div className="space-y-2 px-1">
                                                    <span className="text-[9px] font-black text-secondary/20 uppercase tracking-[0.2em]">المقترحات</span>
                                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mask-fade-edges">
                                                        {(quickSpecs as any)[field].map((val: string) => (
                                                            <button
                                                                key={val}
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, [field]: val }))}
                                                                className={cn(
                                                                    "group/btn flex items-center gap-1.5 px-4 py-2 rounded-full border transition-all shrink-0",
                                                                    (formData as any)[field] === val
                                                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                                                        : "bg-white text-secondary/60 border-black/5 hover:border-primary/20 hover:text-primary hover:shadow-md hover:shadow-primary/5"
                                                                )}
                                                            >
                                                                <Plus size={10} className={cn(
                                                                    "transition-colors",
                                                                    (formData as any)[field] === val ? "text-white" : "text-primary/40 group-hover/btn:text-primary"
                                                                )} />
                                                                <span className="text-[11px] font-bold uppercase tracking-tight">{val}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-black/[0.03] flex flex-col md:flex-row items-stretch md:items-center justify-center gap-6">
                                    <div className="w-full max-w-md mx-auto space-y-2">
                                        <label className="text-[10px] font-black text-secondary/40 uppercase px-4 text-center block">سعر البيع (Selling Price)</label>
                                        <Input
                                            name="amount"
                                            type="number"
                                            placeholder="أدخل سعر البيع للعميل..."
                                            icon={<CreditCard size={18} />}
                                            value={formData.amount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                            className="rounded-full bg-black/[0.02] border-transparent h-12 text-center font-black text-primary"
                                            required
                                        />
                                    </div>
                                    <div className="w-full max-w-md mx-auto space-y-2 animate-in slide-in-from-right-2">
                                        <div className="flex items-center justify-between px-4">
                                            <label className="text-[10px] font-black text-primary uppercase block">المورد (Supplier)</label>
                                            <button
                                                type="button"
                                                onClick={() => setIsSupplierModalOpen(true)}
                                                className="text-[10px] font-black text-secondary/40 hover:text-primary transition-colors flex items-center gap-1"
                                            >
                                                <Plus size={10} />
                                                إضافة جديد
                                            </button>
                                        </div>
                                        <select
                                            name="supplier_id"
                                            value={formData.supplier_id || ''}
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                const supplier = suppliers.find(s => s.id.toString() === id);
                                                if (supplier) {
                                                    handleSupplierSelect(supplier);
                                                } else {
                                                    setFormData(p => ({ ...p, supplier_id: '', device_source: '' }));
                                                }
                                            }}
                                            className="w-full rounded-full bg-primary/[0.03] border border-primary/20 h-12 px-4 text-center font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="">-- الجرد الداخلي --</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {step === 2 && (
                    <Card variant="glass" className="overflow-hidden border-black/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader className="p-8 pb-4 border-b border-black/[0.03]">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <ShieldCheck size={22} className="text-primary" />
                                حالة الهاردوير التقنية
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-black/[0.01]">
                                    <TableRow className="border-black/5 hover:bg-transparent">
                                        <TableHead className="text-right font-black uppercase tracking-widest text-[10px] py-4 pr-10">القطعة</TableHead>
                                        <TableHead className="text-center font-black uppercase tracking-widest text-[10px] py-4 px-10">الحالة</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formData.hardware_status.map((item, index) => (
                                        <TableRow key={`${item.id}-${index}`} className="border-black/[0.03] transition-colors group">
                                            <TableCell className="pr-10 font-bold text-secondary py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-black/[0.03] flex items-center justify-center text-secondary/40 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                                        {getComponentIcon(item.name || item.componentName)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-base group-hover:translate-x-1 transition-transform">{item.nameAr || item.componentName}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-10">
                                                <div className="flex items-center justify-center gap-6">
                                                    {[
                                                        { id: 'pass', label: 'سليم', color: 'bg-green-500', shadow: 'shadow-green-500/40' },
                                                        { id: 'none', label: 'غير موجود', color: 'bg-red-500', shadow: 'shadow-red-500/40' },
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => handleHardwareStatusChange(index, opt.id)}
                                                            className="group/btn flex flex-col items-center gap-2 outline-none p-1"
                                                        >
                                                            <div className={cn(
                                                                "w-6 h-6 rounded-full border-2 transition-all duration-300 relative",
                                                                item.status === opt.id
                                                                    ? `${opt.color} border-transparent ${opt.shadow} shadow-lg scale-110`
                                                                    : "border-black/5 bg-transparent hover:border-black/20"
                                                            )}>
                                                                {item.status === opt.id && (
                                                                    <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-20" />
                                                                )}
                                                            </div>
                                                            <span className={cn(
                                                                "text-[8px] font-black uppercase tracking-tighter transition-all",
                                                                item.status === opt.id ? opt.color.replace('bg-', 'text-') : "text-secondary/20"
                                                            )}>{opt.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex flex-col items-center text-center mb-8">
                            <h2 className="text-2xl font-black text-secondary flex items-center gap-2">
                                <Camera size={24} className="text-primary" />
                                فحوصات المكونات (Screenshots)
                            </h2>
                        </div>
                        <div className="space-y-4 max-w-3xl mx-auto pb-10">
                            {formData.test_screenshots.map((s, idx) => (
                                <div key={idx} className="bg-white border border-black/5 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all group">
                                    <div className="bg-primary/5 p-4 border-b border-black/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-primary">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                {getComponentIcon(s.component)}
                                            </div>
                                            <h5 className="font-black text-sm">{getComponentTitle(s.component)}</h5>
                                        </div>
                                        {s.url && (
                                            <Badge variant="secondary" className="bg-green-500 text-white border-transparent py-1 animate-in zoom-in">تم إرفاق النتيجة</Badge>
                                        )}
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-secondary/40 uppercase px-1">رابط صورة نتيجة الاختبار</label>
                                            <Input
                                                placeholder="https://example.com/image.jpg"
                                                value={s.url || ''}
                                                onChange={(e) => handleTestScreenshotAdd(s.component, e.target.value)}
                                                className={cn(
                                                    "rounded-full bg-black/[0.02] border-transparent h-11 text-xs",
                                                    s.url && !isDirectImageLink(s.url) && "border-amber-400/50 bg-amber-50/50"
                                                )}
                                                icon={<Link2 size={16} />}
                                            />
                                        </div>
                                        {s.url && (
                                            <div className="relative aspect-video rounded-2xl overflow-hidden group/img animate-in fade-in zoom-in duration-300 bg-black/5">
                                                <img src={s.url} className="w-full h-full object-contain" alt={s.component} />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <Button variant="destructive" size="sm" className="rounded-full h-9 text-[10px]" onClick={() => handleTestScreenshotAdd(s.component, '')}>
                                                        <Trash2 size={14} className="ml-1" /> حذف الصورة
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-black/5">
                                            <label className="text-[10px] font-black text-secondary/40 uppercase px-1">ملاحظات فنية على الاختبار</label>
                                            <Input
                                                placeholder="اكتب أي ملاحظة فنية هنا..."
                                                value={s.comment || ''}
                                                onChange={(e) => handleTestScreenshotComment(s.component, e.target.value)}
                                                className="rounded-full h-11 text-xs bg-black/[0.02] border-transparent mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <Card variant="glass" className="overflow-hidden">
                            <CardHeader className="p-8 pb-4 border-b border-black/[0.03]">
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    <ImageIcon size={22} className="text-primary" />
                                    المعاينة الخارجية
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row items-center gap-4 bg-black/[0.01] p-2 pr-6 rounded-full border border-black/5">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <h4 className="text-[11px] font-black text-secondary/60 uppercase tracking-widest flex items-center gap-2">
                                                <ImageIcon size={14} />
                                                صور الجهاز
                                            </h4>
                                        </div>
                                        <div className="flex flex-1 gap-2 w-full">
                                            <Input
                                                id="device-image-url-input"
                                                placeholder="رابط الصورة..."
                                                value={imageInput}
                                                onChange={(e) => setImageInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleDeviceImageAdd();
                                                    }
                                                }}
                                                className="rounded-full border-transparent bg-white h-11 text-xs flex-1 focus:border-primary/20 transition-all font-medium"
                                                icon={<Link2 size={14} />}
                                            />
                                            <Button type="button" onClick={handleDeviceImageAdd} className="rounded-full h-11 px-6 shadow-md shadow-primary/10 text-xs font-bold" icon={<Plus size={16} />}>إضافة</Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {formData.external_images.filter(img => img.type === 'image' && img.url).map((img, i) => (
                                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group/img border border-black/5 bg-black/5 animate-in zoom-in duration-300">
                                                <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button type="button" onClick={() => setFormData(p => ({ ...p, external_images: p.external_images.filter(item => item !== img) }))} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-black/[0.03] space-y-6">
                                    <div className="flex flex-col md:flex-row items-center gap-4 bg-black/[0.01] p-2 pr-6 rounded-full border border-black/5">
                                        <div className="flex items-center gap-2 shrink-0">
                                            <h4 className="text-[11px] font-black text-secondary/60 uppercase tracking-widest flex items-center gap-2">
                                                <Video size={14} />
                                                فيديو الفحص
                                            </h4>
                                        </div>
                                        <div className="flex flex-1 gap-2 w-full">
                                            <Input
                                                id="video-url-input"
                                                placeholder="رابط يوتيوب أو فيديو..."
                                                value={videoInput}
                                                onChange={(e) => setVideoInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleVideoAdd();
                                                    }
                                                }}
                                                className="rounded-full border-transparent bg-white h-11 text-xs flex-1 focus:border-primary/20 transition-all font-medium"
                                                icon={<Link2 size={14} />}
                                            />
                                            <Button type="button" onClick={handleVideoAdd} variant="outline" className="rounded-full h-11 px-6 border-primary/20 text-primary hover:bg-primary/5 text-xs font-bold" icon={<Plus size={16} />}>إضافة</Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {formData.external_images.filter(img => img.type === 'video' || img.type === 'youtube').map((v, i) => (
                                            <div key={i} className="relative aspect-video rounded-3xl overflow-hidden group/vid border border-black/5 bg-black/[0.02] flex flex-col items-center justify-center transition-all hover:bg-white hover:shadow-xl hover:shadow-primary/5">
                                                <Video size={28} className="text-primary/20 group-hover/vid:text-primary transition-colors mb-2" />
                                                <span className="text-[9px] font-black text-secondary/40 truncate w-full px-6 text-center uppercase tracking-tighter">{v.url}</span>
                                                <button type="button" onClick={() => setFormData(p => ({ ...p, external_images: p.external_images.filter(item => item !== v) }))} className="absolute top-3 left-3 w-8 h-8 rounded-full bg-red-50 text-red-500 opacity-0 group-hover/vid:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500 hover:text-white"><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {step === 5 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-8">
                        <Card variant="glass" className="overflow-hidden border-primary/10">
                            <CardHeader className="p-8 border-b border-black/5 bg-primary/[0.02] flex flex-row items-center justify-between">
                                <CardTitle className="text-xl font-black flex items-center gap-2 text-primary">
                                    <Receipt size={24} />
                                    بيانات الفاتورة والاعتماد
                                </CardTitle>
                                <div className="flex items-center gap-3">
                                    {formData.billing_enabled && reportId && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={formData.invoice_id ? "outline" : "primary"} // Use string literal "default" if "primary" is not a valid variant, checking Button component usage, usually "default" or "primary" is fine but "default" is safer if "primary" is custom. Wait, previous code uses className for color. Let's stick to standard variants or className
                                            onClick={() => {
                                                if (formData.invoice_id) {
                                                    router.push(`/dashboard/admin/invoices/${formData.invoice_id}/edit`);
                                                } else {
                                                    // Save first then redirect to ensure data is consistent?
                                                    // For now direct redirect as per plan.
                                                    router.push(`/dashboard/admin/invoices/new?reportIds=${reportId}`);
                                                }
                                            }}
                                            className={cn(
                                                "rounded-full h-9 px-4 text-xs font-bold animate-in zoom-in",
                                                formData.invoice_id
                                                    ? "border-primary/20 text-primary hover:bg-primary/5"
                                                    : "bg-primary text-white shadow-md shadow-primary/20"
                                            )}
                                        >
                                            {formData.invoice_id ? 'عرض الفاتورة' : 'إنشاء فاتورة'}
                                        </Button>
                                    )}
                                    <div className="flex items-center gap-3 bg-white/50 p-2 px-4 rounded-full border border-black/5">
                                        <span className="text-[10px] font-black text-secondary/60 uppercase tracking-widest">إصدار فاتورة؟</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={formData.billing_enabled} onChange={(e) => setFormData(prev => ({ ...prev, billing_enabled: e.target.checked }))} />
                                            <div className="w-12 h-6 bg-black/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                {formData.billing_enabled ? (
                                    <div className="space-y-8 animate-in slide-in-from-top-2">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 rounded-[2.5rem] bg-black/[0.02] border border-black/5">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-secondary/40 uppercase px-2">اسم الجهاز</label>
                                                <Input readOnly value={formData.device_model} icon={<Monitor size={16} />} className="rounded-full bg-white border-black/5 h-12 text-secondary/60" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-secondary/40 uppercase px-2">سعر البيع للعميل (Selling Price)</label>
                                                <Input name="amount" type="number" value={formData.amount} onChange={handleChange} icon={<CreditCard size={18} />} className="rounded-full bg-white border-primary/20 h-12 font-black text-primary" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <h4 className="text-sm font-black text-secondary/40 uppercase tracking-tighter">بنود إضافية (Extra Items)</h4>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleInvoiceItemAdd}
                                                    className="h-8 rounded-full border-dashed border-primary/20 text-primary text-[10px]"
                                                    icon={<Plus size={12} />}
                                                >
                                                    إضافة بند
                                                </Button>
                                            </div>
                                            {formData.invoice_items.map((item, index) => (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-4 rounded-3xl bg-black/[0.02] border border-black/5 animate-in slide-in-from-top-1">
                                                    <div className="md:col-span-7">
                                                        <Input
                                                            placeholder="وصف البند..."
                                                            value={item.name}
                                                            onChange={(e) => handleInvoiceItemChange(index, 'name', e.target.value)}
                                                            className="rounded-full h-10 bg-white text-xs border-transparent focus:border-primary/20"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-3">
                                                        <Input
                                                            type="number"
                                                            placeholder="السعر"
                                                            value={item.price}
                                                            onChange={(e) => handleInvoiceItemChange(index, 'price', e.target.value)}
                                                            className="rounded-full h-10 bg-white text-xs border-transparent focus:border-primary/20 font-mono text-center text-primary"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 flex justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => handleInvoiceItemRemove(index)}
                                                            className="h-10 w-10 rounded-full text-red-500 hover:bg-red-50"
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center text-center bg-black/[0.01] rounded-[2.5rem] border border-dashed border-black/5">
                                        <Receipt size={40} className="text-secondary/10" />
                                        <p className="font-bold text-secondary/40">لم يتم تفعيل الفوترة</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {step === 6 && isUpdateMode && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <Card variant="glass" className="overflow-hidden border-primary/20">
                            <CardHeader className="p-8 border-b border-black/5 bg-primary/[0.02]">
                                <CardTitle className="text-xl font-black flex items-center gap-2 text-primary">
                                    <FileText size={24} />
                                    وصف التعديل (History Note)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-secondary/70 px-2 flex items-center gap-2">
                                        <Clock size={16} className="text-primary" />
                                        ما الذي قمت بتغييره في هذا التقرير؟
                                    </label>
                                    <textarea
                                        name="update_description"
                                        placeholder="مثال: تم تحديث مواصفات المعالج، إضافة صور جديدة للمعاينة، تغيير حالة الهاردوير..."
                                        value={formData.update_description}
                                        onChange={handleChange}
                                        className="w-full min-h-[150px] p-6 rounded-[2rem] bg-black/[0.02] border border-black/5 focus:border-primary/20 outline-none transition-all text-sm font-medium resize-none"
                                    />
                                    <p className="text-[10px] text-secondary/40 px-4 font-bold flex items-center gap-2">
                                        <AlertCircle size={12} />
                                        سيتم تسجيل هذا الوصف في تاريخ التقرير مع اسمك ووقت التعديل.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="flex items-center justify-between pt-8 border-t border-black/5 mt-8">
                    <Button type="button" variant="outline" onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="rounded-full h-12 px-8" icon={<ChevronRight size={18} />}>
                        {step === 1 ? 'إلغاء' : 'السابق'}
                    </Button>
                    <div className="flex gap-4">
                        {step < totalSteps ? (
                            <Button type="button" onClick={handleNextStep} className="rounded-full h-12 px-8" icon={<ChevronLeft size={18} />}>المتابعة</Button>
                        ) : (
                            <Button type="button" onClick={handleSubmit} disabled={isLoading} className="rounded-full h-12 px-12 bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all" icon={isLoading ? <Clock size={18} className="animate-spin" /> : <Save size={18} />}>
                                {isLoading ? 'جاري الحفظ...' : (reportId ? (isUpdateMode ? 'حفظ وتحديث التقرير' : 'تحديث التقرير') : 'حفظ التقرير نهائياً')}
                            </Button>
                        )}
                    </div>
                </div>
            </form>

            <ClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onSuccess={handleClientSelect}
            />
            <SupplierModal
                isOpen={isSupplierModalOpen}
                onClose={() => setIsSupplierModalOpen(false)}
                onSuccess={(s) => {
                    setSuppliers(prev => [...prev, s]);
                    handleSupplierSelect(s);
                }}
            />
        </div>
    );
}

