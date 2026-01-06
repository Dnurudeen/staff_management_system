<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel"/>
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Inertia.js-2.x-9553E9?style=for-the-badge&logo=inertia&logoColor=white" alt="Inertia.js"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
</p>

<h1 align="center">📊 Staff Management System</h1>

<p align="center">
  <strong>A comprehensive, modern staff management platform for organisations of all sizes</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-user-roles">User Roles</a> •
  <a href="#-subscription-plans">Plans</a> •
  <a href="#-api-documentation">API</a>
</p>

---

## 📋 Product Requirements Document (PRD)

### Executive Summary

The **Staff Management System** is a full-featured enterprise solution designed to streamline workforce management, enhance team collaboration, and improve organisational productivity. Built with modern technologies, it provides a seamless experience for attendance tracking, task management, team communication, performance reviews, and more.

### Target Users

-   **Small to Medium Enterprises (SMEs)** seeking an all-in-one HR and team management solution
-   **HR Departments** requiring comprehensive employee lifecycle management
-   **Project Managers** needing task and project tracking capabilities
-   **Team Leaders** wanting to monitor attendance and performance
-   **Employees** needing self-service access to HR functions

---

## ✨ Features

### 🏢 Organisation Management

| Feature                         | Description                                                             |
| ------------------------------- | ----------------------------------------------------------------------- |
| **Multi-tenant Architecture**   | Each organisation operates in an isolated environment with its own data |
| **Custom Branding**             | Organisation-specific settings and configurations                       |
| **Working Hours Configuration** | Customisable work start/end times and work days                         |
| **Late Threshold Settings**     | Configure grace period for clock-in times                               |
| **Storage Management**          | Track and manage organisation storage usage                             |

### 👥 User Management

| Feature                         | Description                                               |
| ------------------------------- | --------------------------------------------------------- |
| **Role-based Access Control**   | Three-tier role system (Prime Admin, Admin, Staff)        |
| **User Invitation System**      | Email-based onboarding with secure invitation tokens      |
| **Profile Management**          | Comprehensive user profiles with avatars and bank details |
| **Multi-department Membership** | Users can belong to multiple departments/teams            |
| **Presence Status**             | Real-time online/offline status tracking                  |
| **Custom Status Messages**      | Personalised availability messages                        |

### 🏬 Department Management

| Feature                 | Description                                         |
| ----------------------- | --------------------------------------------------- |
| **Department Creation** | Create and manage organisational departments        |
| **Department Heads**    | Assign department leadership                        |
| **Team Membership**     | Flexible many-to-many user-department relationships |
| **Department Tasks**    | Department-specific task assignments                |

### ⏰ Attendance Management

| Feature                     | Description                                           |
| --------------------------- | ----------------------------------------------------- |
| **Clock In/Out**            | One-click attendance recording                        |
| **Late Detection**          | Automatic late marking based on organisation settings |
| **Total Hours Calculation** | Automatic work hours computation                      |
| **Attendance Reports**      | Comprehensive attendance analytics                    |
| **Calendar View**           | Visual attendance tracking                            |
| **Status Tracking**         | Present, Late, Absent, Half-day statuses              |

### 📅 Leave Management

| Feature                  | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| **Leave Types**          | Sick, Casual, Annual, Emergency leave categories          |
| **Leave Requests**       | Self-service leave application                            |
| **Approval Workflow**    | Admin/Manager approval process                            |
| **Leave Balance**        | Automatic leave balance tracking (20 days annual default) |
| **Admin Notes**          | Feedback on leave decisions                               |
| **Date Range Selection** | Multi-day leave support                                   |

### ✅ Task Management

| Feature                     | Description                                           |
| --------------------------- | ----------------------------------------------------- |
| **Task Creation**           | Create tasks with titles, descriptions, and due dates |
| **Priority Levels**         | Low, Medium, High, Urgent priorities                  |
| **Status Workflow**         | Pending → In Progress → Completed → Cancelled         |
| **Task Assignment**         | Assign tasks to specific users                        |
| **Kanban Board**            | Visual drag-and-drop task management                  |
| **Task Comments**           | Threaded discussions on tasks                         |
| **File Attachments**        | Attach documents to tasks and comments                |
| **Department Tasks**        | Organise tasks by department                          |
| **AI-Powered Descriptions** | Intelligent task description suggestions              |

