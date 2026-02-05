'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
    CreditCard
} from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import api from '@/lib/api';
import { use } from 'react';
import { cn } from '@/lib/utils';

export default function NewReportPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const t = useTranslations('dashboard.reports');
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [showClientResults, setShowClientResults] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1: Basic Info (Client + Device + Specs)
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

        // Step 2: Hardware Technical Tests
        hardware_status: [
            { componentName: 'Camera', status: 'neutral' },
            { componentName: 'Speakers', status: 'neutral' },
            { componentName: 'Microphone', status: 'neutral' },
            { componentName: 'Wi-Fi', status: 'neutral' },
            { componentName: 'LAN', status: 'neutral' },
            { componentName: 'USB Ports', status: 'neutral' },
            { componentName: 'Keyboard', status: 'neutral' },
            { componentName: 'Touchpad', status: 'neutral' },
            { componentName: 'Card Reader', status: 'neutral' },
            { componentName: 'Audio Jack', status: 'neutral' },
            { componentName: 'Display/HDMI', status: 'neutral' },
            { componentName: 'Bluetooth', status: 'neutral' },
            { componentName: 'Touchscreen', status: 'neutral' },
            { componentName: 'Battery Health', status: 'neutral' }
        ] as any[],

        // Step 3: External Inspection
        case_condition: '',
        screen_condition: '',
        keyboard_condition: '',
        touchpad_condition: '',
        ports_condition: '',
        hinges_condition: '',
        external_images: [] as any[], // Stores device images, test screenshots, and video URLs
        youtube_url: '', // Helper for Step 3 input

        // Step 4: Notes
        notes: '',

        // Step 5: Invoice
        billing_enabled: false,
        amount: '0', // Service/Inspection cost
        tax_rate: '0',
        discount: '0',
        status: 'pending' // Initial report status
    });

    // Default hardware components to test
    const defaultComponents = [
        'Screen', 'Battery', 'Face ID / Touch ID', 'True Tone', 'Camera (Wide)', 'Camera (Ultrawide)',
        'Camera (Telephoto)', 'Camera (Front)', 'Microphone', 'Speakers', 'Wi-Fi', 'Bluetooth',
        'Cellular', 'Charging Port', 'Physical Buttons', 'Flashlight'
    ];

    useEffect(() => {
        // Initialize hardware status with default components if empty
        if (formData.hardware_status.length === 0) {
            setFormData(prev => ({
                ...prev,
                hardware_status: defaultComponents.map(name => ({
                    componentName: name,
                    status: 'neutral',
                    notes: ''
                }))
            }));
        }
    }, []);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await api.get('/clients');
                setClients(response.data.clients || []);
            } catch (err) {
                console.error('Failed to fetch clients:', err);
            }
        };
        fetchClients();
    }, []);

    const handleClientSelect = (client: any) => {
        setFormData(prev => ({
            ...prev,
            client_name: client.name,
            client_phone: client.phone,
            client_address: client.address || ''
        }));
        setShowClientResults(false);
    };

    // Handler for adding Device Images (Step 3)
    const handleDeviceImageAdd = () => {
        const input = document.getElementById('device-image-url-input') as HTMLInputElement;
        if (input && input.value) {
            setFormData(prev => ({
                ...prev,
                external_images: [...prev.external_images, { url: input.value, type: 'image' }]
            }));
            input.value = '';
        }
    };

    // Handler for adding Video URLs (Step 3)
    const handleVideoAdd = () => {
        const input = document.getElementById('video-url-input') as HTMLInputElement;
        if (input && input.value) {
            let type = 'video';
            if (input.value.includes('youtube') || input.value.includes('youtu.be')) type = 'youtube';

            setFormData(prev => ({
                ...prev,
                external_images: [...prev.external_images, { url: input.value, type: type }]
            }));
            input.value = '';
        }
    };

    // Handler for adding Test Screenshots (Step 2)
    const handleTestScreenshotAdd = (componentName: string) => {
        const input = document.getElementById(`screenshot-${componentName}`) as HTMLInputElement;
        if (input && input.value) {
            setFormData(prev => ({
                ...prev,
                external_images: [...prev.external_images, { url: input.value, type: 'test_screenshot', component: componentName }]
            }));
            input.value = '';
        }
    };

    // Handler for removing images/videos
    const handleRemoveImage = (index: number) => {
        setFormData(prev => {
            const newImages = [...prev.external_images];
            newImages.splice(index, 1);
            return { ...prev, external_images: newImages };
        });
    };

    const updateHardwareTest = (index: number, status: string) => {
        const newStatus = [...formData.hardware_status];
        newStatus[index].status = status;
        setFormData(prev => ({ ...prev, hardware_status: newStatus }));
    };

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Client Handling
            let clientId = null;
            try {
                const clientsRes = await api.get('/clients');
                const existingClient = clientsRes.data.clients.find((c: any) => c.phone === formData.client_phone);

                if (existingClient) {
                    clientId = existingClient.id;
                } else {
                    const newClientRes = await api.post('/clients', {
                        name: formData.client_name,
                        phone: formData.client_phone,
                        address: formData.client_address,
                        orderCode: Math.floor(1000 + Math.random() * 9000).toString(),
                        status: 'active'
                    });
                    clientId = newClientRes.data.client.id;
                }
            } catch (err) {
                console.error('Error handling client:', err);
                alert('فشل في معالجة بيانات العميل');
                setIsLoading(false);
                return;
            }

            // Report Data Construction
            const reportData = {
                ...formData,
                client_id: clientId,
                order_number: formData.order_number,
                inspection_date: new Date(formData.inspection_date),

                // Stringify arrays for legacy backend compatibility
                hardware_status: JSON.stringify(formData.hardware_status),
                external_images: JSON.stringify(formData.external_images)
            };

            await api.post('/reports', reportData);
            router.push('/dashboard/admin/reports');
        } catch (error: any) {
            console.error('Failed to create report:', error);
            alert('فشل في حفظ التقرير: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header with Steps Indicator */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="w-10 h-10 p-0 rounded-full">
                            <ChevronRight size={22} className={cn(locale === 'ar' ? "" : "rotate-180")} />
                        </Button>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight">إنشاء تقرير فحص</h1>
                            <p className="text-secondary font-medium">خطوة {step} من 5: {
                                step === 1 ? 'البيانات الأساسية' :
                                    step === 2 ? 'الفحص التقني' :
                                        step === 3 ? 'المعاينة الخارجية' :
                                            step === 4 ? 'الملاحظات' : 'الفاتورة والحفظ'
                            }</p>
                        </div>
                    </div>

                    {/* 5-Step Progress Indicator */}
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={cn(
                                "w-8 h-2 rounded-full transition-all duration-300",
                                s === step ? "bg-primary w-12" : s < step ? "bg-primary/40" : "bg-black/5"
                            )} />
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Step 1: Client, Device Info & Technical Specs (MERGED) */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Client Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card variant="glass">
                                    <CardHeader className="p-8 pb-4">
                                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                                            <User size={22} className="text-primary" />
                                            معلومات العميل
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                            <div className="relative">
                                                <Input
                                                    name="client_name"
                                                    label="اسم العميل"
                                                    placeholder="أدخل اسم العميل..."
                                                    icon={<User size={20} />}
                                                    value={formData.client_name}
                                                    onChange={(e) => {
                                                        handleChange(e);
                                                        setShowClientResults(true);
                                                    }}
                                                    onFocus={() => setShowClientResults(true)}
                                                />
                                                {showClientResults && formData.client_name && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-black/5 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                                                        {clients
                                                            .filter(c => c.name.toLowerCase().includes(formData.client_name.toLowerCase()) || c.phone.includes(formData.client_name))
                                                            .map(client => (
                                                                <div
                                                                    key={client.id}
                                                                    className="p-3 hover:bg-primary/5 cursor-pointer border-b border-black/5 last:border-0 flex justify-between items-center"
                                                                    onClick={() => handleClientSelect(client)}
                                                                >
                                                                    <span className="font-bold text-sm">{client.name}</span>
                                                                    <span className="text-xs text-secondary/40 font-mono">{client.phone}</span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Input
                                                name="client_phone"
                                                label="رقم الهاتف"
                                                placeholder="أدخل رقم الهاتف..."
                                                icon={<Smartphone size={20} />}
                                                value={formData.client_phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input
                                                name="client_address"
                                                label="العنوان"
                                                placeholder="أدخل عنوان العميل..."
                                                icon={<CreditCard size={20} />}
                                                value={formData.client_address}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                name="order_number"
                                                label="رقم الطلب (Order Number)"
                                                placeholder="RP-2024-XXXX"
                                                icon={<Hash size={20} />}
                                                value={formData.order_number}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card variant="glass">
                                    <CardHeader className="p-8 pb-4">
                                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                                            <Smartphone size={22} className="text-primary" />
                                            معلومات الجهاز
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0 space-y-6">
                                        <Input
                                            name="device_model"
                                            label="موديل الجهاز"
                                            placeholder="مثلاً: iPhone 15 Pro Max / MacBook Air M2"
                                            icon={<Smartphone size={20} />}
                                            value={formData.device_model}
                                            onChange={handleChange}
                                            required
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input
                                                name="serial_number"
                                                label="الرقم التسلسلي (IMEI/SN)"
                                                placeholder="أدخل السيريال نمبر"
                                                icon={<Hash size={20} />}
                                                value={formData.serial_number}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                name="inspection_date"
                                                label="تاريخ الفحص"
                                                type="date"
                                                icon={<Calendar size={20} />}
                                                value={formData.inspection_date}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Technical Specifications */}
                            <Card variant="glass">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <ShieldCheck size={22} className="text-primary" />
                                        المواصفات ة للنظام
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <Input
                                            name="cpu"
                                            label="المعالج (CPU)"
                                            placeholder="مثلاً: A17 Pro / M2 / Ryzen 9"
                                            icon={<Cpu size={20} />}
                                            value={formData.cpu}
                                            onChange={handleChange}
                                        />
                                        <Input
                                            name="gpu"
                                            label="معالج الرسوميات (GPU)"
                                            placeholder="مثلاً: 6-Core GPU / RTX 4090"
                                            icon={<Monitor size={20} />}
                                            value={formData.gpu}
                                            onChange={handleChange}
                                        />
                                        <Input
                                            name="ram"
                                            label="الذاكرة العشوائية (RAM)"
                                            placeholder="مثلاً: 8GB / 16GB"
                                            icon={<Database size={20} />}
                                            value={formData.ram}
                                            onChange={handleChange}
                                        />
                                        <Input
                                            name="storage"
                                            label="مساحة التخزين (Storage)"
                                            placeholder="مثلاً: 256GB NVMe / 1TB"
                                            icon={<HardDrive size={20} />}
                                            value={formData.storage}
                                            onChange={handleChange}
                                        />
                                        <Input
                                            name="display_size"
                                            label="حجم الشاشة (Display)"
                                            placeholder={'مثلاً: 15.6" FHD / 14" 4K UHD'}
                                            icon={<Monitor size={20} />}
                                            value={formData.display_size}
                                            onChange={handleChange}
                                        />
                                        <Input
                                            name="battery_capacity"
                                            label="سعة البطارية (Battery)"
                                            placeholder="مثلاً: 68Wh / 97Wh"
                                            icon={<Database size={20} />}
                                            value={formData.battery_capacity}
                                            onChange={handleChange}
                                        />
                                        <Input
                                            name="device_price"
                                            label="سعر الجهاز المقدر (Est. Price)"
                                            placeholder="أدخل قيمة الجهاز..."
                                            icon={<CreditCard size={20} />}
                                            value={formData.device_price}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 2: Technical Tests (Hardware Status & Test Screenshots) */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <Card variant="flat">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <ShieldCheck size={22} className="text-primary" />
                                        اختبارات الهاردوير (Hardware Tests)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    {/* Hardware Component Status Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {formData.hardware_status.map((test, index) => (
                                            <div key={index} className="p-4 rounded-2xl border border-black/5 bg-white space-y-3">
                                                <p className="font-bold text-sm">{test.componentName}</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateHardwareTest(index, 'pass')}
                                                        className={cn(
                                                            "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                                            test.status === 'pass' ? "bg-green-500 text-white" : "bg-green-50 text-green-600 hover:bg-green-100"
                                                        )}
                                                    >Pass</button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateHardwareTest(index, 'fail')}
                                                        className={cn(
                                                            "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                                            test.status === 'fail' ? "bg-red-500 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"
                                                        )}
                                                    >Fail</button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateHardwareTest(index, 'warning')}
                                                        className={cn(
                                                            "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                                            test.status === 'warning' ? "bg-yellow-500 text-white" : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                                                        )}
                                                    >Warning</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Test Screenshots Section */}
                                    <div className="mt-12 pt-8 border-t border-black/5">
                                        <h4 className="text-sm font-black text-secondary/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <ImageIcon size={18} />
                                            لقطات الشاشة للاختبارات (Test Screenshots)
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Specific Component Screenshot Inputs */}
                                            <div className="space-y-4">
                                                {['CPU', 'GPU', 'HDD', 'Battery'].map(comp => (
                                                    <div key={comp} className="flex gap-2 items-end">
                                                        <Input
                                                            id={`screenshot-${comp}`}
                                                            label={`${comp} Screenshot URL`}
                                                            placeholder="أدخل رابط الصورة..."
                                                            className="flex-1"
                                                        />
                                                        <Button
                                                            type="button"
                                                            onClick={() => handleTestScreenshotAdd(comp)}
                                                            className="mb-[1px]"
                                                            icon={<Plus size={18} />}
                                                        >
                                                            إضافة
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Preview Area for Test Screenshots */}
                                            <div className="grid grid-cols-3 gap-4 content-start">
                                                {formData.external_images.filter(img => img.type === 'test_screenshot').map((img, i) => (
                                                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-black/5 border border-black/5 relative group">
                                                        <img src={img.url} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({
                                                                ...prev,
                                                                external_images: prev.external_images.filter(item => item !== img)
                                                            }))}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <XCircle size={12} />
                                                        </button>
                                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] p-1 text-center truncate font-bold">
                                                            {img.component || 'Test'}
                                                        </div>
                                                    </div>
                                                ))}
                                                {formData.external_images.filter(img => img.type === 'test_screenshot').length === 0 && (
                                                    <div className="col-span-3 h-32 flex items-center justify-center text-secondary/40 border border-dashed border-black/10 rounded-xl text-sm">
                                                        لا توجد لقطات شاشة مضافة
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 3: External Inspection */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <Card variant="flat">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <Camera size={22} className="text-primary" />
                                        المعاينة الخارجية (External Inspection)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0 space-y-8">
                                    {/* Conditions Dropdowns */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {['case', 'screen', 'keyboard', 'touchpad', 'ports', 'hinges'].map(part => (
                                            <div key={part} className="space-y-1.5">
                                                <label className="text-sm font-bold opacity-60 capitalize">{part} Condition</label>
                                                <select
                                                    name={`${part}_condition`}
                                                    className="w-full h-12 rounded-input bg-surface-variant/40 px-4 border-0 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                    value={(formData as any)[`${part}_condition`]}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">اختر الحالة...</option>
                                                    <option value="excellent">Excellent (ممتاز)</option>
                                                    <option value="good">Good (جيد)</option>
                                                    <option value="fair">Fair (مقبول)</option>
                                                    <option value="poor">Poor (سيء)</option>
                                                </select>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-black/5 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* External Images Input */}
                                        <div className="space-y-4">
                                            <label className="text-sm font-bold opacity-60">صور الجهاز الخارجية</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="device-image-url-input"
                                                    placeholder="HTTPS URL..."
                                                    className="flex-1"
                                                />
                                                <Button type="button" onClick={handleDeviceImageAdd} icon={<Plus size={18} />}>إضافة</Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.external_images.filter(img => img.type === 'image').map((img, i) => (
                                                    <div key={i} className="relative group w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-black/10">
                                                        <img src={img.url} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({
                                                                ...prev,
                                                                external_images: prev.external_images.filter(item => item !== img)
                                                            }))}
                                                            className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <XCircle size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Video URL Input */}
                                        <div className="space-y-4">
                                            <label className="text-sm font-bold opacity-60">فيديو (يوتيوب/رابط)</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="video-url-input"
                                                    placeholder="Video/YouTube URL..."
                                                    className="flex-1"
                                                />
                                                <Button type="button" onClick={handleVideoAdd} icon={<Plus size={18} />}>إضافة</Button>
                                            </div>
                                            <div className="space-y-2">
                                                {formData.external_images.filter(img => img.type === 'youtube' || img.type === 'video').map((vid, i) => (
                                                    <div key={i} className="flex justify-between items-center bg-surface-variant/20 p-2 rounded-lg text-xs">
                                                        <span className="truncate max-w-[200px]">{vid.url}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({
                                                                ...prev,
                                                                external_images: prev.external_images.filter(item => item !== vid)
                                                            }))}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 4: Notes */}
                    {step === 4 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <Card variant="flat">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <FileText size={22} className="text-primary" />
                                        ملاحظات إضافية (Notes)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <textarea
                                        name="notes"
                                        className="w-full min-h-[300px] rounded-3xl bg-surface-variant/50 p-6 border-0 focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none font-medium leading-relaxed"
                                        placeholder="اكتب أي ملاحظات إضافية هنا حول الجهاز أو التقرير..."
                                        value={formData.notes}
                                        onChange={handleChange}
                                    ></textarea>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 5: Invoice & Submit */}
                    {step === 5 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-8">
                            <Card variant="flat">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <Receipt size={22} className="text-primary" />
                                        الفاتورة والاعتماد (Invoice & Submit)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 pt-0 space-y-8">
                                    {/* Billing Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-surface-variant/30 rounded-2xl border border-black/5">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm">إصدار فاتورة لهذا التقرير</h4>
                                            <p className="text-xs text-secondary/60">تفعيل هذا الخيار سينشئ فاتورة جديدة مرتبطة بهذا التقرير</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={formData.billing_enabled}
                                                onChange={(e) => setFormData(prev => ({ ...prev, billing_enabled: e.target.checked }))}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>

                                    {formData.billing_enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                                            <Input
                                                name="amount"
                                                label="المبلغ (IQD)"
                                                type="number"
                                                placeholder="0"
                                                value={formData.amount}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                name="tax_rate"
                                                label="الضريبة (%)"
                                                type="number"
                                                placeholder="0"
                                                value={formData.tax_rate}
                                                onChange={handleChange}
                                            />
                                            <Input
                                                name="discount"
                                                label="الخصم (IQD)"
                                                type="number"
                                                placeholder="0"
                                                value={formData.discount}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-black/5">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold opacity-60 px-1">حالة التقرير الأولية</label>
                                            <select
                                                name="status"
                                                className="w-full h-12 rounded-input bg-surface-variant/40 px-4 border-0 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                value={formData.status}
                                                onChange={handleChange}
                                            >
                                                <option value="pending">انتظار (Pending)</option>
                                                <option value="in-progress">قيد المعالجة (In Progress)</option>
                                                <option value="completed">مكتمل (Completed)</option>
                                            </select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Navigation Buttons - Updated for 5 Steps */}
                    <div className="flex items-center justify-between pt-8 border-t border-black/5 mt-8">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
                            className="px-8"
                        >
                            {step === 1 ? 'إلغاء' : 'السابق'}
                        </Button>

                        <div className="flex items-center gap-2 text-sm font-bold opacity-40">
                            Step {step} of 5
                        </div>

                        {step < 5 ? (
                            <Button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                className="px-12"
                                icon={<ChevronLeft size={20} className={cn(locale === 'ar' ? "" : "rotate-180")} />}
                            >
                                التالي
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                size="lg"
                                className="px-12 shadow-xl shadow-primary/20"
                                isLoading={isLoading}
                                icon={<Save size={20} />}
                            >
                                اعتماد وحفظ التقرير
                            </Button>
                        )}
                    </div>

                </form>
            </div>
        </DashboardLayout>
    );
}
