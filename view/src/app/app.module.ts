import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';


import { MatCheckboxModule,
         MatButtonModule,
         MatCardModule,
         MatDividerModule,
         MatExpansionModule,
         MatFormFieldModule,
         MatInputModule,
         MatSelectModule,
         MatIconModule,
         MatSnackBarModule,
         MatMenuModule,
         MatDatepickerModule,
         MatNativeDateModule,
         MatTabsModule,
         MatToolbarModule,
         MatSidenavModule,
         MatTooltipModule,
         MatAutocompleteModule,
			MatRadioModule } from '@angular/material';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { ButtonsModule } from 'ngx-bootstrap';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { AgmCoreModule } from '@agm/core';
import { AgmDirectionModule } from 'agm-direction';



import { ControlPanelOptionsFilterPipe } from './pipes/control-panel-options-filter.pipe';
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
import { HospitalManagementComponent } from './components/Hospital/Hospital-management/hospital-management/hospital-management.component';
import { PatientPrintComponent } from './components/patient/patient-print/patient-print.component';
import { LocationComponent } from './components/Location-management/location/location.component';
import { ClusterMappingComponent } from './components/Cluster/cluster-mapping/cluster-mapping.component';
import { ClusterManagementComponent } from './components/Cluster/cluster-management/cluster-management.component';
import { UserManagementComponent } from './components/Users/user-management/user-management.component';

import { OfflineTableComponent } from './components/Offline-management/offline-table/offline-table.component';
import { CardioTableComponent } from './components/Cardiologist-management/cardio-table/cardio-table.component';


// All Under Process Components ------------------------------------------
import { AllFieldsViewComponent } from './components/under-process/all-fields-view/all-fields-view.component';
import { FormsManagementComponent } from './components/under-process/forms-management/forms-management.component';
import { StaticModalComponent } from './components/Modals/static-modal/static-modal.component';
import { HospitalTableComponent } from './components/Hospital/Hospital-management/hospital-table/hospital-table.component';
import { ModalApprovedComponent } from './components/Modals/modal-approved/modal-approved.component';
import { ModalFilterComponent } from './components/Modals/modal-filter/modal-filter.component';
import { ClusterDashboardComponent } from './components/Cluster/cluster-dashboard/cluster-dashboard.component';
import { HospitalViewComponent } from './components/Hospital/Hospital-management/hospital-view/hospital-view.component';
import { LocationManagementComponent } from './components/Modals/location-management/location-management.component';
import { ModalClusterCreateAndEditComponent } from './components/Modals/modal-cluster-create-and-edit/modal-cluster-create-and-edit.component';
import { ModalUserManagementComponent } from './components/Modals/modal-user-management/modal-user-management.component';
import { ModalClusterViewComponent } from './components/Modals/modal-cluster-view/modal-cluster-view.component';
import { ModalUserViewComponent } from './components/Modals/modal-user-view/modal-user-view.component';
import { MyInterceptor } from './Authentication/my-interceptor';
import { ModalSessionExpiredComponent } from './components/Modals/modal-session-expired/modal-session-expired.component';
import { EcgFileManagementComponent } from './components/Modals/ecg-file-management/ecg-file-management.component';
import { DateAgoPipe } from './pipes/date-ago.pipe';
import { DevicesTableComponent } from './components/Device-management/devices-table/devices-table.component';
import { ModalDeviceManagementComponent } from './components/Modals/modal-device-management/modal-device-management.component';
import { ModalCardioViewComponent } from './components/Modals/modal-cardio-view/modal-cardio-view.component';
import { ModalOfflineViewComponent } from './components/Modals/modal-offline-view/modal-offline-view.component';
import { BplRecordsComponent } from './components/bpl-records/bpl-records.component';
import { ModalBplViewComponent } from './components/Modals/modal-bpl-view/modal-bpl-view.component';
import { ModalBplUpdateComponent } from './components/Modals/modal-bpl-update/modal-bpl-update.component';
import { ModalIdProofConfigComponent } from './components/Modals/modal-id-proof-config/modal-id-proof-config.component';
import { ReferralFacilityComponent } from './components/referral-facility/referral-facility.component';
import { ModalReferralFacilityComponent } from './components/Modals/modal-referral-facility/modal-referral-facility.component';



