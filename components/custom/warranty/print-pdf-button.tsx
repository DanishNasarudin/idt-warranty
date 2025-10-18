"use client";

import { Button } from "@/components/ui/button";
import { WarrantyCaseWithRelations } from "@/lib/types/warranty";
import { pdf } from "@react-pdf/renderer";
import { Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WarrantyCasePDF } from "./warranty-case-pdf";

type PrintPDFButtonProps = {
  case_: WarrantyCaseWithRelations;
};

export function PrintPDFButton({ case_ }: PrintPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrintPDF = async () => {
    setIsGenerating(true);
    try {
      // TODO: Fetch these values from settings/database in the future
      // For now, using default placeholder values
      const companyAddress = "To be configured in settings";
      const officeNumber = "To be configured in settings";
      const whatsappNumber = "To be configured in settings";
      const footerNotes = `
      1. This receipt must be shown when claiming items after repair / service.
      2. Charges, if any, are payable on collection,
      3. The Company is not responsible for any lost or damage due to contigencies beyond control.
      4. This receipt is valid for 60 days, after which it become null and void and goods will be forfeited.
      5. The warranty contact is strictly for messaging and WhatsApp enquiry only.`;

      // Generate PDF
      const blob = await pdf(
        <WarrantyCasePDF
          case_={case_}
          companyAddress={companyAddress}
          officeNumber={officeNumber}
          whatsappNumber={whatsappNumber}
          footerNotes={footerNotes}
        />
      ).toBlob();

      // Create filename with format: YYYYMMDDhhmm_[serviceNo]
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const filename = `${case_.serviceNo}_IdealTechPC_Service_${year}${month}${day}.pdf`;

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrintPDF}
      disabled={isGenerating}
      className="gap-2"
    >
      <Printer className="h-4 w-4" />
      {isGenerating ? "Generating..." : "Print PDF"}
    </Button>
  );
}
