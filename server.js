const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Initialize SQLite database
const db = new sqlite3.Database('health_monitoring.db');

// Create tables
db.serialize(() => {
    // Cases table
    db.run(`CREATE TABLE IF NOT EXISTS cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        location TEXT,
        symptoms TEXT,
        disease_type TEXT,
        severity TEXT,
        status TEXT DEFAULT 'reported',
        reported_by TEXT,
        report_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        latitude REAL,
        longitude REAL
    )`);

    // Water quality table
    db.run(`CREATE TABLE IF NOT EXISTS water_quality (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT NOT NULL,
        ph_level REAL,
        turbidity REAL,
        chlorine_level REAL,
        bacteria_count INTEGER,
        quality_status TEXT,
        tested_by TEXT,
        test_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        latitude REAL,
        longitude REAL
    )`);

    // Alerts table
    db.run(`CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT,
        alert_type TEXT,
        severity TEXT,
        location TEXT,
        status TEXT DEFAULT 'active',
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Volunteers table
    db.run(`CREATE TABLE IF NOT EXISTS volunteers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        location TEXT,
        specialization TEXT,
        status TEXT DEFAULT 'active',
        joined_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert sample data
    db.run(`INSERT OR IGNORE INTO cases (patient_name, age, gender, location, symptoms, disease_type, severity, reported_by) 
            VALUES 
            ('John Doe', 25, 'Male', 'Palampur', 'Fever, Diarrhea', 'Cholera', 'Moderate', 'Dr. Smith'),
            ('Jane Smith', 30, 'Female', 'Dholakpur', 'Vomiting, Dehydration', 'Typhoid', 'High', 'Dr. Johnson'),
            ('Ram Kumar', 45, 'Male', 'Kuma Nagar', 'Stomach pain', 'Food poisoning', 'Low', 'Dr. Patel')`);

    db.run(`INSERT OR IGNORE INTO water_quality (location, ph_level, turbidity, chlorine_level, bacteria_count, quality_status, tested_by)
            VALUES 
            ('Palampur Well', 6.8, 2.5, 0.3, 150, 'Fair', 'Lab Technician A'),
            ('Dholakpur River', 5.2, 8.5, 0.1, 800, 'Poor', 'Lab Technician B'),
            ('Kuma Nagar Pump', 7.2, 1.2, 0.5, 50, 'Good', 'Lab Technician C')`);

    db.run(`INSERT OR IGNORE INTO alerts (title, message, alert_type, severity, location)
            VALUES 
            ('Water Contamination Alert', 'High bacteria levels detected in Dholakpur water source', 'Water Quality', 'High', 'Dholakpur'),
            ('Disease Outbreak Warning', 'Multiple cholera cases reported in Palampur area', 'Disease Outbreak', 'Moderate', 'Palampur')`);
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// API Routes

// Dashboard data endpoint
app.get('/api/dashboard', (req, res) => {
    const dashboardData = {};
    
    // Get total cases
    db.get("SELECT COUNT(*) as total_cases FROM cases", (err, caseCount) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        dashboardData.total_cases = caseCount.total_cases;
        
        // Get recent cases by location
        db.all(`SELECT location, COUNT(*) as count, severity 
                FROM cases 
                WHERE report_date >= date('now', '-7 days') 
                GROUP BY location`, (err, locationData) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            dashboardData.location_data = locationData;
            
            // Get water quality summary
            db.all(`SELECT location, quality_status, COUNT(*) as count 
                    FROM water_quality 
                    GROUP BY location, quality_status`, (err, waterData) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                dashboardData.water_quality = waterData;
                
                // Get active alerts
                db.all("SELECT * FROM alerts WHERE status = 'active' ORDER BY created_date DESC LIMIT 5", (err, alerts) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    dashboardData.alerts = alerts;
                    
                    res.json(dashboardData);
                });
            });
        });
    });
});

// Cases endpoints
app.get('/api/cases', (req, res) => {
    db.all("SELECT * FROM cases ORDER BY report_date DESC", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/cases', (req, res) => {
    const { patient_name, age, gender, location, symptoms, disease_type, severity, reported_by, latitude, longitude } = req.body;
    
    db.run(`INSERT INTO cases (patient_name, age, gender, location, symptoms, disease_type, severity, reported_by, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [patient_name, age, gender, location, symptoms, disease_type, severity, reported_by, latitude, longitude],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Emit real-time update
            io.emit('new_case', {
                id: this.lastID,
                patient_name,
                location,
                disease_type,
                severity
            });
            
            res.json({ id: this.lastID, message: 'Case reported successfully' });
        });
});

// Water quality endpoints
app.get('/api/water-quality', (req, res) => {
    db.all("SELECT * FROM water_quality ORDER BY test_date DESC", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/water-quality', (req, res) => {
    const { location, ph_level, turbidity, chlorine_level, bacteria_count, quality_status, tested_by, latitude, longitude } = req.body;
    
    db.run(`INSERT INTO water_quality (location, ph_level, turbidity, chlorine_level, bacteria_count, quality_status, tested_by, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [location, ph_level, turbidity, chlorine_level, bacteria_count, quality_status, tested_by, latitude, longitude],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Emit real-time update
            io.emit('water_quality_update', {
                id: this.lastID,
                location,
                quality_status,
                test_date: new Date()
            });
            
            res.json({ id: this.lastID, message: 'Water quality data recorded successfully' });
        });
});

// Alerts endpoints
app.get('/api/alerts', (req, res) => {
    db.all("SELECT * FROM alerts ORDER BY created_date DESC", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/alerts', (req, res) => {
    const { title, message, alert_type, severity, location } = req.body;
    
    db.run(`INSERT INTO alerts (title, message, alert_type, severity, location)
            VALUES (?, ?, ?, ?, ?)`,
        [title, message, alert_type, severity, location],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Emit real-time alert
            io.emit('new_alert', {
                id: this.lastID,
                title,
                message,
                severity,
                location
            });
            
            res.json({ id: this.lastID, message: 'Alert created successfully' });
        });
});

// Volunteers endpoints
app.get('/api/volunteers', (req, res) => {
    db.all("SELECT * FROM volunteers ORDER BY joined_date DESC", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/volunteers', (req, res) => {
    const { name, email, phone, location, specialization } = req.body;
    
    db.run(`INSERT INTO volunteers (name, email, phone, location, specialization)
            VALUES (?, ?, ?, ?, ?)`,
        [name, email, phone, location, specialization],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({ id: this.lastID, message: 'Volunteer registered successfully' });
        });
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
    const analytics = {};
    
    // Cases by month
    db.all(`SELECT strftime('%Y-%m', report_date) as month, COUNT(*) as count 
            FROM cases 
            GROUP BY strftime('%Y-%m', report_date) 
            ORDER BY month DESC LIMIT 12`, (err, monthlyData) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        analytics.monthly_cases = monthlyData;
        
        // Disease distribution
        db.all(`SELECT disease_type, COUNT(*) as count 
                FROM cases 
                GROUP BY disease_type 
                ORDER BY count DESC`, (err, diseaseData) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            analytics.disease_distribution = diseaseData;
            
            // Water quality trends
            db.all(`SELECT location, AVG(ph_level) as avg_ph, AVG(bacteria_count) as avg_bacteria 
                    FROM water_quality 
                    GROUP BY location`, (err, waterTrends) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                analytics.water_trends = waterTrends;
                
                res.json(analytics);
            });
        });
    });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({ 
        message: 'File uploaded successfully',
        filename: req.file.filename,
        path: req.file.path
    });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

server.listen(PORT, () => {
    console.log(`Jal Sanjivani server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
});