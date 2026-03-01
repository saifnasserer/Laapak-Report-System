import { Heading } from "@medusajs/ui"

const steps = [
    {
        title: "فحص كامل وشامل",
        description: "Stress Test للبروسيسور والفيجا، مراجعة الحرارة والأداء، وفحص شامل لكل المكونات لضمان جودة 100%.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        ),
    },
    {
        title: "معاينة وتقرير مفصل",
        description: "بنصوّر الجهاز 360° وبنبعتلك تقرير فني تفصيلي بكل النتائج عشان تشوف حالة الجهاز بوضوح قبل ما يوصلك.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
            </svg>
        ),
        showReport: true
    },
    {
        title: "استلامك اختيارك",
        description: "تقدر تختار الاستلام من مقرنا أو التوصيل لحد باب البيت بآمان وسرعة تامة.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
        ),
    },
]

const LaapakProcess = () => {
    return (
        <div className="py-10 md:py-16 bg-white relative overflow-hidden">
            <div className="content-container relative z-10">
                <div className="text-center mb-12 md:mb-20 flex flex-col gap-4">
                    <Heading level="h2" className="text-[1.1rem] sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 uppercase tracking-tight whitespace-nowrap">
                        رحلة جهازك مع <span className="text-laapak-green underline decoration-laapak-green/30 decoration-8 underline-offset-8">لابك</span>
                    </Heading>
                    <p className="text-laapak-gray max-w-2xl mx-auto font-medium leading-relaxed">
                        جدير بالذكر ان نوضح لحضرتك أول ما تعمل الأوردر من خلال موقعنا، بنبدأ رحلة الفحص والتوثيق دي:
                    </p>
                </div>

                <div className="relative flex flex-col lg:flex-row-reverse justify-between items-center lg:items-start gap-12 lg:gap-8">
                    {/* Connector Line (Desktop) */}
                    <div className="hidden lg:block absolute top-16 right-0 left-0 h-px bg-laapak-green/15 -z-10 mx-36" />

                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col items-center text-center flex-1 group">
                            {/* Circle container */}
                            <div className="relative mb-6">
                                {/* Outer ring */}
                                <div
                                    style={{ width: 128, height: 128 }}
                                    className="rounded-full bg-white border border-gray-100 flex items-center justify-center transition-all hover:border-laapak-green hover:shadow-xl hover:shadow-laapak-green/5"
                                >
                                    {/* Inner coloured circle */}
                                    <div
                                        style={{ width: 96, height: 96 }}
                                        className="rounded-full bg-laapak-green/5 flex items-center justify-center text-laapak-green group-hover:scale-110 transition-transform duration-500 group-hover:bg-laapak-green/10"
                                    >
                                        {step.icon}
                                    </div>
                                </div>
                                {/* Step Number Badge – sits on top-right edge of outer ring */}
                                <div
                                    className="absolute -top-2 -right-2 flex items-center justify-center rounded-full bg-laapak-green text-white font-bold text-sm shadow-md"
                                    style={{ width: 32, height: 32 }}
                                >
                                    {index + 1}
                                </div>
                            </div>

                            <h3 className="text-[1.1rem] sm:text-xl md:text-2xl font-black text-gray-900 mb-3 whitespace-nowrap">{step.title}</h3>
                            <p className="text-laapak-gray font-medium leading-relaxed max-w-[280px] mb-4">
                                {step.description}
                            </p>

                            {step.showReport && (
                                <a
                                    href="https://reports.laapak.com/ar/reports/RPT1756056398964824"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-black text-laapak-green hover:underline decoration-laapak-green/30 underline-offset-4 flex items-center gap-1"
                                >
                                    📄 مشاهدة عينة للتقرير
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Background Decorative Element */}
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-laapak-green/5 rounded-full blur-3xl -z-10" />
        </div>
    )
}

export default LaapakProcess
