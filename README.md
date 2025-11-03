# Wrong Question Notebook

The Wrong Question Notebook (WQN) is a web-based application designed to help students systematically track, organize, and revise the problems they answered incorrectly. It provides a comprehensive system for managing problems across multiple subjects, tracking progress, and facilitating effective revision through structured practice sessions.

## 🚀 Features

### Core Functionality

#### **Subject Management**
- Create, edit, and delete subjects to organize your problems
- Subject-based navigation and filtering
- Track problem counts and activity per subject
- Clean, intuitive subject management interface

#### **Problem Management**
- **Three Problem Types**: Multiple Choice Questions (MCQ), Short Answer, and Extended Response
- **Rich Content Support**: Create problems with HTML-formatted content using an advanced rich text editor
  - Text formatting (bold, italic, underline, headings)
  - Mathematical equations with LaTeX support (via KaTeX)
  - Tables and lists
  - Links, subscript, and superscript
  - Image embedding with resizable images
  - Typography enhancements
- **Status Tracking**: Mark problems as Wrong, Needs Review, or Mastered
- **Auto-marking**: Enable automatic answer validation for multiple choice questions
- **Assets Management**: Attach images and PDF files to problems
- **Solution Support**: Add detailed solutions with text and assets
- Edit and delete problems with full data validation

#### **Tag System**
- Create and manage tags within subjects for better organization
- Tag problems with multiple tags for flexible categorization
- Filter problems by tags
- Global tag overview across all subjects
- Tag-based problem discovery

#### **Problem Sets**
- Create custom problem sets from your problems
- Organize problems into focused practice sessions
- **Sharing Levels**: Private, Limited (share with specific users via email), or Public
- Add and remove problems from sets
- Track progress within problem sets
- Subject-based problem set organization
- Problem set review mode for structured practice

#### **Interactive Review System**
- Submit answers to problems with appropriate input types:
  - Text input for short answers
  - Textarea for extended responses
  - Multiple choice selection for MCQ
- **Automatic Validation**: Auto-marked problems are validated instantly
- **Manual Review**: Self-assessment workflow for complex problems
- **Solution Reveal**: View detailed solutions after attempting problems
- **Asset Preview**: View images and PDFs directly in the review interface
- **Navigation**: Move between problems (previous/next) within subjects and problem sets
- **Status Updates**: Update problem status during review
- Track attempt history and review dates

#### **File Management**
- Secure file upload for images (JPG, PNG, WebP, GIF) and PDFs
- User-based access control for uploaded files
- Asset preview functionality
- Automatic file validation and sanitization
- Size limits: 5MB for images, 10MB for PDFs

### User Experience

#### **Authentication & User Management**
- Secure user authentication via Supabase Auth
- User registration and login
- Password reset functionality
- Session management with middleware
- User profile management
- Role-based access control (User, Moderator, Admin, Super Admin)

#### **Admin Features**
- **Admin Dashboard**: Overview of user statistics and system health
  - Total users, active users, admin users
  - New user tracking (today, this week)
  - Recent activity monitoring
  - System settings overview
- **User Management**: View, edit, and manage user accounts
  - Toggle user active/inactive status
  - Assign and modify user roles
  - View user profiles and activity
- **System Settings**: Configure application-wide settings
- **Activity Logging**: Track user actions and resource access

#### **User Interface**
- **Dark/Light Theme**: Full theme support with system preference detection
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Modern UI Components**: Built with Radix UI and shadcn/ui
- **Accessibility**: Keyboard navigation and screen reader support
- **Search & Filter**: Advanced filtering by problem type, status, and tags
- **Data Tables**: Sortable, filterable tables for problems and sets
- **Toast Notifications**: User feedback for actions and errors

### Data & Performance

#### **Data Management**
- Problem attempt tracking with submission history
- Reflection notes (cause analysis) for incorrect answers
- Last reviewed date tracking
- Automatic timestamps for all records

#### **Security & Validation**
- HTML content sanitization to prevent XSS attacks
- Input validation using Zod schemas
- Rate limiting for API endpoints
- File type and size validation
- User-based file access control
- Secure session management

#### **Performance**
- Next.js 15 with Turbopack for fast development
- Server-side rendering for optimal performance
- Cache management for admin data
- Optimized database queries
- Image optimization

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components, Radix UI
- **Rich Text Editor**: TipTap with extensions (Mathematics, Tables, Links, Images)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for file uploads
- **Deployment**: Vercel
- **Validation**: Zod for schema validation
- **Math Rendering**: KaTeX for LaTeX equations
- **Analytics**: Vercel Analytics and Speed Insights
- **Code Quality**: ESLint, Prettier, TypeScript, Husky for git hooks

## 📦 Installation & Setup

1. Clone the repository
2. Navigate to the web directory: `cd web`
3. Install dependencies: `npm install`
4. Set up environment variables (see `env.example`)
5. Run the development server: `npm run dev`

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 📄 Documentation

- **CHANGELOG.md**: Track all notable changes and version history
- **DEPLOYMENT.md**: Comprehensive deployment guide for Vercel
- **Proposal.md**: Initial project proposal and requirements

## 🤝 Contributing

This project uses:
- **ESLint** and **Prettier** for code formatting
- **Husky** for pre-commit hooks
- **TypeScript** for type safety

Run `npm run check-all` to validate your changes before committing.

## 📝 License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.
