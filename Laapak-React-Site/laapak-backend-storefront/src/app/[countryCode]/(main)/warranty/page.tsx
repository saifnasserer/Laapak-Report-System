import { Metadata } from "next"

export const metadata: Metadata = {
    title: "سياسة الضمان | لابك",
    description: "تعرف على سياسة الضمان المرنة من لابك، والتي تشمل ضمان 6 شهور ضد عيوب الصناعة وصيانة دورية مجانية لمدة عام كامل.",
}

export default function WarrantyPage() {
    return (
        <div className="py-12 md:py-24 bg-gray-50/30">
            <div className="content-container max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">سياسة الضمان</h1>
                    <p className="text-laapak-gray text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                        تلتزم شركتنا بتقديم تجربة ما بعد البيع الأفضل من خلال سياسة ضمان واضحة ومرنة مصممة لحماية عملائنا وضمان رضاهم التام.
                    </p>
                </div>

                {/* Content Blocks */}
                <div className="flex flex-col gap-10">

                    {/* Main Warranty Section */}
                    <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-laapak-green/60"></div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-laapak-green/10 text-laapak-green text-lg">1</span>
                            ضمان 6 شهور ضد عيوب الصناعة
                        </h2>
                        <ul className="space-y-4 text-laapak-gray text-base md:text-lg leading-loose list-disc list-inside marker:text-laapak-green">
                            <li>يغطي جميع الأعطال الناتجة عن عيوب التصنيع أو مكونات الجهاز الأساسية.</li>
                        </ul>
                    </div>

                    {/* 14 Days Exchange Section */}
                    <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-orange-500/60"></div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-50 text-orange-500 text-lg">2</span>
                            ضمان الاستبدال والاسترجاع (خلال 14 يوم)
                        </h2>
                        <ul className="space-y-4 text-laapak-gray text-base md:text-lg leading-loose list-disc list-inside marker:text-orange-500">
                            <li>بيتم استبدال اللابتوب بأخر من نفس الموديل او بموديل اخر فقط في حالة وجود مشكلة وتأكيدها من خلال مركز الضمان الخاص بنا (فيكس زون).</li>
                        </ul>
                    </div>

                    {/* Periodic Maintenance Section */}
                    <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-blue-500/60"></div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-lg">3</span>
                            صيانة دورية مجانية لمدة عام كامل
                        </h2>
                        <p className="text-laapak-gray text-base md:text-lg leading-loose mb-6">
                            ايمانا منا ان الصيانة الدورية شئ مهم جدا نتيجة لكم الاعطال الي اشتغل عليها قسم الصيانة عندنا و كان سببها الاساسي عدم الاهتمام بالصيانة الدورية ، بالاضافة لانها جزء مهم عشان تخلي جهازك يعيش معاك اطول وقت ممكن بنفس الاداء السلس وكأنك لسه مشتريه وفرناليك ضمان لــ خدمة الصيانة الدورية لمدة سنة كاملة بحيث تتم مرتين كل 6 اشهر مجانيه تماماً لما مركز الضمان يستلم اللابتوب،
                            <span className="block mt-4 text-green-700 font-bold bg-green-50/80 px-4 py-3 rounded-lg border border-green-100/50">
                                مع العلم إن تكلفة هذه الصيانة تتراوح عادةً بين 800 إلى 1200 جنيه للمرة الواحدة، ولكنها مجانية بالكامل لأول مرتين على حسابنا.
                            </span>
                        </p>
                        <ul className="space-y-3 text-laapak-gray text-base md:text-lg leading-relaxed bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                            <li className="flex items-start gap-3">
                                <span className="text-blue-500 font-bold mt-1">1-</span>
                                <span>بيتم تغيير المعجون الحراري (الثيرمل بيست) بنوع يناسب الجهاز.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-blue-500 font-bold mt-1">2-</span>
                                <span>ازاله الأكسده من علي الهيت ثينك… الي بفعلها بتمنع نقل درجه الحراره بنسبه 40٪.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-blue-500 font-bold mt-1">3-</span>
                                <span>بيتم فحص RPM الفانات و في حاله تأثره بالاتربه بيتم تنظيف الفانات و ارجاعها لحالتها الاصليه.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-blue-500 font-bold mt-1">4-</span>
                                <span>تنظيف المازربورد كامله و تنظيف جميع فلاتاتها.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-blue-500 font-bold mt-1">5-</span>
                                <span>عمل فحص كامل علي مكونات الجهاز بحيث ان لو في مكون علي وشك التلف نكون عرفين من قبليها.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-blue-500 font-bold mt-1">6-</span>
                                <span>تنظيف الجهاز بشكل كامل من الخارج لحد منرجعه كانه جديد 👌.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Exclusions Section */}
                    <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-red-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-2 h-full bg-red-500/60"></div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-red-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            شروط استبعاد الضمان
                        </h2>
                        <ul className="space-y-4 text-laapak-gray text-base md:text-lg leading-loose list-disc list-inside marker:text-red-500">
                            <li>ضمان الهارد HDD شهر ، ضمان البطارية والشاحن والاكسسوار شهر واحد.</li>
                            <li>لايسري الضمان علي سوء الاستخدام والكسر والكهرباء الجهد العالي وما شابه ذلك.</li>
                            <li>لا يسري الضمان عند نزل الاستيكر الخاص بالشركه او محاولة فتح او صيانه الجهاز خارج الشركه.</li>
                            <li>الضمان يشمل عيوب الصناعه فقط ولا يشمل السوفت وير وما شابه ذلك.</li>
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    )
}
