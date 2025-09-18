import { db } from './connection';
import { 
  users, 
  workspaces, 
  workspaceMembers, 
  channels, 
  channelMembers, 
  emojis,
  messages
} from './schema';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // ============================================================================
    // 1. Seed Default Emojis (Unicode emojis)
    // ============================================================================
    console.log('📱 Seeding default emojis...');
    
    const defaultEmojis = [
      // Smileys & Emotion
      { name: 'slightly_smiling_face', shortcode: ':slightly_smiling_face:', imageUrl: '🙂', isCustom: false },
      { name: 'smile', shortcode: ':smile:', imageUrl: '😄', isCustom: false },
      { name: 'grin', shortcode: ':grin:', imageUrl: '😁', isCustom: false },
      { name: 'laughing', shortcode: ':laughing:', imageUrl: '😆', isCustom: false },
      { name: 'wink', shortcode: ':wink:', imageUrl: '😉', isCustom: false },
      { name: 'heart_eyes', shortcode: ':heart_eyes:', imageUrl: '😍', isCustom: false },
      { name: 'kissing_heart', shortcode: ':kissing_heart:', imageUrl: '😘', isCustom: false },
      { name: 'thinking_face', shortcode: ':thinking_face:', imageUrl: '🤔', isCustom: false },
      { name: 'neutral_face', shortcode: ':neutral_face:', imageUrl: '😐', isCustom: false },
      { name: 'disappointed', shortcode: ':disappointed:', imageUrl: '😞', isCustom: false },
      { name: 'sob', shortcode: ':sob:', imageUrl: '😭', isCustom: false },
      { name: 'rage', shortcode: ':rage:', imageUrl: '😡', isCustom: false },
      
      // Hand gestures
      { name: 'thumbsup', shortcode: ':thumbsup:', imageUrl: '👍', isCustom: false },
      { name: 'thumbsdown', shortcode: ':thumbsdown:', imageUrl: '👎', isCustom: false },
      { name: 'clap', shortcode: ':clap:', imageUrl: '👏', isCustom: false },
      { name: 'raised_hands', shortcode: ':raised_hands:', imageUrl: '🙌', isCustom: false },
      { name: 'wave', shortcode: ':wave:', imageUrl: '👋', isCustom: false },
      { name: 'ok_hand', shortcode: ':ok_hand:', imageUrl: '👌', isCustom: false },
      { name: 'peace', shortcode: ':peace:', imageUrl: '✌️', isCustom: false },
      { name: 'point_up', shortcode: ':point_up:', imageUrl: '☝️', isCustom: false },
      
      // Objects & symbols
      { name: 'heart', shortcode: ':heart:', imageUrl: '❤️', isCustom: false },
      { name: 'fire', shortcode: ':fire:', imageUrl: '🔥', isCustom: false },
      { name: 'star', shortcode: ':star:', imageUrl: '⭐', isCustom: false },
      { name: 'check_mark', shortcode: ':check_mark:', imageUrl: '✅', isCustom: false },
      { name: 'x', shortcode: ':x:', imageUrl: '❌', isCustom: false },
      { name: 'warning', shortcode: ':warning:', imageUrl: '⚠️', isCustom: false },
      { name: 'rocket', shortcode: ':rocket:', imageUrl: '🚀', isCustom: false },
      { name: 'eyes', shortcode: ':eyes:', imageUrl: '👀', isCustom: false },
      
      // Activities
      { name: 'computer', shortcode: ':computer:', imageUrl: '💻', isCustom: false },
      { name: 'coffee', shortcode: ':coffee:', imageUrl: '☕', isCustom: false },
      { name: 'pizza', shortcode: ':pizza:', imageUrl: '🍕', isCustom: false },
      { name: 'beer', shortcode: ':beer:', imageUrl: '🍺', isCustom: false },
      { name: 'gift', shortcode: ':gift:', imageUrl: '🎁', isCustom: false },
      { name: 'tada', shortcode: ':tada:', imageUrl: '🎉', isCustom: false }
    ];

    for (const emoji of defaultEmojis) {
      await db.insert(emojis).values({
        workspaceId: null, // Global emojis
        name: emoji.name,
        shortcode: emoji.shortcode,
        imageUrl: emoji.imageUrl,
        isCustom: emoji.isCustom,
        createdById: null,
        usageCount: 0
      }).onConflictDoNothing();
    }
    
    console.log(`✅ Seeded ${defaultEmojis.length} default emojis`);
    
    // ============================================================================
    // 2. Seed Test Users
    // ============================================================================
    console.log('👥 Seeding test users...');
    
    const testUsers = [
      {
        email: 'admin@slackclone.dev',
        username: 'admin',
        displayName: 'Admin User',
        password: await bcrypt.hash('admin123', 12),
        emailVerified: true,
        status: 'online' as const
      },
      {
        email: 'alice@slackclone.dev',
        username: 'alice_dev',
        displayName: 'Alice Johnson',
        password: await bcrypt.hash('alice123', 12),
        emailVerified: true,
        status: 'online' as const
      },
      {
        email: 'bob@slackclone.dev',
        username: 'bob_smith',
        displayName: 'Bob Smith',
        password: await bcrypt.hash('bob123', 12),
        emailVerified: true,
        status: 'away' as const
      }
    ];

    const insertedUsers = await db.insert(users).values(testUsers).returning();
    console.log(`✅ Seeded ${insertedUsers.length} test users`);
    
    // ============================================================================
    // 3. Seed Test Workspace
    // ============================================================================
    console.log('🏢 Seeding test workspace...');
    
    const testWorkspace = {
      name: 'Slack Clone Dev Team',
      slug: 'slack-clone-dev',
      description: 'Development workspace for testing Slack Clone features',
      ownerId: insertedUsers[0].id, // Admin user
      inviteCode: 'DEV123',
      isPublic: true,
      settings: {
        allowGuestUsers: false,
        requireEmailVerification: true,
        messageRetentionDays: 90
      }
    };

    const [insertedWorkspace] = await db.insert(workspaces).values(testWorkspace).returning();
    console.log(`✅ Created test workspace: ${insertedWorkspace.name}`);
    
    // ============================================================================
    // 4. Add Users to Workspace
    // ============================================================================
    console.log('🤝 Adding users to workspace...');
    
    const workspaceMemberships = [
      {
        workspaceId: insertedWorkspace.id,
        userId: insertedUsers[0].id,
        role: 'owner' as const,
        customTitle: 'Founder & CEO'
      },
      {
        workspaceId: insertedWorkspace.id,
        userId: insertedUsers[1].id,
        role: 'admin' as const,
        customTitle: 'Lead Developer'
      },
      {
        workspaceId: insertedWorkspace.id,
        userId: insertedUsers[2].id,
        role: 'member' as const,
        customTitle: 'Backend Engineer'
      }
    ];

    await db.insert(workspaceMembers).values(workspaceMemberships);
    console.log(`✅ Added ${workspaceMemberships.length} workspace members`);
    
    // ============================================================================
    // 5. Seed Test Channels
    // ============================================================================
    console.log('📺 Seeding test channels...');
    
    const testChannels = [
      {
        workspaceId: insertedWorkspace.id,
        name: 'general',
        description: 'General team discussions',
        type: 'text' as const,
        isPrivate: false,
        topic: 'Welcome to the team! 🎉',
        createdById: insertedUsers[0].id,
        memberCount: 3
      },
      {
        workspaceId: insertedWorkspace.id,
        name: 'development',
        description: 'Technical discussions and code reviews',
        type: 'text' as const,
        isPrivate: false,
        topic: 'Code, bugs, and feature discussions',
        createdById: insertedUsers[1].id,
        memberCount: 2
      },
      {
        workspaceId: insertedWorkspace.id,
        name: 'random',
        description: 'Random conversations and fun stuff',
        type: 'text' as const,
        isPrivate: false,
        topic: 'Anything goes! Share memes, links, etc.',
        createdById: insertedUsers[0].id,
        memberCount: 3
      },
      {
        workspaceId: insertedWorkspace.id,
        name: 'voice-chat',
        description: 'Voice huddles and audio discussions',
        type: 'voice' as const,
        isPrivate: false,
        topic: 'Drop in for voice conversations',
        createdById: insertedUsers[0].id,
        memberCount: 3
      },
      {
        workspaceId: insertedWorkspace.id,
        name: 'leadership',
        description: 'Private channel for leadership team',
        type: 'private' as const,
        isPrivate: true,
        topic: 'Leadership discussions',
        createdById: insertedUsers[0].id,
        memberCount: 2
      }
    ];

    const insertedChannels = await db.insert(channels).values(testChannels).returning();
    console.log(`✅ Created ${insertedChannels.length} test channels`);
    
    // ============================================================================
    // 6. Add Users to Channels
    // ============================================================================
    console.log('👥 Adding users to channels...');
    
    const channelMemberships = [];
    
    // Add all users to general, random, and voice-chat
    for (const channel of insertedChannels.filter(c => ['general', 'random', 'voice-chat'].includes(c.name))) {
      for (const user of insertedUsers) {
        channelMemberships.push({
          channelId: channel.id,
          userId: user.id,
          canPost: true
        });
      }
    }
    
    // Add only Alice and Bob to development
    const devChannel = insertedChannels.find(c => c.name === 'development');
    if (devChannel) {
      channelMemberships.push(
        {
          channelId: devChannel.id,
          userId: insertedUsers[1].id, // Alice
          canPost: true
        },
        {
          channelId: devChannel.id,
          userId: insertedUsers[2].id, // Bob
          canPost: true
        }
      );
    }
    
    // Add only Admin and Alice to leadership
    const leadershipChannel = insertedChannels.find(c => c.name === 'leadership');
    if (leadershipChannel) {
      channelMemberships.push(
        {
          channelId: leadershipChannel.id,
          userId: insertedUsers[0].id, // Admin
          canPost: true
        },
        {
          channelId: leadershipChannel.id,
          userId: insertedUsers[1].id, // Alice
          canPost: true
        }
      );
    }

    await db.insert(channelMembers).values(channelMemberships);
    console.log(`✅ Added ${channelMemberships.length} channel memberships`);
    
    // ============================================================================
    // 7. Seed Test Messages
    // ============================================================================
    console.log('💬 Seeding test messages...');
    
    const generalChannel = insertedChannels.find(c => c.name === 'general');
    const developmentChannel = insertedChannels.find(c => c.name === 'development');
    
    const testMessages = [];
    
    if (generalChannel) {
      testMessages.push(
        {
          channelId: generalChannel.id,
          userId: insertedUsers[0].id,
          content: 'Welcome to Slack Clone! 🎉 This is our development workspace for testing all the cool features we\'re building.',
          type: 'text' as const
        },
        {
          channelId: generalChannel.id,
          userId: insertedUsers[1].id,
          content: 'Hey everyone! Excited to be working on this project. The backend is looking great so far! 💻',
          type: 'text' as const
        },
        {
          channelId: generalChannel.id,
          userId: insertedUsers[2].id,
          content: 'The database schema is really well designed. All 10 tables are properly indexed and the relationships look solid 🚀',
          type: 'text' as const
        },
        {
          channelId: generalChannel.id,
          userId: insertedUsers[0].id,
          content: 'Thanks team! Next we\'ll be working on real-time messaging with Socket.IO. Should be fun!',
          type: 'text' as const
        }
      );
    }
    
    if (developmentChannel) {
      testMessages.push(
        {
          channelId: developmentChannel.id,
          userId: insertedUsers[1].id,
          content: 'Just finished implementing the Drizzle ORM schema with all relations. Ready for the next phase! ✅',
          type: 'text' as const
        },
        {
          channelId: developmentChannel.id,
          userId: insertedUsers[2].id,
          content: 'The seed data looks comprehensive. We have users, workspaces, channels, and even default emojis ready 👍',
          type: 'text' as const
        }
      );
    }
    
    if (testMessages.length > 0) {
      await db.insert(messages).values(testMessages);
      console.log(`✅ Created ${testMessages.length} test messages`);
    }
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`
    📊 Seeded Data Summary:
    • ${defaultEmojis.length} default emojis
    • ${insertedUsers.length} test users
    • 1 test workspace
    • ${workspaceMemberships.length} workspace memberships
    • ${insertedChannels.length} test channels
    • ${channelMemberships.length} channel memberships
    • ${testMessages.length} test messages
    
    🔐 Test User Credentials:
    • admin@slackclone.dev / admin123
    • alice@slackclone.dev / alice123
    • bob@slackclone.dev / bob123
    `);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    });
}

export default main;
