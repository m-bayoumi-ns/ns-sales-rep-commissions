import { redirect } from "next/navigation";

export default async function RegisterPage({ params }: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  redirect(`/${locale}/login`);
}
