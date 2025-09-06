# Jal Sanjivani - Community Health Monitoring System with Data Processing

## 🏥 Project Overview

Jal Sanjivani is a comprehensive web-based health monitoring system designed to track and prevent water-borne diseases in rural Northeast India. The platform now includes advanced data processing capabilities, real-time analytics, and comprehensive reporting features.

## 🚀 Key Features

### 📊 Data Processing & Analytics
- **Real-time Dashboard**: Live updates of health risks and case statistics
- **Advanced Analytics**: Interactive charts and data visualization
- **Data Export**: CSV and JSON export capabilities
- **Bulk Data Upload**: CSV file processing for mass data entry
- **Real-time Notifications**: WebSocket-based alerts for new cases and water contamination

### 📝 Data Collection
- **Case Reporting**: Comprehensive form for disease case reporting
- **Water Quality Testing**: Detailed water quality data collection
- **Volunteer Registration**: Community volunteer management
- **Geographic Data**: Location tracking with latitude/longitude support

### 📈 Reporting & Visualization
- **Interactive Charts**: Case trends, water quality status, village-wise analysis
- **Export Options**: Multiple format support (CSV, JSON, PDF)
- **Data Preview**: Real-time data preview before export
- **Summary Reports**: Automated weekly and monthly reports

### 🔄 Real-time Features
- **Live Updates**: Real-time dashboard updates via WebSocket
- **Instant Notifications**: Browser notifications for critical alerts
- **Auto-refresh**: Automatic data refresh every 30 seconds
- **Status Monitoring**: Live risk level assessment

## 🛠️ Technical Architecture

### Backend (Node.js/Express)
- **RESTful API**: Comprehensive API endpoints for all data operations
- **SQLite Database**: Lightweight, file-based database for data storage
- **WebSocket Support**: Real-time communication with Socket.IO
- **File Upload**: CSV file processing with validation
- **Data Export**: Built-in CSV and JSON export functionality

### Frontend (HTML/CSS/JavaScript)
- **Responsive Design**: Mobile-first approach with modern UI
- **Interactive Charts**: Chart.js integration for data visualization
- **Real-time Updates**: WebSocket client for live data
- **Form Validation**: Client-side and server-side validation
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Database Schema
- **Cases Table**: Disease case reports with patient information
- **Water Quality Table**: Water testing results and contamination status
- **Volunteers Table**: Community volunteer information
- **Alerts Table**: System alerts and notifications

## 📁 File Structure

```
/workspace/
├── server.js              # Main server file with API endpoints
├── package.json           # Node.js dependencies and scripts
├── start.sh              # Startup script for easy deployment
├── index.html            # Main dashboard with real-time updates
├── data-forms.html       # Data input forms (cases, water quality, volunteers)
├── analytics.html        # Analytics dashboard with charts
├── reports.html          # Data export and reporting interface
├── style.css            # Main stylesheet
├── health_data.db       # SQLite database (created on first run)
├── uploads/             # Directory for CSV file uploads
└── README.md           # This documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation & Setup

1. **Clone or download the project files**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   ./start.sh
   ```
   Or manually:
   ```bash
   node server.js
   ```

4. **Access the application:**
   - Main Dashboard: http://localhost:3000
   - Data Input Forms: http://localhost:3000/data-forms.html
   - Analytics: http://localhost:3000/analytics.html
   - Reports: http://localhost:3000/reports.html

## 📊 API Endpoints

### Dashboard & Analytics
- `GET /api/dashboard` - Get dashboard overview data
- `GET /api/analytics/cases-trend` - Get case trend data
- `GET /api/analytics/water-quality-summary` - Get water quality summary

### Data Management
- `POST /api/cases` - Report a new case
- `GET /api/cases` - Get all cases (with filtering)
- `POST /api/water-quality` - Submit water quality data
- `GET /api/water-quality` - Get water quality data
- `POST /api/volunteers` - Register a volunteer
- `GET /api/volunteers` - Get volunteer list

### Data Export
- `GET /api/export/cases` - Export cases data (CSV/JSON)
- `GET /api/export/water-quality` - Export water quality data
- `POST /api/upload/csv` - Upload and process CSV files

