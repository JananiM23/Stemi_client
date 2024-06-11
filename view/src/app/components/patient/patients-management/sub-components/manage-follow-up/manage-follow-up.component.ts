import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, Validators, FormControl, ValidatorFn, ValidationErrors, AbstractControl, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { DateAdapter, NativeDateAdapter } from '@angular/material/core';


import { DataPassingService } from './../../../../../services/common-services/data-passing.service';
import { LoginManagementService } from './../../../../../services/login-management/login-management.service';
import { ToastrService } from './../../../../../services/common-services/toastr.service';

import { PatientDetailsService } from 'src/app/services/patient-management/patient-details/patient-details.service';
import { ThrombolysisService } from 'src/app/services/patient-management/thrombolysis/thrombolysis.service';
import { PciService } from 'src/app/services/patient-management/pci/pci.service';
import { HospitalSummaryService } from 'src/app/services/patient-management/hospital-summary/hospital-summary.service';
import { DischargeTransferService } from 'src/app/services/patient-management/discharge-transfer/discharge-transfer.service';
import { FollowupService } from 'src/app/services/patient-management/followup/followup.service';

import { ClusterManagementService } from './../../../../../services/cluster-management/cluster-management.service';
import { HospitalManagementService } from './../../../../../services/hospital-management/hospital-management.service';
import { MatTabGroup } from '@angular/material';

export class MyDateAdapter extends NativeDateAdapter {
   format(date: Date, displayFormat: any): string {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate();
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
   }
}

export interface Locations { _id: string; Location_Name: string; }
export interface Clusters {  _id: string;  Cluster_Name: string; }
export interface Hospitals {  _id: string;  Hospital_Name: string; }
@Component({
  selector: 'app-manage-follow-up',
  templateUrl: './manage-follow-up.component.html',
  styleUrls: ['./manage-follow-up.component.css'],
  providers: [{provide: DateAdapter, useClass: MyDateAdapter}],
})
export class ManageFollowUpComponent implements OnInit, OnDestroy {

   @ViewChild('tabs') tabGroup: MatTabGroup;

   private subscription: Subscription = new Subscription();
   private dataSubscription: Subscription = new Subscription();
   private historySubscription: Subscription = new Subscription();


   AllFields: any[] = [];
   AllValidations: any[] = [];
   AllFieldsValues: any[] = [];

   TabsList: any[] = ['Follow_Up_Details', 'Medication', 'Events'];


   StaticFollowupDuration: any[] = [{Name: '1 Month', Key: '1_Month'},
                                 {Name: '6 Month', Key: '6_Months'},
                                 {Name: '1 Year', Key: '1_Year'} ];

   FollowupDuration: any[] = [{Name: '1 Month', Key: '1_Month'},
                                 {Name: '6 Month', Key: '6_Months'},
                                 {Name: '1 Year', Key: '1_Year'} ];

   DynamicFGroup: FormGroup;
   HistoryFGroup: FormGroup;

   FormLoaded = false;
   FormUploading = false;

   FollowUpArray: FormArray;
   FollowUpHistoryAvailable = false;
   MedicationArray: FormArray;
   MedicationData = [];
   EventsArray: FormArray;
   EventsData = [];

   FollowUpReadOnly = false;
   MedicationReadOnly = false;
   EventsReadOnly = false;

   MonthOfMedication: Date;
   ShowMonthOfMedication: Date;

   MonthOfEvent: Date;
   ShowMonthOfEvent: Date;

   CurrentTabIndex = 0;

   UrlParams = null;
   ExistingPatient = true;

   ReadonlyPage = false;
   LastActiveTab = 'Events';
   InitialHospital = null;
   FollowupId = null;
   FollowupMedicationId = null;
   FollowupEventsId = null;

   UserInfo: any;
   Followups: any;
   FollowUpDetails: any[] = [];
   MedicationDetails: any[] = [];
   EventDetails: any[] = [];

   ContentLoading = true;

   CurrentHospitalInfo: any = null;
   PatientInfo: any;

   PatientLocation: any;
   ClusterList: Clusters[] = [];
   HospitalList: any;
   Address: any;
	HistoryHospitalList: any[] = [];

   SecondaryEdit = false;
   SecondaryCurrentEdit = {FormArray: '', Index: ''};
   SecondaryData: any;
   SecondaryUpdating = false;
   noFutureDate: any;
   isEditMode = false;

