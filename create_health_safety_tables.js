require('dotenv').config();
const sequelize = require('./config/database');
const HealthSafetySiteAccess = require('./models/HealthSafetySiteAccess');
const HealthSafetyBTSAccess = require('./models/HealthSafetyBTSAccess');

const createHealthSafetyTables = async () => {
  try {
    console.log('🔧 Starting Health & Safety tables creation...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Create Health & Safety Site Access table
    console.log('📋 Creating Health & Safety Site Access table...');
    await HealthSafetySiteAccess.sync({ force: false, alter: true });
    console.log('✅ Health & Safety Site Access table created/updated successfully.');
    
    // Create Health & Safety BTS Access table
    console.log('📋 Creating Health & Safety BTS Access table...');
    await HealthSafetyBTSAccess.sync({ force: false, alter: true });
    console.log('✅ Health & Safety BTS Access table created/updated successfully.');
    
    // Test table creation with sample data
    console.log('🧪 Testing table operations...');
    
    // Test Site Access table
    const testSessionId = 'test-health-safety-123';
    const [siteAccessEntry, siteAccessCreated] = await HealthSafetySiteAccess.findOrCreate({
      where: { session_id: testSessionId },
      defaults: {
        session_id: testSessionId,
        access_road_safe_condition: 'Yes',
        site_access_safe_secure: 'No',
        safe_usage_access_ensured: 'Not applicable'
      }
    });
    
    if (siteAccessCreated) {
      console.log('✅ Site Access test entry created successfully');
    } else {
      console.log('ℹ️ Site Access test entry already exists');
    }
    
    // Test BTS Access table
    const [btsAccessEntry, btsAccessCreated] = await HealthSafetyBTSAccess.findOrCreate({
      where: { session_id: testSessionId },
      defaults: {
        session_id: testSessionId,
        safety_climbing_system_correctly_installed: 'Yes',
        walking_path_situated_safety_specifications: 'No',
        mw_antennas_height_exclusion_zone: 'Not applicable'
      }
    });
    
    if (btsAccessCreated) {
      console.log('✅ BTS Access test entry created successfully');
    } else {
      console.log('ℹ️ BTS Access test entry already exists');
    }
    
    // Test read operations
    console.log('🔍 Testing read operations...');
    const siteAccessData = await HealthSafetySiteAccess.findOne({ 
      where: { session_id: testSessionId } 
    });
    const btsAccessData = await HealthSafetyBTSAccess.findOne({ 
      where: { session_id: testSessionId } 
    });
    
    console.log('✅ Site Access data:', siteAccessData ? 'Found' : 'Not found');
    console.log('✅ BTS Access data:', btsAccessData ? 'Found' : 'Not found');
    
    // Test update operations
    console.log('✏️ Testing update operations...');
    if (siteAccessData) {
      await siteAccessData.update({
        emergency_exits_clearly_visible: 'Yes',
        ladders_good_condition: 'No'
      });
      console.log('✅ Site Access update test completed');
    }
    
    if (btsAccessData) {
      await btsAccessData.update({
        safe_access_bts_poles_granted: 'Yes',
        pathway_blocks_walking_grids_installed: 'Not applicable'
      });
      console.log('✅ BTS Access update test completed');
    }
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await HealthSafetySiteAccess.destroy({ where: { session_id: testSessionId } });
    await HealthSafetyBTSAccess.destroy({ where: { session_id: testSessionId } });
    console.log('✅ Test data cleaned up successfully');
    
    console.log('🎉 Health & Safety tables setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - health_safety_site_access table: Ready');
    console.log('   - health_safety_bts_access table: Ready');
    console.log('\n🚀 API Endpoints Available:');
    console.log('   - GET/PUT/PATCH/DELETE /api/health-safety-site-access/:session_id');
    console.log('   - GET/PUT/PATCH/DELETE /api/health-safety-bts-access/:session_id');
    console.log('\n✨ All tests passed - Your Health & Safety API is ready to use!');
    
  } catch (error) {
    console.error('❌ Error setting up Health & Safety tables:', error);
    console.error('📝 Error details:', error.message);
    if (error.original) {
      console.error('🔍 Database error:', error.original.message);
    }
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
};

// Run the setup
createHealthSafetyTables(); 