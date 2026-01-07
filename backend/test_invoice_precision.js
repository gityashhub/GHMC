
async function testInvoiceCreation() {
    try {
        // Simulate frontend unrounded calculation
        const subtotal = 10.11;
        const rate = 9;
        const cgst = (subtotal * rate) / 100;
        const sgst = (subtotal * rate) / 100;
        const unroundedGrandTotal = subtotal + cgst + sgst;

        console.log("Sending paymentReceived:", unroundedGrandTotal);

        const response = await fetch('http://localhost:5000/api/invoices', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                type: "Inward",
                date: "2025-01-03",
                companyId: "f69e451c-fda1-4b45-9562-b2086d3912c2",
                materials: [{
                    materialName: "Precision Test",
                    quantity: 1,
                    rate: 10.11,
                    amount: 10.11,
                    unit: "Kg"
                }],
                subtotal: 10.11,
                cgstRate: 9,
                sgstRate: 9,
                paymentReceived: unroundedGrandTotal, // Sending unrounded
                paymentReceivedOn: "2025-01-03"
            })
        });

        const data = await response.json();
        if (data.success) {
            console.log('Response Status:', data.data.invoice.status);
            console.log('Backend GrandTotal:', data.data.invoice.grandTotal);
            console.log('Backend PaymentReceived:', data.data.invoice.paymentReceived);
        } else {
            console.log("Error:", data);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testInvoiceCreation();
