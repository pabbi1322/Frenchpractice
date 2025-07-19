/**
 * DebugService.js - Service for debugging data issues
 */

// Helper to log detailed object structure
export const logObjectDetails = (label, obj) => {
  try {
    console.log(`==== DEBUG ${label} ====`);
    
    // Log object basic info
    console.log(`Type: ${typeof obj}`);
    if (obj === null) {
      console.log(`Value: null`);
      return;
    }
    if (obj === undefined) {
      console.log(`Value: undefined`);
      return;
    }
    
    // Log top-level keys
    console.log(`Keys: ${Object.keys(obj).join(', ')}`);
    
    // For verbs, log specific important properties
    if (obj.infinitive || obj.conjugations) {
      console.log(`Verb Details:`);
      console.log(`- ID: ${obj.id}`);
      console.log(`- Infinitive: ${obj.infinitive}`);
      console.log(`- English: ${obj.english}`);
      console.log(`- Group: ${obj.group}`);
      
      // Log conjugations if present
      if (obj.conjugations) {
        console.log(`- Conjugations:`);
        for (const [subject, conjugations] of Object.entries(obj.conjugations)) {
          console.log(`  - ${subject}: ${JSON.stringify(conjugations)}`);
        }
      }
      
      // Log timestamps
      console.log(`- CreatedAt: ${obj.createdAt}`);
      console.log(`- UpdatedAt: ${obj.updatedAt}`);
    }
    
    console.log(`==== END DEBUG ${label} ====`);
  } catch (error) {
    console.error(`Error logging object details:`, error);
  }
};

// Compare two objects and log differences (especially useful for verbs)
export const logObjectDifferences = (label, obj1, obj2) => {
  try {
    console.log(`==== COMPARING ${label} ====`);
    
    if (!obj1 || !obj2) {
      console.log(`One object is null/undefined: obj1=${!!obj1}, obj2=${!!obj2}`);
      return;
    }
    
    // Compare basic properties
    const basicProps = ['id', 'infinitive', 'english', 'group', 'createdAt', 'updatedAt'];
    for (const prop of basicProps) {
      if (obj1[prop] !== obj2[prop]) {
        console.log(`Difference in ${prop}: "${obj1[prop]}" vs "${obj2[prop]}"`);
      }
    }
    
    // Compare conjugations deeply
    if (obj1.conjugations && obj2.conjugations) {
      const subjects = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];
      for (const subject of subjects) {
        const conj1 = JSON.stringify(obj1.conjugations[subject]);
        const conj2 = JSON.stringify(obj2.conjugations[subject]);
        
        if (conj1 !== conj2) {
          console.log(`Difference in conjugations.${subject}: ${conj1} vs ${conj2}`);
        }
      }
    } else {
      console.log(`Conjugations structure difference: obj1=${!!obj1.conjugations}, obj2=${!!obj2.conjugations}`);
    }
    
    console.log(`==== END COMPARISON ${label} ====`);
  } catch (error) {
    console.error(`Error comparing objects:`, error);
  }
};

export default {
  logObjectDetails,
  logObjectDifferences
};