### 📁 Project Management

| Feature                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| **Project Creation**   | Create projects with budgets and timelines      |
| **Project Status**     | Planning, Active, On Hold, Completed, Cancelled |
| **Project Priorities** | Low, Medium, High, Critical                     |
| **Team Members**       | Assign users to projects with roles             |
| **Project Manager**    | Designated project leadership                   |
| **Progress Tracking**  | Automatic progress calculation based on tasks   |
| **Colour Coding**      | Visual project identification                   |
| **Overdue Detection**  | Automatic overdue project flagging              |
| **Soft Deletes**       | Safe project archival                           |

### 💬 Team Messaging & Chat

| Feature                   | Description                              |
| ------------------------- | ---------------------------------------- |
| **Private Conversations** | One-on-one messaging                     |
| **Group Chats**           | Multi-participant group conversations    |
| **Real-time Messaging**   | Instant message delivery via WebSockets  |
| **Message Types**         | Text, Files, Voice Notes                 |
| **Voice Recording**       | In-app voice note recording              |
| **File Sharing**          | Share documents, images, and videos      |
| **File Preview**          | In-chat preview for images and documents |
| **Message Reactions**     | Emoji reactions on messages              |
| **Typing Indicators**     | Real-time typing status                  |
| **Read Receipts**         | Message read tracking                    |
| **Message Editing**       | Edit sent messages                       |
| **Message Deletion**      | Soft delete messages                     |
| **Mute/Archive**          | Conversation management options          |
| **Online Status**         | Real-time presence indicators            |

### 📹 Meetings & Scheduling

| Feature                    | Description                         |
| -------------------------- | ----------------------------------- |
| **Meeting Creation**       | Schedule meetings with agendas      |
| **Meeting Types**          | Various meeting categories          |
| **Participant Management** | Invite and manage meeting attendees |
| **RSVP System**            | Accept/decline meeting invitations  |
| **Google Calendar Sync**   | Two-way Google Calendar integration |
| **Meeting Notes**          | Collaborative note-taking           |
| **Recording Support**      | Meeting recording storage           |
| **Recurrence**             | Recurring meeting support           |
| **Video/Voice Calls**      | Built-in calling capabilities       |
| **Attendance Tracking**    | Mark participant attendance         |

### 📊 Performance Reviews

| Feature                  | Description                              |
| ------------------------ | ---------------------------------------- |
| **Review Creation**      | Create comprehensive performance reviews |
| **Rating System**        | 1-5 star rating scale                    |
| **Review Periods**       | Define review timeframes                 |
| **Strengths Assessment** | Document employee strengths              |
| **Improvement Areas**    | Identify development opportunities       |
| **Goal Setting**         | Set and track employee goals             |
| **Reviewer Assignment**  | Designated reviewer per review           |

### 📈 Reports & Analytics

| Feature                   | Description                            |
| ------------------------- | -------------------------------------- |
| **Dashboard Analytics**   | Role-based dashboard statistics        |
| **Attendance Reports**    | Daily, weekly, monthly attendance data |
| **Leave Reports**         | Leave usage by type                    |
| **Task Reports**          | Task completion metrics                |
| **Department Statistics** | Department-wise analytics              |
| **Performance Metrics**   | Rating distribution and top performers |
| **Interactive Charts**    | Bar, Line, Doughnut visualisations     |
| **Export Functionality**  | Report export capabilities             |

### 📆 Calendar

| Feature              | Description                         |
| -------------------- | ----------------------------------- |
| **Unified Calendar** | Single view for all events          |
| **Event Types**      | Attendance, Leaves, Meetings, Tasks |
| **Colour Coding**    | Visual event differentiation        |
| **Monthly View**     | Full calendar navigation            |

### 🔔 Notifications

| Feature                     | Description                                 |
| --------------------------- | ------------------------------------------- |
| **Real-time Notifications** | Instant push notifications                  |
| **Notification Types**      | Task, Leave, Meeting, Message notifications |
| **Read/Unread Status**      | Track notification status                   |
| **Mark All Read**           | Bulk notification management                |
| **Notification Bell**       | In-app notification centre                  |

### 🤖 AI-Powered Features

