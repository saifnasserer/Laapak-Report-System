"use client"

import { useEffect, useRef } from "react"

type Video360Props = {
    src: string
    poster?: string
    className?: string
}

const Video360 = ({ src, poster, className }: Video360Props) => {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        // Visible: upgrade preload and play
                        video.preload = "auto"
                        video.play().catch(() => { })
                    } else {
                        // Off-screen: pause to save resources
                        video.pause()
                    }
                }
            },
            { threshold: 0.1 } // trigger when 10% of the video is visible
        )

        observer.observe(video)
        return () => observer.disconnect()
    }, [src])

    return (
        <video
            ref={videoRef}
            src={src}
            poster={poster}
            loop
            muted
            playsInline
            preload="metadata"  // only load metadata (dimensions, duration) initially
            className={className}
            suppressHydrationWarning
        />
    )
}

export default Video360
