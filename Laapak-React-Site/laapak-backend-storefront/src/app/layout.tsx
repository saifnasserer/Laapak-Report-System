import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import { Noto_Sans_Arabic } from "next/font/google"

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  display: 'swap',
  variable: '--font-noto-sans-arabic'
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="ar-EG" dir="rtl" data-mode="light">
      <body className={notoSansArabic.className}>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
