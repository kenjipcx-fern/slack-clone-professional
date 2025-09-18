import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { users } from '../db/schema';

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
 * PATCH /api/users/profile
 * Update user profile
 */
router.patch('/profile', authenticateToken, async (req: any, res) => {
  try {
    const { displayName, avatar, statusMessage } = req.body;
    
    const updateData: any = {};
    if (displayName) updateData.displayName = displayName;
    if (avatar) updateData.avatar = avatar;
    if (statusMessage !== undefined) updateData.statusMessage = statusMessage;
    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 1) { // Only updatedAt
      return res.status(400).json({
        error: { code: 'NO_UPDATES', message: 'No valid updates provided' },
      });
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, req.userId))
      .returning();

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      success: true,
      data: { user: userWithoutPassword },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: { code: 'UPDATE_ERROR', message: 'Failed to update profile' },
    });
  }
});

/**
 * PATCH /api/users/presence
 * Update user presence status
 */
router.patch('/presence', authenticateToken, async (req: any, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['online', 'away', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({
        error: { code: 'INVALID_STATUS', message: 'Invalid status. Must be online, away, busy, or offline' },
      });
    }

    await db
      .update(users)
      .set({
        status,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.userId));

    res.status(200).json({
      success: true,
      message: 'Presence status updated',
    });
  } catch (error) {
    console.error('Update presence error:', error);
    res.status(500).json({
      error: { code: 'PRESENCE_ERROR', message: 'Failed to update presence' },
    });
  }
});

export default router;