| Feature                     | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| **Description Suggestions** | AI-generated descriptions for tasks, meetings, departments |
| **Inline Completions**      | Real-time text completion suggestions                      |
| **UK English**              | British English language patterns                          |
| **Context-Aware**           | Suggestions based on type and priority                     |
| **Multiple Variations**     | Alternative suggestion options                             |

### 💳 Payment & Subscriptions

| Feature                     | Description                             |
| --------------------------- | --------------------------------------- |
| **Subscription Plans**      | Starter, Professional, Enterprise tiers |
| **Paystack Integration**    | Nigerian payment gateway                |
| **Flutterwave Integration** | African payment gateway                 |
| **Webhook Support**         | Automated payment verification          |
| **Plan Upgrades**           | Seamless plan transitions               |
| **Feature Gating**          | Plan-based feature access               |

---

## 🔐 User Roles & Permissions

### Prime Admin

-   Full system access
-   Create and manage admins
-   Organisation settings control
-   Working hours configuration
-   All admin capabilities

### Admin

-   User management (staff only)
-   Department management
-   Leave approval/rejection
-   Performance reviews
-   Task assignment
-   Report access

### Staff

-   Personal dashboard
-   Clock in/out
-   Leave requests
-   Task management
-   Chat participation
-   Meeting attendance

---

## 💰 Subscription Plans

| Feature             | Starter (₦15,000) | Professional (₦35,000) | Enterprise (₦75,000) |
| ------------------- | :---------------: | :--------------------: | :------------------: |
| Max Employees       |        10         |           50           |      Unlimited       |
| Storage             |        5GB        |          25GB          |      Unlimited       |
| Attendance Tracking |        ✅         |           ✅           |          ✅          |
| Leave Management    |        ✅         |           ✅           |          ✅          |
| Basic Reports       |        ✅         |           ✅           |          ✅          |
| Email Support       |        ✅         |           ✅           |          ✅          |
| Task Management     |        ❌         |           ✅           |          ✅          |
| Team Messaging      |        ❌         |           ✅           |          ✅          |
| Advanced Reports    |        ❌         |           ✅           |          ✅          |
| Performance Reviews |        ❌         |           ✅           |          ✅          |
| Video Calls         |        ❌         |           ✅           |          ✅          |
| Custom Integrations |        ❌         |           ❌           |          ✅          |
| Dedicated Support   |        ❌         |           ❌           |          ✅          |
| API Access          |        ❌         |           ❌           |          ✅          |

---

## 🛠 Tech Stack

### Backend

-   **Framework:** Laravel 12.x
-   **PHP Version:** 8.2+
-   **Database:** MySQL/PostgreSQL
-   **Real-time:** Laravel Reverb (WebSockets)
-   **Authentication:** Laravel Breeze with Sanctum
-   **Queue:** Laravel Queue with database driver

### Frontend

-   **Framework:** React 18.x
-   **Server Communication:** Inertia.js 2.x
-   **Styling:** Tailwind CSS 3.x
-   **Icons:** Heroicons
-   **Charts:** Chart.js with react-chartjs-2
-   **Calendar:** react-big-calendar
-   **Drag & Drop:** @dnd-kit/core, react-beautiful-dnd
-   **Date Handling:** date-fns, moment.js

### AI Service

-   **Framework:** FastAPI (Python)
-   **Server:** Uvicorn
-   **Features:** Text suggestions, inline completions

### Integrations

-   **Google Calendar API** - Calendar synchronisation
-   **Paystack** - Payment processing
-   **Flutterwave** - Payment processing
-   **Laravel Echo** - Real-time events

---

## 📦 Installation

### Prerequisites

-   PHP 8.2+
-   Composer
-   Node.js 18+
-   npm or yarn
-   MySQL/PostgreSQL
-   Python 3.9+ (for AI service)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/your-repo/staff-management-system.git
cd staff-management-system

# Run the setup script
composer setup
```

### Manual Setup

```bash
# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure your database in .env file
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=staff_management
# DB_USERNAME=root
# DB_PASSWORD=

# Run migrations
php artisan migrate

# Install frontend dependencies
npm install

# Build assets
npm run build
```

### Development Server

```bash
# Start all services (server, queue, logs, vite)
composer dev
```

Or run services individually:

```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Queue worker
php artisan queue:listen

# Terminal 3: Vite dev server
npm run dev

