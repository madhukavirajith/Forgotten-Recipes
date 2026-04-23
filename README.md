# Forgotten Recipes

https://forgotten-recipes.vercel.app/

Preserving Sri Lanka's ancient flavors with a modern twist

Forgotten Recipes is a full-stack web application that revives traditional Sri Lankan cuisine through community-driven recipe sharing, cultural storytelling, and modern cooking tools. Users can submit recipes, analyze nutrition, create Western-inspired twists, chat with dieticians and head chefs, and explore a festive food calendar.

---

## Project Vision

Forgotten Recipes brings back long-lost family recipes and Sri Lankan culinary traditions by combining ancestral knowledge with modern technology. The platform empowers users to:

- Explore authentic Sri Lankan recipes
- Analyze nutrition data and health labels
- Westernize dishes with smart ingredient swaps
- Customize spice levels and portion sizes
- Save favorite recipes to personal cookbooks
- Learn the cultural stories behind each meal
- Chat in real time with dieticians and head chefs
- Receive notifications about recipe approvals and replies

---

## Project Management

- **Agile Methodology** – The project was developed using Scrum, with 2‑week sprints, daily stand‑ups, sprint planning, and retrospectives.
- **Task Tracking** – All user stories, tasks, and bugs were managed using GitHub Projects and Issues.
- **Gantt Chart** – A detailed Gantt chart was created using Microsoft Project to visualize the timeline, dependencies, and milestones of each sprint.

---
## Team Members & Roles

| Name     | Role                                          |
|----------|-----------------------------------------------|
| Madhuka  | Product Owner / Scrum Master / Full Stack Developer |
| Nethmi   | Backend Developer                             |
| Yashadhi | Database Engineer                             |
| Binara   | UI/UX Engineer / Frontend Dev                 |
| Kasundi  | Frontend Developer                            |
| Tharushi | QA Engineer                                   |

---
## Tech Stack

| Layer       | Technology                                                                 |
|-------------|----------------------------------------------------------------------------|
| Frontend    | React 18, React Router DOM, Axios, Socket.IO Client, React Icons           |
| Backend     | Node.js, Express, Socket.IO, JWT, Bcryptjs, Helmet, Express Rate Limit     |
| Database    | MongoDB + Mongoose ODM                                                     |
| Styling     | Custom CSS (brand colors #5A2E17 and #D2691E)                              |
| Deployment  | Frontend: Vercel, Backend: Render, Database: MongoDB Atlas                 |

---

## Implemented Features

### User Roles & Dashboards

- **Visitor** – Submit recipes, save to cookbook, use Western Twist Tool, chat with staff
- **Head Chef** – Approve/reject recipes and twists, manage cultural stories
- **Dietician** – Add nutrition info, health labels, ingredient benefits
- **Admin** – Manage users, feedback, blog posts, site analytics, view role distribution

### Recipe Management

- Browse recipes with search, filters (category, spice, diet), sort (newest, popular, name)
- Recipe detail page includes:
  - Star rating and average rating
  - Advanced nutrition chart (macros, vitamins, radar score)
  - Spice and portion simulator (scale ingredients dynamically)
  - Save to cookbook, download PDF, print, share on social media
  - Comments with nested replies, reactions, edit/delete

### Western Twist Tool

- Visitors select a traditional recipe and substitute Western ingredients
- Live preview of twisted ingredients
- Submit twist for head chef approval; dietician adds nutrition later

### Cultural Stories

- Admins and head chefs can create, edit, delete stories
- Visitors can read stories with rich formatting

### Blog

- Admin posts blog articles with images
- Public blog listing page

### Festive Food Calendar

- Interactive calendar showing Sri Lankan festivals and Poya days
- Click a date to see festival details, traditions, and related recipes

### Real-time Chat

- Role-based chat permissions (visitor ↔ dietician/head chef; admin ↔ staff)
- Online/offline status, typing indicators, read receipts
- Persistent conversation history
- Floating chat widget with expand/minimize/fullscreen

### Notifications

- Real-time notifications for recipe approvals, comment replies, feedback updates
- Unread count badge on bell icon
- Mark as read / mark all read

### Cook Mode

- Step-by-step cooking mode with ingredient checklist
- Built-in timer per step (auto-detects time from instructions)
- Progress bar, local storage persistence

### User Profile & Settings

- Edit personal information (name, email, phone, address, date of birth)
- Change password
- Notification preferences (email, dark mode, language, privacy)
- Delete account (danger zone)

### Admin Analytics

- User role distribution bar chart
- Feedback summary (open, in-progress, closed)
- Total users, visitors, feedback count

---

## Security & Performance

- JWT authentication with role-based middleware
- Passwords hashed with bcrypt
- Rate limiting – 200 requests per 15 minutes per IP; 10 for auth endpoints
- Helmet sets secure HTTP headers
- CORS restricted to allowed origins (localhost + Vercel)
- Environment variables never committed (`.env` ignored)
- Exposed credentials rotated after accidental commit (MongoDB password, JWT secret)
- Frontend source maps disabled in production
- Input validation and sanitization on all API endpoints

---

## API Documentation

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/register` | Register a new user | No |
| POST | `/api/users/login` | Login user | No |
| GET | `/api/users/profile` | Get user profile | Yes |
| PUT | `/api/users/profile` | Update user profile | Yes |
| POST | `/api/users/change-password` | Change password | Yes |
| DELETE | `/api/users/account` | Delete account | Yes |

### Recipe Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/recipes` | Get all approved recipes | No |
| GET | `/api/recipes/:id` | Get single recipe by ID | No |
| POST | `/api/recipes` | Create new recipe (Admin/Head Chef) | Yes |
| PUT | `/api/recipes/:id` | Update recipe | Yes |
| DELETE | `/api/recipes/:id` | Delete recipe | Yes |
| POST | `/api/recipes/:id/ratings` | Rate a recipe | Yes |

### Chat Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/chat/available-recipients` | Get users available for chat | Yes |
| POST | `/api/chat/start` | Start or retrieve a conversation | Yes |
| GET | `/api/chat/history/:conversationId` | Get conversation history | Yes |
| POST | `/api/chat/:conversationId/read` | Mark messages as read | Yes |

### Feedback Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/feedback` | Get all feedback (Admin only) | Yes |
| POST | `/api/feedback` | Submit feedback | Yes |
| PATCH | `/api/feedback/:id/status` | Update feedback status (Admin only) | Yes |
| DELETE | `/api/feedback/:id` | Delete feedback (Admin only) | Yes |

### Admin Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/users` | Get all users (Admin only) | Yes |
| DELETE | `/api/admin/users/:id` | Delete user (Admin only) | Yes |
| GET | `/api/admin/stats` | Get site statistics (Admin only) | Yes |
| POST | `/api/admin/blog` | Post a blog (Admin only) | Yes |

---