@NgModule({
   declarations: [
      AppComponent,
      LoginComponent,
      ControlPanelOptionsFilterPipe,
      // Patient Management -------------------------------------------
         PatientManagementComponent,
         ManagePatientDetailsComponent,
         ManageThrombolysisComponent,
         ManagePciComponent,
         ManageHospitalSummaryComponent,
         ManageDischargeTransferComponent,
         ManageFollowUpComponent,
         PatientsTableComponent,
         HospitalManagementComponent,
         PatientPrintComponent,
         LocationComponent,
      // All Under Process Components --------------------
         AllFieldsViewComponent,
         FormsManagementComponent,
         StaticModalComponent,
         HospitalTableComponent,
         ModalApprovedComponent,
         ModalFilterComponent,
         ClusterDashboardComponent,
         HospitalViewComponent,
         LocationManagementComponent,
         ClusterMappingComponent,
         ClusterManagementComponent,
         ModalClusterCreateAndEditComponent,
         UserManagementComponent,
         ModalUserManagementComponent,
         ModalClusterViewComponent,
         ModalUserViewComponent,
         ModalSessionExpiredComponent,
         EcgFileManagementComponent,
         DateAgoPipe,
         DevicesTableComponent,
         ModalDeviceManagementComponent,
         OfflineTableComponent,
         CardioTableComponent,
         ModalCardioViewComponent,
         ModalOfflineViewComponent,
         BplRecordsComponent,
         ModalBplViewComponent,
         ModalBplUpdateComponent,
         ModalIdProofConfigComponent,
         ReferralFacilityComponent,
         ModalReferralFacilityComponent
   ],
   imports: [
      BrowserModule,
      AppRoutingModule,
      BrowserAnimationsModule,
      HttpClientModule,
      FormsModule,
      ReactiveFormsModule,
      MatCheckboxModule,
      MatButtonModule,
      MatCardModule,
      MatDividerModule,
      MatExpansionModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatIconModule,
      MatSnackBarModule,
      MatMenuModule,
      MatDatepickerModule,
      MatNativeDateModule,
      MatTabsModule,
      MatToolbarModule,
      MatSidenavModule,
      MatTooltipModule,
      NgxMaterialTimepickerModule,
      MatTooltipModule,
      MatAutocompleteModule,
		MatRadioModule,
      ButtonsModule.forRoot(),
      ModalModule.forRoot(),
      AgmCoreModule.forRoot({ apiKey: 'AIzaSyBM6zu-n9zRCwisWLkK0SCRr-f3uNxBJ6U', libraries: ['places', 'geocoder'] } ),
      AgmDirectionModule,
      TypeaheadModule.forRoot(),
   ],
   providers: [{ provide: HTTP_INTERCEPTORS, useClass: MyInterceptor, multi: true }],
   entryComponents: [
      StaticModalComponent,
      ModalApprovedComponent,
      ModalFilterComponent,
      LocationManagementComponent,
      ModalClusterCreateAndEditComponent,
      ModalUserManagementComponent,
      ModalClusterViewComponent,
      ModalUserViewComponent,
      ModalSessionExpiredComponent,
      EcgFileManagementComponent,
      ModalDeviceManagementComponent,
      ModalCardioViewComponent,
      ModalOfflineViewComponent,
      ModalBplViewComponent,
      ModalBplUpdateComponent,
      ModalIdProofConfigComponent,
		ModalReferralFacilityComponent
   ],
   bootstrap: [AppComponent]
})
export class AppModule { }
