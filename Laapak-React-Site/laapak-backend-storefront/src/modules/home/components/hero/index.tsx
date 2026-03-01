import { Button, Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

const Hero = () => {
  return (
    <div className="w-full relative bg-gray-50/50 overflow-hidden border-b border-gray-100">
      <div className="content-container">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between py-8 md:py-16 lg:py-20 gap-8 md:gap-12">

          {/* Content (Right Side) */}
          <div className="flex flex-col gap-6 flex-1 text-center lg:text-right z-10 lg:items-start items-center">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] w-fit transition-transform hover:-translate-y-0.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-laapak-green animate-pulse"></span>
              <span className="text-sm font-bold text-gray-700">أجهزة استيراد بحالة الزيرو</span>
            </div>

            <Heading
              level="h1"
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[4rem] font-black text-gray-900 tracking-tight leading-[1.3] lg:max-w-2xl"
            >
              اعلى مواصفات، احسن حالة، اطول ضمان <span className="text-laapak-green">، وبنص سعر الجديد</span>
            </Heading>

            <Text
              className="text-lg lg:text-xl text-laapak-gray font-medium max-w-xl leading-relaxed"
            >
              وفر فلوسك واستلم لاب توب استيراد فرز أول بحالة الزيرو. أداء جبار ينجز معاك، سعر ميتفوتش، وضمان استبدال حقيقي عشان تشتري وانت مطمن.
            </Text>

            <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <LocalizedClientLink href="/store" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-laapak-green hover:bg-laapak-greenHover text-white text-lg px-8 py-3.5 rounded-full font-bold shadow-lg shadow-laapak-green/20 hover:shadow-xl hover:shadow-laapak-green/30 transition-all flex justify-center items-center gap-2 h-auto">
                  تسوق الآن
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </Button>
              </LocalizedClientLink>

              <LocalizedClientLink href="/warranty" className="w-full sm:w-auto">
                <div className="w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-3.5 rounded-full bg-white border-2 border-laapak-green/20 text-gray-800 text-lg font-bold shadow-sm hover:bg-laapak-green/5 transition-colors cursor-pointer group">
                  شوف تفاصيل الضمان
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-laapak-green group-hover:translate-x-0.5 transition-transform">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
              </LocalizedClientLink>
            </div>
          </div>

          {/* Image (Left Side in RTL) */}
          <div className="flex-1 relative w-full max-w-[500px] lg:max-w-none">
            {/* Background decorative blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-laapak-green/10 rounded-full blur-3xl -z-10"></div>

            {/* Laptop Image container */}
            <div className="relative w-full aspect-[4/3]">
              <Image
                src="/hero-laptop.png"
                alt="Laptop display"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Hero

