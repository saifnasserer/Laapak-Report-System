"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import { HttpTypes } from "@medusajs/types"
import React from "react"
import Accordion from "./accordion"
import ProductDescriptionTable from "../product-description-table"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "وصف المنتج",
      component: <div className="py-8 text-right w-full" dir="rtl"><ProductDescriptionTable description={product.description} /></div>,
    },
    {
      label: "المواصفات التقنية",
      component: <TechnicalSpecsTab product={product} />,
    },
    {
      label: "معلومات إضافية",
      component: <ProductInfoTab product={product} />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const TechnicalSpecsTab = ({ product }: ProductTabsProps) => {
  const specs = (product.metadata?.specs as Record<string, string>) || {}

  const specList = [
    { label: "المعالج", value: specs.processor },
    { label: "الذاكرة (RAM)", value: specs.ram },
    { label: "التخزين", value: specs.storage },
    { label: "كارت الشاشة", value: specs.gpu },
    { label: "حجم الشاشة", value: specs.screen_size },
    { label: "الحالة", value: specs.condition },
  ].filter(s => s.value)

  if (specList.length === 0) {
    return (
      <div className="text-small-regular py-8 text-right" dir="rtl">
        <p>لا توجد مواصفات تقنية متاحة لهذا المنتج.</p>
      </div>
    )
  }

  return (
    <div className="text-small-regular py-8 text-right" dir="rtl">
      <div className="grid grid-cols-1 gap-y-4">
        {specList.map((spec, i) => (
          <div key={i} className="flex flex-col gap-y-1">
            <span className="font-bold text-gray-900">{spec.label}</span>
            <p className="text-gray-600">{spec.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}


const ProductInfoTab = ({ product }: ProductTabsProps) => {
  return (
    <div className="text-small-regular py-8 text-right" dir="rtl">
      <div className="grid grid-cols-2 gap-x-8">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-bold">الخامة</span>
            <p className="text-gray-600">{product.material ? product.material : "-"}</p>
          </div>
          <div>
            <span className="font-bold">بلد المنشأ</span>
            <p className="text-gray-600">{product.origin_country ? product.origin_country : "-"}</p>
          </div>
          <div>
            <span className="font-bold">النوع</span>
            <p className="text-gray-600">{product.type ? product.type.value : "-"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-bold">الوزن</span>
            <p className="text-gray-600">{product.weight ? `${product.weight} جرام` : "-"}</p>
          </div>
          <div>
            <span className="font-bold">الأبعاد</span>
            <p className="text-gray-600">
              {product.length && product.width && product.height
                ? `${product.length}L x ${product.width}W x ${product.height}H`
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
