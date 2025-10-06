from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
import io
import os
from datetime import datetime
import json

app = FastAPI(title="D7 Receipt Generator API")

FIELD_POSITIONS = {
    "receipt_id": {"x": 85, "y": 95, "font_size": 12},
    "date": {"x": 460, "y": 95, "font_size": 12},
    "received_from": {"x": 130, "y": 185, "font_size": 12},
    "for_field": {"x": 130, "y": 235, "font_size": 12},
    "cheque_no": {"x": 440, "y": 285, "font_size": 12},
    "amount": {"x": 155, "y": 335, "font_size": 12},
    "payment_method_cash": {"x": 155, "y": 380, "font_size": 10},
    "payment_method_cheque": {"x": 245, "y": 380, "font_size": 10}
}

class ReceiptData(BaseModel):
    receipt_id: str = None
    date: str
    received_from: str
    for_field: str
    cheque_no: str = ""
    amount: str
    payment_method_cash: bool = False
    payment_method_cheque: bool = False

# File to store receipt counter
COUNTER_FILE = "receipt_counter.json"

def load_counter() -> int:
    try:
        if os.path.exists(COUNTER_FILE):
            with open(COUNTER_FILE, 'r') as f:
                data = json.load(f)
                return data.get('counter', 1)
        else:
            return 1
    except:
        return 1

def save_counter(counter: int):
    try:
        with open(COUNTER_FILE, 'w') as f:
            json.dump({'counter': counter}, f)
    except:
        pass

def generate_receipt_id() -> str:
    counter = load_counter()
    receipt_id = f"{counter:04d}"
    save_counter(counter + 1)
    return receipt_id

def set_receipt_counter(receipt_id: str):
    try:
        # Extract numeric part and convert to int
        numeric_id = int(receipt_id)
        save_counter(numeric_id + 1)
        return receipt_id
    except:
        # If invalid format, generate normal receipt ID
        return generate_receipt_id()

def get_font(size: int) -> ImageFont.FreeTypeFont:
    try:
        # Try to load a system font
        font_paths = [
            "/System/Library/Fonts/Arial.ttf",  # macOS
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Linux
            "arial.ttf"  # Windows fallback
        ]

        for font_path in font_paths:
            try:
                return ImageFont.truetype(font_path, size)
            except:
                continue

        # Fallback to default font
        return ImageFont.load_default()
    except:
        return ImageFont.load_default()

def draw_text(draw: ImageDraw, text: str, x: int, y: int, font_size: int, font_color: str = "#000000"):
    font = get_font(font_size)
    draw.text((x, y), text, fill=font_color, font=font)

def draw_checkbox(draw: ImageDraw, x: int, y: int, checked: bool, size: int = 12):
    # Draw checkbox outline
    draw.rectangle([x, y, x + size, y + size], outline="#000000", width=1)
    if checked:
        # Draw checkmark
        draw.line([x + 2, y + 6, x + 5, y + size - 2], fill="#000000", width=2)
        draw.line([x + 5, y + size - 2, x + size - 2, y + 2], fill="#000000", width=2)

def create_receipt_template() -> Image.Image:
    # Create a professional receipt template
    width, height = 600, 450
    img = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(img)

    # Header
    draw.rectangle([0, 0, width, 80], fill="#2c3e50")
    draw.text((50, 30), "D7 RECEIPT", fill="white", font=get_font(24))
    draw.text((50, 55), "Professional Receipt Generator", fill="white", font=get_font(12))

    # Receipt details area
    draw.rectangle([20, 100, width-20, 400], outline="#e1e8ed", width=2)

    # Field labels
    draw.text((50, 115), "Receipt ID:", fill="#666", font=get_font(10))
    draw.text((400, 115), "Date:", fill="#666", font=get_font(10))
    draw.text((50, 155), "Received From:", fill="#666", font=get_font(10))
    draw.text((50, 195), "For:", fill="#666", font=get_font(10))
    draw.text((50, 235), "Cheque No:", fill="#666", font=get_font(10))
    draw.text((50, 275), "Amount:", fill="#666", font=get_font(10))
    draw.text((50, 315), "Payment Method:", fill="#666", font=get_font(10))

    # Payment method checkboxes
    draw.rectangle([150, 330, 162, 342], outline="#000", width=1)
    draw.text((170, 330), "Cash", fill="#333", font=get_font(10))
    draw.rectangle([240, 330, 252, 342], outline="#000", width=1)
    draw.text((260, 330), "Cheque", fill="#333", font=get_font(10))

    # Footer
    draw.rectangle([0, height-50, width, height], fill="#2c3e50")
    draw.text((200, height-35), "Thank you for your business!", fill="white", font=get_font(12))

    return img

