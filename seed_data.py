"""
seed_data.py — Populate database with sample test data
Run once: python seed_data.py
"""
import sqlite3
from werkzeug.security import generate_password_hash

DATABASE = 'database.db'

# ── Sample users ──────────────────────────────────────────────────────────────
USERS = [
    ('Alice Student', 'alice@example.com', 'password123'),
    ('Bob Learner',   'bob@example.com',   'password123'),
]

# ── Sample transactions for user 1 (alice) ────────────────────────────────────
TRANSACTIONS = [
    # Income
    (1, 15000, 'Others',        'Income',  '2025-12-01', 'Monthly allowance'),
    (1,  5000, 'Others',        'Income',  '2025-12-15', 'Part-time tutoring'),
    (1, 15000, 'Others',        'Income',  '2026-01-01', 'Monthly allowance'),
    (1,  3000, 'Others',        'Income',  '2026-01-20', 'Freelance project'),
    (1, 15000, 'Others',        'Income',  '2026-02-01', 'Monthly allowance'),

    # Expenses
    (1,  3500, 'Rent',          'Expense', '2025-12-02', 'Hostel rent Dec'),
    (1,  1800, 'Food',          'Expense', '2025-12-10', 'Groceries & canteen'),
    (1,   450, 'Travel',        'Expense', '2025-12-12', 'Bus pass'),
    (1,  2000, 'Fees',          'Expense', '2025-12-20', 'Library fee'),
    (1,   800, 'Shopping',      'Expense', '2025-12-24', 'Christmas gifts'),

    (1,  3500, 'Rent',          'Expense', '2026-01-02', 'Hostel rent Jan'),
    (1,  2100, 'Food',          'Expense', '2026-01-08', 'Groceries'),
    (1,   600, 'Travel',        'Expense', '2026-01-15', 'Cab to college'),
    (1,  1500, 'Entertainment', 'Expense', '2026-01-18', 'Cinema & outing'),
    (1,   350, 'Health',        'Expense', '2026-01-25', 'Pharmacy'),

    (1,  3500, 'Rent',          'Expense', '2026-02-02', 'Hostel rent Feb'),
    (1,  1600, 'Food',          'Expense', '2026-02-08', 'Mess bill'),
    (1,  1200, 'Shopping',      'Expense', '2026-02-14', 'Valentines stationery'),
    (1,   500, 'Travel',        'Expense', '2026-02-18', 'Auto rickshaw'),
    (1,  4500, 'Fees',          'Expense', '2026-02-20', 'Exam registration fee'),
]

def seed():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()

    # Insert users
    for name, email, pw in USERS:
        try:
            c.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                      (name, email, generate_password_hash(pw)))
            print(f'  ✓ User created: {email}')
        except sqlite3.IntegrityError:
            print(f'  ! User already exists: {email}')

    # Insert transactions
    c.executemany('''
        INSERT INTO transactions (user_id, amount, category, type, date, description)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', TRANSACTIONS)

    conn.commit()
    conn.close()
    print('\nSeed complete! Login with:')
    print('  Email:    alice@example.com')
    print('  Password: password123')

if __name__ == '__main__':
    seed()
