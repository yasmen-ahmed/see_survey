const axios = require('axios');

// Test the DC CB options endpoints
async function testDCCBOptions() {
  const baseURL = 'http://localhost:3000/api';
  const sessionId = 'test-session-123';

  console.log('🧪 Testing DC CB Options API\n');

  try {
    // Test 1: Get specific DC CB options for a cabinet reference
    console.log('📋 Test 1: Get DC CB Options for Cabinet 1, BLVD index 0');
    console.log('GET /external-dc-distribution/dc-cb-options/test-session-123/1-BLVD-0\n');
    
    const response1 = await axios.get(`${baseURL}/external-dc-distribution/dc-cb-options/${sessionId}/1-BLVD-0`);
    console.log('✅ Response:');
    console.log(JSON.stringify(response1.data, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Get all DC CB options for caching
    console.log('📋 Test 2: Get All DC CB Options (for caching)');
    console.log('GET /external-dc-distribution/all-dc-cb-options/test-session-123\n');
    
    const response2 = await axios.get(`${baseURL}/external-dc-distribution/all-dc-cb-options/${sessionId}`);
    console.log('✅ Response (first 3 entries):');
    const entries = Object.entries(response2.data.all_dc_cb_options);
    const firstThree = Object.fromEntries(entries.slice(0, 3));
    console.log(JSON.stringify({
      session_id: response2.data.session_id,
      all_dc_cb_options: firstThree,
      cache_info: response2.data.cache_info,
      total_entries: entries.length
    }, null, 2));
    console.log('\n' + '='.repeat(60) + '\n');

    // Test 3: Error handling - invalid cabinet reference
    console.log('📋 Test 3: Error Handling - Invalid Cabinet Reference');
    console.log('GET /external-dc-distribution/dc-cb-options/test-session-123/invalid-ref\n');
    
    try {
      await axios.get(`${baseURL}/external-dc-distribution/dc-cb-options/${sessionId}/invalid-ref`);
    } catch (error) {
      console.log('✅ Error Response (as expected):');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    console.log('\n' + '='.repeat(60) + '\n');

    // Test 4: Performance comparison
    console.log('📋 Test 4: Performance Comparison');
    
    console.log('⏱️  Testing On-Demand approach (3 requests):');
    const start1 = Date.now();
    await axios.get(`${baseURL}/external-dc-distribution/dc-cb-options/${sessionId}/1-BLVD-0`);
    await axios.get(`${baseURL}/external-dc-distribution/dc-cb-options/${sessionId}/1-LLVD-0`);
    await axios.get(`${baseURL}/external-dc-distribution/dc-cb-options/${sessionId}/2-PDU-0`);
    const end1 = Date.now();
    console.log(`   Time: ${end1 - start1}ms\n`);

    console.log('⏱️  Testing Preload approach (1 request):');
    const start2 = Date.now();
    await axios.get(`${baseURL}/external-dc-distribution/all-dc-cb-options/${sessionId}`);
    const end2 = Date.now();
    console.log(`   Time: ${end2 - start2}ms\n`);

    console.log('🏆 Performance Analysis:');
    console.log(`   On-Demand (3 requests): ${end1 - start1}ms`);
    console.log(`   Preload (1 request): ${end2 - start2}ms`);
    console.log(`   Difference: ${Math.abs((end1 - start1) - (end2 - start2))}ms`);
    
    if (end2 - start2 < end1 - start1) {
      console.log('   🚀 Preload is faster for multiple requests');
    } else {
      console.log('   🎯 On-demand is more efficient for single requests');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
  }
}

// Frontend Usage Example
function frontendUsageExample() {
  console.log('\n' + '='.repeat(60));
  console.log('💻 Frontend Usage Example:');
  console.log('='.repeat(60));
  
  const exampleCode = `
// React Component for DC CB Selection
import React, { useState, useEffect } from 'react';

const DCCBFuseSelector = ({ sessionId, cabinetRef, onChange }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');

  useEffect(() => {
    if (cabinetRef && sessionId) {
      setLoading(true);
      fetch(\`/api/external-dc-distribution/dc-cb-options/\${sessionId}/\${cabinetRef}\`)
        .then(res => res.json())
        .then(data => {
          setOptions(data.dc_cb_options || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching DC CB options:', err);
          setLoading(false);
        });
    }
  }, [cabinetRef, sessionId]);

  const handleChange = (value) => {
    setSelectedValue(value);
    const selectedOption = options.find(opt => opt.value === value);
    onChange && onChange(value, selectedOption);
  };

  return (
    <div className="dc-cb-selector">
      <label>Which DC CB/fuse is feeding the PDU?</label>
      <select 
        value={selectedValue} 
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
      >
        <option value="">
          {loading ? 'Loading options...' : 'Select CB/Fuse'}
        </option>
        {options.map(option => (
          <option key={option.id} value={option.value}>
            {option.display_text}
            {option.recommended ? ' (Recommended)' : ''}
          </option>
        ))}
      </select>
      
      {selectedValue && (
        <div className="selection-info">
          <p>Selected: {options.find(opt => opt.value === selectedValue)?.display_text}</p>
          <p>Cabinet: {options.find(opt => opt.value === selectedValue)?.cabinet_info.cabinet_number}</p>
          <p>Type: {options.find(opt => opt.value === selectedValue)?.cabinet_info.distribution_type}</p>
        </div>
      )}
    </div>
  );
};

// Usage in parent component
const AntennaForm = () => {
  const [selectedCabinet, setSelectedCabinet] = useState('');
  const [dcCbValue, setDcCbValue] = useState('');

  return (
    <form>
      {/* Cabinet selection dropdown */}
      <CabinetSelector 
        onChange={setSelectedCabinet} 
        sessionId="session123"
      />
      
      {/* DC CB/Fuse selection - only shows when cabinet is selected */}
      {selectedCabinet && (
        <DCCBFuseSelector
          sessionId="session123"
          cabinetRef={selectedCabinet} // e.g., "2-BLVD-1"
          onChange={(value, option) => {
            setDcCbValue(value);
            console.log('Selected DC CB:', option);
          }}
        />
      )}
    </form>
  );
};
`;

  console.log(exampleCode);
}

// Performance recommendations
function performanceRecommendations() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Performance Recommendations:');
  console.log('='.repeat(60));
  
  const recommendations = `
📊 WHEN TO USE EACH APPROACH:

1. 🎯 ON-DEMAND (Recommended for most cases):
   - Sites with < 10 cabinets
   - Real-time data requirements
   - Mobile/low-bandwidth users
   - Memory-constrained devices

2. 🚀 PRELOAD (For performance-critical apps):
   - Sites with > 10 cabinets
   - Offline-capable applications
   - Desktop applications
   - When user frequently switches between cabinets

3. 🔄 HYBRID (Best of both worlds):
   - Intelligent caching based on usage patterns
   - Preload commonly used combinations
   - On-demand for edge cases

📈 IMPLEMENTATION STRATEGY:

Phase 1: Start with ON-DEMAND
✅ Quick to implement
✅ Works for all scenarios
✅ Low memory footprint

Phase 2: Add intelligent caching
✅ Cache frequently requested combinations
✅ Implement TTL (1 hour recommended)
✅ Monitor cache hit rates

Phase 3: Optional preloading
✅ For power users or complex sites
✅ Implement based on actual usage data
✅ Add cache warming strategies

🎯 MONITORING METRICS:
- Average response time per request
- Cache hit/miss ratio
- Data transfer volume
- User experience metrics (time to interaction)
`;

  console.log(recommendations);
}

// Run the tests
if (require.main === module) {
  console.log('🚀 Starting DC CB Options Tests...\n');
  
  testDCCBOptions()
    .then(() => {
      frontendUsageExample();
      performanceRecommendations();
      console.log('\n✅ All tests completed!');
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error.message);
    });
}

module.exports = {
  testDCCBOptions,
  frontendUsageExample,
  performanceRecommendations
}; 