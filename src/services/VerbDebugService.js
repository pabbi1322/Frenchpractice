/**
 * VerbDebugService.js
 * Utility service for debugging verb data issues in the French Learning app
 */

// Function to check verb integrity 
export const checkVerbIntegrity = (verb) => {
  if (!verb) return { valid: false, reason: 'Verb object is null or undefined' };
  
  const issues = [];
  
  // Check essential properties
  if (!verb.id) issues.push('Missing id property');
  if (!verb.infinitive) issues.push('Missing infinitive property');
  if (!verb.english) issues.push('Missing english property');
  
  // Check conjugations structure
  if (!verb.conjugations) {
    issues.push('Missing conjugations object');
  } else {
    const subjects = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];
    subjects.forEach(subject => {
      if (!verb.conjugations[subject]) {
        issues.push(`Missing conjugations.${subject} property`);
      } else if (!Array.isArray(verb.conjugations[subject])) {
        issues.push(`conjugations.${subject} is not an array`);
      }
    });
  }
  
  return {
    valid: issues.length === 0,
    issues: issues,
    verb: verb
  };
};

// Function to repair common verb structure issues
export const repairVerb = (verb) => {
  if (!verb) return null;
  
  // Create a deep clone to avoid modifying the original
  const repairedVerb = JSON.parse(JSON.stringify(verb));
  
  // Ensure ID exists
  if (!repairedVerb.id) {
    repairedVerb.id = `repaired-verb-${Date.now()}`;
  }
  
  // Ensure essential properties
  if (!repairedVerb.infinitive) repairedVerb.infinitive = '';
  if (!repairedVerb.english) repairedVerb.english = '';
  if (!repairedVerb.group) repairedVerb.group = '4'; // Default to irregular
  
  // Ensure conjugations structure
  if (!repairedVerb.conjugations) {
    repairedVerb.conjugations = {
      je: [''],
      tu: [''],
      il: [''],
      nous: [''],
      vous: [''],
      ils: ['']
    };
  } else {
    const subjects = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];
    subjects.forEach(subject => {
      if (!repairedVerb.conjugations[subject]) {
        repairedVerb.conjugations[subject] = [''];
      } else if (!Array.isArray(repairedVerb.conjugations[subject])) {
        repairedVerb.conjugations[subject] = [repairedVerb.conjugations[subject]];
      } else if (repairedVerb.conjugations[subject].length === 0) {
        repairedVerb.conjugations[subject] = [''];
      }
    });
  }
  
  // Ensure timestamps
  if (!repairedVerb.createdAt) repairedVerb.createdAt = new Date().toISOString();
  repairedVerb.updatedAt = new Date().toISOString();
  
  return repairedVerb;
};

// Function to get detailed info about a verb for debugging
export const getVerbDebugInfo = (verb) => {
  if (!verb) return { error: 'No verb provided' };
  
  const integrity = checkVerbIntegrity(verb);
  const deepCopy = JSON.stringify(verb);
  const referenceCheck = (verb === JSON.parse(deepCopy)) ? 'Same reference' : 'Different reference';
  
  // Extract conjugation details
  let conjugationsInfo = {};
  if (verb.conjugations) {
    const subjects = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];
    subjects.forEach(subject => {
      conjugationsInfo[subject] = {
        exists: !!verb.conjugations[subject],
        isArray: Array.isArray(verb.conjugations[subject]),
        length: Array.isArray(verb.conjugations[subject]) ? verb.conjugations[subject].length : 'not an array',
        value: verb.conjugations[subject]
      };
    });
  }
  
  return {
    id: verb.id,
    infinitive: verb.infinitive,
    english: verb.english,
    group: verb.group,
    createdAt: verb.createdAt,
    updatedAt: verb.updatedAt,
    conjugationsInfo,
    integrity,
    referenceCheck,
    size: deepCopy.length,
    fullObject: verb
  };
};

export default {
  checkVerbIntegrity,
  repairVerb,
  getVerbDebugInfo
};