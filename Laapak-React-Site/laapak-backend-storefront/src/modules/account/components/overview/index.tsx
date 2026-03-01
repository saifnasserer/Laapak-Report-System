import { Container } from "@medusajs/ui"

import ChevronDown from "@modules/common/icons/chevron-down"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "@lib/translations"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  const { t } = useTranslation()

  return (
    <div data-testid="overview-page-wrapper">
      <div className="hidden small:block">
        <div className="text-xl-semi flex justify-between items-center mb-4">
          <span className="text-2xl font-bold tracking-tight" data-testid="welcome-message" data-value={customer?.first_name}>
            {t("account.overview.welcome", { name: customer?.first_name })}
          </span>
          <span className="text-small-regular text-ui-fg-subtle bg-ui-bg-subtle px-3 py-1 rounded-full">
            {t("account.overview.logged_in_as")}{" "}
            <span
              className="font-semibold text-ui-fg-base"
              data-testid="customer-email"
              data-value={customer?.email}
            >
              {customer?.email}
            </span>
          </span>
        </div>
        <div className="flex flex-col py-8 border-t border-gray-200">
          <div className="flex flex-col gap-y-4 h-full col-span-1 row-span-2 flex-1">
            <div className="grid grid-cols-1 small:grid-cols-2 gap-4 mb-8">
              <Container className="flex flex-col gap-y-2 p-6 bg-ui-bg-base border-ui-border-base transition-all hover:border-laapak-green/50">
                <div className="flex items-center gap-x-2 text-laapak-green mb-1">
                  <User size={20} />
                  <h3 className="text-base-semi">{t("account.overview.profile_completion")}</h3>
                </div>
                <div className="flex items-end gap-x-2">
                  <span
                    className="text-3xl font-bold leading-none"
                    data-testid="customer-profile-completion"
                    data-value={getProfileCompletion(customer)}
                  >
                    {getProfileCompletion(customer)}%
                  </span>
                  <span className="text-base-regular text-ui-fg-subtle mb-0.5">
                    {t("account.overview.completed")}
                  </span>
                </div>
              </Container>

              <Container className="flex flex-col gap-y-2 p-6 bg-ui-bg-base border-ui-border-base transition-all hover:border-laapak-green/50">
                <div className="flex items-center gap-x-2 text-laapak-green mb-1">
                  <MapPin size={20} />
                  <h3 className="text-base-semi">{t("account.nav.addresses")}</h3>
                </div>
                <div className="flex items-end gap-x-2">
                  <span
                    className="text-3xl font-bold leading-none"
                    data-testid="addresses-count"
                    data-value={customer?.addresses?.length || 0}
                  >
                    {customer?.addresses?.length || 0}
                  </span>
                  <span className="text-base-regular text-ui-fg-subtle mb-0.5">
                    {t("account.overview.addresses_count")}
                  </span>
                </div>
              </Container>
            </div>

            <div className="flex flex-col gap-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{t("account.overview.recent_orders")}</h3>
                <LocalizedClientLink href="/account/orders" className="text-laapak-green text-small-regular hover:underline">
                  {t("account.overview.view_all")}
                </LocalizedClientLink>
              </div>
              <ul
                className="flex flex-col gap-y-4"
                data-testid="orders-wrapper"
              >
                {orders && orders.length > 0 ? (
                  orders.slice(0, 5).map((order) => {
                    return (
                      <li
                        key={order.id}
                        data-testid="order-wrapper"
                        data-value={order.id}
                        className="transition-transform hover:-translate-y-1 duration-200"
                      >
                        <LocalizedClientLink
                          href={`/account/orders/details/${order.id}`}
                        >
                          <Container className="bg-ui-bg-base border-ui-border-base flex justify-between items-center p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="grid grid-cols-3 text-small-regular gap-x-8 flex-1">
                              <div className="flex flex-col gap-y-1 text-right">
                                <span className="font-bold text-ui-fg-subtle">{t("account.overview.order_date")}</span>
                                <span data-testid="order-created-date" className="text-base-semibold">
                                  {new Date(order.created_at).toLocaleDateString(t("account.orders.card.date_format"), { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex flex-col gap-y-1 text-right">
                                <span className="font-bold text-ui-fg-subtle">{t("account.overview.order_number")}</span>
                                <span
                                  data-testid="order-id"
                                  data-value={order.display_id}
                                  className="text-base-semibold"
                                >
                                  #{order.display_id}
                                </span>
                              </div>
                              <div className="flex flex-col gap-y-1 text-right border-r border-gray-100 pr-8">
                                <span className="font-bold text-ui-fg-subtle">{t("account.overview.total_amount")}</span>
                                <span data-testid="order-amount" className="text-base-semibold text-laapak-green font-bold text-lg">
                                  {convertToLocale({
                                    amount: order.total,
                                    currency_code: order.currency_code,
                                  })}
                                </span>
                              </div>
                            </div>
                            <button
                              className="mr-auto p-2 bg-gray-50 rounded-full hover:bg-laapak-green/10 transition-colors"
                              data-testid="open-order-button"
                            >
                              <span className="sr-only">
                                {t("account.overview.go_to_order", { id: order.display_id })}
                              </span>
                              <ChevronDown className="transform rotate-90 text-ui-fg-subtle" />
                            </button>
                          </Container>
                        </LocalizedClientLink>
                      </li>
                    )
                  })
                ) : (
                  <Container className="py-12 flex flex-col items-center justify-center text-ui-fg-subtle bg-gray-50/50 border-dashed">
                    <Package size={40} className="mb-4 opacity-20" />
                    <span data-testid="no-orders-message" className="text-base-regular">{t("account.overview.no_recent_orders")}</span>
                    <LocalizedClientLink href="/store" className="mt-4 text-laapak-green font-semibold hover:underline">
                      {t("account.overview.start_shopping")}
                    </LocalizedClientLink>
                  </Container>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
