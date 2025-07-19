# French Learning Platform - Database Debug Utility

This utility allows you to check how many entries are stored in the IndexedDB database used by the French Learning Platform.

## Features

- Checks the number of words, verbs, sentences, numbers, and user data in the database
- Runs independently from the main application
- Displays counts for each category in a clear format
- Shows sample data from each category
- Allows exporting the database information to JSON
- Provides a console log for troubleshooting

## How to Use

1. Make sure you have used the French Learning Platform in your browser first (so that the IndexedDB database exists)
2. Open the `db-debug.html` file in the same browser you used for the French Learning Platform
3. The utility will automatically check the database when loaded
4. Click "Check Database" button to refresh the counts at any time
5. Click "Export to JSON" to download a file containing the database information

## Important Notes

- This utility must be opened in the same browser you use for the main application
- IndexedDB databases are isolated by domain, so when testing locally, use the same localhost port
- The utility is read-only and does not modify any data in the database

## Database Structure

The utility checks these stores in the IndexedDB database:

- `words` - French vocabulary words
- `verbs` - French verbs with conjugations
- `sentences` - Example French sentences
- `numbers` - French number words
- `users` - User authentication data

## Troubleshooting

If you see "0" entries for all stores or "Missing" status:
- Make sure you've used the application first to create the database
- Check that you're using the same browser for both the app and this utility
- Look for errors in the console log section of the utility

If you receive a connection error:
- Make sure your browser supports IndexedDB
- Check if your browser's privacy settings might be blocking IndexedDB

## Technical Details

The utility connects to the `frenchMasterDB` IndexedDB database (version 1) used by the French Learning Platform. It performs read-only operations to count the number of entries in each object store and retrieve sample data for verification.