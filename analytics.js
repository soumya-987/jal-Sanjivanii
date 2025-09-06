// Analytics Dashboard JavaScript
class AnalyticsDashboard {
    constructor() {
        this.apiBase = window.location.origin;
        this.socket = io();
        this.charts = {};
        this.init();
    }

    async init() {
        await this.loadAnalyticsData();
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        this.socket.on('new_case', () => {
            this.refreshCharts();
        });

        this.socket.on('water_quality_update', () => {
            this.refreshCharts();
        });

        this.socket.on('new_alert', () => {
            this.refreshCharts();
        });
    }

    async loadAnalyticsData() {
        try {
            const [analyticsData, dashboardData, cases, waterQuality, alerts, volunteers] = await Promise.all([
                fetch(`${this.apiBase}/api/analytics`).then(r => r.json()),
                fetch(`${this.apiBase}/api/dashboard`).then(r => r.json()),
                fetch(`${this.apiBase}/api/cases`).then(r => r.json()),
                fetch(`${this.apiBase}/api/water-quality`).then(r => r.json()),
                fetch(`${this.apiBase}/api/alerts`).then(r => r.json()),
                fetch(`${this.apiBase}/api/volunteers`).then(r => r.json())
            ]);

            this.updateStatCards(cases, waterQuality, alerts, volunteers);
            this.createCharts(analyticsData, cases, waterQuality);
            this.generateInsights(analyticsData, cases, waterQuality, alerts);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        }
    }

    updateStatCards(cases, waterQuality, alerts, volunteers) {
        document.getElementById('totalCases').textContent = cases.length;
        document.getElementById('waterTests').textContent = waterQuality.length;
        document.getElementById('activeAlerts').textContent = alerts.filter(a => a.status === 'active').length;
        document.getElementById('volunteers').textContent = volunteers.length;
    }

    createCharts(analyticsData, cases, waterQuality) {
        this.createMonthlyCasesChart(analyticsData.monthly_cases);
        this.createDiseaseChart(analyticsData.disease_distribution);
        this.createWaterQualityChart(analyticsData.water_trends);
        this.createRiskLevelChart(cases);
        this.createLocationChart(cases);
    }

    createMonthlyCasesChart(monthlyData) {
        const ctx = document.getElementById('monthlyCasesChart').getContext('2d');
        
        // Prepare data for last 6 months
        const months = [];
        const counts = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
            const monthName = date.toLocaleDateString('en', { month: 'short', year: '2-digit' });
            
            months.push(monthName);
            const monthData = monthlyData.find(m => m.month === monthKey);
            counts.push(monthData ? monthData.count : 0);
        }

