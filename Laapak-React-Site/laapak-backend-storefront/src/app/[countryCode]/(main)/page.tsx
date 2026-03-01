import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import GoogleReviews from "@modules/home/components/google-reviews"
import HotDeals from "@modules/home/components/hot-deals"
import BudgetSections from "@modules/home/components/budget-sections"
import LaapakProcess from "@modules/home/components/laapak-process"
import LaptopSelector from "@modules/home/components/laptop-selector"
import CategoriesGrid from "@modules/home/components/categories-grid"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"

export const metadata: Metadata = {
  title: "لابك - أفضل أجهزة اللابتوب المستعملة والمجددة",
  description:
    "تسوق أفضل أجهزة اللابتوب المستعملة والمجددة في مصر. جودة مضمونة، أداء عالي، وأسعار تنافسية. لابك ثقة وأمان.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  // Fetch products for budget sections and home page display
  const { response: { products: allHomeProducts } } = await listProducts({
    countryCode,
    queryParams: { limit: 48 }, // Fetch more to populate all budget sections
  })

  const hotDealsProducts = allHomeProducts.slice(0, 4)

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <GoogleReviews />
      <HotDeals products={hotDealsProducts} region={region} />
      <BudgetSections products={allHomeProducts} region={region} />

      <div className="pt-16 pb-8 bg-gray-50/30">
        {/* <div className="content-container mb-12 border-r-4 border-laapak-green pr-6">
          <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight">منتجاتنا <span className="text-laapak-green">المميزة</span></h2>
          <p className="text-laapak-gray font-medium mt-1">تشكيلة مختارة من أفضل أجهزة اللابتوب العالمية</p>
        </div> */}
        {/* <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul> */}
      </div>

      <LaptopSelector />
      <LaapakProcess />
    </>
  )
}