def build_image(receipt_data: ReceiptData) -> bytes:
    try:
        # Create receipt template
        img = create_receipt_template()
        draw = ImageDraw.Draw(img)

        # Generate or use provided receipt ID
        if receipt_data.receipt_id:
            receipt_id = set_receipt_counter(receipt_data.receipt_id)
        else:
            receipt_id = generate_receipt_id()

        # Draw receipt ID
        draw_text(draw, receipt_id, FIELD_POSITIONS["receipt_id"]["x"],
                 FIELD_POSITIONS["receipt_id"]["y"], FIELD_POSITIONS["receipt_id"]["font_size"])

        # Draw date
        draw_text(draw, receipt_data.date, FIELD_POSITIONS["date"]["x"],
                 FIELD_POSITIONS["date"]["y"], FIELD_POSITIONS["date"]["font_size"])

        # Draw received from
        draw_text(draw, receipt_data.received_from, FIELD_POSITIONS["received_from"]["x"],
                 FIELD_POSITIONS["received_from"]["y"], FIELD_POSITIONS["received_from"]["font_size"])

        # Draw for field
        draw_text(draw, receipt_data.for_field, FIELD_POSITIONS["for_field"]["x"],
                 FIELD_POSITIONS["for_field"]["y"], FIELD_POSITIONS["for_field"]["font_size"])

        # Draw cheque no if provided
        if receipt_data.cheque_no:
            draw_text(draw, receipt_data.cheque_no, FIELD_POSITIONS["cheque_no"]["x"],
                     FIELD_POSITIONS["cheque_no"]["y"], FIELD_POSITIONS["cheque_no"]["font_size"])

        # Draw amount with rupee symbol
        amount_text = f"Rs. {receipt_data.amount}"
        draw_text(draw, amount_text, FIELD_POSITIONS["amount"]["x"],
                 FIELD_POSITIONS["amount"]["y"], FIELD_POSITIONS["amount"]["font_size"])

        # Draw payment method checkboxes
        draw_checkbox(draw, FIELD_POSITIONS["payment_method_cash"]["x"],
                     FIELD_POSITIONS["payment_method_cash"]["y"],
                     receipt_data.payment_method_cash)

        draw_checkbox(draw, FIELD_POSITIONS["payment_method_cheque"]["x"],
                     FIELD_POSITIONS["payment_method_cheque"]["y"],
                     receipt_data.payment_method_cheque)

        # Save to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        return img_bytes.getvalue(), receipt_id

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating image: {str(e)}")

@app.post("/api/generate")
async def generate_receipt(receipt_data: ReceiptData):
    try:
        # Validate at least one payment method is selected
        if not receipt_data.payment_method_cash and not receipt_data.payment_method_cheque:
            raise HTTPException(
                status_code=400,
                detail="At least one payment method must be selected"
            )

        # Validate amount
        try:
            amount_float = float(receipt_data.amount)
            if amount_float <= 0:
                raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid amount format")

        # Generate the image
        image_bytes, receipt_id = build_image(receipt_data)

        return Response(
            content=image_bytes,
            media_type="image/png",
            headers={
                "Content-Disposition": f"attachment; filename=\"receipt_{receipt_id}.png\"",
                "Content-Type": "image/png"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "D7 Receipt Generator API",
        "version": "1.0.0",
        "endpoints": {
            "generate": "POST /api/generate",
            "health": "GET /api/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)