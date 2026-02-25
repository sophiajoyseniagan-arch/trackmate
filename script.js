// ========== STATE MANAGEMENT ==========
let requisitions = [
    { id: "REQ-101", item: "Bond Paper", qty: 10, status: "pending", requester: "Sarah Johnson", role: "student", date: "2024-01-15", received: false },
    { id: "REQ-102", item: "Ballpoint Pens", qty: 50, status: "approved", requester: "Mike Wilson", role: "staff", date: "2024-01-10", received: false },
    { id: "REQ-103", item: "Printer Ink", qty: 5, status: "pending", requester: "John Smith", role: "professor", date: "2024-01-16", received: false },
    { id: "REQ-104", item: "Folders", qty: 25, status: "rejected", requester: "Sarah Johnson", role: "student", date: "2024-01-12", received: false },
    { id: "REQ-105", item: "Stapler", qty: 3, status: "approved", requester: "Mike Wilson", role: "staff", date: "2024-01-14", received: false }
];

let inventory = [
    { id: 1, item: "Bond Paper", stock: 150, unit: "reams", status: "available", category: "materials" },
    { id: 2, item: "Printer Ink", stock: 25, unit: "cartridges", status: "available", category: "tools" },
    { id: 3, item: "Ballpoint Pens", stock: 200, unit: "pieces", status: "available", category: "materials" },
    { id: 4, item: "Stapler", stock: 8, unit: "pieces", status: "available", category: "tools" },
    { id: 5, item: "Folders", stock: 45, unit: "pieces", status: "low", category: "materials" },
    { id: 6, item: "Scissors", stock: 12, unit: "pieces", status: "available", category: "tools" },
    { id: 7, item: "Whiteboard Markers", stock: 30, unit: "pieces", status: "available", category: "tools" },
    { id: 8, item: "Envelopes", stock: 8, unit: "boxes", status: "low", category: "materials" }
];

let users = [
    { id: 1, name: "Admin User", role: "admin", email: "admin@trackmate.com", password: "admin123", idNumber: "ADMIN-001", verified: true },
    { id: 2, name: "John Smith", role: "professor", email: "john@trackmate.com", department: "Computer Science", idNumber: "P-2023-001", password: "prof123", verified: true },
    { id: 3, name: "Sarah Johnson", role: "student", email: "sarah@trackmate.com", courseYearSection: "BSIT 3-A", idNumber: "2023-001", password: "student123", verified: true },
    { id: 4, name: "Mike Wilson", role: "staff", email: "mike@trackmate.com", office: "Registrar's Office", idNumber: "S-2023-045", password: "staff123", verified: true }
];

let approvals = [
    { id: "REQ-101", requester: "Sarah Johnson", item: "Bond Paper", qty: 10, date: "2024-01-15" },
    { id: "REQ-103", requester: "John Smith", item: "Printer Ink", qty: 5, date: "2024-01-16" }
];

let auditLogs = [];
let currentUser = null;
let inactivityTimer;

// DOM Elements
const contentArea = document.getElementById("contentArea");
const pageTitle = document.getElementById("pageTitle");
const navItems = document.querySelectorAll(".nav-item");
const mobileNavItems = document.querySelectorAll(".mobile-nav-item");

// ========== INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", () => {
    loadFromLocalStorage();
    checkSession();
    setupInactivityTimer();
    setupMobileMenu();
    setupSearch();
    showLoginModal();
});

