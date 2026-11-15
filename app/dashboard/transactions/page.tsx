import { TransactionManager } from '@/components/dashboard/TransactionManager';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const params = await searchParams;
  return <TransactionManager initialOpen={params.new === '1'} />;
}
