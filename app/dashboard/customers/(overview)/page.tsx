import { fetchRevenue } from '@/app/lib/data';
import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Invoices | Acme Dashboard',
}

const Page = async () => {
  const a = await fetchRevenue()
  return (
    <div>
      <p> Customers page </p>
    </div>
  );
}

export default Page