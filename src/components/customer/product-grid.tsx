import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { CategoryWithProducts } from '@/types/database.types'

type MenuLanguage = 'en' | 'el'

interface ProductGridProps {
  category: CategoryWithProducts
  currency: string
  onAdd: (product: CategoryWithProducts['products'][number]) => void
  language: MenuLanguage
}

function getLocalizedText(
  language: MenuLanguage,
  greek?: string | null,
  english?: string | null,
  fallback?: string,
) {
  if (language === 'en') {
    return english?.trim() || greek?.trim() || fallback || ''
  }

  return greek?.trim() || english?.trim() || fallback || ''
}

export function ProductGrid({
  category,
  currency,
  onAdd,
  language,
}: ProductGridProps) {
  const products = category.products ?? []

  if (products.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-[#d9cec3] bg-white p-12 text-center text-sm text-gray-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        {language === 'en'
          ? 'There are no products in this category.'
          : 'Δεν υπάρχουν προϊόντα σε αυτή την κατηγορία.'}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const isAvailable = product.is_available !== false
        const hasOptions =
          Array.isArray((product as any).product_option_groups) &&
          (product as any).product_option_groups.length > 0

        const productName = getLocalizedText(
          language,
          product.name_el,
          product.name_en,
          'Product',
        )

        const productDescription = getLocalizedText(
          language,
          product.description_el,
          product.description_en,
          '',
        )

        return (
          <div
            key={product.id}
            className={
              isAvailable
                ? 'group overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(15,23,42,0.08)]'
                : 'overflow-hidden rounded-[24px] border border-[#e7ddd3] bg-[#f8f5f1] opacity-75'
            }
          >
            {product.image_url ? (
              <div className="relative h-44 w-full overflow-hidden bg-[#f8f5f1]">
                <img
                  src={product.image_url}
                  alt={productName}
                  className={
                    isAvailable
                      ? 'h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]'
                      : 'h-full w-full object-cover grayscale'
                  }
                />

                {!isAvailable ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm">
                      {language === 'en' ? 'Unavailable' : 'Μη διαθέσιμο'}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex h-44 w-full items-center justify-center bg-[#f8f5f1]">
                <div className="rounded-2xl bg-white px-4 py-2 text-sm text-[#8a6d58] shadow-sm">
                  {language === 'en' ? 'No image' : 'Χωρίς φωτογραφία'}
                </div>
              </div>
            )}

            <div className="p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold tracking-tight text-gray-900">
                      {productName}
                    </h3>

                    {!isAvailable ? (
                      <span className="rounded-full bg-[#eadfd3] px-2.5 py-1 text-[11px] font-medium text-[#7b6657]">
                        {language === 'en' ? 'Unavailable' : 'Μη διαθέσιμο'}
                      </span>
                    ) : null}
                  </div>

                  {productDescription ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">
                      {productDescription}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      {language === 'en' ? 'No description' : 'Χωρίς περιγραφή'}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[#8a6d58]">
                    {language === 'en' ? 'Price' : 'Τιμή'}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {formatCurrency(Number(product.price ?? 0), currency)}
                  </p>

                  {isAvailable ? (
                    hasOptions ? (
                      <p className="mt-1 text-xs text-[#8a6d58]">
                        {language === 'en' ? 'Customizable' : 'Με επιλογές'}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-transparent">.</p>
                    )
                  ) : (
                    <p className="mt-1 text-xs text-[#a08d80]">
                      {language === 'en'
                        ? 'Currently not available'
                        : 'Προς το παρόν μη διαθέσιμο'}
                    </p>
                  )}
                </div>

                <Button
                  size="sm"
                  className={
                    isAvailable
                      ? 'rounded-xl bg-[#1f2937] px-4 py-2 text-white hover:bg-[#111827]'
                      : 'rounded-xl bg-[#d8cdc1] px-4 py-2 text-[#7b6657] hover:bg-[#d8cdc1]'
                  }
                  onClick={() => {
                    if (!isAvailable) return
                    onAdd(product)
                  }}
                  disabled={!isAvailable}
                >
                  {!isAvailable
                    ? language === 'en'
                      ? 'Unavailable'
                      : 'Μη διαθέσιμο'
                    : hasOptions
                      ? language === 'en'
                        ? 'Choose'
                        : 'Επιλογές'
                      : language === 'en'
                        ? 'Add'
                        : 'Προσθήκη'}
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}