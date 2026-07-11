import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import catalogReducer from './catalogSlice';
import platformAdminReducer from './platformAdminSlice';
import systemReducer from './systemSlice';
import salesReducer from './salesSlice';
import inventoryReducer from './inventorySlice';
import purchasingReducer from './purchasingSlice';
import customersReducer from './customersSlice';
import suppliersReducer from './suppliersSlice';
import reportsReducer from './reportsSlice';
import aiReducer from './aiSlice';
import syncReducer from './syncSlice';
import promotionsReducer from './promotionsSlice';
import taxRulesReducer from './taxRulesSlice';
import priceChangesReducer from './priceChangesSlice';

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
    suppliers: suppliersReducer,
    reports: reportsReducer,
    ai: aiReducer,
    sync: syncReducer,
    promotions: promotionsReducer,
    taxRules: taxRulesReducer,
    priceChanges: priceChangesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