// ========== MOBILE MENU SETUP ==========
function setupMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const moreMenuBtn = document.getElementById('moreMenuBtn');
    const moreMenuModal = document.getElementById('moreMenuModal');
    
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    if (moreMenuBtn) {
        moreMenuBtn.addEventListener('click', () => {
            moreMenuModal.classList.add('active');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 900) {
            if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

function closeMoreMenu() {
    document.getElementById('moreMenuModal').classList.remove('active');
}

// ========== SESSION MANAGEMENT ==========
function checkSession() {
    const session = sessionStorage.getItem('trackmate_session');
    if (session) {
        const sessionData = JSON.parse(session);
        if (Date.now() > sessionData.expires) {
            sessionStorage.removeItem('trackmate_session');
            logout();
        } else {
            const user = users.find(u => u.id === sessionData.userId);
            if (user) {
                currentUser = user;
                updateUIForUserRole();
                navigateToPage('dashboard');
            }
        }
    }
}

function setupInactivityTimer() {
    const resetTimer = () => {
        clearTimeout(inactivityTimer);
        if (currentUser) {
            inactivityTimer = setTimeout(() => {
                showNotification('Logged out due to inactivity', 'info');
                logout();
            }, 1800000);
        }
    };
    document.addEventListener('mousemove', resetTimer);
    document.addEventListener('touchstart', resetTimer);
    document.addEventListener('keypress', resetTimer);
}

// ========== AUTHENTICATION ==========
function showLoginModal() {
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) existingModal.remove();
    
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #7c3aed; font-size: 28px;">TrackMate</h2>
                </div>
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button class="primary-btn" onclick="showLoginForm()" style="flex:1;" id="loginTabBtn">Login</button>
                    <button class="primary-btn" onclick="showSignupForm()" style="flex:1; background:#4b5563;" id="signupTabBtn">Sign Up</button>
                </div>
                
                <div id="loginForm">
                    <h3>🔐 Login</h3>
                    <input type="email" id="loginEmail" placeholder="Email" value="admin@trackmate.com">
                    <input type="password" id="loginPassword" placeholder="Password" value="admin123">
                    <a href="#" onclick="showForgotPasswordModal(); return false;" style="color:#7c3aed; font-size:14px; display:block; text-align:right; margin-bottom:15px;">Forgot Password?</a>
                    <div class="modal-buttons">
                        <button class="primary-btn" onclick="login()">Login</button>
                    </div>
                </div>
                
                <div id="signupForm" style="display:none;">
                    <h3>📝 Sign Up</h3>
                    <input type="text" id="signupName" placeholder="Full Name">
                    <input type="email" id="signupEmail" placeholder="Email">
                    <input type="text" id="signupIdNumber" placeholder="ID Number">
                    <select id="signupRole" onchange="updateSignupField()">
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="professor">Professor</option>
                    </select>
                    <input type="text" id="signupRoleSpecific" placeholder="Course-Year-Section">
                    <input type="password" id="signupPassword" placeholder="Password">
                    <input type="password" id="signupConfirmPassword" placeholder="Confirm Password">
                    <div class="modal-buttons">
                        <button class="primary-btn" onclick="signup()">Sign Up</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginTabBtn').style.background = '#7c3aed';
    document.getElementById('signupTabBtn').style.background = '#4b5563';
}

function showSignupForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('loginTabBtn').style.background = '#4b5563';
    document.getElementById('signupTabBtn').style.background = '#7c3aed';
}

function updateSignupField() {
    const role = document.getElementById('signupRole').value;
    const field = document.getElementById('signupRoleSpecific');
    if (role === 'student') field.placeholder = 'Course-Year-Section';
    else if (role === 'professor') field.placeholder = 'Department';
    else field.placeholder = 'Office';
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        sessionStorage.setItem('trackmate_session', JSON.stringify({
            userId: user.id,
            expires: Date.now() + 28800000
        }));
        closeModal();
        updateUIForUserRole();
        addAuditLog('LOGIN', user.name, 'User logged in');
        showNotification(`Welcome back, ${user.name}!`, 'success');
        navigateToPage('dashboard');
    } else {
        alert('Invalid credentials');
    }
}

function signup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const idNumber = document.getElementById('signupIdNumber').value;
    const role = document.getElementById('signupRole').value;
    const roleSpecific = document.getElementById('signupRoleSpecific').value;
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirmPassword').value;
    
    if (!name || !email || !password) {
        return alert('Please fill required fields');
    }
    
    if (password !== confirm) {
        return alert('Passwords do not match');
    }
    
    const newUser = {
        id: users.length + 1,
        name, email, password, role, idNumber,
        verified: true
    };
    
    if (role === 'student') newUser.courseYearSection = roleSpecific;
    else if (role === 'professor') newUser.department = roleSpecific;
    else newUser.office = roleSpecific;
    
    users.push(newUser);
    currentUser = newUser;
    
    sessionStorage.setItem('trackmate_session', JSON.stringify({
        userId: newUser.id,
        expires: Date.now() + 28800000
    }));
    
    closeModal();
    updateUIForUserRole();
    showNotification(`Welcome, ${newUser.name}!`, 'success');
    saveToLocalStorage();
    navigateToPage('dashboard');
}

function logout() {
    addAuditLog('LOGOUT', currentUser?.name, 'User logged out');
    currentUser = null;
    sessionStorage.removeItem('trackmate_session');
    clearTimeout(inactivityTimer);
    document.getElementById('logoutBtn')?.remove();
    closeMoreMenu();
    showLoginModal();
}

