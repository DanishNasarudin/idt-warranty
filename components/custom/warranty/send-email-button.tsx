"use client";

import { sendWarrantyCaseEmail } from "@/app/(warranty)/branch/[id]/actions";
import { Button } from "@/components/ui/button";
import { WarrantyCaseWithRelations } from "@/lib/types/warranty";
import { getBranchContactDetails } from "@/lib/utils/warranty-pdf-config";
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
      // Get branch-specific contact details
      const { companyAddress, officeNumber, whatsappNumber, footerNotes } =
        getBranchContactDetails(case_);

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

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSendEmail}
      disabled={isSending || !case_.customerEmail}
      className="gap-2"
    >
      <Mail className="h-4 w-4" />
      {isSending ? "Sending..." : "Send Email"}
    </Button>
  );
}
