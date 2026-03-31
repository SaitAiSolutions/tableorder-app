'use client'

import { cn } from '@/lib/utils/cn'
import type { CategoryWithProducts } from '@/types/database.types'

type MenuLanguage = 'en' | 'el'

interface CategoryNavProps {
  categories: CategoryWithProducts[]
  activeCategoryId: string | null
  onSelect: (id: string) => void
  language: MenuLanguage
}

function getCategoryName(category: CategoryWithProducts, language: MenuLanguage) {
  if (language === 'en') {
    return category.name_en?.trim() || category.name_el?.trim() || 'Category'
  }

  return category.name_el?.trim() || category.name_en?.trim() || 'Κατηγορία'
}

export function CategoryNav({
  categories,
  activeCategoryId,
  onSelect,
  language,
}: CategoryNavProps) {
  return (
    <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
      {categories.map((category) => {
        const active = category.id === activeCategoryId

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(
              'whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-medium shadow-sm transition-all',
              active
                ? 'border-[#1f2937] bg-[#1f2937] text-white shadow-[0_8px_20px_rgba(31,41,55,0.18)]'
                : 'border-[#eadfd3] bg-[#fbf8f4] text-[#5b4a3f] hover:border-[#d9c6b4] hover:bg-[#f7f1ea]',
            )}
          >
            {getCategoryName(category, language)}
          </button>
        )
      })}
    </div>
  )
}