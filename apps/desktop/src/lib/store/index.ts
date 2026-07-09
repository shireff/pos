import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import catalogReducer from './catalogSlice';
import platformAdminReducer from './platformAdminSlice';
import systemReducer from './systemSlice';
import salesReducer from './salesSlice';
import inventoryReducer from './inventorySlice';
import purchasingReducer from './purchasingSlice';
import customersReducer from './customersSlice';
import reportsReducer from './reportsSlice';
import aiReducer from './aiSlice';
import syncReducer from './syncSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    catalog: catalogReducer,
    platformAdmin: platformAdminReducer,
    system: systemReducer,
    sales: salesReducer,
    inventory: inventoryReducer,
    purchasing: purchasingReducer,
    customers: customersReducer,
    reports: reportsReducer,
    ai: aiReducer,
    sync: syncReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
