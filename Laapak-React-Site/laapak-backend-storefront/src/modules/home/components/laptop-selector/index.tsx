import { Heading, Text } from "@medusajs/ui"


const LaptopSelector = () => {
    return (
        <div className="pb-10 pt-0 md:pb-16 md:pt-0 bg-white relative overflow-hidden">
            <div className="content-container relative z-10">
                <div className="text-right mb-12 md:mb-16 flex flex-col gap-4">
                    <Heading level="h2" className="text-[1.1rem] sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight whitespace-nowrap tracking-tight">
                        إزاي تختار اللابتوب المناسب ليك؟
                    </Heading>
                    <Text className="text-laapak-gray max-w-2xl text-lg font-medium leading-relaxed">
                        عشان تضمن إنك تجيب أكتر جهاز يناسب احتياجك، فيه خطوتين أساسيتين لازم تعملهم:
                    </Text>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Step 1: Budget and Usage */}
                    <div className="relative p-6 md:p-10 rounded-[40px] bg-gray-50 border border-gray-100 group transition-all hover:bg-white hover:shadow-2xl hover:shadow-laapak-green/5">
                        <div className="flex flex-col gap-8">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-laapak-green text-white flex items-center justify-center shadow-lg shadow-laapak-green/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="1" x2="12" y2="23" />
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-laapak-green text-white flex items-center justify-center shadow-lg shadow-laapak-green/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="4" y1="21" x2="4" y2="14" />
                                        <line x1="4" y1="10" x2="4" y2="3" />
                                        <line x1="12" y1="21" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12" y2="3" />
                                        <line x1="20" y1="21" x2="20" y2="16" />
                                        <line x1="20" y1="12" x2="20" y2="3" />
                                        <line x1="1" y1="14" x2="7" y2="14" />
                                        <line x1="9" y1="8" x2="15" y2="8" />
                                        <line x1="17" y1="16" x2="23" y2="16" />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Heading level="h3" className="text-[1.1rem] sm:text-xl md:text-2xl font-black text-gray-900 whitespace-nowrap">
                                    حدد ميزانيتك واستخدامك
                                </Heading>
                                <Text className="text-laapak-gray text-lg font-medium leading-relaxed">
                                    أول حاجة لازم تحددها هي <span className="text-gray-900 font-bold underline decoration-laapak-green/30 decoration-4">الميزانية</span> اللي مسموح بيها، وبعدين <span className="text-gray-900 font-bold underline decoration-laapak-green/30 decoration-4">نوع استخدامك</span> (دراسة، جرافيك، جيمنج، أو شغل مكتبي).
                                </Text>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Compare or Help */}
                    <div className="relative p-6 md:p-10 rounded-[40px] bg-gray-50 border border-gray-100 group transition-all hover:bg-white hover:shadow-2xl hover:shadow-laapak-green/5">
                        <div className="flex flex-col gap-8">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg shadow-gray-900/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Heading level="h3" className="text-[1.1rem] sm:text-xl md:text-2xl font-black text-gray-900 whitespace-nowrap">
                                    قارن أو اطلب مساعدتنا
                                </Heading>
                                <Text className="text-laapak-gray text-lg font-medium leading-relaxed">
                                    بعد ما تحدد ميزانيتك، تقدر تقارن بين الموديلات المتاحة في نفس الفئة السعرية، أو لو محتار، <span className="text-laapak-green font-black underline decoration-laapak-green/20 decoration-4 cursor-pointer hover:text-laapak-green/80 transition-colors">كلمنا فوراً</span> وإحنا هنساعدك تختار الأفضل ليك ولجيبك.
                                </Text>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Optional help banner */}
                <div className="mt-16 bg-laapak-green rounded-[32px] p-1 items-center justify-center hidden md:flex">
                    <div className="bg-white/10 w-full h-full rounded-[30px] px-8 py-4 flex items-center justify-between border border-white/20">
                        <Text className="text-white font-bold text-[1rem] sm:text-[1.1rem] md:text-xl text-center md:text-right">محتاج مساعدة في الاختيار؟ فريقنا مستني مكالمتك</Text>
                        <div className="flex gap-4">
                            <a href="tel:01013148007" className="bg-white text-laapak-green px-6 py-2 rounded-xl font-black hover:bg-gray-50 transition-colors">اتصل بنا</a>
                            <a href="https://wa.me/01013148007" target="_blank" rel="noreferrer" className="bg-[#25D366] text-white px-6 py-2 rounded-xl font-black hover:opacity-90 transition-opacity">واتساب</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Decorative Element */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-laapak-green/5 rounded-full blur-3xl -z-10"></div>
        </div>
    )
}

export default LaptopSelector
