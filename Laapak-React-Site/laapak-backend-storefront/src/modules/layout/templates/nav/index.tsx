import { Suspense } from "react"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SearchBar from "@modules/store/components/search-bar"
import NavHeader from "./nav-header"
import NavFilterButton from "./nav-filter-button"

export default async function Nav() {
  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <NavHeader>
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular gap-x-2 small:gap-x-8">
          <div className="flex items-center h-full shrink-0">
            <LocalizedClientLink
              href="/"
              className="hover:opacity-80 transition-opacity flex items-center"
              data-testid="nav-store-link"
            >
              <Image src="/logo.png" alt="لابك" width={100} height={32} className="object-contain" priority />
            </LocalizedClientLink>
          </div>

          <div className="flex-1 basis-0 hidden medium:flex justify-center max-w-xl">
            <Suspense fallback={<div className="w-full h-10 bg-gray-50 rounded-full animate-pulse" />}>
              <SearchBar />
            </Suspense>
          </div>

          <div className="flex-1 basis-0 flex items-center justify-end gap-x-2 small:gap-x-4 h-full relative z-10 pr-2 small:pr-0">
            <div className="flex items-center h-full">
              <LocalizedClientLink
                className="hover:text-laapak-green transition-all group/account flex items-center justify-center w-10 h-10 rounded-full border border-gray-100 bg-white shadow-sm hover:bg-gray-50 p-0"
                href="/account"
                data-testid="nav-account-link"
                title="حسابي"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 group-hover/account:text-laapak-green transition-colors">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </LocalizedClientLink>
            </div>

            <NavFilterButton />
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-laapak-green transition-all group/cart relative flex items-center justify-center w-10 h-10 rounded-full border border-gray-100 bg-white shadow-sm hover:bg-gray-50 p-0"
                  href="/cart"
                  data-testid="nav-cart-link"
                  title="السلة"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 group-hover/cart:text-laapak-green transition-colors">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-laapak-green text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm border border-white leading-none">
                    0
                  </span>
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </NavHeader>
    </div>
  )
}
