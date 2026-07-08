import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import catalogReducer from './catalogSlice';
import platformAdminReducer from './platformAdminSlice';
import systemReducer from './systemSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    catalog: catalogReducer,
    platformAdmin: platformAdminReducer,
    system: systemReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
