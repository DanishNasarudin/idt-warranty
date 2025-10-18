# PDF Settings Configuration - TODO

## Overview

The warranty case PDF generation feature is now implemented with placeholder values for company information and footer notes. These values need to be configurable from the Settings page.

## Current Implementation

### Files Modified

- `components/custom/warranty/warranty-case-pdf.tsx` - PDF document component
- `components/custom/warranty/print-pdf-button.tsx` - PDF generation handler
- `components/custom/warranty/expandable-row-details.tsx` - UI integration

### PDF Features

1. **Header Section**

   - Company logo (from icons.tsx)
   - Company name: "Ideal Tech PC Sdn Bhd"
   - Dynamic fields (currently placeholders):
     - Company Address
     - Office Number
     - WhatsApp Number

2. **Footer Section**

   - Dynamic footer notes (currently placeholder)
   - Branch name
   - Auto-generated timestamp

3. **Filename Format**
   - Pattern: `[serviceNo]_IdealTechPC_Service_YYYYMMDD.pdf`
   - Example: `WRN001_IdealTechPC_Service_20251018.pdf`

## TODO: Settings Page Configuration

### Database Schema Changes Needed

Add a new table for PDF settings:

```prisma
model PDFSettings {
  id              Int      @id @default(autoincrement())
  companyAddress  String   @default("To be configured")
  officeNumber    String   @default("To be configured")
  whatsappNumber  String   @default("To be configured")
  footerNotes     String   @default("To be configured")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Settings Page Updates

1. **Create a new tab/section** in `app/settings/page.tsx`:

   - Tab name: "PDF Settings" or "Document Settings"

2. **Create settings management component**:

   - File: `components/custom/settings/pdf-settings-management.tsx`
   - Fields:
     - Company Address (textarea)
     - Office Number (input)
     - WhatsApp Number (input)
     - Footer Notes (textarea)
   - Actions:
     - Save/Update settings
     - Preview PDF with current settings (optional)

3. **Create server actions** in `app/settings/actions.ts`:

   ```typescript
   export async function getPDFSettings();
   export async function updatePDFSettings(data: PDFSettingsData);
   ```

4. **Update print-pdf-button.tsx**:
   - Remove placeholder values
   - Fetch settings from database/API
   - Pass real values to WarrantyCasePDF component

### Implementation Steps

1. ✅ **Phase 1: PDF Component** (COMPLETED)

   - Create PDF layout with logo and company info
   - Add props for dynamic fields
   - Style and format PDF properly

2. **Phase 2: Database Setup** (PENDING)

   - Add PDFSettings model to schema.prisma
   - Run migration: `npx prisma migrate dev --name add_pdf_settings`
   - Generate Prisma client: `npx prisma generate`

3. **Phase 3: Settings UI** (PENDING)

   - Create PDF settings management component
   - Add form with validation
   - Implement save/update functionality
   - Add to Settings page tabs

4. **Phase 4: Integration** (PENDING)
   - Create API/server action to fetch PDF settings
   - Update print-pdf-button to use real settings
   - Test end-to-end flow

### Example Settings UI Component

```tsx
// components/custom/settings/pdf-settings-management.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PDFSettingsManagement({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);

  const handleSave = async () => {
    // Call server action to save settings
    await updatePDFSettings(settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Company Address</Label>
        <Textarea
          value={settings.companyAddress}
          onChange={(e) =>
            setSettings({ ...settings, companyAddress: e.target.value })
          }
        />
      </div>
      {/* ... other fields ... */}
      <Button onClick={handleSave}>Save Settings</Button>
    </div>
  );
}
```

## Default Values (Temporary)

Until settings are configured, the PDF will show:

- Company Address: "To be configured in settings"
- Office Number: "To be configured in settings"
- WhatsApp Number: "To be configured in settings"
- Footer Notes: "To be configured in settings"

## Testing Checklist

- [ ] PDF generates with logo correctly
- [ ] All fields are visible in PDF
- [ ] Settings can be saved/updated
- [ ] Settings persist across sessions
- [ ] PDF uses saved settings instead of placeholders
- [ ] Multiple branches can have different settings (if needed)
- [ ] Footer notes support multi-line text
- [ ] Special characters are handled properly

## Future Enhancements (Optional)

- Branch-specific PDF settings
- Multiple footer templates
- Custom logo upload per branch
- PDF template variations
- Language selection for PDF content
