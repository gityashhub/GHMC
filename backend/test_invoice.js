
import axios from 'axios';

async function testInvoiceCreation() {
    try {
        const response = await axios.post('http://localhost:5000/api/invoices', {
            type: "Inward",
            date: "2025-01-03",
            companyId: "f69e451c-fda1-4b45-9562-b2086d3912c2", // Ambuja Cement ID from previous debug
            materials: [{
                materialName: "Test Waste Debug",
                quantity: 10,
                rate: 10,
                amount: 100,
                unit: "Kg"
            }],
            subtotal: 100,
            cgstRate: 9,
            sgstRate: 9,
            paymentReceived: 118,
            paymentReceivedOn: "2025-01-03"
        });
        console.log('Response Status:', response.data.data.invoice.status); // Check status directly
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testInvoiceCreation();
