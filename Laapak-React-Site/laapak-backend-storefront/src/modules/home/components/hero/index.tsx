import { ArrowLeftMini } from "@medusajs/icons"
import { Button, Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="h-[60vh] w-full border-b border-ui-border-base relative bg-white overflow-hidden">
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center px-4 md:px-32 gap-6 bg-gradient-to-b from-gray-50/80 to-white">
        <span className="flex flex-col gap-4">
          <Heading
            level="h1"
            className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight"
          >
            أحسن لاب توب <span className="text-laapak-green">بأفضل سعر</span>
          </Heading>
          <Heading
            level="h2"
            className="text-lg md:text-xl text-laapak-gray font-medium max-w-2xl mx-auto leading-relaxed"
          >
            كل أجهزتنا مفحوصة بدقة، مجددة باحترافية، ومضمونة لتمنحك الأداء الذي تحتاجه بأسعار لا تُنافس.
          </Heading>
        </span>
        <LocalizedClientLink href="/store" className="mt-4">
          <Button className="bg-laapak-green hover:bg-laapak-greenHover text-white text-lg px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
            تسوق الآن
            <ArrowLeftMini />
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default Hero
