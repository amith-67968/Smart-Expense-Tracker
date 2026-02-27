# 💰 Student Expense Tracker

A full-stack web application built with **Python Flask**, **SQLite**, **Bootstrap 5**, and **Chart.js** — designed for student use and academic project submission.

---

## 🗂️ Folder Structure

```
student-expense-tracker/
├── app.py                  ← Flask backend (routes, auth, DB logic)
├── database.db             ← SQLite database (auto-created on first run)
├── seed_data.py            ← Script to populate sample data
├── requirements.txt        ← Python dependencies
│
├── templates/
│   ├── base.html           ← Navbar, flash messages, footer
│   ├── login.html          ← Login page
│   ├── register.html       ← Registration page
│   ├── dashboard.html      ← Main dashboard with charts
│   ├── transactions.html   ← All transactions with filters
│   ├── add_transaction.html
│   └── edit_transaction.html
│
└── static/
    ├── style.css           ← All custom CSS (light + dark themes)
    └── script.js           ← Chart.js + dark mode + UI logic
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites

- Python 3.9 or higher
- pip (comes with Python)

### 2. Create a virtual environment (recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the application

```bash
python app.py
```

The app starts at: **http://127.0.0.1:5000**

### 5. (Optional) Load sample test data

```bash
python seed_data.py
```

Then login with:
- **Email:** alice@example.com
- **Password:** password123

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Auth | Register, Login, Logout with hashed passwords |
| 📊 Dashboard | Income/Expense summary cards + 2 Chart.js charts |
| 💸 Transactions | Add, Edit, Delete, Filter by month/type/category |
| 📈 Charts | Bar chart (last 6 months) + Doughnut chart (by category) |
| 📅 Monthly Filter | Filter dashboard and transactions by month |
| ⚠️ Budget Alert | Warning when expenses exceed 80% of income |
| 📥 CSV Export | Download all transactions as a spreadsheet |
| 🌙 Dark Mode | Toggle between light and dark themes |
| 📱 Responsive | Works on desktop, tablet, and mobile |

---

## 🔒 Security

- Passwords hashed with **Werkzeug's** `generate_password_hash`
- Session-based authentication
- Parameterised SQL queries (no SQL injection)
- User-scoped data (users can only see their own transactions)
- Input validation on all forms

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, Flask |
| Database | SQLite (via stdlib `sqlite3`) |
| Frontend | HTML5, CSS3, Bootstrap 5 |
| Charts | Chart.js 4 |
| Icons | Bootstrap Icons |
| Fonts | Google Fonts (Syne + DM Sans) |

---

## 📸 Pages

- `/` — Redirects to dashboard or login
- `/login` — Sign in
- `/register` — Create account
- `/dashboard` — Overview with charts
- `/transactions` — Full list with filters
- `/add` — Add new transaction
- `/edit/<id>` — Edit transaction
- `/delete/<id>` — Delete (POST)
- `/export` — Download CSV

---

*Built for academic project submission. Feel free to extend!*
