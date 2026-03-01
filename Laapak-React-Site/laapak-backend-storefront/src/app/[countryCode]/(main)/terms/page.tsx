import { Metadata } from "next"

export const metadata: Metadata = {
    title: "الشروط والأحكام | لابك",
    description: "تم إعداد هذه الشروط والأحكام بما يتوافق مع أحكام قانون حماية المستهلك المصري رقم 181 لسنة 2018 ولائحته التنفيذية.",
}

export default function TermsAndConditionsPage() {
    return (
        <div className="py-12 md:py-24 bg-gray-50/30">
            <div className="content-container max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">الشروط والأحكام</h1>
                    <p className="text-laapak-gray text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto">
                        نلتزم بالشفافية، وحماية حقوق المستهلك، وتقديم تجربة شراء عادلة وآمنة. تم إعداد هذه الشروط والأحكام بما يتوافق مع أحكام قانون حماية المستهلك المصري رقم 181 لسنة 2018 ولائحته التنفيذية.
                    </p>
                </div>

                {/* Content Blocks */}
                <div className="flex flex-col gap-8">

                    <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-4 border-gray-100">أولًا: تعريفات</h2>
                        <ul className="space-y-3 text-laapak-gray text-base leading-relaxed list-disc list-inside">
                            <li><strong className="text-gray-900">الشركة:</strong> Laapak.</li>
                            <li><strong className="text-gray-900">العميل / المستهلك:</strong> كل من يقوم بشراء منتج أو الاستفادة من خدمة مقدمة من Laapak.</li>
                            <li><strong className="text-gray-900">المنتج:</strong> أي جهاز إلكتروني أو ملحق يتم بيعه من خلال Laapak.</li>
                        </ul>
                    </section>

                    <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-4 border-gray-100">1. حالة الأجهزة</h2>
                        <ul className="space-y-3 text-laapak-gray text-base leading-relaxed list-disc list-inside marker:text-laapak-green">
                            <li>جميع الأجهزة يتم بيعها بالحالة الموضحة تفصيليًا وقت البيع ووفقًا لتقرير الفحص المُسلَّم للعميل.</li>
                            <li>قد تكون الأجهزة جديدة، مستعملة، أو مجددة، ويتم توضيح حالة كل جهاز بشكل صريح قبل إتمام الشراء.</li>
                            <li>العيوب أو الاختلافات الشكلية البسيطة التي لا تؤثر على كفاءة التشغيل أو الأداء الوظيفي للجهاز لا تُعد عيبًا يجيز الفسخ أو الاستبدال.</li>
                        </ul>
                    </section>

                    <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-4 border-gray-100">2. تقرير الفحص</h2>
                        <ul className="space-y-3 text-laapak-gray text-base leading-relaxed list-disc list-inside marker:text-laapak-green">
                            <li>تقرير الفحص يوضح الحالة الفنية والظاهرية للجهاز وقت التسليم فقط.</li>
                            <li>يُعد التقرير مستندًا معتمدًا لإثبات حالة الجهاز عند البيع طبقًا لقانون حماية المستهلك.</li>
                            <li>توقيع العميل أو استلامه للجهاز يُعد إقرارًا بالاطلاع على تقرير الفحص والموافقة على محتواه.</li>
                        </ul>
                    </section>

                    <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-4 border-gray-100">3. الضمان</h2>
                        <ul className="space-y-3 text-laapak-gray text-base leading-relaxed list-disc list-inside marker:text-laapak-green">
                            <li>الضمان – إن وجد – يكون موضحًا في فاتورة الشراء ويلتزم بالمدة والشروط المحددة بها.</li>
                            <li>يشمل الضمان العيوب الصناعية أو الفنية غير الناتجة عن سوء الاستخدام.</li>
                            <li>لا يشمل الضمان الحالات التالية:
                                <ul className="mt-2 mr-6 space-y-2 text-laapak-gray list-circle">
                                    <li>سوء الاستخدام أو الإهمال.</li>
                                    <li>الكسر أو الشرخ.</li>
                                    <li>تعرض الجهاز للسوائل أو الرطوبة.</li>
                                    <li>محاولات الصيانة أو الفك خارج مراكز Laapak المعتمدة.</li>
                                </ul>
                            </li>
                            <li>لا يخل ذلك بحقوق المستهلك المقررة قانونًا في حالة ثبوت عيب جوهري أو غش.</li>
                        </ul>
                    </section>

                    <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4 border-gray-100">4. الاستبدال والاسترجاع (وفقًا لقانون حماية المستهلك)</h2>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3">4.1 حق الاستبدال أو الاسترجاع خلال 14 يومًا</h3>
                                <ul className="space-y-2 text-laapak-gray text-base leading-relaxed list-disc list-inside marker:text-laapak-green">
                                    <li>يحق للمستهلك استبدال أو استرجاع المنتج خلال 14 يومًا من تاريخ الاستلام، بشرط:
                                        <ul className="mt-2 mr-6 space-y-2 text-laapak-gray list-circle">
                                            <li>أن يكون المنتج بالحالة التي تم استلامه عليها.</li>
                                            <li>عدم وجود تلف أو ضرر ناتج عن سوء الاستخدام.</li>
                                            <li>وجود مشكلة في الجهاز تستدعي الاستبدال او الاسترجاع بأقرار من مركزنا Fix Zone.</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3">4.2 الحالات التي لا يجوز فيها الاسترجاع أو الاستبدال</h3>
                                <p className="text-laapak-gray mb-2 font-bold">وفقًا للقانون، لا يسري حق الاسترجاع أو الاستبدال في الحالات التالية:</p>
                                <ul className="space-y-2 text-laapak-gray text-base leading-relaxed list-disc list-inside marker:text-red-500">
                                    <li>إذا كان العيب ناتجًا عن سوء استخدام المستهلك.</li>
                                    <li>إذا تم إجراء تعديل أو تخصيص خاص بناءً على طلب العميل (مثل: ليزر الكيبورد أو تجهيزات مخصصة).</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3">4.3 آلية الفحص</h3>
                                <ul className="space-y-2 text-laapak-gray text-base leading-relaxed list-disc list-inside marker:text-laapak-green">
                                    <li>يتم قبول طلب الاستبدال أو الاسترجاع بعد فحص الجهاز من خلال مركز Fix Zone.</li>
                                    <li>في حال عدم ثبوت وجود عيب فني أو صناعي، لا تلتزم Laapak بقبول الاسترجاع أو الاستبدال.</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3">4.4 في حالة الاسترجاع المالي</h3>
                                <ul className="space-y-2 text-laapak-gray text-base leading-relaxed list-disc list-inside marker:text-laapak-green">
                                    <li>يتم رد قيمة المنتج خلال مدة لا تتجاوز 14 يومًا من تاريخ الموافقة على الاسترجاع.</li>
                                    <li>يتم خصم:
                                        <ul className="mt-2 mr-6 space-y-2 text-laapak-gray list-circle">
                                            <li>قيمة الشحن (في حال كان الشحن مجانيًا عند الشراء).</li>
                                            <li>قيمة أي خدمات أو إضافات خاصة تم تنفيذها بناءً على طلب العميل.</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-4 border-gray-100">5. المسؤولية</h2>
                        <ul className="space-y-3 text-laapak-gray text-base leading-relaxed list-disc list-inside">
                            <li>Laapak غير مسؤولة عن أي أضرار ناتجة عن سوء الاستخدام أو الاستخدام المخالف لتعليمات التشغيل.</li>
                            <li>في جميع الأحوال، لا تتجاوز المسؤولية القانونية لـ Laapak قيمة المنتج المدفوعة من قبل العميل.</li>
                            <li>لا يؤثر هذا البند على حقوق المستهلك القانونية المقررة بموجب قانون حماية المستهلك.</li>
                        </ul>
                    </section>

                    <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-4 border-gray-100">6. خدمة ما بعد البيع والشكاوى</h2>
                        <ul className="space-y-3 text-laapak-gray text-base leading-relaxed list-disc list-inside">
                            <li>تلتزم Laapak بتوفير خدمة عملاء لتلقي الشكاوى والاستفسارات.</li>
                            <li>في حال وجود نزاع، يحق للمستهلك اللجوء إلى جهاز حماية المستهلك المصري وفقًا للإجراءات القانونية المعمول بها.</li>
                        </ul>
                    </section>

                    <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-4 border-gray-100">7. تعديل الشروط والأحكام</h2>
                        <ul className="space-y-3 text-laapak-gray text-base leading-relaxed list-disc list-inside">
                            <li>تحتفظ Laapak بحق تعديل هذه الشروط والأحكام في أي وقت.</li>
                            <li>يتم تطبيق الشروط السارية وقت إتمام عملية الشراء.</li>
                        </ul>
                    </section>

                </div>
            </div>
        </div>
    )
}
