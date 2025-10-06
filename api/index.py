from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
import io
import os
from datetime import datetime
import json

app = FastAPI()

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
        return ImageFont.truetype("static/Roboto-Regular.ttf", size)
    except:
        try:
            return ImageFont.truetype("arial.ttf", size)
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

def build_image(receipt_data: ReceiptData) -> bytes:
    try:
        # Open the template image
        template_path = "../D7 INVOICE.png"
        if not os.path.exists(template_path):
            template_path = "static/D7 INVOICE.png"

        img = Image.open(template_path)
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/")
async def root():
    return {"message": "D7 Receipt Generator API", "version": "1.0.0"}

# Vercel serverless function handler
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)