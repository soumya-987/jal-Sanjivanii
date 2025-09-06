# 🐍 Virtual Environment (venv) for Jal Sanjivani

## ✅ **Virtual Environment Created Successfully!**

### 📁 **What's Been Created:**
- **`jal_sanjivani_env/`** - Python virtual environment folder
- **`requirements.txt`** - Python package dependencies
- **`activate_env.sh`** - Quick activation script

## 🚀 **How to Use the Virtual Environment:**

### **Method 1: Quick Activation (Recommended)**
```bash
# Run the activation script
./activate_env.sh
```

### **Method 2: Manual Activation**
```bash
# Activate the environment
source jal_sanjivani_env/bin/activate

# Install Python packages
pip install -r requirements.txt

# Your prompt will change to show: (jal_sanjivani_env)
```

### **Method 3: One Command**
```bash
source jal_sanjivani_env/bin/activate && pip install -r requirements.txt
```

## 🔧 **Running the Website with Virtual Environment:**

```bash
# 1. Activate virtual environment
source jal_sanjivani_env/bin/activate

# 2. Start the Node.js server (main website)
node server.js

# 3. Open browser: http://localhost:3000
```

## 📦 **What's in the Virtual Environment:**

### **Python Packages Available:**
- **pandas** - Data analysis and manipulation
- **numpy** - Numerical computing
- **matplotlib/seaborn** - Data visualization
- **requests** - HTTP requests for APIs
- **flask** - Web framework (for Python extensions)
- **sqlite3** - Database operations

### **Node.js Packages (already installed):**
- **express** - Web server
- **socket.io** - Real-time communication
- **sqlite3** - Database
- **cors** - Cross-origin requests

## 🎯 **Why Use Virtual Environment:**

### **Benefits:**
- ✅ **Isolated Dependencies** - No conflicts with system packages
- ✅ **Clean Environment** - Only packages you need
- ✅ **Reproducible** - Same environment on any machine
- ✅ **Easy Management** - Install/remove packages safely

### **Use Cases:**
- **Data Analysis** - Process health data with pandas
- **Visualization** - Create charts with matplotlib
- **API Extensions** - Add Python endpoints with Flask
- **Data Processing** - Analyze water quality trends

## 🛠️ **Common Commands:**

```bash
# Activate environment
source jal_sanjivani_env/bin/activate

# Check active environment
which python
python --version

# Install new package
pip install package_name

# List installed packages
pip list

# Save current packages
pip freeze > requirements.txt

# Deactivate environment
deactivate
```

## 📊 **Example: Using Python for Data Analysis**

```python
# In the virtual environment
import pandas as pd
import sqlite3

# Connect to the health database
conn = sqlite3.connect('health_monitoring.db')

# Load case data
cases_df = pd.read_sql_query("SELECT * FROM cases", conn)

# Analyze data
print(cases_df.groupby('location')['severity'].count())
```

## 🔄 **Workflow:**

1. **Activate venv**: `source jal_sanjivani_env/bin/activate`
2. **Run website**: `node server.js`
3. **Use Python tools**: For data analysis, visualization
4. **Deactivate**: `deactivate` when done

## ✨ **Ready to Use:**

Your virtual environment is now set up and ready! You can:
- Run the Node.js website normally
- Use Python for advanced data processing
- Keep dependencies organized and isolated
- Extend the system with Python tools

**The Jal Sanjivani system now has both Node.js and Python capabilities!** 🎉