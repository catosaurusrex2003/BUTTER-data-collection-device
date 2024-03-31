// store.ts
import { configureStore } from "@reduxjs/toolkit";

import urlSliceReducer from "./slices/databaseUrlSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    urlwalaState: urlSliceReducer,
    user: userReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

