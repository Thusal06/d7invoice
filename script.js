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

    // Check API health on load
    checkApiHealth();
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

    const data = {
        date,
        received_from: receivedFrom,
        for_field: forField,
        amount,
        payment_method_cash: paymentCash,
        payment_method_cheque: paymentCheque
    };

    // Add optional fields
    if (receiptId) {
        data.receipt_id = receiptId;
    }
    if (chequeNo) {
        data.cheque_no = chequeNo;
    }

    return data;
}

async function generateReceipt(formData) {
    showLoading();
    hidePreview();

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        // Get the receipt ID from response headers if available
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
            const match = contentDisposition.match(/receipt_(\d+)\.png/);
            if (match) {
                currentReceiptId = match[1];
            }
        }

        // Convert response to blob
        currentReceiptBlob = await response.blob();

        // Update receipt count
        receiptCount++;
        updateReceiptCountDisplay();

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

    const filename = currentReceiptId ?
        `receipt_${currentReceiptId}.png` :
        `receipt_${new Date().toISOString().split('T')[0]}.png`;

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

// Utility function to check API health
async function checkApiHealth() {
    try {
        const response = await fetch('/api/health');
        if (!response.ok) {
            throw new Error('API health check failed');
        }
        const data = await response.json();
        console.log('API Health:', data);
        return true;
    } catch (error) {
        console.error('API Health Check Failed:', error);
        // Don't show error to user on page load, just log it
        return false;
    }
}

// Auto-hide error messages after 10 seconds
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        hideError();
    }, 10000);
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

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});