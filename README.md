# D7 Receipt Generator API

A Vercel-deployable FastAPI backend that generates professional receipt images by overlaying text on a template.

## API Endpoints

### POST /api/generate
Generates a receipt image based on provided data.

**Request Body:**
```json
{
  "receipt_id": "0090",
  "date": "2024-01-15",
  "received_from": "John Doe",
  "for_field": "Services rendered",
  "cheque_no": "123456",
  "amount": "5000.00",
  "payment_method_cash": true,
  "payment_method_cheque": false
}
```

- `receipt_id` (optional): Manually set receipt ID. If provided, next auto-generated ID will be incremented from this value. Format: 4-digit string (e.g., "0090").
- If `receipt_id` is not provided, the system will auto-generate sequential 4-digit IDs.

**Response:** PNG image with headers for direct download

### GET /api/health
Health check endpoint to verify deployment.

## Usage Examples

**Auto-generated receipt ID:**
```bash
curl -X POST "https://your-app.vercel.app/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "received_from": "John Doe",
    "for_field": "Consulting services",
    "cheque_no": "CHQ001",
    "amount": "2500.00",
    "payment_method_cash": false,
    "payment_method_cheque": true
  }' \
  --output receipt.png
```

**Manual receipt ID override:**
```bash
curl -X POST "https://your-app.vercel.app/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "receipt_id": "0090",
    "date": "2024-01-15",
    "received_from": "John Doe",
    "for_field": "Consulting services",
    "cheque_no": "CHQ001",
    "amount": "2500.00",
    "payment_method_cash": false,
    "payment_method_cheque": true
  }' \
  --output receipt.png
```

## Field Positions

The template has predefined positions for:
- Receipt ID (4-digit sequential: 0001, 0002, etc.)
- Date
- Received From
- For field
- Cheque Number
- Amount
- Payment Method checkboxes

## Deployment

1. Push to GitHub
2. Connect to Vercel
3. Deploy - Vercel will automatically configure the Python serverless function

## Receipt ID Format

- Auto-generated as 4-digit sequential numbers: 0001, 0002, 0003, etc.
- Manual override supported: Set receipt_id to "0090" to reset counter, next auto-generated will be "0091"
- Counter persists in `receipt_counter.json` file