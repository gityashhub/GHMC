// Test script to verify backend filtering works
const testFiltering = async () => {
    const baseUrl = 'http://localhost:3000/api/inward';

    // You'll need to replace this with a valid token from your browser
    const token = 'YOUR_TOKEN_HERE';

    console.log('Testing Inward Filtering...\n');

    // Test 1: No filters
    console.log('1. Fetching all entries (no filters)...');
    let response = await fetch(`${baseUrl}?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    let data = await response.json();
    console.log(`   Total entries: ${data.data?.pagination?.total || 0}`);
    console.log(`   Returned: ${data.data?.length || 0} entries\n`);

    // Test 2: Filter by waste name
    console.log('2. Filtering by wasteName="Fly Ash"...');
    response = await fetch(`${baseUrl}?wasteName=Fly Ash&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await response.json();
    console.log(`   Returned: ${data.data?.length || 0} entries`);
    if (data.data?.length > 0) {
        console.log(`   First entry waste: ${data.data[0].wasteName}`);
    }
    console.log();

    // Test 3: Filter by month
    console.log('3. Filtering by month="January"...');
    response = await fetch(`${baseUrl}?month=January&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await response.json();
    console.log(`   Returned: ${data.data?.length || 0} entries`);
    if (data.data?.length > 0) {
        console.log(`   First entry month: ${data.data[0].month}`);
    }
    console.log();

    // Test 4: Multiple filters
    console.log('4. Filtering by wasteName="Fly Ash" AND month="January"...');
    response = await fetch(`${baseUrl}?wasteName=Fly Ash&month=January&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await response.json();
    console.log(`   Returned: ${data.data?.length || 0} entries`);
    console.log();

    console.log('Test complete!');
    console.log('\nTo run this test:');
    console.log('1. Open http://localhost:8082 in your browser');
    console.log('2. Open DevTools (F12) and go to Console');
    console.log('3. Type: localStorage.getItem("token")');
    console.log('4. Copy the token value');
    console.log('5. Replace YOUR_TOKEN_HERE in this script');
    console.log('6. Run: node test_filtering.js');
};

testFiltering().catch(console.error);
