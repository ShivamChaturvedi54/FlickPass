const firestoreService = require('../services/firestoreService');

const showsController = {
  /**
   * GET /api/shows/:id/seats
   * Fetch full seat layout from Firestore:
   * - Permanent reservations from Firestore seats collection
   * - Temporary active locks from Firestore seat_locks collection
   */
  async getShowSeats(req, res) {
    try {
      const { id: showId } = req.params;
      const { userId } = req.query;

      const data = await firestoreService.getShowSeats(showId, userId);

      if (!data) {
        return res.status(404).json({ success: false, message: 'Show not found' });
      }

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('getShowSeats error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch seats', error: error.message });
    }
  },

  /**
   * GET /api/shows/:id
   * Get show details from Firestore
   */
  async getShowById(req, res) {
    try {
      const { id } = req.params;
      const show = await firestoreService.getShowById(id);

      if (!show) {
        return res.status(404).json({ success: false, message: 'Show not found' });
      }

      res.json({ success: true, data: show });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch show', error: error.message });
    }
  },
};

module.exports = showsController;
