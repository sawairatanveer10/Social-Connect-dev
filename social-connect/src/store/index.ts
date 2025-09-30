import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/postsSlice";
import postsReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