// ========== FORGOT PASSWORD ==========
function showForgotPasswordModal() {
    closeModal();
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>🔑 Reset Password</h3>
                <input type="email" id="resetEmail" placeholder="Email">
                <div class="modal-buttons">
                    <button class="primary-btn" onclick="sendResetCode()">Send Code</button>
                    <button class="primary-btn" style="background:#6b7280;" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function sendResetCode() {
    const email = document.getElementById('resetEmail').value;
    const user = users.find(u => u.email === email);
    
    if (!user) {
        return alert('Email not found');
    }
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem('trackmate_reset_' + email, JSON.stringify({ code, expires: Date.now() + 3600000 }));
    
    alert(`Reset code: ${code}`);
    closeModal();
    showResetCodeModal(email);
}

function showResetCodeModal(email) {
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>🔑 Enter Code</h3>
                <input type="text" id="resetCode" placeholder="6-digit code">
                <input type="password" id="newPassword" placeholder="New Password">
                <div class="modal-buttons">
                    <button class="primary-btn" onclick="resetPassword('${email}')">Reset</button>
                    <button class="primary-btn" style="background:#6b7280;" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function resetPassword(email) {
    const code = document.getElementById('resetCode').value;
    const newPass = document.getElementById('newPassword').value;
    const data = JSON.parse(localStorage.getItem('trackmate_reset_' + email));
    
    if (!data || Date.now() > data.expires) {
        return alert('Code expired');
    }
    
    if (code !== data.code) {
        return alert('Invalid code');
    }
    
    const user = users.find(u => u.email === email);
    if (user) {
        user.password = newPass;
        localStorage.removeItem('trackmate_reset_' + email);
        closeModal();
        showNotification('Password reset!', 'success');
        saveToLocalStorage();
        showLoginModal();
    }
}

// ========== DATA PERSISTENCE ==========
function saveToLocalStorage() {
    localStorage.setItem('trackmate_requisitions', JSON.stringify(requisitions));
    localStorage.setItem('trackmate_inventory', JSON.stringify(inventory));
    localStorage.setItem('trackmate_users', JSON.stringify(users));
    localStorage.setItem('trackmate_approvals', JSON.stringify(approvals));
    localStorage.setItem('trackmate_auditLogs', JSON.stringify(auditLogs));
}

function loadFromLocalStorage() {
    const saved = (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    };
    
    requisitions = saved('trackmate_requisitions') || requisitions;
    inventory = saved('trackmate_inventory') || inventory;
    users = saved('trackmate_users') || users;
    approvals = saved('trackmate_approvals') || approvals;
    auditLogs = saved('trackmate_auditLogs') || auditLogs;
}

// ========== UTILITIES ==========
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => notification.classList.remove('show'), 3000);
}

function closeModal() {
    document.querySelector('.modal-overlay')?.remove();
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function addAuditLog(action, user, details) {
    auditLogs.push({
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action, user: user || 'System', details
    });
    saveToLocalStorage();
}

// ========== SEARCH ==========
function setupSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            filterCurrentPage(term);
        });
    }
}

function filterCurrentPage(term) {
    const rows = document.querySelectorAll('table tbody tr');
    if (rows.length) {
        rows.forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
        });
    }
}

// ========== NAVIGATION ==========
function navigateToPage(page) {
    if (!currentUser && page !== 'login') {
        showLoginModal();
        return;
    }
    
    // Update active states
    navItems.forEach(nav => {
        nav.classList.remove("active");
        if (nav.dataset.page === page) nav.classList.add("active");
    });
    
    mobileNavItems.forEach(nav => {
        nav.classList.remove("active");
        if (nav.dataset.page === page) nav.classList.add("active");
    });
    
    pageTitle.textContent = document.querySelector('.nav-item.active')?.textContent || page;
    
    // Close mobile menu
    document.getElementById('sidebar')?.classList.remove('active');
    closeMoreMenu();
    
    const pages = {
        dashboard: loadDashboard,
        requisition: loadRequisition,
        inventory: loadInventory,
        approvals: loadApprovals,
        reports: loadReports,
        users: loadUsers,
        settings: loadSettings
    };
    
    if (pages[page]) pages[page]();
}

// Setup navigation
[...navItems, ...mobileNavItems].forEach(item => {
    item.addEventListener("click", (e) => {
        e.preventDefault();
        navigateToPage(item.dataset.page);
    });
});

// ========== UPDATE UI ==========
function updateUIForUserRole() {
    const userSpan = document.querySelector('.user');
    if (userSpan) {
        userSpan.innerHTML = `<i class="fas fa-user-circle"></i><span class="user-name">${currentUser ? currentUser.name : 'Login'}</span>`;
    }
    
    // Hide admin items for non-admin
    if (currentUser?.role !== 'admin') {
        navItems.forEach(item => {
            if (['approvals', 'users', 'settings'].includes(item.dataset.page)) {
                item.style.display = 'none';
            }
        });
        
        document.querySelectorAll('.mobile-nav-item[data-page="approvals"], .mobile-nav-item[data-page="users"], .mobile-nav-item[data-page="settings"]').forEach(item => {
            item.style.display = 'none';
        });
    }
}

