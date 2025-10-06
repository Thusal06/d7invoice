let currentReceiptBlob = null;
let currentReceiptId = null;
let receiptCount = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Load receipt count from localStorage
    loadReceiptCount();

    // Add form submit handler
    const form = document.getElementById('receiptForm');
    form.addEventListener('submit', handleFormSubmit);

    // Add payment method validation
    const paymentCheckboxes = document.querySelectorAll('input[name="paymentMethod"]');
    paymentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', validatePaymentMethods);
    });
});

function loadReceiptCount() {
    const saved = localStorage.getItem('receiptCount');
    if (saved) {
        receiptCount = parseInt(saved);
        updateReceiptCountDisplay();
    }
}

function updateReceiptCountDisplay() {
    document.getElementById('receiptCount').textContent = receiptCount;
    localStorage.setItem('receiptCount', receiptCount.toString());
}

function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const formData = getFormData();
    generateReceipt(formData);
}

function validateForm() {
    // Clear previous errors
    hideError();

    // Validate required fields
    const date = document.getElementById('date').value;
    const receivedFrom = document.getElementById('receivedFrom').value.trim();
    const forField = document.getElementById('forField').value.trim();
    const amount = document.getElementById('amount').value;

    if (!date || !receivedFrom || !forField || !amount) {
        showError('Please fill in all required fields');
        return false;
    }

    // Validate payment methods
    if (!validatePaymentMethods()) {
        return false;
    }

    // Validate amount
    if (parseFloat(amount) <= 0) {
        showError('Amount must be greater than 0');
        return false;
    }

    return true;
}

function validatePaymentMethods() {
    const cashCheckbox = document.getElementById('paymentCash');
    const chequeCheckbox = document.getElementById('paymentCheque');

    if (!cashCheckbox.checked && !chequeCheckbox.checked) {
        showError('Please select at least one payment method');
        return false;
    }

    // Validate cheque number if cheque is selected
    if (chequeCheckbox.checked) {
        const chequeNo = document.getElementById('chequeNo').value.trim();
        if (!chequeNo) {
            showError('Cheque number is required when cheque payment is selected');
            return false;
        }
    }

    hideError();
    return true;
}

function getFormData() {
    const receiptId = document.getElementById('receiptId').value.trim();
    const date = document.getElementById('date').value;
    const receivedFrom = document.getElementById('receivedFrom').value.trim();
    const forField = document.getElementById('forField').value.trim();
    const chequeNo = document.getElementById('chequeNo').value.trim();
    const amount = document.getElementById('amount').value;
    const paymentCash = document.getElementById('paymentCash').checked;
    const paymentCheque = document.getElementById('paymentCheque').checked;

    return {
        receiptId,
        date,
        receivedFrom,
        forField,
        chequeNo,
        amount,
        paymentCash,
        paymentCheque
    };
}

