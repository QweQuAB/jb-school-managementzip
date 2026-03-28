# JB School Management System - Electron Setup Guide

## 📋 Prerequisites

Before you begin, make sure you have:

1. **Node.js** (version 16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: Open Command Prompt and type `node --version`

2. **Microsoft Access Database Runtime** (if Access is not installed)
   - Download from: https://www.microsoft.com/en-us/download/details.aspx?id=54920

3. **Windows 10 or 11** (64-bit recommended)

4. **Your Access Database File** (.accdb or .mdb)

---

## 📁 Project Structure

Create a folder called `jb-school-management` with this structure:

```
jb-school-management/
├── main.js                 (Main Electron process)
├── preload.js             (Security bridge)
├── index.html             (Your frontend - the HTML we created)
├── package.json           (Project configuration)
├── assets/
│   └── icon.png           (App icon - 256x256px)
└── README.md
```

---

## 🚀 Step-by-Step Installation

### Step 1: Create the Project Folder

```bash
# Open Command Prompt and navigate to where you want the project
cd C:\Users\YourName\Documents

# Create project folder
mkdir jb-school-management
cd jb-school-management
```

### Step 2: Initialize the Project

Copy the `package.json` file I provided into your project folder, then run:

```bash
npm install
```

This will install:
- Electron (for desktop app)
- ODBC driver (for Access database connection)
- Electron Builder (for creating .exe installer)

**Note:** Installation may take 5-10 minutes depending on your internet speed.

### Step 3: Add Your Files

1. Copy `main.js` into the project folder
2. Copy `preload.js` into the project folder
3. Copy `index.html` (the frontend we created) into the project folder
4. Create an `assets` folder and add an icon (optional)

### Step 4: Update Your Access Database

**IMPORTANT:** Make sure your Access database has these updates:

1. **Rename "Scores" table to "ContinuousAssessment"**
   - Open your database in Access
   - Right-click the "Scores" table → Rename → Type "ContinuousAssessment"
   - In the table, rename "ScoreID" field to "AssessmentID"

2. **Add "SchoolSettings" table** with these fields:
   - SettingID (AutoNumber, Primary Key)
   - SchoolName (Text)
   - Address (Text)
   - Phone (Text)
   - Email (Text)
   - Website (Text)
   - Motto (Text)
   - LogoPath (Text)

3. **Add one row to SchoolSettings table:**
   ```
   SettingID: 1
   SchoolName: Your School Name Here
   Address: Your address
   Phone: 0241234567
   Email: info@yourschool.edu.gh
   Website: www.yourschool.edu.gh
   Motto: Your school motto
   LogoPath: (leave empty for now)
   ```

4. Save and close Access before running the app

---

## ▶️ Running the Application

### Development Mode (Testing)

```bash
npm start
```

This opens the app in development mode. You can see errors in the console and test features.

### First Time Setup

1. When the app opens, you'll see a "Connect Database" button
2. Click it and browse to your .accdb or .mdb file
3. Select the file and click "Open"
4. The app will connect and load all data
5. Go to Settings tab to customize your school information

---

## ⚙️ Customizing Your School

1. **Go to Settings Tab** (gear icon in navigation)
2. **Fill in your school information:**
   - School Name
   - Address
   - Phone
   - Email
   - Website
   - Motto
3. **Upload your school logo** (optional)
4. **Click "Save Settings"**

Your school name will now appear:
- In the header
- On the dashboard
- In the footer
- On all printed reports

---

## 🔧 Troubleshooting

### Error: "Table 'ContinuousAssessment' not found"

**Solution:** You still have the old "Scores" table name. Rename it to "ContinuousAssessment" in Access.

### Error: "Table 'SchoolSettings' not found"

**Solution:** Add the new SchoolSettings table to your Access database (see Step 4 above).

### Error: "ODBC Driver not found"

**Solution:** Install Microsoft Access Database Engine:
- For 64-bit: https://www.microsoft.com/en-us/download/details.aspx?id=54920
- For 32-bit: Use the 32-bit version

### Error: "Cannot open database"

**Possible causes:**
1. Database file is open in Microsoft Access - Close it first
2. File path has special characters - Move to a simpler path like `C:\SchoolDB\school.accdb`
3. Database is corrupted - Try "Compact and Repair" in Access

### Connection String Issues

If the default connection string doesn't work, you can modify `main.js` line 49:

For newer Access (.accdb):
```javascript
const connectionString = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${filePath};`;
```

For older Access (.mdb):
```javascript
const connectionString = `Driver={Microsoft Access Driver (*.mdb)};DBQ=${filePath};`;
```

---

## 🎯 Testing the Application

### Test Checklist:

- [ ] Connect to database successfully
- [ ] Customize school settings
- [ ] Add a new student
- [ ] View students in table
- [ ] Add teacher, subject
- [ ] Enter continuous assessment for a student
- [ ] Record fees payment
- [ ] Generate class list
- [ ] View arrears report
- [ ] Print class list
- [ ] Print arrears list

---

## 💡 Development Tips

### Viewing Console Logs

To see detailed error messages during development:

1. Open `main.js`
2. Find this line (around line 20):
   ```javascript
   // mainWindow.webContents.openDevTools();
   ```
3. Remove the `//` to enable:
   ```javascript
   mainWindow.webContents.openDevTools();
   ```

### Database Location

For best performance, place your Access database:
- On local hard drive (not USB or network drive)
- In a path without special characters
- Example: `C:\SchoolData\jbschool.accdb`

---

## 📦 Next Steps

Once you've tested and confirmed everything works:

1. **Create Installer** - See next guide for building .exe
2. **Backup Database** - Set up automatic backups
3. **User Training** - Train staff on how to use the system
4. **Network Setup** - Configure for multi-user access (if needed)

---

## 🆘 Getting Help

If you encounter issues:

1. Check the console for error messages (press F12 in the app)
2. Verify your Access database structure matches our design
3. Ensure all Node.js packages are installed correctly
4. Check file permissions on the database

---

## 📝 Important Notes

### Multi-User Access

This setup supports **single user** by default. For multiple users:
- Place the Access database on a **network share**
- Update the connection string with the network path
- **Important:** Access has limitations with concurrent users (max 5-10)

### Data Backup

**Always backup your database regularly!**
```
Copy: C:\SchoolData\jbschool.accdb
To:   C:\SchoolData\Backups\jbschool_2025-02-03.accdb
```

### Performance

For large datasets (1000+ students):
- Consider adding indexes in Access on StudentID, ClassID, etc.
- Compact and repair database monthly
- Archive old records annually

---

## ✅ You're Ready!

Once you complete these steps, your application should:
- ✅ Connect to Access database
- ✅ Display your school name and information
- ✅ Display all data from tables
- ✅ Add/Delete records
- ✅ Generate reports with your school branding
- ✅ Print class lists and arrears

Next, we'll create the installer so you can distribute the app as a standalone .exe file!

## 📋 Prerequisites

Before you begin, make sure you have:

1. **Node.js** (version 16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: Open Command Prompt and type `node --version`

2. **Microsoft Access Database Runtime** (if Access is not installed)
   - Download from: https://www.microsoft.com/en-us/download/details.aspx?id=54920

3. **Windows 10 or 11** (64-bit recommended)

4. **Your Access Database File** (.accdb or .mdb)

---

## 📁 Project Structure

Create a folder called `greenfield-school-management` with this structure:

```
greenfield-school-management/
├── main.js                 (Main Electron process)
├── preload.js             (Security bridge)
├── index.html             (Your frontend - the HTML we created)
├── package.json           (Project configuration)
├── assets/
│   └── icon.png           (App icon - 256x256px)
└── README.md
```

---

## 🚀 Step-by-Step Installation

### Step 1: Create the Project Folder

```bash
# Open Command Prompt and navigate to where you want the project
cd C:\Users\YourName\Documents

# Create project folder
mkdir greenfield-school-management
cd greenfield-school-management
```

### Step 2: Initialize the Project

Copy the `package.json` file I provided into your project folder, then run:

```bash
npm install
```

This will install:
- Electron (for desktop app)
- ODBC driver (for Access database connection)
- Electron Builder (for creating .exe installer)

**Note:** Installation may take 5-10 minutes depending on your internet speed.

### Step 3: Add Your Files

1. Copy `main.js` into the project folder
2. Copy `preload.js` into the project folder
3. Copy `index.html` (the frontend we created) into the project folder
4. Create an `assets` folder and add an icon (optional)

### Step 4: Configure the Database Connection

The app will prompt you to select your Access database file on first run. Make sure your Access database:

- Has all the tables we designed (Students, Teachers, Classes, Subjects, Scores, Fees, Attendance)
- Is not open in Microsoft Access when running the app
- Has proper permissions (not read-only)

---

## ▶️ Running the Application

### Development Mode (Testing)

```bash
npm start
```

This opens the app in development mode. You can see errors in the console and test features.

### First Time Setup

1. When the app opens, you'll see a "Connect Database" button
2. Click it and browse to your .accdb or .mdb file
3. Select the file and click "Open"
4. The app will connect and load all data

---

## 🔧 Troubleshooting

### Error: "ODBC Driver not found"

**Solution:** Install Microsoft Access Database Engine:
- For 64-bit: https://www.microsoft.com/en-us/download/details.aspx?id=54920
- For 32-bit: Use the 32-bit version

### Error: "Cannot open database"

**Possible causes:**
1. Database file is open in Microsoft Access - Close it first
2. File path has special characters - Move to a simpler path like `C:\SchoolDB\school.accdb`
3. Database is corrupted - Try "Compact and Repair" in Access

### Error: "Table not found"

**Solution:** Make sure your Access database has these exact table names:
- Students
- Teachers
- Classes
- Subjects
- Scores
- Fees
- Attendance

### Connection String Issues

If the default connection string doesn't work, you can modify `main.js` line 49:

For newer Access (.accdb):
```javascript
const connectionString = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${filePath};`;
```

For older Access (.mdb):
```javascript
const connectionString = `Driver={Microsoft Access Driver (*.mdb)};DBQ=${filePath};`;
```

---

## 🎯 Testing the Application

### Test Checklist:

- [ ] Connect to database successfully
- [ ] Add a new student
- [ ] View students in table
- [ ] Add teacher, subject
- [ ] Enter scores for a student
- [ ] Record fees payment
- [ ] Generate class list
- [ ] View arrears report
- [ ] Print class list
- [ ] Print arrears list

---

## 💡 Development Tips

### Viewing Console Logs

To see detailed error messages during development:

1. Open `main.js`
2. Find this line (around line 20):
   ```javascript
   // mainWindow.webContents.openDevTools();
   ```
3. Remove the `//` to enable:
   ```javascript
   mainWindow.webContents.openDevTools();
   ```

### Database Location

For best performance, place your Access database:
- On local hard drive (not USB or network drive)
- In a path without special characters
- Example: `C:\SchoolData\greenfield.accdb`

---

## 📦 Next Steps

Once you've tested and confirmed everything works:

1. **Create Installer** - See next guide for building .exe
2. **Backup Database** - Set up automatic backups
3. **User Training** - Train staff on how to use the system
4. **Network Setup** - Configure for multi-user access (if needed)

---

## 🆘 Getting Help

If you encounter issues:

1. Check the console for error messages (press F12 in the app)
2. Verify your Access database structure matches our design
3. Ensure all Node.js packages are installed correctly
4. Check file permissions on the database

---

## 📝 Important Notes

### Multi-User Access

This setup supports **single user** by default. For multiple users:
- Place the Access database on a **network share**
- Update the connection string with the network path
- **Important:** Access has limitations with concurrent users (max 5-10)

### Data Backup

**Always backup your database regularly!**
```
Copy: C:\SchoolData\greenfield.accdb
To:   C:\SchoolData\Backups\greenfield_2025-02-03.accdb
```

### Performance

For large datasets (1000+ students):
- Consider adding indexes in Access on StudentID, ClassID, etc.
- Compact and repair database monthly
- Archive old records annually

---

## ✅ You're Ready!

Once you complete these steps, your application should:
- ✅ Connect to Access database
- ✅ Display all data from tables
- ✅ Add/Delete records
- ✅ Generate reports
- ✅ Print class lists and arrears

Next, we'll create the installer so you can distribute the app as a standalone .exe file!