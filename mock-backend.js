const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'mock-db.json');

// Initial Seed Data
const initialData = {
    users: [
        { id: 1, email: 'admin@example.com', password: 'password123', role: 'ADMIN', fullName: 'Admin', department: { id: 6, departmentName: 'IT' }, isActive: true },
        { id: 2, email: 'manager@example.com', password: 'password123', role: 'MANAGER', fullName: 'Manager', department: { id: 1, departmentName: 'Engineering' }, isActive: true },
        { id: 3, email: 'finance@example.com', password: 'password123', role: 'FINANCE', fullName: 'Finance', department: { id: 2, departmentName: 'Finance' }, isActive: true },
        { id: 4, email: 'po@example.com', password: 'password123', role: 'PROCUREMENT', fullName: 'Procurement', department: { id: 4, departmentName: 'Procurement' }, isActive: true },
        { id: 5, email: 'employee@example.com', password: 'password123', role: 'EMPLOYEE', fullName: 'Employee User', department: { id: 1, departmentName: 'Engineering' }, isActive: true },
        { id: 6, email: 'supplier@example.com', password: 'password123', role: 'SUPPLIER', fullName: 'Supplier User', department: { id: null, departmentName: 'External' }, isActive: true }
    ],
    departments: [
        { id: 1, departmentName: 'Engineering' },
        { id: 2, departmentName: 'Finance' },
        { id: 3, departmentName: 'Operations' },
        { id: 4, departmentName: 'Procurement' },
        { id: 5, departmentName: 'Human Resources' },
        { id: 6, departmentName: 'IT' },
        { id: 7, departmentName: 'Sales' }
    ],
    suppliers: [
        { id: 1, name: 'Tech Corp', contactPerson: 'John Doe', email: 'john@techcorp.com', phone: '1234567890', categories: [{categoryName: 'Hardware'}], status: 'ACTIVE', verified: true }
    ],
    products: [
        { id: 1, name: 'MacBook Pro', description: 'M3 Max 64GB', basePrice: 250000, category: {categoryName: 'Electronics'}, currentStock: 50, minimumStock: 10, isActive: true }
    ],
    requisitions: [
        { id: 1, requisitionNo: "REQ-001", title: "Office Laptops", employeeName: "Employee User", employeeEmail: "employee@example.com", departmentName: "Engineering", status: "PENDING_MANAGER_APPROVAL", totalEstimatedAmount: 125000, createdAt: new Date(Date.now() - 86400000).toISOString(), isDuplicate: false, description: "Laptops for eng" }
    ],
    purchaseOrders: [
        { id: 1, poNumber: "PO-001", requisitionNo: "REQ-004", supplierName: "Tech Corp", status: "IN_DELIVERY", totalAmount: 250000, expectedDeliveryDate: new Date(Date.now() + 172800000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() }
    ],
    notifications: [
        { id: 1, type: "NEW_REQUISITION", message: "New requisition REQ-001 requires your approval", isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString(), readAt: null, roles: ["MANAGER"] }
    ]
};

// Database Read/Write Utilities
function loadDb() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
    const rawData = fs.readFileSync(DB_FILE);
    return JSON.parse(rawData);
}

function saveDb(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Utility to get user email from mock token
function getUserEmail(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer mock-token-')) {
        return authHeader.replace('Bearer mock-token-', '');
    }
    return "employee@example.com";
}

// --- AUTH ROUTES ---
app.post('/auth/register', (req, res) => {
    const { email, password, role, fullName, departmentId } = req.body;
    const db = loadDb();
    
    if (db.users.find(u => u.email === email.toLowerCase())) {
        return res.status(400).json({ message: "An account with this email already exists." });
    }

    const dept = db.departments.find(d => d.id === parseInt(departmentId)) || { id: 6, departmentName: 'IT' };

    const newUser = {
        id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
        email: email.toLowerCase(),
        password,
        role,
        fullName: fullName || email.split('@')[0],
        department: dept,
        isActive: true
    };

    db.users.push(newUser);
    saveDb(db);

    setTimeout(() => {
        res.json({ data: { message: "User registered successfully", userId: newUser.id, accessToken: `mock-token-${newUser.email}`, refreshToken: "mock-refresh-token", role: newUser.role }});
    }, 500);
});

app.post('/auth/login', (req, res) => {
    setTimeout(() => {
        const db = loadDb();
        const email = req.body.email.toLowerCase();
        
        const user = db.users.find(u => u.email === email);
        if (user) {
            if (user.password !== req.body.password) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            if (user.isActive === false) return res.status(403).json({ message: "Your account is deactivated by admin" });
            
            return res.json({ data: { accessToken: `mock-token-${email}`, role: user.role }});
        }
        
        return res.status(401).json({ message: "Invalid credentials" });
    }, 500);
});

