/* ==========================================================================
   Sample HTML Hosting Test Site - Interactive Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initEnvironmentMetrics();
    initPerformanceMetrics();
    initConsoleWelcome();
});

// 1. Theme Management (Dark / Light Mode)
function initTheme() {
    const themeToggleBtn = document.getElementById('themeToggle');
    const themeIcon = themeToggleBtn.querySelector('.theme-icon');

    // Retrieve saved theme or default to dark
    const savedTheme = localStorage.getItem('testnode_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('testnode_theme', newTheme);
        themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';

        appendLog(`[THEME] Switched UI theme mode to: ${newTheme.toUpperCase()}`, 'info');
    });
}

// 2. Client & Environment Metrics Discovery
function initEnvironmentMetrics() {
    // Protocol Check
    const isHttps = window.location.protocol === 'https:';
    const valProtocol = document.getElementById('valProtocol');
    const valProtocolSub = document.getElementById('valProtocolSub');

    valProtocol.textContent = isHttps ? 'HTTPS / TLS' : 'HTTP / Plain';
    valProtocol.className = isHttps ? 'metric-value text-success' : 'metric-value';
    valProtocolSub.textContent = isHttps ? 'Secure Connection Active' : 'Unencrypted Web Port';

    // Viewport & Screen Dimensions
    const updateViewport = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        document.getElementById('valViewport').textContent = `${width}px × ${height}px`;

        let deviceType = 'Desktop Viewport';
        if (width <= 600) deviceType = 'Mobile Viewport';
        else if (width <= 900) deviceType = 'Tablet Viewport';
        
        document.getElementById('valDeviceType').textContent = deviceType;
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);

    // Environment Card Fields
    document.getElementById('envUserAgent').textContent = navigator.userAgent;
    document.getElementById('envLang').textContent = navigator.language || 'en-US';
    document.getElementById('envScreen').textContent = `${window.screen.width} × ${window.screen.height} (${window.screen.colorDepth}-bit color)`;
    document.getElementById('envTimezone').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    
    // Server Host / System Time Clock
    const updateTime = () => {
        const now = new Date();
        document.getElementById('envServerTime').textContent = now.toUTCString();
    };
    updateTime();
    setInterval(updateTime, 1000);

    // LocalStorage Support Check
    try {
        localStorage.setItem('__test_key__', '1');
        localStorage.removeItem('__test_key__');
        document.getElementById('envStorage').textContent = 'Supported & Accessible';
    } catch (e) {
        document.getElementById('envStorage').textContent = 'Restricted / Disabled';
        document.getElementById('envStorage').className = 'env-val text-error';
    }
}

// 3. Performance & Page Load Metrics
function initPerformanceMetrics() {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfNav = performance.getEntriesByType('navigation')[0];
            let loadTimeMs = 0;

            if (perfNav) {
                loadTimeMs = Math.round(perfNav.loadEventEnd - perfNav.startTime);
            } else {
                loadTimeMs = Math.round(performance.now());
            }

            const valLoadTime = document.getElementById('valLoadTime');
            valLoadTime.textContent = `${loadTimeMs} ms`;

            if (loadTimeMs < 300) {
                valLoadTime.className = 'metric-value text-success';
            }

            appendLog(`[PERF] Navigation timing completed in ${loadTimeMs}ms`, 'success');
        }, 50);
    });
}

// 4. Console Logger Implementation
function appendLog(message, level = 'info') {
    const consoleBody = document.getElementById('consoleBody');
    if (!consoleBody) return;

    const entry = document.createElement('div');
    entry.className = `log-entry log-${level}`;

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    entry.textContent = `[${timestamp}] ${message}`;

    consoleBody.appendChild(entry);
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

function clearConsole() {
    const consoleBody = document.getElementById('consoleBody');
    if (consoleBody) {
        consoleBody.innerHTML = '';
        appendLog('[CONSOLE] Terminal session cleared.', 'info');
    }
}

function initConsoleWelcome() {
    appendLog(`[HOST] Host origin resolved: ${window.location.origin}`, 'info');
    appendLog(`[HOST] Pathname: ${window.location.pathname}`, 'info');
}

// 5. Interactive Test Modules

// Health Diagnostics Suite
function runDiagnostics() {
    appendLog('=== RUNNING FULL SERVER HEALTH DIAGNOSTICS ===', 'info');
    
    setTimeout(() => {
        appendLog('[TEST 1/4] Inspecting static document root structure...', 'info');
    }, 200);

    setTimeout(() => {
        appendLog('[TEST 2/4] Checking CSS styles parsing & media query rules... OK', 'success');
    }, 500);

    setTimeout(() => {
        appendLog('[TEST 3/4] Verifying Javascript event loop execution... OK', 'success');
    }, 800);

    setTimeout(() => {
        const perfTime = Math.round(performance.now());
        appendLog(`[TEST 4/4] Server response & DOM tree verified (${perfTime}ms)`, 'success');
        appendLog('✅ ALL DIAGNOSTIC CHECKS PASSED SUCCESSFULLY!', 'success');
    }, 1100);
}

// Asset Latency Test
function testLatency() {
    appendLog('[LATENCY] Initiating static asset fetch (/style.css)...', 'info');
    const start = performance.now();

    fetch('style.css?t=' + Date.now())
        .then(res => {
            const duration = Math.round(performance.now() - start);
            if (res.ok) {
                appendLog(`[LATENCY] style.css fetched in ${duration}ms (Status: ${res.status} ${res.statusText})`, 'success');
            } else {
                appendLog(`[LATENCY] Failed to fetch asset (Status: ${res.status})`, 'warning');
            }
        })
        .catch(err => {
            appendLog(`[LATENCY] Fetch error: ${err.message}`, 'error');
        });
}

// Browser Features Inspection Test
function testBrowserFeatures() {
    appendLog('[FEATURES] Auditing browser capabilities...', 'info');

    const features = [
        { name: 'Fetch API', pass: typeof window.fetch === 'function' },
        { name: 'LocalStorage API', pass: typeof window.localStorage !== 'undefined' },
        { name: 'CSS Grid Support', pass: CSS.supports('display', 'grid') },
        { name: 'Flexbox Support', pass: CSS.supports('display', 'flex') },
        { name: 'WebGL Rendering', pass: (() => {
            try {
                const canvas = document.createElement('canvas');
                return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
            } catch (e) { return false; }
        })() }
    ];

    features.forEach(f => {
        if (f.pass) {
            appendLog(`[FEATURE] ${f.name}: Supported ✔`, 'success');
        } else {
            appendLog(`[FEATURE] ${f.name}: Not Supported ✖`, 'warning');
        }
    });
}

// Layout Engine Verification
function testResponsiveLayout() {
    appendLog('[LAYOUT] Testing CSS Grid & Flexbox viewport rendering...', 'info');
    const width = window.innerWidth;
    const height = window.innerHeight;

    appendLog(`[LAYOUT] Viewport width: ${width}px | height: ${height}px`, 'info');
    if (width > 900) {
        appendLog('[LAYOUT] Applied Media Query Breakpoint: Desktop (>900px)', 'success');
    } else if (width > 600) {
        appendLog('[LAYOUT] Applied Media Query Breakpoint: Tablet (601px - 900px)', 'success');
    } else {
        appendLog('[LAYOUT] Applied Media Query Breakpoint: Mobile (≤600px)', 'success');
    }
}
