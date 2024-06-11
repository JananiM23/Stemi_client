import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener, TemplateRef, QueryList, ViewChildren } from '@angular/core';
import { FormGroup, Validators, FormControl, ValidatorFn, AbstractControl, FormArray, Form } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DateAdapter, NativeDateAdapter } from '@angular/material/core';
import { Subscription, forkJoin } from 'rxjs';

import { BsModalRef, BsModalService} from 'ngx-bootstrap';
import { TimepickerDirective } from 'ngx-material-timepicker';

import { PatientDetailsService } from './../../../../../services/patient-management/patient-details/patient-details.service';
import { ToastrService } from './../../../../../services/common-services/toastr.service';
import { DischargeTransferService } from '../../../../../services/patient-management/discharge-transfer/discharge-transfer.service';
import { DataPassingService } from './../../../../../services/common-services/data-passing.service';
import { LoginManagementService } from './../../../../../services/login-management/login-management.service';
import { Observable } from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import { IdproofManagementService } from 'src/app/services/idproof-management/idproof-management.service';
import { ReferralFacilityService } from 'src/app/services/referral-facility/referral-facility.service';

export interface Hospitals  { _id: string; Hospital_Name: string; Hospital_Role: string; Hospital_Address: string; Hospital_Type: string; }

export class MyDateAdapter extends NativeDateAdapter {
   format(date: Date, displayFormat: any): string {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate();
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
   }
}


@Component({
  selector: 'app-manage-patient-details',
  templateUrl: './manage-patient-details.component.html',
  styleUrls: ['./manage-patient-details.component.css'],
  providers: [{provide: DateAdapter, useClass: MyDateAdapter}],
})
export class ManagePatientDetailsComponent implements OnInit, OnDestroy {

   @ViewChildren(TimepickerDirective) timePicker: QueryList<TimepickerDirective>;

   private subscription: Subscription = new Subscription();
   private dataSubscription: Subscription = new Subscription();
   private historySubscription: Subscription = new Subscription();

   modalReference: BsModalRef;


   @ViewChild('fileInput') fileInput: ElementRef;
   @ViewChild('fileInputAadhaar') fileInputAadhaar: ElementRef;
   @ViewChild('fileInputIdProof') fileInputIdProof: ElementRef;
   @HostListener('window:resize', ['$event'])
   ShowECGPreview = false;
   ECGPreviewAvailable = false;
   ECGPreview: any;
   ShowAadhaarPreview = false;
   AadhaarPreviewAvailable = false;
   AadhaarPreview: any;
   ShowIdProofPreview = false;
   IdProofPreviewAvailable = false;
   IdProofPreview: any;
   screenHeight: any;
   screenWidth: any;
   QRImage: any;

   @ViewChild('fileInputConsent') fileInputConsent: ElementRef;
   ShowConsentPreview = false;
   ConsentPreviewAvailable = false;
   ConsentPreview: any;
   ConsentIsPdf = false;


   AllFields: any[] = [];
   AllFieldsValues: any[] = [];
   AllValidations: any[] = [];

   UserInfo: any;

   TabsList: any[] = ['Basic_Details', 'Fibrinolytic_Checklist', 'Medication_During_Transportation', 'Cardiac_History', 'Co-Morbid_Conditions', 'Contact_Details'];

   GenderTypes: any[] = [ {Name: 'Male', Key: 'Male'},
                           {Name: 'Female', Key: 'Female'}];
                           // {Name: 'Male to Female', Key: 'Male_to_Female'},
                           // {Name: 'Female to Male', Key: 'Female_to_Male'} ];

   RaceTypes: any[] = [ {Name: 'Black', Key: 'Black'},
                        {Name: 'White', Key: 'White'},
                        {Name: 'Mixed', Key: 'Mixed'},
                        {Name: 'Asian', Key: 'Asian'},
                        {Name: 'Others', Key: 'Others'} ];

   PaymentTypes: any[] = [ {Name: 'Yes', Key: 'Yes'},
                           {Name: 'No', Key: 'No'}];

   AdmissionType: any[] = [{Name: 'DIRECT (Hub)', Key: 'Direct'},
                           {Name: 'Referral (Spoke)', Key: 'Non_Cluster_Spoke'}, 
									{Name: 'Referral (Non-Spoke)', Key: 'Non_Cluster_NonSpoke'} ];

   HospitalTypes: any[] = [ {Name: 'EMS', Key: 'E'},
									{Name: 'Secondary Hospital', Key: 'S1'},
									{Name: 'Clinic/GP', Key: 'S2'},
									{Name: 'Tertiary level PCI Facility 24x7', Key: 'H1'},
									{Name: 'Tertiary level PCI Facility', Key: 'H2'} ];


   DosageUnitsOne: any[] = [  {Name: 'mg', Key: 'mg'},
                              {Name: 'U', Key: 'u'},
                              {Name: 'mcg', Key: 'mcg'},
                              {Name: 'mg/ml', Key: 'mg_ml'},
                              {Name: 'mcg/min', Key: 'mcg_min'} ];

   TransportTypes: any[] = [  {Name: 'Private', Key: 'Private'},
                              {Name: 'Public', Key: 'Public'},
                              {Name: 'Govt Ambulance', Key: 'Govt_ambulance'},
                              {Name: 'Private Ambulance', Key: 'Private_ambulance'},
                              {Name: 'Helicopter', Key: 'Helicopter'},
                              {Name: 'Fixed Wing', Key: 'Fixed_wing'},
                              {Name: 'Others', Key: 'Others'} ];

   KilipClass: any[] = [ '1', '2', '3', '4'];


   PreviousMI: any[] = [   {Name: 'Anterior Wall MI (V1 to V3)', Key: 'Anterior_Wall_MI'},
                           {Name: 'Inferior Wall MI', Key: 'Inferior_Wall_MI'},
                           {Name: 'Posterior Wall MI', Key: 'Posterior_Wall_MI'},
                           {Name: 'Lateral Wall MI (V4 to V6)', Key: 'Lateral_Wall_MI'},
                           {Name: 'High Lateral Wall MI (1 and aVL)', Key: 'High_Lateral_Wall_MI'},
									{Name: 'Infero-Posterior', Key: 'Infero-Posterior'},
									{Name: 'Antero-Lateral (V1 to V6)', Key: 'Antero-Lateral'} ];

   ChestDiscomfort: any[] = [ {Name: 'Pain', Key: 'Pain'},
                              {Name: 'Pressure', Key: 'Pressure'},
                              {Name: 'Ache', Key: 'Ache'} ];

   LocationOfPain: any[] = [ {Name: 'Back', Key: 'Back'},
                              {Name: 'R Arm', Key: 'R_Arm'},
                              {Name: 'L Arm', Key: 'L_Arm'},
                              {Name: 'Jaw', Key: 'Jaw'},
                              {Name: 'Retrosternal', Key: 'Retrosternal'} ];

