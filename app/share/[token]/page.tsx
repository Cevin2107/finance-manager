import { PublicMonthShare } from '@/components/dashboard/PublicMonthShare';

export default async function SharedMonthPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicMonthShare token={token} />;
}
