import { redirect } from "next/navigation";
import { PDFPreviewClient } from "./pdf-preview-client";

export default function PDFPreviewPage() {
  // Only allow access in development
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }

  return <PDFPreviewClient />;
}
