const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const User = require('../models/User');
const authenticateToken = require('../middleware/authMiddleware');

// Get all comments for a session
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const comments = await Comment.findAll({
      where: { session_id: sessionId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }],
      order: [['created_at', 'DESC']]
    });

    // Add edit permission for each comment
    const commentsWithPermissions = comments.map(comment => {
      const commentData = comment.toJSON();
      commentData.canEdit = comment.canUserEdit(req.user.id);
      return commentData;
    });

    res.json({
      success: true,
      data: commentsWithPermissions
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
});

// Create a new comment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { session_id, comment } = req.body;
    const user_id = req.user.id;

    if (!session_id || !comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Session ID and comment are required'
      });
    }

    const newComment = await Comment.create({
      session_id,
      user_id,
      comment: comment.trim()
    });

    // Fetch the comment with user details
    const commentWithUser = await Comment.findByPk(newComment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }]
    });

    const commentData = commentWithUser.toJSON();
    commentData.canEdit = true; // New comments can always be edited by creator

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: commentData
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
});

// Update a comment
router.put('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;
    const user_id = req.user.id;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const existingComment = await Comment.findByPk(commentId);
    
    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user can edit this comment
    if (!existingComment.canUserEdit(user_id)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot edit this comment. Comments can only be edited within 1 hour of creation and only by the original author.'
      });
    }

    // Update the comment
    await existingComment.update({
      comment: comment.trim(),
      updated_at: new Date()
    });

    // Fetch updated comment with user details
    const updatedComment = await Comment.findByPk(commentId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'firstName', 'lastName']
      }]
    });

    const commentData = updatedComment.toJSON();
    commentData.canEdit = updatedComment.canUserEdit(user_id);

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: commentData
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
});

// Delete a comment
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const user_id = req.user.id;

    const comment = await Comment.findByPk(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only the comment creator can delete their comment
    if (comment.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    await comment.destroy();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
});

// Get comment count for a session
router.get('/count/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const count = await Comment.count({
      where: { session_id: sessionId }
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error counting comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to count comments',
      error: error.message
    });
  }
});

module.exports = router;
