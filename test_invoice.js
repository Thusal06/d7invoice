// Test script to generate a sample receipt
const { JSDOM } = require('jsdom');

// Create a DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
    <title>Test Invoice Generation</title>
</head>
<body>
    <canvas id="testCanvas" style="display: none;"></canvas>
    <script>
        // Test function
        async function testReceiptGeneration() {
            const canvas = document.getElementById('testCanvas');
            const ctx = canvas.getContext('2d');

            // Test data
            const testData = {
                receiptId: '0010',
                date: '2024-01-15',
                receivedFrom: 'John Smith',
                forField: 'Web Development Services',
                chequeNo: 'CHQ123456',
                amount: '5000.00',
                paymentCash: true,
                paymentCheque: false
            };

            // Create image element for template
            const templateImage = new Image();
            templateImage.src = 'D7 INVOICE.png';

            return new Promise((resolve, reject) => {
                templateImage.onload = () => {
                    try {
                        // Set canvas size
                        canvas.width = templateImage.width;
                        canvas.height = templateImage.height;

                        // Draw template
                        ctx.drawImage(templateImage, 0, 0);

                        // Set text properties
                        ctx.fillStyle = '#000000';
                        ctx.font = 'bold 24px Arial';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';

                        // Field positions
                        const fieldPositions = {
                            receiptId: { x: 120, y: 98 },
                            date: { x: 520, y: 98 },
                            receivedFrom: { x: 180, y: 198 },
                            forField: { x: 180, y: 248 },
                            chequeNo: { x: 500, y: 298 },
                            amount: { x: 200, y: 348 },
                            paymentCash: { x: 200, y: 398 },
                            paymentCheque: { x: 320, y: 398 }
                        };

                        // Draw test data
                        ctx.fillText(testData.receiptId, fieldPositions.receiptId.x, fieldPositions.receiptId.y);
                        ctx.fillText(testData.date, fieldPositions.date.x, fieldPositions.date.y);
                        ctx.fillText(testData.receivedFrom, fieldPositions.receivedFrom.x, fieldPositions.receivedFrom.y);
                        ctx.fillText(testData.forField, fieldPositions.forField.x, fieldPositions.forField.y);

                        if (testData.chequeNo) {
                            ctx.fillText(testData.chequeNo, fieldPositions.chequeNo.x, fieldPositions.chequeNo.y);
                        }

                        const amountText = \`Rs. \${testData.amount}\`;
                        ctx.fillText(amountText, fieldPositions.amount.x, fieldPositions.amount.y);

                        // Draw checkboxes
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 2;

                        // Cash checkbox
                        ctx.strokeRect(fieldPositions.paymentCash.x, fieldPositions.paymentCash.y - 6, 16, 16);
                        if (testData.paymentCash) {
                            ctx.beginPath();
                            ctx.moveTo(fieldPositions.paymentCash.x + 3, fieldPositions.paymentCash.y);
                            ctx.lineTo(fieldPositions.paymentCash.x + 7, fieldPositions.paymentCash.y + 4);
                            ctx.lineTo(fieldPositions.paymentCash.x + 13, fieldPositions.paymentCash.y - 2);
                            ctx.stroke();
                        }

                        // Cheque checkbox
                        ctx.strokeRect(fieldPositions.paymentCheque.x, fieldPositions.paymentCheque.y - 6, 16, 16);
                        if (testData.paymentCheque) {
                            ctx.beginPath();
                            ctx.moveTo(fieldPositions.paymentCheque.x + 3, fieldPositions.paymentCheque.y);
                            ctx.lineTo(fieldPositions.paymentCheque.x + 7, fieldPositions.paymentCheque.y + 4);
                            ctx.lineTo(fieldPositions.paymentCheque.x + 13, fieldPositions.paymentCheque.y - 2);
                            ctx.stroke();
                        }

                        // Convert to data URL for testing
                        const dataUrl = canvas.toDataURL('image/png');
                        resolve({
                            success: true,
                            dataUrl: dataUrl,
                            dimensions: {
                                width: canvas.width,
                                height: canvas.height
                            }
                        });

                    } catch (error) {
                        reject(error);
                    }
                };

                templateImage.onerror = () => reject(new Error('Failed to load template image'));
            });
        }

        // Test and log results
        testReceiptGeneration()
            .then(result => {
                console.log('✅ Receipt generation test successful!');
                console.log('Canvas dimensions:', result.dimensions);
                console.log('Data URL length:', result.dataUrl.length);

                // Create image element to display result
                const img = document.createElement('img');
                img.src = result.dataUrl;
                img.style.maxWidth = '800px';
                img.style.border = '2px solid #ccc';
                document.body.appendChild(img);

                const status = document.createElement('div');
                status.innerHTML = '<h2>✅ Test Successful!</h2><p>Receipt generated with field positions:</p><ul><li>Receipt ID: (120, 98)</li><li>Date: (520, 98)</li><li>Received From: (180, 198)</li><li>Description: (180, 248)</li><li>Amount: (200, 348)</li><li>Cash Checkbox: (200, 398)</li><li>Cheque Checkbox: (320, 398)</li></ul>';
                document.body.appendChild(status);
            })
            .catch(error => {
                console.error('❌ Test failed:', error);
                document.body.innerHTML = \`<h2>❌ Test Failed</h2><p>\${error.message}</p>\`;
            });
    </script>
</body>
</html>
`, { runScripts: "dangerously" });

console.log("Test HTML created. Opening in browser...");
const fs = require('fs');
fs.writeFileSync('test_invoice.html', dom.serialize());
console.log("Test file saved as test_invoice.html");