async function generateReceipt(formData) {
    showLoading();
    hidePreview();

    try {
        // Simulate brief loading for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate or use provided receipt ID
        if (formData.receiptId) {
            currentReceiptId = formData.receiptId;
        } else {
            receiptCount++;
            currentReceiptId = receiptCount.toString().padStart(4, '0');
        }
        updateReceiptCountDisplay();

        // Load the D7 INVOICE template
        const templateImage = new Image();
        templateImage.crossOrigin = 'anonymous';
        templateImage.src = 'd7invoice.png';

        await new Promise((resolve, reject) => {
            templateImage.onload = resolve;
            templateImage.onerror = reject;
        });

        // Create canvas with template dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = templateImage.width;
        canvas.height = templateImage.height;

        // Draw the template
        ctx.drawImage(templateImage, 0, 0);

        // Set font for receipt fields (much larger to match template)
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 42px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Precise field positions based on actual template analysis
        const fieldPositions = {
            receiptId: { x: 2135, y: 97 },        // Receipt # field (top right)
            date: { x: 933, y: 497 },            // Date field (center-right)
            receivedFrom: { x: 933, y: 556 },     // Received From field
            forField: { x: 933, y: 616 },         // Description field
            chequeNo: { x: 933, y: 678 },         // Cheque # field
            amount: { x: 933, y: 739 },           // Amount field
            paymentCash: { x: 831, y: 861 },      // Cash checkbox
            paymentCheque: { x: 1257, y: 861 }    // Cheque checkbox
        };

        // Draw receipt data on template

        // Receipt ID
        ctx.fillText(currentReceiptId, fieldPositions.receiptId.x, fieldPositions.receiptId.y);

        // Date
        ctx.fillText(formData.date, fieldPositions.date.x, fieldPositions.date.y);

        // Received From
        ctx.fillText(formData.receivedFrom, fieldPositions.receivedFrom.x, fieldPositions.receivedFrom.y);

        // For/Description
        ctx.fillText(formData.forField, fieldPositions.forField.x, fieldPositions.forField.y);

        // Cheque Number (only if provided)
        if (formData.chequeNo) {
            ctx.fillText(formData.chequeNo, fieldPositions.chequeNo.x, fieldPositions.chequeNo.y);
        }

        // Amount with Rs. prefix
        const amountText = `Rs. ${formData.amount}`;
        ctx.fillText(amountText, fieldPositions.amount.x, fieldPositions.amount.y);

        // Payment method checkboxes (much larger for better visibility)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;

        const checkboxSize = 45; // Much larger checkboxes (almost double)

        // Cash checkbox
        ctx.strokeRect(fieldPositions.paymentCash.x, fieldPositions.paymentCash.y - checkboxSize/2, checkboxSize, checkboxSize);
        if (formData.paymentCash) {
            // Draw larger checkmark
            ctx.beginPath();
            ctx.moveTo(fieldPositions.paymentCash.x + 10, fieldPositions.paymentCash.y);
            ctx.lineTo(fieldPositions.paymentCash.x + 18, fieldPositions.paymentCash.y + 12);
            ctx.lineTo(fieldPositions.paymentCash.x + 35, fieldPositions.paymentCash.y - 8);
            ctx.stroke();
        }

        // Cheque checkbox
        ctx.strokeRect(fieldPositions.paymentCheque.x, fieldPositions.paymentCheque.y - checkboxSize/2, checkboxSize, checkboxSize);
        if (formData.paymentCheque) {
            // Draw larger checkmark
            ctx.beginPath();
            ctx.moveTo(fieldPositions.paymentCheque.x + 10, fieldPositions.paymentCheque.y);
            ctx.lineTo(fieldPositions.paymentCheque.x + 18, fieldPositions.paymentCheque.y + 12);
            ctx.lineTo(fieldPositions.paymentCheque.x + 35, fieldPositions.paymentCheque.y - 8);
            ctx.stroke();
        }

        // Convert canvas to blob
        currentReceiptBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

        // Show preview
        showPreview(currentReceiptBlob);

    } catch (error) {
        console.error('Error generating receipt:', error);
        showError(`Failed to generate receipt: ${error.message}`);
    } finally {
        hideLoading();
    }
}

function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.querySelector('.btn-primary').disabled = true;
}

function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
    document.querySelector('.btn-primary').disabled = false;
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorElement.classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

function showPreview(blob) {
    const previewSection = document.getElementById('previewSection');
    const receiptImage = document.getElementById('receiptImage');
    const receiptIdDisplay = document.getElementById('receiptIdDisplay');
    const generatedTime = document.getElementById('generatedTime');

    // Create object URL for the blob
    const imageUrl = URL.createObjectURL(blob);
    receiptImage.src = imageUrl;

    // Update receipt info
    if (currentReceiptId) {
        receiptIdDisplay.textContent = currentReceiptId;
    }
    generatedTime.textContent = new Date().toLocaleString();

    previewSection.classList.remove('hidden');

    // Scroll to preview
    previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hidePreview() {
    document.getElementById('previewSection').classList.add('hidden');
}

function downloadReceipt() {
    if (!currentReceiptBlob) {
        showError('No receipt to download');
        return;
    }

    const filename = `receipt_${currentReceiptId}_${new Date().toISOString().split('T')[0]}.png`;

    const url = URL.createObjectURL(currentReceiptBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function resetForm() {
    document.getElementById('receiptForm').reset();

    // Reset date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;

    // Clear errors and preview
    hideError();
    hidePreview();

    // Reset receipt data
    currentReceiptBlob = null;
    currentReceiptId = null;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function generateNew() {
    resetForm();
}

// Auto-hide error messages after 8 seconds
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        hideError();
    }, 8000);
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + Enter to submit form
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        const form = document.getElementById('receiptForm');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }

    // Escape to reset form
    if (event.key === 'Escape') {
        resetForm();
    }
});