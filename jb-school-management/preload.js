const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database
  selectDatabase: () => ipcRenderer.invoke('select-database'),
  connectDatabase: (filePath) => ipcRenderer.invoke('connect-database', filePath),
  executeQuery: (query, params) => ipcRenderer.invoke('execute-query', query, params),

  // Students
  getStudents: () => ipcRenderer.invoke('get-students'),
  addStudent: (student) => ipcRenderer.invoke('add-student', student),
  deleteStudent: (id) => ipcRenderer.invoke('delete-student', id),

  // Teachers
  getTeachers: () => ipcRenderer.invoke('get-teachers'),
  addTeacher: (teacher) => ipcRenderer.invoke('add-teacher', teacher),
  deleteTeacher: (id) => ipcRenderer.invoke('delete-teacher', id),

  // Subjects
  getSubjects: () => ipcRenderer.invoke('get-subjects'),
  addSubject: (subject) => ipcRenderer.invoke('add-subject', subject),
  deleteSubject: (id) => ipcRenderer.invoke('delete-subject', id),

  // Classes
  getClasses: () => ipcRenderer.invoke('get-classes'),

  // Continuous Assessment (formerly Scores)
  getAssessments: () => ipcRenderer.invoke('get-assessments'),
  addAssessment: (assessment) => ipcRenderer.invoke('add-assessment', assessment),
  deleteAssessment: (id) => ipcRenderer.invoke('delete-assessment', id),

  // Fees
  getFees: () => ipcRenderer.invoke('get-fees'),
  addFee: (fee) => ipcRenderer.invoke('add-fee', fee),
  deleteFee: (id) => ipcRenderer.invoke('delete-fee', id),
  getArrears: () => ipcRenderer.invoke('get-arrears'),

  // Attendance
  getAttendance: () => ipcRenderer.invoke('get-attendance'),
  addAttendance: (attendance) => ipcRenderer.invoke('add-attendance', attendance),
  deleteAttendance: (id) => ipcRenderer.invoke('delete-attendance', id),

  // Class List
  getClassList: (classId) => ipcRenderer.invoke('get-class-list', classId),

  // School Settings
  getSchoolSettings: () => ipcRenderer.invoke('get-school-settings'),
  updateSchoolSettings: (settings) => ipcRenderer.invoke('update-school-settings', settings),
  selectLogo: () => ipcRenderer.invoke('select-logo')
});