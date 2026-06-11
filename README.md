# 🏺 Forgotten Recipes

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4ea94b?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **Preserving Sri Lanka's ancient flavors with a modern twist.**

Forgotten Recipes is a premium full-stack platform dedicated to reviving traditional Sri Lankan cuisine. By merging ancestral culinary wisdom with state-of-the-art technology, we've created a digital sanctuary for heritage recipes, cultural storytelling, and innovative cooking tools.

[**Explore the App**](https://forgotten-recipes.vercel.app/)

---

## ✨ Key Features

### 🍛 Culinary Archive
* **Authentic Collection**: Browse hundreds of traditional recipes passed down through generations.
* **Smart Search & Filters**: Find dishes by region, spice level, dietary needs, or festival.
* **Dynamic Portioning**: Scale ingredients instantly for any number of servings.
* **Cook Mode**: An immersive, step-by-step interface with built-in timers and ingredient checklists.

### 🧪 Modern Innovation
* **Western Twist Tool**: Reimagining heritage dishes with western alternatives for global accessibility.
* **Nutrition Visualizer**: Advanced macro and micro-nutrient analysis with interactive radar charts.
* **Spice Simulator**: Adjust heat levels in real-time to suit your palate while maintaining authenticity.

### 🏛️ Cultural Heritage
* **Interactive Festive Calendar**: Explore the connection between Sri Lankan festivals (Avurudu, Thai Pongal, Poya) and their traditional foods.
* **Cultural Storytelling**: In-depth articles exploring the history and myths behind our island's flavors.
* **Premium Blog**: Weekly insights into the world of Sri Lankan gastronomy.

### 💬 Professional Connectivity
* **Real-time Expert Chat**: Connect instantly with Head Chefs and Professional Dieticians.
* **Live Notifications**: Stay updated on recipe approvals, community feedback, and direct replies.
* **User Ecosystem**: A multi-role system (Visitor, Head Chef, Dietician, Admin) ensuring quality and authenticity.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, React Router 6, Axios, Socket.IO Client, FontAwesome 6 |
| **Backend** | Node.js, Express, Socket.IO, JWT Authentication |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Security** | Bcryptjs (Hashing), Helmet (Security Headers), Express Rate Limit |
| **Styling** | Premium Vanilla CSS3 (Heritage Brown & Orange Palette) |
| **Deployment** | Vercel (Frontend), Render (Backend), MongoDB Atlas |

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v16.x or higher)
* MongoDB Atlas Account or Local MongoDB Instance
* npm or yarn

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/ForgottenRecipes.git
   cd ForgottenRecipes
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   ```
   * Create a `.env` file in the `server` directory (see [Environment Variables](#environment-variables)).
   * Start the server:
   ```bash
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   ```
   * Start the React application:
   ```bash
   npm start
   ```

---

## 🔐 Environment Variables

The server requires the following environment variables to be set in `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:3000
```

---

## 📁 Project Structure

```
ForgottenRecipes/
├- client/                 # React Frontend
│   ├- public/             # Static assets
│   └- src/
│       ├- components/     # Functional React components
│       ├- styles/         # Modular CSS files
│       └- utils/          # API helpers and logic
├- server/                 # Express Backend
│   ├- config/             # Database & Security configs
│   ├- models/             # Mongoose schemas
│   ├- routes/             # API endpoints
│   └- middleware/         # Auth & validation logic
└- README.md
```

---

## 🤝 The Team

| Name | Role |
| :--- | :--- |
| **Madhuka** | Product Owner / Scrum Master / Full Stack Developer |
| **Nethmi** | Backend Developer |
| **Yashadhi** | Database Engineer |
| **Binara** | UI/UX Engineer / Frontend Developer |
| **Kasundi** | Frontend Developer |
| **Tharushi** | QA Engineer |

---

## 🛡️ Security & Performance

* **JWT Auth**: Robust role-based access control for all sensitive endpoints.
* **Rate Limiting**: Protection against brute-force attacks on auth and heavy endpoints.
* **Input Sanitization**: All user inputs are validated and sanitized server-side.
* **Optimized Rendering**: Lazy-loading of images and code splitting for fast initial page loads.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  <b>Forgotten Recipes</b> • Preserving Heritage, One Recipe at a Time.
</p>