   constructor(   private PatientService: PatientDetailsService,
                  private thrombolysisService: ThrombolysisService,
                  private pciService: PciService,
                  private HospitalService: HospitalSummaryService,
                  private DischargeService: DischargeTransferService,
                  private LoginService: LoginManagementService,
                  private FollowUpService: FollowupService,
                  private dataPassingService: DataPassingService,
                  private activatedRoute: ActivatedRoute,
                  private router: Router,
                  private ClusterService: ClusterManagementService,
                  public Hospital: HospitalManagementService,
                  public Toastr: ToastrService) {

      this.UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
      this.noFutureDate = new Date();

      this.UrlParams = this.activatedRoute.snapshot.params;
      if (this.activatedRoute.snapshot.parent.url[0].path === 'Patient-View') {
         this.ReadonlyPage = true;
      }
      const ParamsArr = Object.keys(this.UrlParams);
      if (ParamsArr.length > 0 && ParamsArr.includes('Patient')) {
         this.ExistingPatient = true;
      }
      this.dataSubscription.add(
         this.dataPassingService.AllFields.subscribe( response => {
            this.AllFields = response;
            if (this.AllFields.length > 0) {
               const DataObj = { PatientId: this.UrlParams.Patient, User: this.UserInfo._id, Hospital: this.InitialHospital };
               this.PatientService.PatientBasicDetails_View(DataObj).subscribe( PatientRes =>  {
                  if (PatientRes.Status) {
                     this.AllFieldsValues = this.AllFields.map(obj => {
                        const SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
                        obj.ThisIsTime = false;
                        obj.ParentDateKey = null;
                        obj.DefaultValue = SetValue;
                        obj.CurrentValue = SetValue;
                        return obj;
                     });
                     this.PatientInfo = PatientRes.Response;

                     this.PatientLocation = PatientRes.Response.Initiated_Hospital.Location;
                     this.InitialHospital = PatientRes.Response.Initiated_Hospital._id;
                     this.dataPassingService.UpdatePatientNameData(PatientRes.Response.Patient_Name);
                     this.dataPassingService.UpdatePatientUniqueData(PatientRes.Response.Patient_Unique);
                     this.PatientUpdateData(PatientRes.Response, 'Basic', true);
                     forkJoin(
                        this.PatientService.PatientFibrinolyticChecklist_View(DataObj),
                        this.PatientService.PatientMedicationDuringTransportation_View(DataObj),
                        this.PatientService.PatientCardiacHistory_View(DataObj),
                        this.PatientService.PatientCoMorbidCondition_View(DataObj),
                        this.PatientService.PatientContactDetails_View(DataObj),
                        this.thrombolysisService.ThrombolysisMedication_View(DataObj),
                        this.thrombolysisService.Thrombolysis_View(DataObj),
                        this.pciService.PciDrugBeforePci_View(DataObj),
                        this.pciService.Pci_View(DataObj),
                        this.pciService.PciMedicationInCath_View(DataObj),
                        this.HospitalService.HospitalSummaryLabReport_View(DataObj),
                        this.HospitalService.HospitalSummaryMedicationInHospital_View(DataObj),
                        this.HospitalService.HospitalSummaryAdverseEvents_View(DataObj),
                        this.DischargeService.DischargeTransferDeath_View(DataObj),
                        this.DischargeService.DischargeTransferMedication_View(DataObj),
                        this.DischargeService.DischargeTransferDischarge_View(DataObj),
                        this.FollowUpService.FollowUpDetails_View(DataObj),
                        this.FollowUpService.FollowUpMedication_View(DataObj),
                        this.FollowUpService.FollowUpEvents_View(DataObj),
								this.ClusterService.ClustersSimpleList_LocationBased({Location_Id: this.PatientLocation})
                     ).subscribe( ([Res1, Res2, Res3, Res4, Res5, Res6, Res7, Res8, Res9, Res10, Res11, Res12, Res13, Res14, Res15, Res16, Res17, Res18, Res19, Res20]) => {
                        if (Res1.Status && Res2.Status) {
                           if (Res1.Response !== null) {
                              this.PatientUpdateData(Res1.Response, 'CheckList', false);
                           }
                           if (Res2.Response !== null) {
                              this.PatientUpdateData(Res2.Response, 'Transportation', false);
                           }
                           if (Res3.Response !== null) {
                              this.PatientUpdateData(Res3.Response, 'CardiacHistory', false);
                           }
                           if (Res4.Response !== null) {
                              this.PatientUpdateData(Res4.Response, 'CoMorbidConditions', false);
                           }
                           if (Res5.Response !== null) {
                              this.PatientUpdateData(Res5.Response, 'ContactDetails', false);
                           }
                           if (Res6.Response !== null) {
                              this.PatientUpdateData(Res6.Response, 'MedicationPriorToThrombolysis', false);
                           }
                           if (Res7.Response !== null) {
                              this.PatientUpdateData(Res7.Response, 'Thrombolysis', false);
                           }
                           if (Res8.Response !== null) {
                              this.PatientUpdateData(Res8.Response, 'DrugBeforePci', false);
                           }
                           if (Res9.Response !== null) {
                              this.PatientUpdateData(Res9.Response, 'PCI', false);
                           }
                           if (Res10.Response !== null) {
                              this.PatientUpdateData(Res10.Response, 'MedicationInCath', false);
                           }
                           if (Res11.Response !== null) {
                              this.PatientUpdateData(Res11.Response, 'LabReport', false);
                           }
                           if (Res12.Response !== null) {
                              this.PatientUpdateData(Res12.Response, 'MedicationInHospital', false);
                           }
                           if (Res13.Response !== null) {
                              this.PatientUpdateData(Res13.Response, 'AdverseEvents', false);
                           }
                           if (Res14.Response !== null) {
                              this.PatientUpdateData(Res14.Response, 'Death', false);
                           }
                           if (Res15.Response !== null) {
                              this.PatientUpdateData(Res15.Response, 'DischargeMedication', false);
                           }
                           if (Res16.Response !== null) {
                              this.PatientUpdateData(Res16.Response, 'Discharge', false);
                           }
                           if (Res17.Response !== null) {
                              this.FollowupId = null;
                              this.FollowupMedicationId = null;
                              this.FollowupEventsId = null;
                              this.FollowUpDetails = Res17.Response;
                              this.MedicationDetails = Res18.Response;
                              this.EventDetails = Res19.Response;
                              this.PatientUpdateData(Res17.Response, 'FollowUpDetails', false);
                           }
                           // if (Res18.Response !== null) {
                           //    this.FollowupMedicationId = null;
                           //    this.MedicationDetails = Res18.Response;
                           //    this.PatientUpdateData(Res18.Response, 'FollowUpMedication', false);
                           // }
                           // if (Res19.Response !== null) {
                           //    this.FollowupEventsId = Res19.Response._id;
                           //    this.PatientUpdateData(Res19.Response, 'FollowUpEvents', false);
                           // }
									if (Res20.Response !== null) {
										this.ClusterList = Res20.Response;
                           }
                           setTimeout(() => {
                              this.ActivateDynamicFGroup();
                           }, 100);
                        } else {
                           console.log('Some Error Occurred');
                        }
                     });
                  }
               });
            }
         })
      );
      this.dataSubscription.add(
         this.dataPassingService.AllValidations.subscribe( response => {
            this.AllValidations = response;
            this.ActivateDynamicFGroup();
         })
      );
   }
   ngOnInit() {
      this.HistoryFGroup = new FormGroup({
         FollowUpArray: new FormArray([]),
         MedicationArray: new FormArray([]),
         EventsArray: new FormArray([])
      });
      // console.log(`historyGroup`, this.HistoryFGroup.get("EventsArray") as FormArray);
      // console.log(`isEditMode`, this.isEditMode);
      
   }

