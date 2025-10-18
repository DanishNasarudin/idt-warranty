"use client";

import { sendWarrantyCaseEmail } from "@/app/branch/[id]/actions";
import { Button } from "@/components/ui/button";
import { WarrantyCaseWithRelations } from "@/lib/types/warranty";
import { pdf } from "@react-pdf/renderer";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WarrantyCasePDF } from "./warranty-case-pdf";

type SendEmailButtonProps = {
  case_: WarrantyCaseWithRelations;
};

export function SendEmailButton({ case_ }: SendEmailButtonProps) {
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    setIsSending(true);
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

      // Generate PDF blob
      const blob = await pdf(
        <WarrantyCasePDF
          case_={case_}
          companyAddress={companyAddress}
          officeNumber={officeNumber}
          whatsappNumber={whatsappNumber}
          footerNotes={footerNotes}
        />
      ).toBlob();

      // Convert blob to array buffer, then to base64 string for server action
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64String = btoa(
        Array.from(uint8Array)
          .map((byte) => String.fromCharCode(byte))
          .join("")
      );

      // Send email with PDF attachment (as base64 string)
      await sendWarrantyCaseEmail(case_, base64String);

      toast.success(`Email sent successfully to ${case_.customerEmail}`);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  // Only show button if customer email is available
  if (!case_.customerEmail) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSendEmail}
      disabled={isSending}
      className="gap-2"
    >
      <Mail className="h-4 w-4" />
      {isSending ? "Sending..." : "Send Email"}
    </Button>
  );
}
