import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/connection';
import { workspaces, workspaceMembers, users } from '../db/schema';

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
 * GET /api/workspaces
 * Get all workspaces for the authenticated user
 */
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userWorkspaces = await db
      .select({
        workspace: workspaces,
        membership: workspaceMembers,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, req.userId));

    const workspacesData = userWorkspaces.map(({ workspace, membership }) => ({
      ...workspace,
      role: membership.role,
      joinedAt: membership.joinedAt,
      customTitle: membership.customTitle,
    }));

    res.status(200).json({
      success: true,
      data: { workspaces: workspacesData },
    });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({
      error: { code: 'GET_WORKSPACES_ERROR', message: 'Failed to get workspaces' },
    });
  }
});

/**
 * GET /api/workspaces/:id
 * Get specific workspace details
 */
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const workspaceId = parseInt(req.params.id);
    
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

    // Get workspace details
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId));

    if (!workspace) {
      return res.status(404).json({
        error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
      });
    }

    // Get workspace members
    const members = await db
      .select({
        user: users,
        membership: workspaceMembers,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    const membersData = members.map(({ user, membership }) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      status: user.status,
      role: membership.role,
      customTitle: membership.customTitle,
      joinedAt: membership.joinedAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        workspace: {
          ...workspace,
          userRole: membership.role,
          members: membersData,
        },
      },
    });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({
      error: { code: 'GET_WORKSPACE_ERROR', message: 'Failed to get workspace' },
    });
  }
});

/**
 * POST /api/workspaces
 * Create a new workspace
 */
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { name, description, slug } = req.body;
    
    if (!name || !slug) {
      return res.status(400).json({
        error: { code: 'MISSING_FIELDS', message: 'Name and slug are required' },
      });
    }

    // Check if slug is already taken
    const [existingWorkspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1);

    if (existingWorkspace) {
      return res.status(409).json({
        error: { code: 'SLUG_TAKEN', message: 'Workspace slug is already taken' },
      });
    }

    // Create workspace
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name,
        slug,
        description: description || null,
        ownerId: req.userId,
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      })
      .returning();

    // Add creator as owner
    await db
      .insert(workspaceMembers)
      .values({
        workspaceId: newWorkspace.id,
        userId: req.userId,
        role: 'owner',
      });

    res.status(201).json({
      success: true,
      data: { workspace: newWorkspace },
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({
      error: { code: 'CREATE_WORKSPACE_ERROR', message: 'Failed to create workspace' },
    });
  }
});

export default router;
