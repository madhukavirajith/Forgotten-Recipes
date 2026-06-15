const Story = require('../models/Story');

exports.getAllStories = async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 }).populate('createdBy', 'name role');
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stories', details: err.message });
  }
};

exports.createStory = async (req, res) => {
  try {
    // Check if user has permission (admin or headchef)
    if (!req.user || !['admin', 'headchef'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and head chefs can create stories.' });
    }

    const { title, content, image, category, region, author, readTime, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const newStory = new Story({ 
      title, 
      content, 
      image, 
      category,
      region,
      author,
      readTime,
      tags,
      createdBy: req.user._id,
      updatedBy: req.user._id 
    });
    const saved = await newStory.save();
    const populated = await saved.populate('createdBy', 'name role');

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create story', details: err.message });
  }
};

exports.updateStory = async (req, res) => {
  try {
    // Check if user has permission (admin or headchef)
    if (!req.user || !['admin', 'headchef'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and head chefs can update stories.' });
    }

    const { id } = req.params;
    const { title, content, image, category, region, author, readTime, tags } = req.body;

    const updateData = { 
      title, 
      content, 
      image, 
      category,
      region,
      author,
      readTime,
      tags,
      updatedBy: req.user._id 
    };
    
    const updatedStory = await Story.findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'name role')
      .populate('updatedBy', 'name role');

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
    // Check if user has permission (admin or headchef)
    if (!req.user || !['admin', 'headchef'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only admins and head chefs can delete stories.' });
    }

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


