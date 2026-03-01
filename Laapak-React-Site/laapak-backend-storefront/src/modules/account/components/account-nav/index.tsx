"use client"

import { clx } from "@medusajs/ui"
import { ArrowRightOnRectangle } from "@medusajs/icons"
import { useParams, usePathname } from "next/navigation"
import { useTranslation } from "@lib/translations"

import ChevronDown from "@modules/common/icons/chevron-down"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }
  const { t } = useTranslation()

  const handleLogout = async () => {
    await signout(countryCode)
  }

  return (
    <div>
      <div className="small:hidden" data-testid="mobile-account-nav">
        {route !== `/${countryCode}/account` ? (
          <LocalizedClientLink
            href="/account"
            className="flex items-center gap-x-2 text-small-regular py-2"
            data-testid="account-main-link"
          >
            <>
              <ChevronDown className="transform rotate-90" />
              <span>{t("account.nav.title")}</span>
            </>
          </LocalizedClientLink>
        ) : (
          <>
            <div className="text-xl-semi mb-4 px-8 text-right">
              {t("account.nav.hello", { name: customer?.first_name })}
            </div>
            <div className="text-base-regular">
              <ul>
                <li>
                  <LocalizedClientLink
                    href="/account/profile"
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8"
                    data-testid="profile-link"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <User size={20} />
                        <span className="text-ui-fg-base">{t("account.nav.profile")}</span>
                      </div>
                      <ChevronDown className="transform rotate-90" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/addresses"
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8"
                    data-testid="addresses-link"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <MapPin size={20} />
                        <span className="text-ui-fg-base">{t("account.nav.addresses")}</span>
                      </div>
                      <ChevronDown className="transform rotate-90" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account/orders"
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8"
                    data-testid="orders-link"
                  >
                    <div className="flex items-center gap-x-2">
                      <Package size={20} />
                      <span className="text-ui-fg-base">{t("account.nav.orders")}</span>
                    </div>
                    <ChevronDown className="transform rotate-90" />
                  </LocalizedClientLink>
                </li>
                <li>
                  <button
                    type="button"
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8 w-full"
                    onClick={handleLogout}
                    data-testid="logout-button"
                  >
                    <div className="flex items-center gap-x-2">
                      <ArrowRightOnRectangle />
                      <span className="text-ui-fg-base">{t("account.nav.logout")}</span>
                    </div>
                    <ChevronDown className="transform rotate-90" />
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
      <div className="hidden small:block" data-testid="account-nav">
        <div>
          <div className="pb-4 border-b border-gray-200 mb-4 text-right">
            <h3 className="text-base-semi">{t("account.nav.title")}</h3>
          </div>
          <div className="text-base-regular">
            <ul className="flex mb-0 justify-start items-start flex-col gap-y-4">
              <li className="w-full">
                <AccountNavLink
                  href="/account"
                  route={route!}
                  data-testid="overview-link"
                >
                  <div className="flex items-center gap-x-2">
                    <User size={18} />
                    {t("account.nav.overview")}
                  </div>
                </AccountNavLink>
              </li>
              <li className="w-full">
                <AccountNavLink
                  href="/account/profile"
                  route={route!}
                  data-testid="profile-link"
                >
                  <div className="flex items-center gap-x-2">
                    <User size={18} />
                    {t("account.nav.profile")}
                  </div>
                </AccountNavLink>
              </li>
              <li className="w-full">
                <AccountNavLink
                  href="/account/addresses"
                  route={route!}
                  data-testid="addresses-link"
                >
                  <div className="flex items-center gap-x-2">
                    <MapPin size={18} />
                    {t("account.nav.addresses")}
                  </div>
                </AccountNavLink>
              </li>
              <li className="w-full">
                <AccountNavLink
                  href="/account/orders"
                  route={route!}
                  data-testid="orders-link"
                >
                  <div className="flex items-center gap-x-2">
                    <Package size={18} />
                    {t("account.nav.orders")}
                  </div>
                </AccountNavLink>
              </li>
              <li className="text-grey-700 w-full">
                <button
                  type="button"
                  onClick={handleLogout}
                  data-testid="logout-button"
                  className="w-full"
                >
                  <div className="flex items-center gap-x-2 text-ui-fg-subtle hover:text-rose-500 transition-colors">
                    <ArrowRightOnRectangle />
                    {t("account.nav.logout")}
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  children,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()

  const active = route.endsWith(href) || (href === "/account" && route.split(countryCode)[1] === "/account")

  return (
    <LocalizedClientLink
      href={href}
      className={clx("text-ui-fg-subtle hover:text-laapak-green transition-all flex items-center py-2 px-3 rounded-lg w-full", {
        "text-laapak-green font-semibold bg-laapak-green/5 border-r-4 border-laapak-green": active,
      })}
      data-testid={dataTestId}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default AccountNav
