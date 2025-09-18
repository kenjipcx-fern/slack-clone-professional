import { Hash, Users, Settings, Plus, Search, Mic, Headphones } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Workspace Switcher Bar */}
      <div className="w-16 bg-workspace-background flex flex-col items-center py-3 space-y-2">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
          S
        </div>
        <div className="w-10 h-10 bg-workspace-hover rounded-lg flex items-center justify-center text-workspace-foreground hover:bg-workspace-hover transition-colors cursor-pointer">
          <Plus size={18} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-sidebar flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b border-channel-hover">
          <h2 className="text-sidebar-foreground font-bold text-lg">Slack Clone Dev</h2>
          <p className="text-channel-text text-sm">Development Workspace</p>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 py-1 text-channel-text hover:text-sidebar-foreground cursor-pointer">
              <span className="text-sm font-medium">Channels</span>
              <Plus size={14} />
            </div>

            <div className="space-y-1 mt-2">
              <div className="flex items-center px-2 py-1 rounded text-sidebar-foreground bg-channel-active cursor-pointer">
                <Hash size={16} className="mr-2" />
                <span className="text-sm">general</span>
              </div>
              <div className="flex items-center px-2 py-1 rounded text-channel-text hover:bg-channel-hover hover:text-sidebar-foreground cursor-pointer transition-colors">
                <Hash size={16} className="mr-2" />
                <span className="text-sm">development</span>
              </div>
              <div className="flex items-center px-2 py-1 rounded text-channel-text hover:bg-channel-hover hover:text-sidebar-foreground cursor-pointer transition-colors">
                <Hash size={16} className="mr-2" />
                <span className="text-sm">random</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between px-2 py-1 text-channel-text hover:text-sidebar-foreground cursor-pointer">
              <span className="text-sm font-medium">Direct Messages</span>
              <Plus size={14} />
            </div>

            <div className="space-y-1 mt-2">
              <div className="flex items-center px-2 py-1 rounded text-channel-text hover:bg-channel-hover hover:text-sidebar-foreground cursor-pointer transition-colors">
                <div className="w-6 h-6 bg-online rounded-full mr-2 flex items-center justify-center text-xs font-semibold text-white">
                  A
                </div>
                <span className="text-sm">Alice Johnson</span>
              </div>
              <div className="flex items-center px-2 py-1 rounded text-channel-text hover:bg-channel-hover hover:text-sidebar-foreground cursor-pointer transition-colors">
                <div className="w-6 h-6 bg-away rounded-full mr-2 flex items-center justify-center text-xs font-semibold text-white">
                  B
                </div>
                <span className="text-sm">Bob Smith</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-3 border-t border-channel-hover flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-online rounded-full flex items-center justify-center text-xs font-semibold text-white">
              U
            </div>
            <div className="ml-2">
              <p className="text-sidebar-foreground text-sm font-medium">You</p>
              <p className="text-channel-text text-xs">Active</p>
            </div>
          </div>
          <div className="flex space-x-1">
            <button className="p-1 text-channel-text hover:text-sidebar-foreground transition-colors">
              <Mic size={16} />
            </button>
            <button className="p-1 text-channel-text hover:text-sidebar-foreground transition-colors">
              <Headphones size={16} />
            </button>
            <button className="p-1 text-channel-text hover:text-sidebar-foreground transition-colors">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="h-16 bg-card border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center">
            <Hash size={20} className="text-muted-foreground mr-2" />
            <h1 className="font-bold text-lg">general</h1>
            <span className="text-muted-foreground text-sm ml-2">|</span>
            <span className="text-muted-foreground text-sm ml-2">3 members</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                placeholder="Search messages..."
                className="pl-10 pr-4 py-2 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Users size={18} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Welcome Message */}
          <div className="flex items-start space-x-3 p-4 hover:bg-message-hover transition-colors rounded">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
              A
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-foreground">Admin User</span>
                <span className="text-muted-foreground text-xs">Today at 10:30 AM</span>
              </div>
              <p className="text-foreground mt-1">
                Welcome to Slack Clone! 🎉 This is our development workspace for testing all the
                cool features we&apos;re building.
              </p>
            </div>
          </div>

          {/* Developer Message */}
          <div className="flex items-start space-x-3 p-4 hover:bg-message-hover transition-colors rounded">
            <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center text-success-foreground font-bold">
              A
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-foreground">Alice Johnson</span>
                <span className="text-muted-foreground text-xs">Today at 10:31 AM</span>
              </div>
              <p className="text-foreground mt-1">
                Hey everyone! Excited to be working on this project. The backend is looking great so
                far! 💻
              </p>
            </div>
          </div>

          {/* Technical Message */}
          <div className="flex items-start space-x-3 p-4 hover:bg-message-hover transition-colors rounded">
            <div className="w-10 h-10 bg-warning rounded-full flex items-center justify-center text-warning-foreground font-bold">
              B
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-foreground">Bob Smith</span>
                <span className="text-muted-foreground text-xs">Today at 10:32 AM</span>
              </div>
              <p className="text-foreground mt-1">
                The database schema is really well designed. All 10 tables are properly indexed and
                the relationships look solid 🚀
              </p>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-2 p-3 bg-input border border-border rounded-lg">
            <input
              type="text"
              placeholder="Message #general..."
              className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
            />
            <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
