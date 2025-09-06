# 🌊 How to Run Jal Sanjivani Website

## 📋 **Prerequisites**
- Node.js (v14 or higher) - [Download here](https://nodejs.org/)
- npm (comes with Node.js)

## 🚀 **Step 1: Setup (First Time Only)**
```bash
# Navigate to project folder
cd /workspace

# Make setup script executable
chmod +x setup.sh

# Run setup (installs dependencies)
./setup.sh
```

## 🌐 **Step 2: Start the Website**
```bash
# Option A: Production mode
npm start

# Option B: Development mode (auto-reload)
npm run dev

# Option C: Direct start
node server.js
```

## 🎯 **Step 3: Access Your Website**
Open your browser and visit:
- **Main Dashboard**: http://localhost:3000
- **Analytics Dashboard**: http://localhost:3000/analytics.html

## ✅ **You should see:**
- Jal Sanjivani health monitoring dashboard
- Interactive forms for case reporting
- Real-time risk assessments
- Water quality monitoring tools
- Analytics charts and graphs

## 🛑 **To Stop the Website**
Press `Ctrl + C` in the terminal

## 🔧 **Troubleshooting**
- **Port already in use**: Change PORT in `.env` file
- **Dependencies missing**: Run `npm install`
- **Permission denied**: Run `chmod +x setup.sh`

## 📱 **Features to Test**
1. Click "Report Now" - Submit a health case
2. Click "Check Water" - Submit water quality data
3. Click "Sign Up Now" - Register as volunteer
4. Visit `/analytics.html` - View data visualizations
5. Test on mobile - Responsive design

## 🎉 **Success!**
Your health monitoring system is now running with:
✅ Data processing capabilities
✅ Real-time updates
✅ Interactive analytics
✅ Mobile-responsive design