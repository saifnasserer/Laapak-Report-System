import React from 'react';
import {
    Cpu,
    Monitor as MonitorIcon,
    Battery,
    HardDrive,
    Keyboard,
    MousePointer2,
    Database,
    Wifi,
    Bluetooth,
    Usb,
    Activity,
    Camera,
    Thermometer,
    Search,
    CheckCircle2
} from 'lucide-react';
import { statusMap } from './constants';

export const getGradeColor = (grade: any) => {
    const g = String(grade || '').toUpperCase();
    if (g.startsWith('A') || g === '100' || g === 'READY' || parseInt(g, 10) >= 85) return 'text-emerald-600';
    if (g.startsWith('B') || g.startsWith('C') || parseInt(g, 10) >= 65) return 'text-amber-600';
    return 'text-rose-600';
};

export const getStatusInfo = (status: string) => {
    return statusMap[status] || { label: status || 'غير معروف', variant: 'outline' };
};

export const getComponentNameArabic = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('keyboard')) return 'فحص لوحة المفاتيح';
    if (n.includes('screen')) return 'فحص الشاشة الخارجي';
    return name || 'صورة المعاينة';
};

export const getComponentIcon = (name: string, size = 14) => {
    const lowerName = (name || '').toLowerCase();
    if (lowerName.includes('cpu') || lowerName.includes('processor')) return React.createElement(Cpu, { size });
    if (lowerName.includes('gpu') || lowerName.includes('graphics')) return React.createElement(MonitorIcon, { size });
    if (lowerName.includes('battery')) return React.createElement(Battery, { size });
    if (lowerName.includes('ssd') || lowerName.includes('hdd') || lowerName.includes('storage') || lowerName.includes('disk')) return React.createElement(HardDrive, { size });
    if (lowerName.includes('keyboard')) return React.createElement(Keyboard, { size });
    if (lowerName.includes('touchpad') || lowerName.includes('mouse')) return React.createElement(MousePointer2, { size });
    if (lowerName.includes('screen') || lowerName.includes('display')) return React.createElement(MonitorIcon, { size });
    if (lowerName.includes('ram') || lowerName.includes('memory')) return React.createElement(Database, { size });
    if (lowerName.includes('wifi') || lowerName.includes('network')) return React.createElement(Wifi, { size });
    if (lowerName.includes('bluetooth')) return React.createElement(Bluetooth, { size });
    if (lowerName.includes('port') || lowerName.includes('usb')) return React.createElement(Usb, { size });
    if (lowerName.includes('audio') || lowerName.includes('sound')) return React.createElement(Activity, { size });
    if (lowerName.includes('camera')) return React.createElement(Camera, { size });
    if (lowerName.includes('thermal') || lowerName.includes('temp')) return React.createElement(Thermometer, { size });
    if (lowerName.includes('interactive')) return React.createElement(CheckCircle2, { size });
    return React.createElement(Search, { size });
};

export const getComponentTitle = (name: string) => {
    const lowerName = (name || '').toLowerCase();
    if (lowerName === 'info' || lowerName === 'sys info') return 'تفاصيل اللابتوب';
    if (lowerName.includes('cpu stress') || lowerName === 'cpu' || lowerName.includes('processor')) return 'اختبار البروسيسور';
    if (lowerName.includes('ram stress') || lowerName === 'ram' || lowerName.includes('memory')) return 'اختبار الرامات';
    if (lowerName.includes('gpu stress') || lowerName === 'gpu' || lowerName.includes('graphics')) return 'اختبار كارت الشاشة';
    if (lowerName.includes('disk stress') || lowerName.includes('storage stress') || lowerName === 'storage' || lowerName.includes('ssd') || lowerName.includes('hdd')) return 'اختبار الهارد';
    if (lowerName.includes('battery')) return 'البطارية';
    if (lowerName.includes('screen') || lowerName.includes('display')) return 'فحص جودة الشاشة والبكسلات';
    if (lowerName.includes('keyboard')) return 'اختبار الكيبورد';
    if (lowerName.includes('touchpad')) return 'اختبار لوحة اللمس';
    if (lowerName === 'dxdiag') return 'اختبار DxDiag';
    if (lowerName.includes('wifi') || lowerName.includes('network')) return 'اختبار الواي فاي';
    if (lowerName.includes('bluetooth')) return 'اختبار البلوتوث';
    if (lowerName.includes('port') || lowerName.includes('usb')) return 'اختبار المنافذ';
    if (lowerName.includes('audio') || lowerName.includes('sound')) return 'اختبار الصوت';
    if (lowerName.includes('camera')) return 'اختبار الكاميرا';
    if (lowerName.includes('interactive')) return 'الاختبارات التفاعلية';
    return name ? `اختبار ${name}` : 'فحص فني';
};