   PainSeverity: any[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

   Smoker: any[] = [ {Name: 'Non Smoker', Key: 'Non_Smoker'},
                     {Name: 'Current Smoker', Key: 'Current_Smoker'},
                     {Name: 'Past Smoker', Key: 'Past_Smoker'},
                     {Name: 'Unknown', Key: 'Unknown'},
                     {Name: 'Passive', Key: 'Passive'} ];

   RelationType: any[] = [ {Name: 'Father', Key: 'Father'},
                           {Name: 'Spouse', Key: 'Spouse'},
                           {Name: 'Other', Key: 'Other'} ];

	RecreationalDrugs: any[] = [ {Name: 'No Drug Usage', Key: 'No-Drug-Usage'},
											// {Name: 'Tik-Crystal', Key: 'Tik-Crystal'},
											{Name: 'Methamphetamine', Key: 'Meth'},
											{Name: 'Cocaine', Key: 'Cocaine'},
											{Name: 'Others', Key: 'Others'} ];

   // PatientIdProof: any[] = [  {Name: 'Voter Id', Key: 'Voter_Id'},
   //                            {Name: 'Driving License', Key: 'Driving_License'},
   //                            {Name: 'Family Card', Key: 'Family_Card'},
   //                            {Name: 'Passport No', Key: 'Passport_No'},
   //                            {Name: 'Pan Card', Key: 'Pan_Card'},
   //                            {Name: 'Others', Key: 'Others'} ];

   PatientIdProof: any[] = [];
   Incomes: any[] = ['H1', 'H2', 'H3', 'Private'];

   HeparinRoutes: any[] = ['IV', 'SC', 'O', 'SH', 'A', 'ID', 'IM', 'IC', 'Unknown'];

   DynamicFGroup: FormGroup;
   HistoryFGroup: FormGroup;

   HistoryAvailable = false;
   HospitalHistoryAvailable = false;
   ClinicalHistoryAvailable = false;
   TransportHistoryAvailable = false;
   CheckListHistoryAvailable = false;

   FormLoaded = false;
   FormUploading = false;

   CurrentTabIndex = 0;
   UrlParams = null;
   ExistingPatient = false;

   PatientInfo: any;
   CurrentHospitalInfo: any = null;

   OneTimeEntryDisabled = false;
   StemiDetailsDisabled = false;
   PostThrombolysisDisabled = false;
   AdmissionDisabled = false;

   DisableMedication = true;
   DisableChecklist = false;
   MedicationHide = false;

   ReadonlyPage = false;
   ShowQr = false;
   LastActiveTab = '';
   InitialHospital = null;
   CheckListId = null;
   TransportationId = null;
   CardiacHistoryId = null;
   CoMorbidConditionId = null;
   ContactId = null;

   ContentLoading = true;

   TransportDetailsHide = false;

   SecondaryEdit = false;
   SecondaryCurrentEdit = {FormArray: '', Index: ''};
   SecondaryData: any;
   SecondaryUpdating = false;

   AmbulancesList: Hospitals[] = [];
   filteredAmbulancesList: Observable<Hospitals[]>;
   LastSelectedAmbulance = null;

   IsEMSUser = false;

   FirstRecordEdition = false;
   FirstLevelValidationFields = ['ECG_Taken_date_time', 'Stemi_Confirmed_Date_Time', 'Post_Thrombolysis_Start_Date_Time', 'Post_Thrombolysis_End_Date_Time', 'Ninety_Min_ECG_Date_Time' ];
   FirstLevelDataCollection = {Hospital_Arrival_Date_Time: '', Ambulance_Call_Date_Time: '', Ambulance_Arrival_Date_Time: '', Ambulance_Departure_Date_Time: '', NonCluster_Hospital_Arrival_Date_Time: '', NonCluster_Ambulance_Call_Date_Time: '', NonCluster_Ambulance_Arrival_Date_Time: '', NonCluster_Ambulance_Departure_Date_Time: '' };
   noFutureDate: any;
   ProofList: any[] = [];
	ReferralFacilityList: any[] = [];

	ConsentFormLoading = false;
	ECGFileLoading = false;

   constructor(
      private PatientService: PatientDetailsService,
      private LoginService: LoginManagementService,
      public Toastr: ToastrService,
      private router: Router,
      public ModalService: BsModalService,
      private dataPassingService: DataPassingService,
      private DischargeService: DischargeTransferService,
      private activatedRoute: ActivatedRoute,
		private RefFacilityService: ReferralFacilityService,
      private ProofService: IdproofManagementService ) {

      this.UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
      if (this.UserInfo.User_Type === 'PU') {
         this.ProofService.ClusterConfig_DetailedView({Cluster: this.UserInfo.Cluster}).subscribe(response => {
            if (response.Status && response.Status === true ) {
               if (response.Response && response.Response.Config_Details && typeof response.Response.Config_Details === 'object' && response.Response.Config_Details.length > 0) {
                  response.Response.Config_Details.map(obj => this.PatientIdProof.push({Name: obj.Name, Key: obj.Key_Name}) );
               }
               this.PatientIdProof = this.PatientIdProof.filter((v, i, a) => a.findIndex( t => (t.Key === v.Key)) === i);
               this.PatientIdProof.push({Name: 'Others', Key: 'Others'});
            }
         });
      } else {
         this.ProofService.IdProof_ConfigList({}).subscribe(response => {
            if (response.Status && response.Status === true ) {
               response.Response.map(obj => this.PatientIdProof.push({Name: obj.Name, Key: obj.Key_Name}) );
            }
            this.PatientIdProof = this.PatientIdProof.filter((v, i, a) => a.findIndex( t => (t.Key === v.Key)) === i);
            this.PatientIdProof.push({Name: 'Others', Key: 'Others'});
         });
      }
		this.RefFacilityService.ReferralFacilities_SimpleList({}).subscribe(response => {
			if (response.Status && response.Status === true ) {
				this.ReferralFacilityList = response.Response;
			}
		});
      this.noFutureDate = new Date();

      this.UrlParams = this.activatedRoute.snapshot.params;
      if (this.activatedRoute.snapshot.parent.url[0].path === 'Patient-View') {
         this.ReadonlyPage = true;
         this.ShowQr = true;
      }
      const ParamsArr = Object.keys(this.UrlParams);
      if (ParamsArr.length > 0 && ParamsArr.includes('Patient')) {
         this.ExistingPatient = true;
      }


      this.dataSubscription.add(
         this.dataPassingService.AllFields.subscribe( response => {
            this.AllFields = response;
            if (this.AllFields.length > 0) {
               if (!this.ExistingPatient) {
                  this.AllFieldsValues = this.AllFields.map(obj => {
                     const SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
                     obj.ThisIsTime = false;
                     obj.ParentDateKey = null;
                     obj.DefaultValue = SetValue;
                     obj.CurrentValue = SetValue;
                     obj.Disabled = false;
							if (obj.Key_Name === 'NonCluster_Hospital_Type' ||  obj.Key_Name === 'NonCluster_Hospital_Address') {
								obj.Disabled = true;
							}
                     return obj;
                  });
                  this.CurrentHospitalInfo = this.UserInfo.Hospital;
                  if (this.CurrentHospitalInfo.Country !== '5b3f0552a4ed1e0474018ef6') {
                     const Idx = this.PaymentTypes.findIndex(obj => obj.Key === 'Pm_Jay');
                     if (Idx >= 0) {
                        this.PaymentTypes.splice(Idx, 1);
                     }
                  }
                  if (this.UserInfo.Hospital.Hospital_Role === 'EMS') {
                     this.TransportDetailsHide = true;
                     this.IsEMSUser = true;
                     this.AdmissionType = this.AdmissionType.filter(obj => obj.Key === 'Direct');
                     const idx = this.AllFieldsValues.findIndex(obj => obj.Key_Name === 'Hospital_Id');
                     if (idx >= 0) {
                        this.AllFieldsValues[idx].Disabled = true;
                        this.AllFieldsValues[idx].Mandatory = false;
                     }
                  }
                  this.ActivateDynamicFGroup();
                  if (this.UserInfo.Hospital.Hospital_Role !== 'EMS') {
                     setTimeout(() => {
                        const NodeList = document.querySelectorAll('.mat-tab-label') as NodeListOf<HTMLElement>;
                        NodeList.forEach((Node, index) => {
                           if (index === 2) {
                              Node.style.display = 'none';
                           }
                        });
                     }, 200);
                     this.MedicationHide = true;
                     this.DisableMedication = false;
                  }
               } else {
                  const DataObj = { PatientId: this.UrlParams.Patient, User: this.UserInfo._id, Hospital: this.InitialHospital };
                  this.PatientService.PatientBasicDetails_View(DataObj).subscribe( PatientRes =>  {
                     if (PatientRes.Status) {

                        this.AllFieldsValues = this.AllFields.map(obj => {
                           const SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
                           obj.ThisIsTime = false;
                           obj.Disabled = false;
                           obj.ParentDateKey = null;
                           obj.DefaultValue = SetValue;
                           obj.CurrentValue = SetValue;
                           return obj;
                        });

                        this.PatientInfo = PatientRes.Response;

                        this.LastActiveTab = PatientRes.Response.LastCompletionChild;
                        this.InitialHospital = PatientRes.Response.Initiated_Hospital._id;
                        this.dataPassingService.UpdatePatientNameData(PatientRes.Response.Patient_Name);
                        this.dataPassingService.UpdatePatientUniqueData(PatientRes.Response.Patient_Unique);
                        this.PatientUpdateData(PatientRes.Response, 'Basic', false);
                        this.PatientHistoryData(PatientRes.Response);

                        if (this.PatientInfo.Initiated_Hospital.Hospital_Role === 'EMS') {
                           if (this.PatientInfo.TransferBending !== true || this.UserInfo.User_Type !== 'PU' || (this.UserInfo.User_Type === 'PU' &&  this.UserInfo.Hospital.Hospital_Role === 'EMS')) {
                              this.TransportDetailsHide = true;
                              this.IsEMSUser = true;
                              this.AdmissionType = this.AdmissionType.filter(obj => obj.Key === 'Direct');
                              const idx = this.AllFieldsValues.findIndex(obj => obj.Key_Name === 'Hospital_Id');
                              if (idx >= 0) {
                                 this.AllFieldsValues[idx].Disabled = true;
                                 this.AllFieldsValues[idx].Mandatory = false;
                              }
                           } else {
                              // this.TransportTypes.splice(0, 2);
                              // this.TransportTypes.splice(1, 3);
                           }
                        }
                        forkJoin(
                           this.PatientService.PatientFibrinolyticChecklist_View(DataObj),
                           this.PatientService.PatientMedicationDuringTransportation_View(DataObj),
                           this.PatientService.PatientCardiacHistory_View(DataObj),
                           this.PatientService.PatientCoMorbidCondition_View(DataObj),
                           this.PatientService.PatientContactDetails_View(DataObj)
                        ).subscribe( ([Res1, Res2, Res3, Res4, Res5]) => {
                           if (Res1.Status && Res2.Status) {
                              if (Res1.Response !== null) {
                                 if (Res1.Response.length >= 1 ) {
                                    Res1.Response.map(obj => {
                                       if (obj.Hospital._id === this.InitialHospital) {
                                          this.CheckListId = Res1.Response[Res1.Response.length - 1]._id;
                                       }
                                    });
                                 }
                                 this.PatientUpdateData(Res1.Response, 'CheckList', false);
                                 this.DisableFibrinolyticChecklist();
                              } else {
                                 this.DisableFibrinolyticChecklist();
                              }
                              if (Res2.Response !== null) {
                                 this.TransportationId = Res2.Response._id;
                                 this.PatientUpdateData(Res2.Response, 'Transportation', false);
                                 this.DisableMedicationTransportation();
                              } else {
                                 this.DisableMedicationTransportation();
                              }
                              if (Res3.Response !== null) {
                                 this.CardiacHistoryId = Res3.Response._id;
                                 this.PatientUpdateData(Res3.Response, 'CardiacHistory', false);
                              } else {
                                 this.CheckFieldVisibility('CardiacHistory');
                              }
                              if (Res4.Response !== null) {
                                 this.CoMorbidConditionId = Res4.Response._id;
                                 this.PatientUpdateData(Res4.Response, 'CoMorbidConditions', false);
                              }
                              if (Res5.Response !== null) {
                                 this.ContactId = Res5.Response._id;
                                 this.PatientUpdateData(Res5.Response, 'ContactDetails', false);
                              } else {
                                 this.CheckFieldVisibility('ContactDetails');
                              }
                           } else {
                              console.log('Some Error Occurred');
                           }
                        });
                     }
                  });
               }
            }
         })
      );

      this.dataSubscription.add(
         this.dataPassingService.AllValidations.subscribe( response => {
            this.AllValidations = response;
            this.ActivateDynamicFGroup();
         })
      );

      this.getScreenSize();

   }

   ngOnInit() {
      this.HistoryFGroup = new FormGroup({
         HospitalHistory: new FormArray([]),
         ClinicalHistory: new FormArray([]),
         TransportHistory: new FormArray([]),
         CheckListHistory: new FormArray([])
      });
   }

   getScreenSize(event?: any) {
      this.screenHeight = window.innerHeight - 80;
      this.screenWidth = window.innerWidth - 40;
   }

   ngOnDestroy() {
      this.subscription.unsubscribe();
      this.dataSubscription.unsubscribe();
      this.historySubscription.unsubscribe();
   }

   NotAllow(): boolean {return false; }
   ClearInput(event: KeyboardEvent): boolean {
      const Events = event.composedPath() as EventTarget[];
      const Input = Events[0] as HTMLInputElement;
      const FControl = Input.attributes as NamedNodeMap;
      const FControlName = FControl.getNamedItem('formcontrolname').textContent;
      this.DynamicFGroup.controls[FControlName].setValue(null);
      return false;
   }

   DisableMedicationTransportation() {
      let ReceivableHospital = true;
      if (this.PatientInfo.TransferBending !== undefined && this.PatientInfo.TransferBending === true && this.UserInfo.User_Type === 'PU') {
         const CheckExisting = this.PatientInfo.Hospital_History.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id);
         ReceivableHospital = CheckExisting.length === 0 ? true : false;
      } else {
         ReceivableHospital = false;
      }
      if ((ReceivableHospital || this.PatientInfo.Hospital_History.length > 1) && this.UserInfo.User_Type !== 'SA') {
         this.DisableMedication = true;
         this.AllFieldsValues.map((obj, i) => {
            if (obj.Sub_Junior_Category === 'Medication_During_Transportation') {
               this.AllFieldsValues[i].Disabled = true;
            }
         });
         if ((this.TransportationId === null && this.UserInfo.User_Type !== 'PU') || (this.TransportationId === null && this.UserInfo.User_Type === 'PU' && this.UserInfo.Hospital.Hospital_Role !== 'EMS')) {
            setTimeout(() => {
               const NodeList = document.querySelectorAll('.mat-tab-label') as NodeListOf<HTMLElement>;
               NodeList.forEach((Node, index) => {
                  if (index === 2) {
                     Node.style.display = 'none';
                  }
               });
            }, 200);
            this.MedicationHide = true;
         }
      } else {
         if (this.PatientInfo.Transport_History[0] !== undefined && this.PatientInfo.Transport_History[0].TransportMode !== null && this.PatientInfo.Transport_History[0].TransportMode !== 'Others') {
            this.DisableMedication = false;
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Junior_Category === 'Medication_During_Transportation') {
                  this.AllFieldsValues[i].Disabled = false;
               }
            });
            setTimeout(() => {
               const NodeList = document.querySelectorAll('.mat-tab-label') as NodeListOf<HTMLElement>;
               NodeList.forEach((Node, index) => {
                  if (index === 2 && !this.CheckSubCategoryVisibility('Medication_During_Transportation')) {
                     Node.style.display = 'inline-flex';
                  }
               });
            }, 200);
            this.MedicationHide = false;
         } else {
            if (this.PatientInfo.Initiated_Hospital.Hospital_Role !== 'EMS' && this.UserInfo.User_Type !== 'SA') {
               this.DisableMedication = true;
               this.AllFieldsValues.map((obj, i) => {
                  if (obj.Sub_Junior_Category === 'Medication_During_Transportation') {
                     this.AllFieldsValues[i].Disabled = true;
                  }
               });
               setTimeout(() => {
                  const NodeList = document.querySelectorAll('.mat-tab-label') as NodeListOf<HTMLElement>;
                  NodeList.forEach((Node, index) => {
                     if (index === 2) {
                        Node.style.display = 'none';
                     }
                  });
               }, 200);
               this.MedicationHide = true;
            } else {
               if (this.PatientInfo.Initiated_Hospital.Hospital_Role === 'EMS') {
                  this.DisableMedication = false;
               }
            }
         }
      }
   }

   DisableFibrinolyticChecklist() {
      let ReceivableHospital = true;
      if (this.PatientInfo.TransferBending !== undefined && this.PatientInfo.TransferBending === true && this.UserInfo.User_Type === 'PU') {
         const CheckExisting = this.PatientInfo.Hospital_History.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id);
         ReceivableHospital = CheckExisting.length === 0 ? true : false;
      } else {
         ReceivableHospital = false;
      }

      if (this.PatientInfo.IfThrombolysis || this.PatientInfo.ThrombolysisFrom !== null) {
         if (ReceivableHospital || this.InitialHospital !== this.PatientInfo.ThrombolysisFrom) {
            this.DisableChecklist = true;
         }
      }
   }


   PatientUpdateData(PatientData: any, From: string, ProceedNext: boolean) {
      let ReceivableHospital = true;
      if (this.PatientInfo.TransferBending && this.UserInfo.User_Type === 'PU') {
         const CheckExisting = this.PatientInfo.Hospital_History.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id);
         ReceivableHospital = CheckExisting.length === 0 ? true : false;
      } else {
         ReceivableHospital = false;
      }
      if (From === 'Basic') {
         const BasicDetailsKeys = Object.keys(PatientData);
         this.AllFieldsValues.map((obj, i) => {
            if (BasicDetailsKeys.includes(obj.Key_Name)) {
               this.AllFieldsValues[i].CurrentValue = PatientData[obj.Key_Name];
               this.AllFieldsValues[i].DefaultValue = PatientData[obj.Key_Name];
            } else if (obj.Key_Name === 'Hospital_Arrival_Date_Time' && From === 'Basic' && !ReceivableHospital) {
               this.AllFieldsValues[i].CurrentValue = PatientData['Initiated_Hospital_Arrival'];
               this.AllFieldsValues[i].DefaultValue = PatientData['Initiated_Hospital_Arrival'];
            } else if (obj.Key_Name === 'Patient_Admission_Type' ) {
               // if ((this.UserInfo.User_Type === 'PU' && PatientData.TransferBending
               //    && PatientData.TransferBendingTo['_id'] === this.UserInfo.Hospital._id) ||  (PatientData.Hospital_History.length > 1
               //    && (this.UserInfo.User_Type !== 'PU' || this.UserInfo.Hospital._id !== PatientData['Hospital_History'][0]['Hospital']['_id'])) ) {
               //    const FirstAdmission = PatientData['Hospital_History'][0]['Hospital']['Hospital_Role'] ? PatientData['Hospital_History'][0]['Hospital']['Hospital_Role'] : 'Direct';
               //    this.AllFieldsValues[i].CurrentValue = FirstAdmission;
               //    this.AllFieldsValues[i].DefaultValue = FirstAdmission;
               //    const GetIndex = this.AdmissionType.findIndex(obj1 => obj1.Name === FirstAdmission);
               //    if (GetIndex === -1) {
               //       this.AdmissionType.push({Name: FirstAdmission, Key: FirstAdmission});
               //    }
               // } else {
                  const FirstAdmission = PatientData['Hospital_History'][0]['Patient_Admission_Type'];
                  this.AllFieldsValues[i].CurrentValue = FirstAdmission;
                  this.AllFieldsValues[i].DefaultValue = FirstAdmission;
               // }
            }
         });

         this.QRImage = PatientData.QR_image;
         // const LocationOfInfarction = PatientData.Location_of_Infarction;
         // if (LocationOfInfarction && LocationOfInfarction !== null && LocationOfInfarction.length > 0 ) {
         //    const LocOfInfarction = LocationOfInfarction[0];
         //    const LOIKeys = Object.keys(LocOfInfarction);
         //    this.AllFieldsValues.map((obj, i) => {
         //       if (LOIKeys.includes(obj.Key_Name)) {
         //          this.AllFieldsValues[i].CurrentValue = LocOfInfarction[obj.Key_Name];
         //          this.AllFieldsValues[i].DefaultValue = LocOfInfarction[obj.Key_Name];
         //       }
         //    });
         // }
         const PostThrombolysisData = PatientData.Post_Thrombolysis_Data;
         if (PostThrombolysisData && PostThrombolysisData !== null ) {
            const PTKeys = Object.keys(PostThrombolysisData);
            this.AllFieldsValues.map((obj, i) => {
               if (PTKeys.includes(obj.Key_Name)) {
                  this.AllFieldsValues[i].CurrentValue = PostThrombolysisData[obj.Key_Name];
                  this.AllFieldsValues[i].DefaultValue = PostThrombolysisData[obj.Key_Name];
               }
            });
         }
			if (PatientData.ECG_File !== null || PatientData.consent_form !== null) {
				this.ECGFileLoading = PatientData.ECG_File !== null ? true : false;
				this.ConsentFormLoading = PatientData.consent_form !== null ? true : false;
				this.loadFiles();
			} else {
				this.ECGFileLoading = false;
				this.ConsentFormLoading = false;
			}
         // if (PatientData.ECG_File && PatientData.ECG_File !== '' && PatientData.ECG_File !== null) {
         //    this.ECGPreview = PatientData.ECG_File;
         //    this.ECGPreviewAvailable = true;
         // }
         // if (PatientData.consent_form && PatientData.consent_form !== '' && PatientData.consent_form !== null) {
         //    this.ConsentPreview = PatientData.consent_form;
         //    this.ConsentPreviewAvailable = true;
         //    if (PatientData.consent_form.includes('data:application/pdf;')) {
         //       this.ConsentIsPdf = true;
         //    }
         // }
         if (ProceedNext) {
            this.ActivateDynamicFGroup();
         }
      } else if (From === 'CheckList') {
         // Editable Form Group
         let FieldDisabled = false;
         if (this.UserInfo.User_Type === 'PU') {
            const FilterArr = PatientData.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id && i < (PatientData.length - 1) );
            FieldDisabled = FilterArr.length > 0 ? true : FieldDisabled;
         } else if (this.PatientInfo.TransferBending) {
            // FieldDisabled = true;
         }

         if (FieldDisabled || ReceivableHospital) {
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Junior_Category === 'Fibrinolytic_Checklist') {
                  this.AllFieldsValues[i].Disabled = true;
               }
            });
         }

         if (PatientData.length > 0 && this.InitialHospital === PatientData[PatientData.length - 1].Hospital._id || (this.UserInfo.User_Type === 'PU' && this.PatientInfo.TransferBending && this.PatientInfo.TransferBendingTo._id !== this.UserInfo.Hospital._id)) {
            const CheckListKeys = Object.keys(PatientData[PatientData.length - 1]);
            if (PatientData[PatientData.length - 1].Hospital._id === this.InitialHospital && !ReceivableHospital) {
               this.AllFieldsValues.map((obj, i) => {
                  if (CheckListKeys.includes(obj.Key_Name)) {
                     this.AllFieldsValues[i].CurrentValue = PatientData[PatientData.length - 1][obj.Key_Name];
                     this.AllFieldsValues[i].DefaultValue = PatientData[PatientData.length - 1][obj.Key_Name];
                  }
               });
            }
         }

         // ReadOnly Form Group
         if (this.PatientInfo.Hospital_History.length > 1 || (this.UserInfo.User_Type === 'PU' && this.PatientInfo.TransferBending && this.PatientInfo.TransferBendingTo._id === this.UserInfo.Hospital._id)) {
            this.CheckListHistoryAvailable = true;
            const arr = this.HistoryFGroup.controls['CheckListHistory'] as FormArray;
            while (0 !== arr.length) { arr.removeAt(0); }
            this.PatientInfo.Hospital_History.map( (obj, index) => {
               let hideHistory = false;
               if (this.PatientInfo.IfThrombolysis === true || this.PatientInfo.ThrombolysisFrom !== null) {
                  const idx = this.PatientInfo.Hospital_History.findIndex(hosObj => hosObj.Hospital._id === this.PatientInfo.ThrombolysisFrom);
                  if (idx >= 0) {
                     hideHistory = index <= idx ? false : true;
                  }
               }
               if (!hideHistory && (obj.Hospital._id !== this.InitialHospital || (this.UserInfo.User_Type === 'PU' && this.PatientInfo.TransferBending && this.PatientInfo.TransferBendingTo._id === this.UserInfo.Hospital._id))) {
                  const Arr = PatientData.filter(obj1 => obj1.Hospital._id === obj.Hospital._id);
                  const ChecklistData =  Arr.length > 0 ? Arr[0] : {};
                  const Key = obj.Hospital.Hospital_Role === 'EMS' ? 'E' : obj.Hospital.Hospital_Role.slice(0, 1) + obj.Hospital.Hospital_Role.slice(-1);
                  const FGroup = new FormGroup({
                     Patient: new FormControl({value: this.PatientInfo._id, disabled: true}),
                     _id: new FormControl({value: ChecklistData._id || null, disabled: true}),
                     Hospital: new FormControl({value: obj.Hospital._id, disabled: true}),
                     Hospital_Role: new FormControl({value: obj.Hospital.Hospital_Role, disabled: true}),
                     Hospital_Key: new FormControl({value: Key, disabled: true}),
                     HistoryActive: new FormControl({value: false, disabled: true}),
                     Systolic_BP_greater_than_180_mmHg: new FormControl({value: ChecklistData.Systolic_BP_greater_than_180_mmHg || null, disabled: true}),
                     Diastolic_BP_greater_than_110_mmHg: new FormControl({value: ChecklistData.Diastolic_BP_greater_than_110_mmHg || null, disabled: true}),
                     Right_Left_arm_Systolic_BP_difference_greater_than_15_mmHg: new FormControl({value: ChecklistData.Right_Left_arm_Systolic_BP_difference_greater_than_15_mmHg || null, disabled: true}),
                     History_of_structural_central_nervous_system_disease: new FormControl({value: ChecklistData.History_of_structural_central_nervous_system_disease || null, disabled: true}),
                     Significant_closed_head_facial_trauma_within_the_previous_3_months: new FormControl({value: ChecklistData.Significant_closed_head_facial_trauma_within_the_previous_3_months || null, disabled: true}),
                     Recent_major_trauma_surgery_GI_GU_bleed: new FormControl({value: ChecklistData.Recent_major_trauma_surgery_GI_GU_bleed || null, disabled: true}),
                     Bleeding_or_Clotting_problem_or_on_blood_thinners: new FormControl({value: ChecklistData.Bleeding_or_Clotting_problem_or_on_blood_thinners || null, disabled: true}),
                     CPR_greater_than_10_min: new FormControl({value: ChecklistData.CPR_greater_than_10_min || null, disabled: true}),
                     Pregnant_Female: new FormControl({value: ChecklistData.Pregnant_Female || null, disabled: true}),
                     Serious_systemic_disease: new FormControl({value: ChecklistData.Serious_systemic_disease || null, disabled: true}),
                     Does_the_Patient_have_severe_heart_failure_or_cardiogenic_shock_such_that_PCI_is_preferable: new FormControl({value: ChecklistData.Does_the_Patient_have_severe_heart_failure_or_cardiogenic_shock_such_that_PCI_is_preferable || null, disabled: true}),
                     Pulmonary_edema: new FormControl({value: ChecklistData.Pulmonary_edema || null, disabled: true}),
                     Systemic_hypoperfusion: new FormControl({value: ChecklistData.Systemic_hypoperfusion || null, disabled: true}),
							Other_contraindications_to_Lysis: new FormControl({value: ChecklistData.Other_contraindications_to_Lysis || null, disabled: true}),
                     Specify_Other_contraindications: new FormControl({value: ChecklistData.Specify_Other_contraindications || null, disabled: true}),
                     EditActivate: new FormControl({value: false, disabled: true}),
                  });
                  const FArray = this.HistoryFGroup.controls.CheckListHistory as FormArray;
                  FArray.push(FGroup);
               }
            });
         }
      } else if (From === 'ContactDetails') {
         if (ReceivableHospital) {
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Category === 'Contact_Details') {
                  this.AllFieldsValues[i].Disabled = true;
               }
            });
         }
         const BasicDetailsKeys = Object.keys(PatientData);
         this.AllFieldsValues.map((obj, i) => {
            if (BasicDetailsKeys.includes(obj.Key_Name)) {
               this.AllFieldsValues[i].CurrentValue = PatientData[obj.Key_Name];
               this.AllFieldsValues[i].DefaultValue = PatientData[obj.Key_Name];
            }
         });
         if (PatientData !== null && PatientData.Select_Patient_Id_Proof !== undefined && PatientData.Select_Patient_Id_Proof !== '') {
            const proofKey = PatientData.Select_Patient_Id_Proof;
            const proofName = proofKey.replace(/_/g, ' ');
            this.PatientIdProof.push({Name: proofName, Key: proofKey});
            this.PatientIdProof = this.PatientIdProof.filter((v, i, a) => a.findIndex( t => (t.Key === v.Key)) === i);
         }
         if (PatientData.Upload_Aadhaar && PatientData.Upload_Aadhaar !== '' && PatientData.Upload_Aadhaar !== null) {
            this.AadhaarPreview = PatientData.Upload_Aadhaar;
            this.AadhaarPreviewAvailable = true;
         }
         if (PatientData.Upload_Id_Proof && PatientData.Upload_Id_Proof !== '' && PatientData.Upload_Id_Proof !== null) {
            this.IdProofPreview = PatientData.Upload_Id_Proof;
            this.IdProofPreviewAvailable = true;
         }
      } else if (From === 'CardiacHistory') {
         if (ReceivableHospital) {
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Category === 'Cardiac_History') {
                  this.AllFieldsValues[i].Disabled = true;
               }
            });
         }
         const BasicDetailsKeys = Object.keys(PatientData);
         this.AllFieldsValues.map((obj, i) => {
            if (BasicDetailsKeys.includes(obj.Key_Name)) {
               this.AllFieldsValues[i].CurrentValue = PatientData[obj.Key_Name];
               this.AllFieldsValues[i].DefaultValue = PatientData[obj.Key_Name];
            }
         });
      } else if (From === 'CoMorbidConditions') {
         if (ReceivableHospital) {
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Category === 'Co-Morbid_Conditions') {
                  this.AllFieldsValues[i].Disabled = true;
               }
            });
         }
         const BasicDetailsKeys = Object.keys(PatientData);
         this.AllFieldsValues.map((obj, i) => {
            if (BasicDetailsKeys.includes(obj.Key_Name)) {
               this.AllFieldsValues[i].CurrentValue = PatientData[obj.Key_Name];
               this.AllFieldsValues[i].DefaultValue = PatientData[obj.Key_Name];
            }
         });
      } else if (From === 'Transportation') {
         const DisableTransportation = this.UserInfo.Hospital !== undefined && this.UserInfo.Hospital !== null && PatientData.Hospital === this.UserInfo.Hospital._id && this.InitialHospital === this.UserInfo.Hospital._id ? false : true;
         if (DisableTransportation && PatientData !== null && this.UserInfo.User_Type !== 'SA') {
            this.DisableMedication = true;
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Junior_Category === 'Medication_During_Transportation') {
                  this.AllFieldsValues[i].Disabled = true;
               }
            });
         } else {
            this.DisableMedication = false;
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Junior_Category === 'Medication_During_Transportation') {
                  this.AllFieldsValues[i].Disabled = false;
               }
            });
         }
         const BasicDetailsKeys = Object.keys(PatientData);
         this.AllFieldsValues.map((obj, i) => {
            if (BasicDetailsKeys.includes(obj.Key_Name)) {
               this.AllFieldsValues[i].CurrentValue = PatientData[obj.Key_Name];
               this.AllFieldsValues[i].DefaultValue = PatientData[obj.Key_Name];
            }
         });
      } else {
         const BasicDetailsKeys = Object.keys(PatientData);
         this.AllFieldsValues.map((obj, i) => {
            if (BasicDetailsKeys.includes(obj.Key_Name)) {
               this.AllFieldsValues[i].CurrentValue = PatientData[obj.Key_Name];
               this.AllFieldsValues[i].DefaultValue = PatientData[obj.Key_Name];
            } else if (obj.Key_Name === 'Hospital_Arrival_Date_Time' && From === 'Basic') {
               this.AllFieldsValues[i].CurrentValue = PatientData['Initiated_Hospital_Arrival'];
               this.AllFieldsValues[i].DefaultValue = PatientData['Initiated_Hospital_Arrival'];
            }
         });
      }
   }

	loadFiles() {
		if (this.PatientInfo._id && this.UserInfo._id) {
			const DataObject = {Patient: this.PatientInfo._id, User: this.UserInfo._id};
			this.PatientService.LoadBasicPage_Files(DataObject).subscribe( Res =>  {
				if (Res.Status) {
					if (Res.Response.ECG_File && Res.Response.ECG_File !== '' && Res.Response.ECG_File !== null) {
						this.ECGPreview = Res.Response.ECG_File;
						this.ECGPreviewAvailable = true;
						this.ECGFileLoading = false;
					}
					if (Res.Response.consent_form && Res.Response.consent_form !== '' && Res.Response.consent_form !== null) {
						this.ConsentPreview = Res.Response.consent_form;
						this.ConsentPreviewAvailable = true;
						this.ConsentFormLoading = false;
						if (Res.Response.consent_form.includes('data:application/pdf;')) {
							this.ConsentIsPdf = true;
						}
					}
				}
			});
		}
	}

   CheckFieldVisibility(From: string) {
      let ReceivableHospital = true;
      if (this.PatientInfo.TransferBending && this.UserInfo.User_Type === 'PU') {
         const CheckExisting = this.PatientInfo.Hospital_History.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id);
         ReceivableHospital = CheckExisting.length === 0 ? true : false;
      } else {
         ReceivableHospital = false;
      }
      if (From === 'CardiacHistory') {
         if (ReceivableHospital) {
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Category === 'Cardiac_History') {
                  this.AllFieldsValues[i].Disabled = true;
               }
            });
         }
      }
      if (From === 'ContactDetails') {
         if (ReceivableHospital) {
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Category === 'Contact_Details') {
                  this.AllFieldsValues[i].Disabled = true;
               }
            });
         }
      }
   }

   PatientHistoryData(PatientData: any) {
      this.HistoryAvailable = true;
      const HospitalDetails = PatientData.Hospital_History;

      if (PatientData.TransferBending && this.UserInfo.User_Type === 'PU') {
         const CheckExisting = HospitalDetails.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id);
         if (CheckExisting.length === 0) {
            this.CurrentHospitalInfo = this.UserInfo.Hospital;
         } else {
            this.CurrentHospitalInfo = PatientData.Initiated_Hospital;
         }
      } else {
         this.CurrentHospitalInfo = PatientData.Initiated_Hospital;
      }
      if (this.CurrentHospitalInfo.Country !== '5b3f0552a4ed1e0474018ef6') {
         const Idx = this.PaymentTypes.findIndex(obj => obj.Key === 'Pm_Jay');
         if (Idx >= 0) {
            this.PaymentTypes.splice(Idx, 1);
         }
      }

      let ReceivableHospital = true;
      if (PatientData.TransferBending && this.UserInfo.User_Type === 'PU') {
         const CheckExisting = HospitalDetails.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id);
         ReceivableHospital = CheckExisting.length === 0 ? true : false;
      } else {
         ReceivableHospital = false;
      }


      // Hospital History ReadOnly
      // Check Stemi Disable
      if (PatientData.Stemi_Confirmed_Hospital && PatientData.Stemi_Confirmed_Hospital !== null && PatientData.Stemi_Confirmed_Hospital._id) {
         if (PatientData.Stemi_Confirmed_Hospital._id !== PatientData.Initiated_Hospital._id || (this.UserInfo.User_Type === 'PU' && PatientData.TransferBending && PatientData.TransferBendingTo['_id'] === this.UserInfo.Hospital._id)) {
            if (this.UserInfo.User_Type !== 'SA') {
               this.StemiDetailsDisabled = true;
            }
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Junior_Category === 'STEMI_Details' && this.UserInfo.User_Type !== 'SA' ) {
                  this.AllFieldsValues[i].Disabled = true;
               }
            });
         }
      }
      if (PatientData.Hospital_History.length > 1 && this.UserInfo.User_Type === 'SA') {
         this.FirstRecordEdition = true;
         this.FirstLevelDataCollection.Hospital_Arrival_Date_Time = PatientData.Hospital_History[0].Hospital_Arrival_Date_Time || '';
         this.FirstLevelDataCollection.Ambulance_Call_Date_Time = PatientData.Transport_History[0].Ambulance_Call_Date_Time || '';
         this.FirstLevelDataCollection.Ambulance_Arrival_Date_Time = PatientData.Transport_History[0].Ambulance_Arrival_Date_Time || '';
         this.FirstLevelDataCollection.Ambulance_Departure_Date_Time = PatientData.Transport_History[0].Ambulance_Departure_Date_Time || '';
         this.FirstLevelDataCollection.NonCluster_Hospital_Arrival_Date_Time = PatientData.NonCluster_Hospital_Arrival_Date_Time || '';
			this.FirstLevelDataCollection.NonCluster_Ambulance_Call_Date_Time = PatientData.NonCluster_Ambulance_Call_Date_Time || '';
         this.FirstLevelDataCollection.NonCluster_Ambulance_Arrival_Date_Time = PatientData.NonCluster_Ambulance_Arrival_Date_Time || '';
         this.FirstLevelDataCollection.NonCluster_Ambulance_Departure_Date_Time = PatientData.NonCluster_Ambulance_Departure_Date_Time || '';

      }
      if (PatientData.Hospital_History.length > 1 || (this.UserInfo.User_Type === 'PU' && PatientData.TransferBending && PatientData.TransferBendingTo['_id'] === this.UserInfo.Hospital._id)) {
         this.AdmissionDisabled = true;
         this.PostThrombolysisDisabled = true;
         this.AllFieldsValues.map((obj, i) => {
            if (obj.Sub_Junior_Category === 'Post_Thrombolysis' && this.UserInfo.User_Type !== 'SA') {
               this.AllFieldsValues[i].Disabled = true;
            }
            if (obj.Key_Name === 'Patient_Admission_Type' ) {
               this.AllFieldsValues[i].Disabled = true;
            }
            if (obj.Key_Name === 'Stemi_Confirmed' ) {
               this.AllFieldsValues[i].Disabled = true;
            }
            if (obj.Key_Name === 'Symptom_Onset_Date_Time' && this.UserInfo.User_Type !== 'SA' ) {
               this.AllFieldsValues[i].Disabled = true;
            }
				if (obj.Key_Name === 'First_Medical_Contact_Date_Time' && this.UserInfo.User_Type !== 'SA' ) {
               this.AllFieldsValues[i].Disabled = true;
            }
         });
      }
      if (this.UserInfo.User_Type === 'PU' && PatientData.Hospital_History.length > 1) {
         const FilterArr = HospitalDetails.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id && i < (HospitalDetails.length - 1) );
         this.ReadonlyPage = FilterArr.length > 0 ? true : this.ReadonlyPage;
      }
      if ((HospitalDetails.length > 1 || (HospitalDetails.length === 1 && PatientData.TransferBending && this.UserInfo.User_Type === 'PU' && PatientData.Initiated_Hospital._id !== this.UserInfo.Hospital._id)) && PatientData.If_NonCluster !== undefined && PatientData.If_NonCluster === true) {
			this.HospitalHistoryAvailable = true;
         let AnyTimeValue = null;
			let AnyTimeValueOne = null;
         let AnyTimeValueTwo = null;
         let AnyTimeValueThree = null;
			let NonCluster_HospitalType = PatientData.NonCluster_Hospital_Type;
			let NonCluster_HospitalAddress = PatientData.NonCluster_Hospital_Address;
			if (typeof PatientData.NonCluster_Hospital_Name === 'object' && PatientData.NonCluster_Hospital_Name !== null && PatientData.NonCluster_Hospital_Name.Hospital_Type) {
            NonCluster_HospitalType = PatientData.NonCluster_Hospital_Name.Hospital_Type;
         }
			if (typeof PatientData.NonCluster_Hospital_Name === 'object' && PatientData.NonCluster_Hospital_Name !== null && PatientData.NonCluster_Hospital_Name.Hospital_Address) {
            NonCluster_HospitalAddress = PatientData.NonCluster_Hospital_Name.Hospital_Address;
         }
         if (PatientData.NonCluster_Hospital_Arrival_Date_Time && PatientData.NonCluster_Hospital_Arrival_Date_Time !== null && PatientData.NonCluster_Hospital_Arrival_Date_Time !== '') {
            const DateTime = new Date(PatientData.NonCluster_Hospital_Arrival_Date_Time);
            AnyTimeValue  = DateTime.getHours() + ':' + DateTime.getMinutes();
         }
			if (PatientData.NonCluster_Ambulance_Call_Date_Time && PatientData.NonCluster_Ambulance_Call_Date_Time !== null && PatientData.NonCluster_Ambulance_Call_Date_Time !== '') {
            const DateTime = new Date(PatientData.NonCluster_Ambulance_Call_Date_Time);
            AnyTimeValueOne  = DateTime.getHours() + ':' + DateTime.getMinutes();
         }
			if (PatientData.NonCluster_Ambulance_Arrival_Date_Time && PatientData.NonCluster_Ambulance_Arrival_Date_Time !== null && PatientData.NonCluster_Ambulance_Arrival_Date_Time !== '') {
            const DateTime = new Date(PatientData.NonCluster_Ambulance_Arrival_Date_Time);
            AnyTimeValueTwo  = DateTime.getHours() + ':' + DateTime.getMinutes();
         }
			if (PatientData.NonCluster_Ambulance_Departure_Date_Time && PatientData.NonCluster_Ambulance_Departure_Date_Time !== null && PatientData.NonCluster_Ambulance_Departure_Date_Time !== '') {
            const DateTime = new Date(PatientData.NonCluster_Ambulance_Departure_Date_Time);
            AnyTimeValueThree  = DateTime.getHours() + ':' + DateTime.getMinutes();
         }

         const FGroup = new FormGroup({
            Patient: new FormControl({value: PatientData._id, disabled: true}), 
            _id: new FormControl({value: null, disabled: true}),
            Hospital: new FormControl({value: null, disabled: true}),
            Hospital_Role: new FormControl({value: 'Referral Facility', disabled: true}),
            Hospital_Key: new FormControl({value: 'RF', disabled: true}),
            HistoryActive: new FormControl({value: false, disabled: true}),
            NonCluster_Hospital_Name: new FormControl({value: PatientData.NonCluster_Hospital_Name, disabled: true}),
				NonCluster_Hospital_Name_NonSpoke: new FormControl({value: PatientData.NonCluster_Hospital_Name_NonSpoke, disabled: true}),
            NonCluster_Hospital_Type: new FormControl({value: NonCluster_HospitalType, disabled: true}),
            NonCluster_Hospital_Address: new FormControl({value: NonCluster_HospitalAddress, disabled: true}),
				NonCluster_TransportMode: new FormControl({value: PatientData.NonCluster_TransportMode, disabled: true}),
            NonCluster_TransportMode_Other: new FormControl({value: PatientData.NonCluster_TransportMode_Other, disabled: true}),
            NonCluster_Hospital_Arrival_Date_Time: new FormControl({value: PatientData.NonCluster_Hospital_Arrival_Date_Time, disabled: true}),
            NonCluster_Hospital_Arrival_Time: new FormControl({value: AnyTimeValue, disabled: true}),
				NonCluster_Ambulance_Call_Date_Time: new FormControl({value: PatientData.NonCluster_Ambulance_Call_Date_Time, disabled: true}),
            NonCluster_Ambulance_Call_Time: new FormControl({value: AnyTimeValueOne, disabled: true}),
				NonCluster_Ambulance_Arrival_Date_Time: new FormControl({value: PatientData.NonCluster_Ambulance_Arrival_Date_Time, disabled: true}),
            NonCluster_Ambulance_Arrival_Time: new FormControl({value: AnyTimeValueTwo, disabled: true}),
				NonCluster_Ambulance_Departure_Date_Time: new FormControl({value: PatientData.NonCluster_Ambulance_Departure_Date_Time, disabled: true}),
            NonCluster_Ambulance_Departure_Time: new FormControl({value: AnyTimeValueThree, disabled: true}),
            EditActivate: new FormControl({value: false, disabled: true}),
         });
         const FArray = this.HistoryFGroup.controls.HospitalHistory as FormArray;
         FArray.push(FGroup);
      }
      if ( HospitalDetails.length > 1 || (HospitalDetails.length === 1 && PatientData.TransferBending && this.UserInfo.User_Type === 'PU' && PatientData.Initiated_Hospital._id !== this.UserInfo.Hospital._id) ) {
         this.HospitalHistoryAvailable = true;
         HospitalDetails.map((obj, i) => {
            if (PatientData.TransferBending === true || ((PatientData.TransferBending === false || PatientData.TransferBending === null) && HospitalDetails.length - 1) > i ) {
               const Key = obj.Hospital.Hospital_Role === 'EMS' ? 'E' : obj.Hospital.Hospital_Role.slice(0, 1) + obj.Hospital.Hospital_Role.slice(-1);
               let ArrivalTimeValue = null;
               if (obj.Hospital_Arrival_Date_Time && obj.Hospital_Arrival_Date_Time !== null && obj.Hospital_Arrival_Date_Time !== '') {
                  const DateTime = new Date(obj.Hospital_Arrival_Date_Time);
                  ArrivalTimeValue  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               const FGroup = new FormGroup({
                  Patient: new FormControl({value: PatientData._id, disabled: true}), 
                  _id: new FormControl({value: obj._id, disabled: true}),
                  Hospital: new FormControl({value: obj.Hospital._id, disabled: true}),
                  Hospital_Role: new FormControl({value: obj.Hospital.Hospital_Role, disabled: true}),
                  Hospital_Key: new FormControl({value: Key, disabled: true}),
                  HistoryActive: new FormControl({value: false, disabled: true}),
                  Hospital_Name: new FormControl({value: obj.Hospital.Hospital_Name, disabled: true}),
                  Hospital_Address: new FormControl({value: obj.Hospital.Address, disabled: true}),
                  Hospital_Arrival_Date_Time: new FormControl({value: obj.Hospital_Arrival_Date_Time, disabled: true}),
                  Hospital_Arrival_Time: new FormControl({value: ArrivalTimeValue, disabled: true}),
                  EditActivate: new FormControl({value: false, disabled: true}),
               });
               const FArray = this.HistoryFGroup.controls.HospitalHistory as FormArray;
               FArray.push(FGroup);
            }
         });
      }
      // Hospital History Editable
      if (HospitalDetails && HospitalDetails !== null && HospitalDetails.length > 0 ) {
         const Hospital = HospitalDetails[HospitalDetails.length - 1];
         if (this.UserInfo.User_Type !== 'PU' || PatientData.TransferBending === false ||  PatientData.TransferBending === null || (this.UserInfo.User_Type === 'PU' && Hospital.Hospital._id === this.UserInfo.Hospital._id)) {
            const THKeys = Object.keys(Hospital);
            let Length = 0;
            if (this.UserInfo.User_Type === 'PU') {
               const FilterArr = HospitalDetails.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id && i < (HospitalDetails.length - 1) );
               Length = FilterArr.length;
            }
            this.AllFieldsValues.map((obj, i) => {
               if (THKeys.includes(obj.Key_Name)) {
                  this.AllFieldsValues[i].Disabled = Length > 0 ? true : obj.Disabled;
                  this.AllFieldsValues[i].CurrentValue = Hospital[obj.Key_Name];
                  this.AllFieldsValues[i].DefaultValue = Hospital[obj.Key_Name];
               }
            });
         }
      }


      // Transport History ReadOnly
      const TransportDetails = PatientData.Transport_History;
      if ( TransportDetails.length > 1 || (TransportDetails.length === 1 && PatientData.TransferBending && this.UserInfo.User_Type === 'PU' && PatientData.Initiated_Hospital._id !== this.UserInfo.Hospital._id) ) {
         this.TransportHistoryAvailable = true;
         TransportDetails.map((obj, i) => {
            if ((PatientData.TransferBending === true && ReceivableHospital) || (!ReceivableHospital && (TransportDetails.length - 1) > i) || ((PatientData.TransferBending === false || PatientData.TransferBending === null) && (TransportDetails.length - 1) > i ) ) {
               if (obj.Transport_To_Hospital.Hospital_Role !== 'EMS') {
                  const Key = obj.Transport_To_Hospital.Hospital_Role === 'EMS' ? 'E' : obj.Transport_To_Hospital.Hospital_Role.slice(0, 1) + obj.Transport_To_Hospital.Hospital_Role.slice(-1);
                  let CallTimeValue = null;
                  if (obj.Ambulance_Call_Date_Time && obj.Ambulance_Call_Date_Time !== null && obj.Ambulance_Call_Date_Time !== '') {
                     const DateTime = new Date(obj.Ambulance_Call_Date_Time);
                     CallTimeValue  = DateTime.getHours() + ':' + DateTime.getMinutes();
                  }
                  let ArrivalTimeValue = null;
                  if (obj.Ambulance_Arrival_Date_Time && obj.Ambulance_Arrival_Date_Time !== null && obj.Ambulance_Arrival_Date_Time !== '') {
                     const DateTime = new Date(obj.Ambulance_Arrival_Date_Time);
                     ArrivalTimeValue  = DateTime.getHours() + ':' + DateTime.getMinutes();
                  }
                  let DepartureTimeValue = null;
                  if (obj.Ambulance_Departure_Date_Time && obj.Ambulance_Departure_Date_Time !== null && obj.Ambulance_Departure_Date_Time !== '') {
                     const DateTime = new Date(obj.Ambulance_Departure_Date_Time);
                     DepartureTimeValue  = DateTime.getHours() + ':' + DateTime.getMinutes();
                  }
                  let ClusterAmbulance = null;
                  if (obj.ClusterAmbulance && obj.ClusterAmbulance !== null && obj.ClusterAmbulance !== '') {
                     ClusterAmbulance  = obj.ClusterAmbulance;
                  }
                  const FGroup = new FormGroup({
                     Patient: new FormControl({value: PatientData._id, disabled: true}),
                     _id: new FormControl({value: obj._id, disabled: true}),
                     Hospital: new FormControl({value: obj.Transport_To_Hospital._id, disabled: true}),
                     Hospital_Role: new FormControl({value: obj.Transport_To_Hospital.Hospital_Role, disabled: true}),
                     Hospital_Key: new FormControl({value: Key, disabled: true}),
                     HistoryActive: new FormControl({value: false, disabled: true}),
                     TransportMode: new FormControl({value: obj.TransportMode, disabled: true}),
                     TransportMode_Other: new FormControl({value: obj.TransportMode_Other, disabled: true}),
                     ClusterAmbulance: new FormControl({value: ClusterAmbulance, disabled: true}),
                     Ambulance_Call_Date_Time: new FormControl({value: obj.Ambulance_Call_Date_Time, disabled: true}),
                     Patient_Ambulance_Call_Time: new FormControl({value: CallTimeValue, disabled: true}),
                     Ambulance_Arrival_Date_Time: new FormControl({value: obj.Ambulance_Arrival_Date_Time, disabled: true}),
                     Patient_Ambulance_Arrival_Time: new FormControl({value: ArrivalTimeValue, disabled: true}),
                     Ambulance_Departure_Date_Time: new FormControl({value: obj.Ambulance_Departure_Date_Time, disabled: true}),
                     Patient_Ambulance_Departure_Time: new FormControl({value: DepartureTimeValue, disabled: true}),
                     EditActivate: new FormControl({value: false, disabled: true}),
                  });
                  const FArray = this.HistoryFGroup.controls.TransportHistory as FormArray;
                  FArray.push(FGroup);
               }
            }
         });
      }
      // Transport History Editable
      if (TransportDetails && TransportDetails !== null && TransportDetails.length > 0 ) {
         const Transport = TransportDetails[TransportDetails.length - 1];
         // if (this.UserInfo.User_Type !== 'PU' || PatientData.TransferBending === false || (this.UserInfo.User_Type === 'PU' && Transport.Transport_To_Hospital._id === this.UserInfo.Hospital._id)) {
         const THKeys = Object.keys(Transport);

         let Length = 0;
         if (this.UserInfo.User_Type === 'PU') {
            const FilterArr = TransportDetails.filter((obj, i) => obj.Transport_To_Hospital._id === this.UserInfo.Hospital._id && i < (TransportDetails.length - 1) );
            Length = FilterArr.length;
         }
         this.AllFieldsValues.map((obj, i) => {
            if (THKeys.includes(obj.Key_Name)) {
               if (this.UserInfo.User_Type !== 'SA' && this.TransportHistoryAvailable) {
                  this.AllFieldsValues[i].Disabled = true;
               } else {
                  this.AllFieldsValues[i].Disabled = Length > 0 ? true : false;
               }
               const LastHospitalIsEMS = PatientData.Initiated_Hospital.Hospital_Role === 'EMS' ? true : false;
               if (PatientData.TransferBending !== true || this.UserInfo.User_Type !== 'PU' || !ReceivableHospital) {
                  this.AllFieldsValues[i].CurrentValue = Transport[obj.Key_Name];
                  this.AllFieldsValues[i].DefaultValue = Transport[obj.Key_Name];
                  if (this.UserInfo.User_Type === 'SA' && (this.TransportHistoryAvailable || PatientData.TransferBending === true)) {
                     if (this.AllFieldsValues[i].Key_Name === 'TransportMode' || this.AllFieldsValues[i].Key_Name === 'ClusterAmbulance') {
                        this.AllFieldsValues[i].Disabled = true;
                     }
                  }
               } else if (!LastHospitalIsEMS && PatientData.TransferBending === true && this.UserInfo.User_Type === 'PU' && ReceivableHospital && PatientData.DischargeTransferId && PatientData.DischargeTransferId !== null) {
                  if (this.AllFieldsValues[i].Key_Name === 'TransportMode') {
                     this.AllFieldsValues[i].CurrentValue = PatientData.DischargeTransferId.Transport_Vehicle;
                     this.AllFieldsValues[i].DefaultValue = PatientData.DischargeTransferId.Transport_Vehicle;
                     this.AllFieldsValues[i].Disabled = true;
                  }
                  if (this.AllFieldsValues[i].Key_Name === 'TransportMode_Other') {
                     this.AllFieldsValues[i].CurrentValue = PatientData.DischargeTransferId.Transport_Vehicle_Other;
                     this.AllFieldsValues[i].DefaultValue = PatientData.DischargeTransferId.Transport_Vehicle_Other;
                     this.AllFieldsValues[i].Disabled = true;
                  }
                  if (this.AllFieldsValues[i].Key_Name === 'ClusterAmbulance') {
                     this.AllFieldsValues[i].CurrentValue = PatientData.DischargeTransferId.Discharge_Cluster_Ambulance;
                     this.AllFieldsValues[i].DefaultValue = PatientData.DischargeTransferId.Discharge_Cluster_Ambulance;
                     this.AllFieldsValues[i].Disabled = true;
                  }
                  if (this.AllFieldsValues[i].Key_Name === 'Ambulance_Call_Date_Time') {
                     this.AllFieldsValues[i].CurrentValue = PatientData.DischargeTransferId.Discharge_Ambulance_Call_Date_Time;
                     this.AllFieldsValues[i].DefaultValue = PatientData.DischargeTransferId.Discharge_Ambulance_Call_Date_Time;
                  }
                  if (this.AllFieldsValues[i].Key_Name === 'Ambulance_Arrival_Date_Time') {
                     this.AllFieldsValues[i].CurrentValue = PatientData.DischargeTransferId.Discharge_Ambulance_Arrival_Date_Time;
                     this.AllFieldsValues[i].DefaultValue = PatientData.DischargeTransferId.Discharge_Ambulance_Arrival_Date_Time;
                  }
                  if (this.AllFieldsValues[i].Key_Name === 'Ambulance_Departure_Date_Time') {
                     this.AllFieldsValues[i].CurrentValue = PatientData.DischargeTransferId.Discharge_Ambulance_Departure_Date_Time;
                     this.AllFieldsValues[i].DefaultValue = PatientData.DischargeTransferId.Discharge_Ambulance_Departure_Date_Time;
                  }
               } else if (LastHospitalIsEMS && PatientData.TransferBending === true && this.UserInfo.User_Type === 'PU' && ReceivableHospital ) {
                  if (this.AllFieldsValues[i].Key_Name === 'TransportMode') {
                     this.AllFieldsValues[i].CurrentValue = PatientData.DischargeTransferId.Transport_Vehicle;
                     this.AllFieldsValues[i].DefaultValue = PatientData.DischargeTransferId.Transport_Vehicle;
                     this.AllFieldsValues[i].Disabled = true;
                  }
                  if (this.AllFieldsValues[i].Key_Name === 'ClusterAmbulance') {
                     this.AllFieldsValues[i].CurrentValue = HospitalDetails[HospitalDetails.length - 1].Hospital;
                     this.AllFieldsValues[i].DefaultValue = HospitalDetails[HospitalDetails.length - 1].Hospital;
                     this.AllFieldsValues[i].Disabled = true;
                  }
                  if (this.AllFieldsValues[i].Key_Name === 'Ambulance_Call_Date_Time') {
                     this.AllFieldsValues[i].CurrentValue = PatientData.EMS_Ambulance_Call_Date_Time || '';
                     this.AllFieldsValues[i].DefaultValue = PatientData.EMS_Ambulance_Call_Date_Time || '';
                  }
                  if (this.AllFieldsValues[i].Key_Name === 'Ambulance_Arrival_Date_Time') {
                     this.AllFieldsValues[i].CurrentValue = PatientData.Initiated_Hospital_Arrival || '';
                     this.AllFieldsValues[i].DefaultValue = PatientData.Initiated_Hospital_Arrival || '';
                  }
                  if (this.AllFieldsValues[i].Key_Name === 'Ambulance_Departure_Date_Time') {
                     this.AllFieldsValues[i].CurrentValue = PatientData.EMS_Ambulance_Departure_Date_Time || '';
                     this.AllFieldsValues[i].DefaultValue = PatientData.EMS_Ambulance_Departure_Date_Time || '';
                  }
               }
            }
         });
         // }
      }


      // Clinical Examinations History ReadOnly
      const ClinicalExaminations = PatientData.Clinical_Examination_History;
      if ( ClinicalExaminations.length > 1 || (ClinicalExaminations.length === 1 && PatientData.TransferBending && this.UserInfo.User_Type === 'PU' && PatientData.Initiated_Hospital._id !== this.UserInfo.Hospital._id) ) {
         this.ClinicalHistoryAvailable = true;
         ClinicalExaminations.map((obj, i) => {
            if ((PatientData.TransferBending === true && ReceivableHospital) || (!ReceivableHospital && (ClinicalExaminations.length - 1) > i) || ((PatientData.TransferBending === false || PatientData.TransferBending === null)  && (ClinicalExaminations.length - 1) > i ) ) {
               const Key = obj.Hospital.Hospital_Role === 'EMS' ? 'E' : obj.Hospital.Hospital_Role.slice(0, 1) + obj.Hospital.Hospital_Role.slice(-1);
               const FGroup = new FormGroup({
                  Patient: new FormControl({value: PatientData._id, disabled: true}),
                  _id: new FormControl({value: obj._id, disabled: true}),
                  Hospital: new FormControl({value: obj.Hospital._id, disabled: true}),
                  Hospital_Role: new FormControl({value: obj.Hospital.Hospital_Role, disabled: true}),
                  Hospital_Key: new FormControl({value: Key, disabled: true}),
                  HistoryActive: new FormControl({value: false, disabled: true}),
                  Patient_Height: new FormControl({value: obj.Patient_Height, disabled: true}),
                  Patient_Weight: new FormControl({value: obj.Patient_Weight, disabled: true}),
                  BMI: new FormControl({value: obj.BMI, disabled: true}),
                  BP_Systolic: new FormControl({value: obj.BP_Systolic, disabled: true}),
                  BP_Diastolic: new FormControl({value: obj.BP_Diastolic, disabled: true}),
                  Heart_Rate: new FormControl({value: obj.Heart_Rate, disabled: true}),
                  SP_O2: new FormControl({value: obj.SP_O2, disabled: true}),
                  Abdominal_Girth: new FormControl({value: obj.Abdominal_Girth, disabled: true}),
                  Kilip_Class: new FormControl({value: obj.Kilip_Class, disabled: true}),
                  EditActivate: new FormControl({value: false, disabled: true}),
               });
               const FArray = this.HistoryFGroup.controls.ClinicalHistory as FormArray;
               FArray.push(FGroup);
            }
         });
      }
      // Clinical Examinations History Editable
      if (ClinicalExaminations && ClinicalExaminations !== null && ClinicalExaminations.length > 0 ) {
         const ClinicalExam = ClinicalExaminations[ClinicalExaminations.length - 1];
         // if (this.UserInfo.User_Type !== 'PU' || PatientData.TransferBending === false || (this.UserInfo.User_Type === 'PU' && ClinicalExam.Hospital._id === this.UserInfo.Hospital._id)) {
         const CEKeys = Object.keys(ClinicalExam);
         let Length = 0;
         if (this.UserInfo.User_Type === 'PU') {
            const FilterArr = ClinicalExaminations.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id && i < (ClinicalExaminations.length - 1) );
            Length = FilterArr.length;
         }
         this.AllFieldsValues.map((obj, i) => {
            if (CEKeys.includes(obj.Key_Name)) {
               this.AllFieldsValues[i].Disabled = Length > 0 ? true : false;
               if (PatientData.TransferBending !== true || this.UserInfo.User_Type !== 'PU' || !ReceivableHospital) {
                  this.AllFieldsValues[i].CurrentValue = ClinicalExam[obj.Key_Name];
                  this.AllFieldsValues[i].DefaultValue = ClinicalExam[obj.Key_Name];
               }
               if (ReceivableHospital && this.UserInfo.User_Type === 'PU' && (obj.Key_Name === 'Patient_Height' || obj.Key_Name === 'Patient_Weight' || obj.Key_Name === 'BMI' || obj.Key_Name === 'Abdominal_Girth')) {
                  this.AllFieldsValues[i].CurrentValue = ClinicalExam[obj.Key_Name];
                  this.AllFieldsValues[i].DefaultValue = ClinicalExam[obj.Key_Name];
               }
            }
         });
         // }
      }

      setTimeout(() => {
         if (this.LastActiveTab === 'Basic_Details' && !this.ReadonlyPage && this.CurrentTabIndex === 0 && HospitalDetails.length === 1 && !ReceivableHospital) {
            const KeyData = this.AllFields.filter(obj => obj.Sub_Category === 'Fibrinolytic_Checklist' && obj.Visibility === true);
            const KeyData1 = this.AllFields.filter(obj => obj.Sub_Category === 'Medication_During_Transportation' && obj.Visibility === true);
            const KeyData2 = this.AllFields.filter(obj => obj.Sub_Category === 'Cardiac_History' && obj.Visibility === true);
            const KeyData3 = this.AllFields.filter(obj => obj.Sub_Category === 'Co-Morbid_Conditions' && obj.Visibility === true);
            const KeyData4 = this.AllFields.filter(obj => obj.Sub_Category === 'Contact_Details' && obj.Visibility === true);
            if (KeyData.length > 0) {
               this.CurrentTabIndex = 1;
            } else if (KeyData1.length > 0) {
               this.CurrentTabIndex = 2;
            } else if (KeyData2.length > 0) {
               this.CurrentTabIndex = 3;
            } else if (KeyData3.length > 0) {
               this.CurrentTabIndex = 4;
            } else if (KeyData4.length > 0) {
               this.CurrentTabIndex = 5;
            } else {
               this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                  this.router.navigate(['/Patient-Manage/Thrombolysis', this.UrlParams.Patient])
               );
            }
         }
         this.ActivateDynamicFGroup();
      }, 100);
   }


   TabChangeEvent(event: any) {
      if (!this.CheckSubCategoryVisibility(this.TabsList[event])) {
         this.CurrentTabIndex = event;
         if (event >= 0) {
            this.DynamicFGroup.reset({}, { emitEvent: false });
            this.subscription.unsubscribe();
            this.subscription = new Subscription();
            this.historySubscription.unsubscribe();
            this.historySubscription = new Subscription();
            this.FormLoaded = false;
            const FormControlsArray = Object.keys(this.DynamicFGroup.controls);
            FormControlsArray.map(controlName => {
               this.DynamicFGroup.removeControl(controlName);
            });
            this.ActivateDynamicFGroup();
         }
      } else {
         if ((event + 1) <= 5) {
            this.TabChangeEvent(event + 1);
         } else {
            this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
               this.router.navigate(['/Patient-Manage/Thrombolysis', this.UrlParams.Patient])
            );
         }
      }
   }


   CustomDynamicValidation(ControlObj): ValidatorFn {
      const Arr: any[] = ControlObj.Validation_Control_Array.map(obj => obj.Validation_Control._id);
      const RestrictValidations = [];
      Arr.map(obj => {
         const Index = this.AllValidations.findIndex(objNew => objNew._id === obj);
         RestrictValidations.push(this.AllValidations[Index]);
      });
      return (control: AbstractControl): { [key: string]: boolean } | null => {
         // if (ControlObj.Key_Name === 'Location_of_Infarction' ) {
         //    if (ControlObj.Mandatory) {
         //       const FArray = control as FormArray;
         //       const FGroup = FArray.controls[0] as FormGroup;
         //       const KeysArr =  Object.keys(FGroup.controls).filter(obj =>  FGroup.getRawValue()[obj] === true );
         //       if (KeysArr.length === 0) {
         //          return {required: true};
         //       }
         //    }
         // } else {
            if (ControlObj.Mandatory && (control.value === null || control.value === '' || control.value === false || control.value === undefined)) {
               return {required: true};
            } else {
               let value: string = control.value || '';
               if (ControlObj.Type === 'Number') {
                  value = (value === '') ? '0' : value;
               }
               let valid = true;
               let UnValidValidationName = 'Undefined';
               RestrictValidations.map(obj => {
                  if (valid) {
                     const regex = new RegExp(obj.Regex_Validation);
                     valid = regex.test(value);
                     UnValidValidationName = (obj.Name).trim().split(' ').join('');
                  }
               });
               return valid ? null : {[UnValidValidationName]: true};
            }
         // }
      };
   }

   GetFormControlErrorMessage(KeyName: any) {
      let FControl: FormGroup | FormControl | FormArray;
      // if (KeyName === 'Location_of_Infarction') {
      //    FControl = this.DynamicFGroup.get(KeyName) as FormArray;
      // } else {
         FControl = this.DynamicFGroup.get(KeyName) as FormControl;
      // }
      if (FControl.invalid && FControl.touched) {
         const ErrorKeys: any[] = FControl.errors !== null ? Object.keys(FControl.errors) : [];
         if (ErrorKeys.length > 0) {
            let returnText = '';
            if (ErrorKeys.indexOf('required') > -1) {
               returnText = 'This field is required';
            } else if (ErrorKeys.indexOf('min') > -1) {
               returnText = 'Enter the value should be more than ' + FControl.errors.min.min;
            } else if (ErrorKeys.indexOf('max') > -1) {
               returnText = 'Enter the value should be less than ' + FControl.errors.max.max;
            } else if (ErrorKeys.indexOf('MinNumberFiled') > -1) {
               returnText = FControl.errors.MinNumberFiled.errMsg;
            } else if (ErrorKeys.indexOf('MaxNumberFiled') > -1) {
               returnText = FControl.errors.MaxNumberFiled.errMsg;
            } else if (ErrorKeys.indexOf('MinDateFiled') > -1) {
               returnText = FControl.errors.MinDateFiled.errMsg;
            } else if (ErrorKeys.indexOf('MaxDateFiled') > -1) {
               returnText = FControl.errors.MaxDateFiled.errMsg;
            } else {
               ErrorKeys.map(obj => {
                  const Index = this.AllValidations.findIndex(objNew => (objNew.Name.trim().split(' ').join('')) === obj);
                  if (Index > -1) {
                     returnText = this.AllValidations[Index].Error_Message;
                  } else {
                     returnText = 'Undefined error detected!';
                  }
               });
            }
            return returnText;
         } else {
            return '';
         }
      } else {
         return '';
      }
   }
   GetHistoryFormControlErrorMessage(formArray: any, index: any, KeyName: any) {
      const FArray = this.HistoryFGroup.get(formArray) as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      const FControl = FGroup.get(KeyName) as FormControl;
      if (FControl.invalid && FControl.touched) {
         const ErrorKeys: any[] = FControl.errors !== null ? Object.keys(FControl.errors) : [];
         if (ErrorKeys.length > 0) {
            let returnText = '';
            if (ErrorKeys.indexOf('required') > -1) {
               returnText = 'This field is required';
            } else if (ErrorKeys.indexOf('min') > -1) {
               returnText = 'Enter the value should be more than ' + FControl.errors.min.min;
            } else if (ErrorKeys.indexOf('max') > -1) {
               returnText = 'Enter the value should be less than ' + FControl.errors.max.max;
            } else {
               ErrorKeys.map(obj => {
                  const Index = this.AllValidations.findIndex(objNew => (objNew.Name.trim().split(' ').join('')) === obj);
                  if (Index > -1) {
                     returnText = this.AllValidations[Index].Error_Message;
                  } else {
                     returnText = 'Undefined error detected!';
                  }
               });
            }
            return returnText;
         } else {
            return '';
         }
      } else {
         return '';
      }
   }

   ActivateDynamicFGroup() {
      if (this.AllFieldsValues.length > 0 && this.AllValidations.length > 0 && !this.FormLoaded) {
         this.ContentLoading = false;
         const KeyDatabase = [];
         this.AllFieldsValues.map(obj1 => { KeyDatabase.push(obj1.Key_Name); });
         const FilteredFields = this.AllFieldsValues.filter(obj => obj.Sub_Category === this.TabsList[this.CurrentTabIndex]);
         this.DynamicFGroup = new FormGroup({ });
         this.DynamicFGroup.addControl('User', new FormControl(this.UserInfo._id, Validators.required ));
         if (this.ExistingPatient) {
            this.DynamicFGroup.addControl('PatientId', new FormControl(this.UrlParams.Patient, Validators.required ));
            if (this.PatientInfo.TransferBending && this.UserInfo.User_Type === 'PU' && this.InitialHospital !== this.UserInfo.Hospital._id) {
               this.DynamicFGroup.addControl('Hospital', new FormControl(this.UserInfo.Hospital._id, Validators.required ));
            } else {
               this.DynamicFGroup.addControl('Hospital', new FormControl(this.InitialHospital, Validators.required ));
            }
            if (this.TabsList[this.CurrentTabIndex] === 'Fibrinolytic_Checklist' && this.LastActiveTab !== 'Basic_Details' && this.CheckListId !== null) {
               this.DynamicFGroup.addControl('CheckListId', new FormControl(this.CheckListId, Validators.required ));
            }
            if (this.TabsList[this.CurrentTabIndex] === 'Medication_During_Transportation' && this.LastActiveTab !== 'Fibrinolytic_Checklist' && this.TransportationId !== null) {
               this.DynamicFGroup.addControl('TransportationId', new FormControl(this.TransportationId, Validators.required ));
            }
            if (this.TabsList[this.CurrentTabIndex] === 'Cardiac_History' && this.CardiacHistoryId !== null) {
               this.DynamicFGroup.addControl('CardiacHistoryId', new FormControl(this.CardiacHistoryId, Validators.required ));
            }
            if (this.TabsList[this.CurrentTabIndex] === 'Co-Morbid_Conditions' && this.CoMorbidConditionId !== null ) {
               this.DynamicFGroup.addControl('CoMorbidConditionId', new FormControl(this.CoMorbidConditionId, Validators.required ));
            }
            if (this.TabsList[this.CurrentTabIndex] === 'Contact_Details' && this.LastActiveTab !== 'Co-Morbid_Conditions') {
               this.DynamicFGroup.addControl('ContactId', new FormControl(this.ContactId, Validators.required ));
            }
         } else {
            this.DynamicFGroup.addControl('Hospital', new FormControl(this.UserInfo.Hospital._id, Validators.required ));
            this.DynamicFGroup.addControl('Location_Code', new FormControl(this.UserInfo.Location.Location_Code, Validators.required ));
            this.DynamicFGroup.addControl('Cluster_Code', new FormControl(this.UserInfo.Cluster.Cluster_Code, Validators.required ));
            this.DynamicFGroup.addControl('Hospital_Code', new FormControl(this.UserInfo.Hospital.Hospital_Code, Validators.required ));
            if (!this.ExistingPatient) {
               this.dataPassingService.UpdatePatientUniqueData((this.UserInfo.Location.Location_Code).toString().padStart(2, 0) + (this.UserInfo.Cluster.Cluster_Code).toString().padStart(2, 0) + (this.UserInfo.Hospital.Hospital_Code).toString().padStart(3, 0) + ' - - - -' );
            }
         }
         FilteredFields.map(obj => {
            let FormControlValidation = null;
            if (obj.Mandatory || obj.Validation) {
               FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
            }
            // if (obj.Key_Name !== 'Location_of_Infarction') {
               this.DynamicFGroup.addControl(obj.Key_Name, new FormControl({value: obj.CurrentValue, disabled: obj.Disabled}, FormControlValidation ));
            // }
            let AnyTimeValue = null;
            if (obj.Type === 'Date' && obj.DefaultValue && obj.DefaultValue !== null && obj.DefaultValue !== '') {
               const DateTime = new Date(obj.DefaultValue);
               AnyTimeValue  = DateTime.getHours() + ':' + DateTime.getMinutes();
            }
            const NewObj = JSON.parse(JSON.stringify(obj));
            NewObj._id = null;
            NewObj.ThisIsTime = false;
            NewObj.ParentDateKey = null;
            NewObj.DefaultValue = AnyTimeValue;
            NewObj.CurrentValue = AnyTimeValue;
            if (obj.Key_Name === 'Symptom_Onset_Date_Time' && !KeyDatabase.includes('Symptom_Onset_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Symptom_Onset_Date_Time';
               NewObj.Name = 'Symptom Onset Time';
               NewObj.Key_Name = 'Symptom_Onset_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Symptom_Onset_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
				if (obj.Key_Name === 'First_Medical_Contact_Date_Time' && !KeyDatabase.includes('First_Medical_Contact_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'First_Medical_Contact_Date_Time';
               NewObj.Name = 'First Medical Contact Time';
               NewObj.Key_Name = 'First_Medical_Contact_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('First_Medical_Contact_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'Hospital_Arrival_Date_Time' && !KeyDatabase.includes('Hospital_Arrival_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Hospital_Arrival_Date_Time';
               NewObj.Name = 'Hospital Arrival Time';
               NewObj.Key_Name = 'Hospital_Arrival_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Hospital_Arrival_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'EMS_Ambulance_Call_Date_Time' && !KeyDatabase.includes('EMS_Ambulance_Call_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'EMS_Ambulance_Call_Date_Time';
               NewObj.Name = 'EMS Ambulance Call Time';
               NewObj.Key_Name = 'EMS_Ambulance_Call_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('EMS_Ambulance_Call_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'EMS_Ambulance_Departure_Date_Time' && !KeyDatabase.includes('EMS_Ambulance_Departure_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'EMS_Ambulance_Departure_Date_Time';
               NewObj.Name = 'EMS Ambulance Departure Time';
               NewObj.Key_Name = 'EMS_Ambulance_Departure_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('EMS_Ambulance_Departure_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'Ambulance_Call_Date_Time' && !KeyDatabase.includes('Patient_Ambulance_Call_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Ambulance_Call_Date_Time';
               NewObj.Name = 'Ambulance Call Time';
               NewObj.Key_Name = 'Patient_Ambulance_Call_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Patient_Ambulance_Call_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'Ambulance_Arrival_Date_Time' && !KeyDatabase.includes('Patient_Ambulance_Arrival_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Ambulance_Arrival_Date_Time';
               NewObj.Name = 'Ambulance Arrival Time';
               NewObj.Key_Name = 'Patient_Ambulance_Arrival_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Patient_Ambulance_Arrival_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'Ambulance_Departure_Date_Time' && !KeyDatabase.includes('Patient_Ambulance_Departure_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Ambulance_Departure_Date_Time';
               NewObj.Name = 'Ambulance Departure Time';
               NewObj.Key_Name = 'Patient_Ambulance_Departure_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Patient_Ambulance_Departure_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'ECG_Taken_date_time' && !KeyDatabase.includes('ECG_Taken_time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'ECG_Taken_date_time';
               NewObj.Name = 'ECG Taken Time';
               NewObj.Key_Name = 'ECG_Taken_time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('ECG_Taken_time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'Stemi_Confirmed_Date_Time' && !KeyDatabase.includes('Stemi_Confirmed_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Stemi_Confirmed_Date_Time';
               NewObj.Name = 'Stemi Confirmed Time';
               NewObj.Key_Name = 'Stemi_Confirmed_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Stemi_Confirmed_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'NonCluster_Hospital_Arrival_Date_Time' && !KeyDatabase.includes('NonCluster_Hospital_Arrival_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'NonCluster_Hospital_Arrival_Date_Time';
               NewObj.Name = 'NonCluster Hospital Arrival Time';
               NewObj.Key_Name = 'NonCluster_Hospital_Arrival_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('NonCluster_Hospital_Arrival_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
				if (obj.Key_Name === 'NonCluster_Ambulance_Call_Date_Time' && !KeyDatabase.includes('NonCluster_Ambulance_Call_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'NonCluster_Ambulance_Call_Date_Time';
               NewObj.Name = 'NonCluster Ambulance Call Date Time';
               NewObj.Key_Name = 'NonCluster_Ambulance_Call_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('NonCluster_Ambulance_Call_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
				if (obj.Key_Name === 'NonCluster_Ambulance_Arrival_Date_Time' && !KeyDatabase.includes('NonCluster_Ambulance_Arrival_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'NonCluster_Ambulance_Arrival_Date_Time';
               NewObj.Name = 'NonCluster Ambulance Arrival Date Time';
               NewObj.Key_Name = 'NonCluster_Ambulance_Arrival_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('NonCluster_Ambulance_Arrival_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
				if (obj.Key_Name === 'NonCluster_Ambulance_Departure_Date_Time' && !KeyDatabase.includes('NonCluster_Ambulance_Departure_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'NonCluster_Ambulance_Departure_Date_Time';
               NewObj.Name = 'NonCluster Ambulance Departure Date Time';
               NewObj.Key_Name = 'NonCluster_Ambulance_Departure_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('NonCluster_Ambulance_Departure_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'Post_Thrombolysis_Start_Date_Time' && !KeyDatabase.includes('Post_Thrombolysis_Start_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Post_Thrombolysis_Start_Date_Time';
               NewObj.Name = 'Post Thrombolysis Start Time';
               NewObj.Key_Name = 'Post_Thrombolysis_Start_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Post_Thrombolysis_Start_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'Post_Thrombolysis_End_Date_Time' && !KeyDatabase.includes('Post_Thrombolysis_End_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Post_Thrombolysis_End_Date_Time';
               NewObj.Name = 'Post Thrombolysis End Time';
               NewObj.Key_Name = 'Post_Thrombolysis_End_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Post_Thrombolysis_End_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'Ninety_Min_ECG_Date_Time' && !KeyDatabase.includes('Ninety_Min_ECG_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Ninety_Min_ECG_Date_Time';
               NewObj.Name = 'Ninety_Min_ECG_Time';
               NewObj.Key_Name = 'Ninety_Min_ECG_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Ninety_Min_ECG_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            // Medication Transportation
            if (obj.Key_Name === 'Transportation_Medication_Aspirin_Dosage_Date_Time' && !KeyDatabase.includes('Transportation_Medication_Aspirin_Dosage_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Transportation_Medication_Aspirin_Dosage_Date_Time';
               NewObj.Name = 'Transportation Medication Aspirin Dosage Time';
               NewObj.Key_Name = 'Transportation_Medication_Aspirin_Dosage_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Transportation_Medication_Aspirin_Dosage_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'Transportation_Medication_Clopidogrel_Dosage_Date_Time' && !KeyDatabase.includes('Transportation_Medication_Clopidogrel_Dosage_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Transportation_Medication_Clopidogrel_Dosage_Date_Time';
               NewObj.Name = 'Transportation Medication Clopidogrel Dosage Time';
               NewObj.Key_Name = 'Transportation_Medication_Clopidogrel_Dosage_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Transportation_Medication_Clopidogrel_Dosage_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'Transportation_Medication_Prasugrel_Dosage_Date_Time' && !KeyDatabase.includes('Transportation_Medication_Prasugrel_Dosage_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Transportation_Medication_Prasugrel_Dosage_Date_Time';
               NewObj.Name = 'Transportation Medication Prasugrel Dosage Time';
               NewObj.Key_Name = 'Transportation_Medication_Prasugrel_Dosage_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Transportation_Medication_Prasugrel_Dosage_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'Transportation_Medication_Ticagrelor_Dosage_Date_Time' && !KeyDatabase.includes('Transportation_Medication_Ticagrelor_Dosage_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Transportation_Medication_Ticagrelor_Dosage_Date_Time';
               NewObj.Name = 'Transportation Medication Ticagrelor Dosage Time';
               NewObj.Key_Name = 'Transportation_Medication_Ticagrelor_Dosage_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Transportation_Medication_Ticagrelor_Dosage_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'Transportation_Medication_UnFractionated_Heparin_Date_Time' && !KeyDatabase.includes('Transportation_Medication_UnFractionated_Heparin_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Transportation_Medication_UnFractionated_Heparin_Date_Time';
               NewObj.Name = 'Transportation Medication UnFractionated Heparin Time';
               NewObj.Key_Name = 'Transportation_Medication_UnFractionated_Heparin_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Transportation_Medication_UnFractionated_Heparin_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (obj.Key_Name === 'Transportation_Medication_LMW_Heparin_Date_Time' && !KeyDatabase.includes('Transportation_Medication_LMW_Heparin_Time')) {
               NewObj.ThisIsTime = true; 
               NewObj.ParentDateKey = 'Transportation_Medication_LMW_Heparin_Date_Time';
               NewObj.Name = 'Transportation Medication LMW Heparin Time';
               NewObj.Key_Name = 'Transportation_Medication_LMW_Heparin_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Transportation_Medication_LMW_Heparin_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
            }
            if (this.TabsList[this.CurrentTabIndex] === 'Contact_Details') {
               const PhoneNoArr = this.AllFieldsValues.filter(objNew => objNew.Key_Name === 'Patient_PhoneNo');
               const AddressArr = this.AllFieldsValues.filter(objNew => objNew.Key_Name === 'Patient_Address');
               setTimeout(() => {
                  this.DynamicFGroup.get('Contact_Phone_Number').setValue(PhoneNoArr[0].CurrentValue);
                  this.DynamicFGroup.get('Contact_Phone_Number').disable();
                  this.DynamicFGroup.get('Address').setValue(AddressArr[0].CurrentValue);
                  this.DynamicFGroup.get('Address').disable();
               }, 100);
            }
         });
         if (this.TabsList[this.CurrentTabIndex] === 'Basic_Details') {
            if (this.ExistingPatient === true) {
               this.DynamicFGroup.addControl('NewECG', new FormControl(false));
            }
            if (this.TransportDetailsHide) {
               const TransportArr = this.AllFieldsValues.filter(objNew => objNew.Sub_Junior_Category === 'Transport_Details');
               TransportArr.map(objNewNew => {
                  const SetValue = (objNewNew.Type === 'Select' || objNewNew.Type === 'Date' || objNewNew.Type === 'Number' || objNewNew.Type === 'Boolean' ) ? null : '';
                  this.DynamicFGroup.controls[objNewNew.Key_Name].setValue(SetValue);
                  this.DynamicFGroup.controls[objNewNew.Key_Name].clearValidators();
                  this.DynamicFGroup.controls[objNewNew.Key_Name].setErrors(null);
                  this.DynamicFGroup.controls[objNewNew.Key_Name].markAsPristine();
                  this.DynamicFGroup.controls[objNewNew.Key_Name].markAsUntouched();
                  this.DynamicFGroup.controls[objNewNew.Key_Name].updateValueAndValidity();
               });
               this.AllFieldsValues.map((objNewNew, idx ) => {
                  if (objNewNew.Sub_Junior_Category === 'Transport_Details') {
                     const SetValue = (objNewNew.Type === 'Select' || objNewNew.Type === 'Date' || objNewNew.Type === 'Number' || objNewNew.Type === 'Boolean' ) ? null : '';
                     this.AllFieldsValues[idx].CurrentValue = SetValue;
                     this.AllFieldsValues[idx].DefaultValue = SetValue;
                  }
               });
            }
            setTimeout(() => {
               const Admission = this.DynamicFGroup.get('Patient_Admission_Type').value;
               this.checkAdmissionType(Admission);
					if (Admission === 'Non_Cluster_Spoke') {
						setTimeout(() => {
							let ReferralData = this.DynamicFGroup.get('NonCluster_Hospital_Name').value;
							if (ReferralData !== undefined && ReferralData !== '' && ReferralData !== null) {
								if (typeof ReferralData === 'string') {
									const idx = this.ReferralFacilityList.findIndex(ref => ref._id === ReferralData);
									if (idx >= 0) {
										ReferralData = this.ReferralFacilityList[idx];
										this.DynamicFGroup.get('NonCluster_Hospital_Name').setValue(this.ReferralFacilityList[idx]);
									}
								}
								this.SetReferralData(ReferralData);
							}
						}, 200);
					}
               const Race = this.DynamicFGroup.get('Race').value;
               this.checkRaceType(Race);
               const TransportMode = this.DynamicFGroup.get('TransportMode').value;
               this.checkTransportMode(TransportMode);
               const ECGTakenType = this.DynamicFGroup.get('ECG_Taken_Type').value;
               this.checkECGDateTime(ECGTakenType);
               const PostThrombolysis = this.DynamicFGroup.get('Post_Thrombolysis').value;
               this.checkPostThrombolysis(PostThrombolysis);
               const NinetyMinECG = this.DynamicFGroup.get('Ninety_Min_ECG').value;
               this.checkNinetyMinECG(NinetyMinECG);
               const StemiConfirmed = this.DynamicFGroup.get('Stemi_Confirmed').value;
               this.checkStemiConfirmed(StemiConfirmed);
            }, 100);
         }
         if (this.TabsList[this.CurrentTabIndex] === 'Co-Morbid_Conditions') {
            setTimeout(() => {
               const Smoker = this.DynamicFGroup.get('Smoker').value;
               this.checkSmoker(Smoker);
            }, 100);
         }
         if (this.TabsList[this.CurrentTabIndex] === 'Fibrinolytic_Checklist') {
            setTimeout(() => {
               if (this.DisableChecklist && this.CheckListHistoryAvailable) {
                  const FArray = this.HistoryFGroup.get('CheckListHistory') as FormArray;
                  const FGroup = FArray.controls[FArray.length - 1] as FormGroup;
                  FGroup.controls.HistoryActive.setValue(true);
               }
            }, 100);
         }
         setTimeout(() => {
            this.FormLoaded = true;
            this.AllFieldValuesManagement();
            if (this.CurrentHospitalInfo.Hospital_Role === 'EMS' || (this.UserInfo.User_Type !== 'SA'  && this.UserInfo.Hospital.Hospital_Role === 'EMS')) {
               this.RestrictTheTabs();
            }
         }, 100);

         setTimeout(() => {
            const NodeList = document.querySelectorAll('.mat-tab-label') as NodeListOf<HTMLElement>;
            this.TabsList.map((tabObj, idx) => {
               if (this.CheckSubCategoryVisibility(tabObj)) {
                  if ( this.CurrentTabIndex === 0 && idx === 0) {
                     this.TabChangeEvent(idx + 1);
                  }
                  NodeList.forEach((Node, index) => {
                     if (index === idx) {
                        Node.style.display = 'none';
                     }
                  });
               }
            });
         }, 100);
      }
   }

   RestrictTheTabs() {
      const NodeList = document.querySelectorAll('.mat-tab-label') as NodeListOf<HTMLElement>;
      NodeList.forEach((Node, index) => {
         if (index === 3 || index === 5) {
            Node.style.display = 'none';
         }
      });
   }

   AllFieldValuesManagement() {
      this.AllFieldsValues.map(obj => {
         obj.ChildRestrictions = [];
         obj.TimeAvailable = false;
         obj.TimeKeyName = '';
         this.AllFieldsValues.map(ObjNew => {
            if (ObjNew.ThisIsTime && obj.Key_Name === ObjNew.ParentDateKey) {
               obj.TimeAvailable = true;
               obj.TimeKeyName = ObjNew.Key_Name;
            }
            if (!obj.ChildRestrictions.includes(ObjNew.Key_Name)) {
               if (ObjNew.If_Min_Number_Field_Restriction) {
                  const MinFieldId = (ObjNew.Min_Number_Field !== null ) ? ObjNew.Min_Number_Field._id : null;
                  if (MinFieldId !== null && MinFieldId === obj._id) {
                     obj.ChildRestrictions.push(ObjNew.Key_Name);
                  }
               }
               if (ObjNew.If_Max_Number_Field_Restriction) {
                  const MaxFieldId = (ObjNew.Max_Number_Field !== null ) ? ObjNew.Max_Number_Field._id : null;
                  if (MaxFieldId !== null && MaxFieldId === obj._id) {
                     obj.ChildRestrictions.push(ObjNew.Key_Name);
                  }
               }
               if (ObjNew.If_Min_Date_Restriction) {
                  const MaxFieldId = (ObjNew.Min_Date_Field !== null ) ? ObjNew.Min_Date_Field._id : null;
                  if (MaxFieldId !== null && MaxFieldId === obj._id) {
                     obj.ChildRestrictions.push(ObjNew.Key_Name);
                  }
               }
               if (ObjNew.If_Max_Date_Restriction) {
                  const MaxFieldId = (ObjNew.Max_Date_Field !== null ) ? ObjNew.Max_Date_Field._id : null;
                  if (MaxFieldId !== null && MaxFieldId === obj._id) {
                     obj.ChildRestrictions.push(ObjNew.Key_Name);
                  }
               }
               if (ObjNew.If_Min_Date_Array_Available) {
                  if (ObjNew.Min_Date_Array !== null && ObjNew.Min_Date_Array.length > 0 && !ObjNew.ThisIsTime) {
                     ObjNew.Min_Date_Array.map(objNewNew => {
                        const MinFieldId = (objNewNew.Min_Date_Field !== null ) ? objNewNew.Min_Date_Field._id : null;
                        if (MinFieldId !== null && MinFieldId === obj._id) {
                           obj.ChildRestrictions.push(ObjNew.Key_Name);
                        }
                     });
                  }
               }
               if (ObjNew.If_Max_Date_Array_Available) {
                  if (ObjNew.Max_Date_Array !== null && ObjNew.Max_Date_Array.length > 0 && !ObjNew.ThisIsTime) {
                     ObjNew.Max_Date_Array.map(objNewNew => {
                        const MaxFieldId = (objNewNew.Max_Date_Field !== null ) ? objNewNew.Max_Date_Field._id : null;
                        if (MaxFieldId !== null && MaxFieldId === obj._id) {
                           obj.ChildRestrictions.push(ObjNew.Key_Name);
                        }
                     });
                  }
               }
            }
         });
         return obj;
      });
      if (!this.ReadonlyPage) {
         this.DynamicFGroupValueChangesMonitoring();
         if (this.TabsList[this.CurrentTabIndex] !== 'Basic_Details' && this.TabsList[this.CurrentTabIndex] !== 'Fibrinolytic_Checklist') {
            this.YesOrNoValidations();
         }
      } else {
         this.DynamicFGroup.disable();
      }
   }

   ChildrensFind(Key: any) {
      const FieldsValues = this.AllFieldsValues.filter(obj => obj.Sub_Category === this.TabsList[this.CurrentTabIndex]);
      const FieldIndex =  FieldsValues.findIndex(obj => obj.Key_Name === Key);
      const AllKeys: any[] = FieldsValues.map(obj => obj.Key_Name);
      const RestrictionFields: any[] = FieldsValues[FieldIndex].ChildRestrictions.filter(obj => AllKeys.includes(obj));
      const TestingList: any[] = [];
      function SubChildrensFind(SubKey: any) {
         const FIndex =  FieldsValues.findIndex(obj1 => obj1.Key_Name === SubKey);
         const SubRestrictionFields: any[] = FieldsValues[FIndex].ChildRestrictions.filter(obj => AllKeys.includes(obj));
         SubRestrictionFields.map(obj2 => {
            if (!RestrictionFields.includes(obj2)) {
               RestrictionFields.push(obj2);
            }
         });
         const BendingList = RestrictionFields.filter(x => !TestingList.includes(x));
         if (BendingList.length === 0) {
            return RestrictionFields;
         } else {
            TestingList.push(BendingList[0]);
            return SubChildrensFind(BendingList[0]);
         }
      }
      if (RestrictionFields.length > 0 && !FieldsValues[FieldIndex].ThisIsTime) {
         TestingList.push(RestrictionFields[0]);
         return SubChildrensFind(RestrictionFields[0]);
      }
   }

   DynamicFGroupValueChangesMonitoring() {
      let SubscribeLimitControl = [];
      let NewSubscribeLimit = true;
      this.FormLoaded = true;
      const FormControlsArray = Object.keys(this.DynamicFGroup.controls);
      FormControlsArray.map(controlName => {
         // if (controlName !== 'Location_of_Infarction') {
            const control = this.DynamicFGroup.controls[controlName] as FormControl;
            this.subscription.add(
               control.valueChanges.subscribe(change => {
                  if (controlName === 'Patient_Name' && !this.ExistingPatient) {
                     this.dataPassingService.UpdatePatientNameData(change);
                  }
                  const FieldIndex =  this.AllFieldsValues.findIndex(obj => obj.Key_Name === controlName);
                  if (FieldIndex > -1) {
                     // Date Value change update related time ---------
                     if (this.AllFieldsValues[FieldIndex].TimeAvailable) {
                        const TimeFieldIndex =  this.AllFieldsValues.findIndex(obj => obj.Key_Name === this.AllFieldsValues[FieldIndex].TimeKeyName);
                        let RelatedTime = this.AllFieldsValues[TimeFieldIndex].CurrentValue;
                        this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setErrors(null);
                        let TimeHotReload = false;
                        if (change && change !== null && change !== '') {
                           RelatedTime = (RelatedTime && RelatedTime !== null && RelatedTime !== '' && RelatedTime !== '0:0' && RelatedTime !== '00:00:00') ? RelatedTime.split(':').length <= 2  ? (RelatedTime + ':00') : RelatedTime : '00:00:00';
                           if (RelatedTime !== '00:00:00' && new Date(new Date(change).setHours(0, 0, 0, 0)).valueOf() === new Date(new Date().setHours(0, 0, 0, 0)).valueOf() ) {
                              const timeSplit = RelatedTime.split(':');
                              const exHrs = timeSplit.length > 1 ? Number(timeSplit[0]) : 0;
                              const exMin = timeSplit.length > 1 ? Number(timeSplit[1]) : 0;
                              const currHrs = new Date().getHours();
                              const currMin = new Date().getMinutes();
                              const status = exHrs > currHrs ? 'SetNew' : (exHrs === currHrs && exMin > currMin) ? 'SetNew' : 'ManageOld';
                              if (status === 'SetNew') {
                                 RelatedTime = new Date().getHours() + ':' + new Date().getMinutes() + ':00';
                                 TimeHotReload = true;
                              }
                           }
                           change =  new Date(change);
                           change = new Date(change.getFullYear() + '-' + (change.getMonth() + 1) + '-' + change.getDate() + ' ' + RelatedTime);
                        }
                        if (TimeHotReload) {
                           this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setValue(RelatedTime);
                        } else {
                           this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setValue(RelatedTime, { emitEvent: false });
                        }
                        this.DynamicFGroup.get(controlName).setValue(change, { emitEvent: false });
                     }
                     // Field Value change update  ---------
                     this.AllFieldsValues[FieldIndex].CurrentValue = change;
                     // Time Value change update related date  ---------
                     if (this.AllFieldsValues[FieldIndex].ThisIsTime) {
                        const RelatedDateKeyName = this.AllFieldsValues[FieldIndex].ParentDateKey;
                        this.DynamicFGroup.get(RelatedDateKeyName).updateValueAndValidity();
                     }
                     // Minimum Number Field Restriction  ---------
                     if (this.AllFieldsValues[FieldIndex].If_Min_Number_Field_Restriction) {
                        const MinFieldId = (this.AllFieldsValues[FieldIndex].Min_Number_Field !== null ) ? this.AllFieldsValues[FieldIndex].Min_Number_Field._id : null;
                        if (MinFieldId !== null) {
                           const MinFieldIndex = this.AllFieldsValues.findIndex(obj => obj._id === MinFieldId);
                           let MinValue = this.AllFieldsValues[MinFieldIndex].CurrentValue;
                           MinValue = (MinValue !== null && MinValue !== '') ? +MinValue : 0;
                           change = (change !== null && change !== '') ? +change : 0;
                           if (MinValue >= change && change !== 0 ) {
                              const ErrorMessage = 'Enter the value should be more than ' + this.AllFieldsValues[MinFieldIndex].Name;
                              control.setErrors({ MinNumberFiled: {errMsg: ErrorMessage } });
                           }
                        }
                     }
                     // Maximum Number Field Restriction  ---------
                     if (this.AllFieldsValues[FieldIndex].If_Max_Number_Field_Restriction) {
                        const MaxFieldId = (this.AllFieldsValues[FieldIndex].Max_Number_Field !== null ) ? this.AllFieldsValues[FieldIndex].Max_Number_Field._id : null;
                        if (MaxFieldId !== null) {
                           const MaxFieldIndex = this.AllFieldsValues.findIndex(obj => obj._id === MaxFieldId);
                           let MaxValue = this.AllFieldsValues[MaxFieldIndex].CurrentValue;
                           MaxValue = (MaxValue !== null && MaxValue !== '') ? +MaxValue : 0;
                           change = (change !== null && change !== '') ? +change : 0;
                           if (MaxValue <= change && change !== 0 ) {
                              const ErrorMessage = 'Enter the value should be less than ' + this.AllFieldsValues[MaxFieldIndex].Name;
                              control.setErrors({ MaxNumberFiled: {errMsg: ErrorMessage } });
                           }
                        }
                     }
                     // Minimum Date Field Restriction  ---------
                     if (this.AllFieldsValues[FieldIndex].If_Min_Date_Restriction) {
                        const MinFieldId = (this.AllFieldsValues[FieldIndex].Min_Date_Field !== null ) ? this.AllFieldsValues[FieldIndex].Min_Date_Field._id : null;
                        if (MinFieldId !== null) {
                           const MinFieldIndex = this.AllFieldsValues.findIndex(obj => obj._id === MinFieldId);
                           let MinValue = this.AllFieldsValues[MinFieldIndex].CurrentValue;
                           let AddOn = '';
                           if (this.FirstRecordEdition && this.FirstLevelValidationFields.includes(controlName)) {
                              const key = this.AllFieldsValues[MinFieldIndex].Key_Name;
                              MinValue = this.FirstLevelDataCollection[key];
                              AddOn = 'first ';
                           }
                           MinValue = (MinValue !== null && MinValue !== '') ? new Date(MinValue).valueOf() : null;
                           change = (change !== null && change !== '') ? new Date(change).valueOf() : null ;
                           if (MinValue > change && change !== null && MinValue !== null ) {
                              const Text = this.AllFieldsValues[FieldIndex].TimeAvailable ? 'Select the date time should be more than ' + AddOn : 'Select the date should be more than ' + AddOn;
                              const ErrorMessage = Text + this.AllFieldsValues[MinFieldIndex].Name;
                              control.setErrors({ MinDateFiled: {errMsg: ErrorMessage } });
                              if (this.AllFieldsValues[FieldIndex].TimeAvailable) {
                                 this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsTouched();
                                 this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsDirty();
                                 this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setErrors({ MinDateFiled: {errMsg: ErrorMessage } });
                              }
                           }
                        }
                     }
                     // Maximum Date Field Restriction  ---------
                     if (this.AllFieldsValues[FieldIndex].If_Max_Date_Restriction) {
                        const MaxFieldId = (this.AllFieldsValues[FieldIndex].Max_Date_Field !== null ) ? this.AllFieldsValues[FieldIndex].Max_Date_Field._id : null;
                        if (MaxFieldId !== null) {
                           const MaxFieldIndex = this.AllFieldsValues.findIndex(obj => obj._id === MaxFieldId);
                           let MaxValue = this.AllFieldsValues[MaxFieldIndex].CurrentValue;
                           let AddOn = '';
                           if (this.FirstRecordEdition && this.FirstLevelValidationFields.includes(controlName)) {
                              const key = this.AllFieldsValues[MaxFieldIndex].Key_Name;
                              MaxValue = this.FirstLevelDataCollection[key];
                              AddOn = 'first ';
                           }
                           MaxValue = (MaxValue !== null && MaxValue !== '') ? new Date(MaxValue).valueOf() : null;
                           change = (change !== null && change !== '') ? new Date(change).valueOf() : null ;
                           if (MaxValue < change && change !== null && MaxValue !== null ) {
                              const Text = this.AllFieldsValues[FieldIndex].TimeAvailable ? 'Select the date time should be less than ' + AddOn : 'Select the date should be less than ' + AddOn;
                              const ErrorMessage = Text + this.AllFieldsValues[MaxFieldIndex].Name;
                              control.setErrors({ MaxDateFiled: {errMsg: ErrorMessage } });
                              if (this.AllFieldsValues[FieldIndex].TimeAvailable) {
                                 this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsTouched();
                                 this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsDirty();
                                 this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setErrors({ MinDateFiled: {errMsg: ErrorMessage } });
                              }
                           }
                        }
                     }
                     // Minimum Date Field Array Restriction  ---------
                     if (this.AllFieldsValues[FieldIndex].If_Min_Date_Array_Available) {
                        const MinDateFiledArray: any[] = this.AllFieldsValues[FieldIndex].Min_Date_Array;
                        if (MinDateFiledArray && MinDateFiledArray !== null && MinDateFiledArray.length > 0) {
                           let MinDateArrMapOperationBreak = false;
                           MinDateFiledArray.map(objField => {
                              if (!MinDateArrMapOperationBreak) {
                                 const MinFieldId = (objField.Min_Date_Field && objField.Min_Date_Field !== null) ? objField.Min_Date_Field._id : null;
                                 const MinFieldIndex = this.AllFieldsValues.findIndex(obj => obj._id === MinFieldId);
                                 let MinValue = this.AllFieldsValues[MinFieldIndex].CurrentValue;
                                 let AddOn = '';
                                 if (this.FirstRecordEdition && this.FirstLevelValidationFields.includes(controlName)) {
                                    const key = this.AllFieldsValues[MinFieldIndex].Key_Name;
                                    MinValue = this.FirstLevelDataCollection[key];
                                    AddOn = 'first ';
                                 }
                                 MinValue = (MinValue !== null && MinValue !== '') ? new Date(MinValue).valueOf() : null;
                                 change = (change !== null && change !== '') ? new Date(change).valueOf() : null ;
                                 if (MinValue > change && change !== null && MinValue !== null) {
                                    const Text = this.AllFieldsValues[FieldIndex].TimeAvailable ? 'Select the date time should be more than ' + AddOn : 'Select the date should be more than ' + AddOn;
                                    const ErrorMessage = Text + this.AllFieldsValues[MinFieldIndex].Name;
                                    control.setErrors({ MinDateFiled: {errMsg: ErrorMessage } });
                                    MinDateArrMapOperationBreak = true;
                                    if (this.AllFieldsValues[FieldIndex].TimeAvailable) {
                                       this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsTouched();
                                       this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsDirty();
                                       this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setErrors({ MinDateFiled: {errMsg: ErrorMessage } });
                                    }
                                 }
                              }
                           });
                        }
                     }
                     // Maximum Date Field Array Restriction  ---------
                     if (this.AllFieldsValues[FieldIndex].If_Max_Date_Array_Available) {
                        const MaxDateFiledArray: any[] = this.AllFieldsValues[FieldIndex].Max_Date_Array;
                        if (MaxDateFiledArray && MaxDateFiledArray !== null && MaxDateFiledArray.length > 0) {
                           let MaxDateArrMapOperationBreak = false;
                           MaxDateFiledArray.map(objField => {
                              if (!MaxDateArrMapOperationBreak) {
                                 const MaxFieldId = (objField.Max_Date_Field && objField.Max_Date_Field !== null) ? objField.Max_Date_Field._id : null;
                                 const MaxFieldIndex = this.AllFieldsValues.findIndex(obj => obj._id === MaxFieldId);
                                 let MaxValue = this.AllFieldsValues[MaxFieldIndex].CurrentValue;
                                 let AddOn = '';
                                 if (this.FirstRecordEdition && this.FirstLevelValidationFields.includes(controlName)) {
                                    const key = this.AllFieldsValues[MaxFieldIndex].Key_Name;
                                    MaxValue = this.FirstLevelDataCollection[key];
                                    AddOn = 'first ';
                                 }
                                 MaxValue = (MaxValue !== null && MaxValue !== '') ? new Date(MaxValue).valueOf() : null;
                                 change = (change !== null && change !== '') ? new Date(change).valueOf() : null ;
                                 if (MaxValue < change && change !== null && MaxValue !== null ) {
                                    const Text = this.AllFieldsValues[FieldIndex].TimeAvailable ? 'Select the date time should be less than ' + AddOn : 'Select the date should be less than ' + AddOn;
                                    const ErrorMessage = Text + this.AllFieldsValues[MaxFieldIndex].Name;
                                    control.setErrors({ MaxDateFiled: {errMsg: ErrorMessage } });
                                    MaxDateArrMapOperationBreak = true;
                                    if (this.AllFieldsValues[FieldIndex].TimeAvailable) {
                                       this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsTouched();
                                       this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsDirty();
                                       this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setErrors({ MinDateFiled: {errMsg: ErrorMessage } });
                                    }
                                 }
                              }
                           });
                        }
                     }
                     // this control related controls validation check  ---------
                     if (SubscribeLimitControl.length > 0) {
                        const CKey = SubscribeLimitControl[0];
                        if (SubscribeLimitControl.length === 1) {
                           NewSubscribeLimit = false;
                        }
                        SubscribeLimitControl.splice(0, 1);
                        this.DynamicFGroup.get(CKey).updateValueAndValidity();
                     } else {
                        if (!this.AllFieldsValues[FieldIndex].ThisIsTime && NewSubscribeLimit) {
                           const ChildFields = this.ChildrensFind(controlName);
                           SubscribeLimitControl = ChildFields ? ChildFields : [];
                           SubscribeLimitControl = SubscribeLimitControl.filter(obj => {
                              const index =  this.AllFieldsValues.findIndex(obj1 => obj1.Key_Name === obj);
                              return (this.AllFieldsValues[index].CurrentValue !== null && this.AllFieldsValues[index].CurrentValue !== '') ? true : false;
                           });
                           if (SubscribeLimitControl.length > 0) {
                              const CKey = SubscribeLimitControl[0];
                              if (SubscribeLimitControl.length === 1) {
                                 NewSubscribeLimit = false;
                              }
                              SubscribeLimitControl.splice(0, 1);
                              this.DynamicFGroup.get(CKey).updateValueAndValidity();
                           }
                        } else {
                           if (!NewSubscribeLimit) {
                              NewSubscribeLimit = true;
                           }
                        }
                     }
                  }
               })
            );
         // }
      });
      // Update Values
      setTimeout(() => {
         const FilteredFields = this.AllFieldsValues.filter(obj => obj.Sub_Category === this.TabsList[this.CurrentTabIndex]);
         const FilterUpdateFields = FilteredFields.filter(obj => obj.CurrentValue !== null && obj.CurrentValue !== '');
         FilterUpdateFields.map(obj => {
            if (!obj.ThisIsTime) {
               SubscribeLimitControl.push(obj.Key_Name);
               this.DynamicFGroup.get(obj.Key_Name).markAsDirty();
               this.DynamicFGroup.get(obj.Key_Name).markAsTouched();
            }
         });
         if (SubscribeLimitControl.length > 0) {
            const CKey = SubscribeLimitControl[0];
            if (SubscribeLimitControl.length === 1) {
               NewSubscribeLimit = false;
            }
            SubscribeLimitControl.splice(0, 1);
            this.DynamicFGroup.get(CKey).updateValueAndValidity();
         }
      }, 100);
      if (this.TabsList[this.CurrentTabIndex] === 'Basic_Details') {
         this.BMICalc();
      }
   }

   BMICalc() {
      this.subscription.add(
         this.DynamicFGroup.get('Patient_Weight').valueChanges.subscribe(change => {
            let weight = change;
            let height = this.DynamicFGroup.get('Patient_Height').value;
            if (weight !== null && weight !== '' && height !== null && height !== '') {
               height = Number(height);
               weight = Number(weight);
               const BMI = (weight / ((height / 100) * (height / 100 ))).toFixed(2);
               this.DynamicFGroup.get('BMI').setValue(BMI);
            }
         })
      );
      this.subscription.add(
         this.DynamicFGroup.get('Patient_Height').valueChanges.subscribe(change => {
            let height = change;
            let weight = this.DynamicFGroup.get('Patient_Weight').value;
            if (weight !== null && weight !== '' && height !== null && height !== '') {
               height = Number(height);
               weight = Number(weight);
               const BMI = (weight / ((height / 100) * (height / 100 ))).toFixed(2);
               this.DynamicFGroup.get('BMI').setValue(BMI);
            }
         })
      );
   }

   ValueUpdates() {
      const FilteredFields = this.AllFieldsValues.filter(obj => obj.Sub_Category === this.TabsList[this.CurrentTabIndex]);
      const FilterUpdateFields = FilteredFields.filter(obj => obj.CurrentValue !== null && obj.CurrentValue !== '');
      const UpdateFieldKeys = [];
      FilterUpdateFields.map(obj => {
         UpdateFieldKeys.push(obj.Key_Name);
         this.DynamicFGroup.get(obj.Key_Name).markAsDirty();
         this.DynamicFGroup.get(obj.Key_Name).markAsTouched();
      });

      FilteredFields.map(obj => {
         if (obj.CurrentValue !== null && obj.CurrentValue !== '') {
            this.DynamicFGroup.get(obj.Key_Name).updateValueAndValidity();
            this.DynamicFGroup.get(obj.Key_Name).markAsDirty();
            this.DynamicFGroup.get(obj.Key_Name).markAsTouched();
         }
      });
   }

   // FormArrayChange() {
   //    const FieldIndex =  this.AllFieldsValues.findIndex(obj => obj.Key_Name === 'Location_of_Infarction');
   //    if (FieldIndex > -1 && this.AllFieldsValues[FieldIndex].Mandatory) {
   //       this.DynamicFGroup.get('Location_of_Infarction').markAsTouched();
   //       this.DynamicFGroup.get('Location_of_Infarction').markAsDirty();
   //       const FArray = this.DynamicFGroup.get('Location_of_Infarction') as FormArray;
   //       const FGroup = FArray.controls[0] as FormGroup;
   //       const FormControlsArray = Object.keys(FGroup.controls);
   //       let CurrentStatus = false;
   //       FormControlsArray.map(controlName => {
   //          if (!CurrentStatus) {
   //             CurrentStatus = FGroup.get(controlName).value;
   //          }
   //       });
   //       if (!CurrentStatus) {
   //          this.DynamicFGroup.get('Location_of_Infarction').setErrors({ required: true });
   //       }
   //    }
   // }

   // GetLOIFormArray(ControlName: any): any[] {
   //    const FArray = this.DynamicFGroup.get('Location_of_Infarction') as FormArray;
   //    return FArray.controls;
   // }


   GetHistoryFormArray(ControlName: any): any[] {
      const FArray = this.HistoryFGroup.get(ControlName) as FormArray;
      return FArray.controls;
   }

   GetHistoryFormArrayValue(ControlName: any): any[] {
      const FArray = this.HistoryFGroup.get(ControlName) as FormArray;
      return FArray.getRawValue();
   }

   ActiveToggleHistory(ControlName: any, index: any) {
      const FArray = this.HistoryFGroup.get(ControlName) as FormArray;
      const Active = FArray.value[index].HistoryActive as boolean;
      const FGroup = FArray.controls[index] as FormGroup;
      FGroup.controls.HistoryActive.setValue(!Active);
   }

   CheckMandatory(Key: any) {
		const KeyData = this.AllFieldsValues.filter(obj => obj.Key_Name === Key);
		return KeyData.length > 0 ? KeyData[0].Mandatory : false;
   }

   CheckVisibility(Key: any) {
		const KeyData = this.AllFieldsValues.filter(obj => obj.Key_Name === Key);
		return KeyData.length > 0 ? KeyData[0].Visibility : false;
   }

   CheckDisable(Key: any) {
      return this.DynamicFGroup.get(Key).disabled;
   }

   CheckSubCategoryVisibility(SubCategory: any) {
      const KeyData = this.AllFields.filter(obj => obj.Sub_Category === SubCategory && obj.Visibility === true);
      if (KeyData.length > 0) {
         // const Index = this.TabsList.findIndex(obj => obj === this.LastActiveTab);
         // const Availability = Index !== -1 ? Index + 1 : 0;
         // const TabIndex = this.TabsList.findIndex(obj => obj === SubCategory);
         // if (TabIndex <= Availability) {
         //    return false;
         // } else {
         //    return true;
         // }
         return false;
      } else {
         return true;
      }
   }

   CheckSubJuniorCategoryVisibility(SubJuniorCategory: any) {
      const KeyData = this.AllFields.filter(obj => obj.Sub_Junior_Category === SubJuniorCategory && obj.Visibility === true);
      if (KeyData.length > 0) {
         return true;
      } else {
         return false;
      }
   }

   CheckTimeRelatedDateErrorStatus(DateKey: any, TimeKey: any) {

      if (this.DynamicFGroup.get(DateKey)) {
         return (this.DynamicFGroup.get(DateKey).errors !== null && this.DynamicFGroup.get(DateKey).touched && this.DynamicFGroup.get(DateKey).pristine) ? true :
                  (this.DynamicFGroup.get(TimeKey).errors !== null) ? true : false;
      } else {
         return (this.DynamicFGroup.get(TimeKey).errors !== null && this.DynamicFGroup.get(DateKey).touched && this.DynamicFGroup.get(DateKey).pristine) ? true : false;
      }
   }

   CommonInputReset(control: any, value: any) {
      this.DynamicFGroup.controls[control].setValue(value);
      this.DynamicFGroup.controls[control].clearValidators();
      this.DynamicFGroup.controls[control].setErrors(null);
      this.DynamicFGroup.controls[control].markAsPristine();
      this.DynamicFGroup.controls[control].markAsUntouched();
      this.DynamicFGroup.controls[control].updateValueAndValidity();
   }

   CommonValidatorsSet(control: any, IsTime: boolean, DateControl: any) {
      const ControlKey = IsTime ? DateControl : control;
      const Index = this.AllFieldsValues.findIndex(obj => obj.Key_Name === ControlKey);
      const DataObject = this.AllFieldsValues[Index];
      let FormControlValidation = null;
      if (DataObject.Mandatory || DataObject.Validation) {
         FormControlValidation = Validators.compose([ this.CustomDynamicValidation(DataObject), Validators.min(DataObject.Min_Number_Value), Validators.max(DataObject.Max_Number_Value) ]);
      }
      this.DynamicFGroup.get(control).setValidators(FormControlValidation);
      this.DynamicFGroup.controls[control].updateValueAndValidity({ onlySelf: true, emitEvent: true });
   }

   YesOrNoValidations() {
      const FControlKeys = Object.keys(this.DynamicFGroup.controls);
      FControlKeys.map(obj => {
         const LimitArr = this.AllFieldsValues.filter(obj1 => obj1.Key_Name === obj &&  (obj1.Type === 'Select' || obj1.Type === 'Boolean'));
         if (LimitArr.length > 0) {
            const Parent = LimitArr[0];
            const ChildeArr =  this.AllFieldsValues.filter(obj1 => obj1.If_Parent_Available && obj1.Parent.Key_Name === Parent.Key_Name);
            if (ChildeArr.length > 0) {
               this.subscription.add(
                  this.DynamicFGroup.controls[Parent.Key_Name].valueChanges.subscribe(change => {
                     if (change === 'Yes' || change === 'No' || change === 'DontKnow' ||  change === '' || change === null || change === true || change === false) {
								if (change === 'Yes' || change === true) {
                           ChildeArr.map(obj2 => {
										if (obj2.Key_Name === 'MissedSTEMI' || obj2.Key_Name === 'Autoreperfused' || obj2.Key_Name === 'Others') {
											const SetValue = (obj2.Type === 'Select' || obj2.Type === 'Date' || obj2.Type === 'Number' || obj2.Type === 'Boolean' ) ? null : '';
											this.CommonInputReset(obj2.Key_Name, SetValue);
										} else {
											this.CommonValidatorsSet(obj2.Key_Name, obj2.ThisIsTime, obj2.ParentDateKey);
										}
                           });
                        } else {
                           ChildeArr.map(obj2 => {
										if ( change === 'No' && (obj2.Key_Name === 'MissedSTEMI' || obj2.Key_Name === 'Autoreperfused' || obj2.Key_Name === 'Others')) {
											this.CommonValidatorsSet(obj2.Key_Name, obj2.ThisIsTime, obj2.ParentDateKey);
										} else {
											const SetValue = (obj2.Type === 'Select' || obj2.Type === 'Date' || obj2.Type === 'Number' || obj2.Type === 'Boolean' ) ? null : '';
											this.CommonInputReset(obj2.Key_Name, SetValue);
										}
                           });
                        }
                     }
                  })
               );
               setTimeout(() => {
                  this.DynamicFGroup.controls[Parent.Key_Name].updateValueAndValidity();
               }, 100);
            }
         }
      });
   }

   DOBValueChange( value: any) {
      if (value !== undefined && value !== '' && value !== null) {
         const currentTime = new Date().getTime();
         const birthDateTime = new Date(value).getTime();
         const difference = (currentTime - birthDateTime);
         const ageInYears = difference / (1000 * 60 * 60 * 24 * 365);
         const age = Math.floor(ageInYears);
         if (age > 0) {
            this.DynamicFGroup.controls['Patient_Age'].setValue(age);
         }
      }
   }

   checkRaceType(event: any) {
      if (event && event === 'Others') {
         this.CommonValidatorsSet('Race_Other', false, '');
      } else {
         this.CommonInputReset('Race_Other', '');
      }
   }

	resetReferralData() {
		this.DynamicFGroup.controls.NonCluster_Hospital_Type.setValue('');
		this.DynamicFGroup.controls.NonCluster_Hospital_Address.setValue('');
	}

   checkAdmissionType(event: any) {
		if (event && event === 'Non_Cluster_Spoke') {
			this.CommonValidatorsSet('NonCluster_Hospital_Name', false, '');
			this.CommonInputReset('NonCluster_Hospital_Name_NonSpoke', '');
		}
		if (event && event === 'Non_Cluster_NonSpoke') {
			this.CommonValidatorsSet('NonCluster_Hospital_Name_NonSpoke', false, '');
         this.CommonInputReset('NonCluster_Hospital_Name', '');
		}
      if (event && (event === 'Non_Cluster_Spoke' || event === 'Non_Cluster_NonSpoke')) {
         this.CommonValidatorsSet('NonCluster_Hospital_Type', false, '');
         this.CommonValidatorsSet('NonCluster_Hospital_Address', false, '');
			this.CommonValidatorsSet('NonCluster_TransportMode', false, '');
         this.CommonValidatorsSet('NonCluster_TransportMode_Other', false, '');
         this.CommonValidatorsSet('NonCluster_Hospital_Arrival_Date_Time', false, '');
         this.CommonValidatorsSet('NonCluster_Hospital_Arrival_Time', true, 'NonCluster_Hospital_Arrival_Date_Time');
			this.CommonValidatorsSet('NonCluster_Ambulance_Call_Date_Time', false, '');
         this.CommonValidatorsSet('NonCluster_Ambulance_Call_Time', true, 'NonCluster_Ambulance_Call_Date_Time');
			this.CommonValidatorsSet('NonCluster_Ambulance_Arrival_Date_Time', false, '');
         this.CommonValidatorsSet('NonCluster_Ambulance_Arrival_Time', true, 'NonCluster_Ambulance_Arrival_Date_Time');
			this.CommonValidatorsSet('NonCluster_Ambulance_Departure_Date_Time', false, '');
         this.CommonValidatorsSet('NonCluster_Ambulance_Departure_Time', true, 'NonCluster_Ambulance_Departure_Date_Time');
         this.CommonValidatorsSet('Post_Thrombolysis', false, '');
			this.DynamicFGroup.controls.NonCluster_Hospital_Type.enable();
			this.DynamicFGroup.controls.NonCluster_Hospital_Address.enable();
      } else {
         this.CommonInputReset('NonCluster_Hospital_Name', '');
			this.CommonInputReset('NonCluster_Hospital_Name_NonSpoke', '');
         this.CommonInputReset('NonCluster_Hospital_Type', '');
         this.CommonInputReset('NonCluster_Hospital_Address', '');
			this.CommonInputReset('NonCluster_TransportMode', '');
         this.CommonInputReset('NonCluster_TransportMode_Other', '');
         this.CommonInputReset('NonCluster_Hospital_Arrival_Date_Time', '');
         this.CommonInputReset('NonCluster_Hospital_Arrival_Time', '');
			this.CommonInputReset('NonCluster_Ambulance_Call_Date_Time', '');
         this.CommonInputReset('NonCluster_Ambulance_Call_Time', '');
			this.CommonInputReset('NonCluster_Ambulance_Arrival_Date_Time', '');
         this.CommonInputReset('NonCluster_Ambulance_Arrival_Time', '');
			this.CommonInputReset('NonCluster_Ambulance_Departure_Date_Time', '');
         this.CommonInputReset('NonCluster_Ambulance_Departure_Time', '');
         this.CommonInputReset('Post_Thrombolysis', '');
         this.CommonInputReset('Thrombolytic_Agent', '');
         this.CommonInputReset('Dosage', '');
         this.CommonInputReset('Dosage_Units', '');
         this.CommonInputReset('Post_Thrombolysis_Start_Date_Time', '');
         this.CommonInputReset('Post_Thrombolysis_Start_Time', '');
         this.CommonInputReset('Post_Thrombolysis_End_Date_Time', '');
         this.CommonInputReset('Post_Thrombolysis_End_Time', '');
         this.CommonInputReset('Ninety_Min_ECG', '');
         this.CommonInputReset('Ninety_Min_ECG_Date_Time', '');
         this.CommonInputReset('Ninety_Min_ECG_Time', '');
         this.CommonInputReset('Successful_Lysis', '');
			this.CommonInputReset('MissedSTEMI', '');
         this.CommonInputReset('Autoreperfused', '');
         this.CommonInputReset('Others', '');

      }
   }

   checkPostThrombolysis(event: any) {
		if (event) {
			if (event === 'Yes') {
				this.CommonValidatorsSet('Thrombolytic_Agent', false, '');
				this.CommonValidatorsSet('Dosage', false, '');
				this.CommonValidatorsSet('Dosage_Units', false, '');
				this.CommonValidatorsSet('Post_Thrombolysis_Start_Date_Time', false, '');
				this.CommonValidatorsSet('Post_Thrombolysis_Start_Time', true, 'Post_Thrombolysis_Start_Date_Time');
				this.CommonValidatorsSet('Post_Thrombolysis_End_Date_Time', false, '');
				this.CommonValidatorsSet('Post_Thrombolysis_End_Time', true, 'Post_Thrombolysis_End_Date_Time');
				this.CommonValidatorsSet('Ninety_Min_ECG', false, '');
				this.restPostThrombolysisChild('No');
			} else if (event === 'No') {
				this.restPostThrombolysisChild('Yes');
				this.CommonValidatorsSet('MissedSTEMI', false, '');
				this.CommonValidatorsSet('Autoreperfused', false, '');
				this.CommonValidatorsSet('Others', false, '');
			} else {
				this.restPostThrombolysisChild('All');
			}
		} else {
			this.restPostThrombolysisChild('All');
		}
   }

	restPostThrombolysisChild(type) {
		if (type === 'All' || type === 'Yes') {
			this.CommonInputReset('Thrombolytic_Agent', '');
         this.CommonInputReset('Dosage', '');
         this.CommonInputReset('Dosage_Units', '');
         this.CommonInputReset('Post_Thrombolysis_Start_Date_Time', '');
         this.CommonInputReset('Post_Thrombolysis_Start_Time', '');
         this.CommonInputReset('Post_Thrombolysis_End_Date_Time', '');
         this.CommonInputReset('Post_Thrombolysis_End_Time', '');
         this.CommonInputReset('Ninety_Min_ECG', '');
         this.CommonInputReset('Ninety_Min_ECG_Date_Time', '');
         this.CommonInputReset('Ninety_Min_ECG_Time', '');
         this.CommonInputReset('Successful_Lysis', '');
		} 
		if (type === 'All' || type === 'No') {
			this.CommonInputReset('MissedSTEMI', '');
         this.CommonInputReset('Autoreperfused', '');
         this.CommonInputReset('Others', '');
		}
	}

   checkNinetyMinECG(event: any) {
      if (event && event === 'Yes') {
         this.CommonValidatorsSet('Ninety_Min_ECG_Date_Time', false, '');
         this.CommonValidatorsSet('Ninety_Min_ECG_Time', true, 'Ninety_Min_ECG_Date_Time');
         this.CommonValidatorsSet('Successful_Lysis', false, '');
      } else {
         this.CommonInputReset('Ninety_Min_ECG_Date_Time', '');
         this.CommonInputReset('Ninety_Min_ECG_Time', '');
         this.CommonInputReset('Successful_Lysis', '');
      }
   }

   checkECGDateTime(event: any) {
      if (event && event === 'Manual') {
         this.CommonValidatorsSet('ECG_File', false, '');
         this.CommonValidatorsSet('ECG_Taken_date_time', false, '');
         this.CommonValidatorsSet('ECG_Taken_time', true, 'ECG_Taken_date_time');
      } else {
         this.CommonInputReset('ECG_File', '');
         this.CommonInputReset('ECG_Taken_date_time', '');
         this.CommonInputReset('ECG_Taken_time', '');
      }
   }

   checkStemiConfirmed(event: any) {
      if (event && event === 'Yes') {
         this.CommonValidatorsSet('Stemi_Confirmed_Date_Time', false, '');
         this.CommonValidatorsSet('Stemi_Confirmed_Time', true, 'Stemi_Confirmed_Date_Time');
         this.CommonValidatorsSet('Location_of_Infarction', false, '');
      } else {
         this.CommonInputReset('Stemi_Confirmed_Date_Time', '');
         this.CommonInputReset('Stemi_Confirmed_Time', '');
			this.CommonInputReset('Location_of_Infarction', '');
         // this.DynamicFGroup.get('Location_of_Infarction').clearValidators();
         // this.DynamicFGroup.get('Location_of_Infarction').setErrors(null);
         // this.DynamicFGroup.get('Location_of_Infarction').markAsPristine();
         // this.DynamicFGroup.get('Location_of_Infarction').markAsUntouched();
         // this.DynamicFGroup.get('Location_of_Infarction').updateValueAndValidity();
      }
   }

	checkNonClusterTransportMode(event: any) {
      if (event) {
         if (event === 'Others') {
            this.CommonValidatorsSet('NonCluster_TransportMode_Other', false, '');
         } else {
            this.CommonInputReset('NonCluster_TransportMode_Other', '');
         }
         this.CommonValidatorsSet('NonCluster_Ambulance_Call_Date_Time', false, '');
         this.CommonValidatorsSet('NonCluster_Ambulance_Call_Time', true, 'NonCluster_Ambulance_Call_Date_Time');
         this.CommonValidatorsSet('NonCluster_Ambulance_Arrival_Date_Time', false, '');
         this.CommonValidatorsSet('NonCluster_Ambulance_Arrival_Time', true, 'NonCluster_Ambulance_Arrival_Date_Time');
         this.CommonValidatorsSet('NonCluster_Ambulance_Departure_Date_Time', false, '');
         this.CommonValidatorsSet('NonCluster_Ambulance_Departure_Time', true, 'NonCluster_Ambulance_Departure_Date_Time');
      } else {
         this.CommonInputReset('NonCluster_TransportMode_Other', '');
         this.CommonInputReset('NonCluster_Ambulance_Call_Date_Time', '');
         this.CommonInputReset('NonCluster_Ambulance_Call_Time', '');
         this.CommonInputReset('NonCluster_Ambulance_Arrival_Date_Time', '');
         this.CommonInputReset('NonCluster_Ambulance_Arrival_Time', '');
         this.CommonInputReset('NonCluster_Ambulance_Departure_Date_Time', '');
         this.CommonInputReset('NonCluster_Ambulance_Departure_Time', '');
      }
   }


   checkTransportMode(event: any) {
      if (event) {
         if (event === 'Others') {
            this.CommonValidatorsSet('TransportMode_Other', false, '');
         } else {
            this.CommonInputReset('TransportMode_Other', '');
         }
         this.CommonValidatorsSet('Ambulance_Call_Date_Time', false, '');
         this.CommonValidatorsSet('Patient_Ambulance_Call_Time', true, 'Ambulance_Call_Date_Time');
         this.CommonValidatorsSet('Ambulance_Arrival_Date_Time', false, '');
         this.CommonValidatorsSet('Patient_Ambulance_Arrival_Time', true, 'Ambulance_Arrival_Date_Time');
         this.CommonValidatorsSet('Ambulance_Departure_Date_Time', false, '');
         this.CommonValidatorsSet('Patient_Ambulance_Departure_Time', true, 'Ambulance_Departure_Date_Time');
         if (event === 'Cluster_Ambulance' && this.CurrentHospitalInfo.Hospital_Role !== 'EMS') {
            this.CommonValidatorsSet('ClusterAmbulance', false, '');
            const Data = { Location_Id: this.CurrentHospitalInfo.Location };
            this.DischargeService.DischargeAmbulance_LocationBased(Data).subscribe(response => {
               if (response.Status) {
                  this.AmbulancesList = response.Response;
                  this.DynamicFGroup.controls.ClusterAmbulance.updateValueAndValidity();
               }
            });
            this.filteredAmbulancesList = this.DynamicFGroup.controls.ClusterAmbulance.valueChanges.pipe(
               startWith(''), map(value => {
                  if (value && value !== null && value !== '') {
                     if ( typeof value === 'object') {
                        if (this.LastSelectedAmbulance === null || this.LastSelectedAmbulance !== value._id) {
                           this.LastSelectedAmbulance = value._id;
                        }
                        value = value.Hospital_Name;
                     }
                     return this.AmbulancesList.filter(option => option.Hospital_Name.toLowerCase().includes(value.toLowerCase()));
                  } else {
                     this.LastSelectedAmbulance = null;
                     return this.AmbulancesList;
                  }
               })
            );
         }
      } else {
         this.CommonInputReset('TransportMode_Other', '');
         this.CommonInputReset('ClusterAmbulance', '');
         this.CommonInputReset('Ambulance_Call_Date_Time', '');
         this.CommonInputReset('Patient_Ambulance_Call_Time', '');
         this.CommonInputReset('Ambulance_Arrival_Date_Time', '');
         this.CommonInputReset('Patient_Ambulance_Arrival_Time', '');
         this.CommonInputReset('Ambulance_Departure_Date_Time', '');
         this.CommonInputReset('Patient_Ambulance_Departure_Time', '');
      }
   }

   checkSmoker(event: any) {
      if (event && (event === 'Current_Smoker' || event === 'Past_Smoker' || event === 'Passive')) {
         this.CommonValidatorsSet('Beedies', false, '');
         this.CommonValidatorsSet('Cigarettes', false, '');
         if (this.DynamicFGroup.get('Beedies').value !== true) {
            this.CommonInputReset('Number_of_Beedies', null);
            this.CommonInputReset('Number_of_Beedies_Duration_Years', null);
            this.CommonInputReset('Number_of_Beedies_Duration_Months', null);
         }
         if (this.DynamicFGroup.get('Cigarettes').value !== true) {
            this.CommonInputReset('Number_of_Cigarettes', null);
            this.CommonInputReset('Number_of_Cigarettes_Duration_Years', null);
            this.CommonInputReset('Number_of_Cigarettes_Duration_Months', null);
         }
      } else {
         this.CommonInputReset('Beedies', null);
         this.CommonInputReset('Number_of_Beedies', null);
         this.CommonInputReset('Number_of_Beedies_Duration_Years', null);
         this.CommonInputReset('Number_of_Beedies_Duration_Months', null);
         this.CommonInputReset('Cigarettes', null);
         this.CommonInputReset('Number_of_Cigarettes', null);
         this.CommonInputReset('Number_of_Cigarettes_Duration_Years', null);
         this.CommonInputReset('Number_of_Cigarettes_Duration_Months', null);
      }
   }

   DefaultTime(Key: any) {
      const value = this.DynamicFGroup.get(Key).value;
      return value === null || value === '' ? '00:00' : value;
   }
   DefaultTimeFromArray(ArrayKey: any, Idx: number, Key: any) {
      const FArray = this.DynamicFGroup.get(ArrayKey) as FormArray;
      const FGroup = FArray.controls[Idx] as FormGroup;
      const value = FGroup.get(Key).value;
      return value === null || value === '' ? '00:00' : value;
   }

   HistoryDateChange(TimeKey: any, DateKey: any, ArrayKey: any, Index: number ) {
      const FArray = this.HistoryFGroup.get(ArrayKey) as FormArray;
      const FGroup = FArray.controls[Index] as FormGroup;
      const time = FGroup.get(TimeKey).value;
      const date = FGroup.get(DateKey).value;
      if (date !== '' && date !== null && new Date(new Date(date).setHours(0, 0, 0, 0)).valueOf() === new Date(new Date().setHours(0, 0, 0, 0)).valueOf() ) {
         const maxTime = new Date().getHours() + ':' + new Date().getMinutes();
         if (time !== '' && time !== null && time !== '00:00:00' && time !== '00:00' && time !== '0:0') {
            const timeSplit = time.split(':');
            const exHrs = timeSplit.length > 1 ? Number(timeSplit[0]) : 0;
            const exMin = timeSplit.length > 1 ? Number(timeSplit[1]) : 0;
            const currHrs = new Date().getHours();
            const currMin = new Date().getMinutes();
            const status = exHrs > currHrs ? 'SetNew' : (exHrs === currHrs && exMin > currMin) ? 'SetNew' : 'ManageOld';
            if (status === 'SetNew') {
               FGroup.get(TimeKey).setValue(maxTime);
               FGroup.get(TimeKey).updateValueAndValidity();
            }
         }
      }
   }
   MaxTimeHistoryArray(TimeKey: any, DateKey: any, ArrayKey: any, Index: number ) {
      const FArray = this.HistoryFGroup.get(ArrayKey) as FormArray;
      const FGroup = FArray.controls[Index] as FormGroup;
      const time = FGroup.get(TimeKey).value;
      const date = FGroup.get(DateKey).value;
      const NodeList = document.querySelectorAll('ngx-material-timepicker') as NodeList;
      let Idx = null;
      const IdxArr = [];
      NodeList.forEach( (Node, index) => {
         const inputEle = Node.previousSibling as HTMLInputElement;
         const FControl = inputEle.attributes as NamedNodeMap;
         const HistoryCondition = FControl.getNamedItem('data-history').textContent;
         const FControlName = FControl.getNamedItem('formcontrolname').textContent;
         if (FControlName === TimeKey && HistoryCondition === 'true') {
            IdxArr.push(index);
         }
      });
      const MinIdx = Math.min(...IdxArr);
      if (MinIdx !== Infinity) {
         Idx = MinIdx + Index;
      }
      if (Idx !== null) {
         const pickerArr = this.timePicker.toArray();
         const picker = pickerArr[Idx];
         if (date !== '' && date !== null && new Date(new Date(date).setHours(0, 0, 0, 0)).valueOf() === new Date(new Date().setHours(0, 0, 0, 0)).valueOf() ) {
            const maxTime = new Date().getHours() + ':' + new Date().getMinutes();
            picker.max = maxTime;
         } else {
            picker.max = '23:59';
         }
      }
   }

   MaxTime(TimeKey: any, DateKey: any) {
      const time = this.DynamicFGroup.get(TimeKey).value;
      const date = this.DynamicFGroup.get(DateKey).value;
      const NodeList = document.querySelectorAll('ngx-material-timepicker') as NodeList;
      let Idx = null;
      NodeList.forEach( (Node, index) => {
         const inputEle = Node.previousSibling as HTMLInputElement;
         const FControl = inputEle.attributes as NamedNodeMap;
         const HistoryCondition = FControl.getNamedItem('data-history').textContent;
         const FControlName = FControl.getNamedItem('formcontrolname').textContent;
         if (FControlName === TimeKey && HistoryCondition === 'false') {
            Idx = index;
         }
      });
      if (Idx !== null) {
         const pickerArr = this.timePicker.toArray();
         const picker = pickerArr[Idx];
         if (date !== '' && date !== null && new Date(new Date(date).setHours(0, 0, 0, 0)).valueOf() === new Date(new Date().setHours(0, 0, 0, 0)).valueOf() ) {
            const maxTime = new Date().getHours() + ':' + new Date().getMinutes();
            picker.max = maxTime;
         } else {
            picker.max = '23:59';
         }
      }
   }

	SetReferralData(Hospital: any) {
		if (Hospital !== null && Hospital !== '' ) {
			const Index = this.AllFieldsValues.findIndex(objNew => objNew.Key_Name === 'NonCluster_Hospital_Type');
			const FieldObject = this.AllFieldsValues[Index];
			if (FieldObject.Visibility) {
				this.DynamicFGroup.controls.NonCluster_Hospital_Type.setValue(Hospital.Hospital_Type);
				this.DynamicFGroup.controls.NonCluster_Hospital_Type.disable();
			}
			const AddressIndex = this.AllFieldsValues.findIndex(objNew => objNew.Key_Name === 'NonCluster_Hospital_Address');
			const AddressFieldObject = this.AllFieldsValues[AddressIndex];
			if (AddressFieldObject.Visibility) {
				this.DynamicFGroup.controls.NonCluster_Hospital_Address.setValue(Hospital.Hospital_Address);
				this.DynamicFGroup.controls.NonCluster_Hospital_Address.disable();
			}
		} else {
			this.DynamicFGroup.controls.NonCluster_Hospital_Type.setValue('');
			this.DynamicFGroup.controls.NonCluster_Hospital_Type.enable();
			this.DynamicFGroup.controls.NonCluster_Hospital_Address.setValue('');
			this.DynamicFGroup.controls.NonCluster_Hospital_Address.enable();
		}
	}

	SetReferralDataInHistory(Hospital: any, index: any) {
		const FArray = this.HistoryFGroup.get('HospitalHistory') as FormArray;
		const FGroup = FArray.controls[index] as FormGroup;
		if (Hospital !== null && Hospital !== '') {
			const Index = this.AllFieldsValues.findIndex(objNew => objNew.Key_Name === 'NonCluster_Hospital_Type');
			const FieldObject = this.AllFieldsValues[Index];
			if (FieldObject.Visibility) {
				FGroup.controls.NonCluster_Hospital_Type.setValue(Hospital.Hospital_Type);
				FGroup.controls.NonCluster_Hospital_Type.disable();
			}
			const AddressIndex = this.AllFieldsValues.findIndex(objNew => objNew.Key_Name === 'NonCluster_Hospital_Address');
			const AddressFieldObject = this.AllFieldsValues[AddressIndex];
			if (AddressFieldObject.Visibility) {
				FGroup.controls.NonCluster_Hospital_Address.setValue(Hospital.Hospital_Address);
				FGroup.controls.NonCluster_Hospital_Address.disable();
			}
		} else {
			FGroup.controls.NonCluster_Hospital_Type.setValue('');
			FGroup.controls.NonCluster_Hospital_Type.enable();
			FGroup.controls.NonCluster_Hospital_Address.setValue('');
			FGroup.controls.NonCluster_Hospital_Address.enable();
		}
	}


   openModal(template: TemplateRef<any>) {
      if (this.ModalService.getModalsCount() === 0) {
         this.modalReference = this.ModalService.show(template, {ignoreBackdropClick: false, class: 'modal-md modal-dialog-centered animated bounceInRight'} );
      }
   }


   onFileChange(event) {
      if (event.target.files && event.target.files.length > 0) {
         this.ECGPreviewAvailable = true;
         const reader = new FileReader();
         reader.readAsDataURL(event.target.files[0]);
         reader.onload = (events) => {
            // tslint:disable-next-line:no-string-literal
            this.ECGPreview = events.target['result'];
            this.DynamicFGroup.controls.ECG_File.setValue(this.ECGPreview);
            this.DynamicFGroup.controls.NewECG.setValue(true);
         };
      } else {
         this.DynamicFGroup.controls.ECG_File.setValue('');
         this.fileInput.nativeElement.value = null;
         this.ECGPreviewAvailable = false;
         this.ECGPreview = null;
      }
   }

   onFileConsentChange(event) {
      if (event.target.files && event.target.files.length > 0) {
         this.ConsentPreviewAvailable = true;
         const reader = new FileReader();
         reader.readAsDataURL(event.target.files[0]);
         reader.onload = (events) => {
            // tslint:disable-next-line:no-string-literal
            this.ConsentPreview = events.target['result'];
            if (this.ConsentPreview.includes('data:application/pdf;')) {
               this.ConsentIsPdf = true;
            } else {
               this.ConsentIsPdf = false;
            }
            this.DynamicFGroup.controls.consent_form.setValue(this.ConsentPreview);
            this.DynamicFGroup.controls.NewECG.setValue(true);
         };
      } else {
         this.DynamicFGroup.controls.consent_form.setValue('');
         this.fileInput.nativeElement.value = null;
         this.ConsentPreviewAvailable = false;
         this.ConsentPreview = null;
         this.ConsentIsPdf = false;
      }
   }

   showPdf() {
      const linkSource = this.ConsentPreview;
      const downloadLink = document.createElement('a');
      const fileName = 'Consent_form.pdf';
      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.click();
   }

   onFileAadhaarChange(event) {
      if (event.target.files && event.target.files.length > 0) {
         this.AadhaarPreviewAvailable = true;
         const reader = new FileReader();
         reader.readAsDataURL(event.target.files[0]);
         reader.onload = (events) => {
            // tslint:disable-next-line:no-string-literal
            this.AadhaarPreview = events.target['result'];
            this.DynamicFGroup.controls.Upload_Aadhaar.setValue(this.AadhaarPreview);
         };
      } else {
         this.DynamicFGroup.controls.Upload_Aadhaar.setValue('');
         this.fileInput.nativeElement.value = null;
         this.AadhaarPreviewAvailable = false;
         this.AadhaarPreview = null;
      }
   }

   onFileIdProofChange(event) {
      if (event.target.files && event.target.files.length > 0) {
         this.IdProofPreviewAvailable = true;
         const reader = new FileReader();
         reader.readAsDataURL(event.target.files[0]);
         reader.onload = (events) => {
            // tslint:disable-next-line:no-string-literal
            this.IdProofPreview = events.target['result'];
            this.DynamicFGroup.controls.Upload_Id_Proof.setValue(this.IdProofPreview);
         };
      } else {
         this.DynamicFGroup.controls.Upload_Id_Proof.setValue('');
         this.fileInput.nativeElement.value = null;
         this.IdProofPreviewAvailable = false;
         this.IdProofPreview = null;
      }
   }

	showECG() {
		if (this.ECGPreviewAvailable) {
			const ImageOrPdf = this.ECGPreview.includes('data:application/pdf;base64,') ? 'Pdf' : 'Image';
			if (ImageOrPdf === 'Image') {
				this.ShowECGPreview = true;
			} else if (ImageOrPdf === 'Pdf') {
				const byteString = window.atob(this.ECGPreview.replace('data:application/pdf;base64,', ''));
				const arrayBuffer = new ArrayBuffer(byteString.length);
				const int8Array = new Uint8Array(arrayBuffer);
				for (let i = 0; i < byteString.length; i++) {
					int8Array[i] = byteString.charCodeAt(i);
				}
				const blob = new Blob([int8Array], { type: 'application/pdf' });
				var fileURL = URL.createObjectURL(blob);
				window.open(fileURL);
			}
		} else {
			this.ShowECGPreview = false;
		}
	}


   HospitalDisplayName(Hospital: any) {
      return (Hospital && Hospital !== null && Hospital !== '') ? Hospital.Hospital_Name : null;
   }
   AutocompleteBlur(key: any) {
      setTimeout(() => {
         const value =  this.DynamicFGroup.controls[key].value;
         if (!value || value === null || value === '' || typeof value !== 'object') {
            this.DynamicFGroup.controls[key].setValue(null);
         }
      }, 500);
   }
   HistoryAutocompleteBlur(key: any, index: any, FArrayKey: string) {
      setTimeout(() => {
         const FArray = this.HistoryFGroup.get(FArrayKey) as FormArray;
         const FGroup =  FArray.controls[index] as FormGroup;
         const value =  this.DynamicFGroup.controls[key].value;
         if (!value || value === null || value === '' || typeof value !== 'object') {
            this.DynamicFGroup.controls[key].setValue(null);
         }
      }, 500);
   }

   CommonInputHistoryReset(FGroup: FormGroup, control: any, value: any) {
      FGroup.controls[control].setValue(value);
      FGroup.controls[control].clearValidators();
      FGroup.controls[control].setErrors(null);
      FGroup.controls[control].markAsPristine();
      FGroup.controls[control].markAsUntouched();
      FGroup.controls[control].updateValueAndValidity();
   }

   CommonHistoryValidatorsSet(FGroup: FormGroup, control: any, IsTime: boolean, DateControl: any) {
      const ControlKey = IsTime ? DateControl : control;
      const Index = this.AllFieldsValues.findIndex(obj => obj.Key_Name === ControlKey);
      const DataObject = this.AllFieldsValues[Index];
      let FormControlValidation = null;
      if (DataObject.Mandatory || DataObject.Validation) {
         FormControlValidation = Validators.compose([ this.CustomDynamicValidation(DataObject), Validators.min(DataObject.Min_Number_Value), Validators.max(DataObject.Max_Number_Value) ]);
      }
      FGroup.get(control).setValidators(FormControlValidation);
      FGroup.controls[control].updateValueAndValidity({ onlySelf: true, emitEvent: true });
   }

   checkTransportHistoryMode(event: any, FGroup: FormGroup) {
      if (event ) {
         if (event === 'Others') {
            this.CommonHistoryValidatorsSet(FGroup, 'TransportMode_Other', false, '');
         } else {
            this.CommonInputHistoryReset(FGroup, 'TransportMode_Other', '');
         }
         this.CommonHistoryValidatorsSet(FGroup, 'Ambulance_Call_Date_Time', false, '');
         this.CommonHistoryValidatorsSet(FGroup, 'Patient_Ambulance_Call_Time', true, 'Ambulance_Call_Date_Time');
         this.CommonHistoryValidatorsSet(FGroup, 'Ambulance_Arrival_Date_Time', false, '');
         this.CommonHistoryValidatorsSet(FGroup, 'Patient_Ambulance_Arrival_Time', true, 'Ambulance_Arrival_Date_Time');
         this.CommonHistoryValidatorsSet(FGroup, 'Ambulance_Departure_Date_Time', false, '');
         this.CommonHistoryValidatorsSet(FGroup, 'Patient_Ambulance_Departure_Time', true, 'Ambulance_Departure_Date_Time');
         if (event === 'Cluster_Ambulance') {
            this.CommonHistoryValidatorsSet(FGroup, 'ClusterAmbulance', false, '');
            const Data = { Location_Id: this.CurrentHospitalInfo.Location };
            this.DischargeService.DischargeAmbulance_LocationBased(Data).subscribe(response => {
               if (response.Status) {
                  this.AmbulancesList = response.Response;
                  FGroup.controls.ClusterAmbulance.updateValueAndValidity();
               }
            });
            this.filteredAmbulancesList = FGroup.controls.ClusterAmbulance.valueChanges.pipe(
               startWith(''), map(value => {
                  if (value && value !== null && value !== '') {
                     if ( typeof value === 'object') {
                        if (this.LastSelectedAmbulance === null || this.LastSelectedAmbulance !== value._id) {
                           this.LastSelectedAmbulance = value._id;
                        }
                        value = value.Hospital_Name;
                     }
                     return this.AmbulancesList.filter(option => option.Hospital_Name.toLowerCase().includes(value.toLowerCase()));
                  } else {
                     this.LastSelectedAmbulance = null;
                     return this.AmbulancesList;
                  }
               })
            );
         }
      } else {
         this.CommonInputHistoryReset(FGroup, 'TransportMode_Other', '');
         this.CommonInputHistoryReset(FGroup, 'ClusterAmbulance', '');
         this.CommonInputHistoryReset(FGroup, 'Ambulance_Call_Date_Time', '');
         this.CommonInputHistoryReset(FGroup, 'Patient_Ambulance_Call_Time', '');
         this.CommonInputHistoryReset(FGroup, 'Ambulance_Arrival_Date_Time', '');
         this.CommonInputHistoryReset(FGroup, 'Patient_Ambulance_Arrival_Time', '');
         this.CommonInputHistoryReset(FGroup, 'Ambulance_Departure_Date_Time', '');
         this.CommonInputHistoryReset(FGroup, 'Patient_Ambulance_Departure_Time', '');
      }
   }


   EditHistoryArray(formArray: any, index: any) {
      this.SecondaryEdit = true;
      if (this.SecondaryCurrentEdit.FormArray !== '') {
         const PreFArray = this.HistoryFGroup.get(this.SecondaryCurrentEdit.FormArray) as FormArray;
         const PreFGroup =  PreFArray.controls[this.SecondaryCurrentEdit.Index] as FormGroup;
         PreFGroup.controls['EditActivate'].setValue(false);
         Object.keys(PreFGroup.controls).map(obj => {
            const PreFControl = PreFGroup.controls[obj] as FormControl;
            PreFControl.setValue(this.SecondaryData[obj]);
            PreFControl.disable();
            PreFControl.clearValidators();
            PreFControl.setValidators(null);
         });
         this.historySubscription.unsubscribe();
         this.historySubscription = new Subscription();
      }
      const FArray = this.HistoryFGroup.get(formArray) as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      this.SecondaryCurrentEdit.FormArray = formArray;
      this.SecondaryCurrentEdit.Index = index;
      this.SecondaryData = FGroup.value;
      FGroup.controls['EditActivate'].setValue(true);
      Object.keys(FGroup.controls).map(obj => {
         const FControl = FGroup.controls[obj] as FormControl;
         const fieldIndex = this.AllFieldsValues.findIndex(objNew => objNew.Key_Name === obj);
         if (obj !== 'Hospital_Name' && obj !== 'Hospital_Address' && obj !== 'TransportMode' && obj !== 'ClusterAmbulance' && obj !== 'NonCluster_Hospital_Type' && obj !== 'NonCluster_Hospital_Address') {
            FControl.enable();
         }
         if (fieldIndex >= 0) {
            const validationControl = this.AllFieldsValues[fieldIndex];
            FControl.setValidators(Validators.compose([this.CustomDynamicValidation(validationControl), Validators.min(validationControl.Min_Number_Value), Validators.max(validationControl.Max_Number_Value)]));
         }
      });
      if (formArray === 'TransportHistory') {
         const Value = FGroup.getRawValue().TransportMode;
         this.checkTransportHistoryMode(Value, FGroup);
         this.historySubscription.add(
            FGroup.controls.TransportMode.valueChanges.subscribe(change => {
               this.checkTransportHistoryMode(change, FGroup);
            })
         );
      }
      if (formArray === 'ClinicalHistory') {
         this.EditHistoryBMICalc(formArray, index);
      }
   }
   resetFArrayHistory(formArray: any, index: any) {
      this.SecondaryEdit = false;
      if (this.SecondaryCurrentEdit.FormArray !== '') {
         const PreFArray = this.HistoryFGroup.get(formArray) as FormArray;
         const PreFGroup =  PreFArray.controls[index] as FormGroup;
         PreFGroup.controls['EditActivate'].setValue(false);
         Object.keys(PreFGroup.controls).map(obj => {
            const PreFControl = PreFGroup.controls[obj] as FormControl;
            PreFControl.setValue(this.SecondaryData[obj]);
            PreFControl.disable();
            PreFControl.clearValidators();
            PreFControl.setValidators(null);
         });
      }
      this.historySubscription.unsubscribe();
      this.historySubscription = new Subscription();
      this.SecondaryCurrentEdit.FormArray = '';
      this.SecondaryCurrentEdit.Index = '';
   }

   EditHistoryBMICalc(formArray: any, index: any) {
      const FArray = this.HistoryFGroup.get(formArray) as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      this.historySubscription.add(
         FGroup.get('Patient_Weight').valueChanges.subscribe(change => {
            let weight = change;
            let height = FGroup.get('Patient_Height').value;
            if (weight !== null && weight !== '' && height !== null && height !== '') {
               height = Number(height);
               weight = Number(weight);
               const BMI = (weight / ((height / 100) * (height / 100 ))).toFixed(2);
               FGroup.get('BMI').setValue(BMI);
            }
         })
      );
      this.historySubscription.add(
         FGroup.get('Patient_Height').valueChanges.subscribe(change => {
            let height = change;
            let weight = FGroup.get('Patient_Weight').value;
            if (weight !== null && weight !== '' && height !== null && height !== '') {
               height = Number(height);
               weight = Number(weight);
               const BMI = (weight / ((height / 100) * (height / 100 ))).toFixed(2);
               FGroup.get('BMI').setValue(BMI);
            }
         })
      );
   }

   UpdateDateTimeInHistory(subJuniorCategory: any, FGroup: FormGroup) {
      const Fields = this.AllFieldsValues.filter(obj => obj.Sub_Junior_Category === subJuniorCategory);
      Object.keys(FGroup.controls).map(obj => {
         const Field = Fields.filter(objNew => objNew.Key_Name === obj );
         if (Field.length > 0  && Field[0].ThisIsTime === true) {
            let Time = FGroup.controls[obj].value;
            const date = FGroup.controls[Field[0].ParentDateKey].value;
            Time = (Time !== null && Time !== '' && Time !== '0:0' && Time !== '00:00:00') ? Time.split(':').length <= 2  ? (Time + ':00') : Time : '00:00:00';
            let DateTime =  new Date(date);
            DateTime = new Date(DateTime.getFullYear() + '-' + (DateTime.getMonth() + 1) + '-' + DateTime.getDate() + ' ' + Time);
            FGroup.controls[Field[0].ParentDateKey].setValue(DateTime);
         }
      });
      return FGroup;
   }

   updateNonClusterArrival(index: any) {
      this.SecondaryUpdating = true;
      const FArray = this.HistoryFGroup.get('HospitalHistory') as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      this.UpdateDateTimeInHistory('Hospital_Details', FGroup);
      if (FGroup.status === 'VALID') {
         this.PatientService.PatientNonCluster_Update(FGroup.getRawValue()).subscribe(response => {
            this.SecondaryUpdating = false;
            if (response.Status) {
               this.SecondaryEdit = false;
               FGroup.controls['EditActivate'].setValue(false);
               this.SecondaryCurrentEdit.FormArray = '';
               this.SecondaryCurrentEdit.Index = '';
               Object.keys(FGroup.controls).map(obj => {
                  const FControl = FGroup.controls[obj] as FormControl;
                  FControl.disable();
                  FControl.clearValidators();
                  FControl.setValidators(null);
               });
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Hospital Details Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      }
   }

   updateHospitalArrival(index: any) {
      this.SecondaryUpdating = true;
      const FArray = this.HistoryFGroup.get('HospitalHistory') as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      this.UpdateDateTimeInHistory('Patient_Details', FGroup);
      if (FGroup.status === 'VALID') {
         this.PatientService.PatientBasicHospital_Update(FGroup.getRawValue()).subscribe(response => {
            this.SecondaryUpdating = false;
            if (response.Status) {
               this.SecondaryEdit = false;
               FGroup.controls['EditActivate'].setValue(false);
               this.SecondaryCurrentEdit.FormArray = '';
               this.SecondaryCurrentEdit.Index = '';
               Object.keys(FGroup.controls).map(obj => {
                  const FControl = FGroup.controls[obj] as FormControl;
                  FControl.disable();
                  FControl.clearValidators();
                  FControl.setValidators(null);
               });
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Hospital Details Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      }
   }

   updateTransport(index: any) {
      this.SecondaryUpdating = true;
      const FArray = this.HistoryFGroup.get('TransportHistory') as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      this.UpdateDateTimeInHistory('Transport_Details', FGroup);
      if (FGroup.status === 'VALID') {
         this.PatientService.PatientBasicTransport_Update(FGroup.getRawValue()).subscribe(response => {
            this.SecondaryUpdating = false;
            if (response.Status) {
               this.SecondaryEdit = false;
               FGroup.controls['EditActivate'].setValue(false);
               this.SecondaryCurrentEdit.FormArray = '';
               this.SecondaryCurrentEdit.Index = '';
               Object.keys(FGroup.controls).map(obj => {
                  const FControl = FGroup.controls[obj] as FormControl;
                  FControl.disable();
                  FControl.clearValidators();
                  FControl.setValidators(null);
               });
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Transport Details Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      }
   }

   updateClinical(index: any) {
      this.SecondaryUpdating = true;
      const FArray = this.HistoryFGroup.get('ClinicalHistory') as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      if (FGroup.status === 'VALID') {
         this.PatientService.PatientClinical_Update(FGroup.getRawValue()).subscribe(response => {
            this.SecondaryUpdating = false;
            if (response.Status) {
               this.SecondaryEdit = false;
               FGroup.controls['EditActivate'].setValue(false);
               this.SecondaryCurrentEdit.FormArray = '';
               this.SecondaryCurrentEdit.Index = '';
               Object.keys(FGroup.controls).map(obj => {
                  const FControl = FGroup.controls[obj] as FormControl;
                  FControl.disable();
                  FControl.clearValidators();
                  FControl.setValidators(null);
               });
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Clinical Details Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      }
   }

   updateCheckList(index: any) {
      this.SecondaryUpdating = true;
      const FArray = this.HistoryFGroup.get('CheckListHistory') as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      if (FGroup.status === 'VALID') {
         this.PatientService.PatientCheckList_Update(FGroup.getRawValue()).subscribe(response => {
            this.SecondaryUpdating = false;
            if (response.Status) {
               this.SecondaryEdit = false;
               FGroup.controls['EditActivate'].setValue(false);
               this.SecondaryCurrentEdit.FormArray = '';
               this.SecondaryCurrentEdit.Index = '';
               Object.keys(FGroup.controls).map(obj => {
                  const FControl = FGroup.controls[obj] as FormControl;
                  FControl.disable();
                  FControl.clearValidators();
                  FControl.setValidators(null);
               });
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Fibrinolytic Checklist Details Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      }
   }
   CreateCheckList(index: any) {
      this.SecondaryUpdating = true;
      const FArray = this.HistoryFGroup.get('CheckListHistory') as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      if (FGroup.status === 'VALID') {
         const Data = FGroup.getRawValue();
         let TempLastActiveTab = 'Fibrinolytic_Checklist';
         if (this.LastActiveTab === 'Basic_Details' && this.DisableMedication !== true) {
            TempLastActiveTab = 'Fibrinolytic_Checklist';
         } else if (this.LastActiveTab === 'Basic_Details' && this.DisableMedication === true) {
            TempLastActiveTab = 'Medication_During_Transportation';
         }
         Data.LastActiveTab = TempLastActiveTab;
         this.PatientService.PatientChecklist_Create(Data).subscribe(response => {
            this.SecondaryUpdating = false;
            if (response.Status) {
               this.SecondaryEdit = false;
               FGroup.controls['EditActivate'].setValue(false);
               this.SecondaryCurrentEdit.FormArray = '';
               this.SecondaryCurrentEdit.Index = '';
               Object.keys(FGroup.controls).map(obj => {
                  const FControl = FGroup.controls[obj] as FormControl;
                  FControl.disable();
                  FControl.clearValidators();
                  FControl.setValidators(null);
               });
               if (this.LastActiveTab === 'Basic_Details') {
                  this.LastActiveTab = TempLastActiveTab;
               }
               if (TempLastActiveTab === 'Medication_During_Transportation') {
                  this.TabChangeEvent(3);
               } else {
                  this.TabChangeEvent(2);
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Fibrinolytic Checklist Details Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      }
   }

   BasicSubmit() {

      this.DynamicFGroup.updateValueAndValidity();
      let FormValid = true;
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         const FControl = this.DynamicFGroup.controls[obj];
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if (!this.ExistingPatient && FormValid && !this.FormUploading) {
         this.FormUploading = true;
         this.PatientService.PatientBasicDetails_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Basic Details Successfully Created!' });
               this.router.navigate(['/Patient-Manage/Patient-Details/', response.Response._id]);
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               console.log(obj);
               console.log(FControl);
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         });
         const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
         if (firstElementWithError) {
            window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
         }
      }

   }
   BasicUpdate() {
      this.DynamicFGroup.updateValueAndValidity();
      let FormValid = true;
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         const FControl = this.DynamicFGroup.controls[obj];
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if (this.ExistingPatient && FormValid && !this.FormUploading) {
         this.FormUploading = true;
         const Data = this.DynamicFGroup.getRawValue();
         if (this.LastActiveTab === 'Basic_Details'  && this.DisableChecklist && (this.MedicationHide === true || this.DisableMedication === true)) {
            Data.LastActiveTab = 'Medication_During_Transportation';
         } else  if (this.LastActiveTab === 'Basic_Details' ) {
            Data.LastActiveTab = 'Fibrinolytic_Checklist';
         }
         this.PatientService.PatientBasicDetails_Update(Data).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               const Result = response.Response.Result;
               const Medication = response.Response.Medication;
               if (this.PatientInfo.TransferBending && Result.TransferBending !== true) {
                  this.AllFieldsValues.map((obj, i) => {
                     if (obj.Sub_Category === 'Cardiac_History'  || obj.Sub_Junior_Category === 'Co-Morbid_Conditions' || obj.Sub_Junior_Category === 'Contact_Details' ) {
                        this.AllFieldsValues[i].Disabled = false;
                     }
                     if (this.DisableChecklist !== true && obj.Sub_Junior_Category === 'Fibrinolytic_Checklist' ) {
                        this.AllFieldsValues[i].Disabled = false;
                     }
                     if (this.DisableMedication !== true && obj.Sub_Junior_Category === 'Medication_During_Transportation' ) {
                        this.AllFieldsValues[i].Disabled = false;
                     }
                  });
                  this.CheckListId = null;
               }
               this.PatientInfo = Result;
               this.InitialHospital = this.PatientInfo.Initiated_Hospital._id;
               this.dataPassingService.UpdatePatientNameData(this.PatientInfo.Patient_Name);
               this.dataPassingService.UpdatePatientUniqueData(this.PatientInfo.Patient_Unique);
               this.PatientUpdateData(Result, 'Basic', false);
               if (Medication === null) {
                  this.TransportationId = null;
                  this.AllFieldsValues.map(obj => {
                     if (obj.Sub_Junior_Category === 'Medication_During_Transportation') {
                        const SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
                        obj.DefaultValue = SetValue;
                        obj.CurrentValue = SetValue;
                     }
                  });
               } else {
                  this.TransportationId = Medication._id;
                  this.PatientUpdateData(Medication, 'Transportation', false);
               }
               this.DisableMedicationTransportation();
               if (this.LastActiveTab === 'Basic_Details'  && this.DisableChecklist && (this.MedicationHide === true || this.DisableMedication === true)) {
                  this.LastActiveTab = 'Medication_During_Transportation';
                  this.TabChangeEvent(3);
               } else if (this.LastActiveTab === 'Basic_Details'  && this.DisableChecklist) {
                  this.LastActiveTab = 'Fibrinolytic_Checklist';
                  this.TabChangeEvent(2);
               } else {
                  this.TabChangeEvent(1);
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Basic Details Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         });
         const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
         if (firstElementWithError) {
            window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
         }
      }
   }



   ChecklistSubmit() {
      this.DynamicFGroup.updateValueAndValidity();
      let FormValid = true;
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         const FControl = this.DynamicFGroup.controls[obj];
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if (FormValid && !this.FormUploading) {
         this.FormUploading = true;
         const Data = this.DynamicFGroup.getRawValue();
         let TempLastActiveTab = 'Fibrinolytic_Checklist';
         if (this.LastActiveTab === 'Basic_Details' && this.DisableMedication !== true) {
            TempLastActiveTab = 'Fibrinolytic_Checklist';
         } else if (this.LastActiveTab === 'Basic_Details' && this.DisableMedication === true) {
            TempLastActiveTab = 'Medication_During_Transportation';
         } else if ((this.LastActiveTab === 'Fibrinolytic_Checklist' || this.LastActiveTab === 'Medication_During_Transportation')  && (this.MedicationHide === true || this.DisableMedication === true)) {
            TempLastActiveTab = 'Medication_During_Transportation';
         }
         Data.LastActiveTab = TempLastActiveTab;
         this.PatientService.PatientFibrinolyticChecklist_Create(Data).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               if (response.Response.length >= 1 ) {
                  response.Response.map(obj => {
                     if (obj.Hospital._id === this.InitialHospital) {
                        this.CheckListId = response.Response[response.Response.length - 1]._id;
                     }
                  });
               }
               this.PatientUpdateData(response.Response, 'CheckList', false);
               if (this.LastActiveTab === 'Basic_Details' || this.LastActiveTab === 'Fibrinolytic_Checklist') {
                  this.LastActiveTab = TempLastActiveTab;
               }
               if (TempLastActiveTab === 'Medication_During_Transportation') {
                  this.TabChangeEvent(3);
               } else {
                  this.TabChangeEvent(2);
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Fibrinolytic Checklist Successfully Created!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         });
         const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
         if (firstElementWithError) {
            window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
         }
      }
   }
   ChecklistUpdate() {
      this.DynamicFGroup.updateValueAndValidity();
      let FormValid = true;
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         const FControl = this.DynamicFGroup.controls[obj];
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if ( FormValid && !this.FormUploading) {
         this.FormUploading = true;
         const Data = this.DynamicFGroup.getRawValue();
         if (this.LastActiveTab === 'Fibrinolytic_Checklist'  && (this.MedicationHide === true || this.DisableMedication === true)) {
            Data.LastActiveTab = 'Medication_During_Transportation';
         }
         this.PatientService.PatientFibrinolyticChecklist_Update(Data).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.PatientUpdateData(response.Response, 'CheckList', false);
               if (this.LastActiveTab === 'Fibrinolytic_Checklist'  && (this.MedicationHide === true || this.DisableMedication === true)) {
                  this.LastActiveTab = 'Medication_During_Transportation';
               }
               if (this.DisableMedication || this.MedicationHide === true) {
                  this.TabChangeEvent(3);
               } else {
                  this.TabChangeEvent(2);
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Fibrinolytic Checklist Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         });
         const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
         if (firstElementWithError) {
            window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
         }
      }
   }



   TransportationSubmit() {
      this.DynamicFGroup.updateValueAndValidity();
      let FormValid = true;
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         const FControl = this.DynamicFGroup.controls[obj];
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if (FormValid && !this.FormUploading) {
         this.FormUploading = true;
         const Data = this.DynamicFGroup.getRawValue();
         let TempLastActiveTab = 'Medication_During_Transportation';
         if (this.LastActiveTab === 'Fibrinolytic_Checklist' && this.PatientInfo.Initiated_Hospital.Hospital_Role === 'EMS') {
            TempLastActiveTab = 'Cardiac_History';
         } else if (this.LastActiveTab === 'Fibrinolytic_Checklist') {
            TempLastActiveTab = 'Medication_During_Transportation';
         }
         Data.LastActiveTab = TempLastActiveTab;
         this.PatientService.PatientMedicationDuringTransportation_Create(Data).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.PatientUpdateData(response.Response, 'Transportation', false);
               this.TransportationId = response.Response._id;
               if (this.LastActiveTab === 'Fibrinolytic_Checklist') {
                  this.LastActiveTab = TempLastActiveTab;
               }
               if (TempLastActiveTab === 'Cardiac_History') {
                  this.TabChangeEvent(4);
               } else {
                  this.TabChangeEvent(3);
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Medication During Transportation Successfully Created!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         });
         const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
         if (firstElementWithError) {
            window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
         }
      }

   }
   TransportationUpdate() {
      this.DynamicFGroup.updateValueAndValidity();
      let FormValid = true;
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         const FControl = this.DynamicFGroup.controls[obj];
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if ( FormValid && !this.FormUploading) {
         this.FormUploading = true;
         this.PatientService.PatientMedicationDuringTransportation_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.PatientUpdateData(response.Response, 'Transportation', false);
               if (this.PatientInfo.Initiated_Hospital.Hospital_Role === 'EMS') {
                  this.TabChangeEvent(4);
               } else {
                  this.TabChangeEvent(3);
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Medication During Transportation Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         });
         const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
         if (firstElementWithError) {
            window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
         }
      }
   }



   CardiacHistorySubmit() {
      this.DynamicFGroup.updateValueAndValidity();
      let FormValid = true;
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         const FControl = this.DynamicFGroup.controls[obj];
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if (FormValid && !this.FormUploading) {
         this.FormUploading = true;
         this.PatientService.PatientCardiacHistory_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.PatientUpdateData(response.Response, 'CardiacHistory', false);
               this.CardiacHistoryId = response.Response._id;
               this.TabChangeEvent(4);
               if (this.LastActiveTab === 'Medication_During_Transportation') {
                  this.LastActiveTab = 'Cardiac_History';
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Cardiac History Successfully Created!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         });
         const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid, .mat-checkbox.ng-invalid');
         if (firstElementWithError) {
            window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
         }
      }

   }
   CardiacHistoryUpdate() {
      this.DynamicFGroup.updateValueAndValidity();
      let FormValid = true;
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         const FControl = this.DynamicFGroup.controls[obj];
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if ( FormValid && !this.FormUploading) {
         this.FormUploading = true;
         this.PatientService.PatientCardiacHistory_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.PatientUpdateData(response.Response, 'CardiacHistory', false);
               this.TabChangeEvent(4);
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Cardiac History Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         });
         const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
         if (firstElementWithError) {
            window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
         }
      }
   }



   CoMorbidConditionSubmit() {
      this.DynamicFGroup.updateValueAndValidity();
      let FormValid = true;
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         const FControl = this.DynamicFGroup.controls[obj];
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if (FormValid && !this.FormUploading) {
         this.FormUploading = true;
         this.PatientService.PatientCoMorbidCondition_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               if (this.PatientInfo.Initiated_Hospital.Hospital_Role === 'EMS') {
                  this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                     this.router.navigate(['/Patient-Manage/Discharge-Transfer', this.UrlParams.Patient])
                  );
               } else {
                  this.PatientUpdateData(response.Response, 'CoMorbidConditions', false);
                  this.CoMorbidConditionId = response.Response._id;
                  this.TabChangeEvent(5);
                  if (this.LastActiveTab === 'Cardiac_History') {
                     this.LastActiveTab = 'Co-Morbid_Conditions';
                  }
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Co-Morbid Condition Successfully Created!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         });
         const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
         if (firstElementWithError) {
            window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
         }
      }

   }
   CoMorbidConditionUpdate() {
      this.DynamicFGroup.updateValueAndValidity();
      let FormValid = true;
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         const FControl = this.DynamicFGroup.controls[obj];
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if ( FormValid && !this.FormUploading) {
         this.FormUploading = true;
         this.PatientService.PatientCoMorbidCondition_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               if (this.PatientInfo.Initiated_Hospital.Hospital_Role === 'EMS') {
                  this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                     this.router.navigate(['/Patient-Manage/Discharge-Transfer', this.UrlParams.Patient])
                  );
               } else {
                  this.PatientUpdateData(response.Response, 'CoMorbidConditions', false);
                  this.TabChangeEvent(5);
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Co-Morbid Condition Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         });
         const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
         if (firstElementWithError) {
            window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
         }
      }
   }



   ContactSubmit() {
      this.DynamicFGroup.updateValueAndValidity();
      let FormValid = true;
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         const FControl = this.DynamicFGroup.controls[obj];
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if (FormValid && !this.FormUploading) {
         this.FormUploading = true;
         this.PatientService.PatientContactDetails_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               // this.PatientUpdateData(response.Response, 'ContactDetails', false);
               if ( this.PatientInfo.Initiated_Hospital.Hospital_Role === 'Spoke S2') {
                  this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                     this.router.navigate(['/Patient-Manage/Hospital-Summary', this.UrlParams.Patient])
                  );
               } else {
                  this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                     this.router.navigate(['/Patient-Manage/Thrombolysis', this.UrlParams.Patient])
                  );
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Contact Details Successfully Created!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         });
         const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
         if (firstElementWithError) {
            window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
         }
      }
   }
   ContactUpdate() {
      this.DynamicFGroup.updateValueAndValidity();
      let FormValid = true;
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         const FControl = this.DynamicFGroup.controls[obj];
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if ( FormValid && !this.FormUploading) {
         this.FormUploading = true;
         this.PatientService.PatientContactDetails_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               // this.PatientUpdateData(response.Response, 'ContactDetails', false);
               if (this.PatientInfo.Initiated_Hospital.Hospital_Role === 'Spoke S2') {
                  this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                     this.router.navigate(['/Patient-Manage/Hospital-Summary', this.UrlParams.Patient])
                  );
               } else {
                  this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                     this.router.navigate(['/Patient-Manage/Thrombolysis', this.UrlParams.Patient])
                  );
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Contact Details Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         });
         const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
         if (firstElementWithError) {
            window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
         }
      }
   }
}
