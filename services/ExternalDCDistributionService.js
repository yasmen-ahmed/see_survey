const ExternalDCDistribution = require('../models/ExternalDCDistribution');
const ExternalDCDistributionImageService = require('./ExternalDCDistributionImageService');

class ExternalDCDistributionService {
  static async getBySessionId(sessionId) {
    try {
      let record = await ExternalDCDistribution.findOne({
        where: { session_id: sessionId }
      });

      if (!record) {
        return {
          session_id: sessionId,
          has_separate_dc_pdu: '',
          pdu_count: 0,
          dc_pdus: []
        };
      }

      // Get data with images
      const data = record.toJSON();
      const pdus = data.dc_pdus || [];

      // Fetch images for each PDU
      for (let i = 0; i < pdus.length; i++) {
        const images = await ExternalDCDistributionImageService.getImagesBySessionAndRecord(sessionId, i);
        pdus[i].images = images || [];
      }

      return {
        ...data,
        dc_pdus: pdus
      };
    } catch (error) {
      throw error;
    }
  }

  static async updatePDU(sessionId, pduIndex, pduData) {
    try {
      let record = await ExternalDCDistribution.findOne({
        where: { session_id: sessionId }
      });

      if (!record) {
        record = await ExternalDCDistribution.create({
          session_id: sessionId,
          has_separate_dc_pdu: '',
          pdu_count: Math.max(pduIndex + 1, 1),
          dc_pdus: []
        });
      }

      let dc_pdus = record.dc_pdus || [];
      
      // Ensure array is large enough
      while (dc_pdus.length <= pduIndex) {
        dc_pdus.push({});
      }

      // Update specific PDU
      dc_pdus[pduIndex] = {
        ...dc_pdus[pduIndex],
        ...pduData
      };

      // Update record
      await record.update({
        dc_pdus,
        pdu_count: Math.max(record.pdu_count, dc_pdus.length)
      });

      // Get images for this PDU
      const images = await ExternalDCDistributionImageService.getImagesBySessionAndRecord(
        sessionId,
        pduIndex
      );

      return {
        ...record.toJSON(),
        dc_pdus: dc_pdus.map((pdu, idx) => ({
          ...pdu,
          images: idx === pduIndex ? images : []
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  static async deletePDU(sessionId, pduIndex) {
    try {
      const record = await ExternalDCDistribution.findOne({
        where: { session_id: sessionId }
      });

      if (!record) {
        throw new Error('Record not found');
      }

      let dc_pdus = record.dc_pdus || [];
      if (pduIndex >= 0 && pduIndex < dc_pdus.length) {
        // Delete images first
        await ExternalDCDistributionImageService.deleteImagesBySessionAndRecord(sessionId, pduIndex);
        
        // Remove PDU from array
        dc_pdus.splice(pduIndex, 1);
        
        // Update record
        await record.update({
          dc_pdus,
          pdu_count: dc_pdus.length
        });
      }

      return await this.getBySessionId(sessionId);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExternalDCDistributionService; 