import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './Authentication/auth.guard';
import { NotAuthGuard } from './Authentication/not-auth.guard';
import { AutologinGuard } from './Authentication/autologin.guard';

import { LoginComponent } from './components/login/login.component';
// Patient Management  -------------------------------------------
import { PatientManagementComponent } from './components/patient/patients-management/patient-management/patient-management.component';
import { ManagePatientDetailsComponent } from './components/patient/patients-management/sub-components/manage-patient-details/manage-patient-details.component';
import { ManageThrombolysisComponent } from './components/patient/patients-management/sub-components/manage-thrombolysis/manage-thrombolysis.component';
import { ManagePciComponent } from './components/patient/patients-management/sub-components/manage-pci/manage-pci.component';
import { ManageHospitalSummaryComponent } from './components/patient/patients-management/sub-components/manage-hospital-summary/manage-hospital-summary.component';
import { ManageDischargeTransferComponent } from './components/patient/patients-management/sub-components/manage-discharge-transfer/manage-discharge-transfer.component';
import { ManageFollowUpComponent } from './components/patient/patients-management/sub-components/manage-follow-up/manage-follow-up.component';
import { PatientsTableComponent } from './components/patient/Patients-records/patients-table/patients-table.component';
import { HospitalTableComponent } from './components/Hospital/Hospital-management/hospital-table/hospital-table.component';
import { PatientPrintComponent } from './components/patient/patient-print/patient-print.component';
import { LocationComponent } from './components/Location-management/location/location.component';
import { ClusterMappingComponent } from './components/Cluster/cluster-mapping/cluster-mapping.component';
import { ClusterManagementComponent } from './components/Cluster/cluster-management/cluster-management.component';
import { UserManagementComponent } from './components/Users/user-management/user-management.component';
import { ReferralFacilityComponent } from './components/referral-facility/referral-facility.component';

import { DevicesTableComponent } from './components/Device-management/devices-table/devices-table.component';
import { OfflineTableComponent } from './components/Offline-management/offline-table/offline-table.component';
import { CardioTableComponent } from './components/Cardiologist-management/cardio-table/cardio-table.component';


// Hospital Management  ------------------------------------------
import { HospitalManagementComponent } from './components/Hospital/Hospital-management/hospital-management/hospital-management.component';
import { HospitalViewComponent } from './components/Hospital/Hospital-management/hospital-view/hospital-view.component';
// import { ClusterDashboardComponent } from './components/Cluster/cluster-dashboard/cluster-dashboard.component';


// All Under Process Components ------------------------------------------
import { AllFieldsViewComponent } from './components/under-process/all-fields-view/all-fields-view.component';
import { FormsManagementComponent } from './components/under-process/forms-management/forms-management.component';
import { BplRecordsComponent } from './components/bpl-records/bpl-records.component';



const routes: Routes = [
   {  path: '',
      redirectTo: '/Login',
      pathMatch: 'full',
      data: {} },
   {  path: 'Login',
      component: LoginComponent,
      canActivate: [NotAuthGuard],
      data: {}  },
   {  path: 'Patient-Manage',
      canActivate: [AuthGuard],
      component: PatientManagementComponent,
      children: [
         {  path: '',
            redirectTo: 'Patient-Details',
            pathMatch: 'full' },
         {  path: 'Patient-Details',
            component: ManagePatientDetailsComponent },
         {  path: 'Patient-Details/:Patient',
            component: ManagePatientDetailsComponent },
         {  path: 'Thrombolysis/:Patient',
            component: ManageThrombolysisComponent },
         {  path: 'PCI/:Patient',
            component: ManagePciComponent },
         {  path: 'Hospital-Summary/:Patient',
            component: ManageHospitalSummaryComponent },
         {  path: 'Discharge-Transfer/:Patient',
            component: ManageDischargeTransferComponent },
         {  path: 'Follow-Up/:Patient',
            component: ManageFollowUpComponent },
      ],
      data: {} },
   {  path: 'Patient-Records',
      component: PatientsTableComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'Patient-View',
      canActivate: [AuthGuard],
      component: PatientManagementComponent,
      children: [
         {  path: 'Patient-Details/:Patient',
            component: ManagePatientDetailsComponent },
         {  path: 'Thrombolysis/:Patient',
            component: ManageThrombolysisComponent },
         {  path: 'PCI/:Patient',
            component: ManagePciComponent },
         {  path: 'Hospital-Summary/:Patient',
            component: ManageHospitalSummaryComponent },
         {  path: 'Discharge-Transfer/:Patient',
            component: ManageDischargeTransferComponent },
         {  path: 'Follow-Up/:Patient',
            component: ManageFollowUpComponent },
      ],
      data: {} },
   {  path: 'Patient-Print/:Patient',
      component: PatientPrintComponent,
      canActivate: [AuthGuard],
      data: {}  },
   {  path: 'Hospital-Create',
      component: HospitalManagementComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'Hospital-Apply',
      component: HospitalManagementComponent,
      data: {} },
   {  path: 'All-Fields',
      component: AllFieldsViewComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'Form-Management',
      component: FormsManagementComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'Hospital-Management',
      component: HospitalTableComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'Hospital-Listview/:id',
      component: HospitalViewComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'Hospital-Edit/:id',
      component: HospitalManagementComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'cluster-Management',
      component: ClusterManagementComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'Cluster-Mapping',
      component: ClusterMappingComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'Location-Management',
      component: LocationComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'Device-Management',
      component: DevicesTableComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'User-Management',
      component: UserManagementComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'Offline-Management',
      component: OfflineTableComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'AskCardiologist-Management',
      component: CardioTableComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'BPL-Records',
      component: BplRecordsComponent,
      canActivate: [AuthGuard],
      data: {} },
   {  path: 'FromTab/:User/:Token/:DeviceId',
      component: PatientsTableComponent,
      canActivate: [AutologinGuard],
      data: {} },
	{  path: 'Referral-Facility',
      component: ReferralFacilityComponent,
      canActivate: [AuthGuard],
      data: {} },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
