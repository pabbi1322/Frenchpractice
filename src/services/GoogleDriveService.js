// GoogleDriveService.js
// A service for interacting with Google Drive API
import { gapi } from 'gapi-script';

// Constants
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const BACKUP_FOLDER_NAME = "French Learning App Backups";

class GoogleDriveService {
  constructor() {
    this.isInitialized = false;
    this.isAuthenticated = false;
    this.backupFolderId = null;
  }

  /**
   * Initialize the Google API client
   * @param {string} apiKey - Your Google API key
   * @param {string} clientId - Your OAuth client ID
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize(apiKey, clientId) {
    try {
      console.log('GoogleDriveService: Initializing with API key and client ID');
      
      // Load the auth2 library
      await new Promise((resolve) => {
        gapi.load('client:auth2', resolve);
      });

      // Initialize the client
      await gapi.client.init({
        apiKey: apiKey,
        clientId: clientId,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      });

      // Listen for sign-in state changes
      gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus.bind(this));
      
      // Handle the initial sign-in state
      this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('GoogleDriveService: Error initializing', error);
      return false;
    }
  }

  /**
   * Update the authentication status
   * @param {boolean} isSignedIn - Whether the user is signed in
   */
  updateSigninStatus(isSignedIn) {
    this.isAuthenticated = isSignedIn;
    console.log(`GoogleDriveService: User is ${isSignedIn ? 'signed in' : 'signed out'}`);
  }

  /**
   * Sign in the user to Google
   * @returns {Promise<boolean>} - Whether sign-in was successful
   */
  async signIn() {
    if (!this.isInitialized) {
      console.error('GoogleDriveService: Not initialized');
      return false;
    }

    try {
      await gapi.auth2.getAuthInstance().signIn();
      return this.isAuthenticated;
    } catch (error) {
      console.error('GoogleDriveService: Error signing in', error);
      return false;
    }
  }

  /**
   * Sign out the user from Google
   * @returns {Promise<boolean>} - Whether sign-out was successful
   */
  async signOut() {
    if (!this.isInitialized || !this.isAuthenticated) {
      return false;
    }

    try {
      await gapi.auth2.getAuthInstance().signOut();
      return true;
    } catch (error) {
      console.error('GoogleDriveService: Error signing out', error);
      return false;
    }
  }

  /**
   * Find or create a folder to store backups
   * @returns {Promise<string>} - The folder ID
   */
  async findOrCreateBackupFolder() {
    if (!this.isInitialized || !this.isAuthenticated) {
      throw new Error('GoogleDriveService: Not initialized or not authenticated');
    }

    // Check if we already have the folder ID cached
    if (this.backupFolderId) {
      console.log('GoogleDriveService: Using cached backup folder ID', this.backupFolderId);
      return this.backupFolderId;
    }

    try {
      // Search for the folder
      const response = await gapi.client.drive.files.list({
        q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name)'
      });

      const folders = response.result.files;

      if (folders && folders.length > 0) {
        this.backupFolderId = folders[0].id;
        console.log('GoogleDriveService: Found existing backup folder', this.backupFolderId);
        return this.backupFolderId;
      }

      // If no folder exists, create one
      const fileMetadata = {
        name: BACKUP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const createResponse = await gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      });

      this.backupFolderId = createResponse.result.id;
      console.log('GoogleDriveService: Created new backup folder', this.backupFolderId);
      return this.backupFolderId;
    } catch (error) {
      console.error('GoogleDriveService: Error finding/creating backup folder', error);
      throw error;
    }
  }

  /**
   * Create a backup file in Google Drive
   * @param {Object} backupData - The data to backup
   * @returns {Promise<Object>} - The created file metadata
   */
  async createBackup(backupData) {
    if (!this.isInitialized || !this.isAuthenticated) {
      throw new Error('GoogleDriveService: Not initialized or not authenticated');
    }

    try {
      const folderId = await this.findOrCreateBackupFolder();
      
      // Create file metadata
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `french-learning-backup-${timestamp}.json`;
      
      const fileMetadata = {
        name: filename,
        parents: [folderId]
      };

      // Prepare the content
      const content = JSON.stringify({
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          description: 'French Learning App Backup'
        },
        data: backupData
      }, null, 2);

      // Create a new multipart request
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const contentType = 'application/json';

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(fileMetadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n\r\n' +
        content +
        close_delim;

      const request = gapi.client.request({
        'path': '/upload/drive/v3/files',
        'method': 'POST',
        'params': {'uploadType': 'multipart', 'fields': 'id,name,createdTime,size'},
        'headers': {
          'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody
      });

      const response = await request;
      console.log('GoogleDriveService: Backup created successfully', response.result);
      return response.result;
    } catch (error) {
      console.error('GoogleDriveService: Error creating backup', error);
      throw error;
    }
  }

  /**
   * List all available backups
   * @returns {Promise<Array>} - The list of backup files
   */
  async listBackups() {
    if (!this.isInitialized || !this.isAuthenticated) {
      throw new Error('GoogleDriveService: Not initialized or not authenticated');
    }

    try {
      const folderId = await this.findOrCreateBackupFolder();
      
      const response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
        spaces: 'drive',
        fields: 'files(id, name, createdTime, size)',
        orderBy: 'createdTime desc'
      });

      const backups = response.result.files;
      console.log('GoogleDriveService: Found backups', backups);
      return backups;
    } catch (error) {
      console.error('GoogleDriveService: Error listing backups', error);
      throw error;
    }
  }

  /**
   * Download a specific backup
   * @param {string} fileId - The ID of the backup file
   * @returns {Promise<Object>} - The backup data
   */
  async downloadBackup(fileId) {
    if (!this.isInitialized || !this.isAuthenticated) {
      throw new Error('GoogleDriveService: Not initialized or not authenticated');
    }

    try {
      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      const backup = response.result;
      console.log('GoogleDriveService: Downloaded backup', fileId);
      return backup;
    } catch (error) {
      console.error('GoogleDriveService: Error downloading backup', error);
      throw error;
    }
  }

  /**
   * Delete a specific backup
   * @param {string} fileId - The ID of the backup file
   * @returns {Promise<boolean>} - Whether deletion was successful
   */
  async deleteBackup(fileId) {
    if (!this.isInitialized || !this.isAuthenticated) {
      throw new Error('GoogleDriveService: Not initialized or not authenticated');
    }

    try {
      await gapi.client.drive.files.delete({
        fileId: fileId
      });

      console.log('GoogleDriveService: Deleted backup', fileId);
      return true;
    } catch (error) {
      console.error('GoogleDriveService: Error deleting backup', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const googleDriveService = new GoogleDriveService();
export default googleDriveService;