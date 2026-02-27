/**
 * Student Expense Tracker — script.js (Redesigned)
 * Handles: dark mode, navbar scroll, charts, password toggle,
 *          type selector, strength meter, page animations
 */

/* ── Dark Mode (early apply to prevent flash) ──────────────────────────────── */
(function () {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
})();

document.addEventListener('DOMContentLoaded', function () {

    // ── Theme toggle ────────────────────────────────────────────────────────
    const toggleBtn = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const root = document.documentElement;

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeIcon) {
            themeIcon.className = theme === 'dark'
                ? 'bi bi-sun-fill'
                : 'bi bi-moon-fill';
        }
        updateChartTheme(theme);
    }

    if (toggleBtn) {
        const current = localStorage.getItem('theme') || 'light';
        applyTheme(current);

        toggleBtn.addEventListener('click', function () {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }

    // ── Navbar scroll effect ────────────────────────────────────────────────
    const nav = document.getElementById('mainNav');
    if (nav) {
        const onScroll = () => {
            nav.classList.toggle('scrolled', window.scrollY > 10);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // ── Stagger animations for stat cards ───────────────────────────────────
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity .5s cubic-bezier(.16,1,.3,1), transform .5s cubic-bezier(.16,1,.3,1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + i * 120);
    });

    // ── Animate table rows on load ──────────────────────────────────────────
    const tableRows = document.querySelectorAll('.tx-row, .table-custom tbody tr');
    tableRows.forEach((row, i) => {
        row.style.opacity = '0';
        row.style.transform = 'translateX(-12px)';
        setTimeout(() => {
            row.style.transition = 'opacity .4s ease, transform .4s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
        }, 80 + i * 50);
    });

    // ── Password visibility toggle ──────────────────────────────────────────
    window.togglePassword = function (inputId, btn) {
        const input = document.getElementById(inputId);
        const icon = btn.querySelector('i');
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'bi bi-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'bi bi-eye';
        }
    };

    // ── Password strength meter ─────────────────────────────────────────────
    const pwInput = document.getElementById('regPassword');
    const strengthFill = document.getElementById('strengthFill');
    const strengthLbl = document.getElementById('strengthLabel');

    if (pwInput && strengthFill) {
        pwInput.addEventListener('input', function () {
            const pw = pwInput.value;
            let score = 0;
            if (pw.length >= 6)  score++;
            if (pw.length >= 10) score++;
            if (/[A-Z]/.test(pw))  score++;
            if (/[0-9]/.test(pw))  score++;
            if (/[^A-Za-z0-9]/.test(pw)) score++;

            const pct = (score / 5) * 100;
            const colors = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#059669'];
            const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

            strengthFill.style.width = pct + '%';
            strengthFill.style.background = colors[score - 1] || '#EF4444';
            if (strengthLbl) {
                strengthLbl.textContent = pw.length ? labels[score - 1] || 'Too weak' : '';
                strengthLbl.style.color = colors[score - 1] || '';
            }
        });
    }

    // ── Type selector (add/edit transaction pages) ──────────────────────────
    const typeRadios = document.querySelectorAll('input[name="typeToggle"]');
    const hiddenType = document.getElementById('hiddenType');

    if (typeRadios.length && hiddenType) {
        typeRadios.forEach(radio => {
            radio.addEventListener('change', function () {
                hiddenType.value = this.value;
            });
        });
    }

    // ── Auto-dismiss flash alerts ───────────────────────────────────────────
    setTimeout(function () {
        document.querySelectorAll('.custom-alert').forEach(function (el) {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(el);
            bsAlert.close();
        });
    }, 4500);

    // ── Smooth focus glow on inputs ─────────────────────────────────────────
    document.querySelectorAll('.form-control-custom, .form-select-custom').forEach(input => {
        input.addEventListener('focus', function () {
            const icon = this.parentElement.querySelector('.input-icon');
            if (icon) icon.style.color = 'var(--accent)';
        });
        input.addEventListener('blur', function () {
            const icon = this.parentElement.querySelector('.input-icon');
            if (icon) icon.style.color = '';
        });
    });
});