   ngOnDestroy() {
      this.dataSubscription.unsubscribe();
      this.subscription.unsubscribe();
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
         if ((event + 1) <= 2) {
            this.TabChangeEvent(event + 1);
         }
      }
   }

   PatientUpdateData(PatientData: any, From: string, ProceedNext: boolean) {
      if (From === 'Basic') {
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
         const HospitalHistory = PatientData.Hospital_History;
         if (HospitalHistory && HospitalHistory !== null && HospitalHistory.length > 0 ) {
            const Hospital = HospitalHistory[0];
            const HoKeys = Object.keys(Hospital);
            this.AllFieldsValues.map((obj, i) => {
               if (HoKeys.includes(obj.Key_Name)) {
                  this.AllFieldsValues[i].CurrentValue = Hospital[obj.Key_Name];
                  this.AllFieldsValues[i].DefaultValue = Hospital[obj.Key_Name];
               }
            });
         }
         const ClinicalExaminations = PatientData.Clinical_Examination_History;
         if (ClinicalExaminations && ClinicalExaminations !== null && ClinicalExaminations.length > 0 ) {
            const ClinicalExam = ClinicalExaminations[0];
            const CEKeys = Object.keys(ClinicalExam);
            this.AllFieldsValues.map((obj, i) => {
               if (CEKeys.includes(obj.Key_Name)) {
                  this.AllFieldsValues[i].CurrentValue = ClinicalExam[obj.Key_Name];
                  this.AllFieldsValues[i].DefaultValue = ClinicalExam[obj.Key_Name];
               }
            });
         }
         const LocationOfInfarction = PatientData.Location_of_Infarction;
         if (LocationOfInfarction && LocationOfInfarction !== null && LocationOfInfarction.length > 0 ) {
            const LocOfInfarction = LocationOfInfarction[0];
            const LOIKeys = Object.keys(LocOfInfarction);
            this.AllFieldsValues.map((obj, i) => {
               if (LOIKeys.includes(obj.Key_Name)) {
                  this.AllFieldsValues[i].CurrentValue = LocOfInfarction[obj.Key_Name];
                  this.AllFieldsValues[i].DefaultValue = LocOfInfarction[obj.Key_Name];
               }
            });
         }
         const TransportHistory = PatientData.Transport_History;
         if (TransportHistory && TransportHistory !== null && TransportHistory.length > 0 ) {
            const TranHistory = TransportHistory[0];
            const THKeys = Object.keys(TranHistory);
            this.AllFieldsValues.map((obj, i) => {
               if (THKeys.includes(obj.Key_Name)) {
                  this.AllFieldsValues[i].CurrentValue = TranHistory[obj.Key_Name];
                  this.AllFieldsValues[i].DefaultValue = TranHistory[obj.Key_Name];
               }
            });
         }
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
      } else if (From === 'FollowUpDetails') {
         // ReadOnly Form Group
         this.AllFieldsValues.map((obj, i) => {
            if (obj.Sub_Category === 'Follow_Up_Details' || obj.Sub_Category === 'Medication' || obj.Sub_Category === 'Events') {
               const SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
               this.AllFieldsValues[i].CurrentValue = SetValue;
               this.AllFieldsValues[i].DefaultValue = SetValue;
            }
         });
         const FArray1 = this.HistoryFGroup.controls.FollowUpArray as FormArray;
         for (let i = FArray1.length - 1; i >= 0; i--) {  FArray1.removeAt(i); }
         const FArray2 = this.HistoryFGroup.controls.MedicationArray as FormArray;
         for (let i = FArray2.length - 1; i >= 0; i--) {  FArray2.removeAt(i); }
         const FArray3 = this.HistoryFGroup.controls.EventsArray as FormArray;
         for (let i = FArray3.length - 1; i >= 0; i--) {  FArray3.removeAt(i); }
         this.FollowUpHistoryAvailable = false;
         this.MedicationReadOnly = false;
         this.MonthOfMedication = null;
         this.ShowMonthOfMedication = null;
         this.EventsReadOnly = false;
         this.ShowMonthOfEvent = null;
         this.ShowMonthOfEvent = null;
         this.FollowUpReadOnly = false;
         this.FollowupDuration = [];
         // this.StaticFollowupDuration.map(obj => this.FollowupDuration.push(obj) );
         if (this.FollowUpDetails !== null && this.FollowUpDetails.length > 0) {
            this.FollowUpHistoryAvailable = true;
            this.FollowUpDetails.map( (Obj, i) => {
               // const ShowDurationIndex = this.StaticFollowupDuration.findIndex(objNew => objNew.Key === Obj.Duration_Of_Follow_Up_Visit);
               let NameOfTheStemiFollowUpCluster = null;
					if (Obj.Name_Of_The_Stemi_Follow_Up_Cluster !== null) {
						NameOfTheStemiFollowUpCluster = Obj.Name_Of_The_Stemi_Follow_Up_Cluster._id;
						this.ClusterService.ClusterBased_Hospitals({Cluster_Id: NameOfTheStemiFollowUpCluster}).subscribe(res => {
							this.HistoryHospitalList.push(res.Response);
						});
					}
					let NameOfTheStemiFollowUpHospital = null;
					if (Obj.Name_Of_The_Stemi_Follow_Up_Hospital !== null) {
						NameOfTheStemiFollowUpHospital = Obj.Name_Of_The_Stemi_Follow_Up_Hospital._id;
					}
               const Address = Obj.Name_Of_The_Stemi_Follow_Up_Hospital !== null ? Obj.Name_Of_The_Stemi_Follow_Up_Hospital.Address : Obj.Location_Of_Follow_Up_Hospital;
               const FGroupOne = new FormGroup({
                  PatientId: new FormControl({value: this.PatientInfo._id, disabled: true}),
                  _id: new FormControl({value: Obj._id || null, disabled: true}),
                  // Duration_Of_Follow_Up_Visit_Show: new FormControl({value: this.StaticFollowupDuration[ShowDurationIndex].Name, disabled: true}),
                  // Duration_Of_Follow_Up_Visit: new FormControl({value: Obj.Duration_Of_Follow_Up_Visit, disabled: true}),
                  Follow_Up_Date: new FormControl({value: Obj.Follow_Up_Date || null, disabled: true}),
                  Mode_Of_Follow_Up: new FormControl({value: Obj.Mode_Of_Follow_Up || null, disabled: true}),
                  Type_Of_Follow_Up_Hospital: new FormControl({value: Obj.Type_Of_Follow_Up_Hospital || null, disabled: true}),
                  Name_Of_The_Stemi_Follow_Up_Cluster: new FormControl({value: NameOfTheStemiFollowUpCluster || null, disabled: true}),
                  Name_Of_The_Stemi_Follow_Up_Hospital: new FormControl({value: NameOfTheStemiFollowUpHospital || null, disabled: true}),
                  Name_Of_The_Non_Stemi_Follow_Up_Hospital: new FormControl({value: Obj.Name_Of_The_Non_Stemi_Follow_Up_Hospital || null, disabled: true}),
                  Location_Of_Follow_Up_Hospital: new FormControl({value: Address || null, disabled: true}),
                  Follow_Up_Comments: new FormControl({value: Obj.Follow_Up_Comments || null, disabled: true}),
                  EditActivate: new FormControl({value: false, disabled: true}),
               });

               const MedicationDataArr = this.MedicationDetails.filter(objNew => objNew.Follow_Up_Date === Obj.Follow_Up_Date );
               const MedicationData = MedicationDataArr.length > 0 ? MedicationDataArr[0] : null;
               if ( this.FollowUpDetails.length > (i + 1) || (this.FollowUpDetails.length === (i + 1) && MedicationData !== null)) {
                  const FGroupTwo = new FormGroup({
                     PatientId: new FormControl({value: this.PatientInfo._id, disabled: true}),
                     _id: new FormControl({value: (MedicationData !== null ? MedicationData._id  : null), disabled: true}),
                     Hospital: new FormControl({value: this.InitialHospital, disabled: true}),
                     // Duration_Of_Follow_Up_Medication_Show: new FormControl({value: this.StaticFollowupDuration[ShowDurationIndex].Name, disabled: true}),
                     // Duration_Of_Follow_Up_Medication: new FormControl({value: Obj.Duration_Of_Follow_Up_Visit, disabled: true}),
							Follow_Up_Date: new FormControl({value: Obj.Follow_Up_Date || null, disabled: true}),
                     Follow_Up_Medication_Aspirin: new FormControl({ value: (MedicationData !== null ? MedicationData.Follow_Up_Medication_Aspirin  : null), disabled: true }),
                     Follow_Up_Medication_Clopidogrel: new FormControl({ value: (MedicationData !== null ? MedicationData.Follow_Up_Medication_Clopidogrel  : null), disabled: true }),
                     Follow_Up_Medication_Prasugral: new FormControl({ value: (MedicationData !== null ? MedicationData.Follow_Up_Medication_Prasugral  : null), disabled: true }),
                     Follow_Up_Medication_Nitrate: new FormControl({ value: (MedicationData !== null ? MedicationData.Follow_Up_Medication_Nitrate  : null), disabled: true }),
                     Follow_Up_Medication_Betablocker: new FormControl({ value: (MedicationData !== null ? MedicationData.Follow_Up_Medication_Betablocker  : null), disabled: true }),
                     Follow_Up_Medication_ACEI: new FormControl({ value: (MedicationData !== null ? MedicationData.Follow_Up_Medication_ACEI  : null), disabled: true }),
                     Follow_Up_Medication_ARB: new FormControl({ value: (MedicationData !== null ? MedicationData.Follow_Up_Medication_ARB  : null), disabled: true }),
                     Follow_Up_Medication_Statins: new FormControl({ value: (MedicationData !== null ? MedicationData.Follow_Up_Medication_Statins  : null), disabled: true }),
                     Follow_Up_Medication_OHA: new FormControl({ value: (MedicationData !== null ? MedicationData.Follow_Up_Medication_OHA  : null), disabled: true }),
                     Follow_Up_Medication_Insulin: new FormControl({ value: (MedicationData !== null ? MedicationData.Follow_Up_Medication_Insulin  : null), disabled: true }),
                     EditActivate: new FormControl({value: false, disabled: true}),
                  });
                  const FArrayTwo = this.HistoryFGroup.controls.MedicationArray as FormArray;
                  FArrayTwo.push(FGroupTwo);
                  if (this.FollowUpDetails.length === (i + 1) && MedicationData !== null) {
                     this.MedicationReadOnly = true;
                  }
               } else if (this.FollowUpDetails.length === (i + 1) && MedicationData === null) {
                  this.ShowMonthOfMedication = Obj.Follow_Up_Date;
                  this.MonthOfMedication = Obj.Follow_Up_Date;
               }


               const EventsDataArr = this.EventDetails.filter(objNew => objNew.Follow_Up_Date === Obj.Follow_Up_Date );
               const EventData = EventsDataArr.length > 0 ? EventsDataArr[0] : null;
               if ( this.FollowUpDetails.length > (i + 1) || (this.FollowUpDetails.length === (i + 1) && EventData !== null)) {
                  const FGroupThree = new FormGroup({
                     PatientId: new FormControl({value: this.PatientInfo._id, disabled: true}),
                     _id: new FormControl({value: (EventData !== null ? EventData._id  : null), disabled: true}),
                     Hospital: new FormControl({value: this.InitialHospital, disabled: true}),
                     // Duration_Of_Follow_Up_Events_Show: new FormControl({value: this.StaticFollowupDuration[ShowDurationIndex].Name, disabled: true}),
                     // Duration_Of_Follow_Up_Event: new FormControl({value: Obj.Duration_Of_Follow_Up_Visit, disabled: true}),
							Follow_Up_Date: new FormControl({value: Obj.Follow_Up_Date || null, disabled: true}),
                     Follow_Up_Events_Readmission: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Readmission  : null), disabled: true }),
                     Follow_Up_Events_Readmission_Reason: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Readmission_Reason  : null), disabled: true }),
                     Follow_Up_Events_Readmission_Date: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Readmission_Date  : null), disabled: true }),
                     
                     Follow_Up_Events_Additional_cardiac_procedures: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Additional_cardiac_procedures  : null), disabled: true }),
                     Follow_Up_Events_CABG: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_CABG  : null), disabled: true }),
                     Follow_Up_Events_CABG_Date: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_CABG_Date  : null), disabled: true }),
                     Follow_Up_Events_PCI: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_PCI  : null), disabled: true }),
                     Follow_Up_Events_PCI_Date: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_PCI_Date  : null), disabled: true }),
                     Follow_Up_Events_Others: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Others  : null), disabled: true }),
                     Follow_Up_Events_Specify_Others: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Specify_Others  : null), disabled: true }),
                     Follow_Up_Events_Others_Date: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Others_Date  : null), disabled: true }),                     

                     Follow_Up_Events_Recurrence_Of_Angina: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Recurrence_Of_Angina  : null), disabled: true }),
                     Follow_Up_Events_TMT: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_TMT  : null), disabled: true }),
                     Follow_Up_Events_Echo_LVEF: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Echo_LVEF  : null), disabled: true }),
                     Follow_Up_Events_Re_CART: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Re_CART  : null), disabled: true }),
                     Follow_Up_Events_Re_CART_Date: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Re_CART_Date  : null), disabled: true }),
                     Follow_Up_Events_Restenosis: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Restenosis  : null), disabled: true }),
                     Follow_Up_Events_Restenosis_Date: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Restenosis_Date  : null), disabled: true }),
                     Follow_Up_Events_Re_MI: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Re_MI  : null), disabled: true }),
                     Follow_Up_Events_Re_MI_Date: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Re_MI_Date  : null), disabled: true }),
                     Follow_Up_Events_Re_Intervention: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Re_Intervention  : null), disabled: true }),
                     Follow_Up_Events_TLR_PCI1: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_TLR_PCI1  : null), disabled: true }),
                     Follow_Up_Events_TLR_PCI1_Date: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_TLR_PCI1_Date  : null), disabled: true }),
                     Follow_Up_Events_TVR_PCI: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_TVR_PCI  : null), disabled: true }),
                     Follow_Up_Events_TVR_PCI_Date: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_TVR_PCI_Date  : null), disabled: true }),
                     Follow_Up_Events_Non_TVR_PCI: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Non_TVR_PCI  : null), disabled: true }),
                     Follow_Up_Events_Non_TVR_PCI_Date: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Non_TVR_PCI_Date  : null), disabled: true }),
                     Follow_Up_Events_Stroke: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Stroke  : null), disabled: true }),
                     Follow_Up_Events_Stroke_Date: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Events_Stroke_Date  : null), disabled: true }),
                     Follow_Up_Death: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Death  : null), disabled: true }),
							Follow_Up_Death_Date: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Death_Date  : null), disabled: true }),
                     Follow_Up_Reason_Of_Death: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Reason_Of_Death  : null), disabled: true }),
                     Follow_Up_Event_Comments: new FormControl({ value: (EventData !== null ? EventData.Follow_Up_Event_Comments  : null), disabled: true }),
                     EditActivate: new FormControl({value: false, disabled: true}),
                  });
                  const FArrayThree = this.HistoryFGroup.controls.EventsArray as FormArray;
                  FArrayThree.push(FGroupThree);
                  if (this.FollowUpDetails.length === (i + 1) && EventData !== null) {
                     this.EventsReadOnly = true;
                  }
               } else if (this.FollowUpDetails.length === (i + 1) && EventData === null) {
                  this.ShowMonthOfEvent = Obj.Follow_Up_Date;
                  this.MonthOfEvent = Obj.Follow_Up_Date;
               }

               const FArrayOne = this.HistoryFGroup.controls.FollowUpArray as FormArray;
               FArrayOne.push(FGroupOne);
            });
            // const ListOfVisits = [];
            // const IndexOfVisits = [];
            // this.FollowUpDetails.map(obj => ListOfVisits.push(obj.Duration_Of_Follow_Up_Visit));
            // ListOfVisits.map(obj => {
            //    const PositionIndex = this.FollowupDuration.findIndex(objNew => objNew.Key === obj);
            //    IndexOfVisits.push(PositionIndex);
            // });
            // const maxIndex = Math.max.apply(null, IndexOfVisits);
            // this.FollowupDuration.splice(0, maxIndex + 1);
            // if (this.FollowupDuration.length === 0) {
            //    this.FollowUpReadOnly = true;
            // }
         } else {
            this.MedicationReadOnly = true;
            this.EventsReadOnly = true;
         }
      } else {
         const BasicDetailsKeys = Object.keys(PatientData);
         this.AllFieldsValues.map((obj, i) => {
            if (BasicDetailsKeys.includes(obj.Key_Name)) {
               this.AllFieldsValues[i].CurrentValue = PatientData[obj.Key_Name];
               this.AllFieldsValues[i].DefaultValue = PatientData[obj.Key_Name];
            }
         });
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
         if (ControlObj.Mandatory && (control.value === null || control.value === '' || control.value === undefined)) {
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
      };
   }

   GetFormControlErrorMessage(KeyName: any) {
      const FControl = this.DynamicFGroup.get(KeyName) as FormControl;
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
      let FControl: FormControl;
      const FArray = this.HistoryFGroup.get(formArray) as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      FControl = FGroup.get(KeyName) as FormControl;
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
         const BasicDetailsFields = this.AllFieldsValues.filter(obj => obj.Sub_Category === this.TabsList[this.CurrentTabIndex]);
         this.DynamicFGroup = new FormGroup({ });
         this.DynamicFGroup.addControl('User', new FormControl(this.UserInfo._id, Validators.required ));
         this.DynamicFGroup.addControl('PatientId', new FormControl(this.UrlParams.Patient, Validators.required ));
         this.DynamicFGroup.addControl('Hospital', new FormControl(this.InitialHospital, Validators.required ));
         if (this.TabsList[this.CurrentTabIndex] === 'Follow_Up_Details' && this.FollowupId !== null) {
            this.DynamicFGroup.addControl('FollowupId', new FormControl(this.FollowupId, Validators.required ));
         }
         // if (this.TabsList[this.CurrentTabIndex] === 'Medication' && this.MonthOfMedication !== '') {
         //    this.DynamicFGroup.addControl('Duration_Of_Follow_Up_Medication', new FormControl(this.MonthOfMedication, Validators.required ));
         // }
			if (this.TabsList[this.CurrentTabIndex] === 'Medication' && this.MonthOfMedication !== null) {
            this.DynamicFGroup.addControl('Follow_Up_Date', new FormControl(this.MonthOfMedication, Validators.required ));
         }
         if (this.TabsList[this.CurrentTabIndex] === 'Medication' && this.FollowupMedicationId !== null) {
            this.DynamicFGroup.addControl('FollowupMedicationId', new FormControl(this.FollowupMedicationId, Validators.required ));
         }
         // if (this.TabsList[this.CurrentTabIndex] === 'Events' && this.MonthOfEvent !== '') {
         //    this.DynamicFGroup.addControl('Duration_Of_Follow_Up_Event', new FormControl(this.MonthOfEvent, Validators.required ));
         // }
			if (this.TabsList[this.CurrentTabIndex] === 'Events' && this.MonthOfEvent !== null) {
            this.DynamicFGroup.addControl('Follow_Up_Date', new FormControl(this.MonthOfEvent, Validators.required ));
         }
         if (this.TabsList[this.CurrentTabIndex] === 'Events' && this.FollowupEventsId !== null) {
            this.DynamicFGroup.addControl('FollowupEventsId', new FormControl(this.FollowupEventsId, Validators.required ));
         }
         BasicDetailsFields.map(obj => {
            let FormControlValidation = null;
            if (obj.Mandatory || obj.Validation) {
               FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
            }
            this.DynamicFGroup.addControl(obj.Key_Name, new FormControl(obj.CurrentValue, FormControlValidation ));
         });
         setTimeout(() => {
            this.FormLoaded = true;
            this.AllFieldValuesManagement();
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
         this.YesOrNoValidations();
      } else {
         this.DynamicFGroup.disable();
      }
   }

   DynamicFGroupValueChangesMonitoring() {
      let SubscribeLimitControl = [];
      let NewSubscribeLimit = true;
      this.FormLoaded = true;
      const FormControlsArray = Object.keys(this.DynamicFGroup.controls);
      FormControlsArray.map(controlName => {
            const control = this.DynamicFGroup.controls[controlName] as FormControl;
            this.subscription.add(
               control.valueChanges.subscribe(change => {
                  const FieldIndex =  this.AllFieldsValues.findIndex(obj => obj.Key_Name === controlName);
                  if (FieldIndex > -1) {
                     // Date Value change update related time ---------
                     if (this.AllFieldsValues[FieldIndex].TimeAvailable) {
                        const TimeFieldIndex =  this.AllFieldsValues.findIndex(obj => obj.Key_Name === this.AllFieldsValues[FieldIndex].TimeKeyName);
                        let RelatedTime = this.AllFieldsValues[TimeFieldIndex].CurrentValue;
                        this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setErrors(null);
                        if (change && change !== null && change !== '') {
                           RelatedTime = (RelatedTime && RelatedTime !== null && RelatedTime !== '' && RelatedTime !== '0:0' && RelatedTime !== '00:00:00' ) ? (RelatedTime + ':00') : '00:00:00';
                           change =  new Date(change);
                           change = new Date(change.getFullYear() + '-' + (change.getMonth() + 1) + '-' + change.getDate() + ' ' + RelatedTime);
                        }
                        this.DynamicFGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setValue(RelatedTime, { emitEvent: false });
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
                           MinValue = (MinValue !== null && MinValue !== '') ? new Date(MinValue).valueOf() : null;
                           change = (change !== null && change !== '') ? new Date(change).valueOf() : null ;
                           if (MinValue > change && change !== null && MinValue !== null ) {
                              const Text = this.AllFieldsValues[FieldIndex].TimeAvailable ? 'Select the date time should be more than ' : 'Select the date should be more than ';
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
                           MaxValue = (MaxValue !== null && MaxValue !== '') ? new Date(MaxValue).valueOf() : null;
                           change = (change !== null && change !== '') ? new Date(change).valueOf() : null ;
                           if (MaxValue < change && change !== null && MaxValue !== null ) {
                              const Text = this.AllFieldsValues[FieldIndex].TimeAvailable ? 'Select the date time should be less than ' : 'Select the date should be less than ';
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
                                 MinValue = (MinValue !== null && MinValue !== '') ? new Date(MinValue).valueOf() : null;
                                 change = (change !== null && change !== '') ? new Date(change).valueOf() : null ;
                                 if (MinValue > change && change !== null && MinValue !== null) {
                                    const Text = this.AllFieldsValues[FieldIndex].TimeAvailable ? 'Select the date time should be more than ' : 'Select the date should be more than ';
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
                                 MaxValue = (MaxValue !== null && MaxValue !== '') ? new Date(MaxValue).valueOf() : null;
                                 change = (change !== null && change !== '') ? new Date(change).valueOf() : null ;
                                 if (MaxValue < change && change !== null && MaxValue !== null ) {
                                    const Text = this.AllFieldsValues[FieldIndex].TimeAvailable ? 'Select the date time should be less than ' : 'Select the date should be less than ';
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
      });
      // Update Values
      setTimeout(() => {
         const BasicDetailsFields = this.AllFieldsValues.filter(obj => obj.Sub_Category === this.TabsList[this.CurrentTabIndex]);
         const FilterUpdateFields = BasicDetailsFields.filter(obj => obj.CurrentValue !== null && obj.CurrentValue !== '');
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

   GetHistoryFormArray(ControlName: any): any[] {
      const FArray = this.HistoryFGroup.get(ControlName) as FormArray;
      console.log(`FArray`, FArray.controls);
      
      return FArray.controls;
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
                              this.CommonValidatorsSet(obj2.Key_Name, obj2.ThisIsTime, obj2.ParentDateKey);
                           });
                        } else {
                           ChildeArr.map(obj2 => {
                              const SetValue = (obj2.Type === 'Select' || obj2.Type === 'Date' || obj2.Type === 'Number' || obj2.Type === 'Boolean' ) ? null : '';
                              this.CommonInputReset(obj2.Key_Name, SetValue);
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

   checkFollowUpMode(event: any) {
      if (event !== undefined && event === 'Lost_Follow_Up') {
         this.CommonValidatorsSet('Follow_Up_Comments', false, '');
         this.CommonInputReset('Name_Of_The_Stemi_Follow_Up_Cluster', null);
         this.CommonInputReset('Name_Of_The_Stemi_Follow_Up_Hospital', null);
         this.CommonInputReset('Name_Of_The_Non_Stemi_Follow_Up_Hospital', '');
         this.CommonInputReset('Location_Of_Follow_Up_Hospital', '');
         this.CommonInputReset('Type_Of_Follow_Up_Hospital', null);
      } else {
         this.CommonValidatorsSet('Type_Of_Follow_Up_Hospital', false, null);
         this.DynamicFGroup.controls.Type_Of_Follow_Up_Hospital.setValue('');
      }
   }

	checkHistoryFollowUpMode(event: any, idx: number) {
		const FArray = this.HistoryFGroup.get('FollowUpArray') as FormArray;
		const FGroup =  FArray.controls[idx] as FormGroup;
      if (event !== undefined && event === 'Lost_Follow_Up') {
         this.CommonValidatorsSetHistory('Follow_Up_Comments', false, '', FGroup);
         this.CommonInputResetHistory('Name_Of_The_Stemi_Follow_Up_Cluster', null, FGroup);
         this.CommonInputResetHistory('Name_Of_The_Stemi_Follow_Up_Hospital', null, FGroup);
         this.CommonInputResetHistory('Name_Of_The_Non_Stemi_Follow_Up_Hospital', '', FGroup);
         this.CommonInputResetHistory('Location_Of_Follow_Up_Hospital', '', FGroup);
         this.CommonInputResetHistory('Type_Of_Follow_Up_Hospital', null, FGroup);
      } else {
         this.CommonValidatorsSetHistory('Type_Of_Follow_Up_Hospital', false, null, FGroup);
         this.DynamicFGroup.controls.Type_Of_Follow_Up_Hospital.setValue('');
      }
   }

   checkFollowUpHospital(event: any) {
      if (event !== undefined && event === 'Cluster') {
			this.CommonValidatorsSet('Name_Of_The_Stemi_Follow_Up_Cluster', false, '');
			this.CommonValidatorsSet('Name_Of_The_Stemi_Follow_Up_Hospital', false, '');
			this.CommonValidatorsSet('Location_Of_Follow_Up_Hospital', false, '');
			this.DynamicFGroup.controls.Location_Of_Follow_Up_Hospital.disable();
			this.CommonInputReset('Name_Of_The_Non_Stemi_Follow_Up_Hospital', '');
			this.CommonInputReset('Follow_Up_Comments', null);
      } else if (event !== undefined && event === 'Non_Cluster') {
         this.CommonValidatorsSet('Name_Of_The_Non_Stemi_Follow_Up_Hospital', false, '');
         this.CommonValidatorsSet('Location_Of_Follow_Up_Hospital', false, '');
			this.DynamicFGroup.controls.Location_Of_Follow_Up_Hospital.enable();
         this.CommonInputReset('Name_Of_The_Stemi_Follow_Up_Cluster', null);
         this.CommonInputReset('Name_Of_The_Stemi_Follow_Up_Hospital', null);
         this.CommonInputReset('Follow_Up_Comments', null);
      } else {
         this.CommonInputReset('Follow_Up_Comments', '');
         this.CommonInputReset('Name_Of_The_Stemi_Follow_Up_Cluster', null);
         this.CommonInputReset('Name_Of_The_Stemi_Follow_Up_Hospital', null);
         this.CommonInputReset('Name_Of_The_Non_Stemi_Follow_Up_Hospital', '');
         this.CommonInputReset('Location_Of_Follow_Up_Hospital', '');
			this.DynamicFGroup.controls.Location_Of_Follow_Up_Hospital.enable();
      }
   }

	checkHistoryFollowUpHospital(event: any, idx: number) {
		const FArray = this.HistoryFGroup.get('FollowUpArray') as FormArray;
		const FGroup =  FArray.controls[idx] as FormGroup;
      if (event !== undefined && event === 'Cluster') {
			this.CommonValidatorsSetHistory('Name_Of_The_Stemi_Follow_Up_Cluster', false, '', FGroup);
			this.CommonValidatorsSetHistory('Name_Of_The_Stemi_Follow_Up_Hospital', false, '', FGroup);
			this.CommonValidatorsSetHistory('Location_Of_Follow_Up_Hospital', false, '', FGroup);
			FGroup.controls.Location_Of_Follow_Up_Hospital.disable();
			FGroup.controls.Location_Of_Follow_Up_Hospital.setValue('');
			this.CommonInputResetHistory('Name_Of_The_Non_Stemi_Follow_Up_Hospital', '', FGroup);
			this.CommonInputResetHistory('Follow_Up_Comments', null, FGroup);
      } else if (event !== undefined && event === 'Non_Cluster') {
         this.CommonValidatorsSetHistory('Name_Of_The_Non_Stemi_Follow_Up_Hospital', false, '', FGroup);
         this.CommonValidatorsSetHistory('Location_Of_Follow_Up_Hospital', false, '', FGroup);
			FGroup.controls.Location_Of_Follow_Up_Hospital.enable();
			FGroup.controls.Location_Of_Follow_Up_Hospital.setValue('');
         this.CommonInputResetHistory('Name_Of_The_Stemi_Follow_Up_Cluster', null, FGroup);
         this.CommonInputResetHistory('Name_Of_The_Stemi_Follow_Up_Hospital', null, FGroup);
         this.CommonInputResetHistory('Follow_Up_Comments', null, FGroup);
      } else {
         this.CommonInputResetHistory('Follow_Up_Comments', '', FGroup);
         this.CommonInputResetHistory('Name_Of_The_Stemi_Follow_Up_Cluster', null, FGroup);
         this.CommonInputResetHistory('Name_Of_The_Stemi_Follow_Up_Hospital', null, FGroup);
         this.CommonInputResetHistory('Name_Of_The_Non_Stemi_Follow_Up_Hospital', '', FGroup);
         this.CommonInputResetHistory('Location_Of_Follow_Up_Hospital', '', FGroup);
			FGroup.controls.Location_Of_Follow_Up_Hospital.enable();
			FGroup.controls.Location_Of_Follow_Up_Hospital.setValue('');
      }
   }

   checkClusterType(event: any) {
      if (event !== undefined && event !== '' && event !== null) {
         this.ClusterService.ClusterBased_Hospitals({Cluster_Id: event}).subscribe( response => {
            this.HospitalList = response.Response;
         });
      } else {
         this.HospitalList = [];
      }
   }

	checkHistoryClusterType(event: any, idx: number) {
      if (event !== undefined && event !== '' && event !== null) {
         this.ClusterService.ClusterBased_Hospitals({Cluster_Id: event}).subscribe( response => {
            this.HistoryHospitalList[idx] = response.Response;
         });
      } else {
         this.HistoryHospitalList[idx] = [];
      }
   }

   FilterAddress(event: any) {
      if (event !== undefined && event !== '' && event !== null) {
         this.Hospital.Hospital_view({_id: event}).subscribe( response => {
            this.Address = response.Response.Address;
            this.DynamicFGroup.controls['Location_Of_Follow_Up_Hospital'].setValue(this.Address);
         });
      } else {
         this.DynamicFGroup.controls['Location_Of_Follow_Up_Hospital'].setValue('');
      }
   }

	HistoryFilterAddress(event: any, idx: number) {
		const FArray = this.HistoryFGroup.get('FollowUpArray') as FormArray;
		const FGroup =  FArray.controls[idx] as FormGroup;
      if (event !== undefined && event !== '' && event !== null) {
         this.Hospital.Hospital_view({_id: event}).subscribe( response => {
            const HosAddress = response.Response.Address;
            FGroup.controls['Location_Of_Follow_Up_Hospital'].setValue(HosAddress);
         });
      } else {
         FGroup.controls['Location_Of_Follow_Up_Hospital'].setValue('');
      }
   }

   CommonValidatorsSet(control: any, IsTime: boolean, DateControl: any) {
      const ControlKey = IsTime ? DateControl : control;
      const Index = this.AllFieldsValues.findIndex(obj => obj.Key_Name === ControlKey);
      const DataObject = this.AllFieldsValues[Index];
      let FormControlValidation = null;
      if (DataObject.Mandatory || DataObject.Validation) {
         FormControlValidation = Validators.compose([ this.CustomDynamicValidation(DataObject), Validators.min(DataObject.Min_Number_Value), Validators.max(DataObject.Max_Number_Value) ]);
      }
      this.DynamicFGroup.controls[control].setValidators(FormControlValidation);
   }

   CommonInputReset(control: any, value: any) {
      this.DynamicFGroup.controls[control].setValue(value);
      this.DynamicFGroup.controls[control].clearValidators();
      this.DynamicFGroup.controls[control].setErrors(null);
      this.DynamicFGroup.controls[control].markAsPristine();
      this.DynamicFGroup.controls[control].markAsUntouched();
      this.DynamicFGroup.controls[control].updateValueAndValidity();
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

   CheckSubJuniorCategoryVisibility(SubJuniorCategory: any) {
      const KeyData = this.AllFields.filter(obj => obj.Sub_Junior_Category === SubJuniorCategory && obj.Visibility === true);
      if (KeyData.length > 0) {
         return true;
      } else {
         return false;
      }
   }

   CheckSubCategoryVisibility(SubCategory: any) {
      const KeyData = this.AllFields.filter(obj => obj.Sub_Category === SubCategory && obj.Visibility === true);
      if (KeyData.length > 0) {
         const Index = this.TabsList.findIndex(obj => obj === this.LastActiveTab);
         const Availability = Index !== -1 ? Index + 1 : 0;
         const TabIndex = this.TabsList.findIndex(obj => obj === SubCategory);
         if (TabIndex <= Availability) {
            return false;
         } else {
            return true;
         }
      } else {
         return true;
      }
   }

   EditHistoryArray(formArray: any, index: any) {
      // const AlwaysDisable = ['Duration_Of_Follow_Up_Visit', 'Name_Of_The_Stemi_Follow_Up_Cluster', 'Name_Of_The_Stemi_Follow_Up_Hospital'];
		this.isEditMode = true;
      // console.log(`editbutton click`, this.isEditMode);
      
      const AlwaysDisable = [];
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
         if (!AlwaysDisable.includes(obj)) {
				if (formArray === 'FollowUpArray' && FGroup.controls.Type_Of_Follow_Up_Hospital.value === 'Cluster' && obj === 'Location_Of_Follow_Up_Hospital') {
					FControl.disable();
				} else {
					FControl.enable();
				}
            if (fieldIndex >= 0) {
               const validationControl = this.AllFieldsValues[fieldIndex];
               FControl.setValidators(Validators.compose([this.CustomDynamicValidation(validationControl), Validators.min(validationControl.Min_Number_Value), Validators.max(validationControl.Max_Number_Value)]));
            }
         }
      });
      this.YesOrNoValidationsHistory(FGroup);
   }
   resetFArrayHistory(formArray: any, index: any) {
      this.isEditMode = false;
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
   YesOrNoValidationsHistory(FGroup: FormGroup) {
      const FControlKeys = Object.keys(FGroup.controls);
      FControlKeys.map(obj => {
         const LimitArr = this.AllFieldsValues.filter(obj1 => obj1.Key_Name === obj &&  (obj1.Type === 'Select' || obj1.Type === 'Boolean'));
         if (LimitArr.length > 0) {
            const Parent = LimitArr[0];
            const ChildeArr =  this.AllFieldsValues.filter(obj1 => obj1.If_Parent_Available && obj1.Parent.Key_Name === Parent.Key_Name);
            if (ChildeArr.length > 0) {
               this.historySubscription.add(
                  FGroup.controls[Parent.Key_Name].valueChanges.subscribe(change => {
                     if (change === 'Yes' || change === 'No' || change === 'DontKnow' ||  change === '' || change === null || change === true || change === false) {
                        if (change === 'Yes' || change === true) {
                           ChildeArr.map(obj2 => {
                              this.CommonValidatorsSetHistory(obj2.Key_Name, obj2.ThisIsTime, obj2.ParentDateKey, FGroup);
                           });
                        } else {
                           ChildeArr.map(obj2 => {
                              const SetValue = (obj2.Type === 'Select' || obj2.Type === 'Date' || obj2.Type === 'Number' || obj2.Type === 'Boolean' ) ? null : '';
                              this.CommonInputResetHistory(obj2.Key_Name, SetValue, FGroup);
                           });
                        }
                     }
                  })
               );
               setTimeout(() => {
                  FGroup.controls[Parent.Key_Name].updateValueAndValidity();
               }, 100);
            }
         }
      });
   }
   CommonValidatorsSetHistory(control: any, IsTime: boolean, DateControl: any, FGroup: FormGroup) {
      const ControlKey = IsTime ? DateControl : control;
      const Index = this.AllFieldsValues.findIndex(obj => obj.Key_Name === ControlKey);
      const DataObject = this.AllFieldsValues[Index];
      let FormControlValidation = null;
      if (DataObject.Mandatory || DataObject.Validation) {
         FormControlValidation = Validators.compose([ this.CustomDynamicValidation(DataObject), Validators.min(DataObject.Min_Number_Value), Validators.max(DataObject.Max_Number_Value) ]);
      }
      FGroup.controls[control].setValidators(FormControlValidation);
   }

   CommonInputResetHistory(control: any, value: any, FGroup: FormGroup) {
      FGroup.controls[control].setValue(value);
      FGroup.controls[control].clearValidators();
      FGroup.controls[control].setErrors(null);
      FGroup.controls[control].markAsPristine();
      FGroup.controls[control].markAsUntouched();
      FGroup.controls[control].updateValueAndValidity();
   }

   FollowUpHistoryUpdate(index: any) {
      this.SecondaryUpdating = true;
      const FArray = this.HistoryFGroup.get('FollowUpArray') as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      if (FGroup.status === 'VALID') {
         this.FollowUpService.FollowUpHistory_Update(FGroup.getRawValue()).subscribe(response => {
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
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'FollowUp Details Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      }
   }
   FollowUpMedicationHistoryUpdate(index: any) {
      this.SecondaryUpdating = true;
      const FArray = this.HistoryFGroup.get('MedicationArray') as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      if (FGroup.status === 'VALID') {
         this.FollowUpService.FollowUpMedicationHistory_Update(FGroup.getRawValue()).subscribe(response => {
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
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'FollowUp Medication Details Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      }
   }
   FollowUpMedicationHistoryCreate(index: any) {
      this.SecondaryUpdating = true;
      const FArray = this.HistoryFGroup.get('MedicationArray') as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      if (FGroup.status === 'VALID') {
         this.FollowUpService.FollowUpMedicationHistory_Create(FGroup.getRawValue()).subscribe(response => {
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
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'FollowUp Medication Details Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      }
   }
   FollowUpEventsHistoryUpdate(index: any) {
      this.SecondaryUpdating = true;
      const FArray = this.HistoryFGroup.get('EventsArray') as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      if (FGroup.status === 'VALID') {
         this.FollowUpService.FollowUpEventsHistory_Update(FGroup.getRawValue()).subscribe(response => {
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
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'FollowUp Events Details Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      }
   }
   FollowUpEventsHistoryCreate(index: any) {
      this.SecondaryUpdating = true;
      const FArray = this.HistoryFGroup.get('EventsArray') as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      if (FGroup.status === 'VALID') {
         this.FollowUpService.FollowUpEventsHistory_Create(FGroup.getRawValue()).subscribe(response => {
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
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'FollowUp Events Details Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      }
   }



   FollowUpSubmit() {
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
         this.FollowUpService.FollowUpDetails_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.FollowUpDetails = response.Response;
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'FollowUp Details Successfully Created!' });
               this.PatientUpdateData(response.Response, 'FollowUpDetails', false);
               setTimeout(() => {
                  this.tabGroup.selectedIndex = 1;                  
               }, 100);
               this.isEditMode = false;
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

   FollowUpUpdate() {
      
      this.DynamicFGroup.updateValueAndValidity();
      let FormValid = true;
    
      // Check if form controls are valid
      Object.keys(this.DynamicFGroup.controls).forEach(obj => {
        const FControl = this.DynamicFGroup.controls[obj];
        if (FControl.status === 'INVALID') {
          FormValid = false;
        }
      });
    
      if (FormValid && !this.FormUploading) {
        // Set FormUploading flag to true to prevent multiple submissions
        this.FormUploading = true;
    
        // Call the service to update FollowUp details
        this.FollowUpService.FollowUpDetails_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
          this.FormUploading = false; // Reset the FormUploading flag
    
          if (response.Status) {
            // Update FollowUpDetails with the response data
            this.FollowUpDetails = response.Response;
    
            // Show success message
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'FollowUp Details Successfully Updated!' });
    
            // Perform any necessary data updates
            this.PatientUpdateData(response.Response, 'FollowUpDetails', false);
    
            // Redirect to the next tab after a short delay (100 milliseconds)
            setTimeout(() => {
              this.tabGroup.selectedIndex = 1; // Assuming tabGroup is a reference to your tab component
              console.log('Tab navigation executed', this.tabGroup.selectedIndex);
            }, 100);
          } else {
            // Show error message if the update was not successful
            const errorMessage = response.Message || 'Some Error Occurred, but not Identified.';
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: errorMessage });
          }
        });
      } else {
        // Mark all invalid form controls as touched and dirty for error display
        Object.keys(this.DynamicFGroup.controls).forEach(obj => {
          const FControl = this.DynamicFGroup.controls[obj];
          if (FControl.invalid) {
            FControl.markAsTouched();
            FControl.markAsDirty();
          }
        });
    
        // Scroll to the first element with validation error for better visibility
        const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid, .mat-checkbox.ng-invalid');
        if (firstElementWithError) {
          window.scrollTo({
            top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60,
            left: 0,
            behavior: 'smooth'
          });
        }
      }
    }
    

   FollowUpMedicationSubmit() {
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
         this.FollowUpService.FollowUpMedication_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.MedicationDetails = response.Response;
               this.PatientUpdateData(response.Response, 'FollowUpDetails', false);
               this.TabChangeEvent(2);
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'FollowUp Medication Details Successfully Created!' });
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

   FollowUpMedicationUpdate() {
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
         this.FollowUpService.FollowUpMedication_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.MedicationDetails = response.Response;
               this.PatientUpdateData(response.Response, 'FollowUpDetails', false);
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'FollowUp Medication Details Successfully Updated!' });
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

   FollowUpEventSubmit() {
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
         this.FollowUpService.FollowUpEvents_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.EventDetails = response.Response;
               this.PatientUpdateData(response.Response, 'FollowUpDetails', false);
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'FollowUp Events Details Successfully Created!' });
               this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                  this.router.navigate(['/Patient-Records', this.UrlParams.Patient])
               );
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

   FollowUpEventUpdate() {
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
         this.FollowUpService.FollowUpEvents_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.EventDetails = response.Response;
               this.PatientUpdateData(response.Response, 'FollowUpDetails', false);
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'FollowUp Event Details Successfully Updated!' });
               this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                  this.router.navigate(['/Patient-Records', this.UrlParams.Patient])
               );
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

   // For followUp delete-------------------
   deleteFollowUpHistory(formArray: any, index: any) {
      this.SecondaryUpdating = true;
      const FArray = this.HistoryFGroup.get(formArray) as FormArray;
      const FGroup =  FArray.controls[index] as FormGroup;
      const followUpId = {"_id": FGroup.value._id};
          this.FollowUpService.FollowUpHistory_Delete(followUpId).subscribe(
              (response) => {
                  this.SecondaryUpdating = false;
                  if (response.Status) {
                      this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'FollowUp Details Successfully Deleted!' });
                      FArray.removeAt(index);
                  } else {
                      const errorMessage = response.Message || 'Some error occurred, but not identified.';
                      this.Toastr.NewToastrMessage({ Type: 'Error', Message: errorMessage });
                  }
              },
              (error) => {
                  console.error('Error occurred while deleting follow-up history:', error);
                  this.SecondaryUpdating = false;
                  this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'An error occurred while deleting follow-up history.' });
              }
          );
  }

  deleteMedicationHistory(formArray: any, index: any) {
   this.SecondaryUpdating = true;
   const FArray = this.HistoryFGroup.get(formArray) as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;
   const getMedicationHistoryID = {"_id": FGroup.value._id};
          this.FollowUpService.MedicationHistory_Delete(getMedicationHistoryID).subscribe(
              (response) => {
                  this.SecondaryUpdating = false;
                  if (response.Status) {
                      this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Medication In Details Successfully Deleted!' });
                      FArray.removeAt(index);
                  } else {
                      const errorMessage = response.Message || 'Some error occurred, but not identified.';
                      this.Toastr.NewToastrMessage({ Type: 'Error', Message: errorMessage });
                  }
              },
              (error) => {
                  console.error('Error occurred while deleting follow-up history:', error);
                  this.SecondaryUpdating = false;
                  this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'An error occurred while deleting follow-up history.' });
              }
          );
}

//DeleteHistoryArray  -- For Events delete-----------------
deleteHistoryArray(formArray: any, index: any) {
   this.SecondaryUpdating = true;
   const FArray = this.HistoryFGroup.get(formArray) as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;
   const eventsId = {"_id": FGroup.value._id};
   this.FollowUpService.FollowUpEventsDelete(eventsId).subscribe(
      (response) => {
         //  this.SecondaryEdit = false;
         this.SecondaryUpdating = false;
          if (response.Status) {
              this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Events Details Successfully Deleted!' });
              FArray.removeAt(index);
          } else {
              const errorMessage = response.Message || 'Some error occurred, but not identified.';
              this.Toastr.NewToastrMessage({ Type: 'Error', Message: errorMessage });
          }
      },
      (error) => {
          console.error('Error occurred while deleting follow-up events:', error);
         //  this.SecondaryEdit = false;
          this.SecondaryUpdating = false;
          this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'An error occurred while deleting follow-up events.' });
      }
  );
}

}
