import { AuthService } from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);
  sendSuccess(res, result);
});

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await AuthService.getProfile(req.user.id);
  sendSuccess(res, profile);
});

export default {
  login,
  getProfile,
};

