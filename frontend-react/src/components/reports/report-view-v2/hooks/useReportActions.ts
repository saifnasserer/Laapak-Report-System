import { useState, useEffect } from 'react';
import api, { confirmReport } from '@/lib/api';

export function useReportActions(
    id: string,
    report: any,
    setReport: (fn: any) => void,
    isConfirmed: boolean,
    setIsConfirmed: (val: boolean) => void,
    setActiveStep: (step: number) => void
) {
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'vodafone_cash' | 'instapay' | null>(null);

    // Modal and sub-action states
    const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
    const [sourceDetails, setSourceDetails] = useState('');
    const [warehouseSubmitting, setWarehouseSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (report) {
            if (report.selected_accessories) {
                const accessories = typeof report.selected_accessories === 'string'
                    ? JSON.parse(report.selected_accessories)
                    : report.selected_accessories;
                setCartItems(Array.isArray(accessories) ? accessories : []);
            }
            if (report.payment_method) {
                setSelectedPaymentMethod(report.payment_method);
            }
        }
    }, [report]);

    const toggleCartItem = (product: any) => {
        setCartItems(prev => {
            const isSelected = prev.find(item => item.id === product.id);
            if (isSelected) {
                return prev.filter(item => item.id !== product.id);
            }
            return [...prev, product];
        });
    };

    const calculateFinalTotal = (methodOverride?: string | null) => {
        if (!report) return { baseTotal: 0, fee: 0, finalTotal: 0, feeReason: '' };
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

    return {
        cartItems,
        toggleCartItem,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        calculateFinalTotal,
        submitConfirmation,
        handleConfirmOrder,
        handleFinalConfirmation,
        handlePrint,
        updateStatus,
        warehouseModalOpen,
        setWarehouseModalOpen,
        sourceDetails,
        setSourceDetails,
        warehouseSubmitting,
        showPaymentModal,
        setShowPaymentModal,
        pendingStatus,
        setPendingStatus,
        isCreatingInvoice,
        showTrackingModal,
        setShowTrackingModal,
        paymentModalOpen,
        setPaymentModalOpen,
        shareModalOpen,
        setShareModalOpen,
        isCopied,
        setIsCopied,
        handleAssignToWarehouse
    };
}