// --- BASIC ENTITY ROUTES ---
app.get('/depts', (req, res) => res.json({ data: loadDb().departments }));

// --- USERS ROUTES ---
app.get('/users', (req, res) => res.json({ data: loadDb().users }));
app.get('/users/role', (req, res) => res.json({ data: loadDb().users.filter(u => u.role !== 'ADMIN') }));
app.get('/users/:id', (req, res) => {
    const db = loadDb();
    const user = db.users.find(u => u.id === parseInt(req.params.id));
    res.json({ data: user || {} });
});
app.post('/users', (req, res) => {
    const db = loadDb();
    const newUser = { id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1, ...req.body, isActive: true };
    db.users.push(newUser);
    saveDb(db);
    res.json({ data: newUser });
});
app.put('/users/:id', (req, res) => {
    const db = loadDb();
    const id = parseInt(req.params.id);
    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
        db.users[userIndex] = { ...db.users[userIndex], ...req.body };
        saveDb(db);
        res.json({ data: db.users[userIndex] });
    } else {
        res.status(404).json({ message: "User not found" });
    }
});
app.delete('/users/:id', (req, res) => {
    const db = loadDb();
    db.users = db.users.filter(u => u.id !== parseInt(req.params.id));
    saveDb(db);
    res.json({ success: true });
});

// --- SUPPLIERS ROUTES ---
app.get('/suppliers', (req, res) => res.json({ data: loadDb().suppliers }));
app.get('/suppliers/me', (req, res) => res.json({ data: loadDb().suppliers[0] || {} }));
app.post('/suppliers', (req, res) => {
    const db = loadDb();
    const newSupplier = { id: db.suppliers.length > 0 ? Math.max(...db.suppliers.map(s => s.id)) + 1 : 1, ...req.body, status: 'ACTIVE', verified: false };
    db.suppliers.push(newSupplier);
    saveDb(db);
    res.json({ data: newSupplier });
});
app.put('/suppliers/me', (req, res) => res.json({ data: req.body }));
app.put('/suppliers/:id/activate', (req, res) => {
    const db = loadDb();
    const s = db.suppliers.find(s => s.id === parseInt(req.params.id));
    if (s) { s.status = 'ACTIVE'; saveDb(db); }
    res.json({ data: s || {} });
});
app.put('/suppliers/:id/deactivate', (req, res) => {
    const db = loadDb();
    const s = db.suppliers.find(s => s.id === parseInt(req.params.id));
    if (s) { s.status = 'INACTIVE'; saveDb(db); }
    res.json({ data: s || {} });
});
app.put('/suppliers/:id/verify', (req, res) => {
    const db = loadDb();
    const s = db.suppliers.find(s => s.id === parseInt(req.params.id));
    if (s) { s.verified = true; saveDb(db); }
    res.json({ data: s || {} });
});
app.delete('/suppliers/:id', (req, res) => {
    const db = loadDb();
    db.suppliers = db.suppliers.filter(s => s.id !== parseInt(req.params.id));
    saveDb(db);
    res.json({ success: true });
});

// --- PRODUCTS ROUTES ---
app.get('/products', (req, res) => res.json({ data: loadDb().products }));
app.get('/products/:id', (req, res) => res.json({ data: loadDb().products.find(p => p.id === parseInt(req.params.id)) || {} }));
app.post('/products', (req, res) => {
    const db = loadDb();
    const newProd = { id: db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1, ...req.body, isActive: true };
    db.products.push(newProd);
    saveDb(db);
    res.json({ data: newProd });
});
app.put('/products/:id', (req, res) => {
    const db = loadDb();
    const id = parseInt(req.params.id);
    const idx = db.products.findIndex(p => p.id === id);
    if (idx !== -1) {
        db.products[idx] = { ...db.products[idx], ...req.body };
        saveDb(db);
        res.json({ data: db.products[idx] });
    } else {
        res.status(404).json({ message: "Not found" });
    }
});
app.delete('/products/:id', (req, res) => {
    const db = loadDb();
    db.products = db.products.filter(p => p.id !== parseInt(req.params.id));
    saveDb(db);
    res.json({ success: true });
});

app.get('/product-categories', (req, res) => res.json({ data: [{id: 1, categoryName: "Electronics"}, {id: 2, categoryName: "Furniture"}] }));
app.post('/product-categories', (req, res) => res.json({ data: req.body }));

// --- REQUISITION ROUTES ---
app.get('/requisitions', (req, res) => {
    const db = loadDb();
    const status = req.query.status;
    let results = db.requisitions;
    if (status) results = results.filter(r => r.status === status);
    res.json({ data: results });
});
app.get('/requisitions/all', (req, res) => res.json({ data: loadDb().requisitions }));
app.get('/requisitions/mine', (req, res) => {
    const db = loadDb();
    const email = getUserEmail(req);
    res.json({ data: db.requisitions.filter(r => r.employeeEmail === email) });
});
app.get('/history/:id', (req, res) => res.json({ data: [] })); // mock history array

