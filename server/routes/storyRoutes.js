const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const storyController = require('../controllers/storyController');

router.get('/', storyController.getAllStories); // Public - anyone can read stories

router.post('/', protect, storyController.createStory); // Protected - admin/headchef only
router.put('/:id', protect, storyController.updateStory); // Protected - admin/headchef only
router.delete('/:id', protect, storyController.deleteStory); // Protected - admin/headchef only

module.exports = router;


