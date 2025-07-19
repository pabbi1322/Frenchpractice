import React, { useState, useEffect } from 'react';
import { Box, Button, FormControlLabel, Switch, Typography, Paper, CircularProgress, Snackbar, Alert, Chip, Grid, Select, MenuItem, FormControl, InputLabel, Divider } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import BackupService from '../../services/BackupService';
import ContentExtractionService from '../../services/ContentExtractionService';

/**
 * Component for exporting content from the app
 */
const ExportContentComponent = () => {
  // Export options state
  const [includeUserContent, setIncludeUserContent] = useState(true);
  const [includePredefined, setIncludePredefined] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [includeDomContent, setIncludeDomContent] = useState(true);
  
  // Content type selection
  const [selectedContentTypes, setSelectedContentTypes] = useState(['words', 'verbs', 'sentences', 'numbers']);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [previewStats, setPreviewStats] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // When export options change, update the preview statistics
  useEffect(() => {
    updatePreviewStats();
  }, [includeUserContent, includePredefined, selectedContentTypes, includeDomContent]);
  
  /**
   * Update the preview statistics based on current export options
   */
  const updatePreviewStats = async () => {
    try {
      // If no content types are selected, clear preview
      if (selectedContentTypes.length === 0) {
        setPreviewStats(null);
        return;
      }
      
      // Show loading indicator for preview stats
      setIsLoading(true);
      
      // Get a preview of what will be exported using the ContentExtractionService
      const previewData = await ContentExtractionService.exportAllContent({
        includePredefined,
        includeUserContent,
        contentTypes: selectedContentTypes,
        includeDomContent,
        preview: true // This flag can be used to do a lightweight preview if needed
      });
      
      // Extract statistics from the preview data
      const stats = {
        counts: previewData.metadata.contentCounts,
        totalItems: previewData.metadata.totalItems,
        userContent: {
          words: previewData.data.words.filter(item => !item.isPredefined).length,
          verbs: previewData.data.verbs.filter(item => !item.isPredefined).length,
          sentences: previewData.data.sentences.filter(item => !item.isPredefined).length,
          numbers: previewData.data.numbers.filter(item => !item.isPredefined).length
        },
        predefinedContent: {
          words: previewData.data.words.filter(item => item.isPredefined).length,
          verbs: previewData.data.verbs.filter(item => item.isPredefined).length,
          sentences: previewData.data.sentences.filter(item => item.isPredefined).length,
          numbers: previewData.data.numbers.filter(item => item.isPredefined).length
        }
      };
      
      setPreviewStats(stats);
      
    } catch (error) {
      console.error('Error updating preview stats:', error);
      showNotification(`Error generating preview: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle the export action
   */
  const handleExport = async () => {
    try {
      // Validate that at least one content type is selected
      if (selectedContentTypes.length === 0) {
        showNotification('Please select at least one content type to export', 'warning');
        return;
      }
      
      setIsLoading(true);
      showNotification('Preparing content for export...', 'info');
      
      // Get all content based on selected options
      const exportData = await ContentExtractionService.exportAllContent({
        includePredefined,
        includeUserContent,
        contentTypes: selectedContentTypes,
        includeDomContent,
        format: selectedFormat
      });
      
      // Generate the download URL
      const downloadUrl = BackupService.generateDownloadableBackup(exportData);
      
      // Create a download link
      const fileName = `french-master-content-backup-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      showNotification(`Successfully exported ${exportData.metadata.totalItems} items`, 'success');
      
    } catch (error) {
      console.error('Error during export:', error);
      showNotification(`Export failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Toggle content type selection
   */
  const handleContentTypeToggle = (type) => {
    setSelectedContentTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };
  
  /**
   * Helper to display notification messages
   */
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };
  
  /**
   * Close the notification
   */
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Export Content
      </Typography>
      
      <Typography variant="body1" paragraph>
        Export your French learning content for backup or transfer to another device.
      </Typography>
      
      {/* Content Type Selection */}
      <Box mb={3}>
        <Typography variant="subtitle1" gutterBottom>
          Select Content Types to Export:
        </Typography>
        
        <Grid container spacing={1}>
          {[
            { type: 'words', label: 'Words' },
            { type: 'verbs', label: 'Verbs' },
            { type: 'sentences', label: 'Sentences' },
            { type: 'numbers', label: 'Numbers' }
          ].map(item => (
            <Grid item key={item.type}>
              <Chip
                label={item.label}
                color={selectedContentTypes.includes(item.type) ? 'primary' : 'default'}
                onClick={() => handleContentTypeToggle(item.type)}
                sx={{ fontSize: '0.9rem' }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Export Options */}
      <Box mb={3}>
        <Typography variant="subtitle1" gutterBottom>
          Export Options:
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch 
                  checked={includeUserContent} 
                  onChange={(e) => setIncludeUserContent(e.target.checked)} 
                />
              }
              label="Include your content"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch 
                  checked={includePredefined} 
                  onChange={(e) => setIncludePredefined(e.target.checked)} 
                />
              }
              label="Include predefined content"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch 
                  checked={includeDomContent} 
                  onChange={(e) => setIncludeDomContent(e.target.checked)} 
                />
              }
              label="Include DOM content (catch missing items)"
              title="Extracts content directly from the page to ensure no items are missed"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel id="format-select-label">Format</InputLabel>
              <Select
                labelId="format-select-label"
                value={selectedFormat}
                label="Format"
                onChange={(e) => setSelectedFormat(e.target.value)}
              >
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Preview Statistics */}
      {previewStats && (
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Export Preview:
          </Typography>
          
          <Grid container spacing={2}>
            {selectedContentTypes.includes('words') && (
              <Grid item xs={6} sm={3}>
                <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="subtitle2">Words</Typography>
                  <Typography variant="h6">{previewStats.counts.words}</Typography>
                  {includeUserContent && <Typography variant="caption">User: {previewStats.userContent.words}</Typography>}
                  {includePredefined && <Typography variant="caption" display="block">Predefined: {previewStats.predefinedContent.words}</Typography>}
                </Paper>
              </Grid>
            )}
            
            {selectedContentTypes.includes('verbs') && (
              <Grid item xs={6} sm={3}>
                <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="subtitle2">Verbs</Typography>
                  <Typography variant="h6">{previewStats.counts.verbs}</Typography>
                  {includeUserContent && <Typography variant="caption">User: {previewStats.userContent.verbs}</Typography>}
                  {includePredefined && <Typography variant="caption" display="block">Predefined: {previewStats.predefinedContent.verbs}</Typography>}
                </Paper>
              </Grid>
            )}
            
            {selectedContentTypes.includes('sentences') && (
              <Grid item xs={6} sm={3}>
                <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="subtitle2">Sentences</Typography>
                  <Typography variant="h6">{previewStats.counts.sentences}</Typography>
                  {includeUserContent && <Typography variant="caption">User: {previewStats.userContent.sentences}</Typography>}
                  {includePredefined && <Typography variant="caption" display="block">Predefined: {previewStats.predefinedContent.sentences}</Typography>}
                </Paper>
              </Grid>
            )}
            
            {selectedContentTypes.includes('numbers') && (
              <Grid item xs={6} sm={3}>
                <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="subtitle2">Numbers</Typography>
                  <Typography variant="h6">{previewStats.counts.numbers}</Typography>
                  {includeUserContent && <Typography variant="caption">User: {previewStats.userContent.numbers}</Typography>}
                  {includePredefined && <Typography variant="caption" display="block">Predefined: {previewStats.predefinedContent.numbers}</Typography>}
                </Paper>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 1.5, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="subtitle2">Total Items</Typography>
                <Typography variant="h6">{previewStats.totalItems}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Export Button */}
      <Box textAlign="center" mt={3}>
        <Button
          variant="contained"
          color="primary"
          startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <DownloadIcon />}
          onClick={handleExport}
          disabled={isLoading || selectedContentTypes.length === 0 || (!includeUserContent && !includePredefined)}
          size="large"
        >
          {isLoading ? 'Preparing Export...' : 'Export Content'}
        </Button>
        
        <Typography variant="caption" display="block" mt={1}>
          {selectedContentTypes.length === 0 
            ? 'Please select at least one content type to export'
            : (!includeUserContent && !includePredefined)
              ? 'Please include either user content or predefined content'
              : 'Click to download your content backup'}
        </Typography>
      </Box>
      
      {/* Notifications */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ExportContentComponent;