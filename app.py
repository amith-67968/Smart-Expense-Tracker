"""
Student Expense Tracker - Main Application
==========================================
A Flask-based expense tracking web app for students.
"""

import sqlite3
import csv
import io
from datetime import datetime, date
from functools import wraps
from flask import (Flask, render_template, request, redirect, url_for,
                   session, flash, jsonify, make_response)
from werkzeug.security import generate_password_hash, check_password_hash

# ── App Configuration ──────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = 'student-expense-tracker-secret-key-2024'  # Change in production!

DATABASE = 'database.db'

CATEGORIES = ['Food', 'Travel', 'Rent', 'Fees', 'Shopping', 'Entertainment', 'Health', 'Others']

# ── Database Helpers ───────────────────────────────────────────────────────────

def get_db():
    """Open a database connection."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # Allows dict-like access to rows
    return conn


def init_db():
    """Create tables if they don't exist."""
    with get_db() as conn:
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                name     TEXT    NOT NULL,
                email    TEXT    NOT NULL UNIQUE,
                password TEXT    NOT NULL
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                amount      REAL    NOT NULL,
                category    TEXT    NOT NULL,
                type        TEXT    NOT NULL CHECK(type IN ("Income","Expense")),
                date        TEXT    NOT NULL,
                description TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        ''')


# ── Auth Decorator ─────────────────────────────────────────────────────────────

def login_required(f):
    """Redirect to login if user is not in session."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated


# ── Auth Routes ────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name     = request.form.get('name', '').strip()
        email    = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        # Basic validation
        if not name or not email or not password:
            flash('All fields are required.', 'danger')
            return render_template('register.html')

        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'danger')
            return render_template('register.html')

        hashed_pw = generate_password_hash(password)

        try:
            with get_db() as conn:
                conn.execute(
                    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                    (name, email, hashed_pw)
                )
            flash('Account created! Please log in.', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Email already registered.', 'danger')

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email    = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        with get_db() as conn:
            user = conn.execute(
                'SELECT * FROM users WHERE email = ?', (email,)
            ).fetchone()

        if user and check_password_hash(user['password'], password):
            session['user_id']   = user['id']
            session['user_name'] = user['name']
            flash(f'Welcome back, {user["name"]}!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password.', 'danger')

    return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))


# ── Dashboard ──────────────────────────────────────────────────────────────────

@app.route('/dashboard')
@login_required
def dashboard():
    user_id = session['user_id']
    month   = request.args.get('month', date.today().strftime('%Y-%m'))

    with get_db() as conn:
        # All-time totals
        totals = conn.execute('''
            SELECT
                SUM(CASE WHEN type="Income"  THEN amount ELSE 0 END) AS total_income,
                SUM(CASE WHEN type="Expense" THEN amount ELSE 0 END) AS total_expense
            FROM transactions WHERE user_id = ?
        ''', (user_id,)).fetchone()

        # Recent 5 transactions
        recent = conn.execute('''
            SELECT * FROM transactions
            WHERE user_id = ?
            ORDER BY date DESC LIMIT 5
        ''', (user_id,)).fetchall()

        # Monthly bar chart data (last 6 months)
        monthly = conn.execute('''
            SELECT
                strftime("%Y-%m", date) AS month,
                SUM(CASE WHEN type="Income"  THEN amount ELSE 0 END) AS income,
                SUM(CASE WHEN type="Expense" THEN amount ELSE 0 END) AS expense
            FROM transactions
            WHERE user_id = ?
            GROUP BY month
            ORDER BY month DESC LIMIT 6
        ''', (user_id,)).fetchall()

        # Category breakdown for selected month
        cat_data = conn.execute('''
            SELECT category, SUM(amount) AS total
            FROM transactions
            WHERE user_id = ? AND type = "Expense"
              AND strftime("%Y-%m", date) = ?
            GROUP BY category
        ''', (user_id, month)).fetchall()

        # Budget warning: if expense > 80% of income this month
        month_totals = conn.execute('''
            SELECT
                SUM(CASE WHEN type="Income"  THEN amount ELSE 0 END) AS inc,
                SUM(CASE WHEN type="Expense" THEN amount ELSE 0 END) AS exp
            FROM transactions
            WHERE user_id = ? AND strftime("%Y-%m", date) = ?
        ''', (user_id, month)).fetchone()

    total_income  = totals['total_income']  or 0
    total_expense = totals['total_expense'] or 0
    balance       = total_income - total_expense

    # Budget alert logic
    budget_alert = False
    if month_totals['inc'] and month_totals['exp']:
        if month_totals['exp'] >= 0.8 * month_totals['inc']:
            budget_alert = True

    # Prepare chart data
    monthly_reversed = list(reversed(monthly))
    chart_labels  = [r['month'] for r in monthly_reversed]
    chart_income  = [r['income']  for r in monthly_reversed]
    chart_expense = [r['expense'] for r in monthly_reversed]

    pie_labels = [r['category'] for r in cat_data]
    pie_values = [r['total']    for r in cat_data]

    return render_template('dashboard.html',
        total_income=total_income,
        total_expense=total_expense,
        balance=balance,
        recent=recent,
        chart_labels=chart_labels,
        chart_income=chart_income,
        chart_expense=chart_expense,
        pie_labels=pie_labels,
        pie_values=pie_values,
        budget_alert=budget_alert,
        selected_month=month
    )


# ── Transactions ───────────────────────────────────────────────────────────────

@app.route('/transactions')
@login_required
def transactions():
    user_id  = session['user_id']
    month    = request.args.get('month', '')
    tx_type  = request.args.get('type', '')
    category = request.args.get('category', '')

    query  = 'SELECT * FROM transactions WHERE user_id = ?'
    params = [user_id]

    if month:
        query += ' AND strftime("%Y-%m", date) = ?'
        params.append(month)
    if tx_type:
        query += ' AND type = ?'
        params.append(tx_type)
    if category:
        query += ' AND category = ?'
        params.append(category)

    query += ' ORDER BY date DESC'

    with get_db() as conn:
        txs = conn.execute(query, params).fetchall()

    return render_template('transactions.html',
        transactions=txs,
        categories=CATEGORIES,
        selected_month=month,
        selected_type=tx_type,
        selected_category=category
    )


@app.route('/add', methods=['GET', 'POST'])
@login_required
def add_transaction():
    if request.method == 'POST':
        user_id     = session['user_id']
        amount      = request.form.get('amount', '')
        category    = request.form.get('category', '')
        tx_type     = request.form.get('type', '')
        tx_date     = request.form.get('date', '')
        description = request.form.get('description', '').strip()

        # Validation
        if not amount or not category or not tx_type or not tx_date:
            flash('All required fields must be filled.', 'danger')
            return render_template('add_transaction.html', categories=CATEGORIES)

        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError
        except ValueError:
            flash('Amount must be a positive number.', 'danger')
            return render_template('add_transaction.html', categories=CATEGORIES)

        with get_db() as conn:
            conn.execute('''
                INSERT INTO transactions (user_id, amount, category, type, date, description)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, amount, category, tx_type, tx_date, description))

        flash('Transaction added successfully!', 'success')
        return redirect(url_for('transactions'))

    return render_template('add_transaction.html',
        categories=CATEGORIES,
        today=date.today().isoformat()
    )


