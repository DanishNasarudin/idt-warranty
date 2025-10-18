import { WarrantyCaseWithRelations } from "@/lib/types/warranty";

/**
 * Default footer notes for warranty case PDFs
 */
export const DEFAULT_FOOTER_NOTES = `
1. This receipt must be shown when claiming items after repair / service.
2. Charges, if any, are payable on collection,
3. The Company is not responsible for any lost or damage due to contigencies beyond control.
4. This receipt is valid for 60 days, after which it become null and void and goods will be forfeited.
5. The warranty contact is strictly for messaging and WhatsApp enquiry only.`;

/**
 * Get branch-specific contact details for PDF generation
 * Provides fallback values if branch details are not configured
 */
export function getBranchContactDetails(case_: WarrantyCaseWithRelations) {
  return {
    companyAddress: case_.branch.address || "Address not configured",
    officeNumber: case_.branch.officePhone || "Office phone not configured",
    whatsappNumber: case_.branch.whatsappPhone || "WhatsApp not configured",
    footerNotes: DEFAULT_FOOTER_NOTES,
  };
}
