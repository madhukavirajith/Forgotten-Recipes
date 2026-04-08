# 🍛 Forgotten Recipes

A MERN-based interactive platform to preserve, promote, and personalize Sri Lanka’s ancient culinary heritage — with modern health tools and cultural storytelling.

---

## 🌍 Project Vision

"Forgotten Recipes" is a full-stack web application that allows users to:

- Explore traditional Sri Lankan recipes
- Analyze nutrition data and health impacts
- Westernize dishes with smart ingredient swaps
- Customize spice levels and portion sizes
- Save favorite recipes to personal cookbooks
- Learn the cultural stories behind each meal

---

## 🛠 Tech Stack

| Layer       | Technology            |
|-------------|------------------------|
| Frontend    | React.js (client)      |
| Backend     | Node.js + Express      |
| Database    | MongoDB (Mongoose)     |
| Styling     |                        |
| Testing     | Postman                |
| Deployment  | Localhost              |

---

## 📐 Object-Oriented Analysis & Design (OOAD)

We follow the OOAD methodology using:

- Use Case Diagrams
- Class & Sequence Diagrams
- Modular design for User roles and API layers
- Separation of Concerns (Frontend/Backend/Data)

---

## 🧑‍🍳 User Roles

- **Unregistered Visitor**: Browse recipes, view nutrition
- **Registered User**: Save, customize, comment, share
- **Dietician**: Add nutrition data, suggest tweaks
- **Head Chef**: Verify recipes, approve twists
- **Admin**: Manage accounts, content, analytics

---

## 🔨 Features Roadmap

### ✅ Sprint 1-3
- [x] Project structure and GitHub setup
- [x] Authentication & Role-based access (backend)
- [x] MongoDB Models: User, Recipe
- [x] Recipe CRUD APIs
- [x] Homepage & Recipe Browser (frontend)
- [x] Personal Cookbook UI (mocked)
- [x] Western Twist Tool (UI prototype)
- [x] Postman API testing

### ⏳ Sprint 4-5
- [ ] Nutrition Graph and Reports
- [ ] Western Twist backend logic
- [ ] Cookbook API integration
- [ ] Spice Level Simulator
- [ ] PDF export and Measurement Converter
- [ ] Blog & Story integration
- [ ] Festive Food Calendar
- [ ] Live Chat with Dietician
- [ ] Rating system & public twist gallery
- [ ] Responsive and cross-browser testing

---

## 👥 Team Members

| Name     | Role                          |
|----------|-------------------------------|
| Madhuka  | Product Owner / Scrum Master / Full Stack Developer |
| Nethmi   | Backend Developer             |
| Yashadhi | Database Engineer             |
| Binara   | UI/UX Engineer / Frontend Dev |
| Kasundi  | Frontend Developer            |
| Tharushi | QA Engineer                   |

---

## ⚙️ Run Locally

```bash
# Clone the repo
git clone https://github.com/madhukavirajith/ForgottenRecipes.git

# Backend Setup
cd server
npm install
npm run dev

# Frontend Setup
cd ../client
npm install
npm start
