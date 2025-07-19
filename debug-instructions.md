# Instructions for Removing Predefined Words

The delete-predefined-words.js script encountered issues with ES module imports when running directly with Node.js. Here's an alternative approach to delete all predefined words:

## Method 1: Use Browser Console (Recommended)

1. Open the French Master application in your browser
2. Open browser developer tools (F12 or right-click and select "Inspect")
3. Go to the "Console" tab
4. Copy and paste the entire content of the `delete-words-browser.js` file into the console
5. Run the function by typing: `deletePredefinedWords().then(console.log)`
6. Wait for the deletion to complete
7. Refresh the application to see the changes

## Method 2: Debug Page

1. Open the application and navigate to `/db-debug.html`
2. In the debug controls, click "Force Refresh Cache" first
3. Then use the "Delete Item" functionality to remove words with IDs that start with "word-"
4. Click "Force Refresh Cache" again when done

## Verify Changes

After deletion:
1. Check that predefined words no longer appear in the vocabulary practice
2. Verify that your custom words still appear correctly
3. If issues persist, check the console for any error messages

The application should now only show your custom words!