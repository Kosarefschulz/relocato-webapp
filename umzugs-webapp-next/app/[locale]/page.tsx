import { redirect } from 'next/navigation';

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // Redirect to dashboard
  redirect(`/${locale}/dashboard`);
}