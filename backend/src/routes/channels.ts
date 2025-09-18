import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/connection';
import { channels, channelMembers, workspaceMembers, messages, users } from '../db/schema';

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
 * GET /api/channels/workspace/:workspaceId
 * Get all channels for a specific workspace
 */
router.get('/workspace/:workspaceId', authenticateToken, async (req: any, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    
    // Check if user is a member of this workspace
    const [workspaceMember] = await db
      .select()
      .from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, req.userId)
      ));

    if (!workspaceMember) {
      return res.status(403).json({
        error: { code: 'ACCESS_DENIED', message: 'Access denied to this workspace' },
      });
    }

    // Get all channels in the workspace that the user has access to
    const userChannels = await db
      .select({
        channel: channels,
        membership: channelMembers,
      })
      .from(channelMembers)
      .innerJoin(channels, eq(channelMembers.channelId, channels.id))
      .where(and(
        eq(channels.workspaceId, workspaceId),
        eq(channelMembers.userId, req.userId)
      ))
      .orderBy(channels.name);

    // Also get public channels user is not yet a member of
    const publicChannels = await db
      .select()
      .from(channels)
      .where(and(
        eq(channels.workspaceId, workspaceId),
        eq(channels.isPrivate, false)
      ))
      .orderBy(channels.name);

    // Combine and deduplicate
    const allChannels = [...userChannels.map(uc => ({ 
      ...uc.channel, 
      isMember: true, 
      joinedAt: uc.membership.joinedAt 
    }))];

    // Add public channels user is not a member of
    for (const pubChannel of publicChannels) {
      if (!allChannels.find(c => c.id === pubChannel.id)) {
        allChannels.push({ ...pubChannel, isMember: false, joinedAt: null });
      }
    }

    res.status(200).json({
      success: true,
      data: { channels: allChannels },
    });
  } catch (error) {
    console.error('Get workspace channels error:', error);
    res.status(500).json({
      error: { code: 'GET_CHANNELS_ERROR', message: 'Failed to get channels' },
    });
  }
});

/**
 * GET /api/channels/:id
 * Get specific channel details
 */
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const channelId = parseInt(req.params.id);
    
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

    // Get channel details
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId));

    if (!channel) {
      return res.status(404).json({
        error: { code: 'CHANNEL_NOT_FOUND', message: 'Channel not found' },
      });
    }

    // Get channel members
    const members = await db
      .select({
        user: users,
        membership: channelMembers,
      })
      .from(channelMembers)
      .innerJoin(users, eq(channelMembers.userId, users.id))
      .where(eq(channelMembers.channelId, channelId));

    const membersData = members.map(({ user, membership }) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      status: user.status,
      canPost: membership.canPost,
      joinedAt: membership.joinedAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        channel: {
          ...channel,
          members: membersData,
        },
      },
    });
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({
      error: { code: 'GET_CHANNEL_ERROR', message: 'Failed to get channel' },
    });
  }
});

/**
 * POST /api/channels/:id/join
 * Join a channel
 */
router.post('/:id/join', authenticateToken, async (req: any, res) => {
  try {
    const channelId = parseInt(req.params.id);
    
    // Check if channel exists and is not private
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId));

    if (!channel) {
      return res.status(404).json({
        error: { code: 'CHANNEL_NOT_FOUND', message: 'Channel not found' },
      });
    }

    if (channel.isPrivate) {
      return res.status(403).json({
        error: { code: 'PRIVATE_CHANNEL', message: 'Cannot join private channel without invitation' },
      });
    }

    // Check if user is a member of the workspace
    const [workspaceMember] = await db
      .select()
      .from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, channel.workspaceId),
        eq(workspaceMembers.userId, req.userId)
      ));

    if (!workspaceMember) {
      return res.status(403).json({
        error: { code: 'ACCESS_DENIED', message: 'Must be a workspace member to join channels' },
      });
    }

    // Check if already a member
    const [existingMembership] = await db
      .select()
      .from(channelMembers)
      .where(and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, req.userId)
      ));

    if (existingMembership) {
      return res.status(409).json({
        error: { code: 'ALREADY_MEMBER', message: 'Already a member of this channel' },
      });
    }

    // Join the channel
    await db
      .insert(channelMembers)
      .values({
        channelId,
        userId: req.userId,
        canPost: true,
      });

    // Update member count
    await db
      .update(channels)
      .set({
        memberCount: channel.memberCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(channels.id, channelId));

    res.status(200).json({
      success: true,
      message: 'Successfully joined channel',
    });
  } catch (error) {
    console.error('Join channel error:', error);
    res.status(500).json({
      error: { code: 'JOIN_CHANNEL_ERROR', message: 'Failed to join channel' },
    });
  }
});

export default router;
