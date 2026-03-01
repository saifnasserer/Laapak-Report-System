"use client"

import { usePathname } from "next/navigation"
import { Text, clx } from "@medusajs/ui"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function Footer({ collections, productCategories }: { collections: any[], productCategories: any[] }) {
  const pathname = usePathname()
  const isStorePage = pathname?.includes("/store")


  return (
    <footer className={clx("border-t border-ui-border-base w-full bg-white", {
      "snap-start shrink-0 min-h-[calc(100vh-64px)] flex flex-col justify-center": isStorePage
    })}>
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-12 md:flex-row items-center md:items-start text-center md:text-right justify-between py-16">
          <div className="w-full max-w-sm flex flex-col items-center md:items-start">
            <LocalizedClientLink
              href="/"
              className="hover:opacity-80 transition-opacity inline-block mb-6"
            >
              <Image src="/logo.png" alt="لابك" width={160} height={60} className="object-contain" />
            </LocalizedClientLink>
            <p className="text-laapak-gray text-base-regular leading-relaxed mb-6">
              وجهتك الأولى لأفضل تشكيلة من أجهزة اللابتوب المستعملة والمجددة. جودة مضمونة، أداء عالي، وأسعار تنافسية.
            </p>
            {/* Social Icons Section */}
            <div className="flex items-center gap-4">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-laapak-green hover:text-white transition-all shadow-sm border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a>
              <a href="https://wa.me/201013148007" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-green-500 hover:text-white transition-all shadow-sm border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 md:grid-cols-3 w-full md:w-auto text-center md:text-right mt-8 md:mt-0">
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="font-bold text-gray-900 text-base">
                  الأقسام
                </span>
                <ul
                  className="grid grid-cols-1 gap-3 items-center md:items-start justify-items-center md:justify-items-start"
                  data-testid="footer-categories"
                >
                  {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return
                    }

                    const children =
                      c.category_children?.map((child: any) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null

                    return (
                      <li
                        className="flex flex-col gap-2 text-laapak-gray txt-small"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "hover:text-laapak-green transition-colors",
                            children && "font-semibold text-gray-800"
                          )}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 mr-3 gap-2 border-r-2 border-gray-100 pr-2">
                            {children &&
                              children.map((child: any) => (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    className="hover:text-laapak-green transition-colors"
                                    href={`/categories/${child.handle}`}
                                    data-testid="category-link"
                                  >
                                    {child.name}
                                  </LocalizedClientLink>
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="font-bold text-gray-900 text-base">
                  التشكيلات
                </span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-3 text-laapak-gray txt-small items-center md:items-start justify-items-center md:justify-items-start",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-laapak-green transition-colors"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2">
              <span className="font-bold text-gray-900 text-base">روابط هامة</span>
              <ul className="grid grid-cols-1 gap-y-3 text-laapak-gray txt-small items-center md:items-start justify-items-center md:justify-items-start">
                <li>
                  <LocalizedClientLink
                    href="/warranty"
                    className="hover:text-laapak-green transition-colors"
                  >
                    سياسة الضمان
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/terms"
                    className="hover:text-laapak-green transition-colors"
                  >
                    الشروط والأحكام
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex w-full mb-8 pt-8 border-t border-gray-100 justify-center text-laapak-gray">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} لابك. جميع الحقوق محفوظة.
          </Text>
        </div>
      </div>
    </footer>
  )
}
