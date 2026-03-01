"use client"

import React, { useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { GoogleReview } from "@lib/data/google-reviews"

type ReviewsSliderProps = {
    reviews: GoogleReview[]
}

const ReviewsSlider: React.FC<ReviewsSliderProps> = ({ reviews }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            align: "start",
            direction: "rtl",
            containScroll: "trimSnaps",
            dragFree: true,
            loop: true,
        },
        [Autoplay({ delay: 4000, stopOnInteraction: false })]
    )

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi])

    return (
        <div className="relative group/slider">
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-6 py-4 px-2">
                    {reviews.map((review, index) => (
                        <div
                            key={index}
                            className="flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0"
                        >
                            <div className="bg-white/70 backdrop-blur-md p-4 rounded-xl border border-white/50 shadow-sm transition-all h-full flex flex-col gap-3 hover:shadow-md hover:bg-white/90">
                                <div className="flex items-center gap-3">
                                    {review.profile_photo_url ? (
                                        <img
                                            src={review.profile_photo_url}
                                            alt={review.reviewer_name}
                                            className="w-8 h-8 rounded-full border border-laapak-green/20"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-laapak-green/10 flex items-center justify-center text-laapak-green font-bold border border-laapak-green/20 text-xs">
                                            {review.reviewer_name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 text-xs md:text-sm">
                                            {review.reviewer_name}
                                        </span>
                                        <div className="flex text-yellow-400 scale-75 origin-right">
                                            {[...Array(5)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill={i < review.rating ? "currentColor" : "none"}
                                                    stroke={i < review.rating ? "none" : "currentColor"}
                                                    className="w-4 h-4"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-700 text-xs md:text-sm leading-relaxed pr-2 border-r-2 border-laapak-green/20 font-medium line-clamp-4">
                                    "{review.review_text}"
                                </p>
                                {review.relative_time && (
                                    <span className="text-[10px] text-gray-400 mt-auto text-left">
                                        {review.relative_time}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={scrollNext}
                className="absolute top-1/2 -left-4 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-laapak-green hover:bg-laapak-green hover:text-white transition-all z-20 opacity-0 group-hover/slider:opacity-100 hidden md:flex"
                aria-label="Next slide"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 rtl:rotate-180">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>

            <button
                onClick={scrollPrev}
                className="absolute top-1/2 -right-4 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-laapak-green hover:bg-laapak-green hover:text-white transition-all z-20 opacity-0 group-hover/slider:opacity-100 hidden md:flex"
                aria-label="Previous slide"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 rtl:rotate-180">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>
        </div>
    )
}

export default ReviewsSlider