        this.charts.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Cases Reported',
                    data: counts,
                    borderColor: '#2e7d32',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createDiseaseChart(diseaseData) {
        const ctx = document.getElementById('diseaseChart').getContext('2d');
        
        const colors = [
            '#f44336', '#ff8c00', '#4caf50', '#2196f3', '#9c27b0'
        ];

        this.charts.diseaseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: diseaseData.map(d => d.disease_type),
                datasets: [{
                    data: diseaseData.map(d => d.count),
                    backgroundColor: colors.slice(0, diseaseData.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createWaterQualityChart(waterTrends) {
        const ctx = document.getElementById('waterQualityChart').getContext('2d');

        this.charts.waterChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: waterTrends.map(w => w.location),
                datasets: [{
                    label: 'Average pH Level',
                    data: waterTrends.map(w => w.avg_ph),
                    backgroundColor: 'rgba(33, 150, 243, 0.8)',
                    borderColor: '#2196f3',
                    borderWidth: 1,
                    yAxisID: 'y'
                }, {
                    label: 'Average Bacteria Count',
                    data: waterTrends.map(w => w.avg_bacteria),
                    backgroundColor: 'rgba(255, 140, 0, 0.8)',
                    borderColor: '#ff8c00',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'pH Level'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Bacteria Count'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    createRiskLevelChart(cases) {
        const ctx = document.getElementById('riskLevelChart').getContext('2d');
        
        const riskCounts = {
            'Low': 0,
            'Moderate': 0,
            'High': 0,
            'Critical': 0
        };

        cases.forEach(case_ => {
            riskCounts[case_.severity] = (riskCounts[case_.severity] || 0) + 1;
        });

        this.charts.riskChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(riskCounts),
                datasets: [{
                    data: Object.values(riskCounts),
                    backgroundColor: [
                        '#4caf50',  // Low
                        '#ff8c00',  // Moderate
                        '#f44336',  // High
                        '#d32f2f'   // Critical
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createLocationChart(cases) {
        const ctx = document.getElementById('locationChart').getContext('2d');
        
        const locationCounts = {};
        cases.forEach(case_ => {
            locationCounts[case_.location] = (locationCounts[case_.location] || 0) + 1;
        });

        const locations = Object.keys(locationCounts);
        const counts = Object.values(locationCounts);

        this.charts.locationChart = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: locations,
                datasets: [{
                    label: 'Number of Cases',
                    data: counts,
                    backgroundColor: 'rgba(46, 125, 50, 0.8)',
                    borderColor: '#2e7d32',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    generateInsights(analyticsData, cases, waterQuality, alerts) {
        const insights = [];
        
        // Calculate trends
        const totalCases = cases.length;
        const recentCases = cases.filter(c => {
            const caseDate = new Date(c.report_date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return caseDate >= weekAgo;
        }).length;

        const poorWaterSources = waterQuality.filter(w => 
            w.quality_status === 'Poor' || w.quality_status === 'Very Poor'
        ).length;

        const highRiskCases = cases.filter(c => 
            c.severity === 'High' || c.severity === 'Critical'
        ).length;

        // Generate insights
        if (recentCases > 0) {
            insights.push({
                icon: '📈',
                title: 'Recent Activity',
                description: `${recentCases} new cases reported in the last 7 days`,
                type: recentCases > 5 ? 'warning' : 'info'
            });
        }

        if (poorWaterSources > 0) {
            insights.push({
                icon: '💧',
                title: 'Water Quality Concern',
                description: `${poorWaterSources} water sources with poor quality detected`,
                type: 'warning'
            });
        }

        if (highRiskCases > 0) {
            insights.push({
                icon: '🚨',
                title: 'High Risk Cases',
                description: `${highRiskCases} high-risk or critical cases require immediate attention`,
                type: 'danger'
            });
        }

        // Most common disease
        if (analyticsData.disease_distribution && analyticsData.disease_distribution.length > 0) {
            const mostCommon = analyticsData.disease_distribution[0];
            insights.push({
                icon: '🦠',
                title: 'Common Disease',
                description: `${mostCommon.disease_type} is the most reported disease (${mostCommon.count} cases)`,
                type: 'info'
            });
        }

        // Positive trends
        if (totalCases > 0) {
            const recoveredCases = cases.filter(c => c.status === 'recovered').length;
            if (recoveredCases > 0) {
                insights.push({
                    icon: '✅',
                    title: 'Recovery Rate',
                    description: `${Math.round((recoveredCases / totalCases) * 100)}% of cases have recovered`,
                    type: 'success'
                });
            }
        }

        this.displayInsights(insights);
    }

    displayInsights(insights) {
        const container = document.getElementById('insightsContainer');
        
        if (insights.length === 0) {
            container.innerHTML = '<p class="no-insights">No significant insights at this time.</p>';
            return;
        }

        container.innerHTML = insights.map(insight => `
            <div class="insight-card insight-${insight.type}">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.description}</p>
                </div>
            </div>
        `).join('');
    }

    async refreshCharts() {
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};

        // Reload data and recreate charts
        await this.loadAnalyticsData();
    }
}

// Initialize analytics dashboard
document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsDashboard();
});