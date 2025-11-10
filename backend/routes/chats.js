const express = require('express');
const { supabase } = require('../config/database');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/chats
// @desc    Get user's conversations
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get conversations where user is a participant
    const { data: conversations, error, count } = await supabase
      .from('conversations')
      .select(`
        id, last_message_at, created_at,
        participant1:participant1_id (id, name, college, degree, course, year, profile_picture),
        participant2:participant2_id (id, name, college, degree, course, year, profile_picture)
      `, { count: 'exact' })
      .or(`participant1_id.eq.${req.user.id},participant2_id.eq.${req.user.id}`)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('Get conversations error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations',
        error: 'Fetch Failed'
      });
    }

    // Get last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('id, content, message_type, created_at, sender_id')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count for current user
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('conversation_id', conversation.id)
          .eq('is_read', false)
          .neq('sender_id', req.user.id);

        // Determine the other participant
        const otherParticipant = conversation.participant1.id === req.user.id 
          ? conversation.participant2 
          : conversation.participant1;

        return {
          id: conversation.id,
          otherParticipant,
          lastMessage: lastMessage || null,
          unreadCount: unreadCount || 0,
          lastMessageAt: conversation.last_message_at,
          createdAt: conversation.created_at
        };
      })
    );

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        conversations: conversationsWithDetails,
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
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching conversations',
      error: 'Fetch Failed'
    });
  }
});

