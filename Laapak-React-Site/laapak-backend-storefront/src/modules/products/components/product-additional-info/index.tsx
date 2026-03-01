import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"
import Back from "@modules/common/icons/back"

export default function ProductAdditionalInfo() {
    return (
        <div className="flex flex-col gap-y-4 pt-6 mt-6 border-t border-gray-200 text-sm text-gray-700">
            <div className="flex items-start gap-x-3">
                <FastDelivery />
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">شحن سريع ومجاني</span>
                    <span className="text-gray-500">توصيل خلال أسبوع عمل</span>
                </div>
            </div>
            <div className="flex items-start gap-x-3">
                <Refresh />
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">ضمان لاابك الشامل</span>
                    <span className="text-gray-500">ضمان ٣ شهور ضد عيوب الصناعة</span>
                </div>
            </div>
            <div className="flex items-start gap-x-3">
                <Back />
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">استرجاع سهل ومضمون</span>
                    <span className="text-gray-500">استرجاع مجاني خلال ١٤ يوم</span>
                </div>
            </div>
        </div>
    )
}
