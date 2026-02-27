/**
 * Student Expense Tracker — script.js (B&W Monochrome Edition)
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
        card.style.transform = 'translateY(16px)';
        setTimeout(() => {
            card.style.transition = 'opacity .5s cubic-bezier(.16,1,.3,1), transform .5s cubic-bezier(.16,1,.3,1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 80 + i * 100);
    });

    // ── Animate table rows on load ──────────────────────────────────────────
    const tableRows = document.querySelectorAll('.tx-row, .table-custom tbody tr');
    tableRows.forEach((row, i) => {
        row.style.opacity = '0';
        row.style.transform = 'translateX(-10px)';
        setTimeout(() => {
            row.style.transition = 'opacity .35s ease, transform .35s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
        }, 60 + i * 40);
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

    // ── Password strength meter (monochrome) ────────────────────────────────
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
            // Monochrome strength: lighter grey -> darker black
            const colors = ['#D4D4D4', '#A3A3A3', '#737373', '#404040', '#0A0A0A'];
            const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

            strengthFill.style.width = pct + '%';
            strengthFill.style.background = colors[score - 1] || '#D4D4D4';
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

// Monochrome palette — from dark to light greys
const PALETTE = [
    '#0A0A0A', '#333333', '#525252', '#737373',
    '#A3A3A3', '#C4C4C4', '#D4D4D4', '#E5E5E5',
];

// Dark mode palette — inverted (white to dark)
const PALETTE_DARK = [
    '#FAFAFA', '#D4D4D4', '#A3A3A3', '#737373',
    '#525252', '#404040', '#333333', '#262626',
];

let barChartInstance = null;
let pieChartInstance = null;

function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

function gridColour() {
    return isDark() ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
}

function labelColour() {
    return isDark() ? '#737373' : '#737373';
}

function currentPalette() {
    return isDark() ? PALETTE_DARK : PALETTE;
}

/** Initialise the bar chart */
function initBarChart(data) {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;

    const dark = isDark();

    barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.barLabels,
            datasets: [
                {
                    label: 'Income',
                    data: data.barIncome,
                    backgroundColor: dark ? 'rgba(250, 250, 250, .8)' : 'rgba(10, 10, 10, .85)',
                    borderColor: dark ? '#FAFAFA' : '#0A0A0A',
                    borderWidth: 0,
                    borderRadius: 6,
                    borderSkipped: false,
                },
                {
                    label: 'Expense',
                    data: data.barExpense,
                    backgroundColor: dark ? 'rgba(115, 115, 115, .6)' : 'rgba(163, 163, 163, .6)',
                    borderColor: dark ? '#737373' : '#A3A3A3',
                    borderWidth: 0,
                    borderRadius: 6,
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
                        font: { family: 'Plus Jakarta Sans, system-ui', size: 11, weight: 600 },
                        padding: 20,
                        boxWidth: 10,
                        boxHeight: 10,
                        useBorderRadius: true,
                        borderRadius: 2,
                    }
                },
                tooltip: {
                    backgroundColor: dark ? '#262626' : '#0A0A0A',
                    titleColor: '#FAFAFA',
                    bodyColor: '#A3A3A3',
                    padding: 14,
                    cornerRadius: 8,
                    titleFont: { family: 'Plus Jakarta Sans', weight: 700, size: 13 },
                    bodyFont: { family: 'Plus Jakarta Sans, system-ui' },
                    callbacks: {
                        label: ctx => ` ₹${ctx.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColour(), drawBorder: false },
                    ticks: {
                        color: labelColour(),
                        font: { size: 10, family: 'Plus Jakarta Sans, system-ui', weight: 600 },
                    }
                },
                y: {
                    grid: { color: gridColour(), drawBorder: false },
                    ticks: {
                        color: labelColour(),
                        font: { size: 10, family: 'Plus Jakarta Sans, system-ui' },
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

    const dark = isDark();
    const pal = currentPalette();

    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.pieLabels,
            datasets: [{
                data: data.pieValues,
                backgroundColor: pal.slice(0, data.pieLabels.length),
                borderColor: dark ? '#171717' : '#FFFFFF',
                borderWidth: 3,
                hoverOffset: 10,
                hoverBorderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: labelColour(),
                        font: { family: 'Plus Jakarta Sans, system-ui', size: 10, weight: 600 },
                        padding: 14,
                        boxWidth: 8,
                        boxHeight: 8,
                        useBorderRadius: true,
                        borderRadius: 2,
                    }
                },
                tooltip: {
                    backgroundColor: dark ? '#262626' : '#0A0A0A',
                    titleColor: '#FAFAFA',
                    bodyColor: '#A3A3A3',
                    padding: 14,
                    cornerRadius: 8,
                    titleFont: { family: 'Plus Jakarta Sans', weight: 700, size: 13 },
                    bodyFont: { family: 'Plus Jakarta Sans, system-ui' },
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
    const dark = theme === 'dark';
    const grid = dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
    const label = '#737373';
    const border = dark ? '#171717' : '#FFFFFF';

    if (barChartInstance) {
        const sc = barChartInstance.options.scales;
        sc.x.grid.color = grid;
        sc.x.ticks.color = label;
        sc.y.grid.color = grid;
        sc.y.ticks.color = label;
        barChartInstance.options.plugins.legend.labels.color = label;

        // Update bar colors
        barChartInstance.data.datasets[0].backgroundColor = dark ? 'rgba(250,250,250,.8)' : 'rgba(10,10,10,.85)';
        barChartInstance.data.datasets[0].borderColor = dark ? '#FAFAFA' : '#0A0A0A';
        barChartInstance.data.datasets[1].backgroundColor = dark ? 'rgba(115,115,115,.6)' : 'rgba(163,163,163,.6)';
        barChartInstance.data.datasets[1].borderColor = dark ? '#737373' : '#A3A3A3';

        barChartInstance.options.plugins.tooltip.backgroundColor = dark ? '#262626' : '#0A0A0A';

        barChartInstance.update('none');
    }

    if (pieChartInstance) {
        const pal = dark ? PALETTE_DARK : PALETTE;
        const numLabels = pieChartInstance.data.labels.length;
        pieChartInstance.data.datasets[0].backgroundColor = pal.slice(0, numLabels);
        pieChartInstance.data.datasets[0].borderColor = border;
        pieChartInstance.options.plugins.legend.labels.color = label;
        pieChartInstance.options.plugins.tooltip.backgroundColor = dark ? '#262626' : '#0A0A0A';
        pieChartInstance.update('none');
    }
}
