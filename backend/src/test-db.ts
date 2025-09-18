import { db } from './db/connection';
import { users, workspaces, channels, emojis } from './db/schema';

async function testDatabase() {
  console.log('🔍 Testing database connection and data...\n');
  
  try {
    // Test 1: Count users
    const userCount = await db.select().from(users);
    console.log(`👥 Users in database: ${userCount.length}`);
    userCount.forEach(user => {
      console.log(`  • ${user.displayName} (${user.email}) - ${user.status}`);
    });
    
    // Test 2: Count workspaces
    const workspaceCount = await db.select().from(workspaces);
    console.log(`\n🏢 Workspaces in database: ${workspaceCount.length}`);
    workspaceCount.forEach(ws => {
      console.log(`  • ${ws.name} (${ws.slug})`);
    });
    
    // Test 3: Count channels
    const channelCount = await db.select().from(channels);
    console.log(`\n📺 Channels in database: ${channelCount.length}`);
    channelCount.forEach(channel => {
      console.log(`  • #${channel.name} (${channel.type}) - ${channel.memberCount} members`);
    });
    
    // Test 4: Count emojis
    const emojiCount = await db.select().from(emojis);
    console.log(`\n😀 Emojis in database: ${emojiCount.length}`);
    console.log(`  • Sample emojis: ${emojiCount.slice(0, 5).map(e => e.shortcode).join(', ')}...`);
    
    console.log('\n✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase();
