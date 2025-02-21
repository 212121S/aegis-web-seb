import axios from '../utils/axios';

class VerificationService {
  // Generate verification link and code for a test result
  async generateVerification(testResultId) {
    try {
      const response = await axios.post(`/api/verify/generate/${testResultId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to generate verification:', error);
      throw error;
    }
  }

  // Verify a result using a verification token
  async verifyByToken(token) {
    try {
      const response = await axios.get(`/api/verify/token/${token}`);
      return response.data;
    } catch (error) {
      console.error('Failed to verify token:', error);
      throw error;
    }
  }

  // Verify a result using a verification code
  async verifyByCode(code) {
    try {
      const response = await axios.post('/verify/code', { code });
      return response.data;
    } catch (error) {
      console.error('Failed to verify code:', error);
      throw error;
    }
  }

  // Revoke access to verification links and codes
  async revokeAccess(testResultId) {
    try {
      const response = await axios.post(`/api/verify/revoke/${testResultId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to revoke access:', error);
      throw error;
    }
  }

  // Format error messages for display
  formatError(error) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.status === 404) {
      return 'Verification not found or has expired';
    }
    if (error.response?.status === 403) {
      return 'Access to this verification has been revoked';
    }
    return 'An error occurred while verifying the result';
  }
}

export const verificationService = new VerificationService();