/* ── Chart.js helpers ───────────────────────────────────────────────────────── */

// Updated palette (indigo-first)
const PALETTE = [
    '#6366F1', '#8B5CF6', '#06B6D4', '#10B981',
    '#F59E0B', '#EC4899', '#14B8A6', '#64748B',
];

let barChartInstance = null;
let pieChartInstance = null;

function themeColour() {
    return document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'rgba(255,255,255,.08)'
        : 'rgba(0,0,0,.06)';
}

function labelColour() {
    return document.documentElement.getAttribute('data-theme') === 'dark'
        ? '#94A3B8'
        : '#64748B';
}

/** Initialise the bar chart */
function initBarChart(data) {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;

    barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.barLabels,
            datasets: [
                {
                    label: 'Income',
                    data: data.barIncome,
                    backgroundColor: 'rgba(16, 185, 129, .7)',
                    borderColor: '#10B981',
                    borderWidth: 0,
                    borderRadius: 8,
                    borderSkipped: false,
                },
                {
                    label: 'Expense',
                    data: data.barExpense,
                    backgroundColor: 'rgba(239, 68, 68, .7)',
                    borderColor: '#EF4444',
                    borderWidth: 0,
                    borderRadius: 8,
                    borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: {
                        color: labelColour(),
                        font: { family: 'Inter', size: 12, weight: 500 },
                        padding: 20,
                        boxWidth: 12,
                        boxHeight: 12,
                        useBorderRadius: true,
                        borderRadius: 3,
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, .9)',
                    titleColor: '#F1F5F9',
                    bodyColor: '#94A3B8',
                    padding: 14,
                    cornerRadius: 12,
                    titleFont: { family: 'Space Grotesk', weight: 600 },
                    bodyFont: { family: 'Inter' },
                    callbacks: {
                        label: ctx => ` ₹${ctx.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: themeColour(), drawBorder: false },
                    ticks: { color: labelColour(), font: { size: 11, family: 'Inter' } }
                },
                y: {
                    grid: { color: themeColour(), drawBorder: false },
                    ticks: {
                        color: labelColour(),
                        font: { size: 11, family: 'Inter' },
                        callback: val => '₹' + val.toLocaleString()
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

/** Initialise the doughnut chart */
function initPieChart(data) {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.pieLabels,
            datasets: [{
                data: data.pieValues,
                backgroundColor: PALETTE.slice(0, data.pieLabels.length),
                borderColor: isDark ? 'rgba(30,41,59,.7)' : 'rgba(255,255,255,.8)',
                borderWidth: 3,
                hoverOffset: 12,
                hoverBorderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: labelColour(),
                        font: { family: 'Inter', size: 11, weight: 500 },
                        padding: 16,
                        boxWidth: 10,
                        boxHeight: 10,
                        useBorderRadius: true,
                        borderRadius: 3,
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, .9)',
                    titleColor: '#F1F5F9',
                    bodyColor: '#94A3B8',
                    padding: 14,
                    cornerRadius: 12,
                    titleFont: { family: 'Space Grotesk', weight: 600 },
                    bodyFont: { family: 'Inter' },
                    callbacks: {
                        label: ctx => ` ₹${ctx.parsed.toFixed(2)}`
                    }
                }
            }
        }
    });
}

/** Refresh chart axis colours on theme toggle */
function updateChartTheme(theme) {
    const grid = theme === 'dark' ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
    const label = theme === 'dark' ? '#94A3B8' : '#64748B';
    const border = theme === 'dark' ? 'rgba(30,41,59,.7)' : 'rgba(255,255,255,.8)';

    if (barChartInstance) {
        const sc = barChartInstance.options.scales;
        sc.x.grid.color = grid;
        sc.x.ticks.color = label;
        sc.y.grid.color = grid;
        sc.y.ticks.color = label;
        barChartInstance.options.plugins.legend.labels.color = label;
        barChartInstance.update('none');
    }

    if (pieChartInstance) {
        pieChartInstance.data.datasets[0].borderColor = border;
        pieChartInstance.options.plugins.legend.labels.color = label;
        pieChartInstance.update('none');
    }
}
