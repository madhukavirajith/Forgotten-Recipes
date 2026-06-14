const Blog = require('../models/Blog');
const User = require('../models/User');
const Comment = require('../models/Comment');

exports.createBlog = async (req, res) => {
  try {
    const { title, content, image, category, tags, authorName, status } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }
    const blog = new Blog({ 
      title, 
      content, 
      image, 
      category, 
      tags,
      author: req.user?._id || req.user?.id,
      authorName: authorName || req.user?.name || 'Admin',
      status: status || 'Draft'
    });
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBlogs = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 6);
    const { category, search, tag } = req.query;

    const query = { status: 'Published' };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (tag && tag !== 'all') {
      query.tags = tag;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const total = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      blogs,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdminBlogs = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const skip = (page - 1) * limit;
    const total = await Blog.countDocuments({});
    const blogs = await Blog.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      blogs,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { title, content, image, category, tags, authorName, status } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.content = content;
    if (image !== undefined) blog.image = image;
    if (category !== undefined) blog.category = category;
    if (tags !== undefined) blog.tags = tags;
    if (authorName !== undefined) blog.authorName = authorName;
    if (status !== undefined) blog.status = status;
    
    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    await blog.deleteOne();
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.likeBlog = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Login required' });
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog post not found' });

    const userLikeIndex = blog.likes.indexOf(req.user._id);
    if (userLikeIndex > -1) {
      blog.likes.splice(userLikeIndex, 1);
    } else {
      blog.likes.push(req.user._id);
    }

    await blog.save();
    res.json({ likes: blog.likes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bookmarkBlog = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Login required' });
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog post not found' });

    const bookmarkIndex = user.bookmarkedBlogs.indexOf(blog._id);
    let bookmarked = false;
    
    if (bookmarkIndex > -1) {
      user.bookmarkedBlogs.splice(bookmarkIndex, 1);
      blog.bookmarksCount = Math.max(0, (blog.bookmarksCount || 1) - 1);
    } else {
      user.bookmarkedBlogs.push(blog._id);
      blog.bookmarksCount = (blog.bookmarksCount || 0) + 1;
      bookmarked = true;
    }

    await user.save();
    await blog.save();
    res.json({ bookmarked, bookmarksCount: blog.bookmarksCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBlogComments = async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const allComments = await Comment.find({ blog: blogId })
      .sort({ createdAt: -1 })
      .populate('user', 'name')
      .populate('reactions.user', 'name');

    const commentMap = new Map();
    const rootComments = [];

    allComments.forEach(comment => {
      commentMap.set(comment._id.toString(), { ...comment.toObject(), replies: [] });
    });

    allComments.forEach(comment => {
      const commentObj = commentMap.get(comment._id.toString());
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId.toString());
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedComments = rootComments.slice(startIndex, endIndex);

    res.json({
      comments: paginatedComments,
      total: rootComments.length,
      page,
      pages: Math.ceil(rootComments.length / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addBlogComment = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Login required' });

    const { id: blogId } = req.params;
    const { text, parentId } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Text required' });

    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment || parentComment.blog.toString() !== blogId) {
        return res.status(400).json({ message: 'Invalid parent comment' });
      }
    }

    const comment = await Comment.create({
      blog: blogId,
      user: req.user._id,
      text: text.trim(),
      parentId: parentId || null,
    });

    await Blog.findByIdAndUpdate(blogId, { $inc: { commentsCount: 1 } });
    const populated = await comment.populate('user', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBlogComment = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Login required' });

    const { id: blogId, commentId } = req.params;
    const c = await Comment.findById(commentId);
    if (!c) return res.status(404).json({ message: 'Comment not found' });

    const isOwner = c.user?.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    await c.deleteOne();
    await Blog.findByIdAndUpdate(blogId, { $inc: { commentsCount: -1 } });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.editBlogComment = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Login required' });

    const { id: blogId, commentId } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Text required' });

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isOwner = comment.user?.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    comment.text = text.trim();
    await comment.save();
    const populated = await comment.populate('user', 'name');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};