app.post('/requisitions', (req, res) => {
    const db = loadDb();
    const email = getUserEmail(req);
    const user = db.users.find(u => u.email === email);
    
    const newReq = {
        id: db.requisitions.length > 0 ? Math.max(...db.requisitions.map(r => r.id)) + 1 : 1,
        requisitionNo: `REQ-${Date.now().toString().slice(-4)}`,
        title: req.body.title || "New Requisition",
        employeeName: user ? user.fullName : "Employee",
        employeeEmail: email,
        departmentName: user ? user.department.departmentName : "IT",
        status: "PENDING_MANAGER_APPROVAL",
        totalEstimatedAmount: req.body.totalEstimatedAmount || 0,
        createdAt: new Date().toISOString(),
        isDuplicate: false,
        description: req.body.description || ""
    };
    
    db.requisitions.push(newReq);
    
    db.notifications.push({
        id: db.notifications.length > 0 ? Math.max(...db.notifications.map(n => n.id)) + 1 : 1,
        type: "NEW_REQUISITION",
        message: `New requisition ${newReq.requisitionNo} requires your approval`,
        isRead: false,
        createdAt: new Date().toISOString(),
        readAt: null,
        roles: ["MANAGER"]
    });
    
    saveDb(db);
    res.json({ data: newReq });
});

app.put('/requisitions/:id', (req, res) => {
    const db = loadDb();
    const email = getUserEmail(req);
    const requisition = db.requisitions.find(r => r.id === Number(req.params.id));
    if (!requisition) return res.status(404).json({ message: 'Requisition not found' });
    if (requisition.employeeEmail !== email) return res.status(403).json({ message: 'You can edit only your own requisitions' });
    if (requisition.status !== 'PENDING_MANAGER' && requisition.status !== 'PENDING_MANAGER_APPROVAL') {
        return res.status(400).json({ message: 'Requisitions can be edited only while awaiting manager approval' });
    }
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    requisition.title = req.body.title;
    requisition.description = req.body.description;
    requisition.priority = req.body.priority || requisition.priority || 'NORMAL';
    requisition.items = items;
    requisition.totalEstimatedAmount = items.reduce((total, item) => total + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
    requisition.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ data: requisition });
});

// --- APPROVAL ROUTES ---
app.get('/approvals/manager', (req, res) => {
    const db = loadDb();
    const status = req.query.status || "PENDING_MANAGER_APPROVAL";
    res.json({ data: db.requisitions.filter(r => r.status === status) });
});
app.get('/approvals/finance', (req, res) => {
    const db = loadDb();
    const status = req.query.status || "PENDING_FINANCE_APPROVAL";
    res.json({ data: db.requisitions.filter(r => r.status === status) });
});
app.get('/approvals/procurement', (req, res) => {
    const db = loadDb();
    const status = req.query.status || "APPROVED";
    res.json({ data: db.requisitions.filter(r => r.status === status) });
});

app.post('/requisitions/:id/manager-decision', (req, res) => {
    const db = loadDb();
    const reqId = parseInt(req.params.id);
    const { action } = req.body; 
    
    const requisition = db.requisitions.find(r => r.id === reqId);
    if (requisition) {
        if (action === "approve" || action === "APPROVE") {
            requisition.status = "PENDING_FINANCE_APPROVAL";
        } else {
            requisition.status = "REJECTED";
        }
        
        db.notifications.push({
            id: db.notifications.length + 1,
            type: action.toLowerCase() === "approve" ? "REQUISITION_APPROVED" : "REQUISITION_REJECTED",
            message: `Your requisition ${requisition.requisitionNo} was ${action.toLowerCase()}d by Manager`,
            isRead: false,
            createdAt: new Date().toISOString(),
            readAt: null,
            roles: ["EMPLOYEE"],
            email: requisition.employeeEmail
        });
        saveDb(db);
    }
    res.json({ data: requisition });
});

app.post('/requisitions/:id/finance-decision', (req, res) => {
    const db = loadDb();
    const reqId = parseInt(req.params.id);
    const { action } = req.body; 
    
    const requisition = db.requisitions.find(r => r.id === reqId);
    if (requisition) {
        if (action === "approve" || action === "APPROVE") {
            requisition.status = "APPROVED";
        } else {
            requisition.status = "REJECTED";
        }
        
        db.notifications.push({
            id: db.notifications.length + 1,
            type: action.toLowerCase() === "approve" ? "REQUISITION_APPROVED" : "REQUISITION_REJECTED",
            message: `Your requisition ${requisition.requisitionNo} was ${action.toLowerCase()}d by Finance`,
            isRead: false,
            createdAt: new Date().toISOString(),
            readAt: null,
            roles: ["EMPLOYEE"],
            email: requisition.employeeEmail
        });
        saveDb(db);
    }
    res.json({ data: requisition });
});

