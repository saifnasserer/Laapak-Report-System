"use client"

import { HttpTypes } from "@medusajs/types"
import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import Video360 from "@modules/products/components/video-360"
import React, { useState, useEffect, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  video360Url?: string
}

const ImageGallery = ({ images, video360Url }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Combine video and images into a single media array
  const media = [
    ...(video360Url ? [{ id: "video-360", url: video360Url, type: "video" }] : []),
    ...images.map(img => ({ ...img, type: "image" }))
  ]

  const [emblaMainRef, emblaMainApi] = useEmblaCarousel({
    loop: false,
    direction: "rtl",
    align: "start",
  })

  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
    direction: "rtl",
  })

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return
      emblaMainApi.scrollTo(index)
    },
    [emblaMainApi, emblaThumbsApi]
  )

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return
    setSelectedIndex(emblaMainApi.selectedScrollSnap())
    emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap())
  }, [emblaMainApi, emblaThumbsApi])

  useEffect(() => {
    if (!emblaMainApi) return
    onSelect()
    emblaMainApi.on("select", onSelect)
    emblaMainApi.on("reInit", onSelect)
  }, [emblaMainApi, onSelect])

  return (
    <div className="flex flex-col gap-y-6 w-full">
      {/* Main Slider */}
      <div className="overflow-hidden bg-white/50 rounded-3xl border border-gray-100/50 shadow-sm" ref={emblaMainRef}>
        <div className="flex touch-pan-y">
          {media.map((item, index) => (
            <div className="flex-[0_0_100%] min-w-0 relative aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:h-[calc(100vh-240px)] lg:max-h-[850px] w-full" key={item.id}>
              {item.type === "video" ? (
                <div className="w-full h-full p-4 sm:p-8">
                  <Video360
                    src={item.url!}
                    className="w-full h-full object-cover rounded-2xl"
                    // Only play if this is the selected slide
                    poster={images[0]?.url}
                  />
                </div>
              ) : (
                <div className="w-full h-full p-4 sm:p-8" onContextMenu={(e) => e.preventDefault()}>
                  <Image
                    src={item.url!}
                    priority={index === 0}
                    className="w-full h-full object-cover rounded-2xl transition-all duration-500"
                    alt={`Product image ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    draggable={false}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Thumbnails Navigation */}
      <div className="overflow-hidden px-2" ref={emblaThumbsRef}>
        <div className="flex flex-row gap-3">
          {media.map((item, index) => (
            <button
              key={`thumb-${item.id}`}
              onClick={() => onThumbClick(index)}
              onContextMenu={(e) => e.preventDefault()}
              className={clx(
                "flex-[0_0_80px] sm:flex-[0_0_100px] aspect-square relative rounded-xl overflow-hidden border-2 transition-all duration-200 p-1 bg-white",
                {
                  "border-laapak-green shadow-md ring-2 ring-laapak-green/10": index === selectedIndex,
                  "border-transparent opacity-60 hover:opacity-100": index !== selectedIndex,
                }
              )}
            >
              {item.type === "video" ? (
                <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-1">
                  <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3 translate-x-px">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-black text-rose-600 uppercase">360° Video</span>
                </div>
              ) : (
                <Image
                  src={item.url!}
                  className="object-cover rounded-lg"
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  draggable={false}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ImageGallery