// @route   POST /api/chats/:userId
// @desc    Start or get conversation with a user
// @access  Private
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        error: 'Invalid ID'
      });
    }

    // Can't start conversation with yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation with yourself',
        error: 'Invalid Request'
      });
    }

    // Check if other user exists
    const { data: otherUser, error: userError } = await supabase
      .from('users')
      .select('id, name, college, degree, course, year, profile_picture, is_active')
      .eq('id', userId)
      .single();

    if (userError || !otherUser || !otherUser.is_active) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'User Not Found'
      });
    }

    // Check if conversation already exists (check both directions)
    const { data: existingConversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant1_id.eq.${req.user.id},participant2_id.eq.${userId}),and(participant1_id.eq.${userId},participant2_id.eq.${req.user.id})`);

    if (convError) {
      console.error('Check conversation error:', convError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check existing conversation',
        error: 'Check Failed'
      });
    }

    let conversationId;
    let isNew = false;

    if (existingConversations && existingConversations.length > 0) {
      conversationId = existingConversations[0].id;
    } else {
      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          participant1_id: req.user.id,
          participant2_id: userId
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Create conversation error:', createError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create conversation',
          error: 'Creation Failed'
        });
      }

      conversationId = newConversation.id;
      isNew = true;
    }

    res.json({
      success: true,
      message: isNew ? 'Conversation created' : 'Conversation found',
      data: {
        conversation: {
          id: conversationId
        },
        otherParticipant: {
          id: otherUser.id,
          name: otherUser.name,
          college: otherUser.college,
          degree: otherUser.degree,
          course: otherUser.course,
          year: otherUser.year,
          profilePicture: otherUser.profile_picture
        }
      }
    });

  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during conversation creation',
      error: 'Creation Failed'
    });
  }
});

// @route   GET /api/chats/:conversationId/messages
// @desc    Get messages in a conversation
// @access  Private
router.get('/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format',
        error: 'Invalid ID'
      });
    }

    // Check if user is participant in this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, participant1_id, participant2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
        error: 'Conversation Not Found'
      });
    }

    if (conversation.participant1_id !== req.user.id && conversation.participant2_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation',
        error: 'Forbidden'
      });
    }

    const offset = (parseInt(page) - 1) * Math.min(parseInt(limit), 20); // Max 20 messages at a time

    // Get messages
    const { data: messages, error, count } = await supabase
      .from('messages')
      .select(`
        id, content, message_type, file_url, is_read, read_at,
        is_edited, edited_at, created_at, sender_id,
        users (id, name, profile_picture)
      `, { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Math.min(parseInt(limit), 20) - 1);

    if (error) {
      console.error('Get messages error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch messages',
        error: 'Fetch Failed'
      });
    }

    // Mark messages as read for current user
    await supabase
      .from('messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', req.user.id);

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
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
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching messages',
      error: 'Fetch Failed'
    });
  }
});

// @route   POST /api/chats/:conversationId/messages
// @desc    Send a message in a conversation
// @access  Private
router.post('/:conversationId/messages', validate(schemas.createMessage), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, message_type = 'text', file_url, file_name } = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format',
        error: 'Invalid ID'
      });
    }

    // Check if user is participant in this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, participant1_id, participant2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
        error: 'Conversation Not Found'
      });
    }

    if (conversation.participant1_id !== req.user.id && conversation.participant2_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation',
        error: 'Forbidden'
      });
    }

    // Create message
    const messageData = {
      conversation_id: conversationId,
      sender_id: req.user.id,
      content: content ? content.trim() : (file_name || ''),
      message_type: message_type
    };

    // Add file_url if provided
    if (file_url) {
      messageData.file_url = file_url;
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select(`
        id, content, message_type, file_url, is_read, created_at, sender_id,
        users (id, name, profile_picture)
      `)
      .single();

    if (error) {
      console.error('Send message error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: 'Send Failed'
      });
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during message sending',
      error: 'Send Failed'
    });
  }
});

// @route   PUT /api/chats/messages/:messageId
// @desc    Edit a message
// @access  Private (Sender only)
router.put('/messages/:messageId', validate(schemas.createMessage), async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    // Check if message exists and user is the sender
    const { data: message, error: checkError } = await supabase
      .from('messages')
      .select('id, sender_id, conversation_id')
      .eq('id', messageId)
      .single();

    if (checkError || !message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
        error: 'Message Not Found'
      });
    }

    if (message.sender_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages',
        error: 'Forbidden'
      });
    }

    // Update message
    const { data: updatedMessage, error } = await supabase
      .from('messages')
      .update({
        content: content.trim(),
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select(`
        id, content, message_type, file_url, is_read, is_edited,
        edited_at, created_at, sender_id,
        users (id, name, profile_picture)
      `)
      .single();

    if (error) {
      console.error('Edit message error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to edit message',
        error: 'Edit Failed'
      });
    }

    res.json({
      success: true,
      message: 'Message edited successfully',
      data: { message: updatedMessage }
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during message editing',
      error: 'Edit Failed'
    });
  }
});

// @route   DELETE /api/chats/messages/:messageId
// @desc    Delete a message
// @access  Private (Sender only)
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    // Check if message exists and user is the sender
    const { data: message, error: checkError } = await supabase
      .from('messages')
      .select('id, sender_id')
      .eq('id', messageId)
      .single();

    if (checkError || !message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
        error: 'Message Not Found'
      });
    }

    if (message.sender_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages',
        error: 'Forbidden'
      });
    }

    // Delete message
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) {
      console.error('Delete message error:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete message',
        error: 'Deletion Failed'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during message deletion',
      error: 'Deletion Failed'
    });
  }
});

// @route   PUT /api/chats/:conversationId/read
// @desc    Mark all messages in conversation as read
// @access  Private
router.put('/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format',
        error: 'Invalid ID'
      });
    }

    // Check if user is participant in conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, participant1_id, participant2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
        error: 'Conversation Not Found'
      });
    }

    if (conversation.participant1_id !== req.user.id && conversation.participant2_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation',
        error: 'Forbidden'
      });
    }

    // Mark all messages from other user as read
    const { error: updateError } = await supabase
      .from('messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', req.user.id)
      .eq('is_read', false);

    if (updateError) {
      console.error('Mark as read error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read',
        error: 'Update Failed'
      });
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while marking messages as read',
      error: 'Update Failed'
    });
  }
});

module.exports = router;


// @route   PUT /api/chats/:conversationId/read
// @desc    Mark all messages in conversation as read
// @access  Private
router.put('/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format',
        error: 'Invalid ID'
      });
    }

    // Verify user is part of conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
        error: 'Conversation Not Found'
      });
    }

    if (conversation.participant1_id !== req.user.id && conversation.participant2_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this conversation',
        error: 'Forbidden'
      });
    }

    // Mark all messages as read (except user's own messages)
    const { error: updateError } = await supabase
      .from('messages')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', req.user.id);

    if (updateError) {
      console.error('Mark as read error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read',
        error: 'Update Failed'
      });
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while marking messages as read',
      error: 'Update Failed'
    });
  }
});
