# Wrong Question Notebook

The Wrong Question Notebook (WQN) is a web-based application designed to help students systematically track, organize, and revise the problems they answered incorrectly. It provides a comprehensive system for managing problems across multiple subjects, tracking progress, and facilitating effective revision through structured practice sessions.

## 🚀 Features

### Core Functionality

#### Subject Management
- [x] Create, edit, and delete subjects to organize your problems
- [x] Subject-based navigation and filtering
- [x] Clean, intuitive subject management interface
- [ ] Track problem counts and activity per subject

#### Problem Management
- [x] **Three Problem Types**: Multiple Choice Questions (MCQ), Short Answer, and Extended Response
- [x] **Rich Content Support**: Create problems with formatted content using an advanced rich text editor
  - Text formatting (bold, italic, underline, headings)
  - Mathematical equations with LaTeX support
  - Tables and lists
  - Links, subscript, and superscript
  - Image embedding with resizable images
  - Typography enhancements
- [x] **Status Tracking**: Mark problems as Wrong, Needs Review, or Mastered
- [x] **Auto-marking**: Enable automatic answer validation for multiple choice questions
- [x] **Assets Management**: Attach images and PDF files to problems
- [x] **Solution Support**: Add detailed solutions with text and assets

#### Tag System
- [x] Create and manage tags within subjects for better organization
- [x] Tag problems with multiple tags for flexible categorization
- [x] Filter problems by tags
- [x] Global tag overview across all subjects
- [ ] Tag-based problem discovery

#### Problem Sets
- [x] Create custom problem sets from your problems
- [x] **Sharing Levels**: Private, Limited (share with specific users via email), or Public (all registered users)
- [x] Add and remove problems from sets
- [x] Track progress within problem sets
- [ ] Problem set review mode for structured practice

#### Interactive Review System
- [x] Submit answers to problems with appropriate input types:
  - Text input for short answers
  - Textarea for extended responses
  - Multiple choice selection for MCQ
- [x] **Automatic Validation**: Auto-marked problems are validated instantly
- [x] **Manual Review**: Self-assessment workflow for complex problems
- [x] **Solution Reveal**: View detailed solutions after attempting problems
- [x] **Status Updates**: Update problem status during review
- [ ] Track attempt history and review dates

#### AI Features

- TODO

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
- **Code Quality**: ESLint, Prettier, TypeScript

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
- **TypeScript** for type safety

Run `npm run check-all` to validate your changes before committing.

## 📝 License

This project is licensed under the GPL-3.0 license. See [LICENSE](LICENSE) for details.
