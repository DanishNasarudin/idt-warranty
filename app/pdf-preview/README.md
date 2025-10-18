# PDF Template Preview Page

## Overview

A development-only page to preview and test the warranty case PDF template in real-time.

## Access

**URL:** `/pdf-preview`

**Environment:** Development only (automatically redirects to home in production)

## Features

### Real-time Preview

- Live PDF viewer with immediate updates
- Adjust company information and see changes instantly
- Test different content layouts and lengths

### Configurable Settings

1. **Company Address** - Multi-line address field
2. **Office Number** - Contact phone number
3. **WhatsApp Number** - WhatsApp contact
4. **Footer Notes** - Terms & conditions or custom notes

### Mock Data

The preview uses realistic mock warranty case data:

- Service No: WRN-001-2025
- Customer: John Doe
- Status: IN_PROGRESS
- Branch: Head Quarter - Puchong
- Complete warranty case details with sample issues and solutions

### Download

- Download button to save the preview PDF
- Filename format: `[serviceNo]_IdealTechPC_Service_YYYYMMDD.pdf`
- Example: `WRN-001-2025_IdealTechPC_Service_20251018.pdf`

## Usage

### Start Development Server

```bash
npm run dev
```

### Navigate to Preview Page

```
http://localhost:3000/pdf-preview
```

### Test Different Configurations

1. Modify the input fields in the left panel
2. See real-time updates in the PDF viewer on the right
3. Test multi-line content, special characters, long text
4. Download and verify the final PDF

## Files

### Page Components

- `app/pdf-preview/page.tsx` - Server component with environment check
- `app/pdf-preview/pdf-preview-client.tsx` - Client component with PDF viewer

### Related Components

- `components/custom/warranty/warranty-case-pdf.tsx` - PDF template
- `components/ui/textarea.tsx` - Textarea input component

## Development Tips

### Testing Scenarios

1. **Long Address** - Test multi-line address formatting
2. **Long Footer Notes** - Verify pagination and overflow handling
3. **Special Characters** - Test unicode, symbols, emojis
4. **Empty Fields** - Verify fallback handling
5. **Different Statuses** - Change mock data status

### Customization

Edit `mockWarrantyCase` in `pdf-preview-client.tsx` to test:

- Different warranty statuses
- Various product types
- Multiple staff assignments
- Different branch configurations
- Cost variations

### Preview vs Production

The preview page helps you:

- ✅ Design and test PDF layout
- ✅ Verify company branding
- ✅ Test content overflow
- ✅ Validate footer notes
- ⚠️ Settings will come from database in production
- ⚠️ Mock data replaced with real warranty cases

## Next Steps

Once you're happy with the PDF template:

1. Configure settings in Settings page (when implemented)
2. Test with real warranty cases
3. Train staff on PDF features
4. Deploy to production

## Security

- Page is **only accessible in development** mode
- Automatic redirect in production
- No sensitive data exposure
- Mock data only for preview

## Troubleshooting

### Page not loading?

- Verify you're in development mode: `NODE_ENV=development`
- Check console for errors
- Ensure `@react-pdf/renderer` is installed

### PDF not rendering?

- Check browser console for errors
- Verify all props are being passed correctly
- Try refreshing the page

### Download not working?

- Check browser download settings
- Verify file permissions
- Clear browser cache

## Future Enhancements

- [ ] Multiple template variations
- [ ] Language selection (English/Malay)
- [ ] Custom logo upload preview
- [ ] Export settings as JSON
- [ ] Import/Export template configurations