# Terminal 4: Laravel Reverb (WebSockets)
php artisan reverb:start
```

### AI Service Setup

```bash
cd ai_service

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

---

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Application
APP_NAME="Staff Management System"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=staff_management
DB_USERNAME=root
DB_PASSWORD=

# Broadcasting (Reverb)
BROADCAST_DRIVER=reverb
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=8080

# Google Calendar (Optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/google/callback

# Payment Gateways (Optional)
PAYSTACK_SECRET_KEY=your-paystack-secret
PAYSTACK_PUBLIC_KEY=your-paystack-public
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret
FLUTTERWAVE_PUBLIC_KEY=your-flutterwave-public

# AI Service
VITE_AI_SERVICE_URL=http://localhost:8001
```

---

## 📚 API Documentation

### Authentication

All API routes require authentication via Laravel Sanctum session-based authentication.

### Main Endpoints

| Module              | Base Route                     | Methods                               |
| ------------------- | ------------------------------ | ------------------------------------- |
| Users               | `/users`                       | GET, POST, PUT, DELETE                |
| Departments         | `/departments`                 | GET, POST, PUT, DELETE                |
| Attendance          | `/attendance`                  | GET, POST, clock-in, clock-out        |
| Leave Requests      | `/leave-requests`              | GET, POST, PUT, approve, reject       |
| Tasks               | `/tasks`                       | GET, POST, PUT, DELETE, update-status |
| Projects            | `/projects`                    | GET, POST, PUT, DELETE                |
| Conversations       | `/conversations`               | GET, POST, private, group             |
| Messages            | `/conversations/{id}/messages` | GET, POST, PUT, DELETE                |
| Meetings            | `/meetings`                    | GET, POST, PUT, DELETE, rsvp, join    |
| Performance Reviews | `/performance-reviews`         | GET, POST, PUT, DELETE                |
| Notifications       | `/notifications`               | GET, mark-read, delete                |

### AI Service Endpoints

| Endpoint                    | Method | Description                      |
| --------------------------- | ------ | -------------------------------- |
| `/api/suggest/description`  | POST   | Generate description suggestions |
| `/api/suggest/completion`   | POST   | Get inline text completions      |
| `/api/suggest/alternatives` | POST   | Get alternative suggestions      |

---

## 🧪 Testing

```bash
# Run all tests
composer test

# Or using artisan
php artisan test
```

---

## 🚀 Deployment

### Production Build

```bash
# Install dependencies (no dev)
composer install --no-dev --optimize-autoloader

# Build frontend assets
npm run build

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### AI Service Deployment (DigitalOcean)

See the [AI Service README](ai_service/README.md) for detailed deployment instructions.

---

## 📁 Project Structure

```
staffms01/
├── app/
│   ├── Events/          # Broadcast events
│   ├── Http/
│   │   ├── Controllers/ # API & Web controllers
│   │   ├── Middleware/  # Custom middleware
│   │   └── Requests/    # Form requests
│   ├── Mail/            # Email templates
│   ├── Models/          # Eloquent models
│   ├── Providers/       # Service providers
│   └── Services/        # Business logic services
├── ai_service/          # Python AI service
├── config/              # Laravel configuration
├── database/
│   ├── factories/       # Model factories
│   ├── migrations/      # Database migrations
│   └── seeders/         # Database seeders
├── public/              # Public assets
├── resources/
│   ├── css/             # Stylesheets
│   ├── js/
│   │   ├── Components/  # React components
│   │   ├── Hooks/       # Custom React hooks
│   │   ├── Layouts/     # Layout components
│   │   ├── Pages/       # Inertia pages
│   │   └── Services/    # Frontend services
│   └── views/           # Blade templates
├── routes/              # Route definitions
├── storage/             # File storage
└── tests/               # Test files
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

-   [Laravel](https://laravel.com) - The PHP framework for web artisans
-   [React](https://reactjs.org) - A JavaScript library for building user interfaces
-   [Inertia.js](https://inertiajs.com) - The modern monolith
-   [Tailwind CSS](https://tailwindcss.com) - A utility-first CSS framework
-   [FastAPI](https://fastapi.tiangolo.com) - Modern Python web framework

---

<p align="center">
  Made with ❤️ for modern workforce management
</p>
