# 🚀 Slack Clone - Professional Team Collaboration Platform

A full-stack team collaboration application built with modern web technologies, featuring real-time messaging, voice huddles, emoji reactions, and more.

## ✨ Features

### 🎯 **Core Features**
- **Real-time Messaging** - Instant messaging with WebSocket support
- **Multi-Channel Support** - Organize conversations by channels
- **Voice Huddles** - High-quality voice chat (WebRTC ready)
- **Emoji Reactions** - Express yourself with emojis and custom reactions
- **User Authentication** - Secure JWT-based authentication
- **User Presence** - See who's online, away, or busy
- **Message Threading** - Keep conversations organized
- **File Sharing** - Share documents and images
- **Search** - Find messages and conversations quickly

### 🎨 **UI/UX Excellence**
- **Professional Slack-like Interface** - Familiar and intuitive design
- **Responsive Design** - Works perfectly on desktop and mobile
- **Dark/Light Mode** - Theme support for user preference
- **Accessibility** - WCAG compliant with keyboard navigation
- **Smooth Animations** - Framer Motion powered interactions

## 🛠 **Tech Stack**

### **Frontend**
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Framer Motion** - Smooth animations (ready)

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Reliable database
- **Drizzle ORM** - Type-safe database queries
- **JWT** - Secure authentication
- **Socket.IO** - Real-time communication (ready)

### **Infrastructure**
- **MorphVPS** - Cloud deployment
- **Git** - Version control
- **npm** - Package management

## 🚀 **Live Demo**

**🌐 [https://slack-clone-app-morphvm-hy4i6u97.http.cloud.morph.so](https://slack-clone-app-morphvm-hy4i6u97.http.cloud.morph.so)**

## 📁 **Project Structure**

```
slack-competitor-build-dec18/
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Authentication & validation
│   │   └── server.ts       # Express server
│   └── package.json
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities & API client
│   │   └── styles/        # Global styles
│   └── package.json
├── fern/                  # Documentation & planning
│   ├── product.md         # Product requirements
│   ├── tech-specs.md      # Technical specifications
│   └── ui-design.md       # Design system
└── README.md
```

## 🏃‍♂️ **Quick Start**

### **Prerequisites**
- Node.js 18+
- PostgreSQL
- npm or yarn

### **Backend Setup**
```bash
cd backend
npm install
npm run dev    # Starts on http://localhost:3002
```

### **Frontend Setup**
```bash
cd frontend
npm install
npm run dev    # Starts on http://localhost:3000
```

### **Production Deployment**
```bash
# Build frontend
cd frontend && npm run build

# Start production servers
PORT=4000 npm start        # Frontend on port 4000
cd ../backend && npm run dev  # Backend on port 3002
```

## 📊 **Database Schema**

The application uses a well-designed PostgreSQL schema with 14+ tables:

- **Users** - User accounts and profiles
- **Workspaces** - Team workspaces
- **Channels** - Communication channels
- **Messages** - Chat messages with threading
- **Reactions** - Emoji reactions
- **Files** - File attachments
- **Presence** - User online status
- And more...

## 🔐 **Authentication**

- JWT-based authentication
- Secure password hashing
- Token-based API access
- Session management

## 🎯 **API Endpoints**

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### **Messages**
- `GET /api/messages/channel/:id` - Get channel messages
- `POST /api/messages` - Send message
- `POST /api/messages/:id/reactions` - Toggle reaction

### **Channels & Workspaces**
- `GET /api/workspaces` - Get user workspaces
- `GET /api/channels/workspace/:id` - Get workspace channels
- `POST /api/channels/:id/join` - Join channel

## 🎨 **Design System**

Our design system follows modern UI principles:

- **Color Palette** - Carefully chosen for accessibility
- **Typography** - Clear hierarchy with system fonts
- **Spacing** - 8px grid system
- **Components** - Reusable, consistent components
- **Animations** - Subtle, purposeful motion

## 🚀 **Deployment**

Currently deployed on MorphVPS with:
- **Frontend**: Port 4000 (Production Next.js)
- **Backend**: Port 3002 (Express API)
- **Database**: PostgreSQL (Local)

## 🧪 **Testing**

The application includes comprehensive verification:
- ✅ Backend API endpoints tested
- ✅ Database persistence verified
- ✅ Frontend-backend integration confirmed
- ✅ Authentication flow validated

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

MIT License - feel free to use this project for learning and development.

## 📞 **Support**

For questions or issues, please create an issue in the repository.

---

**Built with ❤️ using modern web technologies**

🎯 **Mission**: Create the best team collaboration experience with superior voice quality and intuitive design.
