Jal Sanjivani - Community Health Monitoring System
Project Overview
Jal Sanjivani is a comprehensive web-based health monitoring system designed to track and prevent water-borne diseases in rural Northeast India. The platform provides real-time alerts, reporting capabilities, and educational resources for communities.


Features
Dashboard: Overview of current health risks and alerts

Case Reporting: System for reporting suspected disease cases

Water Quality Monitoring: Tools for testing and reporting water quality issues

Resource Library: Educational materials on disease prevention

Alert System: Color-coded risk level notifications

Volunteer Program: Community engagement opportunities

Responsive Design: Works on mobile and desktop devices


<header> with navigation

<main> content area with sections for different features

<footer> with contact information and links

Responsive design elements

CSS Features
Modern, clean design with a health-focused color scheme

Interactive elements with hover effects

Color-coded alert system for risk levels

Flexbox and Grid layout for modern positioning



Future Enhancements
Potential additions to the platform:

Database integration for case tracking

Mobile app version

SMS alert system for areas with limited internet

Multilingual support for local languages

Data visualization tools for health trends

Support
For technical support or questions about implementing this system, please contact the development team.

Designed for rural communities in Northeast India to combat water-borne diseases through technology and community engagement.
![1st](1st.png)
![2nd](2nd.png)
![3rd](3rd.png)
![4th](4th.png)
Soumya Jain

---

Data Processor (FastAPI) — Run locally

1. Create venv: `python -m venv .venv && source .venv/bin/activate`
2. Install deps: `pip install -r requirements.txt`
3. Start server: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
4. Open: `http://localhost:8000`

If you cannot install Python dependencies on your system, you can still use the client-only mode:

- Open `/workspace/static/index.html` directly in your browser. It will parse CSV/TSV/JSON locally and show the same summaries as the server.
