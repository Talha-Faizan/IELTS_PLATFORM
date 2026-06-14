import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import contentReducer from "./slices/contentSlice";
import submissionReducer from "./slices/submissionSlice";
import subscriptionReducer from "./slices/subscriptionSlice";
import adminReducer from "./slices/adminSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    content: contentReducer,
    submission: submissionReducer,
    subscription: subscriptionReducer,
    admin: adminReducer,
  },
});

export default store;
