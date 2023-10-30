import { fetchRevenue } from '@/app/lib/data';
import React from 'react'

const Page = async () => {
  const a = await fetchRevenue()
  return (
    <div>
      <p> Customers page </p>
    </div>
  );
}

export default Page