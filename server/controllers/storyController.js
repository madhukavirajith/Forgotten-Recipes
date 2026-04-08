const Story = require('../models/Story');


exports.getAllStories = async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stories', details: err.message });
  }
};


exports.createStory = async (req, res) => {
  try {
    const { title, content, image } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const newStory = new Story({ title, content, image });
    const saved = await newStory.save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create story', details: err.message });
  }
};


exports.updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedStory = await Story.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedStory) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json(updatedStory);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update story', details: err.message });
  }
};


exports.deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Story.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json({ message: 'Story deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete story', details: err.message });
  }
};


