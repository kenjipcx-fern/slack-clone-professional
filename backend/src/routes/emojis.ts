import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { eq, or, and, isNull } from 'drizzle-orm';
import { db } from '../db/connection';
import { emojis, workspaceMembers } from '../db/schema';

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
 * GET /api/emojis/workspace/:workspaceId
 * Get all emojis available in a workspace (default + custom)
 */
router.get('/workspace/:workspaceId', authenticateToken, async (req: any, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    
    // Check if user is a member of this workspace
    const [membership] = await db
      .select()
      .from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, req.userId)
      ));

    if (!membership) {
      return res.status(403).json({
        error: { code: 'ACCESS_DENIED', message: 'Access denied to this workspace' },
      });
    }

    // Get all emojis available in this workspace (default + workspace custom)
    const workspaceEmojis = await db
      .select()
      .from(emojis)
      .where(or(
        isNull(emojis.workspaceId), // Default emojis
        eq(emojis.workspaceId, workspaceId) // Workspace custom emojis
      ))
      .orderBy(emojis.name);

    // Categorize emojis
    const categorizedEmojis = {
      default: workspaceEmojis.filter(e => !e.isCustom),
      custom: workspaceEmojis.filter(e => e.isCustom),
    };

    res.status(200).json({
      success: true,
      data: { 
        emojis: categorizedEmojis,
        total: workspaceEmojis.length,
      },
    });
  } catch (error) {
    console.error('Get workspace emojis error:', error);
    res.status(500).json({
      error: { code: 'GET_EMOJIS_ERROR', message: 'Failed to get emojis' },
    });
  }
});

/**
 * GET /api/emojis/search
 * Search emojis by name or shortcode
 */
router.get('/search', authenticateToken, async (req: any, res) => {
  try {
    const { q, workspaceId } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: { code: 'MISSING_QUERY', message: 'Search query is required' },
      });
    }

    const searchQuery = `%${q}%`;
    let whereClause;

    if (workspaceId) {
      const wsId = parseInt(workspaceId as string);
      
      // Check workspace access if specified
      const [membership] = await db
        .select()
        .from(workspaceMembers)
        .where(and(
          eq(workspaceMembers.workspaceId, wsId),
          eq(workspaceMembers.userId, req.userId)
        ));

      if (!membership) {
        return res.status(403).json({
          error: { code: 'ACCESS_DENIED', message: 'Access denied to this workspace' },
        });
      }

      whereClause = and(
        or(
          isNull(emojis.workspaceId),
          eq(emojis.workspaceId, wsId)
        ),
        or(
          eq(emojis.name, searchQuery),
          eq(emojis.shortcode, searchQuery)
        )
      );
    } else {
      // Search only default emojis
      whereClause = and(
        isNull(emojis.workspaceId),
        or(
          eq(emojis.name, searchQuery),
          eq(emojis.shortcode, searchQuery)
        )
      );
    }

    const searchResults = await db
      .select()
      .from(emojis)
      .where(whereClause)
      .limit(20)
      .orderBy(emojis.usageCount);

    res.status(200).json({
      success: true,
      data: { emojis: searchResults },
    });
  } catch (error) {
    console.error('Search emojis error:', error);
    res.status(500).json({
      error: { code: 'SEARCH_EMOJIS_ERROR', message: 'Failed to search emojis' },
    });
  }
});

/**
 * POST /api/emojis/:id/use
 * Increment usage count for an emoji
 */
router.post('/:id/use', authenticateToken, async (req: any, res) => {
  try {
    const emojiId = parseInt(req.params.id);
    
    // Get current emoji
    const [emoji] = await db
      .select()
      .from(emojis)
      .where(eq(emojis.id, emojiId));

    if (!emoji) {
      return res.status(404).json({
        error: { code: 'EMOJI_NOT_FOUND', message: 'Emoji not found' },
      });
    }

    // If it's a workspace emoji, check access
    if (emoji.workspaceId) {
      const [membership] = await db
        .select()
        .from(workspaceMembers)
        .where(and(
          eq(workspaceMembers.workspaceId, emoji.workspaceId),
          eq(workspaceMembers.userId, req.userId)
        ));

      if (!membership) {
        return res.status(403).json({
          error: { code: 'ACCESS_DENIED', message: 'Access denied to this workspace emoji' },
        });
      }
    }

    // Increment usage count
    await db
      .update(emojis)
      .set({
        usageCount: emoji.usageCount + 1,
      })
      .where(eq(emojis.id, emojiId));

    res.status(200).json({
      success: true,
      message: 'Usage count updated',
    });
  } catch (error) {
    console.error('Update emoji usage error:', error);
    res.status(500).json({
      error: { code: 'EMOJI_USAGE_ERROR', message: 'Failed to update emoji usage' },
    });
  }
});

export default router;
