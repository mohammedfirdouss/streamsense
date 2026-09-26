import type { Metadata } from "next";
import { ReviewQueue } from "@/components/review/ReviewQueue";

export const metadata: Metadata = { title: "Reviewer queue — StreamSense" };

export default function ReviewPage() {
  return <ReviewQueue />;
}
