import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  loginUser,
  registerUser,
  logoutUser,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  clearError,
} from "../slices/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error, accessToken } = useSelector(
    (state) => state.auth
  );

  const login = useCallback(
    (email, password) => {
      return dispatch(loginUser({ email, password }));
    },
    [dispatch]
  );

  const register = useCallback(
    (name, email, password, targetBand) => {
      return dispatch(registerUser({ name, email, password, targetBand }));
    },
    [dispatch]
  );

  const handleLogout = useCallback(() => {
    dispatch(logoutUser());
  }, [dispatch]);

  const verify = useCallback(
    (token) => {
      return dispatch(verifyEmail(token));
    },
    [dispatch]
  );

  const forgotPassword = useCallback(
    (email) => {
      return dispatch(requestPasswordReset(email));
    },
    [dispatch]
  );

  const reset = useCallback(
    (token, password) => {
      return dispatch(resetPassword({ token, password }));
    },
    [dispatch]
  );

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    accessToken,
    login,
    register,
    logout: handleLogout,
    verify,
    forgotPassword,
    reset,
    clearError: handleClearError,
  };
};
