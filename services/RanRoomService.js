const RanRoom = require('../models/RanRomm');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class RanRoomService {
  /**
   * Get cabinet count from outdoor cabinets table
   */
  static async getCabinetCountFromOutdoorCabinets(sessionId) {
    try {
      const [result] = await sequelize.query(`
        SELECT number_of_cabinets 
        FROM outdoor_cabinets 
        WHERE session_id = ?
      `, {
        replacements: [sessionId],
        type: sequelize.QueryTypes.SELECT
      });

      return result ? result.number_of_cabinets : 0;
    } catch (error) {
      console.warn('Could not get cabinet count from outdoor cabinets:', error);
      return 0;
    }
  }

  /**
   * Get or create RAN room data for a session
   */
  static async getOrCreateBySessionId(sessionId, updateData = null) {
    try {
      if (!sessionId || sessionId.trim() === '') {
        throw {
          type: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        };
      }

      let ranRoom = await RanRoom.findOne({
        where: { session_id: sessionId }
      });

      if (!ranRoom) {
        // Get cabinet count from outdoor cabinets
        const cabinetCount = await this.getCabinetCountFromOutdoorCabinets(sessionId);
        
        // Create new record with default values
        ranRoom = await RanRoom.create({
          session_id: sessionId,
          number_of_cabinets: cabinetCount,
          ran_equipment: {
            // BTS table fields
            how_many_base_band_onsite: '',
            bts_table: [],
            
            // RAN equipment fields
            how_many_racks_for_ran_bts: '',
            ran_equipment_vendor: [],
            free_slots_in_ran_racks: '',
            rack_type_with_free_slots: [],
            available_locations_for_nokia_hw: [],
            new_installation_location: [],
            transmission_cable_length: '',
            
            // Legacy fields (keeping for compatibility)
            existing_location: '',
            existing_vendor: '',
            existing_type_model: [],
            length_of_transmission_cable: ''
          }
        });
      } else {
        // Update cabinet count from outdoor cabinets if record exists
        const cabinetCount = await this.getCabinetCountFromOutdoorCabinets(sessionId);
        if (ranRoom.number_of_cabinets !== cabinetCount) {
          await ranRoom.update({ number_of_cabinets: cabinetCount });
        }
      }

      // Update with new data if provided
      if (updateData) {
        const updateFields = {};
        
        // Update number of cabinets if provided
        if (updateData.number_of_cabinets !== undefined) {
          updateFields.number_of_cabinets = updateData.number_of_cabinets;
        }

        // Update RAN equipment data
        if (updateData.ran_equipment !== undefined) {
          updateFields.ran_equipment = updateData.ran_equipment;
        }

        await ranRoom.update(updateFields);
        await ranRoom.reload();
      }

      return {
        session_id: ranRoom.session_id,
        numberOfCabinets: ranRoom.number_of_cabinets,
        ranEquipment: ranRoom.ran_equipment,
        created_at: ranRoom.created_at,
        updated_at: ranRoom.updated_at
      };

    } catch (error) {
      console.error('RanRoomService.getOrCreateBySessionId Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to get or create RAN room data'
      };
    }
  }

  /**
   * Update RAN room data for a session
   */
  static async updateBySessionId(sessionId, updateData) {
    try {
      if (!sessionId || sessionId.trim() === '') {
        throw {
          type: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        };
      }

      const ranRoom = await RanRoom.findOne({
        where: { session_id: sessionId }
      });

      if (!ranRoom) {
        throw {
          type: 'NOT_FOUND',
          message: 'RAN room data not found for this session'
        };
      }

      const updateFields = {};
      
      // Update number of cabinets if provided
      if (updateData.number_of_cabinets !== undefined) {
        updateFields.number_of_cabinets = updateData.number_of_cabinets;
      }

      // Update RAN equipment data
      if (updateData.ran_equipment !== undefined) {
        updateFields.ran_equipment = updateData.ran_equipment;
      }

      await ranRoom.update(updateFields);
      await ranRoom.reload();

      return {
        session_id: ranRoom.session_id,
        numberOfCabinets: ranRoom.number_of_cabinets,
        ranEquipment: ranRoom.ran_equipment,
        created_at: ranRoom.created_at,
        updated_at: ranRoom.updated_at
      };

    } catch (error) {
      console.error('RanRoomService.updateBySessionId Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to update RAN room data'
      };
    }
  }

  /**
   * Get RAN room data by session ID
   */
  static async getBySessionId(sessionId) {
    try {
      if (!sessionId || sessionId.trim() === '') {
        throw {
          type: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        };
      }

      const ranRoom = await RanRoom.findOne({
        where: { session_id: sessionId }
      });

      if (!ranRoom) {
        throw {
          type: 'NOT_FOUND',
          message: 'RAN room data not found for this session'
        };
      }

      return {
        session_id: ranRoom.session_id,
        numberOfCabinets: ranRoom.number_of_cabinets,
        ranEquipment: ranRoom.ran_equipment,
        created_at: ranRoom.created_at,
        updated_at: ranRoom.updated_at
      };

    } catch (error) {
      console.error('RanRoomService.getBySessionId Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to get RAN room data'
      };
    }
  }

  /**
   * Delete RAN room data by session ID
   */
  static async deleteBySessionId(sessionId) {
    try {
      if (!sessionId || sessionId.trim() === '') {
        throw {
          type: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        };
      }

      const result = await RanRoom.destroy({
        where: { session_id: sessionId }
      });

      if (result === 0) {
        throw {
          type: 'NOT_FOUND',
          message: 'RAN room data not found for this session'
        };
      }

      return {
        success: true,
        message: 'RAN room data deleted successfully'
      };

    } catch (error) {
      console.error('RanRoomService.deleteBySessionId Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to delete RAN room data'
      };
    }
  }

  /**
   * Get all RAN room data
   */
  static async getAll(limit = 100, offset = 0) {
    try {
      const ranRooms = await RanRoom.findAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      return ranRooms.map(ranRoom => ({
        session_id: ranRoom.session_id,
        numberOfCabinets: ranRoom.number_of_cabinets,
        ranEquipment: ranRoom.ran_equipment,
        created_at: ranRoom.created_at,
        updated_at: ranRoom.updated_at
      }));

    } catch (error) {
      console.error('RanRoomService.getAll Error:', error);
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to get all RAN room data'
      };
    }
  }

  /**
   * Refresh cabinet count from outdoor cabinets
   */
  static async refreshCabinetCount(sessionId) {
    try {
      if (!sessionId || sessionId.trim() === '') {
        throw {
          type: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        };
      }

      const cabinetCount = await this.getCabinetCountFromOutdoorCabinets(sessionId);
      
      const ranRoom = await RanRoom.findOne({
        where: { session_id: sessionId }
      });

      if (ranRoom) {
        await ranRoom.update({ number_of_cabinets: cabinetCount });
        await ranRoom.reload();
      }

      return {
        session_id: sessionId,
        numberOfCabinets: cabinetCount
      };

    } catch (error) {
      console.error('RanRoomService.refreshCabinetCount Error:', error);
      
      if (error.type) {
        throw error;
      }
      
      throw {
        type: 'INTERNAL_ERROR',
        message: 'Failed to refresh cabinet count'
      };
    }
  }
}

module.exports = RanRoomService; 