@app.route('/edit/<int:tx_id>', methods=['GET', 'POST'])
@login_required
def edit_transaction(tx_id):
    user_id = session['user_id']

    with get_db() as conn:
        tx = conn.execute(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
            (tx_id, user_id)
        ).fetchone()

    if not tx:
        flash('Transaction not found.', 'danger')
        return redirect(url_for('transactions'))

    if request.method == 'POST':
        amount      = request.form.get('amount', '')
        category    = request.form.get('category', '')
        tx_type     = request.form.get('type', '')
        tx_date     = request.form.get('date', '')
        description = request.form.get('description', '').strip()

        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError
        except ValueError:
            flash('Amount must be a positive number.', 'danger')
            return render_template('edit_transaction.html', tx=tx, categories=CATEGORIES)

        with get_db() as conn:
            conn.execute('''
                UPDATE transactions
                SET amount=?, category=?, type=?, date=?, description=?
                WHERE id=? AND user_id=?
            ''', (amount, category, tx_type, tx_date, description, tx_id, user_id))

        flash('Transaction updated!', 'success')
        return redirect(url_for('transactions'))

    return render_template('edit_transaction.html', tx=tx, categories=CATEGORIES)


@app.route('/delete/<int:tx_id>', methods=['POST'])
@login_required
def delete_transaction(tx_id):
    user_id = session['user_id']
    with get_db() as conn:
        conn.execute(
            'DELETE FROM transactions WHERE id = ? AND user_id = ?',
            (tx_id, user_id)
        )
    flash('Transaction deleted.', 'info')
    return redirect(url_for('transactions'))


# ── CSV Export ─────────────────────────────────────────────────────────────────

@app.route('/export')
@login_required
def export_csv():
    user_id = session['user_id']

    with get_db() as conn:
        txs = conn.execute(
            'SELECT amount, category, type, date, description FROM transactions WHERE user_id = ? ORDER BY date DESC',
            (user_id,)
        ).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Amount', 'Category', 'Type', 'Date', 'Description'])
    for tx in txs:
        writer.writerow([tx['amount'], tx['category'], tx['type'], tx['date'], tx['description']])

    response = make_response(output.getvalue())
    response.headers['Content-Disposition'] = 'attachment; filename=transactions.csv'
    response.headers['Content-Type'] = 'text/csv'
    return response


# ── Run ────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
