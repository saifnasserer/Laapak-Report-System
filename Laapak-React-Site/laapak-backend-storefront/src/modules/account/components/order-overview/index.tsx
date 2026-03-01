"use client"

import { Button } from "@medusajs/ui"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "@lib/translations"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  const { t } = useTranslation()

  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-8 w-full">
        {orders.map((o) => (
          <div
            key={o.id}
            className="border-b border-gray-200 pb-6 last:pb-0 last:border-none"
          >
            <OrderCard order={o} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4 py-12"
      data-testid="no-orders-container"
    >
      <h2 className="text-xl font-bold">{t("account.orders.none_title")}</h2>
      <p className="text-base-regular text-ui-fg-subtle">
        {t("account.orders.none_description")}
      </p>
      <div className="mt-4">
        <LocalizedClientLink href="/store" passHref>
          <Button data-testid="continue-shopping-button" className="bg-laapak-green hover:bg-laapak-green/90 rounded-full px-8">
            {t("account.orders.continue_shopping")}
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview
