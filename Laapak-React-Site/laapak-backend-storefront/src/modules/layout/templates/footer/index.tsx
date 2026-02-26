import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Text, clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()

  return (
    <footer className="border-t border-ui-border-base w-full bg-white">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between py-16">
          <div className="w-full max-w-sm">
            <LocalizedClientLink
              href="/"
              className="text-3xl font-bold text-laapak-green hover:text-laapak-greenHover uppercase tracking-wide inline-block mb-4"
            >
              لابك
            </LocalizedClientLink>
            <p className="text-laapak-gray text-base-regular leading-relaxed">
              وجهتك الأولى لأفضل تشكيلة من أجهزة اللابتوب المستعملة والمجددة. جودة مضمونة، أداء عالي، وأسعار تنافسية.
            </p>
          </div>
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="font-bold text-gray-900 text-base">
                  الأقسام
                </span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return
                    }

                    const children =
                      c.category_children?.map((child) => ({
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
                              children.map((child) => (
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
                    "grid grid-cols-1 gap-2 text-laapak-gray txt-small",
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
              <ul className="grid grid-cols-1 gap-y-2 text-laapak-gray txt-small">
                <li>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-laapak-green transition-colors"
                  >
                    فيسبوك
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/201000000000"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-laapak-green transition-colors"
                  >
                    واتساب
                  </a>
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
