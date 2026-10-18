const express = require('express');
const {
  createTicket,
  getMyTickets,
  replyToTicket,
  getNotifications,
  markSeen
} = require('../controllers/supportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createTicket);
router.get('/mine', getMyTickets);
router.get('/notifications', getNotifications);
router.post('/:id/replies', replyToTicket);
router.post('/:id/seen', markSeen);

module.exports = router;
