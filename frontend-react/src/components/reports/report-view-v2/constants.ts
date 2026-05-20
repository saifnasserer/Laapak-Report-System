export const ACCESSORIES_CATEGORY_ID = 'pcat_01KJX49W9EFHXGNJKY27C27X53';
export const MEDUSA_PUBLISHABLE_KEY = 'pk_bd9f45a9c0ade51d0ea290181c841fae2ed8e5436cd6fd60285fcd5b80841dfa';
export const MEDUSA_BASE_URL = '/medusa';

export const steps = [
    { id: 1, title: 'البيانات والمواصفات' },
    { id: 2, title: 'المعاينة الخارجية' },
    { id: 3, title: 'الفحص التقني' },
    { id: 4, title: 'الفحص الداخلي' },
    { id: 5, title: 'إضافات مهمة!' },
    { id: 7, title: 'تأكيد ومشاركة' },
];

export const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'primary' | 'destructive' | 'outline' }> = {
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