app.post('/requisitions/:id/procurement-decision', (req, res) => {
    const db = loadDb();
    const reqId = parseInt(req.params.id);
    const { action } = req.body; 
    
    const requisition = db.requisitions.find(r => r.id === reqId);
    if (requisition) {
        if (action === "approve" || action === "APPROVE") {
            requisition.status = "PO_GENERATED";
            const po = {
                id: db.purchaseOrders.length > 0 ? Math.max(...db.purchaseOrders.map(p => p.id)) + 1 : 1,
                poNumber: `PO-${Date.now().toString().slice(-4)}`,
                requisitionNo: requisition.requisitionNo,
                supplierName: "Tech Corp", 
                status: "GENERATED",
                totalAmount: requisition.totalEstimatedAmount,
                expectedDeliveryDate: new Date(Date.now() + 172800000).toISOString(),
                createdAt: new Date().toISOString()
            };
            db.purchaseOrders.push(po);
        } else {
            requisition.status = "REJECTED";
        }
        
        db.notifications.push({
            id: db.notifications.length + 1,
            type: action.toLowerCase() === "approve" ? "PO_GENERATED" : "REQUISITION_REJECTED",
            message: `Your requisition ${requisition.requisitionNo} was processed by Procurement`,
            isRead: false,
            createdAt: new Date().toISOString(),
            readAt: null,
            roles: ["EMPLOYEE"],
            email: requisition.employeeEmail
        });
        saveDb(db);
    }
    res.json({ data: requisition });
});

// --- PURCHASE ORDER ROUTES ---
app.get('/purchase-orders', (req, res) => res.json({ data: loadDb().purchaseOrders }));
app.get('/purchase-orders/supplier', (req, res) => res.json({ data: loadDb().purchaseOrders }));
app.get('/purchase-orders/status/supplier', (req, res) => res.json({ data: loadDb().purchaseOrders }));
app.get('/purchase-orders/:id/history', (req, res) => res.json({ data: [] }));
app.get('/purchase-orders/:id/requisition', (req, res) => res.json({ data: loadDb().requisitions[0] || {} }));

app.post('/purchase-orders', (req, res) => {
    const db = loadDb();
    const po = { id: db.purchaseOrders.length + 1, poNumber: `PO-${Date.now().toString().slice(-4)}`, ...req.body, status: "GENERATED", createdAt: new Date().toISOString() };
    db.purchaseOrders.push(po);
    saveDb(db);
    res.json({ data: po });
});

app.put('/purchase-orders/:id/status', (req, res) => {
    const db = loadDb();
    const po = db.purchaseOrders.find(p => p.id === parseInt(req.params.id));
    if (po) { po.status = req.body.status; saveDb(db); }
    res.json({ data: po || {} });
});

app.post('/purchase-orders/:id/invoice', (req, res) => res.json({ success: true }));
app.post('/purchase-orders/:id/send', (req, res) => res.json({ success: true }));


// --- NOTIFICATION ROUTES ---
app.get('/notifications', (req, res) => {
    const db = loadDb();
    const role = req.query.role;
    const email = getUserEmail(req);
    
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    const now = new Date();
    
    let filtered = db.notifications.filter(n => {
        if (!n.isRead || !n.readAt) return true;
        const readTime = new Date(n.readAt);
        return (now - readTime) < TWELVE_HOURS_MS;
    });
    
    if (role) filtered = filtered.filter(n => !n.roles || n.roles.includes(role));
    if (email) filtered = filtered.filter(n => !n.email || n.email === email);
    
    res.json({ data: filtered });
});

app.post('/notifications/:id/read', (req, res) => {
    const db = loadDb();
    const id = parseInt(req.params.id);
    const notif = db.notifications.find(n => n.id === id);
    if (notif) {
        notif.isRead = true;
        notif.readAt = new Date().toISOString();
        saveDb(db);
    }
    res.json({ success: true });
});

app.post('/notifications/read-all', (req, res) => {
    const db = loadDb();
    const now = new Date().toISOString();
    db.notifications.forEach(n => {
        if (!n.isRead) {
            n.isRead = true;
            n.readAt = now;
        }
    });
    saveDb(db);
    res.json({ success: true });
});

// --- SMART CATCH-ALL ---
app.use((req, res) => {
    const isSingleResource = req.path.match(/\/\d+$/) || req.path.includes('/me');
    if (req.method === 'GET') {
        res.json({ data: isSingleResource ? {} : [] });
    } else {
        res.json({ success: true, data: isSingleResource ? {} : [] });
    }
});

app.listen(8080, () => {
    console.log("Stateful mock backend running on https://smart-procurement-and-purchase-order.onrender.com");
});
