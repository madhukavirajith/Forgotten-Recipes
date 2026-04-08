const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');


router.get('/', storyController.getAllStories);


router.post('/', storyController.createStory);


router.put('/:id', storyController.updateStory);


router.delete('/:id', storyController.deleteStory);

module.exports = router;