export const getTestDescription = (name: string) => {
    const comp = (name || '').toLowerCase();
    if (comp.includes('cpu')) return 'اختبار ضغط كامل على المعالج لمدة محددة — نضغط عليه لأقصى طاقته عشان نتأكد إنه شغال بكفاءة 100٪ ومش بيسخن بشكل مفرط تحت الحمل الكامل.';
    if (comp.includes('ram') || comp.includes('memory')) return 'اختبار سرعة الرامات وسلامتها عن طريق الكتابة والقراءة المتواصلة — بنتحقق من الباندويدث الفعلية وإنه مفيش أي خلايا معيبة في الميموري.';
    if (comp.includes('gpu') || comp.includes('graphics')) return 'اختبار ضغط على كارت الشاشة — بنشتغل عليه بأقصى حمل عشان نتأكد إن الحرارة مظبوطة والأداء ثابت ومفيش أي تشطيب أو كراش تحت الضغط.';
    if (comp.includes('disk') || comp.includes('hdd') || comp.includes('ssd') || comp.includes('storage')) return 'اختبار أداء القرص بالقراءة والكتابة المتتالية والعشوائية — بنقيس السرعات الفعلية ونراجع حالة صحة القرص SMART للتأكد من سلامته.';
    if (comp.includes('battery')) return 'بيانات البطارية من الفحص التقني — بتوضح الصحة الفعلية مقارنة بالسعة الأصلية، وعدد دورات الشحن المتبقية.';
    if (comp.includes('display') || comp.includes('screen')) return 'مواصفات الشاشة المكتشفة — الدقة ومعدل التحديث والحجم.';
    if (comp.includes('keyboard')) return 'نتيجة فحص لوحة المفاتيح — تم اختبار كل مفتاح يدوياً للتحقق من الاستجابة الكاملة.';
    if (comp.includes('interactive')) return 'اختبارات تفاعلية تتطلب تدخل التقني — فحص الكاميرا والصوت والميكروفون والتاتش باد يدوياً.';
    if (comp.includes('touchpad')) return 'اختبرنا لوحة اللمس للتأكد من استجابتها للحركة والإيماءات المتعددة والنقرات.';
    if (comp.includes('wifi') || comp.includes('network')) return 'تم فحص الواي فاي للتأكد من اكتشاف الشبكات وجودة الإشارة وسرعة الاتصال بالشبكات اللاسلكية.';
    if (comp.includes('bluetooth')) return 'تم فحص البلوتوث للتأكد من قدرته على اكتشاف الأجهزة المجاورة والاتصال بها بسلاسة.';
    if (comp.includes('port') || comp.includes('usb')) return 'تم فحص جميع المنافذ للتأكد من سلامتها الكهربائية وقدرتها على التعرف على الأجهزة المتصلة.';
    if (comp.includes('info')) return 'دي شاشة معلومات الجهاز الأساسية، بتوريك إن كل القطع اللي اتفقنا عليها موجودة صح (زي المعالج، والرامات، وكارت الشاشة والـ Serial Number).';
    if (comp.includes('dxdiag')) return 'ملخص أداة dxdiag، دي أداة بتجمع تقرير كامل عن الجهاز من كارت الشاشة والرامات لنظام التشغيل، وبنتأكد منها إن مفيش أي مشاكل في التعريفات.';
    if (comp.includes('audio') || comp.includes('sound')) return 'تم فحص نظام الصوت للتأكد من عمل مكبرات الصوت والميكروفون بشكل طبيعي.';
    if (comp.includes('camera')) return 'تم فحص الكاميرا للتأكد من وضوح الصورة وعمل التعريفات بشكل صحيح.';
    return 'نتيجة الفحص التقني التفصيلي لهذا المكون — تم الاختبار وتسجيل النتائج بدقة.';
};
