const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const http = require('http');
const socketIo = require('socket.io');
const moment = require('moment');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// Database setup
const db = new sqlite3.Database('health_data.db');

// Initialize database tables
db.serialize(() => {
  // Cases table
  db.run(`CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    village TEXT NOT NULL,
    case_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    symptoms TEXT,
    age INTEGER,
    gender TEXT,
    reported_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'reported',
    latitude REAL,
    longitude REAL,
    contact_info TEXT
  )`);

  // Water quality table
  db.run(`CREATE TABLE IF NOT EXISTS water_quality (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    village TEXT NOT NULL,
    water_source TEXT NOT NULL,
    ph_level REAL,
    turbidity REAL,
    bacteria_count INTEGER,
    chlorine_level REAL,
    test_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    tester_name TEXT,
    status TEXT DEFAULT 'tested',
    notes TEXT
  )`);

  // Volunteers table
  db.run(`CREATE TABLE IF NOT EXISTS volunteers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    village TEXT NOT NULL,
    skills TEXT,
    join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active'
  )`);

  // Alerts table
  db.run(`CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL,
    village TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active'
  )`);
});

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// API Routes

// Get dashboard data
app.get('/api/dashboard', (req, res) => {
  const dashboardData = {};
  
  // Get case statistics
  db.all("SELECT COUNT(*) as total_cases, village FROM cases WHERE reported_date >= date('now', '-7 days') GROUP BY village", (err, cases) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    dashboardData.recent_cases = cases;
    
    // Get water quality alerts
    db.all("SELECT COUNT(*) as total_alerts FROM water_quality WHERE status = 'contaminated' AND test_date >= date('now', '-7 days')", (err, waterAlerts) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      dashboardData.water_alerts = waterAlerts[0].total_alerts;
      
      // Get volunteer count
      db.get("SELECT COUNT(*) as volunteer_count FROM volunteers WHERE status = 'active'", (err, volunteers) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        dashboardData.volunteer_count = volunteers.volunteer_count;
        
        // Calculate risk level
        const totalRecentCases = cases.reduce((sum, c) => sum + c.total_cases, 0);
        let riskLevel = 'low';
        if (totalRecentCases > 10) riskLevel = 'high';
        else if (totalRecentCases > 5) riskLevel = 'moderate';
        
        dashboardData.risk_level = riskLevel;
        dashboardData.total_recent_cases = totalRecentCases;
        
        res.json(dashboardData);
      });
    });
  });
});

// Report a new case
app.post('/api/cases', (req, res) => {
  const { village, case_type, severity, symptoms, age, gender, latitude, longitude, contact_info } = req.body;
  
  db.run(
    "INSERT INTO cases (village, case_type, severity, symptoms, age, gender, latitude, longitude, contact_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [village, case_type, severity, symptoms, age, gender, latitude, longitude, contact_info],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Create alert if high severity
      if (severity === 'high') {
        db.run(
          "INSERT INTO alerts (type, message, severity, village) VALUES (?, ?, ?, ?)",
          ['case', `High severity ${case_type} case reported in ${village}`, 'high', village]
        );
      }
      
      // Emit real-time update
      io.emit('new_case', {
        id: this.lastID,
        village,
        case_type,
        severity,
        reported_date: new Date().toISOString()
      });
      
      res.json({ id: this.lastID, message: 'Case reported successfully' });
    }
  );
});

