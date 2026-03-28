const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const odbc = require('odbc');

let mainWindow;
let dbConnection = null;

// Database configuration
let dbPath = '';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools in development
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    if (dbConnection) {
      dbConnection.close();
    }
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Helper function to escape SQL strings for Access
function escapeSql(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    // Escape single quotes by doubling them
    return `'${value.replace(/'/g, "''")}'`;
  }
  return `'${value}'`;
}

// Helper function to format dates for Access
function formatDateForAccess(dateString) {
  if (!dateString) return 'NULL';
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `#${month}/${day}/${year}#`; // Access date format
  } catch (e) {
    return 'NULL';
  }
}

// ====== DATABASE CONNECTION ======

// Connect to Access Database
ipcMain.handle('connect-database', async (event, filePath) => {
  try {
    if (dbConnection) {
      await dbConnection.close();
    }

    // Access Database Connection String
    const connectionString = `Driver={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=${filePath};`;
    
    dbConnection = await odbc.connect(connectionString);
    dbPath = filePath;
    
    return { success: true, message: 'Database connected successfully!' };
  } catch (error) {
    console.error('Database connection error:', error);
    return { success: false, message: error.message };
  }
});

// Select Database File
ipcMain.handle('select-database', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Access Database', extensions: ['accdb', 'mdb'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Generic Query Executor
ipcMain.handle('execute-query', async (event, query, params = []) => {
  try {
    if (!dbConnection) {
      return { success: false, message: 'Database not connected' };
    }

    const result = await dbConnection.query(query, params);
    return { success: true, data: result };
  } catch (error) {
    console.error('Query execution error:', error);
    return { success: false, message: error.message };
  }
});

// ====== STUDENTS ======

// Get all students
ipcMain.handle('get-students', async () => {
  try {
    const query = `
      SELECT s.*, c.ClassName 
      FROM Students s 
      LEFT JOIN Classes c ON s.ClassID = c.ClassID 
      ORDER BY s.FirstName, s.LastName
    `;
    const result = await dbConnection.query(query);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Add student
ipcMain.handle('add-student', async (event, student) => {
  try {
    console.log('Adding student:', student);
    
    const admissionNo = escapeSql(student.admissionNo || '');
    const firstName = escapeSql(student.firstName || '');
    const lastName = escapeSql(student.lastName || '');
    const gender = escapeSql(student.gender || 'M');
    const dob = formatDateForAccess(student.dob);
    const classId = student.classId || 'NULL';
    const parentName = escapeSql(student.parentName || '');
    const contact = escapeSql(student.contact || '');
    const address = escapeSql(student.address || '');
    const admissionDate = formatDateForAccess(student.admissionDate);
    
    const query = `
      INSERT INTO Students (AdmissionNo, FirstName, LastName, Gender, DOB, ClassID, 
                           ParentName, Contact, Address, AdmissionDate)
      VALUES (${admissionNo}, ${firstName}, ${lastName}, ${gender}, ${dob}, ${classId}, 
              ${parentName}, ${contact}, ${address}, ${admissionDate})
    `;
    
    console.log('Executing query:', query);
    await dbConnection.query(query);
    return { success: true, message: 'Student added successfully!' };
  } catch (error) {
    console.error('Add student error:', error);
    return { success: false, message: error.message };
  }
});

// Delete student
ipcMain.handle('delete-student', async (event, studentId) => {
  try {
    console.log('Deleting student with ID:', studentId);
    const query = `DELETE FROM Students WHERE StudentID = ${studentId}`;
    await dbConnection.query(query);
    return { success: true, message: 'Student deleted successfully!' };
  } catch (error) {
    console.error('Delete student error:', error);
    return { success: false, message: error.message };
  }
});

// ====== TEACHERS ======

// Get all teachers
ipcMain.handle('get-teachers', async () => {
  try {
    const query = `SELECT * FROM Teachers ORDER BY FirstName, LastName`;
    const result = await dbConnection.query(query);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Add teacher
ipcMain.handle('add-teacher', async (event, teacher) => {
  try {
    console.log('Adding teacher:', teacher);
    
    const firstName = escapeSql(teacher.firstName || '');
    const lastName = escapeSql(teacher.lastName || '');
    const contact = escapeSql(teacher.contact || '');
    const email = escapeSql(teacher.email || '');
    
    const query = `
      INSERT INTO Teachers (FirstName, LastName, Contact, Email)
      VALUES (${firstName}, ${lastName}, ${contact}, ${email})
    `;
    
    console.log('Executing query:', query);
    await dbConnection.query(query);
    return { success: true, message: 'Teacher added successfully!' };
  } catch (error) {
    console.error('Add teacher error:', error);
    return { success: false, message: error.message };
  }
});

// Delete teacher
ipcMain.handle('delete-teacher', async (event, teacherId) => {
  try {
    console.log('Deleting teacher with ID:', teacherId);
    const query = `DELETE FROM Teachers WHERE TeacherID = ${teacherId}`;
    await dbConnection.query(query);
    return { success: true, message: 'Teacher deleted successfully!' };
  } catch (error) {
    console.error('Delete teacher error:', error);
    return { success: false, message: error.message };
  }
});

// ====== SUBJECTS ======

// Get all subjects
ipcMain.handle('get-subjects', async () => {
  try {
    const query = `SELECT * FROM Subjects ORDER BY SubjectName`;
    const result = await dbConnection.query(query);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Add subject
ipcMain.handle('add-subject', async (event, subject) => {
  try {
    console.log('Adding subject:', subject);
    
    const subjectName = escapeSql(subject.name || '');
    const category = escapeSql(subject.category || 'Core');
    
    const query = `INSERT INTO Subjects (SubjectName, Category) VALUES (${subjectName}, ${category})`;
    
    console.log('Executing query:', query);
    await dbConnection.query(query);
    return { success: true, message: 'Subject added successfully!' };
  } catch (error) {
    console.error('Add subject error:', error);
    return { success: false, message: error.message };
  }
});

// Delete subject
ipcMain.handle('delete-subject', async (event, subjectId) => {
  try {
    console.log('Deleting subject with ID:', subjectId);
    const query = `DELETE FROM Subjects WHERE SubjectID = ${subjectId}`;
    await dbConnection.query(query);
    return { success: true, message: 'Subject deleted successfully!' };
  } catch (error) {
    console.error('Delete subject error:', error);
    return { success: false, message: error.message };
  }
});

// ====== CLASSES ======

// Get all classes
ipcMain.handle('get-classes', async () => {
  try {
    const query = `SELECT * FROM Classes ORDER BY ClassName`;
    const result = await dbConnection.query(query);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// ====== SCORES ======

// Get all continuous assessments
ipcMain.handle('get-assessments', async () => {
  try {
    const query = `
      SELECT ca.*, 
             s.FirstName + ' ' + s.LastName AS StudentName,
             sub.SubjectName,
             c.ClassName
      FROM ContinuousAssessment ca
      LEFT JOIN Students s ON ca.StudentID = s.StudentID
      LEFT JOIN Subjects sub ON ca.SubjectID = sub.SubjectID
      LEFT JOIN Classes c ON ca.ClassID = c.ClassID
      ORDER BY ca.SchoolYear DESC, ca.Term
    `;
    const result = await dbConnection.query(query);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Add continuous assessment
ipcMain.handle('add-assessment', async (event, assessment) => {
  try {
    console.log('Adding assessment:', assessment);
    
    const studentId = assessment.studentId || 'NULL';
    const subjectId = assessment.subjectId || 'NULL';
    const classId = assessment.classId || 'NULL';
    const term = escapeSql(assessment.term || 'Term 1');
    const year = assessment.year || new Date().getFullYear();
    const test1 = assessment.test1 || 0;
    const test2 = assessment.test2 || 0;
    const exam = assessment.exam || 0;
    const total = test1 + test2 + exam;
    const grade = escapeSql(assessment.grade || '');
    
    const query = `
      INSERT INTO ContinuousAssessment (StudentID, SubjectID, ClassID, Term, SchoolYear, 
                         Test1, Test2, Exam, Total, Grade)
      VALUES (${studentId}, ${subjectId}, ${classId}, ${term}, ${year}, 
              ${test1}, ${test2}, ${exam}, ${total}, ${grade})
    `;
    
    console.log('Executing query:', query);
    await dbConnection.query(query);
    return { success: true, message: 'Assessment added successfully!' };
  } catch (error) {
    console.error('Add assessment error:', error);
    return { success: false, message: error.message };
  }
});

// Delete continuous assessment
ipcMain.handle('delete-assessment', async (event, assessmentId) => {
  try {
    console.log('Deleting assessment with ID:', assessmentId);
    const query = `DELETE FROM ContinuousAssessment WHERE AssessmentID = ${assessmentId}`;
    await dbConnection.query(query);
    return { success: true, message: 'Assessment deleted successfully!' };
  } catch (error) {
    console.error('Delete assessment error:', error);
    return { success: false, message: error.message };
  }
});

// ====== FEES ======

// Get all fees
ipcMain.handle('get-fees', async () => {
  try {
    const query = `
      SELECT f.*, s.FirstName + ' ' + s.LastName AS StudentName, s.AdmissionNo
      FROM Fees f
      LEFT JOIN Students s ON f.StudentID = s.StudentID
      ORDER BY f.SchoolYear DESC, f.Term
    `;
    const result = await dbConnection.query(query);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Add fee record
ipcMain.handle('add-fee', async (event, fee) => {
  try {
    console.log('Adding fee:', fee);
    
    const studentId = fee.studentId || 'NULL';
    const term = escapeSql(fee.term || 'Term 1');
    const year = fee.year || new Date().getFullYear();
    const billed = fee.billed || 0;
    const paid = fee.paid || 0;
    const balance = billed - paid;
    
    const query = `
      INSERT INTO Fees (StudentID, Term, SchoolYear, AmountBilled, AmountPaid, Balance)
      VALUES (${studentId}, ${term}, ${year}, ${billed}, ${paid}, ${balance})
    `;
    
    console.log('Executing query:', query);
    await dbConnection.query(query);
    return { success: true, message: 'Fee record added successfully!' };
  } catch (error) {
    console.error('Add fee error:', error);
    return { success: false, message: error.message };
  }
});

// Delete fee
ipcMain.handle('delete-fee', async (event, feeId) => {
  try {
    console.log('Deleting fee with ID:', feeId);
    const query = `DELETE FROM Fees WHERE FeeID = ${feeId}`;
    await dbConnection.query(query);
    return { success: true, message: 'Fee record deleted successfully!' };
  } catch (error) {
    console.error('Delete fee error:', error);
    return { success: false, message: error.message };
  }
});

// Get arrears
ipcMain.handle('get-arrears', async () => {
  try {
    const query = `
      SELECT f.*, 
             s.FirstName + ' ' + s.LastName AS StudentName,
             s.AdmissionNo,
             c.ClassName
      FROM Fees f
      LEFT JOIN Students s ON f.StudentID = s.StudentID
      LEFT JOIN Classes c ON s.ClassID = c.ClassID
      WHERE f.Balance > 0
      ORDER BY f.Balance DESC
    `;
    const result = await dbConnection.query(query);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// ====== ATTENDANCE ======

// Get attendance records
ipcMain.handle('get-attendance', async () => {
  try {
    const query = `
      SELECT a.*, s.FirstName + ' ' + s.LastName AS StudentName
      FROM Attendance a
      LEFT JOIN Students s ON a.StudentID = s.StudentID
      ORDER BY a.Date DESC
    `;
    const result = await dbConnection.query(query);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Add attendance record
ipcMain.handle('add-attendance', async (event, attendance) => {
  try {
    console.log('Adding attendance:', attendance);
    
    const studentId = attendance.studentId || 'NULL';
    const date = formatDateForAccess(attendance.date || new Date().toISOString());
    const status = escapeSql(attendance.status || 'Present');
    
    const query = `
      INSERT INTO Attendance (StudentID, Date, Status)
      VALUES (${studentId}, ${date}, ${status})
    `;
    
    console.log('Executing query:', query);
    await dbConnection.query(query);
    return { success: true, message: 'Attendance marked successfully!' };
  } catch (error) {
    console.error('Add attendance error:', error);
    return { success: false, message: error.message };
  }
});

// Delete attendance
ipcMain.handle('delete-attendance', async (event, attendanceId) => {
  try {
    console.log('Deleting attendance with ID:', attendanceId);
    const query = `DELETE FROM Attendance WHERE AttendanceID = ${attendanceId}`;
    await dbConnection.query(query);
    return { success: true, message: 'Attendance record deleted successfully!' };
  } catch (error) {
    console.error('Delete attendance error:', error);
    return { success: false, message: error.message };
  }
});

// ====== CLASS LIST ======

// Get students by class
ipcMain.handle('get-class-list', async (event, classId) => {
  try {
    const query = `
      SELECT * FROM Students 
      WHERE ClassID = ? 
      ORDER BY Gender DESC, FirstName, LastName
    `;
    const result = await dbConnection.query(query, [classId]);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// ====== SCHOOL SETTINGS ======

// Get school settings
ipcMain.handle('get-school-settings', async () => {
  try {
    const query = `SELECT * FROM SchoolSettings WHERE SettingID = 1`;
    const result = await dbConnection.query(query);
    return { success: true, data: result.length > 0 ? result[0] : null };
  } catch (error) {
    console.error('Get school settings error:', error);
    return { success: false, message: error.message };
  }
});

// Update school settings
ipcMain.handle('update-school-settings', async (event, settings) => {
  try {
    console.log('Updating school settings:', settings);
    
    // Check if settings exist
    const checkQuery = `SELECT SettingID FROM SchoolSettings WHERE SettingID = 1`;
    const existing = await dbConnection.query(checkQuery);
    
    const schoolName = escapeSql(settings.schoolName || '');
    const address = escapeSql(settings.address || '');
    const phone = escapeSql(settings.phone || '');
    const email = escapeSql(settings.email || '');
    const website = escapeSql(settings.website || '');
    const motto = escapeSql(settings.motto || '');
    
    let query;
    
    if (existing.length > 0) {
      // Update existing
      query = `
        UPDATE SchoolSettings 
        SET SchoolName = ${schoolName}, 
            Address = ${address}, 
            Phone = ${phone}, 
            Email = ${email}, 
            Website = ${website}, 
            Motto = ${motto}
        WHERE SettingID = 1
      `;
    } else {
      // Insert new
      query = `
        INSERT INTO SchoolSettings (SchoolName, Address, Phone, Email, Website, Motto)
        VALUES (${schoolName}, ${address}, ${phone}, ${email}, ${website}, ${motto})
      `;
    }
    
    console.log('Executing query:', query);
    await dbConnection.query(query);
    return { success: true, message: 'School settings updated successfully!' };
  } catch (error) {
    console.error('Update school settings error:', error);
    return { success: false, message: error.message };
  }
});

// Select logo file
ipcMain.handle('select-logo', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});