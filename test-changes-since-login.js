const axios = require('axios');

const API_URL = 'http://localhost:8000/api/v1';

// Test admin credentials
const adminCredentials = {
  username: 'admin',
  password: 'admin123'
};

async function testChangesSinceLastLogin() {
  try {
    console.log('🧪 Testing Changes Since Last Login Feature...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/admin/login`, adminCredentials);
    const { accessToken } = loginResponse.data.data;
    console.log('✅ Login successful\n');

    // Step 2: Test enhanced dashboard stats
    console.log('2. Testing enhanced dashboard stats...');
    const enhancedStatsResponse = await axios.get(`${API_URL}/admin/dashboard/enhanced-stats?days=30`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Enhanced stats retrieved successfully');
    console.log('📊 Enhanced Stats Data:', JSON.stringify(enhancedStatsResponse.data.data, null, 2));
    console.log('');

    // Step 3: Test changes since last login
    console.log('3. Testing changes since last login...');
    const changesResponse = await axios.get(`${API_URL}/admin/changes-since-login`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Changes since last login retrieved successfully');
    console.log('📈 Changes Data:', JSON.stringify(changesResponse.data.data, null, 2));
    console.log('');

    // Step 4: Test regular dashboard stats (for comparison)
    console.log('4. Testing regular dashboard stats...');
    const regularStatsResponse = await axios.get(`${API_URL}/admin/dashboard/stats?days=30`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Regular stats retrieved successfully');
    console.log('📊 Regular Stats Data:', JSON.stringify(regularStatsResponse.data.data, null, 2));
    console.log('');

    // Step 5: Logout
    console.log('5. Logging out...');
    await axios.post(`${API_URL}/admin/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Logout successful\n');

    console.log('🎉 All tests passed! The changes since last login feature is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testChangesSinceLastLogin(); 