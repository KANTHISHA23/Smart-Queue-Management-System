/**
 * Public token tracking routes.
 */
const express = require('express');
const { getPublicTokenStatus } = require('../controllers/publicToken.controller');

const router = express.Router();

router.get('/token/:tokenId', getPublicTokenStatus);

module.exports = router;
