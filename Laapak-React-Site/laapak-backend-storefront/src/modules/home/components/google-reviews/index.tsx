import { Heading, Button } from "@medusajs/ui"
import { getGoogleReviews } from "@lib/data/google-reviews"
import ReviewsSlider from "./reviews-slider"

const GoogleReviews = async () => {
    const data = await getGoogleReviews()

    // Fallback if API fails or isn't configured yet
    const reviews = data?.reviews || [
        {
            reviewer_name: "Sara Ahmed",
            rating: 5,
            review_text: "تعاملكم ممتاز من أول ريبورت اتبعتلي بكل مواصفات الجهاز وكل التيستات وصور الجهاز لحد الاستلام والمتابعة.. الجهاز كأنه جديد مش استعمال خارج خالص.. مش هيكون آخر تعامل بينا إن شاء الله.",
        }
    ]
    const rating = data?.rating || 4.9
    const totalReviews = data?.user_ratings_total || 101

    return (
        <div className="py-8 md:py-12 bg-gray-50/50 border-y border-gray-100">
            <div className="content-container">
                <div className="flex flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex flex-col gap-1">
                        <Heading level="h2" className="text-[1.1rem] sm:text-lg md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-2 whitespace-nowrap">
                            {totalReviews} عميل شاركوا تجربتهم
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 drop-shadow-sm mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                        </Heading>
                        <p className="text-laapak-gray text-sm md:text-base font-medium hidden md:block">شوف عملائنا بيقولوا إيه عن تجربة الشراء من لابك</p>
                    </div>
                    <a
                        href="https://www.google.com/maps/place/Laapak+%7C+%D9%84%D8%A7%D8%A8%D9%83+%D8%AF%D9%88%D8%AA+%D9%83%D9%88%D9%85%E2%80%AD/@30.0458157,31.2392916,17z/data=!4m8!3m7!1s0x86053d2eec2f9d35:0x3fcce5a7b8695e6!8m2!3d30.0458157!4d31.2392916!9m1!1b1!16s%2Fg%2F11s5j8p_rh?entry=ttu"
                        target="_blank"
                        rel="noreferrer"
                        className="group no-underline shrink-0"
                    >
                        <Button
                            variant="transparent"
                            className="rounded-full px-4 py-1.5 h-auto text-xs md:text-sm font-bold border border-laapak-green/30 text-laapak-green hover:bg-laapak-green/5 transition-all"
                        >
                            كل التقييمات
                        </Button>
                    </a>
                </div>

                <ReviewsSlider reviews={reviews} />
            </div>
        </div>
    )
}

export default GoogleReviews
