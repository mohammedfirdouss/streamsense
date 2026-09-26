import type { Metadata } from "next";
import { AssessWizard } from "@/components/assess/AssessWizard";

export const metadata: Metadata = { title: "New survey | StreamSense" };

export default function AssessPage() {
  return <AssessWizard />;
}
