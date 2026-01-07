import inwardService from './src/services/inward.service.js';
import prisma from './src/config/database.js';
import fs from 'fs';

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('reproduce_creation_output.txt', msg + '\n');
};

const reproduce = async () => {
    fs.writeFileSync('reproduce_creation_output.txt', '');
    log('--- Starting Creation Reproduction ---');

    try {
        // 1. Get Company ID for "A1 Cement"
        const company = await prisma.company.findFirst({
            where: { name: { contains: 'A1 Cement', mode: 'insensitive' } } // Approximate match
        });

        if (!company) {
            log('Error: Could not find company "A1 Cement". Using first available company.');
            const anyCompany = await prisma.company.findFirst();
            if (!anyCompany) {
                throw new Error('No companies found in DB.');
            }
            log(`Using company: ${anyCompany.name} (${anyCompany.id})`);
            var companyId = anyCompany.id;
        } else {
            log(`Found company: ${company.name} (${company.id})`);
            var companyId = company.id;
        }

        // 2. Prepare payload from screenshot
        const payload = {
            date: "2026-01-06",
            companyId: companyId,
            manifestNo: "MNF00023",
            vehicleNo: "GJ16BK0023",
            wasteName: "Chemical Waste (20/MT)",
            category: "Solid",
            quantity: 50,
            unit: "MT",
            rate: 20,
            month: "February",
            lotNo: "" // Should be auto-generated
        };

        log('Attempting to create entry with payload:');
        log(JSON.stringify(payload, null, 2));

        const entry = await inwardService.createEntry(payload);
        log('Success! Entry created:');
        log(JSON.stringify(entry, null, 2));

        // 3. Test Conflict (Same Lot No)
        log('\nAttempting to create entry with SAME LotNo:');
        const payloadConflict = { ...payload, lotNo: entry.lotNo };
        try {
            await inwardService.createEntry(payloadConflict);
        } catch (e) {
            log('Caught expected error for LotNo conflict:');
            log(`Name: ${e.name}`);
            log(`Message: ${e.message}`);
            // Simulate Controller Error Handling
            if (e.name === 'ValidationError') {
                log('Controller would return 400 with details.');
            }
        }

        // 4. Test Conflict (Same ManifestNo)
        log('\nAttempting to create entry with SAME ManifestNo (Auto-gen LotNo):');
        const payloadManifest = { ...payload, lotNo: undefined }; // Let it generate new lot
        try {
            const entry2 = await inwardService.createEntry(payloadManifest);
            log('Success! Duplicate ManifestNo is ALLOWED.');
            log(`New Entry ID: ${entry2.id}`);
        } catch (e) {
            log('Caught error for ManifestNo conflict:');
            log(`Name: ${e.name}`);
            log(`Message: ${e.message}`);
        }

    } catch (error) {
        log('--- FAILED ---');
        log(error.message);
        if (error.details) {
            log(JSON.stringify(error.details, null, 2));
        }
        log(error.stack);
    } finally {
        await prisma.$disconnect();
    }
    log('\n--- End ---');
};

reproduce();
