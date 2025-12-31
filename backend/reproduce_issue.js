
import http from 'http';
import fs from 'fs';

// 1. Login to get token
const loginData = JSON.stringify({
    email: 'employee@chemwaste.com',
    password: 'employee123'
});

const loginReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Login Response:', data); // Log raw login response
        if (res.statusCode !== 200) {
            console.log('Login failed');
            return;
        }
        const parsed = JSON.parse(data);
        // Check where token is
        const token = parsed.token || (parsed.data && parsed.data.token);

        if (!token) {
            console.log('Token not found in response');
            return;
        }
        console.log('Token obtained');
        createEntry(token);
    });
});

loginReq.write(loginData);
loginReq.end();

function createEntry(token) {
    const postData = JSON.stringify({
        date: "2025-12-31",
        cementCompany: "Test Company",
        manifestNo: "TEST-123",
        quantity: 10,
        unit: "MT",
        wasteName: "Test Waste",
        vehicleNo: "TS08UB1234"
    });

    const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/outward',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length,
            'Authorization': `Bearer ${token}`
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const output = {
                statusCode: res.statusCode,
                body: data
            };
            fs.writeFileSync('debug_output.json', JSON.stringify(output, null, 2));
            console.log('Output written to debug_output.json');
        });
    });

    req.write(postData);
    req.end();
}
