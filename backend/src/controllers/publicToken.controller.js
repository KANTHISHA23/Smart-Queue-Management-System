/**
 * Public token tracking controller.
 */
const publicTokenService = require('../services/publicToken.service');

const getPublicTokenStatus = async (req, res) => {
  try {
    const result = await publicTokenService.getPublicTokenStatus(req.params.tokenId);
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    return res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Get public token status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch token status.' });
  }
};

module.exports = {
  getPublicTokenStatus,
};
