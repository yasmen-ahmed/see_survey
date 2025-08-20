'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if the ran_room table exists
      const tableExists = await queryInterface.showAllTables();
      const ranRoomTableExists = tableExists.includes('ran_room');

      if (!ranRoomTableExists) {
        // Create the table if it doesn't exist
        await queryInterface.createTable('ran_room', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          session_id: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
          },
          number_of_cabinets: {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          ran_equipment: {
            type: Sequelize.JSON,
            defaultValue: {}
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          }
        });

        console.log('Created ran_room table');
      } else {
        // Table exists, check if we need to add the ran_equipment column
        const tableDescription = await queryInterface.describeTable('ran_room');
        
        if (!tableDescription.ran_equipment) {
          // Add the ran_equipment column if it doesn't exist
          await queryInterface.addColumn('ran_room', 'ran_equipment', {
            type: Sequelize.JSON,
            defaultValue: {}
          });
          console.log('Added ran_equipment column to ran_room table');
        }

        // Check if we need to remove old columns and migrate data
        const oldColumns = [
          'ran_equipment_vendor',
          'free_slots_in_existing_ran_racks', 
          'type_of_rack_with_free_slots',
          'more_than_one_location_available',
          'length_of_transmission_cable',
          'ran_equipment_data'
        ];

        for (const column of oldColumns) {
          if (tableDescription[column]) {
            // Migrate data from old column to ran_equipment JSON
            const records = await queryInterface.sequelize.query(
              `SELECT id, session_id, ${column} FROM ran_room WHERE ${column} IS NOT NULL`,
              { type: Sequelize.QueryTypes.SELECT }
            );

            for (const record of records) {
              const existingData = record.ran_equipment || {};
              let newData = { ...existingData };

              // Map old column names to new JSON structure
              switch (column) {
                case 'ran_equipment_vendor':
                  newData.ran_equipment_vendor = record[column] || [];
                  break;
                case 'free_slots_in_existing_ran_racks':
                  newData.free_slots_in_ran_racks = record[column] || '';
                  break;
                case 'type_of_rack_with_free_slots':
                  newData.rack_type_with_free_slots = record[column] || [];
                  break;
                case 'more_than_one_location_available':
                  newData.available_locations_for_nokia_hw = record[column] || [];
                  break;
                case 'length_of_transmission_cable':
                  newData.transmission_cable_length = record[column] || '';
                  break;
                case 'ran_equipment_data':
                  // Merge existing data with new structure
                  if (record[column]) {
                    newData = { ...newData, ...record[column] };
                  }
                  break;
              }

              await queryInterface.sequelize.query(
                `UPDATE ran_room SET ran_equipment = ? WHERE id = ?`,
                {
                  replacements: [JSON.stringify(newData), record.id],
                  type: Sequelize.QueryTypes.UPDATE
                }
              );
            }

            // Remove the old column
            await queryInterface.removeColumn('ran_room', column);
            console.log(`Migrated and removed ${column} column from ran_room table`);
          }
        }
      }

      console.log('RAN Room schema update completed successfully');
    } catch (error) {
      console.error('Error updating RAN Room schema:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // This is a destructive migration, so we'll be careful with the rollback
      console.log('Rolling back RAN Room schema changes...');
      
      // Note: This rollback will lose data that was migrated to the JSON structure
      // In a production environment, you might want to implement a more sophisticated rollback
      
      const tableDescription = await queryInterface.describeTable('ran_room');
      
      if (tableDescription.ran_equipment) {
        await queryInterface.removeColumn('ran_room', 'ran_equipment');
        console.log('Removed ran_equipment column from ran_room table');
      }

      console.log('RAN Room schema rollback completed');
    } catch (error) {
      console.error('Error rolling back RAN Room schema:', error);
      throw error;
    }
  }
}; 