### Alerts & Notifications
- `GET /api/alerts` - Get system alerts
- WebSocket events: `new_case`, `water_quality_update`

## 📝 Data Input Forms

### Case Reporting Form
- Village selection
- Case type (Cholera, Diarrhea, Typhoid, etc.)
- Severity level (Low, Moderate, High, Critical)
- Patient demographics (age, gender)
- Symptoms description
- Contact information
- Geographic coordinates (optional)

### Water Quality Form
- Village and water source
- pH level measurement
- Turbidity levels
- Bacteria count
- Chlorine levels
- Tester information
- Additional notes

### Volunteer Registration
- Personal information
- Contact details
- Village assignment
- Skills and interests

## 📈 Analytics & Visualization

### Interactive Charts
- **Cases Trend**: Line chart showing case progression over time
- **Case Types Distribution**: Doughnut chart of disease types
- **Water Quality Status**: Bar chart of safe vs contaminated sources
- **Village-wise Analysis**: Bar chart comparing villages

### Real-time Updates
- Live dashboard updates
- Instant notifications for new cases
- Water contamination alerts
- Risk level changes

## 📋 Data Export Features

### Export Formats
- **CSV**: For spreadsheet applications
- **JSON**: For data processing and APIs
- **PDF**: For official reports (planned)

### Export Options
- Date range filtering
- Village-specific exports
- Data type selection (cases, water quality, volunteers, alerts)
- Preview before download

### CSV Templates
- Pre-formatted templates for bulk upload
- Sample data for reference
- Field validation guidelines

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

### Database Configuration
- SQLite database file: `health_data.db`
- Automatic table creation on first run
- Data persistence across server restarts

## 🚨 Real-time Features

### WebSocket Events
- **new_case**: Triggered when a new case is reported
- **water_quality_update**: Triggered when water quality data is updated
- **alert_created**: Triggered when new alerts are generated

### Notification System
- Browser notifications for critical events
- Visual alerts on dashboard
- Sound notifications (configurable)

## 📱 Mobile Support

- Responsive design for mobile devices
- Touch-friendly interface
- Offline capability (basic functionality)
- Progressive Web App features

## 🔒 Security Features

- Input validation and sanitization
- SQL injection prevention
- File upload restrictions
- CORS configuration
- Error handling and logging

## 🚀 Deployment

### Local Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production Deployment
```bash
npm start    # Standard production start
```

### Docker Support (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## 📊 Sample Data

The system includes sample data for demonstration:
- Case reports from various villages
- Water quality test results
- Volunteer registrations
- Historical alerts

## 🔮 Future Enhancements

### Planned Features
- **Mobile App**: Native mobile application
- **SMS Integration**: SMS alerts for areas with limited internet
- **Multilingual Support**: Local language support
- **Advanced Analytics**: Machine learning for disease prediction
- **GIS Integration**: Interactive maps with case locations
- **PDF Report Generation**: Automated report creation
- **User Authentication**: Secure user management
- **Data Backup**: Automated backup system

### Integration Possibilities
- Government health department APIs
- Weather data integration
- Population census data
- Healthcare facility mapping

## 🆘 Support & Troubleshooting

### Common Issues
1. **Port already in use**: Change PORT environment variable
2. **Database errors**: Delete `health_data.db` to reset
3. **File upload issues**: Check `uploads/` directory permissions
4. **WebSocket connection**: Ensure firewall allows WebSocket connections

### Getting Help
- Check browser console for JavaScript errors
- Review server logs for backend issues
- Verify all dependencies are installed
- Ensure Node.js version compatibility

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 🙏 Acknowledgments

- Designed for rural communities in Northeast India
- Built with modern web technologies
- Focused on accessibility and usability
- Community-driven development approach

---

**Jal Sanjivani** - Empowering communities through technology to combat water-borne diseases and improve public health outcomes.

![Dashboard Preview](1st.png)
![Analytics Preview](2nd.png)
![Data Forms Preview](3rd.png)
![Reports Preview](4th.png)

*Developed with ❤️ for community health monitoring*