// Quick test to verify backend filtering
// Run this with: node backend/quick_filter_test.js

const testBackendFiltering = () => {
    console.log('\n=== BACKEND FILTER LOGIC TEST ===\n');

    // Simulate the backend logic
    const where = {};
    const andConditions = [];

    // Simulate parameters
    const search = '';  // Empty search
    const wasteName = 'fly';  // User typed "fly"

    if (search) {
        andConditions.push({
            OR: [
                { manifestNo: { contains: search, mode: 'insensitive' } },
                { lotNo: { contains: search, mode: 'insensitive' } },
                { wasteName: { contains: search, mode: 'insensitive' } },
            ]
        });
    }

    if (wasteName) {
        andConditions.push({ wasteName: { contains: wasteName, mode: 'insensitive' } });
    }

    if (andConditions.length > 0) {
        where.AND = andConditions;
    }

    console.log('Input Parameters:');
    console.log('  search:', search || '(empty)');
    console.log('  wasteName:', wasteName);
    console.log('\nGenerated Prisma WHERE clause:');
    console.log(JSON.stringify(where, null, 2));
    console.log('\nExpected behavior:');
    console.log('  ✓ Should only return entries where wasteName contains "fly"');
    console.log('  ✓ Should NOT return "Processed Waste" or "Semi Processed Waste"');
    console.log('\nIf you see entries that don\'t contain "fly", the issue is:');
    console.log('  1. Frontend is not sending wasteName parameter');
    console.log('  2. Frontend is sending search parameter with old value');
    console.log('  3. React Query is showing cached data');
};

testBackendFiltering();
