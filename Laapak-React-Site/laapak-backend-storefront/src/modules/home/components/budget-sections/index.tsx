import { Heading, Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import ProductSlider from "../product-slider"

type BudgetSectionsProps = {
    products: HttpTypes.StoreProduct[]
    region: HttpTypes.StoreRegion
}

const BudgetSections: React.FC<BudgetSectionsProps> = ({ products, region }) => {
    // Helper to get calculated price
    const getProductPrice = (product: HttpTypes.StoreProduct) => {
        return product.variants?.[0]?.calculated_price?.calculated_amount || 0
    }

    // Define Budget Ranges
    const sections = [
        {
            title: "لابتوب تحت ال 10 الاف",
            description: "حلول اقتصادية مميزة للمهام اليومية",
            accent: "border-blue-500",
            link: "/store?max_price=10000",
            products: products.filter(p => getProductPrice(p) < 10000)
        },
        {
            title: "لابتوب من 10 لـ 20 الف",
            description: "أداء متوازن للدراسة والعمل المكتبي",
            accent: "border-laapak-green",
            link: "/store?min_price=10000&max_price=20000",
            products: products.filter(p => {
                const price = getProductPrice(p)
                return price >= 10000 && price < 20000
            })
        },
        {
            title: "لابتوب من 20 لـ 30 الف",
            description: "أجهزة قوية للأعمال والمهام المتقدمة",
            accent: "border-orange-500",
            link: "/store?min_price=20000&max_price=30000",
            products: products.filter(p => {
                const price = getProductPrice(p)
                return price >= 20000 && price < 30000
            })
        },
        {
            title: "فوق ال 30 الف",
            description: "أقوى أجهزة البيزنس والجيمنج الاحترافية",
            accent: "border-purple-600",
            link: "/store?min_price=30000",
            products: products.filter(p => getProductPrice(p) >= 30000)
        }
    ].filter(section => section.products.length > 0)

    return (
        <div className="flex flex-col gap-8 md:gap-12 py-10 md:py-16">
            {sections.map((section, idx) => (
                <div key={idx} className="bg-white py-8 md:py-12 border-y border-gray-50/50">
                    <div className="content-container">
                        <div className="flex flex-row justify-between items-center mb-8 md:mb-10 gap-4">
                            <div className={`border-r-4 pr-4 md:pr-6 ${section.accent}`}>
                                <Heading level="h2" className="text-[1.1rem] sm:text-lg md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight whitespace-nowrap">
                                    {section.title}
                                </Heading>
                                <p className="text-laapak-gray text-sm md:text-base font-medium mt-1">{section.description}</p>
                            </div>

                            <a href={section.link} className="no-underline">
                                <Button variant="transparent" className="rounded-full px-4 md:px-6 py-2 md:py-2.5 h-auto text-sm font-bold border border-gray-100 text-gray-900 hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center gap-2">
                                    <span className="hidden md:inline">مشاهدة المزيـد</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 rtl:rotate-180">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </Button>
                            </a>
                        </div>

                        <ProductSlider products={section.products} region={region} />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default BudgetSections
