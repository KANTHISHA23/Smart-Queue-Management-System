/**
 * Auth repository — thin wrapper for auth persistence.
 *
 * Your codebase historically used `user.repository.js` for auth-related queries.
 * This file exists to match the Phase 1 architecture contract:
 * Service -> Auth repository -> DB.
 */
const userRepository = require('./user.repository');

module.exports = userRepository;

