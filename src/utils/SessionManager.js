class SessionManager {
  constructor() {
    this.userFields = [
      'FacilityID',
      'FacilityName',
      'FirstTimeLogin',
      'ID',
      'ISadmin',
      'IsBackupManager',
      'IsNormalUser',
      'LocationName',
      'ManagerId',
      'empCode',
      'empName',
      'isSpoc',
      'locationId',
      'userName',
      'ComplaintCategoryId',
      'routingEngineVersion'
    ];
  }

  // Set user session data
  setUserSession(userdetails) {
    if (!userdetails || !userdetails[0]) return;

    this.userFields.forEach(field => {
      sessionStorage.setItem(field, userdetails[0][field]);
    });
  }

  // Get user session data
  getUserSession() {
    const sessionData = {};
    this.userFields.forEach(field => {
      sessionData[field] = sessionStorage.getItem(field);
    });
    return sessionData;
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!sessionStorage.getItem('ID');
  }

  // Check user roles
  isAdmin() {
    return sessionStorage.getItem('ISadmin') === 'true';
  }

  isNormalUser() {
    return sessionStorage.getItem('IsNormalUser') === 'true';
  }

  isBackupManager() {
    return sessionStorage.getItem('IsBackupManager') === 'true';
  }

  isSpoc() {
    return sessionStorage.getItem('isSpoc') === 'true';
  }

  // Get routing engine version (V1 or V2)
  getRoutingEngineVersion() {
    return sessionStorage.getItem('routingEngineVersion') || 'V1';
  }

  // Clear session
  clearSession() {
    sessionStorage.clear();
  }
}

const sessionManager = new SessionManager();
export default sessionManager; 