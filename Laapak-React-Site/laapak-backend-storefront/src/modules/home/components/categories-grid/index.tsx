import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const categories = [
    {
        title: "أجهزة البيزنس",
        handle: "business",
        image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop",
        description: "ThinkPad, Latitude, EliteBook",
    },
    {
        title: "أجهزة الجيمنج",
        handle: "gaming",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop",
        description: "RTX Graphics, High Refresh Rate",
    },
    {
        title: "أجهزة الطلاب",
        handle: "students",
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop",
        description: "Lightweight, Long Battery Life",
    },
    {
        title: "أجهزة المبدعين",
        handle: "creators",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=600&auto=format&fit=crop",
        description: "MacBook, XPS, 4K Displays",
    },
]

const CategoriesGrid = () => {
    return (
        <div className="py-24 bg-gray-50/50">
            <div className="content-container">
                <div className="text-center mb-16 flex flex-col gap-4">
                    <Heading level="h2" className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 font-sans tracking-tight underline decoration-laapak-green decoration-4 underline-offset-8 uppercase whitespace-nowrap">تسوق حسب الفئة</Heading>
                    <p className="text-laapak-gray font-medium">اختر الفئة التي تناسب احتياجاتك اليومية</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category, index) => (
                        <LocalizedClientLink
                            key={index}
                            href={`/categories/${category.handle}`}
                            className="group relative h-80 rounded-2xl overflow-hidden border border-gray-100 transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl"
                        >
                            <img
                                src={category.image}
                                alt={category.title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-0 right-0 p-6 text-right w-full">
                                <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-laapak-green transition-colors">{category.title}</h3>
                                <p className="text-gray-300 text-sm font-medium">{category.description}</p>
                                <div className="mt-4 flex items-center justify-end gap-2 text-laapak-green opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-bold font-sans">تصفح الآن</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 rtl:rotate-180">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </div>
                            </div>
                        </LocalizedClientLink>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default CategoriesGrid
