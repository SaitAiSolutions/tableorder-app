import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format-currency'
import type { CategoryWithProducts } from '@/types/database.types'

interface ProductGridProps {
  category: CategoryWithProducts
  currency: string
  onAdd: (product: CategoryWithProducts['products'][number]) => void
}

export function ProductGrid({ category, currency, onAdd }: ProductGridProps) {
  if (!category.products || category.products.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-[#d9cec3] bg-white p-12 text-center text-sm text-gray-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        Δεν υπάρχουν προϊόντα σε αυτή την κατηγορία.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {category.products.map((product) => (
        <div
          key={product.id}
          className="group overflow-hidden rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(15,23,42,0.08)]"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
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

          <div className="mt-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[#8a6d58]">
                Τιμή
              </p>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {formatCurrency(Number(product.price ?? 0), currency)}
              </p>
            </div>

            <Button
              size="sm"
              className="rounded-xl bg-[#1f2937] px-4 py-2 text-white hover:bg-[#111827]"
              onClick={() => onAdd(product)}
            >
              Προσθήκη
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}