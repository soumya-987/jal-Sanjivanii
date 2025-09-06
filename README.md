# Jal Sanjivani - Community Health Monitoring System

## 🌊 Project Overview
Jal Sanjivani is a comprehensive web-based health monitoring system designed to track and prevent water-borne diseases in rural Northeast India. The platform provides real-time alerts, data processing capabilities, reporting tools, and educational resources for communities.

## ✨ Features

### Core Functionality
- **📊 Dashboard**: Real-time overview of health risks and alerts
- **📋 Case Reporting**: System for reporting and tracking suspected disease cases
- **💧 Water Quality Monitoring**: Tools for testing and reporting water quality issues
- **🚨 Alert System**: Color-coded risk level notifications with real-time updates
- **👥 Volunteer Program**: Community engagement and volunteer management
- **📱 Responsive Design**: Works seamlessly on mobile and desktop devices

### Data Processing Capabilities
- **🗄️ Database Integration**: SQLite database for storing and managing health data
- **📈 Analytics Dashboard**: Interactive charts and graphs for data visualization
- **🔄 Real-time Updates**: Socket.IO powered live notifications and updates
- **📊 Data Visualization**: Charts showing disease trends, water quality, and risk analysis
- **📋 Comprehensive Reports**: Detailed reporting on cases, water quality tests, and alerts

### Technical Features
- **REST API**: Full API endpoints for data processing
- **Real-time Communication**: WebSocket integration for live updates
- **File Upload**: Support for document and image uploads
- **Data Export**: Analytics and reporting capabilities
- **Mobile Responsive**: Optimized for all device sizes

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. **Clone or download the project**
   ```bash
   cd jal-sanjivani
   ```

2. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Start the application**
   ```bash
   # Production mode
   npm start
   
   # Development mode (with auto-reload)
   npm run dev
   ```

4. **Access the application**
   - Main Dashboard: http://localhost:3000
   - Analytics Dashboard: http://localhost:3000/analytics.html

## 📱 Application Structure

### Frontend
- **index.html**: Main dashboard interface
- **analytics.html**: Data visualization and analytics dashboard
- **style.css**: Comprehensive styling with mobile responsiveness
- **app.js**: Main application JavaScript with API integration
- **analytics.js**: Analytics dashboard functionality with Chart.js

### Backend
- **server.js**: Express.js server with REST API endpoints
- **SQLite Database**: Automatic database creation and management
- **Socket.IO**: Real-time communication layer

## 🔧 API Endpoints

### Health Cases
- `GET /api/cases` - Retrieve all cases
- `POST /api/cases` - Report new case

### Water Quality
- `GET /api/water-quality` - Get water quality data
- `POST /api/water-quality` - Submit water test results

### Alerts
- `GET /api/alerts` - Retrieve active alerts
- `POST /api/alerts` - Create new alert

### Analytics
- `GET /api/analytics` - Get analytical data
- `GET /api/dashboard` - Dashboard summary data

### Volunteers
- `GET /api/volunteers` - List volunteers
- `POST /api/volunteers` - Register new volunteer

## 📊 Data Processing Features

### Real-time Data Processing
- Automatic risk level calculation based on case reports
- Water quality assessment and status determination
- Alert generation based on thresholds and patterns
- Live dashboard updates without page refresh

### Analytics and Insights
- Monthly case trend analysis
- Disease distribution charts
- Water quality monitoring across locations
- Risk level distribution and mapping
- Automated insight generation

### Data Visualization
- Interactive charts using Chart.js
- Real-time data updates
- Mobile-optimized visualizations
- Export capabilities for reports

## 🛠️ Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Key configurations:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode
- `JWT_SECRET`: Security token secret

## 📱 Mobile Features
- Responsive design for all screen sizes
- Touch-friendly interface
- Mobile-optimized forms and navigation
- Offline capability for basic functions

## 🔒 Security Features
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Secure file upload handling

## 🌐 Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing
This system is designed for community health workers, volunteers, and health officials in rural Northeast India. Contributions that improve accessibility, add local language support, or enhance mobile functionality are especially welcome.

## 📞 Support
For technical support or questions about implementing this system:
- Create an issue in the project repository
- Contact the development team
- Check the documentation for troubleshooting

## 🎯 Impact
Designed specifically for rural communities in Northeast India to combat water-borne diseases through technology and community engagement. The system helps track disease patterns, monitor water quality, and coordinate community health responses.

---

**Built with ❤️ for community health monitoring**
![1st](1st.png)
![2nd](2nd.png)
![3rd](3rd.png)
![4th](4th.png)
Soumya Jain