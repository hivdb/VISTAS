import React, {lazy} from 'react';
import {Route} from 'found';

const GenBank = lazy(() => import('./main'));
const GenBankHIVStep1 = lazy(() => import('./HIV/step1'));
const GenBankHIVStep2 = lazy(() => import('./HIV/step2'));
const GenBankHIVStep3 = lazy(() => import('./HIV/step3'));

const GenBankHBVStep1 = lazy(() => import('./HBV/step1'));
const GenBankHBVStep2 = lazy(() => import('./HBV/step2'));
const GenBankHBVStep3 = lazy(() => import('./HBV/step3'));

const GenBankHCVStep1 = lazy(() => import('./HCV/step1'));
const GenBankHCVStep2 = lazy(() => import('./HCV/step2'));
const GenBankHCVStep3 = lazy(() => import('./HCV/step3'));

export default (
  <Route path="vistas/">
    <Route Component={GenBank} />
    <Route path="hiv/step1" Component={GenBankHIVStep1} />
    <Route path="hiv/step2" Component={GenBankHIVStep2} />
    <Route path="hiv/step3" Component={GenBankHIVStep3} />

    <Route path="hbv/step1" Component={GenBankHBVStep1} />
    <Route path="hbv/step2" Component={GenBankHBVStep2} />
    <Route path="hbv/step3" Component={GenBankHBVStep3} />

    <Route path="hcv/step1" Component={GenBankHCVStep1} />
    <Route path="hcv/step2" Component={GenBankHCVStep2} />
    <Route path="hcv/step3" Component={GenBankHCVStep3} />
  </Route>
);