// ========== USER PROFILE ==========
function showUserProfile() {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    closeMoreMenu();
    
    const userRequests = requisitions.filter(r => r.requester === currentUser.name);
    
    let info = '';
    if (currentUser.role === 'student') info = currentUser.courseYearSection || 'N/A';
    else if (currentUser.role === 'professor') info = currentUser.department || 'N/A';
    else if (currentUser.role === 'staff') info = currentUser.office || 'N/A';
    else info = 'Administrator';
    
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>👤 Profile</h3>
                <p><strong>Name:</strong> ${currentUser.name}</p>
                <p><strong>Role:</strong> <span class="user-type ${currentUser.role}">${capitalize(currentUser.role)}</span></p>
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>ID:</strong> ${currentUser.idNumber || 'N/A'}</p>
                <p><strong>${currentUser.role === 'student' ? 'Course' : 'Department/Office'}:</strong> ${info}</p>
                <hr style="border-color:#2a1f4a;margin:15px 0;">
                <p><strong>Total Requests:</strong> ${userRequests.length}</p>
                <div class="modal-buttons">
                    <button class="primary-btn" onclick="closeModal()">Close</button>
                    <button class="primary-btn" style="background:#ef4444;" onclick="logout()">Logout</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ========== DASHBOARD ==========
function loadDashboard() {
    if (!currentUser) return showLoginModal();
    
    const stats = {
        total: requisitions.length,
        pending: requisitions.filter(r => r.status === "pending").length,
        lowStock: inventory.filter(i => i.status === "low").length
    };
    
    const recentReqs = [...requisitions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    let html = `
        <div class="welcome-section">
            <h2>Welcome, ${currentUser.name}! 👋</h2>
            <p>TrackMate Dashboard</p>
        </div>
        
        <div class="metrics-row">
            <div class="metric-card" onclick="navigateToPage('requisition')">
                <div class="metric-icon">📋</div>
                <div class="metric-content">
                    <span class="metric-label">Total</span>
                    <span class="metric-value">${stats.total}</span>
                </div>
            </div>
            <div class="metric-card" onclick="navigateToPage('approvals')">
                <div class="metric-icon">⏳</div>
                <div class="metric-content">
                    <span class="metric-label">Pending</span>
                    <span class="metric-value">${stats.pending}</span>
                </div>
            </div>
            <div class="metric-card" onclick="navigateToPage('inventory')">
                <div class="metric-icon">📦</div>
                <div class="metric-content">
                    <span class="metric-label">Items</span>
                    <span class="metric-value">${inventory.length}</span>
                    ${stats.lowStock > 0 ? '<span class="metric-badge warning">' + stats.lowStock + ' low</span>' : ''}
                </div>
            </div>
            <div class="metric-card" onclick="navigateToPage('users')">
                <div class="metric-icon">👥</div>
                <div class="metric-content">
                    <span class="metric-label">Users</span>
                    <span class="metric-value">${users.length}</span>
                </div>
            </div>
        </div>
        
        <div class="quick-actions">
            <button class="action-chip" onclick="showNewRequisitionModal()"><span>➕</span> New Request</button>
            <button class="action-chip" onclick="navigateToPage('reports')"><span>📊</span> Reports</button>
            <button class="action-chip" onclick="showAdvancedSearch()"><span>🔍</span> Search</button>
    `;
    
    if (currentUser?.role === 'admin') {
        html += `<button class="action-chip" onclick="showBulkApproveModal()"><span>📑</span> Bulk (${approvals.length})</button>`;
    }
    
    html += `</div>
        
        <div class="charts-row">
            <div class="chart-box">
                <h4>Monthly</h4>
                <canvas id="monthlyChart"></canvas>
            </div>
            <div class="chart-box">
                <h4>By Role</h4>
                <canvas id="deptChart"></canvas>
            </div>
        </div>
        
        <div class="recent-activity">
            <div class="section-header">
                <h3>Recent</h3>
                <button class="view-all-btn" onclick="navigateToPage('requisition')">View All →</button>
            </div>
            <div class="table-responsive">
                <table class="compact-table">
                    <thead>
                        <tr><th>ID</th><th>Item</th><th>Qty</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                        ${recentReqs.map(req => `
                            <tr>
                                <td class="req-id">${req.id}</td>
                                <td>${req.item}</td>
                                <td>${req.qty}</td>
                                <td><span class="status-badge ${req.status}">${capitalize(req.status)}</span></td>
                                <td><button class="icon-btn" onclick="printRequisition('${req.id}')">🖨️</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    contentArea.innerHTML = html;
    setTimeout(createCharts, 200);
}

// ========== CHARTS ==========
function createCharts() {
    if (!document.getElementById('monthlyChart') || typeof Chart === 'undefined') return;
    
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthly = new Array(12).fill(0);
    requisitions.forEach(r => monthly[new Date(r.date).getMonth()]++);
    
    new Chart(document.getElementById('monthlyChart'), {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                data: monthly,
                borderColor: '#7c3aed',
                backgroundColor: 'rgba(124,58,237,0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
    
    const roles = { student: 0, staff: 0, professor: 0 };
    requisitions.forEach(r => roles[r.role]++);
    
    new Chart(document.getElementById('deptChart'), {
        type: 'doughnut',
        data: {
            labels: ['Student', 'Staff', 'Professor'],
            datasets: [{
                data: Object.values(roles),
                backgroundColor: ['#7c3aed', '#3b82f6', '#10b981']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#e5e7eb' } } }
        }
    });
}

// ========== REQUISITION ==========
function loadRequisition() {
    if (!currentUser) return showLoginModal();
    
    let html = `
        <section class="table-section">
            <div class="section-header">
                <h3>Requisitions</h3>
                ${currentUser?.role !== 'admin' ? '<button class="primary-btn" onclick="showNewRequisitionModal()">+ New</button>' : ''}
            </div>
            
            <div class="filter-buttons">
                <button class="filter-btn" onclick="filterTable('all')">All</button>
                <button class="filter-btn" onclick="filterTable('pending')">Pending</button>
                <button class="filter-btn" onclick="filterTable('approved')">Approved</button>
                <button class="filter-btn" onclick="filterTable('rejected')">Rejected</button>
            </div>
            
            <div class="table-responsive">
                <table class="full-table" id="dataTable">
                    <thead><tr><th>ID</th><th>Item</th><th>Qty</th><th>Requester</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${requisitions.map(r => `
                            <tr data-status="${r.status}">
                                <td>${r.id}</td>
                                <td>${r.item}</td>
                                <td>${r.qty}</td>
                                <td>${r.requester}</td>
                                <td><span class="status-badge ${r.status}">${capitalize(r.status)}</span></td>
                                <td>
                                    ${r.status === 'pending' && (currentUser?.name === r.requester || currentUser?.role === 'admin') ? 
                                        `<button class="action-btn delete" onclick="deleteRequisition('${r.id}')">Delete</button>` : ''}
                                    <button class="icon-btn" onclick="printRequisition('${r.id}')">🖨️</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </section>
    `;
    contentArea.innerHTML = html;
}

function filterTable(status) {
    document.querySelectorAll('#dataTable tbody tr').forEach(row => {
        row.style.display = (status === 'all' || row.dataset.status === status) ? '' : 'none';
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === status);
    });
}

function showNewRequisitionModal() {
    if (!currentUser || currentUser.role === 'admin') {
        return showNotification('Only students, staff, and professors can request', 'error');
    }
    
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>New Request</h3>
                <select id="reqItem">
                    <option value="">Select Item</option>
                    ${inventory.map(i => `<option value="${i.item}" data-stock="${i.stock}">${i.item} (${i.stock} ${i.unit})</option>`).join('')}
                </select>
                <input type="number" id="reqQty" placeholder="Quantity" min="1">
                <div class="modal-buttons">
                    <button class="primary-btn" onclick="addRequisition()">Submit</button>
                    <button class="primary-btn" style="background:#6b7280;" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function addRequisition() {
    const select = document.getElementById('reqItem');
    const item = select.value;
    const stock = parseInt(select.options[select.selectedIndex]?.dataset.stock || 0);
    const qty = parseInt(document.getElementById('reqQty').value);
    
    if (!item || !qty) return alert('Fill all fields');
    if (qty > stock) return alert(`Only ${stock} available`);
    
    const newReq = {
        id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
        item, qty, status: 'pending',
        requester: currentUser.name,
        role: currentUser.role,
        date: new Date().toISOString().split('T')[0],
        received: false
    };
    
    requisitions.push(newReq);
    approvals.push({ id: newReq.id, requester: currentUser.name, item, qty, date: newReq.date });
    
    closeModal();
    showNotification('Request submitted!', 'success');
    saveToLocalStorage();
    loadRequisition();
}

function deleteRequisition(id) {
    if (confirm('Delete this request?')) {
        requisitions = requisitions.filter(r => r.id !== id);
        approvals = approvals.filter(a => a.id !== id);
        showNotification('Deleted', 'success');
        saveToLocalStorage();
        loadRequisition();
    }
}

// ========== INVENTORY ==========
function loadInventory() {
    if (!currentUser) return showLoginModal();
    
    let html = `
        <section class="table-section">
            <div class="section-header">
                <h3>Inventory</h3>
                ${currentUser?.role === 'admin' ? '<button class="primary-btn" onclick="showAddInventoryModal()">+ Add</button>' : ''}
            </div>
            
            <div class="filter-buttons">
                <button class="filter-btn" onclick="filterInventory('all')">All</button>
                <button class="filter-btn" onclick="filterInventory('materials')">Materials</button>
                <button class="filter-btn" onclick="filterInventory('tools')">Tools</button>
                <button class="filter-btn" onclick="filterInventory('low')">Low Stock</button>
            </div>
            
            <div class="table-responsive">
                <table class="full-table" id="inventoryTable">
                    <thead><tr><th>Item</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${inventory.map(i => `
                            <tr data-category="${i.category}" data-status="${i.status}">
                                <td>${i.item}</td>
                                <td>${i.stock} ${i.unit}</td>
                                <td><span class="status-badge ${i.status === 'available' ? 'approved' : 'low'}">${capitalize(i.status)}</span></td>
                                <td>
                                    ${currentUser?.role === 'admin' ? 
                                        `<button class="action-btn edit" onclick="editInventoryItem(${i.id})">Edit</button>
                                         <button class="action-btn delete" onclick="deleteInventoryItem(${i.id})">Delete</button>` : 
                                        `<button class="action-btn approve" onclick="showQuickRequest('${i.item}', ${i.stock})">Request</button>`}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </section>
    `;
    contentArea.innerHTML = html;
}

function filterInventory(filter) {
    document.querySelectorAll('#inventoryTable tbody tr').forEach(row => {
        if (filter === 'all') row.style.display = '';
        else if (filter === 'low') row.style.display = row.dataset.status === 'low' ? '' : 'none';
        else row.style.display = row.dataset.category === filter ? '' : 'none';
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === filter);
    });
}

function showAddInventoryModal() {
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>Add Item</h3>
                <input type="text" id="itemName" placeholder="Item Name">
                <select id="itemCategory"><option value="materials">Material</option><option value="tools">Tool</option></select>
                <input type="number" id="itemStock" placeholder="Stock" min="0">
                <select id="itemUnit"><option value="pieces">Pieces</option><option value="reams">Reams</option><option value="boxes">Boxes</option></select>
                <div class="modal-buttons">
                    <button class="primary-btn" onclick="addInventoryItem()">Add</button>
                    <button class="primary-btn" style="background:#6b7280;" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function addInventoryItem() {
    const name = document.getElementById('itemName').value;
    const category = document.getElementById('itemCategory').value;
    const stock = parseInt(document.getElementById('itemStock').value);
    const unit = document.getElementById('itemUnit').value;
    
    if (name && stock >= 0) {
        inventory.push({
            id: inventory.length + 1,
            item: name, stock, unit,
            status: stock > 10 ? 'available' : 'low',
            category
        });
        closeModal();
        showNotification('Item added!', 'success');
        saveToLocalStorage();
        loadInventory();
    }
}

function editInventoryItem(id) {
    const item = inventory.find(i => i.id === id);
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>Edit Item</h3>
                <input type="text" id="editName" value="${item.item}">
                <input type="number" id="editStock" value="${item.stock}" min="0">
                <select id="editUnit">
                    <option value="pieces" ${item.unit === 'pieces' ? 'selected' : ''}>Pieces</option>
                    <option value="reams" ${item.unit === 'reams' ? 'selected' : ''}>Reams</option>
                    <option value="boxes" ${item.unit === 'boxes' ? 'selected' : ''}>Boxes</option>
                </select>
                <div class="modal-buttons">
                    <button class="primary-btn" onclick="updateInventoryItem(${id})">Update</button>
                    <button class="primary-btn" style="background:#6b7280;" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function updateInventoryItem(id) {
    const item = inventory.find(i => i.id === id);
    item.item = document.getElementById('editName').value;
    item.stock = parseInt(document.getElementById('editStock').value);
    item.unit = document.getElementById('editUnit').value;
    item.status = item.stock > 10 ? 'available' : 'low';
    closeModal();
    showNotification('Updated!', 'success');
    saveToLocalStorage();
    loadInventory();
}

function deleteInventoryItem(id) {
    if (confirm('Delete this item?')) {
        inventory = inventory.filter(i => i.id !== id);
        showNotification('Deleted', 'success');
        saveToLocalStorage();
        loadInventory();
    }
}

function showQuickRequest(item, maxStock) {
    if (!currentUser || currentUser.role === 'admin') {
        return showNotification('Cannot request', 'error');
    }
    
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>Request ${item}</h3>
                <p>Available: ${maxStock}</p>
                <input type="number" id="quickQty" placeholder="Quantity" min="1" max="${maxStock}" value="1">
                <div class="modal-buttons">
                    <button class="primary-btn" onclick="submitQuickRequest('${item}', ${maxStock})">Submit</button>
                    <button class="primary-btn" style="background:#6b7280;" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function submitQuickRequest(item, max) {
    const qty = parseInt(document.getElementById('quickQty').value);
    if (!qty || qty > max) return alert(`Max: ${max}`);
    
    const newReq = {
        id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
        item, qty, status: 'pending',
        requester: currentUser.name,
        role: currentUser.role,
        date: new Date().toISOString().split('T')[0],
        received: false
    };
    
    requisitions.push(newReq);
    approvals.push({ id: newReq.id, requester: currentUser.name, item, qty, date: newReq.date });
    
    closeModal();
    showNotification('Request submitted!', 'success');
    saveToLocalStorage();
    loadInventory();
}

// ========== APPROVALS ==========
function loadApprovals() {
    if (currentUser?.role !== 'admin') return navigateToPage('dashboard');
    
    const html = `
        <section class="table-section">
            <div class="section-header">
                <h3>Pending Approvals</h3>
                <span class="status-badge pending">${approvals.length}</span>
            </div>
            
            ${approvals.length ? `
                <div class="table-responsive">
                    <table class="full-table">
                        <thead><tr><th>ID</th><th>Item</th><th>Qty</th><th>Requester</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${approvals.map(a => `
                                <tr>
                                    <td>${a.id}</td>
                                    <td>${a.item}</td>
                                    <td>${a.qty}</td>
                                    <td>${a.requester}</td>
                                    <td>
                                        <button class="action-btn approve" onclick="approveRequest('${a.id}')">✓</button>
                                        <button class="action-btn reject" onclick="rejectRequest('${a.id}')">✗</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p style="padding:20px;text-align:center;">No pending approvals</p>'}
        </section>
    `;
    contentArea.innerHTML = html;
}

function approveRequest(id) {
    const req = requisitions.find(r => r.id === id);
    if (req) req.status = 'approved';
    approvals = approvals.filter(a => a.id !== id);
    showNotification(`Request approved`, 'success');
    saveToLocalStorage();
    loadApprovals();
}

function rejectRequest(id) {
    const req = requisitions.find(r => r.id === id);
    if (req) req.status = 'rejected';
    approvals = approvals.filter(a => a.id !== id);
    showNotification(`Request rejected`, 'info');
    saveToLocalStorage();
    loadApprovals();
}

function showBulkApproveModal() {
    const pending = requisitions.filter(r => r.status === 'pending');
    if (!pending.length) return showNotification('No pending requests', 'info');
    
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>Bulk Approve</h3>
                <div style="max-height:300px;overflow-y:auto;">
                    ${pending.map(r => `
                        <div style="margin:8px 0;"><input type="checkbox" class="bulk-check" value="${r.id}"> ${r.id} - ${r.item}</div>
                    `).join('')}
                </div>
                <div class="modal-buttons">
                    <button class="primary-btn" onclick="bulkApprove()">Approve</button>
                    <button class="primary-btn" style="background:#6b7280;" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function bulkApprove() {
    document.querySelectorAll('.bulk-check:checked').forEach(cb => {
        const id = cb.value;
        const req = requisitions.find(r => r.id === id);
        if (req) req.status = 'approved';
        approvals = approvals.filter(a => a.id !== id);
    });
    closeModal();
    showNotification('Approved selected', 'success');
    saveToLocalStorage();
    loadApprovals();
}

// ========== REPORTS ==========
function loadReports() {
    const approved = requisitions.filter(r => r.status === 'approved').length;
    const rate = requisitions.length ? Math.round((approved / requisitions.length) * 100) : 0;
    
    contentArea.innerHTML = `
        <section class="table-section">
            <h3>Reports</h3>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;">
                <div class="metric-card" style="cursor:default;">
                    <div class="metric-icon">📊</div>
                    <div><span class="metric-label">Total</span><span class="metric-value">${requisitions.length}</span></div>
                </div>
                <div class="metric-card" style="cursor:default;">
                    <div class="metric-icon">✅</div>
                    <div><span class="metric-label">Rate</span><span class="metric-value">${rate}%</span></div>
                </div>
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
                <div class="report-card" onclick="showReport('inventory')">
                    <h4>📊 Inventory</h4>
                </div>
                <div class="report-card" onclick="showReport('requisition')">
                    <h4>📝 Requests</h4>
                </div>
                <div class="report-card" onclick="showReport('usage')">
                    <h4>📈 Usage</h4>
                </div>
            </div>
        </section>
    `;
}

function showReport(type) {
    if (type === 'inventory') {
        alert(`Total Items: ${inventory.length}\nLow Stock: ${inventory.filter(i => i.status === 'low').length}`);
    } else if (type === 'requisition') {
        alert(`Total: ${requisitions.length}\nPending: ${requisitions.filter(r => r.status === 'pending').length}\nApproved: ${requisitions.filter(r => r.status === 'approved').length}`);
    } else {
        alert(`Items Received: ${requisitions.filter(r => r.received).length}`);
    }
}

// ========== USERS ==========
function loadUsers() {
    if (currentUser?.role !== 'admin') return navigateToPage('dashboard');
    
    contentArea.innerHTML = `
        <section class="table-section">
            <div class="section-header">
                <h3>Users</h3>
                <button class="primary-btn" onclick="showAddUserModal()">+ Add</button>
            </div>
            <div class="table-responsive">
                <table class="full-table">
                    <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td>${u.name}</td>
                                <td><span class="user-type ${u.role}">${capitalize(u.role)}</span></td>
                                <td>${u.email}</td>
                                <td>${u.role !== 'admin' ? `<button class="action-btn delete" onclick="deleteUser(${u.id})">Delete</button>` : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

function showAddUserModal() {
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>Add User</h3>
                <input type="text" id="userName" placeholder="Name">
                <input type="email" id="userEmail" placeholder="Email">
                <select id="userRole"><option value="student">Student</option><option value="staff">Staff</option><option value="professor">Professor</option></select>
                <input type="text" id="userField" placeholder="Course/Dept/Office">
                <div class="modal-buttons">
                    <button class="primary-btn" onclick="addUser()">Add</button>
                    <button class="primary-btn" style="background:#6b7280;" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function addUser() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const role = document.getElementById('userRole').value;
    const field = document.getElementById('userField').value;
    
    if (!name || !email) return alert('Name and email required');
    
    const newUser = {
        id: users.length + 1,
        name, email, role,
        password: 'password123',
        verified: true
    };
    
    if (role === 'student') newUser.courseYearSection = field;
    else if (role === 'professor') newUser.department = field;
    else newUser.office = field;
    
    users.push(newUser);
    closeModal();
    showNotification('User added', 'success');
    saveToLocalStorage();
    loadUsers();
}

function deleteUser(id) {
    const user = users.find(u => u.id === id);
    if (user.role === 'admin') return showNotification('Cannot delete admin', 'error');
    if (confirm(`Delete ${user.name}?`)) {
        users = users.filter(u => u.id !== id);
        showNotification('Deleted', 'success');
        saveToLocalStorage();
        loadUsers();
    }
}

// ========== SETTINGS ==========
function loadSettings() {
    if (currentUser?.role !== 'admin') return navigateToPage('dashboard');
    
    contentArea.innerHTML = `
        <section class="table-section">
            <h3>Settings</h3>
            <div class="settings-card">
                <h4>Data</h4>
                <button class="primary-btn" onclick="backupData()">💾 Backup</button>
                <button class="primary-btn" onclick="restoreData()" style="margin-left:10px;">🔄 Restore</button>
            </div>
        </section>
    `;
}

// ========== BACKUP ==========
function backupData() {
    const data = { requisitions, inventory, users, approvals, auditLogs };
    const link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
    link.download = `trackmate_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showNotification('Backup created', 'success');
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (confirm('Restore data?')) {
                    if (data.requisitions) requisitions = data.requisitions;
                    if (data.inventory) inventory = data.inventory;
                    if (data.users) users = data.users;
                    if (data.approvals) approvals = data.approvals;
                    if (data.auditLogs) auditLogs = data.auditLogs;
                    saveToLocalStorage();
                    showNotification('Restored!', 'success');
                    navigateToPage('dashboard');
                }
            } catch {
                showNotification('Invalid file', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ========== ADVANCED SEARCH ==========
function showAdvancedSearch() {
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>Search</h3>
                <input type="text" id="searchItem" placeholder="Item">
                <select id="searchStatus"><option value="">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
                <div class="modal-buttons">
                    <button class="primary-btn" onclick="performAdvancedSearch()">Search</button>
                    <button class="primary-btn" style="background:#6b7280;" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function performAdvancedSearch() {
    const item = document.getElementById('searchItem').value.toLowerCase();
    const status = document.getElementById('searchStatus').value;
    
    const results = requisitions.filter(r => 
        (!item || r.item.toLowerCase().includes(item)) &&
        (!status || r.status === status)
    );
    
    closeModal();
    showSearchResults(results);
}

function showSearchResults(results) {
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>Results (${results.length})</h3>
                <div style="max-height:300px;overflow-y:auto;">
                    ${results.length ? results.map(r => `
                        <div style="padding:8px;border-bottom:1px solid #2a1f4a;">
                            <strong>${r.id}</strong> - ${r.item} (${r.qty}) - <span class="status-badge ${r.status}">${r.status}</span>
                        </div>
                    `).join('') : '<p>No results</p>'}
                </div>
                <div class="modal-buttons"><button class="primary-btn" onclick="closeModal()">Close</button></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ========== PRINT ==========
function printRequisition(id) {
    const req = requisitions.find(r => r.id === id);
    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>Requisition ${id}</title><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>body{font-family:Arial;padding:20px;}</style></head>
        <body><h1>TrackMate</h1><h2>Requisition ${id}</h2>
        <p><strong>Item:</strong> ${req.item}</p>
        <p><strong>Quantity:</strong> ${req.qty}</p>
        <p><strong>Requester:</strong> ${req.requester}</p>
        <p><strong>Date:</strong> ${req.date}</p>
        <p><strong>Status:</strong> ${req.status}</p>
        </body></html>
    `);
    win.document.close();
    win.print();
}