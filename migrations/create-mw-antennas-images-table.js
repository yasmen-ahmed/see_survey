const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First check if the table exists
      const tableExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('mw_antennas_images'));

      if (tableExists) {
        // If table exists, check if columns exist
        const columns = await queryInterface.describeTable('mw_antennas_images');
        
        // Drop existing indexes first to avoid conflicts
        try {
          await queryInterface.removeIndex('mw_antennas_images', 'mw_antennas_images_session_id_antenna_number_image_category');
        } catch (err) {
          // Index might not exist, that's okay
        }

        if (!columns.antenna_number) {
          await queryInterface.addColumn('mw_antennas_images', 'antenna_number', {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: 'Index of the antenna in mw_antennas array'
          });
        }

        if (!columns.record_index) {
          await queryInterface.addColumn('mw_antennas_images', 'record_index', {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: 'Index for multiple records of same category'
          });
        }

        // Re-add the composite index now that we're sure the columns exist
        await queryInterface.addIndex('mw_antennas_images', 
          ['session_id', 'antenna_number', 'image_category'],
          {
            name: 'mw_antennas_images_session_id_antenna_number_image_category'
          }
        );
        
        return;
      }

      // If table doesn't exist, create it with all columns first
      await queryInterface.createTable('mw_antennas_images', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        session_id: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: 'Links to mw_antennas.session_id'
        },
        antenna_number: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: 'Index of the antenna in mw_antennas array'
        },
        record_index: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          comment: 'Index for multiple records of same category'
        },
        image_category: {
          type: DataTypes.STRING,
          allowNull: false,
          comment: 'Category of photo, e.g. antenna_1_photo'
        },
        original_filename: {
          type: DataTypes.STRING,
          allowNull: false
        },
        stored_filename: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        file_path: {
          type: DataTypes.STRING,
          allowNull: false
        },
        file_url: {
          type: DataTypes.STRING,
          allowNull: false
        },
        file_size: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        mime_type: {
          type: DataTypes.STRING,
          allowNull: false
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }
      });

      // Then add all indexes after the table and columns exist
      await queryInterface.addIndex('mw_antennas_images', ['session_id']);
      await queryInterface.addIndex('mw_antennas_images', 
        ['session_id', 'antenna_number', 'image_category'],
        {
          name: 'mw_antennas_images_session_id_antenna_number_image_category'
        }
      );
      await queryInterface.addIndex('mw_antennas_images', ['stored_filename'], { unique: true });

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('mw_antennas_images'));

      if (tableExists) {
        // Drop indexes first
        try {
          await queryInterface.removeIndex('mw_antennas_images', 'mw_antennas_images_session_id_antenna_number_image_category');
        } catch (err) {
          // Index might not exist, that's okay
        }

        const columns = await queryInterface.describeTable('mw_antennas_images');
        if (columns.record_index) {
          await queryInterface.removeColumn('mw_antennas_images', 'record_index');
        }
        if (columns.antenna_number) {
          await queryInterface.removeColumn('mw_antennas_images', 'antenna_number');
        }
      }
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
}; 