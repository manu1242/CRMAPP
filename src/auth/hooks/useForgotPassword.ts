import { useState } from 'react';
import Toast from 'react-native-toast-message';
import { AuthService } from '../services/AuthService';

export const useForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const requestReset = async (email: string) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      await AuthService.forgotPassword(email);
      setIsSuccess(true);
      Toast.show({
        type: 'success',
        text1: 'Email Sent',
        text2: 'Instructions have been sent to your email.',
      });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Request failed';
      setError(msg);
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: msg,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      await AuthService.resetPassword(token, password);
      setIsSuccess(true);
      Toast.show({
        type: 'success',
        text1: 'Password Reset',
        text2: 'Your password has been changed successfully.',
      });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Reset failed';
      setError(msg);
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: msg,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    isSuccess,
    requestReset,
    resetPassword,
  };
};
