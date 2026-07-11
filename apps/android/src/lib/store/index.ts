import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import catalogReducer from './catalogSlice';
import systemReducer from './systemSlice';
import salesReducer from './salesSlice';
import inventoryReducer from './inventorySlice';
import customersReducer from './customersSlice';
import purchasingReducer from './purchasingSlice';
import suppliersReducer from './suppliersSlice';
import promotionsReducer from './promotionsSlice';
import taxRulesReducer from './taxRulesSlice';
import priceChangesReducer from './priceChangesSlice';
import reportsReducer from './reportsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    catalog: catalogReducer,
    system: systemReducer,
    sales: salesReducer,
    inventory: inventoryReducer,
    customers: customersReducer,
    purchasing: purchasingReducer,
    suppliers: suppliersReducer,
    promotions: promotionsReducer,
    taxRules: taxRulesReducer,
    priceChanges: priceChangesReducer,
    reports: reportsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
