const prisma = require('../services/prismaClient');
const redisService = require('../services/redisService');

const showsController = {
  /**
   * GET /api/shows/:id/seats
   * Fetch the full seat layout merging:
   * - Permanent reservations from PostgreSQL
   * - Temporary locks from Redis
   */
  async getShowSeats(req, res) {
    try {
      const { id: showId } = req.params;
      const { userId } = req.query; // optional - to identify user's own locks

      // Fetch show info
      const show = await prisma.show.findUnique({
        where: { id: showId },
        include: {
          movie: { select: { title: true, posterUrl: true, durationMins: true } },
          theater: true,
        },
      });

      if (!show) {
        return res.status(404).json({ success: false, message: 'Show not found' });
      }

      // Fetch all seats from DB
      const seats = await prisma.seat.findMany({
        where: { showId },
        orderBy: [{ rowLabel: 'asc' }, { seatNumber: 'asc' }],
      });

      // Get Redis temporary locks for this show
      const redisLocks = await redisService.getLockedSeats(showId);

      // Get minimum TTL across user's own locks
      let lockExpiresAt = null;
      if (userId) {
        const userLockedSeatIds = Object.entries(redisLocks)
          .filter(([, lockedUserId]) => lockedUserId === userId)
          .map(([seatId]) => seatId);

        if (userLockedSeatIds.length > 0) {
          // Get TTL for first locked seat
          const ttl = await redisService.getSeatLockTTL(showId, userLockedSeatIds[0]);
          if (ttl > 0) {
            lockExpiresAt = new Date(Date.now() + ttl * 1000).toISOString();
          }
        }
      }

      // Merge seat status
      const enrichedSeats = seats.map((seat) => {
        let status = 'AVAILABLE';

        if (seat.isReserved) {
          status = 'BOOKED';
        } else if (redisLocks[seat.id]) {
          const lockOwner = redisLocks[seat.id];
          if (userId && lockOwner === userId) {
            status = 'SELECTED'; // User's own lock
          } else {
            status = 'LOCKED_TEMPORARY'; // Someone else's lock
          }
        }

        return {
          ...seat,
          status,
          lockedBy: redisLocks[seat.id] || null,
        };
      });

      // Group by row
      const seatsByRow = {};
      for (const seat of enrichedSeats) {
        if (!seatsByRow[seat.rowLabel]) {
          seatsByRow[seat.rowLabel] = [];
        }
        seatsByRow[seat.rowLabel].push(seat);
      }

      const stats = {
        total: seats.length,
        available: enrichedSeats.filter((s) => s.status === 'AVAILABLE').length,
        booked: enrichedSeats.filter((s) => s.status === 'BOOKED').length,
        lockedTemporary: enrichedSeats.filter((s) => s.status === 'LOCKED_TEMPORARY').length,
        selected: enrichedSeats.filter((s) => s.status === 'SELECTED').length,
      };

      res.json({
        success: true,
        data: {
          show,
          seatsByRow,
          seats: enrichedSeats,
          stats,
          lockExpiresAt,
        },
      });
    } catch (error) {
      console.error('getShowSeats error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch seats', error: error.message });
    }
  },

  /**
   * GET /api/shows/:id
   * Get show details
   */
  async getShowById(req, res) {
    try {
      const { id } = req.params;
      const show = await prisma.show.findUnique({
        where: { id },
        include: {
          movie: true,
          theater: true,
        },
      });

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
