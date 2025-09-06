// Jal Sanjivani Frontend Application
class HealthMonitoringApp {
    constructor() {
        this.apiBase = window.location.origin;
        this.socket = io();
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupSocketListeners();
        await this.loadDashboardData();
        this.setupRealTimeUpdates();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target.textContent.trim());
            });
        });

        // Quick action buttons
        document.querySelectorAll('.nbt').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleQuickAction(e.target.textContent.trim());
            });
        });

        // Risk level button
        const viewDetailsBtn = document.querySelector('.risk button');
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', () => this.showCaseDetails());
        }

        // Volunteer signup button
        const volunteerBtn = document.querySelector('.volunteer-btn');
        if (volunteerBtn) {
            volunteerBtn.addEventListener('click', () => this.showVolunteerForm());
        }

        // Village risk buttons
        document.querySelectorAll('.b1, .b2, .b3').forEach(button => {
            button.addEventListener('click', (e) => {
                this.showVillageDetails(e.target.textContent.trim());
            });
        });
    }

    setupSocketListeners() {
        this.socket.on('new_case', (data) => {
            this.handleNewCase(data);
        });

        this.socket.on('water_quality_update', (data) => {
            this.handleWaterQualityUpdate(data);
        });

        this.socket.on('new_alert', (data) => {
            this.handleNewAlert(data);
        });
    }

    async loadDashboardData() {
        try {
            const response = await fetch(`${this.apiBase}/api/dashboard`);
            const data = await response.json();
            this.updateDashboard(data);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateDashboard(data) {
        // Update risk level based on recent cases
        this.updateRiskLevel(data.location_data);
        
        // Update statistics
        this.updateStatistics(data);
        
        // Update village risk levels
        this.updateVillageRisks(data.location_data);
    }

    updateRiskLevel(locationData) {
        const riskElement = document.querySelector('.risk');
        const totalCases = locationData.reduce((sum, location) => sum + location.count, 0);
        
        let riskLevel = 'Low Risk';
        let riskColor = '#4caf50';
        let riskIcon = '✅';
        
        if (totalCases > 10) {
            riskLevel = 'High Risk';
            riskColor = '#f44336';
            riskIcon = '🚨';
        } else if (totalCases > 5) {
            riskLevel = 'Moderate Risk';
            riskColor = '#ff8c00';
            riskIcon = '⚠️';
        }
        
        if (riskElement) {
            riskElement.style.background = `linear-gradient(135deg, ${riskColor} 0%, ${riskColor}aa 100%)`;
            riskElement.querySelector('.icon').textContent = riskIcon;
            riskElement.querySelector('h3').textContent = riskLevel;
            riskElement.querySelector('p').textContent = `${totalCases} cases reported in your area this week`;
        }
    }

    updateStatistics(data) {
        const stats = document.querySelectorAll('.stat h3');
        if (stats.length >= 4) {
            stats[0].textContent = `${data.total_cases}+`;
            // Water points and volunteers would come from additional API calls
            // For now, keeping the existing static values
        }
    }

    updateVillageRisks(locationData) {
        const buttons = document.querySelectorAll('.b1, .b2, .b3');
        const villages = ['Palampur', 'Dholakpur', 'Kuma Nagar'];
        
        buttons.forEach((button, index) => {
            const village = villages[index];
            const villageData = locationData.find(loc => loc.location.includes(village));
            const caseCount = villageData ? villageData.count : 0;
            
            let riskLevel = 'no risk';
            let riskClass = 'b3';
            
            if (caseCount > 3) {
                riskLevel = 'high risk';
                riskClass = 'b2';
                button.style.backgroundColor = '#ffebee';
                button.style.borderColor = '#f44336';
            } else if (caseCount > 1) {
                riskLevel = 'moderate risk';
                riskClass = 'b1';
                button.style.backgroundColor = '#fff3e0';
                button.style.borderColor = '#ff8c00';
            } else {
                button.style.backgroundColor = '#e8f5e8';
                button.style.borderColor = '#4caf50';
            }
            
            button.textContent = `${village} (${riskLevel})`;
            button.className = riskClass;
        });
    }

    handleNavigation(section) {
        switch(section) {
            case 'Dashboard':
                this.showDashboard();
                break;
            case 'Reports':
                this.showReports();
                break;
            case 'Alerts':
                this.showAlerts();
                break;
            case 'Water Points':
                this.showWaterPoints();
                break;
            case 'Resources':
                this.showResources();
                break;
            case 'Login':
                this.showLogin();
                break;
        }
    }

    handleQuickAction(action) {
        switch(action) {
            case 'Report Now':
                this.showCaseReportForm();
                break;
            case 'Check Water':
                this.showWaterQualityForm();
                break;
            case 'View Resources':
                this.showResources();
                break;
        }
    }

    showCaseReportForm() {
        const modal = this.createModal('Report New Case', `
            <form id="case-report-form" class="data-form">
                <div class="form-group">
                    <label for="patient_name">Patient Name:</label>
                    <input type="text" id="patient_name" name="patient_name" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="age">Age:</label>
                        <input type="number" id="age" name="age" required>
                    </div>
                    <div class="form-group">
                        <label for="gender">Gender:</label>
                        <select id="gender" name="gender" required>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="location">Location:</label>
                    <input type="text" id="location" name="location" required>
                </div>
                <div class="form-group">
                    <label for="symptoms">Symptoms:</label>
                    <textarea id="symptoms" name="symptoms" rows="3" required></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="disease_type">Disease Type:</label>
                        <select id="disease_type" name="disease_type" required>
                            <option value="">Select Disease</option>
                            <option value="Cholera">Cholera</option>
                            <option value="Typhoid">Typhoid</option>
                            <option value="Hepatitis A">Hepatitis A</option>
                            <option value="Diarrhea">Diarrhea</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="severity">Severity:</label>
                        <select id="severity" name="severity" required>
                            <option value="">Select Severity</option>
                            <option value="Low">Low</option>
                            <option value="Moderate">Moderate</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="reported_by">Reported By:</label>
                    <input type="text" id="reported_by" name="reported_by" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="submit-btn">Submit Report</button>
                    <button type="button" class="cancel-btn" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </form>
        `);

        document.getElementById('case-report-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitCaseReport(new FormData(e.target));
        });
    }

    showWaterQualityForm() {
        const modal = this.createModal('Water Quality Test', `
            <form id="water-quality-form" class="data-form">
                <div class="form-group">
                    <label for="wq_location">Location:</label>
                    <input type="text" id="wq_location" name="location" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="ph_level">pH Level:</label>
                        <input type="number" id="ph_level" name="ph_level" step="0.1" min="0" max="14" required>
                    </div>
                    <div class="form-group">
                        <label for="turbidity">Turbidity (NTU):</label>
                        <input type="number" id="turbidity" name="turbidity" step="0.1" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="chlorine_level">Chlorine Level (mg/L):</label>
                        <input type="number" id="chlorine_level" name="chlorine_level" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="bacteria_count">Bacteria Count:</label>
                        <input type="number" id="bacteria_count" name="bacteria_count" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="quality_status">Overall Quality:</label>
                    <select id="quality_status" name="quality_status" required>
                        <option value="">Select Quality</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                        <option value="Very Poor">Very Poor</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="tested_by">Tested By:</label>
                    <input type="text" id="tested_by" name="tested_by" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="submit-btn">Submit Test Results</button>
                    <button type="button" class="cancel-btn" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </form>
        `);

        document.getElementById('water-quality-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitWaterQuality(new FormData(e.target));
        });
    }

    showVolunteerForm() {
        const modal = this.createModal('Volunteer Registration', `
            <form id="volunteer-form" class="data-form">
                <div class="form-group">
                    <label for="vol_name">Full Name:</label>
                    <input type="text" id="vol_name" name="name" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone:</label>
                        <input type="tel" id="phone" name="phone" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="vol_location">Location:</label>
                    <input type="text" id="vol_location" name="location" required>
                </div>
                <div class="form-group">
                    <label for="specialization">Specialization:</label>
                    <select id="specialization" name="specialization" required>
                        <option value="">Select Specialization</option>
                        <option value="Health Worker">Health Worker</option>
                        <option value="Water Testing">Water Testing</option>
                        <option value="Community Outreach">Community Outreach</option>
                        <option value="Data Collection">Data Collection</option>
                        <option value="Emergency Response">Emergency Response</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="submit-btn">Register as Volunteer</button>
                    <button type="button" class="cancel-btn" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </form>
        `);

        document.getElementById('volunteer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitVolunteerRegistration(new FormData(e.target));
        });
    }

    async submitCaseReport(formData) {
        try {
            const data = Object.fromEntries(formData);
            const response = await fetch(`${this.apiBase}/api/cases`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showNotification('Case reported successfully!', 'success');
                document.querySelector('.modal').remove();
                this.loadDashboardData(); // Refresh dashboard
            } else {
                throw new Error('Failed to submit case report');
            }
        } catch (error) {
            this.showNotification('Error submitting case report', 'error');
            console.error('Error:', error);
        }
    }

    async submitWaterQuality(formData) {
        try {
            const data = Object.fromEntries(formData);
            const response = await fetch(`${this.apiBase}/api/water-quality`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showNotification('Water quality data submitted successfully!', 'success');
                document.querySelector('.modal').remove();
            } else {
                throw new Error('Failed to submit water quality data');
            }
        } catch (error) {
            this.showNotification('Error submitting water quality data', 'error');
            console.error('Error:', error);
        }
    }

    async submitVolunteerRegistration(formData) {
        try {
            const data = Object.fromEntries(formData);
            const response = await fetch(`${this.apiBase}/api/volunteers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showNotification('Volunteer registration successful!', 'success');
                document.querySelector('.modal').remove();
            } else {
                throw new Error('Failed to register volunteer');
            }
        } catch (error) {
            this.showNotification('Error registering volunteer', 'error');
            console.error('Error:', error);
        }
    }

    showReports() {
        this.loadDataView('Reports', async () => {
            const [cases, waterQuality] = await Promise.all([
                fetch(`${this.apiBase}/api/cases`).then(r => r.json()),
                fetch(`${this.apiBase}/api/water-quality`).then(r => r.json())
            ]);

            return `
                <div class="reports-container">
                    <div class="report-section">
                        <h3>Recent Cases</h3>
                        <div class="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Location</th>
                                        <th>Disease</th>
                                        <th>Severity</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${cases.slice(0, 10).map(case_ => `
                                        <tr>
                                            <td>${case_.patient_name}</td>
                                            <td>${case_.location}</td>
                                            <td>${case_.disease_type}</td>
                                            <td><span class="severity-${case_.severity.toLowerCase()}">${case_.severity}</span></td>
                                            <td>${new Date(case_.report_date).toLocaleDateString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="report-section">
                        <h3>Water Quality Tests</h3>
                        <div class="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Location</th>
                                        <th>pH Level</th>
                                        <th>Quality</th>
                                        <th>Test Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${waterQuality.slice(0, 10).map(test => `
                                        <tr>
                                            <td>${test.location}</td>
                                            <td>${test.ph_level}</td>
                                            <td><span class="quality-${test.quality_status.toLowerCase().replace(' ', '-')}">${test.quality_status}</span></td>
                                            <td>${new Date(test.test_date).toLocaleDateString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    showAlerts() {
        this.loadDataView('Active Alerts', async () => {
            const alerts = await fetch(`${this.apiBase}/api/alerts`).then(r => r.json());

            return `
                <div class="alerts-container">
                    ${alerts.map(alert => `
                        <div class="alert-card alert-${alert.severity.toLowerCase()}">
                            <div class="alert-header">
                                <h4>${alert.title}</h4>
                                <span class="alert-severity">${alert.severity}</span>
                            </div>
                            <p class="alert-message">${alert.message}</p>
                            <div class="alert-footer">
                                <span class="alert-location">📍 ${alert.location}</span>
                                <span class="alert-date">${new Date(alert.created_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        });
    }

    async loadDataView(title, contentGenerator) {
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="loading">Loading ${title}...</div>
        `;

        try {
            const content = await contentGenerator();
            mainContent.innerHTML = `
                <div class="data-view">
                    <h2>${title}</h2>
                    <button class="back-btn" onclick="location.reload()">← Back to Dashboard</button>
                    ${content}
                </div>
            `;
        } catch (error) {
            mainContent.innerHTML = `
                <div class="error">Error loading ${title}: ${error.message}</div>
            `;
        }
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    handleNewCase(data) {
        this.showNotification(`New case reported: ${data.disease_type} in ${data.location}`, 'warning');
        this.loadDashboardData(); // Refresh dashboard
    }

    handleWaterQualityUpdate(data) {
        this.showNotification(`Water quality updated for ${data.location}: ${data.quality_status}`, 'info');
    }

    handleNewAlert(data) {
        this.showNotification(`${data.severity} Alert: ${data.title}`, 'error');
    }

    setupRealTimeUpdates() {
        // Update dashboard every 30 seconds
        setInterval(() => {
            this.loadDashboardData();
        }, 30000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HealthMonitoringApp();
});

// Add mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
});