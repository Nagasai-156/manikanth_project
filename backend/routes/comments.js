const express = require('express');
const { supabase } = require('../config/database');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/comments/:experienceId
// @desc    Create a comment on an experience
// @access  Private
router.post('/:experienceId', authenticateToken, validate(schemas.createComment), async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { content, parentId } = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(experienceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid experience ID format',
        error: 'Invalid ID'
      });
    }

    // Check if experience exists and is approved
    const { data: experience, error: expError } = await supabase
      .from('experiences')
      .select('id, comments_count')
      .eq('id', experienceId)
      .eq('status', 'approved')
      .single();

    if (expError || !experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
        error: 'Experience Not Found'
      });
    }

    // If parentId is provided, check if parent comment exists
    if (parentId) {
      if (!uuidRegex.test(parentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent comment ID format',
          error: 'Invalid Parent ID'
        });
      }

      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', parentId)
        .eq('experience_id', experienceId)
        .eq('is_active', true)
        .single();

      if (parentError || !parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found',
          error: 'Parent Comment Not Found'
        });
      }
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        experience_id: experienceId,
        user_id: req.user.id,
        parent_id: parentId || null,
        content: content.trim()
      })
      .select(`
        id, content, parent_id, likes_count, is_edited, created_at,
        users (id, name, college, degree, course, year, profile_picture)
      `)
      .single();

    if (error) {
      console.error('Comment creation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create comment',
        error: 'Creation Failed'
      });
    }

    // Update experience comments count
    const newCommentsCount = (experience.comments_count || 0) + 1;
    await supabase
      .from('experiences')
      .update({ comments_count: newCommentsCount })
      .eq('id', experienceId);

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: { comment }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during comment creation',
      error: 'Creation Failed'
    });
  }
});

// @route   GET /api/comments/:experienceId
// @desc    Get comments for an experience
// @access  Public
router.get('/:experienceId', async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'asc' } = req.query;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(experienceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid experience ID format',
        error: 'Invalid ID'
      });
    }

    // Check if experience exists and is approved
    const { data: experience, error: expError } = await supabase
      .from('experiences')
      .select('id')
      .eq('id', experienceId)
      .eq('status', 'approved')
      .single();

    if (expError || !experience) {
      return res.status(404).json({
        success: false,
        message: 'Experience not found',
        error: 'Experience Not Found'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get top-level comments first
    const { data: comments, error, count } = await supabase
      .from('comments')
      .select(`
        id, content, parent_id, likes_count, is_edited, edited_at, created_at,
        users (id, name, college, degree, course, year, profile_picture)
      `, { count: 'exact' })
      .eq('experience_id', experienceId)
      .eq('is_active', true)
      .is('parent_id', null) // Only top-level comments
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('Get comments error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch comments',
        error: 'Fetch Failed'
      });
    }

    // Get replies for each top-level comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const { data: replies, error: repliesError } = await supabase
          .from('comments')
          .select(`
            id, content, parent_id, likes_count, is_edited, edited_at, created_at,
            users (id, name, college, degree, course, year, profile_picture)
          `)
          .eq('parent_id', comment.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (repliesError) {
          console.error('Get replies error:', repliesError);
          return { ...comment, replies: [] };
        }

        return { ...comment, replies: replies || [] };
      })
    );

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        comments: commentsWithReplies,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching comments',
      error: 'Fetch Failed'
    });
  }
});

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private (Author only)
router.put('/:id', validate(schemas.createComment), async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Check if comment exists and user is the author
    const { data: comment, error: checkError } = await supabase
      .from('comments')
      .select('id, user_id, content')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (checkError || !comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
        error: 'Comment Not Found'
      });
    }

    if (comment.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own comments',
        error: 'Forbidden'
      });
    }

    // Update comment
    const { data: updatedComment, error } = await supabase
      .from('comments')
      .update({
        content: content.trim(),
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id, content, parent_id, likes_count, is_edited, edited_at, created_at,
        users (id, name, college, degree, course, year, profile_picture)
      `)
      .single();

    if (error) {
      console.error('Comment update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update comment',
        error: 'Update Failed'
      });
    }

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment: updatedComment }
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during comment update',
      error: 'Update Failed'
    });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private (Author only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if comment exists and user is the author
    const { data: comment, error: checkError } = await supabase
      .from('comments')
      .select('id, user_id, experience_id')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (checkError || !comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
        error: 'Comment Not Found'
      });
    }

    if (comment.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments',
        error: 'Forbidden'
      });
    }

    // Soft delete comment
    const { error: deleteError } = await supabase
      .from('comments')
      .update({ is_active: false })
      .eq('id', id);

    if (deleteError) {
      console.error('Comment deletion error:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete comment',
        error: 'Deletion Failed'
      });
    }

    // Update experience comments count
    const { data: experience } = await supabase
      .from('experiences')
      .select('comments_count')
      .eq('id', comment.experience_id)
      .single();

    if (experience) {
      const newCommentsCount = Math.max(0, (experience.comments_count || 0) - 1);
      await supabase
        .from('experiences')
        .update({ comments_count: newCommentsCount })
        .eq('id', comment.experience_id);
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during comment deletion',
      error: 'Deletion Failed'
    });
  }
});

// @route   POST /api/comments/:id/like
// @desc    Like/unlike a comment
// @access  Private
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if comment exists and is active
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, likes_count')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (commentError || !comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
        error: 'Comment Not Found'
      });
    }

    // Check if user already liked this comment
    const { data: existingLike, error: likeError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('comment_id', id)
      .single();

    if (likeError && likeError.code !== 'PGRST116') {
      console.error('Check comment like error:', likeError);
      return res.status(500).json({
        success: false,
        message: 'Failed to process like',
        error: 'Like Failed'
      });
    }

    let isLiked = false;
    let newLikesCount = comment.likes_count || 0;

    if (existingLike) {
      // Unlike - remove like
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Unlike comment error:', deleteError);
        return res.status(500).json({
          success: false,
          message: 'Failed to unlike comment',
          error: 'Unlike Failed'
        });
      }

      newLikesCount = Math.max(0, newLikesCount - 1);
      isLiked = false;
    } else {
      // Like - add like
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          user_id: req.user.id,
          comment_id: id
        });

      if (insertError) {
        console.error('Like comment error:', insertError);
        return res.status(500).json({
          success: false,
          message: 'Failed to like comment',
          error: 'Like Failed'
        });
      }

      newLikesCount = newLikesCount + 1;
      isLiked = true;
    }

    // Update likes count
    const { error: updateError } = await supabase
      .from('comments')
      .update({ likes_count: newLikesCount })
      .eq('id', id);

    if (updateError) {
      console.error('Update comment likes count error:', updateError);
    }

    res.json({
      success: true,
      message: isLiked ? 'Comment liked successfully' : 'Comment unliked successfully',
      data: {
        isLiked,
        likesCount: newLikesCount
      }
    });

  } catch (error) {
    console.error('Like/unlike comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during like operation',
      error: 'Like Failed'
    });
  }
});

module.exports = router;