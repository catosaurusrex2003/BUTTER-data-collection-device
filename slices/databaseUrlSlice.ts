import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction, Store } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface serverUrlState {
  url:string | null
}

const initialState: serverUrlState = {
  url:null
};

export const urlSlice = createSlice({
  name: "urlwalaState",
  initialState,
  reducers: {
    setUrl:(state,action)=>{
        state.url = action.payload
    },
  },
});

// Action creators are generated for each case reducer function
export const { setUrl } = urlSlice.actions;

export const selectUrl = (state:RootState) => state.urlwalaState.url

export default urlSlice.reducer;