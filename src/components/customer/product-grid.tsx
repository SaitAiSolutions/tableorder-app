import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { CategoryWithProducts } from '@/types/database.types'

interface ProductGridProps {
  category: CategoryWithProducts
  currency: string
  onAdd: (product: CategoryWithProducts['products'][number]) => void
}

export function ProductGrid({ category, currency, onAdd }: ProductGridProps) {
  const visibleProducts = (category.products ?? []).filter(
    (product) => product.is_available !== false,
  )

  if (visibleProducts.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-[#d9cec3] bg-white p-12 text-center text-sm text-gray-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        Δεν υπάρχουν διαθέσιμα προϊόντα σε αυτή την κατηγορία.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visibleProducts.map((product) => {
        const hasOptions =
          Array.isArray((product as any).product_option_groups) &&
          (product as any).product_option_groups.length > 0

        return (
          <div
            key={product.id}
            className="group overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(15,23,42,0.08)]"
          >
            {product.image_url ? (
              <div className="h-44 w-full overflow-hidden bg-[#f8f5f1]">
                <img
                  src={product.image_url}
                  alt={product.name_el}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              </div>
            ) : (
              <div className="flex h-44 w-full items-center justify-center bg-[#f8f5f1]">
                <div className="rounded-2xl bg-white px-4 py-2 text-sm text-[#8a6d58] shadow-sm">
                  Χωρίς φωτογραφία
                </div>
              </div>
            )}

            <div className="p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold tracking-tight text-gray-900">
                    {product.name_el}
                  </h3>

                  {product.description_el ? (
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      {product.description_el}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      Χωρίς περιγραφή
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[#8a6d58]">
                    Τιμή
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">
                    {formatCurrency(Number(product.price ?? 0), currency)}
                  </p>

                  {hasOptions ? (
                    <p className="mt-1 text-xs text-[#8a6d58]">
                      Διαθέσιμες επιλογές
                    </p>
                  ) : null}
                </div>

                <Button
                  size="sm"
                  className="rounded-xl bg-[#1f2937] px-4 py-2 text-white hover:bg-[#111827]"
                  onClick={() => onAdd(product)}
                >
                  {hasOptions ? 'Επιλογές' : 'Προσθήκη'}
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}