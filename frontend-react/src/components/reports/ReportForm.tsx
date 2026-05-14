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
    X,
    AlertCircle,
    Plus,
    Minus,
    Camera,
    Video,
    FileText,
    ChevronRight,
    ChevronLeft,
    Edit,
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
    SquareCheck,
    Loader2,
    Upload
} from 'lucide-react';
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
    const [agentData, setAgentData] = useState<any>(null);

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [hasDraft, setHasDraft] = useState(false);

    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        if (type !== 'error') {
            setTimeout(() => setNotification(null), 4000);
        }
    };

    useEffect(() => {
        if (notification?.type === 'error') {
            const timer = setTimeout(() => setNotification(null), 6000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const [quickSpecs, setQuickSpecs] = useState({
        cpu: [] as string[],
        gpu: [] as string[],
        ram: [] as string[],
        storage: [] as string[]
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
        update_description: '',
        payment_method: '' as string,
        is_confirmed: false as boolean,
        selected_accessories: [] as any[],
        agent_json: ''
    });

    const searchParams = useSearchParams();
    const isUpdateMode = searchParams.get('mode') === 'update';
    const totalSteps = isUpdateMode ? 4 : 3;

    const [imageInput, setImageInput] = useState('');
    const [videoInput, setVideoInput] = useState('');
    const [uploadingComponents, setUploadingComponents] = useState<string[]>([]);
    const [isExternalUploading, setIsExternalUploading] = useState(false);
    const [isVideoUploading, setIsVideoUploading] = useState(false);
    const [dragActiveComponent, setDragActiveComponent] = useState<string | null>(null);
    const [isExternalDragActive, setIsExternalDragActive] = useState(false);
    const [isVideoDragActive, setIsVideoDragActive] = useState(false);

    const uploadToImgBB = async (file: File) => {
        const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
        if (!apiKey) {
            console.error('ImgBB API Key is missing');
            return null;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.success) {
                return data.data.url;
            } else {
                console.error('ImgBB response error:', data.error);
                return null;
            }
        } catch (err) {
            console.error('ImgBB upload error:', err);
            return null;
        }
    };

    const uploadToCatbox = async (file: File) => {
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            // Use backend proxy to bypass CORS restrictions
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const response = await fetch('/api/upload/catbox', {
                method: 'POST',
                headers: {
                    ...(token ? { 'x-auth-token': token } : {})
                },
                body: uploadData,
            });

            const data = await response.json();
            if (data.success && data.url) {
                return data.url;
            } else {
                console.error('Catbox proxy error:', data.error || data);
                return null;
            }
        } catch (err) {
            console.error('Catbox upload error:', err);
            return null;
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent, componentName: string) => {
        let file: File | undefined;
        
        if ('files' in e.target && e.target.files) {
            file = e.target.files[0];
        } else if ('dataTransfer' in e) {
            e.preventDefault();
            file = e.dataTransfer.files[0];
        }

        if (!file) return;

        setUploadingComponents(prev => [...prev, componentName]);
        const url = await uploadToImgBB(file);
        if (url) {
            handleTestScreenshotAdd(componentName, url);
        } else {
            showNotification('error', 'فشل رفع الصورة. يرجى المحاولة مرة أخرى.');
        }
        setUploadingComponents(prev => prev.filter(c => c !== componentName));
        setDragActiveComponent(null);
        
        if ('target' in e && 'value' in e.target) {
            (e.target as any).value = '';
        }
    };

    const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const scanData = JSON.parse(text);
            setAgentData(scanData);

            const roundToStandard = (gb: number) => {
                if (gb <= 0) return 0;
                const standards = [128, 256, 512, 1024, 2048];
                const closest = standards.reduce((prev, curr) => 
                    Math.abs(curr - gb) < Math.abs(prev - gb) ? curr : prev
                );
                // Use standard if within 15% margin
                return (Math.abs(closest - gb) / gb < 0.15) ? closest : Math.round(gb);
            };

            const formatSize = (gb: number) => {
                const rounded = roundToStandard(gb);
                return rounded >= 1024 ? `${rounded / 1024}TB` : `${rounded}GB`;
            };

            setFormData(prev => {
                const newData = { ...prev };

                // 1. System Info & Serial (Matched with ScanReportView)
                if (scanData.system) {
                    const manufacturer = scanData.system.manufacturer || '';
                    const model = scanData.system.model || '';
                    newData.device_model = `${manufacturer} ${model}`.trim();
                    
                    if (scanData.system.system_serial) {
                        newData.serial_number = scanData.system.system_serial;
                    }
                }

                // 2. CPU
                if (scanData.cpu?.name) {
                    newData.cpu = scanData.cpu.name;
                }

                // 3. RAM
                if (scanData.ram?.total) {
                    newData.ram = `${scanData.ram.total} GB`;
                }

                // 4. GPU (Matched with ScanReportView gpu.devices)
                if (scanData.gpu?.devices?.length > 0) {
                    newData.gpu = scanData.gpu.devices
                        .map((g: any) => {
                            const vendor = g.vendor || '';
                            const name = g.name || '';
                            if (name.toLowerCase().includes(vendor.toLowerCase())) return name;
                            return `${vendor} ${name}`.trim();
                        })
                        .join(' + ');
                }

                // 5. Storage (Matched with ScanReportView storage.devices)
                let storageDetails = {};
                if (scanData.storage?.devices?.length > 0) {
                    const internalDrives = scanData.storage.devices.filter((d: any) => 
                        d.type?.toLowerCase() !== 'usb' && 
                        !String(d.model || '').toLowerCase().includes('usb')
                    );

                    if (internalDrives.length > 0) {
                        newData.storage = internalDrives
                            .map((d: any) => {
                                const sizeGb = d.size_gb || (d.size ? d.size / (1024 ** 3) : 0);
                                return `${formatSize(sizeGb)} ${d.type || 'SSD'}`;
                            })
                            .join(' + ');
                        
                        // Store detailed storage stats
                        storageDetails = {
                            devices: internalDrives.map((d: any) => ({
                                model: d.model,
                                size: d.size_gb,
                                health: d.health_pct || d.health_percent || 100,
                                type: d.type
                            }))
                        };
                    }
                }

                // 6. Battery & Display
                let batteryDetails = {};
                const batteryDevice = scanData.battery?.devices?.[0];
                if (batteryDevice?.health_percentage) {
                    newData.battery_capacity = `${Math.round(batteryDevice.health_percentage)}% Health`;
                    batteryDetails = {
                        health: batteryDevice.health_percentage,
                        cycles: batteryDevice.cycle_count || 0,
                        design: batteryDevice.design_capacity,
                        full: batteryDevice.full_charge_capacity
                    };
                }

                let displayDetails = {};
                const mainDisplay = scanData.display?.active_displays?.[0];
                if (mainDisplay?.resolution) {
                    const { width, height } = mainDisplay.resolution;
                    newData.display_size = `${width}x${height} @ ${mainDisplay.refresh_rate || ''}Hz`;
                    displayDetails = {
                        width,
                        height,
                        refresh_rate: mainDisplay.refresh_rate
                    };
                }

                // Detailed RAM & CPU stats for hardware_status
                const ramDetails = {
                    total: scanData.ram?.total,
                    type: scanData.ram?.type,
                    speed: scanData.ram?.speed_mhz
                };

                const cpuDetails = {
                    name: scanData.cpu?.name,
                    cores: scanData.cpu?.physical_cores,
                    temp: scanData.cpu?.temperature_c,
                    cache: scanData.cpu?.l3_cache_mb
                };

                const gpuDetails = {
                    devices: scanData.gpu?.devices?.map((g: any) => ({
                        name: g.name,
                        vram: g.vram_mb,
                        vendor: g.vendor
                    }))
                };

                newData.agent_json = text;

                newData.hardware_status = prev.hardware_status.map(item => {
                    if (['CPU', 'GPU', 'Storage', 'Battery', 'Display', 'Wifi', 'Bluetooth'].includes(item.componentName)) {
                        let detail = {};
                        if (item.componentName === 'CPU') detail = cpuDetails;
                        if (item.componentName === 'GPU') detail = gpuDetails;
                        if (item.componentName === 'Storage') detail = storageDetails;
                        if (item.componentName === 'Battery') detail = batteryDetails;
                        if (item.componentName === 'Display') detail = displayDetails;
                        if (item.componentName === 'RAM') detail = ramDetails;

                        return { 
                            ...item, 
                            status: 'pass', 
                            comment: Object.keys(detail).length > 0 ? JSON.stringify(detail) : 'تم الفحص برمجياً: سليم' 
                        };
                    }
                    return item;
                });

                return newData;
            });

            showNotification('success', 'تم استخراج بيانات الجهاز بنجاح! يرجى مراجعة الحقول.');
        } catch (err) {
            console.error('Failed to parse scan file:', err);
            showNotification('error', 'فشل في قراءة ملف الفحص. تأكد أنه ملف JSON صحيح.');
        }
    };

    const handleExternalImageUploadCore = async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        if (fileArray.length === 0) return;

        setIsExternalUploading(true);
        for (const file of fileArray) {
            const url = await uploadToImgBB(file);
            if (url) {
                setFormData(prev => ({
                    ...prev,
                    external_images: [...prev.external_images, { url, type: 'image' }]
                }));
            }
        }
        setIsExternalUploading(false);
    };

    const handleExternalImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleExternalImageUploadCore(e.target.files);
            e.target.value = '';
        }
    };

    const handleVideoUploadCore = async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        if (fileArray.length === 0) return;

        setIsVideoUploading(true);
        for (const file of fileArray) {
            const url = await uploadToCatbox(file);
            if (url) {
                setFormData(prev => ({
                    ...prev,
                    external_images: [...prev.external_images, { url, type: 'video' }]
                }));
            } else {
                showNotification('error', 'فشل رفع الفيديو. يرجى المحاولة مرة أخرى.');
            }
        }
        setIsVideoUploading(false);
    };

    const handleVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleVideoUploadCore(e.target.files);
            e.target.value = '';
        }
    };

    const handleDrag = (e: React.DragEvent, componentName: string | 'external' | 'video', active: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (componentName === 'external') {
            setIsExternalDragActive(active);
        } else if (componentName === 'video') {
            setIsVideoDragActive(active);
        } else {
            setDragActiveComponent(active ? componentName : null);
        }
    };

    const handleDrop = (e: React.DragEvent, componentName: string | 'external' | 'video') => {
        e.preventDefault();
        e.stopPropagation();
        
        if (componentName === 'external') {
            setIsExternalDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleExternalImageUploadCore(e.dataTransfer.files);
            }
        } else if (componentName === 'video') {
            setIsVideoDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleVideoUploadCore(e.dataTransfer.files);
            }
        } else {
            setDragActiveComponent(null);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileUpload(e, componentName);
            }
        }
    };

    // Restore draft from localStorage on mount
    useEffect(() => {
        if (!reportId) {
            try {
                const saved = localStorage.getItem('report-draft');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    const age = Date.now() - (parsed._savedAt || 0);
                    if (age < 30 * 60 * 1000) {
                        const { _savedAt, ...rest } = parsed;
                        setFormData(prev => ({ ...prev, ...rest }));
                        setHasDraft(true);
                        showNotification('info', 'تم استعادة مسودة محفوظة');
                    } else {
                        localStorage.removeItem('report-draft');
                    }
                }
            } catch {}
        }
    }, []);

    // Auto-save draft to localStorage
    useEffect(() => {
        if (reportId || step !== 1) return;
        const timer = setTimeout(() => {
            try {
                const toSave = { ...formData, _savedAt: Date.now() };
                localStorage.setItem('report-draft', JSON.stringify(toSave));
            } catch {}
        }, 3000);
        return () => clearTimeout(timer);
    }, [formData, reportId, step]);

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
                    const extractValues = (arr: any[]) => (arr || []).map((item: any) => typeof item === 'object' && item !== null ? item.value : item);
                    setQuickSpecs({
                        cpu: extractValues(specsRes.data.cpu),
                        gpu: extractValues(specsRes.data.gpu),
                        ram: extractValues(specsRes.data.ram),
                        storage: extractValues(specsRes.data.storage),
                    });
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

                    if (r.agent_json) {
                        try {
                            setAgentData(JSON.parse(r.agent_json));
                        } catch (e) {}
                    }

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
                        invoice_id: r.invoice_id || null,
                        update_description: '',
                        payment_method: r.payment_method || '',
                        is_confirmed: !!r.is_confirmed,
                        selected_accessories: typeof r.selected_accessories === 'string' ? JSON.parse(r.selected_accessories) : (r.selected_accessories || []),
                        agent_json: r.agent_json || ''
                    });
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
                if (reportId) showNotification('error', 'فشل في تحميل بيانات التقرير');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [reportId]);

    const handleClientSelect = (client: any) => {
        setFormData(prev => {
            const isNewClient = prev.client_id !== '' && String(client.id) !== String(prev.client_id);
            return {
                ...prev,
                client_id: client.id,
                client_name: client.name,
                client_phone: client.phone,
                client_address: client.address || '',
                device_source: '',
                // Auto-set status to pending for warehouse items
                status: String(client.id) === '143' ? 'pending' : (isNewClient ? 'pending' : prev.status),
                // Reset only client-specific confirmation/payment details when switching clients
                ...(isNewClient ? {
                    payment_method: '',
                    is_confirmed: false,
                    invoice_items: [],
                    selected_accessories: [],
                    invoice_id: null
                } : {})
            };
        });
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
            const errors: Record<string, string> = {};
            if (!formData.client_name) errors.client_name = 'اسم العميل مطلوب';
            if (!formData.device_model) errors.device_model = 'اسم الجهاز مطلوب';
            if (!formData.serial_number) errors.serial_number = 'الرقم التسلسلي مطلوب';
            if (!formData.device_source) errors.device_source = 'مصدر الجهاز مطلوب';

            setFormErrors(errors);
            if (Object.keys(errors).length > 0) {
                showNotification('error', 'يرجى ملء الحقول الإلزامية قبل المتابعة');
                return;
            }
        }
        setStep(step + 1);
    };

    const handlePrevStep = () => {
        setFormErrors({});
        setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step !== totalSteps) return;

        const errors: Record<string, string> = {};
        if (!formData.client_name) errors.client_name = 'اسم العميل مطلوب';
        if (!formData.client_phone) errors.client_phone = 'رقم الهاتف مطلوب';
        if (!formData.device_model) errors.device_model = 'موديل الجهاز مطلوب';
        if (!formData.order_number) errors.order_number = 'رقم الطلب مطلوب';

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            showNotification('error', 'يرجى ملء الحقول الإلزامية قبل الحفظ');
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
                update_description: isUpdateMode ? formData.update_description : undefined,
                payment_method: formData.payment_method,
                is_confirmed: formData.is_confirmed,
                selected_accessories: JSON.stringify(formData.selected_accessories)
            };

            let reportId_final = reportId;
            if (reportId) {
                await api.put(`/reports/${reportId}`, reportData);
            } else {
                const res = await api.post('/reports', reportData);
                reportId_final = res.data.id;
            }

            localStorage.removeItem('report-draft');
            showNotification('success', reportId ? 'تم تحديث التقرير بنجاح' : 'تم حفظ التقرير بنجاح');
            setTimeout(() => router.push('/dashboard/admin/reports'), 800);
        } catch (error: any) {
            console.error('Failed to submit report:', error);
            showNotification('error', 'فشل في حفظ التقرير');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && reportId && step === 1 && !formData.client_name) {
        return <div className="p-12 text-center font-bold text-secondary">جاري تحميل بيانات التقرير...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Notification Banner */}
            {notification && (
                <div className={cn(
                    "fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3.5 rounded-2xl shadow-2xl shadow-black/10 backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 border max-w-md w-[calc(100%-2rem)]",
                    notification.type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-800",
                    notification.type === 'error' && "bg-red-50 border-red-200 text-red-800",
                    notification.type === 'info' && "bg-blue-50 border-blue-200 text-blue-800",
                )}>
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        notification.type === 'success' && "bg-emerald-100 text-emerald-600",
                        notification.type === 'error' && "bg-red-100 text-red-600",
                        notification.type === 'info' && "bg-blue-100 text-blue-600",
                    )}>
                        {notification.type === 'success' ? <Check size={16} /> :
                         notification.type === 'error' ? <XCircle size={16} /> : <AlertCircle size={16} />}
                    </div>
                    <p className="text-sm font-bold flex-1">{notification.message}</p>
                    <button
                        type="button"
                        onClick={() => setNotification(null)}
                        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Header with Steps Indicator */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.02] border border-primary/[0.05] p-6 md:p-8">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => step > 1 ? handlePrevStep() : router.back()} className="w-10 h-10 p-0 rounded-full bg-white/80 backdrop-blur-sm">
                            <ChevronRight size={22} className={cn(locale === 'ar' ? "" : "rotate-180")} />
                        </Button>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                                {isUpdateMode ? 'تحديث التقرير (History)' : (reportId ? 'تعديل التقرير' : 'إنشاء تقرير فحص')}
                                {hasDraft && (
                                    <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200/50 animate-in fade-in">
                                        مسودة
                                    </span>
                                )}
                            </h1>
                            <p className="text-secondary font-medium">
                                <span className="text-primary/40 ml-1.5">خطوة {step}/{totalSteps}</span>
                                {
                                    step === 1 ? 'بيانات العميل والمواصفات الفنية' :
                                    step === 2 ? 'صور الجهاز وفيديو الفحص' :
                                    step === 3 ? 'لقطات نتائج الاختبارات' :
                                    'وصف التعديل'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                        {[
                            { n: 1, label: 'البيانات', icon: <User size={12} /> },
                            { n: 2, label: 'الصور', icon: <Camera size={12} /> },
                            { n: 3, label: 'لقطات', icon: <FileText size={12} /> },
                            ...(isUpdateMode ? [{ n: 4, label: 'التعديل', icon: <Edit size={12} /> }] : [])
                        ].map((s, idx, arr) => (
                            <React.Fragment key={s.n}>
                                <button
                                    type="button"
                                    onClick={() => s.n < step ? setStep(s.n) : undefined}
                                    className={cn(
                                        "flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border backdrop-blur-sm",
                                        s.n === step
                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-105"
                                            : s.n < step
                                                ? "bg-white/80 text-primary border-primary/15 cursor-pointer hover:bg-primary/10 hover:border-primary/30"
                                                : "bg-white/50 text-secondary/30 border-black/5 cursor-default"
                                    )}
                                >
                                    {s.n < step ? (
                                        <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center"><Check size={9} /></span>
                                    ) : (
                                        <span className={cn("w-4 h-4 rounded-full flex items-center justify-center", s.n === step ? "bg-white/20" : "bg-black/[0.04]")}>{s.icon}</span>
                                    )}
                                    <span>{s.label}</span>
                                </button>
                                {idx < arr.length - 1 && (
                                    <div className={cn("h-[2px] w-4 shrink-0 rounded-full transition-colors", s.n < step ? "bg-primary/30" : "bg-black/[0.06]")} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                        {/* Agent JSON Import Row */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-primary/5 border border-primary/[0.08] shadow-sm p-5">
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-400/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-fuchsia-400/10 rounded-full blur-3xl" />
                            <div className="relative z-10 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center text-violet-600 shrink-0">
                                        <Upload size={18} />
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-sm">استيراد من ملف JSON</span>
                                        <p className="text-[10px] text-secondary/40 font-medium">
                                            {agentData ? 'تم استيراد بيانات الجهاز بنجاح' : 'ارفع ملف JSON من برنامج الفحص'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <input
                                        type="file"
                                        id="scan-upload"
                                        className="hidden"
                                        accept=".json"
                                        onChange={handleScanUpload}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => document.getElementById('scan-upload')?.click()}
                                        className="rounded-full h-10 px-5 border-violet-200 bg-white/80 text-violet-700 hover:bg-violet-50 backdrop-blur-sm"
                                        icon={<Upload size={16} />}
                                    >
                                        اختر ملف JSON
                                    </Button>
                                    {agentData && (
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100">
                                            <CheckCircle2 size={14} className="ml-1" />
                                            تم التحميل
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Agent Quick-Fill Chips */}
                            {agentData && (() => {
                                const formatSize = (gb: number) => {
                                    if (gb <= 0) return '';
                                    const standards = [128, 256, 512, 1024, 2048];
                                    const closest = standards.reduce((prev, curr) =>
                                        Math.abs(curr - gb) < Math.abs(prev - gb) ? curr : prev
                                    );
                                    const rounded = (Math.abs(closest - gb) / gb < 0.15) ? closest : Math.round(gb);
                                    return rounded >= 1024 ? `${rounded / 1024}TB` : `${rounded}GB`;
                                };

                                const chips: { label: string; field: string; value: string }[] = [];
                                if (agentData.cpu?.name) chips.push({ label: 'CPU', field: 'cpu', value: agentData.cpu.name });
                                if (agentData.gpu?.devices?.[0]) {
                                    const g = agentData.gpu.devices[0];
                                    const gpuVal = g.name?.toLowerCase().includes((g.vendor || '').toLowerCase())
                                        ? g.name : `${g.vendor || ''} ${g.name || ''}`.trim();
                                    if (gpuVal) chips.push({ label: 'GPU', field: 'gpu', value: gpuVal });
                                }
                                if (agentData.ram?.total) chips.push({ label: 'RAM', field: 'ram', value: `${agentData.ram.total} GB` });
                                if (agentData.storage?.devices?.length > 0) {
                                    const internal = agentData.storage.devices.filter((d: any) =>
                                        d.type?.toLowerCase() !== 'usb' && !String(d.model || '').toLowerCase().includes('usb')
                                    );
                                    if (internal.length > 0) {
                                        const storageVal = internal.map((d: any) => {
                                            const sizeGb = d.size_gb || (d.size ? d.size / (1024 ** 3) : 0);
                                            return `${formatSize(sizeGb)} ${d.type || 'SSD'}`;
                                        }).join(' + ');
                                        if (storageVal) chips.push({ label: 'Storage', field: 'storage', value: storageVal });
                                    }
                                }

                                return chips.length > 0 ? (
                                    <div className="space-y-2 pt-4 mt-4 border-t border-violet-200/30">
                                        <span className="text-[9px] font-black text-violet-400/60 uppercase tracking-[0.2em] block px-1">
                                            تعبئة سريعة من بيانات الفحص
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {chips.map(chip => (
                                                <button
                                                    key={chip.field}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, [chip.field]: chip.value }))}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-4 py-2 rounded-full border transition-all",
                                                        (formData as any)[chip.field] === chip.value
                                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                            : "bg-white/80 text-secondary/60 border-violet-200/40 hover:border-violet-300/60 hover:text-violet-700 hover:bg-violet-50/50"
                                                    )}
                                                >
                                                    <Plus size={10} className="text-primary/60" />
                                                    <span className="text-[11px] font-bold">{chip.label}: </span>
                                                    <span className="text-[11px] font-mono font-bold">{chip.value}</span>
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    chips.forEach(chip => {
                                                        setFormData(prev => ({ ...prev, [chip.field]: chip.value }));
                                                    });
                                                }}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-violet-300/40 bg-violet-50/60 text-violet-700 hover:bg-violet-100/80 transition-all"
                                            >
                                                <Zap size={12} />
                                                <span className="text-[11px] font-bold">تعبئة الكل</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : null;
                            })()}
                        </div>

                        <Card variant="glass" className="overflow-hidden border-primary/10">
                            <CardHeader className="md:p-8 p-5 pb-4 border-b border-black/[0.03] bg-primary/[0.01]">
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
                            <CardContent className="md:p-8 p-5 space-y-6 md:space-y-10">
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
                                                className="rounded-full bg-black/[0.02] border-transparent h-14"
                                                error={formErrors.client_name}
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
                                                className="rounded-full bg-black/[0.02] border-transparent h-14"
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
                                            className="rounded-full bg-black/[0.02] border-transparent h-14 font-bold"
                                            error={formErrors.device_model}
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
                                            className="rounded-full bg-black/[0.02] border-transparent h-14"
                                            error={formErrors.serial_number}
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
                                        {(['cpu', 'gpu', 'ram', 'storage'] as const).map((field) => {
                                            const hStatus = formData.hardware_status;
                                            const statusItem = hStatus.find((h: any) => h.componentName?.toLowerCase() === field.toLowerCase() || (field === 'storage' && h.componentName === 'Storage'));
                                            let techData: any = null;
                                            if (statusItem?.comment) {
                                                try { techData = JSON.parse(statusItem.comment); } catch (e) {}
                                            }

                                            return (
                                                <div key={field} className="space-y-4 group">
                                                    <div className="relative">
                                                        <Input
                                                            name={field}
                                                            label={field.toUpperCase()}
                                                            placeholder={field.toUpperCase() + "..."}
                                                            icon={field === 'cpu' ? <Cpu size={18} /> : field === 'gpu' ? <Monitor size={18} /> : field === 'ram' ? <Database size={18} /> : <HardDrive size={18} />}
                                                            value={(formData as any)[field]}
                                                            onChange={handleChange}
                                                            className="rounded-2xl bg-black/[0.02] border-transparent group-hover:bg-white group-hover:border-primary/20 h-12 transition-all"
                                                        />
                                                        {techData && (
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1 animate-in fade-in zoom-in">
                                                                {field === 'cpu' && techData.cores && (
                                                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black h-5">{techData.cores} Cores</Badge>
                                                                )}
                                                                {field === 'ram' && techData.speed && (
                                                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black h-5">{techData.speed}MHz</Badge>
                                                                )}
                                                                {field === 'storage' && techData.devices?.[0]?.health && (
                                                                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100 text-[9px] font-black h-5">Health: {techData.devices[0].health}%</Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
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
                                                                            : "bg-white/80 text-secondary/60 border-black/5 hover:border-primary/20 hover:text-primary hover:shadow-md hover:shadow-primary/5 hover:bg-primary/[0.02]"
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
                                            );
                                        })}
                                    </div>

                                    {/* New Section for Battery and Display */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-black/[0.03]">
                                        {[
                                            { name: 'battery_capacity', label: 'حالة البطارية (Battery)', icon: <Zap size={18} />, component: 'Battery' },
                                            { name: 'display_size', label: 'دقة الشاشة (Display)', icon: <Monitor size={18} />, component: 'Display' }
                                        ].map((field) => {
                                            const hStatus = formData.hardware_status;
                                            const statusItem = hStatus.find((h: any) => h.componentName === field.component);
                                            let techData: any = null;
                                            if (statusItem?.comment) {
                                                try { techData = JSON.parse(statusItem.comment); } catch (e) {}
                                            }

                                            return (
                                                <div key={field.name} className="space-y-4 group">
                                                    <div className="relative">
                                                        <Input
                                                            name={field.name}
                                                            label={field.label}
                                                            placeholder={field.label + "..."}
                                                            icon={field.icon}
                                                            value={(formData as any)[field.name]}
                                                            onChange={handleChange}
                                                            className="rounded-2xl bg-black/[0.02] border-transparent group-hover:bg-white group-hover:border-primary/20 h-12 transition-all"
                                                        />
                                                        {techData && (
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1">
                                                                {field.component === 'Battery' && techData.cycles && (
                                                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black h-5">{techData.cycles} Cycles</Badge>
                                                                )}
                                                                {field.component === 'Display' && techData.refresh_rate && (
                                                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black h-5">{techData.refresh_rate}Hz</Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
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
                                        {formErrors.device_source && <p className="text-xs font-medium text-destructive px-4">{formErrors.device_source}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
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
                                        <div className="flex items-center gap-2">
                                            <input 
                                                id={`file-input-${s.component}`}
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e, s.component)}
                                            />
                                            {s.url && (
                                                <Badge variant="secondary" className="bg-green-500 text-white border-transparent py-1 animate-in zoom-in">تم إرفاق النتيجة</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div 
                                        className={cn(
                                            "p-6 space-y-4 transition-all duration-300",
                                            dragActiveComponent === s.component && "bg-primary/5 ring-2 ring-primary ring-inset rounded-b-[2rem]"
                                        )}
                                        onDragOver={(e) => handleDrag(e, s.component, true)}
                                        onDragLeave={(e) => handleDrag(e, s.component, false)}
                                        onDrop={(e) => handleDrop(e, s.component)}
                                    >
                                        {!s.url && !uploadingComponents.includes(s.component) ? (
                                            <div 
                                                onClick={() => document.getElementById(`file-input-${s.component}`)?.click()}
                                                className="border-2 border-dashed border-black/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer group/drop"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-black/[0.03] flex items-center justify-center text-secondary/40 group-hover/drop:bg-primary/10 group-hover/drop:text-primary transition-all">
                                                    <Plus size={24} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-black text-secondary">اسحب الصورة هنا أو اضغط للرفع</p>
                                                    <p className="text-[10px] text-secondary/40 font-bold uppercase mt-1">Image or Screenshot</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {s.url && (
                                                    <div className="relative aspect-video rounded-2xl overflow-hidden group/img animate-in fade-in zoom-in duration-300 bg-black/5 shadow-inner">
                                                        <img src={s.url} className="w-full h-full object-contain" alt={s.component} />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            <Button 
                                                                variant="destructive" 
                                                                size="sm" 
                                                                className="rounded-full h-9 text-[10px]" 
                                                                onClick={() => handleTestScreenshotAdd(s.component, '')}
                                                            >
                                                                <Trash2 size={14} className="ml-1" /> حذف الصورة
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="rounded-full h-9 text-[10px] bg-white border-transparent text-primary hover:bg-white/90" 
                                                                onClick={() => document.getElementById(`file-input-${s.component}`)?.click()}
                                                            >
                                                                <Camera size={14} className="ml-1" /> تغيير الصورة
                                                            </Button>
                                                        </div>
                                                        {dragActiveComponent === s.component && (
                                                            <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in">
                                                                <div className="bg-white/90 p-4 rounded-2xl shadow-xl flex items-center gap-2 scale-110 transition-transform">
                                                                    <Plus size={20} className="text-primary" />
                                                                    <span className="text-sm font-black text-primary">افلت لاستبدال الصورة</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {uploadingComponents.includes(s.component) && !s.url && (
                                                    <div className="aspect-video rounded-2xl bg-black/[0.02] border border-black/5 flex flex-col items-center justify-center gap-3">
                                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                        <p className="text-[10px] font-black text-primary animate-pulse">جاري الرفع...</p>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="space-y-4 pt-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-secondary/40 uppercase px-1">رابط صورة نتيجة الاختبار (أو اسحبها أعلاه)</label>
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
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
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
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-2">
                                            <ImageIcon size={14} className="text-primary/60" />
                                            <h4 className="text-[11px] font-black text-secondary/60 uppercase tracking-widest">صور الجهاز (خارجي)</h4>
                                        </div>

                                        <div 
                                            className={cn(
                                                "border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer overflow-hidden relative w-full",
                                                isExternalDragActive 
                                                    ? "border-primary bg-primary/[0.05] ring-4 ring-primary/10 ring-inset" 
                                                    : "border-black/5 bg-black/[0.01] hover:bg-black/[0.02] hover:border-black/10"
                                            )}
                                            onDragOver={(e) => handleDrag(e, 'external', true)}
                                            onDragLeave={(e) => handleDrag(e, 'external', false)}
                                            onDrop={(e) => handleDrop(e, 'external')}
                                            onClick={() => document.getElementById('external-image-upload')?.click()}
                                        >
                                            <input 
                                                id="external-image-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                multiple
                                                onChange={handleExternalImageInputChange}
                                            />
                                            {isExternalUploading && (
                                                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-10">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <p className="text-xs font-black text-primary animate-pulse">جاري رفع الصور...</p>
                                                </div>
                                            )}
                                            <div className={cn(
                                                "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                                                isExternalDragActive ? "bg-primary text-white scale-110" : "bg-primary/10 text-primary"
                                            )}>
                                                <ImageIcon size={32} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-black text-secondary">اسحب صور الجهاز هنا</p>
                                                <p className="text-sm text-secondary/40 font-bold mt-1">سيتم رفع الصور تلقائياً وتحويلها لروابط</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-black/[0.01] p-1 pr-5 rounded-full border border-black/5">
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Link2 size={14} className="text-secondary/30" />
                                            </div>
                                            <Input
                                                id="device-image-url-input"
                                                placeholder="أو أضف رابط صورة يدوياً هنا..."
                                                value={imageInput}
                                                onChange={(e) => setImageInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleDeviceImageAdd();
                                                    }
                                                }}
                                                className="rounded-full border-transparent bg-transparent h-11 text-xs flex-1 focus:ring-0 font-medium"
                                            />
                                            <Button type="button" onClick={handleDeviceImageAdd} className="rounded-full h-10 px-6 shadow-md shadow-primary/10 text-xs font-bold" icon={<Plus size={16} />}>إضافة</Button>
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
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-2">
                                            <Video size={14} className="text-primary/60" />
                                            <h4 className="text-[11px] font-black text-secondary/60 uppercase tracking-widest">فيديو الفحص</h4>
                                        </div>

                                        <div 
                                            className={cn(
                                                "border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer overflow-hidden relative w-full",
                                                isVideoDragActive 
                                                    ? "border-primary bg-primary/[0.05] ring-4 ring-primary/10 ring-inset" 
                                                    : "border-black/5 bg-black/[0.01] hover:bg-black/[0.02] hover:border-black/10"
                                            )}
                                            onDragOver={(e) => handleDrag(e, 'video', true)}
                                            onDragLeave={(e) => handleDrag(e, 'video', false)}
                                            onDrop={(e) => handleDrop(e, 'video')}
                                            onClick={() => document.getElementById('external-video-upload')?.click()}
                                        >
                                            <input 
                                                id="external-video-upload"
                                                type="file"
                                                className="hidden"
                                                accept="video/*"
                                                onChange={handleVideoInputChange}
                                            />
                                            {isVideoUploading && (
                                                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-10">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <p className="text-xs font-black text-primary animate-pulse">جاري رفع الفيديو...</p>
                                                </div>
                                            )}
                                            <div className={cn(
                                                "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                                                isVideoDragActive ? "bg-primary text-white scale-110" : "bg-primary/10 text-primary"
                                            )}>
                                                <Video size={32} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-black text-secondary">اسحب فيديو الفحص هنا</p>
                                                <p className="text-sm text-secondary/40 font-bold mt-1">أو اضغط لاختياره من جهازك (UPLOADS TO CATBOX)</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-black/[0.01] p-1 pr-5 rounded-full border border-black/5">
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Link2 size={14} className="text-secondary/30" />
                                            </div>
                                            <Input
                                                id="video-url-input"
                                                placeholder="أو أضف رابط فيديو يدوياً (YouTube, etc)..."
                                                value={videoInput}
                                                onChange={(e) => setVideoInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleVideoAdd();
                                                    }
                                                }}
                                                className="rounded-full border-transparent bg-transparent h-11 text-xs flex-1 focus:ring-0 font-medium"
                                            />
                                            <Button type="button" onClick={handleVideoAdd} className="rounded-full h-10 px-6 shadow-md shadow-primary/10 text-xs font-bold" icon={<Plus size={16} />}>إضافة</Button>
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

                {step === 4 && isUpdateMode && (
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

                <div className="sticky bottom-0 -mx-4 md:-mx-8 px-4 md:px-8 pt-4 pb-6 mt-8 bg-gradient-to-t from-white via-white/95 to-white/80 backdrop-blur-xl border-t border-black/[0.04] shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                    {/* Progress bar */}
                    <div className="h-1 w-full bg-black/[0.04] rounded-full mb-4 max-w-5xl mx-auto overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between max-w-5xl mx-auto">
                        <Button type="button" variant="outline" onClick={() => step > 1 ? handlePrevStep() : router.back()} className="rounded-full h-11 px-6 text-xs md:text-sm" icon={<ChevronRight size={17} />}>
                            {step === 1 ? 'إلغاء' : 'السابق'}
                        </Button>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-secondary/30 tabular-nums">{step}/{totalSteps}</span>
                            {step < totalSteps ? (
                                <Button type="button" onClick={handleNextStep} className="rounded-full h-11 px-6 sm:px-8 shadow-lg shadow-primary/20 text-xs md:text-sm" icon={<ChevronLeft size={17} />}>المتابعة</Button>
                            ) : (
                                <Button type="button" onClick={handleSubmit} disabled={isLoading} className="rounded-full h-11 px-6 sm:px-10 shadow-xl shadow-primary/25 hover:scale-[1.03] active:scale-[0.98] transition-all text-xs md:text-sm" icon={isLoading ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}>
                                    {isLoading ? 'جاري الحفظ...' : (reportId ? (isUpdateMode ? 'حفظ التحديث' : 'تحديث التقرير') : 'حفظ التقرير')}
                                </Button>
                            )}
                        </div>
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

