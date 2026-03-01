"use client"

import { useEffect, useRef, useState } from "react"
import { clx } from "@medusajs/ui"

type Video360Props = {
    src: string
    poster?: string
    className?: string
}

const Video360 = ({ src, poster, className }: Video360Props) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasStarted, setHasStarted] = useState(false)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleLoadStart = () => setIsLoading(true)
        const handleCanPlay = () => setIsLoading(false)
        const handlePlaying = () => {
            setIsLoading(false)
            setHasStarted(true)
        }
        const handleWaiting = () => setIsLoading(true)

        video.addEventListener("loadstart", handleLoadStart)
        video.addEventListener("canplay", handleCanPlay)
        video.addEventListener("playing", handlePlaying)
        video.addEventListener("waiting", handleWaiting)

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        video.preload = "auto"
                        video.play().catch(() => { })
                    } else {
                        video.pause()
                    }
                }
            },
            { threshold: 0.1 }
        )

        observer.observe(video)

        return () => {
            observer.disconnect()
            video.removeEventListener("loadstart", handleLoadStart)
            video.removeEventListener("canplay", handleCanPlay)
            video.removeEventListener("playing", handlePlaying)
            video.removeEventListener("waiting", handleWaiting)
        }
    }, [src])

    return (
        <div className={clx("relative w-full h-full overflow-hidden bg-transparent", className)}>
            {/* Loading Spinner Area */}
            {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/5 backdrop-blur-[2px]">
                    <div className="w-8 h-8 border-4 border-laapak-green/30 border-t-laapak-green rounded-full animate-spin" />
                </div>
            )}

            <video
                ref={videoRef}
                src={src}
                poster={poster}
                loop
                muted
                playsInline
                preload="auto"
                onContextMenu={(e) => e.preventDefault()}
                controlsList="nodownload"
                className={clx("w-full h-full object-cover transition-opacity duration-700 pointer-events-none", {
                    "opacity-0": !hasStarted && !poster,
                    "opacity-100": hasStarted || !!poster
                })}
                suppressHydrationWarning
            />
        </div>
    )
}

export default Video360
