"use client";

import { WarrantyCasePDF } from "@/components/custom/warranty/warranty-case-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WarrantyCaseWithRelations } from "@/lib/types/warranty";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Mock data for preview
const mockWarrantyCase: WarrantyCaseWithRelations = {
  id: 1,
  serviceNo: "WRN-001-2025",
  branchId: 1,
  scopeId: 1,
  status: "IN_PROGRESS",
  customerName: "John Doe",
  customerContact: "+60123456789",
  customerEmail: "john.doe@example.com",
  address: "123 Jalan Example, Taman Sample, 47100 Puchong, Selangor",
  purchaseDate: new Date("2024-10-01"),
  invoice: "INV-2024-001",
  receivedItems: "Laptop, Charger, Mouse",
  pin: "1234",
  issues:
    "Screen flickering, Battery not charging properly, Keyboard keys stuck",
  solutions:
    "Replaced screen panel, Changed battery, Cleaned and fixed keyboard mechanism",
  statusDesc: "Currently under inspection by technician",
  remarks: "Customer requested urgent service. VIP customer.",
  cost: 450.0,
  locker: 5,
  idtPc: true,
  receivedByStaffId: 1,
  servicedByStaffId: 2,
  createdAt: new Date("2025-10-15"),
  updatedAt: new Date("2025-10-18"),
  receivedBy: {
    id: 1,
    name: "Alice Tan",
    color: "#3b82f6",
  },
  servicedBy: {
    id: 2,
    name: "Bob Lee",
    color: "#10b981",
  },
  branch: {
    id: 1,
    code: "HQ",
    name: "Head Quarter - Puchong",
  },
  scope: {
    id: 1,
    code: "WARRANTY",
  },
};

export function PDFPreviewClient() {
  const [companyAddress, setCompanyAddress] = useState(
    "No. 123, Jalan Example 1/2,\nTaman Sample, 47100 Puchong,\nSelangor, Malaysia"
  );
  const [officeNumber, setOfficeNumber] = useState("+603-8888 1234");
  const [whatsappNumber, setWhatsappNumber] = useState("+6012-345 6789");
  const [footerNotes, setFooterNotes] = useState(
    "Terms & Conditions:\n1. Warranty is valid for 12 months from purchase date.\n2. Warranty does not cover physical damage or water damage.\n3. Please bring this document when collecting your item.\n4. Service charges may apply for out-of-warranty repairs."
  );

  const handleDownload = async () => {
    try {
      const blob = await pdf(
        <WarrantyCasePDF
          case_={mockWarrantyCase}
          companyAddress={companyAddress}
          officeNumber={officeNumber}
          whatsappNumber={whatsappNumber}
          footerNotes={footerNotes}
        />
      ).toBlob();

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const filename = `${mockWarrantyCase.serviceNo}_IdealTechPC_Service_${year}${month}${day}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">PDF Template Preview</h1>
            <p className="text-muted-foreground mt-1">
              Development Only - Adjust settings and preview PDF template
            </p>
          </div>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download Sample PDF
          </Button>
        </div>

        {/* Configuration Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-1 space-y-4 bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">
              PDF Settings (Preview)
            </h2>

            <div className="space-y-2">
              <Label htmlFor="companyAddress">Company Address</Label>
              <Textarea
                id="companyAddress"
                value={companyAddress}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCompanyAddress(e.target.value)
                }
                rows={4}
                placeholder="Enter company address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="officeNumber">Office Number</Label>
              <Input
                id="officeNumber"
                value={officeNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOfficeNumber(e.target.value)
                }
                placeholder="Enter office number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                value={whatsappNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setWhatsappNumber(e.target.value)
                }
                placeholder="Enter WhatsApp number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerNotes">Footer Notes</Label>
              <Textarea
                id="footerNotes"
                value={footerNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFooterNotes(e.target.value)
                }
                rows={6}
                placeholder="Enter footer notes (terms & conditions)"
              />
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                💡 Changes are reflected in real-time. These settings will be
                configurable from the Settings page in production.
              </p>
            </div>
          </div>

          {/* PDF Preview */}
          <div className="lg:col-span-2 bg-card rounded-lg border overflow-hidden">
            <div className="h-[calc(100vh-12rem)] w-full">
              <PDFViewer width="100%" height="100%" showToolbar={true}>
                <WarrantyCasePDF
                  case_={mockWarrantyCase}
                  companyAddress={companyAddress}
                  officeNumber={officeNumber}
                  whatsappNumber={whatsappNumber}
                  footerNotes={footerNotes}
                />
              </PDFViewer>
            </div>
          </div>
        </div>

        {/* Mock Data Info */}
        <div className="bg-muted/50 p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">📋 Mock Data Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Service No:</span>
              <p className="font-medium">{mockWarrantyCase.serviceNo}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Customer:</span>
              <p className="font-medium">{mockWarrantyCase.customerName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-medium">{mockWarrantyCase.status}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Branch:</span>
              <p className="font-medium">{mockWarrantyCase.branch.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
