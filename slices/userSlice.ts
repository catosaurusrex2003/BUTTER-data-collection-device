// Import createSlice from Redux Toolkit
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { UserDestinationType, UserOriginType } from "../types/mapTypes";

// Define a type for the slice state
interface UserState {
  userOrigin: UserOriginType | null;
  userDestination: UserDestinationType | null;
}

// Define the initial state using the UserState type
const initialState: UserState = {
  userOrigin: null,
  userDestination: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserOrigin: (state, action: PayloadAction<UserOriginType>) => {
      state.userOrigin = action.payload;
    },
    setUserDestination: (state, action: PayloadAction<UserDestinationType>) => {
      state.userDestination = action.payload;
    },
  },
});

// Export the actions
export const { setUserOrigin, setUserDestination } = userSlice.actions;

export const selectUserOrigin = (state: RootState) => state.user.userOrigin;
export const selectUserDestination = (state: RootState) =>
  state.user.userDestination;

// Export the reducer
export default userSlice.reducer;
