/**
 * Student Expense Tracker — script.js
 * Handles: dark mode, charts, password toggle, type selector, strength meter
 */

/* ── Dark Mode ──────────────────────────────────────────────────────────────── */
(function () {
    // Apply saved theme as early as possible (avoid flash)
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
})();

document.addEventListener('DOMContentLoaded', function () {

    // ── Theme toggle button ─────────────────────────────────────────────────
    const toggleBtn  = document.getElementById('themeToggle');
    const themeIcon  = document.getElementById('themeIcon');
    const root       = document.documentElement;

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
        }
        // Update Chart.js chart colours when theme changes
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

    // ── Password visibility toggle ──────────────────────────────────────────
    // Called inline via onclick; also available globally
    window.togglePassword = function (inputId, btn) {
        const input = document.getElementById(inputId);
        const icon  = btn.querySelector('i');
        if (!input) return;
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'bi bi-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'bi bi-eye';
        }
    };

    // ── Password strength meter (register page) ─────────────────────────────
    const pwInput      = document.getElementById('regPassword');
    const strengthFill = document.getElementById('strengthFill');
    const strengthLbl  = document.getElementById('strengthLabel');

    if (pwInput && strengthFill) {
        pwInput.addEventListener('input', function () {
            const pw  = pwInput.value;
            let score = 0;
            if (pw.length >= 6)  score++;
            if (pw.length >= 10) score++;
            if (/[A-Z]/.test(pw))  score++;
            if (/[0-9]/.test(pw))  score++;
            if (/[^A-Za-z0-9]/.test(pw)) score++;

            const pct    = (score / 5) * 100;
            const colors = ['#DC2626','#F97316','#FBBF24','#22C55E','#16A34A'];
            const labels = ['Too weak','Weak','Fair','Good','Strong'];

            strengthFill.style.width = pct + '%';
            strengthFill.style.background = colors[score - 1] || '#DC2626';
            if (strengthLbl) {
                strengthLbl.textContent = pw.length ? labels[score - 1] || 'Too weak' : '';
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

});


/* ── Chart.js helpers ───────────────────────────────────────────────────────── */

// Palette for pie/doughnut slices
const PALETTE = [
    '#F97316','#3B82F6','#10B981','#8B5CF6',
    '#F59E0B','#EC4899','#06B6D4','#6B7280',
];

// Cached chart instances (so we can update on theme change)
let barChartInstance = null;
let pieChartInstance = null;

/** Returns Chart.js grid/label colour based on current theme */
function themeColour() {
    return document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'rgba(255,255,255,.12)'
        : 'rgba(0,0,0,.08)';
}
function labelColour() {
    return document.documentElement.getAttribute('data-theme') === 'dark'
        ? '#A8A29E'
        : '#78716C';
}

/** Initialise the bar chart (Income vs Expense per month) */
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
                    backgroundColor: 'rgba(22,163,74,.75)',
                    borderColor:     '#16A34A',
                    borderWidth: 1.5,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Expense',
                    data: data.barExpense,
                    backgroundColor: 'rgba(220,38,38,.75)',
                    borderColor:     '#DC2626',
                    borderWidth: 1.5,
                    borderRadius: 6,
                    borderSkipped: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: labelColour(),
                        font: { family: 'DM Sans', size: 12 },
                        padding: 16,
                        boxWidth: 12,
                        boxHeight: 12,
                    }
                },
                tooltip: {
                    backgroundColor: '#1C1917',
                    titleColor: '#F5F4F2',
                    bodyColor:  '#A8A29E',
                    padding: 12,
                    callbacks: {
                        label: ctx => ` ₹${ctx.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: {
                    grid:  { color: themeColour() },
                    ticks: { color: labelColour(), font: { size: 11 } }
                },
                y: {
                    grid:  { color: themeColour() },
                    ticks: {
                        color: labelColour(),
                        font: { size: 11 },
                        callback: val => '₹' + val.toLocaleString()
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

/** Initialise the doughnut chart (expense by category) */
function initPieChart(data) {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;

    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.pieLabels,
            datasets: [{
                data: data.pieValues,
                backgroundColor: PALETTE.slice(0, data.pieLabels.length),
                borderColor: document.documentElement.getAttribute('data-theme') === 'dark'
                    ? '#1E1D1B' : '#FFFFFF',
                borderWidth: 3,
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color:  labelColour(),
                        font:   { family: 'DM Sans', size: 11 },
                        padding: 14,
                        boxWidth:  10,
                        boxHeight: 10,
                    }
                },
                tooltip: {
                    backgroundColor: '#1C1917',
                    titleColor: '#F5F4F2',
                    bodyColor:  '#A8A29E',
                    padding: 12,
                    callbacks: {
                        label: ctx => ` ₹${ctx.parsed.toFixed(2)}`
                    }
                }
            }
        }
    });
}

/** Refresh chart axis colours when user toggles dark/light mode */
function updateChartTheme(theme) {
    const grid  = theme === 'dark' ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)';
    const label = theme === 'dark' ? '#A8A29E' : '#78716C';
    const border = theme === 'dark' ? '#1E1D1B' : '#FFFFFF';

    if (barChartInstance) {
        const sc = barChartInstance.options.scales;
        sc.x.grid.color  = grid;
        sc.x.ticks.color = label;
        sc.y.grid.color  = grid;
        sc.y.ticks.color = label;
        barChartInstance.options.plugins.legend.labels.color = label;
        barChartInstance.update();
    }

    if (pieChartInstance) {
        pieChartInstance.data.datasets[0].borderColor = border;
        pieChartInstance.options.plugins.legend.labels.color = label;
        pieChartInstance.update();
    }
}
