import { VerifiedCertificateView } from "@/components/VerifiedCertificateView";

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const resolvedParams = await params;
  return <VerifiedCertificateView certificateId={resolvedParams.id} />;
}
