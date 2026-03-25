import { notFound } from 'next/navigation'
import { getMenuForCustomer } from '@/lib/actions/menu.actions'
import { CustomerApp } from './customer-app'

interface PageProps {
  params: Promise<{
    slug: string
    tableId: string
  }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CustomerMenuPage({ params }: PageProps) {
  const { slug, tableId } = await params

  const { data, error } = await getMenuForCustomer(slug, tableId)

  if (error || !data) {
    notFound()
  }

  return <CustomerApp data={data} />
}