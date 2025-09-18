import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../db/connection';
import { messages, channelMembers, users, messageReactions, emojis } from '../db/schema';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Middleware to authenticate JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: { code: 'NO_TOKEN', message: 'Authentication token required' },
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token' },
    });
  }
};

/**
 * GET /api/messages/channel/:channelId
 * Get messages for a specific channel
 */
router.get('/channel/:channelId', authenticateToken, async (req: any, res) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const limit = parseInt(req.query.limit || '50');
    const offset = parseInt(req.query.offset || '0');
    
    // Check if user is a member of this channel
    const [membership] = await db
      .select()
      .from(channelMembers)
      .where(and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, req.userId)
      ));

    if (!membership) {
      return res.status(403).json({
        error: { code: 'ACCESS_DENIED', message: 'Access denied to this channel' },
      });
    }

    // Get messages with user information
    const channelMessages = await db
      .select({
        message: messages,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(and(
        eq(messages.channelId, channelId),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Get reactions for these messages
    const messageIds = channelMessages.map(m => m.message.id);
    let reactions: any[] = [];
    
    if (messageIds.length > 0) {
      reactions = await db
        .select({
          messageId: messageReactions.messageId,
          emoji: emojis,
          user: {
            id: users.id,
            username: users.username,
            displayName: users.displayName,
          },
        })
        .from(messageReactions)
        .innerJoin(emojis, eq(messageReactions.emojiId, emojis.id))
        .innerJoin(users, eq(messageReactions.userId, users.id))
        .where(eq(messageReactions.messageId, messageIds[0])); // This would need to be improved for multiple messages
    }

    // Combine messages with their reactions
    const messagesWithReactions = channelMessages.map(({ message, user }) => ({
      ...message,
      user,
      reactions: reactions
        .filter(r => r.messageId === message.id)
        .reduce((acc: any, reaction) => {
          const emojiKey = reaction.emoji.shortcode;
          if (!acc[emojiKey]) {
            acc[emojiKey] = {
              emoji: reaction.emoji,
              users: [],
              count: 0,
            };
          }
          acc[emojiKey].users.push(reaction.user);
          acc[emojiKey].count++;
          return acc;
        }, {}),
    }));

    res.status(200).json({
      success: true,
      data: { 
        messages: messagesWithReactions.reverse(), // Oldest first for display
        hasMore: channelMessages.length === limit,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      error: { code: 'GET_MESSAGES_ERROR', message: 'Failed to get messages' },
    });
  }
});

/**
 * POST /api/messages
 * Send a new message
 */
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { channelId, content, type = 'text', threadId = null } = req.body;
    
    if (!channelId || !content) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'Channel ID and content are required' },
      });
    }

    // Check if user can post to this channel
    const [membership] = await db
      .select()
      .from(channelMembers)
      .where(and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, req.userId)
      ));

    if (!membership || !membership.canPost) {
      return res.status(403).json({
        error: { code: 'CANNOT_POST', message: 'Cannot post to this channel' },
      });
    }

    // Create the message
    const [newMessage] = await db
      .insert(messages)
      .values({
        channelId,
        userId: req.userId,
        content,
        type,
        threadId,
        attachments: [],
      })
      .returning();

    // Get the message with user information
    const [messageWithUser] = await db
      .select({
        message: messages,
        user: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.id, newMessage.id));

    res.status(201).json({
      success: true,
      data: { 
        message: {
          ...messageWithUser.message,
          user: messageWithUser.user,
          reactions: {},
        },
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      error: { code: 'SEND_MESSAGE_ERROR', message: 'Failed to send message' },
    });
  }
});

/**
 * POST /api/messages/:id/reactions
 * Add a reaction to a message
 */
router.post('/:id/reactions', authenticateToken, async (req: any, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const { emojiId } = req.body;
    
    if (!emojiId) {
      return res.status(400).json({
        error: { code: 'MISSING_EMOJI', message: 'Emoji ID is required' },
      });
    }

    // Check if message exists and user has access
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));

    if (!message) {
      return res.status(404).json({
        error: { code: 'MESSAGE_NOT_FOUND', message: 'Message not found' },
      });
    }

    // Check channel access
    const [membership] = await db
      .select()
      .from(channelMembers)
      .where(and(
        eq(channelMembers.channelId, message.channelId),
        eq(channelMembers.userId, req.userId)
      ));

    if (!membership) {
      return res.status(403).json({
        error: { code: 'ACCESS_DENIED', message: 'Access denied to this channel' },
      });
    }

    // Check if reaction already exists
    const [existingReaction] = await db
      .select()
      .from(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, req.userId),
        eq(messageReactions.emojiId, emojiId)
      ));

    if (existingReaction) {
      // Remove reaction if it exists
      await db
        .delete(messageReactions)
        .where(and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, req.userId),
          eq(messageReactions.emojiId, emojiId)
        ));

      res.status(200).json({
        success: true,
        message: 'Reaction removed',
      });
    } else {
      // Add new reaction
      await db
        .insert(messageReactions)
        .values({
          messageId,
          userId: req.userId,
          emojiId,
        });

      res.status(201).json({
        success: true,
        message: 'Reaction added',
      });
    }
  } catch (error) {
    console.error('Toggle reaction error:', error);
    res.status(500).json({
      error: { code: 'REACTION_ERROR', message: 'Failed to toggle reaction' },
    });
  }
});

export default router;
