import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ActivationStudio } from "@/components/dashboard/activation-studio";
import { PageHeader } from "@/components/layout/page-header";

export default function StrategyPage() {
  return (
    <div className="space-y-4 animate-slide-in">
      <PageHeader
        eyebrow="Strategy Studio"
        title="AI Activation Brief Studio"
        actions={
          <>
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Dashboard
              </Button>
            </Link>
          </>
        }
      />

      <ActivationStudio />
    </div>
  );
}