// Get all cases
app.get('/api/cases', (req, res) => {
  const { village, limit = 50, offset = 0 } = req.query;
  
  let query = "SELECT * FROM cases";
  let params = [];
  
  if (village) {
    query += " WHERE village = ?";
    params.push(village);
  }
  
  query += " ORDER BY reported_date DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Report water quality
app.post('/api/water-quality', (req, res) => {
  const { village, water_source, ph_level, turbidity, bacteria_count, chlorine_level, tester_name, notes } = req.body;
  
  // Determine status based on test results
  let status = 'safe';
  if (ph_level < 6.5 || ph_level > 8.5 || bacteria_count > 100 || chlorine_level < 0.2) {
    status = 'contaminated';
  }
  
  db.run(
    "INSERT INTO water_quality (village, water_source, ph_level, turbidity, bacteria_count, chlorine_level, tester_name, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [village, water_source, ph_level, turbidity, bacteria_count, chlorine_level, tester_name, notes, status],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Create alert if contaminated
      if (status === 'contaminated') {
        db.run(
          "INSERT INTO alerts (type, message, severity, village) VALUES (?, ?, ?, ?)",
          ['water', `Contaminated water detected in ${village} - ${water_source}`, 'high', village]
        );
      }
      
      // Emit real-time update
      io.emit('water_quality_update', {
        id: this.lastID,
        village,
        water_source,
        status,
        test_date: new Date().toISOString()
      });
      
      res.json({ id: this.lastID, message: 'Water quality data recorded successfully', status });
    }
  );
});

// Get water quality data
app.get('/api/water-quality', (req, res) => {
  const { village, limit = 50, offset = 0 } = req.query;
  
  let query = "SELECT * FROM water_quality";
  let params = [];
  
  if (village) {
    query += " WHERE village = ?";
    params.push(village);
  }
  
  query += " ORDER BY test_date DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Register volunteer
app.post('/api/volunteers', (req, res) => {
  const { name, email, phone, village, skills } = req.body;
  
  db.run(
    "INSERT INTO volunteers (name, email, phone, village, skills) VALUES (?, ?, ?, ?, ?)",
    [name, email, phone, village, skills],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({ id: this.lastID, message: 'Volunteer registered successfully' });
    }
  );
});

// Get volunteers
app.get('/api/volunteers', (req, res) => {
  const { village } = req.query;
  
  let query = "SELECT * FROM volunteers WHERE status = 'active'";
  let params = [];
  
  if (village) {
    query += " AND village = ?";
    params.push(village);
  }
  
  query += " ORDER BY join_date DESC";
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get alerts
app.get('/api/alerts', (req, res) => {
  const { status = 'active', limit = 20 } = req.query;
  
  db.all(
    "SELECT * FROM alerts WHERE status = ? ORDER BY created_date DESC LIMIT ?",
    [status, parseInt(limit)],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Export data as CSV
app.get('/api/export/cases', (req, res) => {
  const { format = 'csv', start_date, end_date } = req.query;
  
  let query = "SELECT * FROM cases";
  let params = [];
  
  if (start_date && end_date) {
    query += " WHERE reported_date BETWEEN ? AND ?";
    params.push(start_date, end_date);
  }
  
  query += " ORDER BY reported_date DESC";
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (format === 'csv') {
      const fields = ['id', 'village', 'case_type', 'severity', 'symptoms', 'age', 'gender', 'reported_date', 'status'];
      const parser = new Parser({ fields });
      const csv = parser.parse(rows);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=cases_export.csv');
      res.send(csv);
    } else {
      res.json(rows);
    }
  });
});

// Export water quality data
app.get('/api/export/water-quality', (req, res) => {
  const { format = 'csv', start_date, end_date } = req.query;
  
  let query = "SELECT * FROM water_quality";
  let params = [];
  
  if (start_date && end_date) {
    query += " WHERE test_date BETWEEN ? AND ?";
    params.push(start_date, end_date);
  }
  
  query += " ORDER BY test_date DESC";
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (format === 'csv') {
      const fields = ['id', 'village', 'water_source', 'ph_level', 'turbidity', 'bacteria_count', 'chlorine_level', 'test_date', 'tester_name', 'status'];
      const parser = new Parser({ fields });
      const csv = parser.parse(rows);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=water_quality_export.csv');
      res.send(csv);
    } else {
      res.json(rows);
    }
  });
});

// Upload and process CSV file
app.post('/api/upload/csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const results = [];
  const filePath = req.file.path;
  
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Process the CSV data based on file type
      const fileType = req.body.type; // 'cases' or 'water_quality'
      
      if (fileType === 'cases') {
        // Insert case data
        const stmt = db.prepare("INSERT INTO cases (village, case_type, severity, symptoms, age, gender, contact_info) VALUES (?, ?, ?, ?, ?, ?, ?)");
        
        results.forEach(row => {
          stmt.run([
            row.village,
            row.case_type || 'Unknown',
            row.severity || 'moderate',
            row.symptoms || '',
            row.age || null,
            row.gender || '',
            row.contact_info || ''
          ]);
        });
        
        stmt.finalize();
      } else if (fileType === 'water_quality') {
        // Insert water quality data
        const stmt = db.prepare("INSERT INTO water_quality (village, water_source, ph_level, turbidity, bacteria_count, chlorine_level, tester_name, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        
        results.forEach(row => {
          let status = 'safe';
          const ph = parseFloat(row.ph_level);
          const bacteria = parseInt(row.bacteria_count);
          const chlorine = parseFloat(row.chlorine_level);
          
          if (ph < 6.5 || ph > 8.5 || bacteria > 100 || chlorine < 0.2) {
            status = 'contaminated';
          }
          
          stmt.run([
            row.village,
            row.water_source || 'Unknown',
            ph || null,
            parseFloat(row.turbidity) || null,
            bacteria || null,
            chlorine || null,
            row.tester_name || '',
            row.notes || '',
            status
          ]);
        });
        
        stmt.finalize();
      }
      
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      
      res.json({ 
        message: `${results.length} records processed successfully`,
        records_processed: results.length
      });
    });
});

// Analytics endpoints
app.get('/api/analytics/cases-trend', (req, res) => {
  const { days = 30 } = req.query;
  
  db.all(`
    SELECT 
      DATE(reported_date) as date,
      COUNT(*) as case_count,
      village
    FROM cases 
    WHERE reported_date >= date('now', '-${days} days')
    GROUP BY DATE(reported_date), village
    ORDER BY date ASC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/analytics/water-quality-summary', (req, res) => {
  db.all(`
    SELECT 
      village,
      COUNT(*) as total_tests,
      SUM(CASE WHEN status = 'contaminated' THEN 1 ELSE 0 END) as contaminated_count,
      AVG(ph_level) as avg_ph,
      AVG(bacteria_count) as avg_bacteria
    FROM water_quality 
    WHERE test_date >= date('now', '-30 days')
    GROUP BY village
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Jal Sanjivani Data Processing Server running on port ${PORT}`);
  console.log(`Dashboard available at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});