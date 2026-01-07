import inwardService from './src/services/inward.service.js';
import prisma from './src/config/database.js';

import fs from 'fs';

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('reproduce_output.txt', msg + '\n');
};

const reproduce = async () => {
    fs.writeFileSync('reproduce_output.txt', ''); // Clear file
    log('--- Starting Filtering Reproduction ---');

    try {
        // 1. Fetch all to see what we have
        const allResult = await inwardService.getAllEntries({ limit: 100 });
        log(`Total entries in DB: ${allResult.pagination.total}`);
        if (allResult.entries.length > 0) {
            log(`Sample entry: wasteName="${allResult.entries[0].wasteName}", month="${allResult.entries[0].month}", manifestNo="${allResult.entries[0].manifestNo}"`);

            // 2. Filter by wasteName existing in DB
            const targetWaste = allResult.entries[0].wasteName;
            log(`\nFiltering by wasteName: "${targetWaste}"`);
            const wasteResult = await inwardService.getAllEntries({ wasteName: targetWaste });
            log(`Found: ${wasteResult.pagination.total}`);

            // 3. Search + Filter
            log(`\nSearch "LOT" + Filter wasteName: "${targetWaste}"`);
            const searchResult = await inwardService.getAllEntries({
                search: "LOT",
                wasteName: targetWaste
            });
            log(`Found: ${searchResult.pagination.total}`);

            // 4. Month Filter
            const targetMonth = allResult.entries[0].month;
            if (targetMonth) {
                log(`\nFiltering by month: "${targetMonth}"`);
                const monthResult = await inwardService.getAllEntries({ month: targetMonth });
                log(`Found: ${monthResult.pagination.total}`);

                log(`\nGlobal Search for month: "${targetMonth}"`);
                const globalSearchResult = await inwardService.getAllEntries({ search: targetMonth });
                log(`Found (should be >0 if global search works for month): ${globalSearchResult.pagination.total}`);
            } else {
                log('\nSkipping Month filter test (first entry has no month)');
            }
        } else {
            log('No entries found in DB.');
        }

    } catch (error) {
        log(`Error during reproduction: ${error}`);
    } finally {
        await prisma.$disconnect();
    }
    log('\n--- End ---');
};

reproduce();
