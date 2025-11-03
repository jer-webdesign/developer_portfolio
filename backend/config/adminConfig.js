// Configuration for admin emails
// Add emails to this array to grant admin privileges

const ADMIN_EMAILS = [
  'jeremy.g.olanda@gmail.com',
  'admin2@example.com', // Second admin for testing
  // Add additional admin emails here
  // 'admin3@example.com'
];

/**
 * Check if an email has admin privileges
 * @param {string} email - Email to check
 * @returns {boolean} - True if email has admin privileges
 */
const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Get the role for a given email
 * @param {string} email - Email to check
 * @returns {string} - Either 'admin' or 'user'
 */
const getRoleForEmail = (email) => {
  return isAdminEmail(email) ? 'admin' : 'user';
};

/**
 * Add a new admin email (for runtime admin management)
 * @param {string} email - Email to add as admin
 * @returns {boolean} - True if successfully added
 */
const addAdminEmail = (email) => {
  if (!email || isAdminEmail(email)) return false;
  ADMIN_EMAILS.push(email.toLowerCase());
  return true;
};

/**
 * Remove an admin email (for runtime admin management)
 * @param {string} email - Email to remove from admin list
 * @returns {boolean} - True if successfully removed
 */
const removeAdminEmail = (email) => {
  if (!email || !isAdminEmail(email)) return false;
  const index = ADMIN_EMAILS.indexOf(email.toLowerCase());
  if (index > -1) {
    ADMIN_EMAILS.splice(index, 1);
    return true;
  }
  return false;
};

/**
 * Get all admin emails (for admin management interface)
 * @returns {Array<string>} - Array of admin emails
 */
const getAdminEmails = () => {
  return [...ADMIN_EMAILS]; // Return a copy to prevent direct modification
};

module.exports = {
  ADMIN_EMAILS,
  isAdminEmail,
  getRoleForEmail,
  addAdminEmail,
  removeAdminEmail,
  getAdminEmails
};