import { Component, OnInit, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { FormGroup, Validators, FormControl, ValidatorFn, ValidationErrors, AbstractControl, FormArray } from '@angular/forms';
import { DateAdapter, NativeDateAdapter } from '@angular/material/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { TimepickerDirective } from 'ngx-material-timepicker';

import { DataPassingService } from './../../../../../services/common-services/data-passing.service';
import { LoginManagementService } from './../../../../../services/login-management/login-management.service';
import { ToastrService } from './../../../../../services/common-services/toastr.service';

import { PatientDetailsService } from 'src/app/services/patient-management/patient-details/patient-details.service';
import { ThrombolysisService } from 'src/app/services/patient-management/thrombolysis/thrombolysis.service';
import { PciService } from 'src/app/services/patient-management/pci/pci.service';
import { HospitalSummaryService } from 'src/app/services/patient-management/hospital-summary/hospital-summary.service';

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
selector: 'app-manage-hospital-summary',
templateUrl: './manage-hospital-summary.component.html',
styleUrls: ['./manage-hospital-summary.component.css'],
providers: [{provide: DateAdapter, useClass: MyDateAdapter}],
})
export class ManageHospitalSummaryComponent implements OnInit, OnDestroy {

   @ViewChildren(TimepickerDirective) timePicker: QueryList<TimepickerDirective>;

   private subscription: Subscription = new Subscription();
   private dataSubscription: Subscription = new Subscription();
   private otherMedicineSubscription: Subscription = new Subscription();
   private historySubscription: Subscription = new Subscription();

   AllFields: any[] = [];
   AllFieldsValues: any[] = [];
   AllValidations: any[] = [];

   TabsList: any[] = ['Lab_Report', 'Medication_in_Hospital', 'Adverse_Events'];

   Route: any[] = [{Name: 'IV', Key: 'IV'},
                  {Name: 'SC', Key: 'SC'},
                  {Name: 'O', Key: 'O'},
                  {Name: 'SH', Key: 'SH'},
                  {Name: 'A', Key: 'A'},
                  {Name: 'ID', Key: 'ID'},
                  {Name: 'IM', Key: 'IM'},
                  {Name: 'IC', Key: 'IC'},
                  {Name: 'Unknown', Key: 'Unknown'}
                  ];

   DosageUnitsOne: any[] = [{Name: 'mg', Key: 'mg'},
                        {Name: 'U', Key: 'u'},
                        {Name: 'mcg', Key: 'mcg'},
                        {Name: 'mg/ml', Key: 'mg_ml'},
                        {Name: 'mcg/min', Key: 'mcg_min'} ];

   InfarctionLocation: any[] = [{Name: 'Anterior Wall MI', Key: 'Anterior_Wall_MI'},
                                 {Name: 'Inferior Wall MI', Key: 'Inferior_Wall_MI'},
                                 {Name: 'Posterior Wall MI', Key: 'Posterior_Wall_MI'},
                                 {Name: 'Lateral Wall MI', Key: 'Lateral_Wall_M'},
                                 {Name: 'RV Infarction', Key: 'RV_Infarction'} ];

   HeparinRoutes: any[] = ['IV', 'SC', 'O', 'SH', 'A', 'ID', 'IM', 'IC', 'Unknown'];

   DynamicFGroup: FormGroup;
   HistoryFGroup: FormGroup;

   HistoryAvailable = false;
   LabReportHistoryAvailable = false;
   MedicationHistoryAvailable = false;
   AdverseEventsHistoryAvailable = false;

   CurrentHospitalInfo: any = null;
   PatientInfo: any;

   FormLoaded = false;
   FormUploading = false;

   CurrentTabIndex = 0;

   UrlParams = null;
   ExistingPatient = true;

   ReadonlyPage = false;
   LastActiveTab = 'Adverse_Events';
   InitialHospital = null;
   LabReportId = null;
   MedicationHospitalId = null;
   EventsId = null;

   OtherMedicationArrayFields = ['Medication_In_Hospital_Other_Medicine_Name',
                                 'Medication_In_Hospital_Other_Medicine_Route',
                                 'Medication_In_Hospital_Other_Medicine_Dosage',
                                 'Medication_In_Hospital_Other_Medicine_Dosage_Units',
                                 'Medication_In_Hospital_Other_Medicine_Dosage_Date_Time',
                                 'Medication_In_Hospital_Other_Medicine_Dosage_Time'];

   OtherMedicationArray: FormArray;
   OtherMedicationData = [];

   OtherMedicationArrayAdverseEvent: FormArray;
   OtherMedicationDataAdverseEvent = [];
   ContentLoading = true;

   SecondaryEdit = false;
   SecondaryCurrentEdit = {FormArray: '', Index: ''};
   SecondaryData: any;
   SecondaryUpdating = false;

   IfThrombolysis = false;
   ThrombolysisData = null;
   IfMedicationPriorToThrombolysis = false;
   MedicationPriorToThrombolysisData = null;

   UserInfo: any;
   noFutureDate: any;
   constructor(   private PatientService: PatientDetailsService,
                  private thrombolysisService: ThrombolysisService,
                  private pciService: PciService,
                  private router: Router,
                  private HospitalService: HospitalSummaryService,
                  private LoginService: LoginManagementService,
                  private dataPassingService: DataPassingService,
                  private activatedRoute: ActivatedRoute,
                  public Toastr: ToastrService ) {

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

                  // this.LastActiveTab = PatientRes.Response.LastCompletionChild;
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
                     this.HospitalService.HospitalSummaryAdverseEvents_View(DataObj)
                  ).subscribe( ([Res1, Res2, Res3, Res4, Res5, Res6, Res7, Res8, Res9, Res10, Res11, Res12, Res13]) => {
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
                           if (Res11.Response.length >= 1 ) {
                              Res11.Response.map(obj => {
                                 if (obj.Hospital._id === this.InitialHospital) {
                                    this.LabReportId = Res11.Response[Res11.Response.length - 1]._id;
                                 }
                              });
                           }
                           this.PatientUpdateData(Res11.Response, 'LabReport', false);
                        }
                        if (Res12.Response !== null) {
                           if (Res12.Response.length >= 1 ) {
                              Res12.Response.map(obj => {
                                 if (obj.Hospital._id === this.InitialHospital) {
                                    this.MedicationHospitalId = Res12.Response[Res12.Response.length - 1]._id;
                                 }
                              });
                           }
                           this.PatientUpdateData(Res12.Response, 'MedicationInHospital', false);
                        }
                        if (Res13.Response !== null) {
                           if (Res13.Response.length >= 1 ) {
                              Res13.Response.map(obj => {
                                 if (obj.Hospital._id === this.InitialHospital) {
                                    this.EventsId = Res13.Response[Res13.Response.length - 1]._id;
                                 }
                              });
                           }
                           this.PatientUpdateData(Res13.Response, 'AdverseEvents', false);
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
      LabOneReportHistory: new FormArray([]),
      LabSecondReportHistory: new FormArray([]),
      MedicationHistory: new FormArray([]),
      AdverseEventsHistory: new FormArray([])
   });
}

ngOnDestroy() {
   this.dataSubscription.unsubscribe();
   this.subscription.unsubscribe();
   this.otherMedicineSubscription.unsubscribe();
   this.historySubscription.unsubscribe();
}


NotAllow(): boolean {return false; }
ClearInput(event: KeyboardEvent, index?: any): boolean {
   const Events = event.composedPath() as EventTarget[];
   const Input = Events[0] as HTMLInputElement;
   const FControl = Input.attributes as NamedNodeMap;
   const FControlName = FControl.getNamedItem('formcontrolname').textContent;
   if (this.OtherMedicationArrayFields.includes(FControlName)) {
      const FArray = this.DynamicFGroup.get('OtherMedicationArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      FGroup.controls[FControlName].setValue(null);
   } else {
      this.DynamicFGroup.controls[FControlName].setValue(null);
   }
   return false;
}

FindUnitName(Key: any) {
   if (Key && Key !== null && Key !== '') {
      const nameData = this.DosageUnitsOne.filter(obj => obj.Key === Key);
      if (nameData.length > 0) {
         return ' ' + nameData[0].Name;
      } else {
         return '';
      }
   } else {
      return '';
   }
}

PatientUpdateData(PatientData: any, From: string, ProceedNext: boolean) {

   if (From === 'Basic') {
      const HospitalDetails = PatientData.Hospital_History;
      if (this.UserInfo.User_Type === 'PU' && PatientData.Hospital_History.length > 1) {
         const FilterArr = HospitalDetails.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id && i < (HospitalDetails.length - 1) );
         this.ReadonlyPage = FilterArr.length > 0 ? true : this.ReadonlyPage;
      }
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
      if (PatientData.Hospital_History.length > 1 || PatientData.TransferBending ) {
         this.HistoryAvailable = true;
      }

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
   } else if (From === 'MedicationPriorToThrombolysis') {
      this.IfMedicationPriorToThrombolysis = true;
      this.MedicationPriorToThrombolysisData = PatientData;
   } else if (From === 'Thrombolysis') {
      this.IfThrombolysis = true;
      this.ThrombolysisData = PatientData;
   } else if (From === 'LabReport') {
      // Editable Form Group
      let FieldDisabled = false;
      if (this.UserInfo.User_Type === 'PU') {
         const FilterArr = PatientData.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id && i < (PatientData.length - 1) );
         FieldDisabled = FilterArr.length > 0 ? true : FieldDisabled;
      } else if (this.PatientInfo.TransferBending) {
         FieldDisabled = true;
      }

      let ReceivableHospital = true;
      if (this.PatientInfo.TransferBending && this.UserInfo.User_Type === 'PU') {
         const CheckExisting = this.PatientInfo.Hospital_History.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id);
         ReceivableHospital = CheckExisting.length === 0 ? true : false;
      } else {
         ReceivableHospital = false;
      }
      if (ReceivableHospital) {
         this.ReadonlyPage = true;
      }

      if (FieldDisabled) {
         this.AllFieldsValues.map((obj, i) => {
            if (obj.Sub_Junior_Category === 'Lab_Report') {
               this.AllFieldsValues[i].Disabled = true;
            }
         });
      }
      if (PatientData.length > 0) {
         const MedicationKeys = Object.keys(PatientData[PatientData.length - 1]);
         if (PatientData[PatientData.length - 1].Hospital._id === this.InitialHospital && !ReceivableHospital) {
            this.AllFieldsValues.map((obj, i) => {
               if (MedicationKeys.includes(obj.Key_Name)) {
                  this.AllFieldsValues[i].CurrentValue = PatientData[PatientData.length - 1][obj.Key_Name];
                  this.AllFieldsValues[i].DefaultValue = PatientData[PatientData.length - 1][obj.Key_Name];
               }
            });
         }
      }
      // ReadOnly Form Group
      if (this.PatientInfo.Hospital_History.length > 1 || (this.UserInfo.User_Type === 'PU' && this.PatientInfo.TransferBending && this.PatientInfo.TransferBendingTo._id === this.UserInfo.Hospital._id)) {
         this.LabReportHistoryAvailable = true;
         const arr = this.HistoryFGroup.controls['LabOneReportHistory'] as FormArray;
         while (0 !== arr.length) { arr.removeAt(0); }
         const arr1 = this.HistoryFGroup.controls['LabSecondReportHistory'] as FormArray;
         while (0 !== arr1.length) { arr1.removeAt(0); }
         this.PatientInfo.Hospital_History.map(obj => {
            if ( obj.Hospital.Hospital_Role !== 'EMS' && (obj.Hospital._id !== this.InitialHospital || (this.UserInfo.User_Type === 'PU' && this.PatientInfo.TransferBending && this.PatientInfo.TransferBendingTo._id === this.UserInfo.Hospital._id))) {
               const Arr = PatientData.filter(obj1 => obj1.Hospital._id === obj.Hospital._id);
               const LabReportData =  Arr.length > 0 ? Arr[0] : {};
               const Key = obj.Hospital.Hospital_Role === 'EMS' ? 'E' : obj.Hospital.Hospital_Role.slice(0, 1) + obj.Hospital.Hospital_Role.slice(-1);
               const FGroupOne = new FormGroup({
                  Patient: new FormControl({value: this.PatientInfo._id, disabled: true}),
                  _id: new FormControl({value: LabReportData._id || null, disabled: true}),
                  Hospital: new FormControl({value: obj.Hospital._id, disabled: true}),
                  Hospital_Role: new FormControl({value: obj.Hospital.Hospital_Role, disabled: true}),
                  Hospital_Key: new FormControl({value: Key, disabled: true}),
                  HistoryActive: new FormControl({value: false, disabled: true}),
                  Lab_Report_Haemoglobin: new FormControl({value: LabReportData.Lab_Report_Haemoglobin || null, disabled: true}),
                  Lab_Report_Haemoglobin_Dosage_Units: new FormControl({value: LabReportData.Lab_Report_Haemoglobin_Dosage_Units || null, disabled: true}),
                  Lab_Report_Creatinine: new FormControl({value: LabReportData.Lab_Report_Creatinine || null, disabled: true}),
                  Lab_Report_Creatinine_Dosage_Units: new FormControl({value: LabReportData.Lab_Report_Creatinine_Dosage_Units || null, disabled: true}),
                  Lab_Report_CPK_Mb: new FormControl({value: LabReportData.Lab_Report_CPK_Mb || null, disabled: true}),
                  Lab_Report_CPK_Mb_Dosage_Units: new FormControl({value: LabReportData.Lab_Report_CPK_Mb_Dosage_Units || null, disabled: true}),
                  Lab_Report_Trop: new FormControl({value: LabReportData.Lab_Report_Trop || null, disabled: true}),
						Lab_Report_TropT: new FormControl({value: LabReportData.Lab_Report_TropT || null, disabled: true}),
                  Lab_Report_TropI: new FormControl({value: LabReportData.Lab_Report_TropI || null, disabled: true}),
                  Lab_Report_Trop_Dosage_Units: new FormControl({value: LabReportData.Lab_Report_Trop_Dosage_Units || null, disabled: true}),
                  Lab_Report_Trop_T: new FormControl({value: LabReportData.Lab_Report_Trop_T || null, disabled: true}),
                  EditActivate: new FormControl({value: false, disabled: true}),
               });
               const FGroupTwo = new FormGroup({
                  Patient: new FormControl({value: this.PatientInfo._id, disabled: true}),
                  _id: new FormControl({value: LabReportData._id || null, disabled: true}),
                  Hospital: new FormControl({value: obj.Hospital._id, disabled: true}),
                  Hospital_Role: new FormControl({value: obj.Hospital.Hospital_Role, disabled: true}),
                  Hospital_Key: new FormControl({value: Key, disabled: true}),
                  HistoryActive: new FormControl({value: false, disabled: true}),
                  Lab_Report_RBS: new FormControl({value: LabReportData.Lab_Report_RBS || null, disabled: true}),
                  Lab_Report_RBS_Dosage_Units: new FormControl({value: LabReportData.Lab_Report_RBS_Dosage_Units || null, disabled: true}),
                  Lab_Report_LDL: new FormControl({value: LabReportData.Lab_Report_LDL || null, disabled: true}),
                  Lab_Report_LDL_Dosage_Units: new FormControl({value: LabReportData.Lab_Report_LDL_Dosage_Units || null, disabled: true}),
                  Lab_Report_HDL: new FormControl({value: LabReportData.Lab_Report_HDL || null, disabled: true}),
                  Lab_Report_HDL_Dosage_Units: new FormControl({value: LabReportData.Lab_Report_HDL_Dosage_Units || null, disabled: true}),
                  Lab_Report_Cholesterol: new FormControl({value: LabReportData.Lab_Report_Cholesterol || null, disabled: true}),
                  Lab_Report_Cholesterol_Dosage_Units: new FormControl({value: LabReportData.Lab_Report_Cholesterol_Dosage_Units || null, disabled: true}),
                  Lab_Report_HBA1c: new FormControl({value: LabReportData.Lab_Report_HBA1c || null, disabled: true}),
                  Lab_Report_HBA1c_Dosage_Units: new FormControl({value: LabReportData.Lab_Report_HBA1c_Dosage_Units || null, disabled: true}),
						Lab_Report_eGFR: new FormControl({value: LabReportData.Lab_Report_eGFR || null, disabled: true}),
                  Lab_Report_eGFR_Dosage_Units: new FormControl({value: LabReportData.Lab_Report_eGFR_Dosage_Units || null, disabled: true}),
                  EditActivate: new FormControl({value: false, disabled: true}),
               });
               const FArrayOne = this.HistoryFGroup.controls.LabOneReportHistory as FormArray;
               const FArrayTwo = this.HistoryFGroup.controls.LabSecondReportHistory as FormArray;
               FArrayOne.push(FGroupOne);
               FArrayTwo.push(FGroupTwo);
            }
         });
      }
   } else if (From === 'MedicationInHospital') {
      // Editable Form Group
      let FieldDisabled = false;
      if (this.UserInfo.User_Type === 'PU') {
         const FilterArr = PatientData.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id && i < (PatientData.length - 1) );
         FieldDisabled = FilterArr.length > 0 ? true : FieldDisabled;
      } else if (this.PatientInfo.TransferBending) {
         FieldDisabled = true;
      }

      let ReceivableHospital = true;
      if (this.PatientInfo.TransferBending && this.UserInfo.User_Type === 'PU') {
         const CheckExisting = this.PatientInfo.Hospital_History.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id);
         ReceivableHospital = CheckExisting.length === 0 ? true : false;
      } else {
         ReceivableHospital = false;
      }
      if (ReceivableHospital) {
         this.ReadonlyPage = true;
      }


      if (FieldDisabled) {
         this.AllFieldsValues.map((obj, i) => {
            if (obj.Sub_Category === 'Medication_in_Hospital') {
               this.AllFieldsValues[i].Disabled = true;
            }
         });
      }
      if (PatientData.length > 0) {
         const MedicationKeys = Object.keys(PatientData[PatientData.length - 1]);
         if (PatientData[PatientData.length - 1].Hospital._id === this.InitialHospital && !ReceivableHospital) {
            this.AllFieldsValues.map((obj, i) => {
               if (MedicationKeys.includes(obj.Key_Name)) {
                  this.AllFieldsValues[i].CurrentValue = PatientData[PatientData.length - 1][obj.Key_Name];
                  this.AllFieldsValues[i].DefaultValue = PatientData[PatientData.length - 1][obj.Key_Name];
               }
            });
            if (PatientData[PatientData.length - 1].OtherMedicationArray && PatientData[PatientData.length - 1].OtherMedicationArray !== null && PatientData[PatientData.length - 1].OtherMedicationArray.length > 0 ) {
               this.OtherMedicationData = PatientData[PatientData.length - 1].OtherMedicationArray;
            }
         }
      }
      // ReadOnly Form Group
      if (this.PatientInfo.Hospital_History.length > 1 || (this.UserInfo.User_Type === 'PU' && this.PatientInfo.TransferBending && this.PatientInfo.TransferBendingTo._id === this.UserInfo.Hospital._id)) {
         this.MedicationHistoryAvailable = true;
         const arr = this.HistoryFGroup.controls['MedicationHistory'] as FormArray;
         while (0 !== arr.length) { arr.removeAt(0); }
         this.PatientInfo.Hospital_History.map(obj => {
            if ( obj.Hospital.Hospital_Role !== 'EMS' && (obj.Hospital._id !== this.InitialHospital || (this.UserInfo.User_Type === 'PU' && this.PatientInfo.TransferBending && this.PatientInfo.TransferBendingTo._id === this.UserInfo.Hospital._id))) {
               const Arr = PatientData.filter(obj1 => obj1.Hospital._id === obj.Hospital._id);
               const MedicationData =  Arr.length > 0 ? Arr[0] : {};
               const Key = obj.Hospital.Hospital_Role === 'EMS' ? 'E' : obj.Hospital.Hospital_Role.slice(0, 1) + obj.Hospital.Hospital_Role.slice(-1);
               const OtherMedication = Object.keys(MedicationData).length > 0 ? MedicationData.OtherMedicationArray : [];
               const NewFArray = new FormArray([]);
               if (OtherMedication.length > 0) {
                  OtherMedication.map(OBJ => {
                     let OtherMedicineTime = null;
                     if (OBJ.Medication_In_Hospital_Other_Medicine_Dosage_Date_Time && OBJ.Medication_In_Hospital_Other_Medicine_Dosage_Date_Time !== null && OBJ.Medication_In_Hospital_Other_Medicine_Dosage_Date_Time !== '') {
                        const DateTime = new Date(OBJ.Medication_In_Hospital_Other_Medicine_Dosage_Date_Time);
                        OtherMedicineTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
                     }
                     const NewFGroup = new FormGroup({
                        Medication_In_Hospital_Other_Medicine_Name: new FormControl({value: OBJ.Medication_In_Hospital_Other_Medicine_Name, disabled: true}),
                        Medication_In_Hospital_Other_Medicine_Route: new FormControl({value: OBJ.Medication_In_Hospital_Other_Medicine_Route, disabled: true}),
                        Medication_In_Hospital_Other_Medicine_Dosage: new FormControl({value: OBJ.Medication_In_Hospital_Other_Medicine_Dosage, disabled: true}),
                        Medication_In_Hospital_Other_Medicine_Dosage_Units: new FormControl({value: OBJ.Medication_In_Hospital_Other_Medicine_Dosage_Units, disabled: true}),
                        Medication_In_Hospital_Other_Medicine_Dosage_Date_Time: new FormControl({value: OBJ.Medication_In_Hospital_Other_Medicine_Dosage_Date_Time, disabled: true}),
                        Medication_In_Hospital_Other_Medicine_Dosage_Time: new FormControl({value: OtherMedicineTime, disabled: true}),
                     });
                     NewFArray.push(NewFGroup);
                  });
               }
               let NitroglycerinTime = null;
               if (MedicationData.Medication_In_Hospital_Nitroglycerin_Date_Time && MedicationData.Medication_In_Hospital_Nitroglycerin_Date_Time !== null && MedicationData.Medication_In_Hospital_Nitroglycerin_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_Nitroglycerin_Date_Time);
                  NitroglycerinTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let DopamineTime = null;
               if (MedicationData.Medication_In_Hospital_Dopamine_Date_Time && MedicationData.Medication_In_Hospital_Dopamine_Date_Time !== null && MedicationData.Medication_In_Hospital_Dopamine_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_Dopamine_Date_Time);
                  DopamineTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let DobutamineTime = null;
               if (MedicationData.Medication_In_Hospital_Dobutamine_Date_Time && MedicationData.Medication_In_Hospital_Dobutamine_Date_Time !== null && MedicationData.Medication_In_Hospital_Dobutamine_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_Dobutamine_Date_Time);
                  DobutamineTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let AdrenalineTime = null;
               if (MedicationData.Medication_In_Hospital_Adrenaline_Date_Time && MedicationData.Medication_In_Hospital_Adrenaline_Date_Time !== null && MedicationData.Medication_In_Hospital_Adrenaline_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_Adrenaline_Date_Time);
                  AdrenalineTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let NorAadrenalineTime = null;
               if (MedicationData.Medication_In_Hospital_Nor_Aadrenaline_Date_Time && MedicationData.Medication_In_Hospital_Nor_Aadrenaline_Date_Time !== null && MedicationData.Medication_In_Hospital_Nor_Aadrenaline_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_Nor_Aadrenaline_Date_Time);
                  NorAadrenalineTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let AspirinTime = null;
               if (MedicationData.Medication_In_Hospital_Aspirin_Dosage_Date_Time && MedicationData.Medication_In_Hospital_Aspirin_Dosage_Date_Time !== null && MedicationData.Medication_In_Hospital_Aspirin_Dosage_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_Aspirin_Dosage_Date_Time);
                  AspirinTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let ClopidogrelTime = null;
               if (MedicationData.Medication_In_Hospital_Clopidogrel_Dosage_Date_Time && MedicationData.Medication_In_Hospital_Clopidogrel_Dosage_Date_Time !== null && MedicationData.Medication_In_Hospital_Clopidogrel_Dosage_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_Clopidogrel_Dosage_Date_Time);
                  ClopidogrelTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let PrasugrelTime = null;
               if (MedicationData.Medication_In_Hospital_Prasugrel_Dosage_Date_Time && MedicationData.Medication_In_Hospital_Prasugrel_Dosage_Date_Time !== null && MedicationData.Medication_In_Hospital_Prasugrel_Dosage_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_Prasugrel_Dosage_Date_Time);
                  PrasugrelTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let TicagrelorTime = null;
               if (MedicationData.Medication_In_Hospital_Ticagrelor_Dosage_Date_Time && MedicationData.Medication_In_Hospital_Ticagrelor_Dosage_Date_Time !== null && MedicationData.Medication_In_Hospital_Ticagrelor_Dosage_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_Ticagrelor_Dosage_Date_Time);
                  TicagrelorTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let IIbIIIa_inhibitorTime = null;
               if (MedicationData.Medication_In_Hospital_IIbIIIa_inhibitor_Date_Time && MedicationData.Medication_In_Hospital_IIbIIIa_inhibitor_Date_Time !== null && MedicationData.Medication_In_Hospital_IIbIIIa_inhibitor_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_IIbIIIa_inhibitor_Date_Time);
                  IIbIIIa_inhibitorTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let InotropeTime = null;
               if (MedicationData.Medication_In_Hospital_Inotrope_Date_Time && MedicationData.Medication_In_Hospital_Inotrope_Date_Time !== null && MedicationData.Medication_In_Hospital_Inotrope_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_Inotrope_Date_Time);
                  InotropeTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
					let EnoxaparinTime = null;
               if (MedicationData.Medication_In_Hospital_Enoxaparin_Date_Time && MedicationData.Medication_In_Hospital_Enoxaparin_Date_Time !== null && MedicationData.Medication_In_Hospital_Enoxaparin_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_Enoxaparin_Date_Time);
                  EnoxaparinTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let UnFractionatedHeparinTime = null;
               if (MedicationData.Medication_In_Hospital_UnFractionated_Heparin_Date_Time && MedicationData.Medication_In_Hospital_UnFractionated_Heparin_Date_Time !== null && MedicationData.Medication_In_Hospital_UnFractionated_Heparin_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_UnFractionated_Heparin_Date_Time);
                  UnFractionatedHeparinTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let LMWHeparinTime = null;
               if (MedicationData.Medication_In_Hospital_LMW_Heparin_Date_Time && MedicationData.Medication_In_Hospital_LMW_Heparin_Date_Time !== null && MedicationData.Medication_In_Hospital_LMW_Heparin_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_LMW_Heparin_Date_Time);
                  LMWHeparinTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
					let FondaparinuxTime = null;
               if (MedicationData.Medication_In_Hospital_Fondaparinux_Date_Time && MedicationData.Medication_In_Hospital_Fondaparinux_Date_Time !== null && MedicationData.Medication_In_Hospital_Fondaparinux_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Medication_In_Hospital_Fondaparinux_Date_Time);
                  FondaparinuxTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               const FGroup = new FormGroup({
                  Patient: new FormControl({value: this.PatientInfo._id, disabled: true}),
                  _id: new FormControl({value: MedicationData._id || null, disabled: true}),
                  Hospital: new FormControl({value: obj.Hospital._id, disabled: true}),
                  Hospital_Role: new FormControl({value: obj.Hospital.Hospital_Role, disabled: true}),
                  Hospital_Key: new FormControl({value: Key, disabled: true}),
                  HistoryActive: new FormControl({value: false, disabled: true}),
                  Medication_In_Hospital_Nitroglycerin: new FormControl({value: MedicationData.Medication_In_Hospital_Nitroglycerin || null, disabled: true}),
                  Medication_In_Hospital_Nitroglycerin_Route: new FormControl({value: MedicationData.Medication_In_Hospital_Nitroglycerin_Route || null, disabled: true}),
                  Medication_In_Hospital_Nitroglycerin_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_Nitroglycerin_Dosage || null, disabled: true}),
                  Medication_In_Hospital_Nitroglycerin_Dosage_Units: new FormControl({value: MedicationData.Medication_In_Hospital_Nitroglycerin_Dosage_Units || null, disabled: true}),
                  Medication_In_Hospital_Nitroglycerin_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_Nitroglycerin_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_Nitroglycerin_Time: new FormControl({value: NitroglycerinTime || null, disabled: true}),
                  Medication_In_Hospital_Dopamine: new FormControl({value: MedicationData.Medication_In_Hospital_Dopamine || null, disabled: true}),
                  Medication_In_Hospital_Dopamine_Route: new FormControl({value: MedicationData.Medication_In_Hospital_Dopamine_Route || null, disabled: true}),
                  Medication_In_Hospital_Dopamine_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_Dopamine_Dosage || null, disabled: true}),
                  Medication_In_Hospital_Dopamine_Dosage_Units: new FormControl({value: MedicationData.Medication_In_Hospital_Dopamine_Dosage_Units || null, disabled: true}),
                  Medication_In_Hospital_Dopamine_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_Dopamine_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_Dopamine_Time: new FormControl({value: DopamineTime || null, disabled: true}),
                  Medication_In_Hospital_Dobutamine: new FormControl({value: MedicationData.Medication_In_Hospital_Dobutamine || null, disabled: true}),
                  Medication_In_Hospital_Dobutamine_Route: new FormControl({value: MedicationData.Medication_In_Hospital_Dobutamine_Route || null, disabled: true}),
                  Medication_In_Hospital_Dobutamine_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_Dobutamine_Dosage || null, disabled: true}),
                  Medication_In_Hospital_Dobutamine_Dosage_Units: new FormControl({value: MedicationData.Medication_In_Hospital_Dobutamine_Dosage_Units || null, disabled: true}),
                  Medication_In_Hospital_Dobutamine_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_Dobutamine_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_Dobutamine_Time: new FormControl({value: DobutamineTime || null, disabled: true}),
                  Medication_In_Hospital_Adrenaline: new FormControl({value: MedicationData.Medication_In_Hospital_Adrenaline || null, disabled: true}),
                  Medication_In_Hospital_Adrenaline_Route: new FormControl({value: MedicationData.Medication_In_Hospital_Adrenaline_Route || null, disabled: true}),
                  Medication_In_Hospital_Adrenaline_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_Adrenaline_Dosage || null, disabled: true}),
                  Medication_In_Hospital_Adrenaline_Dosage_Units: new FormControl({value: MedicationData.Medication_In_Hospital_Adrenaline_Dosage_Units || null, disabled: true}),
                  Medication_In_Hospital_Adrenaline_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_Adrenaline_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_Adrenaline_Time: new FormControl({value: AdrenalineTime || null, disabled: true}),
                  Medication_In_Hospital_Nor_Aadrenaline: new FormControl({value: MedicationData.Medication_In_Hospital_Nor_Aadrenaline || null, disabled: true}),
                  Medication_In_Hospital_Nor_Aadrenaline_Route: new FormControl({value: MedicationData.Medication_In_Hospital_Nor_Aadrenaline_Route || null, disabled: true}),
                  Medication_In_Hospital_Nor_Aadrenaline_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_Nor_Aadrenaline_Dosage || null, disabled: true}),
                  Medication_In_Hospital_Nor_Aadrenaline_Dosage_Units: new FormControl({value: MedicationData.Medication_In_Hospital_Nor_Aadrenaline_Dosage_Units || null, disabled: true}),
                  Medication_In_Hospital_Nor_Aadrenaline_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_Nor_Aadrenaline_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_Nor_Aadrenaline_Time: new FormControl({value: NorAadrenalineTime || null, disabled: true}),

                  Medication_In_Hospital_Oxygen: new FormControl({value: MedicationData.Medication_In_Hospital_Oxygen || null, disabled: true}),
                  Medication_In_Hospital_Oxygen_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_Oxygen_Dosage || null, disabled: true}),
                  Medication_In_Hospital_Aspirin: new FormControl({value: MedicationData.Medication_In_Hospital_Aspirin || null, disabled: true}),
                  Medication_In_Hospital_Aspirin_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_Aspirin_Dosage || null, disabled: true}),
                  Medication_In_Hospital_Aspirin_Dosage_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_Aspirin_Dosage_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_Aspirin_Dosage_Time: new FormControl({value: AspirinTime || null, disabled: true}),
                  Medication_In_Hospital_Clopidogrel: new FormControl({value: MedicationData.Medication_In_Hospital_Clopidogrel || null, disabled: true}),
                  Medication_In_Hospital_Clopidogrel_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_Clopidogrel_Dosage || null, disabled: true}),
                  Medication_In_Hospital_Clopidogrel_Dosage_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_Clopidogrel_Dosage_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_Clopidogrel_Dosage_Time: new FormControl({value: ClopidogrelTime || null, disabled: true}),
                  Medication_In_Hospital_Prasugrel: new FormControl({value: MedicationData.Medication_In_Hospital_Prasugrel || null, disabled: true}),
                  Medication_In_Hospital_Prasugrel_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_Prasugrel_Dosage || null, disabled: true}),
                  Medication_In_Hospital_Prasugrel_Dosage_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_Prasugrel_Dosage_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_Prasugrel_Dosage_Time: new FormControl({value: PrasugrelTime || null, disabled: true}),
                  Medication_In_Hospital_Ticagrelor: new FormControl({value: MedicationData.Medication_In_Hospital_Ticagrelor || null, disabled: true}),
                  Medication_In_Hospital_Ticagrelor_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_Ticagrelor_Dosage || null, disabled: true}),
                  Medication_In_Hospital_Ticagrelor_Dosage_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_Ticagrelor_Dosage_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_Ticagrelor_Dosage_Time: new FormControl({value: TicagrelorTime || null, disabled: true}),
                  Medication_In_Hospital_IIbIIIa_inhibitor: new FormControl({value: MedicationData.Medication_In_Hospital_IIbIIIa_inhibitor || null, disabled: true}),
                  Medication_In_Hospital_IIbIIIa_inhibitor_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_IIbIIIa_inhibitor_Dosage || null, disabled: true}),
                  Medication_In_Hospital_IIbIIIa_inhibitor_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_IIbIIIa_inhibitor_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_IIbIIIa_inhibitor_Time: new FormControl({value: IIbIIIa_inhibitorTime || null, disabled: true}),
                  Medication_In_Hospital_Inotrope: new FormControl({value: MedicationData.Medication_In_Hospital_Inotrope || null, disabled: true}),
                  Medication_In_Hospital_Inotrope_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_Inotrope_Dosage || null, disabled: true}),
                  Medication_In_Hospital_Inotrope_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_Inotrope_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_Inotrope_Time: new FormControl({value: InotropeTime || null, disabled: true}),
						Medication_In_Hospital_Enoxaparin: new FormControl({value: MedicationData.Medication_In_Hospital_Enoxaparin || null, disabled: true}),
                  Medication_In_Hospital_Enoxaparin_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_Enoxaparin_Dosage || null, disabled: true}),
                  Medication_In_Hospital_Enoxaparin_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_Enoxaparin_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_Enoxaparin_Time: new FormControl({value: EnoxaparinTime || null, disabled: true}),
                  Medication_In_Hospital_UnFractionated_Heparin: new FormControl({value: MedicationData.Medication_In_Hospital_UnFractionated_Heparin || null, disabled: true}),
                  Medication_In_Hospital_UnFractionated_Heparin_Route: new FormControl({value: MedicationData.Medication_In_Hospital_UnFractionated_Heparin_Route || null, disabled: true}),
                  Medication_In_Hospital_UnFractionated_Heparin_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_UnFractionated_Heparin_Dosage || null, disabled: true}),
                  Medication_In_Hospital_UnFractionated_Heparin_Dosage_Units: new FormControl({value: MedicationData.Medication_In_Hospital_UnFractionated_Heparin_Dosage_Units || null, disabled: true}),
                  Medication_In_Hospital_UnFractionated_Heparin_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_UnFractionated_Heparin_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_UnFractionated_Heparin_Time: new FormControl({value: UnFractionatedHeparinTime || null, disabled: true}),
                  Medication_In_Hospital_LMW_Heparin: new FormControl({value: MedicationData.Medication_In_Hospital_LMW_Heparin || null, disabled: true}),
                  Medication_In_Hospital_LMW_Heparin_Route: new FormControl({value: MedicationData.Medication_In_Hospital_LMW_Heparin_Route || null, disabled: true}),
                  Medication_In_Hospital_LMW_Heparin_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_LMW_Heparin_Dosage || null, disabled: true}),
                  Medication_In_Hospital_LMW_Heparin_Dosage_Units: new FormControl({value: MedicationData.Medication_In_Hospital_LMW_Heparin_Dosage_Units || null, disabled: true}),
                  Medication_In_Hospital_LMW_Heparin_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_LMW_Heparin_Date_Time || null, disabled: true}),
                  Medication_In_Hospital_LMW_Heparin_Time: new FormControl({value: LMWHeparinTime || null, disabled: true}),
						Medication_In_Hospital_Fondaparinux: new FormControl({value: MedicationData.Medication_In_Hospital_Fondaparinux || null, disabled: true}),
						Medication_In_Hospital_Fondaparinux_Route: new FormControl({value: MedicationData.Medication_In_Hospital_Fondaparinux_Route || null, disabled: true}),
						Medication_In_Hospital_Fondaparinux_Dosage: new FormControl({value: MedicationData.Medication_In_Hospital_Fondaparinux_Dosage || null, disabled: true}),
						Medication_In_Hospital_Fondaparinux_Dosage_Units: new FormControl({value: MedicationData.Medication_In_Hospital_Fondaparinux_Dosage_Units || null, disabled: true}),
						Medication_In_Hospital_Fondaparinux_Date_Time: new FormControl({value: MedicationData.Medication_In_Hospital_Fondaparinux_Date_Time || null, disabled: true}),
						Medication_In_Hospital_Fondaparinux_Time: new FormControl({value: FondaparinuxTime || null, disabled: true}),
                  Medication_In_Hospital_N_Saline: new FormControl({value: MedicationData.Medication_In_Hospital_N_Saline || null, disabled: true}),
                  Medication_In_Hospital_Morphine: new FormControl({value: MedicationData.Medication_In_Hospital_Morphine || null, disabled: true}),
                  Medication_In_Hospital_Atropine: new FormControl({value: MedicationData.Medication_In_Hospital_Atropine || null, disabled: true}),

                  OtherMedicationArray: NewFArray,
                  EditActivate: new FormControl({value: false, disabled: true}),
               });
               const FArray = this.HistoryFGroup.controls.MedicationHistory as FormArray;
               FArray.push(FGroup);
            }
         });
      }
      // Autofill MedicationPriorToThrombolysis Data
      let HospitalSummaryMedicationExist = false;
      if (PatientData.length > 0) {
        const Idx = PatientData.findIndex(obj => obj.Hospital._id === this.InitialHospital);
        if (Idx >= 0) {
         HospitalSummaryMedicationExist = true;
        }
      }
      if (!HospitalSummaryMedicationExist && this.IfThrombolysis && this.ThrombolysisData.Thrombolysis === 'Yes' && this.ThrombolysisData.Hospital === this.InitialHospital) {
         this.AllFieldsValues.map((obj, i) => {
            if (obj.Sub_Category === 'Medication_in_Hospital' && this.MedicationPriorToThrombolysisData !== null) {
               if (obj.Key_Name === 'Medication_In_Hospital_Aspirin') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Aspirin'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Aspirin'] || null;
               }
               if (obj.Key_Name === 'Medication_In_Hospital_Aspirin_Dosage') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Aspirin_Dosage'] || '' + this.FindUnitName(this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Aspirin_Dosage_Units']);
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Aspirin_Dosage'] || '' + this.FindUnitName(this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Aspirin_Dosage_Units']);
               }
               if (obj.Key_Name === 'Medication_In_Hospital_Aspirin_Dosage_Date_Time') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Aspirin_Date_Time'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Aspirin_Date_Time'] || null;
               }
               if (obj.Key_Name === 'Medication_In_Hospital_Clopidogrel') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Clopidogrel'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Clopidogrel'] || null;
               }
               if (obj.Key_Name === 'Medication_In_Hospital_Clopidogrel_Dosage') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Clopidogrel_Dosage'] || '' + this.FindUnitName(this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Clopidogrel_Dosage_Units']);
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Clopidogrel_Dosage'] || '' + this.FindUnitName(this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Clopidogrel_Dosage_Units']);
               }
               if (obj.Key_Name === 'Medication_In_Hospital_Clopidogrel_Dosage_Date_Time') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Clopidogrel_Dosage_Date_Time'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Clopidogrel_Dosage_Date_Time'] || null;
               }
               if (obj.Key_Name === 'Medication_In_Hospital_Ticagrelor') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Ticagrelor'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Ticagrelor'] || null;
               }
               if (obj.Key_Name === 'Medication_In_Hospital_Ticagrelor_Dosage') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Ticagrelor_Dosage'] || '' + this.FindUnitName(this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Ticagrelor_Dosage_Units']);
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Ticagrelor_Dosage'] || '' + this.FindUnitName(this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Ticagrelor_Dosage_Units']);
               }
               if (obj.Key_Name === 'Medication_In_Hospital_Ticagrelor_Dosage_Date_Time') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Ticagrelor_Dosage_Units_Date_Time'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_Ticagrelor_Dosage_Units_Date_Time'] || null;
               }
               if (obj.Key_Name === 'Medication_In_Hospital_UnFractionated_Heparin') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Unfractionated_Heparin'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Unfractionated_Heparin'] || null;
               }
               if (obj.Key_Name === 'Medication_In_Hospital_UnFractionated_Heparin_Dosage') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Unfractionated_Heparin_Dosage'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Unfractionated_Heparin_Dosage'] || null;
               }
               if (obj.Key_Name === 'Medication_In_Hospital_UnFractionated_Heparin_Dosage_Units') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Unfractionated_Heparin_Dosage_Units'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Unfractionated_Heparin_Dosage_Units'] || null;
               }
               if (obj.Key_Name === 'Medication_In_Hospital_UnFractionated_Heparin_Date_Time') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Unfractionated_Heparin_Dosage_Date_Time'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Unfractionated_Heparin_Dosage_Date_Time'] || null;
               }
               if (obj.Key_Name === 'Medication_In_Hospital_LMW_Heparin') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_LMW_Heparin'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_LMW_Heparin'] || null;
               }
               if (obj.Key_Name === 'Medication_In_Hospital_LMW_Heparin_Dosage') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_LMW_Heparin_Dosage'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_LMW_Heparin_Dosage'] || null;
               }
               if (obj.Key_Name === 'Medication_In_Hospital_LMW_Heparin_Dosage_Units') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_LMW_Heparin_Dosage_Units'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_LMW_Heparin_Dosage_Units'] || null;
               }
               if (obj.Key_Name === 'Medication_In_Hospital_LMW_Heparin_Date_Time') {
                  this.AllFieldsValues[i].CurrentValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_LMW_Heparin_Dosage_Date_Time'] || null;
                  this.AllFieldsValues[i].DefaultValue = this.MedicationPriorToThrombolysisData['Medication_Prior_to_Thrombolysis_LMW_Heparin_Dosage_Date_Time'] || null;
               }
            }
         });
      }
   } else if (From === 'AdverseEvents') {
      // Editable Form Group
      let FieldDisabled = false;
      if (this.UserInfo.User_Type === 'PU') {
         const FilterArr = PatientData.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id && i < (PatientData.length - 1) );
         FieldDisabled = FilterArr.length > 0 ? true : FieldDisabled;
      } else if (this.PatientInfo.TransferBending) {
         FieldDisabled = true;
      }

      let ReceivableHospital = true;
      if (this.PatientInfo.TransferBending && this.UserInfo.User_Type === 'PU') {
         const CheckExisting = this.PatientInfo.Hospital_History.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id);
         ReceivableHospital = CheckExisting.length === 0 ? true : false;
      } else {
         ReceivableHospital = false;
      }
      if (ReceivableHospital) {
         this.ReadonlyPage = true;
      }

      if (FieldDisabled) {
         this.AllFieldsValues.map((obj, i) => {
            if (obj.Sub_Junior_Category === 'Adverse_Events') {
               this.AllFieldsValues[i].Disabled = true;
            }
         });
      }
      if (PatientData.length > 0) {
         const MedicationKeys = Object.keys(PatientData[PatientData.length - 1]);
         if (PatientData[PatientData.length - 1].Hospital._id === this.InitialHospital && !ReceivableHospital) {
            this.AllFieldsValues.map((obj, i) => {
               if (MedicationKeys.includes(obj.Key_Name)) {
                  this.AllFieldsValues[i].CurrentValue = PatientData[PatientData.length - 1][obj.Key_Name];
                  this.AllFieldsValues[i].DefaultValue = PatientData[PatientData.length - 1][obj.Key_Name];
               }
            });
            if (PatientData[PatientData.length - 1].OtherMedicationArrayAdverseEvent && PatientData[PatientData.length - 1].OtherMedicationArrayAdverseEvent !== null && PatientData[PatientData.length - 1].OtherMedicationArrayAdverseEvent.length > 0 ) {
               this.OtherMedicationDataAdverseEvent = PatientData[PatientData.length - 1].OtherMedicationArrayAdverseEvent;
            }
         }
      }
      // ReadOnly Form Group
      if (this.PatientInfo.Hospital_History.length > 1 || (this.UserInfo.User_Type === 'PU' && this.PatientInfo.TransferBending && this.PatientInfo.TransferBendingTo._id === this.UserInfo.Hospital._id)) {
         this.AdverseEventsHistoryAvailable = true;
         const arr = this.HistoryFGroup.controls['AdverseEventsHistory'] as FormArray;
         while (0 !== arr.length) { arr.removeAt(0); }
         this.PatientInfo.Hospital_History.map(obj => {
            if (obj.Hospital.Hospital_Role !== 'EMS' && (obj.Hospital._id !== this.InitialHospital || (this.UserInfo.User_Type === 'PU' && this.PatientInfo.TransferBending && this.PatientInfo.TransferBendingTo._id === this.UserInfo.Hospital._id))) {
               const Arr = PatientData.filter(obj1 => obj1.Hospital._id === obj.Hospital._id);
               const MedicationData =  Arr.length > 0 ? Arr[0] : {};
               const Key = obj.Hospital.Hospital_Role === 'EMS' ? 'E' : obj.Hospital.Hospital_Role.slice(0, 1) + obj.Hospital.Hospital_Role.slice(-1);
               const OtherMedication = Object.keys(MedicationData).length > 0 ? MedicationData.OtherMedicationArrayAdverseEvent : [];
               const NewFArray = new FormArray([]);
               if (OtherMedication.length > 0) {
                  OtherMedication.map(OBJ => {
                     const NewFGroup = new FormGroup({
                        Adverse_Events_Others: new FormControl({value: OBJ.Adverse_Events_Others, disabled: true}),
                     });
                     NewFArray.push(NewFGroup);
                  });
               }
               let AnginaTime = null;
               if (MedicationData.Adverse_Events_Recurrence_Of_Angina_Date && MedicationData.Adverse_Events_Recurrence_Of_Angina_Date !== null && MedicationData.Adverse_Events_Recurrence_Of_Angina_Date !== '') {
                  const DateTime = new Date(MedicationData.Adverse_Events_Recurrence_Of_Angina_Date);
                  AnginaTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let infarctionTime = null;
               if (MedicationData.Adverse_Events_Re_infarction_Date && MedicationData.Adverse_Events_Re_infarction_Date !== null && MedicationData.Adverse_Events_Re_infarction_Date !== '') {
                  const DateTime = new Date(MedicationData.Adverse_Events_Re_infarction_Date);
                  infarctionTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let RepeatPciTime = null;
               if (MedicationData.Adverse_Events_Repeat_Pci_Date && MedicationData.Adverse_Events_Repeat_Pci_Date !== null && MedicationData.Adverse_Events_Repeat_Pci_Date !== '') {
                  const DateTime = new Date(MedicationData.Adverse_Events_Repeat_Pci_Date);
                  RepeatPciTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let CabgTime = null;
               if (MedicationData.Adverse_Events_Repeat_Cabg_Date && MedicationData.Adverse_Events_Repeat_Cabg_Date !== null && MedicationData.Adverse_Events_Repeat_Cabg_Date !== '') {
                  const DateTime = new Date(MedicationData.Adverse_Events_Repeat_Cabg_Date);
                  CabgTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let StrokeTime = null;
               if (MedicationData.Adverse_Events_Stroke_Date && MedicationData.Adverse_Events_Stroke_Date !== null && MedicationData.Adverse_Events_Stroke_Date !== '') {
                  const DateTime = new Date(MedicationData.Adverse_Events_Stroke_Date);
                  StrokeTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let CardiogenicShockTime = null;
               if (MedicationData.Adverse_Events_Cardiogenic_Shock_Date && MedicationData.Adverse_Events_Cardiogenic_Shock_Date !== null && MedicationData.Adverse_Events_Cardiogenic_Shock_Date !== '') {
                  const DateTime = new Date(MedicationData.Adverse_Events_Cardiogenic_Shock_Date);
                  CardiogenicShockTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let HemorrhageTime = null;
               if (MedicationData.Adverse_Events_Hemorrhage_Date && MedicationData.Adverse_Events_Hemorrhage_Date !== null && MedicationData.Adverse_Events_Hemorrhage_Date !== '') {
                  const DateTime = new Date(MedicationData.Adverse_Events_Hemorrhage_Date);
                  HemorrhageTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let MajorBleedTime = null;
               if (MedicationData.Adverse_Events_Major_Bleed_Date && MedicationData.Adverse_Events_Major_Bleed_Date !== null && MedicationData.Adverse_Events_Major_Bleed_Date !== '') {
                  const DateTime = new Date(MedicationData.Adverse_Events_Major_Bleed_Date);
                  MajorBleedTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let MinorBleedTime = null;
               if (MedicationData.Adverse_Events_Minor_Bleed_Date && MedicationData.Adverse_Events_Minor_Bleed_Date !== null && MedicationData.Adverse_Events_Minor_Bleed_Date !== '') {
                  const DateTime = new Date(MedicationData.Adverse_Events_Minor_Bleed_Date);
                  MinorBleedTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
					let DeathTime = null;
               if (MedicationData.Adverse_Events_Death_Date_Time && MedicationData.Adverse_Events_Death_Date_Time !== null && MedicationData.Adverse_Events_Death_Date_Time !== '') {
                  const DateTime = new Date(MedicationData.Adverse_Events_Death_Date_Time);
                  DeathTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               const FGroup = new FormGroup({
                  Patient: new FormControl({value: this.PatientInfo._id, disabled: true}),
                  _id: new FormControl({value: MedicationData._id || null, disabled: true}),
                  Hospital: new FormControl({value: obj.Hospital._id, disabled: true}),
                  Hospital_Role: new FormControl({value: obj.Hospital.Hospital_Role, disabled: true}),
                  Hospital_Key: new FormControl({value: Key, disabled: true}),
                  HistoryActive: new FormControl({value: false, disabled: true}),
                  Adverse_Events_Primary_Reperfusion_therapy: new FormControl({value: MedicationData.Adverse_Events_Primary_Reperfusion_therapy || null, disabled: true}),
                  Adverse_Events_Reperfusion_Late_presentation: new FormControl({value: MedicationData.Adverse_Events_Reperfusion_Late_presentation || null, disabled: true}),
                  Adverse_Events_Reperfusion_Other: new FormControl({value: MedicationData.Adverse_Events_Reperfusion_Other || null, disabled: true}),
                  Adverse_Events_Reperfusion_Specify_Other: new FormControl({value: MedicationData.Adverse_Events_Reperfusion_Specify_Other || '', disabled: true}),
                  Adverse_Events_Recurrence_Of_Angina: new FormControl({value: MedicationData.Adverse_Events_Recurrence_Of_Angina || null, disabled: true}),
                  Adverse_Events_Recurrence_Of_Angina_Date: new FormControl({value: MedicationData.Adverse_Events_Recurrence_Of_Angina_Date || null, disabled: true}),
                  Adverse_Events_Recurrence_Of_Angina_Time: new FormControl({value: AnginaTime || null, disabled: true}),
                  Adverse_Events_Re_infarction: new FormControl({value: MedicationData.Adverse_Events_Re_infarction || null, disabled: true}),
                  Adverse_Events_Location_Of_Re_infarction: new FormControl({value: MedicationData.Adverse_Events_Location_Of_Re_infarction || null, disabled: true}),
                  Adverse_Events_Re_infarction_Date: new FormControl({value: MedicationData.Adverse_Events_Re_infarction_Date || null, disabled: true}),
                  Adverse_Events_Re_infarction_Time: new FormControl({value: infarctionTime || null, disabled: true}),
                  Adverse_Events_Repeat_Pci: new FormControl({value: MedicationData.Adverse_Events_Repeat_Pci || null, disabled: true}),
                  Adverse_Events_Repeat_Pci_Date: new FormControl({value: MedicationData.Adverse_Events_Repeat_Pci_Date || null, disabled: true}),
                  Adverse_Events_Repeat_Pci_Time: new FormControl({value: RepeatPciTime || null, disabled: true}),
                  Adverse_Events_Repeat_Cabg: new FormControl({value: MedicationData.Adverse_Events_Repeat_Cabg || null, disabled: true}),
                  Adverse_Events_Repeat_Cabg_Date: new FormControl({value: MedicationData.Adverse_Events_Repeat_Cabg_Date || null, disabled: true}),
                  Adverse_Events_Repeat_Cabg_Time: new FormControl({value: CabgTime || null, disabled: true}),
                  Adverse_Events_Stroke: new FormControl({value: MedicationData.Adverse_Events_Stroke || null, disabled: true}),
                  Adverse_Events_Stroke_Date: new FormControl({value: MedicationData.Adverse_Events_Stroke_Date || null, disabled: true}),
                  Adverse_Events_Stroke_Time: new FormControl({value: StrokeTime || null, disabled: true}),
                  Adverse_Events_Cardiogenic_Shock: new FormControl({value: MedicationData.Adverse_Events_Cardiogenic_Shock || null, disabled: true}),
                  Adverse_Events_Cardiogenic_Shock_Date: new FormControl({value: MedicationData.Adverse_Events_Cardiogenic_Shock_Date || null, disabled: true}),
                  Adverse_Events_Cardiogenic_Shock_Time: new FormControl({value: CardiogenicShockTime || null, disabled: true}),
                  Adverse_Events_Hemorrhage: new FormControl({value: MedicationData.Adverse_Events_Hemorrhage || null, disabled: true}),
                  Adverse_Events_Hemorrhage_Date: new FormControl({value: MedicationData.Adverse_Events_Hemorrhage_Date || null, disabled: true}),
                  Adverse_Events_Hemorrhage_Time: new FormControl({value: HemorrhageTime || null, disabled: true}),
                  Adverse_Events_Major_Bleed: new FormControl({value: MedicationData.Adverse_Events_Major_Bleed || null, disabled: true}),
                  Adverse_Events_Major_Bleed_Date: new FormControl({value: MedicationData.Adverse_Events_Major_Bleed_Date || null, disabled: true}),
                  Adverse_Events_Major_Bleed_Time: new FormControl({value: MajorBleedTime || null, disabled: true}),
                  Adverse_Events_Minor_Bleed: new FormControl({value: MedicationData.Adverse_Events_Minor_Bleed || null, disabled: true}),
                  Adverse_Events_Minor_Bleed_Date: new FormControl({value: MedicationData.Adverse_Events_Minor_Bleed_Date || null, disabled: true}),
                  Adverse_Events_Minor_Bleed_Time: new FormControl({value: MinorBleedTime || null, disabled: true}),
						Adverse_Events_Death_Date_Time: new FormControl({value: MedicationData.Adverse_Events_Death_Date_Time || null, disabled: true}),
                  Adverse_Events_Death_Time: new FormControl({value: DeathTime || null, disabled: true}),
                  Adverse_Events_In_stent_thrombosis: new FormControl({value: MedicationData.Adverse_Events_In_stent_thrombosis || null, disabled: true}),
						Adverse_Events_Prolonged_Admission_Beyond30Days: new FormControl({value: MedicationData.Adverse_Events_Prolonged_Admission_Beyond30Days || null, disabled: true}),
                  Adverse_Events_Death: new FormControl({value: MedicationData.Adverse_Events_Death || null, disabled: true}),
                  OtherMedicationArrayAdverseEvent: NewFArray,
                  EditActivate: new FormControl({value: false, disabled: true}),
               });
               const FArray = this.HistoryFGroup.controls.AdverseEventsHistory as FormArray;
               FArray.push(FGroup);
            }
         });
      }
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
      } else {
         this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
            this.router.navigate(['/Patient-Manage/Discharge-Transfer', this.UrlParams.Patient])
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

GetFormControlErrorMessage(KeyName: any, Index?: any) {
   let FControl: FormControl;
   if (this.OtherMedicationArrayFields.includes(KeyName)) {
      const FArray = this.DynamicFGroup.get('OtherMedicationArray') as FormArray;
      const FGroup = FArray.controls[Index] as FormGroup;
      FControl = FGroup.get(KeyName) as FormControl;
   } else if (KeyName === 'Adverse_Events_Others') {
      const FArray = this.DynamicFGroup.get('OtherMedicationArrayAdverseEvent') as FormArray;
      const FGroup = FArray.controls[Index] as FormGroup;
      FControl = FGroup.get(KeyName) as FormControl;
   } else {
      FControl = this.DynamicFGroup.get(KeyName) as FormControl;
   }
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
               const NewIndex = this.AllValidations.findIndex(objNew => (objNew.Name.trim().split(' ').join('')) === obj);
               if (NewIndex > -1) {
                  returnText = this.AllValidations[NewIndex].Error_Message;
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
GetHistoryFormControlErrorMessage(formArray: any, index: any, KeyName: any, Index?: any) {
   let FControl: FormControl;
   const FArray = this.HistoryFGroup.get(formArray) as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;

   if (this.OtherMedicationArrayFields.includes(KeyName)) {
      const FArrayNew = FGroup.get('OtherMedicationArray') as FormArray;
      const FGroupNew = FArrayNew.controls[Index] as FormGroup;
      FControl = FGroupNew.get(KeyName) as FormControl;
   } else if (KeyName === 'Adverse_Events_Others') {
      const FArrayNew = FGroup.get('OtherMedicationArrayAdverseEvent') as FormArray;
      const FGroupNew = FArrayNew.controls[Index] as FormGroup;
      FControl = FGroupNew.get(KeyName) as FormControl;
   } else {
      FControl = FGroup.get(KeyName) as FormControl;
   }
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
      if (this.TabsList[this.CurrentTabIndex] === 'Lab_Report' && this.LabReportId !== null) {
         this.DynamicFGroup.addControl('LabReportId', new FormControl(this.LabReportId, Validators.required ));
      }
      if (this.TabsList[this.CurrentTabIndex] === 'Medication_in_Hospital' && this.MedicationHospitalId !== null) {
         this.DynamicFGroup.addControl('MedicationHospitalId', new FormControl(this.MedicationHospitalId, Validators.required ));
      }
      if (this.TabsList[this.CurrentTabIndex] === 'Adverse_Events' && this.EventsId !== null) {
         this.DynamicFGroup.addControl('EventsId', new FormControl(this.EventsId, Validators.required ));
      }
      BasicDetailsFields.map(obj => {
         let FormControlValidation = null;
         if (obj.Mandatory || obj.Validation) {
            FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
         }
         if (!this.OtherMedicationArrayFields.includes(obj.Key_Name) && obj.Key_Name !== 'Adverse_Events_Others') {
            this.DynamicFGroup.addControl(obj.Key_Name, new FormControl({value: obj.CurrentValue, disabled: obj.Disabled}, FormControlValidation ));
         }
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
         // Medication In Hospital
         if (obj.Key_Name === 'Medication_In_Hospital_Nitroglycerin_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_Nitroglycerin_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_Nitroglycerin_Date_Time';
            NewObj.Name = 'Medication In Hospital Nitroglycerin Time';
            NewObj.Key_Name = 'Medication_In_Hospital_Nitroglycerin_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_Nitroglycerin_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Medication_In_Hospital_Dopamine_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_Dopamine_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_Dopamine_Date_Time';
            NewObj.Name = 'Medication In Hospital Dopamine Time';
            NewObj.Key_Name = 'Medication_In_Hospital_Dopamine_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_Dopamine_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Medication_In_Hospital_Dobutamine_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_Dobutamine_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_Dobutamine_Date_Time';
            NewObj.Name = 'Medication In Hospital Dobutamine Time';
            NewObj.Key_Name = 'Medication_In_Hospital_Dobutamine_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_Dobutamine_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Medication_In_Hospital_Adrenaline_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_Adrenaline_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_Adrenaline_Date_Time';
            NewObj.Name = 'Medication In Hospital Adrenaline Time';
            NewObj.Key_Name = 'Medication_In_Hospital_Adrenaline_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_Adrenaline_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Medication_In_Hospital_Nor_Aadrenaline_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_Nor_Aadrenaline_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_Nor_Aadrenaline_Date_Time';
            NewObj.Name = 'Medication In Hospital Nor Aadrenaline Time';
            NewObj.Key_Name = 'Medication_In_Hospital_Nor_Aadrenaline_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_Nor_Aadrenaline_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Medication_In_Hospital_Other_Medicine_Dosage_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_Other_Medicine_Dosage_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_Other_Medicine_Dosage_Date_Time';
            NewObj.Name = 'Medication In Hospital Other Medicine Dosage Time';
            NewObj.Key_Name = 'Medication_In_Hospital_Other_Medicine_Dosage_Time';
            this.AllFieldsValues.push(NewObj);
         }
         // Medication Transportation
         if (obj.Key_Name === 'Medication_In_Hospital_Aspirin_Dosage_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_Aspirin_Dosage_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_Aspirin_Dosage_Date_Time';
            NewObj.Name = 'Transportation Medication Aspirin Dosage Time';
            NewObj.Key_Name = 'Medication_In_Hospital_Aspirin_Dosage_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_Aspirin_Dosage_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
         }
         if (obj.Key_Name === 'Medication_In_Hospital_Clopidogrel_Dosage_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_Clopidogrel_Dosage_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_Clopidogrel_Dosage_Date_Time';
            NewObj.Name = 'Transportation Medication Clopidogrel Dosage Time';
            NewObj.Key_Name = 'Medication_In_Hospital_Clopidogrel_Dosage_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_Clopidogrel_Dosage_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
         }
         if (obj.Key_Name === 'Medication_In_Hospital_Prasugrel_Dosage_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_Prasugrel_Dosage_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_Prasugrel_Dosage_Date_Time';
            NewObj.Name = 'Transportation Medication Prasugrel Dosage Time';
            NewObj.Key_Name = 'Medication_In_Hospital_Prasugrel_Dosage_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_Prasugrel_Dosage_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
         }
         if (obj.Key_Name === 'Medication_In_Hospital_Ticagrelor_Dosage_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_Ticagrelor_Dosage_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_Ticagrelor_Dosage_Date_Time';
            NewObj.Name = 'Transportation Medication Ticagrelor Dosage Time';
            NewObj.Key_Name = 'Medication_In_Hospital_Ticagrelor_Dosage_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_Ticagrelor_Dosage_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
         }
         if (obj.Key_Name === 'Medication_In_Hospital_IIbIIIa_inhibitor_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_IIbIIIa_inhibitor_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_IIbIIIa_inhibitor_Date_Time';
            NewObj.Name = 'Transportation Medication IbIIIa inhibitor Time';
            NewObj.Key_Name = 'Medication_In_Hospital_IIbIIIa_inhibitor_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_IIbIIIa_inhibitor_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
         }
         if (obj.Key_Name === 'Medication_In_Hospital_Inotrope_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_Inotrope_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_Inotrope_Date_Time';
            NewObj.Name = 'Transportation Medication Inotrope Time';
            NewObj.Key_Name = 'Medication_In_Hospital_Inotrope_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_Inotrope_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
         }
			if (obj.Key_Name === 'Medication_In_Hospital_Enoxaparin_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_Enoxaparin_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_Enoxaparin_Date_Time';
            NewObj.Name = 'Transportation Medication Enoxaparin Time';
            NewObj.Key_Name = 'Medication_In_Hospital_Enoxaparin_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_Enoxaparin_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
         }
         if (obj.Key_Name === 'Medication_In_Hospital_UnFractionated_Heparin_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_UnFractionated_Heparin_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_UnFractionated_Heparin_Date_Time';
            NewObj.Name = 'Transportation Medication UnFractionated Heparin Time';
            NewObj.Key_Name = 'Medication_In_Hospital_UnFractionated_Heparin_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_UnFractionated_Heparin_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
         }
         if (obj.Key_Name === 'Medication_In_Hospital_LMW_Heparin_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_LMW_Heparin_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_LMW_Heparin_Date_Time';
            NewObj.Name = 'Transportation Medication LMW Heparin Time';
            NewObj.Key_Name = 'Medication_In_Hospital_LMW_Heparin_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_LMW_Heparin_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
         }
			if (obj.Key_Name === 'Medication_In_Hospital_Fondaparinux_Date_Time' && !KeyDatabase.includes('Medication_In_Hospital_Fondaparinux_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Medication_In_Hospital_Fondaparinux_Date_Time';
            NewObj.Name = 'Transportation Medication Fondaparinux Time';
            NewObj.Key_Name = 'Medication_In_Hospital_Fondaparinux_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Medication_In_Hospital_Fondaparinux_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
         }
         // Adverse Events
         if (obj.Key_Name === 'Adverse_Events_Recurrence_Of_Angina_Date' && !KeyDatabase.includes('Adverse_Events_Recurrence_Of_Angina_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Adverse_Events_Recurrence_Of_Angina_Date';
            NewObj.Name = 'Adverse Events Recurrence Of Angina Time';
            NewObj.Key_Name = 'Adverse_Events_Recurrence_Of_Angina_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Adverse_Events_Recurrence_Of_Angina_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Adverse_Events_Re_infarction_Date' && !KeyDatabase.includes('Adverse_Events_Re_infarction_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Adverse_Events_Re_infarction_Date';
            NewObj.Name = 'Adverse Events Re infarction Time';
            NewObj.Key_Name = 'Adverse_Events_Re_infarction_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Adverse_Events_Re_infarction_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Adverse_Events_Repeat_Pci_Date' && !KeyDatabase.includes('Adverse_Events_Repeat_Pci_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Adverse_Events_Repeat_Pci_Date';
            NewObj.Name = 'Adverse Events Repeat Pci Time';
            NewObj.Key_Name = 'Adverse_Events_Repeat_Pci_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Adverse_Events_Repeat_Pci_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Adverse_Events_Repeat_Cabg_Date' && !KeyDatabase.includes('Adverse_Events_Repeat_Cabg_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Adverse_Events_Repeat_Cabg_Date';
            NewObj.Name = 'Adverse Events Repeat Cabg Time';
            NewObj.Key_Name = 'Adverse_Events_Repeat_Cabg_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Adverse_Events_Repeat_Cabg_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Adverse_Events_Stroke_Date' && !KeyDatabase.includes('Adverse_Events_Stroke_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Adverse_Events_Stroke_Date';
            NewObj.Name = 'Adverse Events Stroke Time';
            NewObj.Key_Name = 'Adverse_Events_Stroke_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Adverse_Events_Stroke_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Adverse_Events_Cardiogenic_Shock_Date' && !KeyDatabase.includes('Adverse_Events_Cardiogenic_Shock_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Adverse_Events_Cardiogenic_Shock_Date';
            NewObj.Name = 'Adverse Events Cardiogenic Shock Time';
            NewObj.Key_Name = 'Adverse_Events_Cardiogenic_Shock_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Adverse_Events_Cardiogenic_Shock_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Adverse_Events_Hemorrhage_Date' && !KeyDatabase.includes('Adverse_Events_Hemorrhage_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Adverse_Events_Hemorrhage_Date';
            NewObj.Name = 'Adverse Events Hemorrhage Time';
            NewObj.Key_Name = 'Adverse_Events_Hemorrhage_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Adverse_Events_Hemorrhage_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Adverse_Events_Major_Bleed_Date' && !KeyDatabase.includes('Adverse_Events_Major_Bleed_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Adverse_Events_Major_Bleed_Date';
            NewObj.Name = 'Adverse Events Major Bleed Time';
            NewObj.Key_Name = 'Adverse_Events_Major_Bleed_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Adverse_Events_Major_Bleed_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Adverse_Events_Minor_Bleed_Date' && !KeyDatabase.includes('Adverse_Events_Minor_Bleed_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Adverse_Events_Minor_Bleed_Date';
            NewObj.Name = 'Adverse Events Minor Bleed Time';
            NewObj.Key_Name = 'Adverse_Events_Minor_Bleed_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Adverse_Events_Minor_Bleed_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
			if (obj.Key_Name === 'Adverse_Events_Death_Date_Time' && !KeyDatabase.includes('Adverse_Events_Death_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Adverse_Events_Death_Date_Time';
            NewObj.Name = 'Adverse Events Death Time';
            NewObj.Key_Name = 'Adverse_Events_Death_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Adverse_Events_Death_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
      });
      if (this.TabsList[this.CurrentTabIndex] === 'Medication_in_Hospital') {
         this.DynamicFGroup.addControl('OtherMedicationArray', new FormArray([]));
         if (this.OtherMedicationData.length > 0) {
            this.OtherMedicationArrayDataUpdate();
         }
      }
      if (this.TabsList[this.CurrentTabIndex] === 'Adverse_Events') {
         this.DynamicFGroup.addControl('OtherMedicationArrayAdverseEvent', new FormArray([]));
         if (this.OtherMedicationDataAdverseEvent.length > 0) {
            this.OtherMedicationArrayDataAdverseEventsUpdate();
         }
      }
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

OtherMedicationArrayDataUpdate() {
   const FilteredFields = this.AllFieldsValues.filter(obj => this.OtherMedicationArrayFields.includes(obj.Key_Name));
   this.OtherMedicationData.map(OBJ => {
      const NewFGroup = new FormGroup({});
      FilteredFields.map(obj => {
         let SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
         if (obj.Key_Name === 'Medication_In_Hospital_Other_Medicine_Dosage_Time') {
            if (OBJ['Medication_In_Hospital_Other_Medicine_Dosage_Date_Time'] !== null && OBJ['Medication_In_Hospital_Other_Medicine_Dosage_Date_Time'] !== '') {
               const DateTime = new Date(OBJ['Medication_In_Hospital_Other_Medicine_Dosage_Date_Time']);
               SetValue = DateTime.getHours() + ':' + DateTime.getMinutes();
            }
         } else {
            SetValue = (OBJ[obj.Key_Name] && OBJ[obj.Key_Name] !== null && OBJ[obj.Key_Name] !== '') ? OBJ[obj.Key_Name] : SetValue;
         }
         let FormControlValidation = null;
         if (obj.Mandatory || obj.Validation) {
            FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
         }
         NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
      });
      this.OtherMedicationArray = this.DynamicFGroup.get('OtherMedicationArray') as FormArray;
      this.OtherMedicationArray.push(NewFGroup);
   });
   if (this.OtherMedicationData.length > 0) {
      this.DynamicFArrayValueChangesMonitoring();
   }
}

OtherMedicationArrayDataAdverseEventsUpdate() {
   const FilteredFields = this.AllFieldsValues.filter(obj => obj.Key_Name === 'Adverse_Events_Others');
   this.OtherMedicationDataAdverseEvent.map(OBJ => {
      const NewFGroup = new FormGroup({});
      FilteredFields.map(obj => {
         const SetValue = (OBJ[obj.Key_Name] && OBJ[obj.Key_Name] !== null && OBJ[obj.Key_Name] !== '') ? OBJ[obj.Key_Name] : '';
         let FormControlValidation = null;
         if (obj.Mandatory || obj.Validation) {
            FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
         }
         NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
      });
      this.OtherMedicationArrayAdverseEvent = this.DynamicFGroup.get('OtherMedicationArrayAdverseEvent') as FormArray;
      this.OtherMedicationArrayAdverseEvent.push(NewFGroup);
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
      this.YesOrNoValidations();
   } else {
      this.DynamicFGroup.disable();
   }
}

DynamicFGroupValueChangesMonitoring() {
   let SubscribeLimitControl = [];
   let NewSubscribeLimit = true;
   this.FormLoaded = true;
   let FormControlsArray = Object.keys(this.DynamicFGroup.controls);
   FormControlsArray = FormControlsArray.filter(obj => obj !== 'OtherMedicationArray' && obj !== 'OtherMedicationArrayAdverseEvent');
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
                        MinValue = (MinValue !== null && MinValue !== '') ? new Date(MinValue).valueOf() : null;
                        change = (change !== null && change !== '') ? new Date(change).valueOf() : null ;
                        if (MinValue > change && change !== null && MinValue !== null ) {
                           const ErrorMessage = 'Select the date time should be more than ' + this.AllFieldsValues[MinFieldIndex].Name;
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
                           const ErrorMessage = 'Select the date time should be less than ' + this.AllFieldsValues[MaxFieldIndex].Name;
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
                                 const ErrorMessage = 'Select the date time should be more than ' + this.AllFieldsValues[MinFieldIndex].Name;
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
                                 const ErrorMessage = 'Select the date time should be less than ' + this.AllFieldsValues[MaxFieldIndex].Name;
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
                        SubscribeLimitControl = SubscribeLimitControl.filter(obj1  => !this.OtherMedicationArrayFields.includes(obj1));
                        SubscribeLimitControl = SubscribeLimitControl.filter(obj1  => obj1.Key_Name !== 'Adverse_Events_Others');
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
         if (!this.OtherMedicationArrayFields.includes(obj.Key_Name) && !obj.ThisIsTime &&  obj.Key_Name !== 'Adverse_Events_Others') {
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
         return RestrictionFields.filter(obj3 => !this.OtherMedicationArrayFields.includes(obj3) && obj3 !== 'Adverse_Events_Others');
         // return RestrictionFields;
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


DynamicFArrayValueChangesMonitoring() {
   this.otherMedicineSubscription.unsubscribe();
   this.otherMedicineSubscription = new Subscription();
   const SubscribeLimitControl = [];
   const NewSubscribeLimit = true;
   const FArray = this.DynamicFGroup.get('OtherMedicationArray') as FormArray;
   FArray.controls.map((obj, i) => {
      const FGroup = obj as FormGroup;
      const FGroupKeys = Object.keys(FGroup.controls);
      FGroupKeys.map(controlName => {
         const FControl = FGroup.controls[controlName] as FormControl;
         if (!FControl.disabled) {
            this.otherMedicineSubscription.add(
               FControl.valueChanges.subscribe(change => {
                  const FieldIndex =  this.AllFieldsValues.findIndex(obj1 => obj1.Key_Name === controlName);
                  if (FieldIndex > -1) {
                     // Date Value change update related time ---------
                     if (this.AllFieldsValues[FieldIndex].TimeAvailable) {
                        let RelatedTime = FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).value;
                        FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setErrors(null);
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
                           FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setValue(RelatedTime);
                        } else {
                           FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setValue(RelatedTime, { emitEvent: false });
                        }
                        FGroup.get(controlName).setValue(change, { emitEvent: false });
                     }
                     // Field Value change update  ---------
                     this.AllFieldsValues[FieldIndex].CurrentValue = change;
                     // Time Value change update related date  ---------
                     if (this.AllFieldsValues[FieldIndex].ThisIsTime) {
                        const RelatedDateKeyName = this.AllFieldsValues[FieldIndex].ParentDateKey;
                        FGroup.get(RelatedDateKeyName).updateValueAndValidity();
                     }
                     // Minimum Number Field Restriction  ---------
                     if (this.AllFieldsValues[FieldIndex].If_Min_Number_Field_Restriction) {
                        const MinFieldId = (this.AllFieldsValues[FieldIndex].Min_Number_Field !== null ) ? this.AllFieldsValues[FieldIndex].Min_Number_Field._id : null;
                        if (MinFieldId !== null) {
                           const MinFieldIndex = this.AllFieldsValues.findIndex(obj1 => obj1._id === MinFieldId);
                           let MinValue = this.AllFieldsValues[MinFieldIndex].CurrentValue;
                           MinValue = (MinValue !== null && MinValue !== '') ? +MinValue : 0;
                           change = (change !== null && change !== '') ? +change : 0;
                           if (MinValue >= change && change !== 0 ) {
                              const ErrorMessage = 'Enter the value should be more than ' + this.AllFieldsValues[MinFieldIndex].Name;
                              FControl.setErrors({ MinNumberFiled: {errMsg: ErrorMessage } });
                           }
                        }
                     }
                     // Maximum Number Field Restriction  ---------
                     if (this.AllFieldsValues[FieldIndex].If_Max_Number_Field_Restriction) {
                        const MaxFieldId = (this.AllFieldsValues[FieldIndex].Max_Number_Field !== null ) ? this.AllFieldsValues[FieldIndex].Max_Number_Field._id : null;
                        if (MaxFieldId !== null) {
                           const MaxFieldIndex = this.AllFieldsValues.findIndex(obj1 => obj1._id === MaxFieldId);
                           let MaxValue = this.AllFieldsValues[MaxFieldIndex].CurrentValue;
                           MaxValue = (MaxValue !== null && MaxValue !== '') ? +MaxValue : 0;
                           change = (change !== null && change !== '') ? +change : 0;
                           if (MaxValue <= change && change !== 0 ) {
                              const ErrorMessage = 'Enter the value should be less than ' + this.AllFieldsValues[MaxFieldIndex].Name;
                              FControl.setErrors({ MaxNumberFiled: {errMsg: ErrorMessage } });
                           }
                        }
                     }
                     // Minimum Date Field Restriction  ---------
                     if (this.AllFieldsValues[FieldIndex].If_Min_Date_Restriction) {
                        const MinFieldId = (this.AllFieldsValues[FieldIndex].Min_Date_Field !== null ) ? this.AllFieldsValues[FieldIndex].Min_Date_Field._id : null;
                        if (MinFieldId !== null) {
                           const MinFieldIndex = this.AllFieldsValues.findIndex(obj1 => obj1._id === MinFieldId);
                           let MinValue = this.AllFieldsValues[MinFieldIndex].CurrentValue;
                           MinValue = (MinValue !== null && MinValue !== '') ? new Date(MinValue).valueOf() : null;
                           change = (change !== null && change !== '') ? new Date(change).valueOf() : null ;
                           if (MinValue > change && change !== null && MinValue !== null ) {
                              const ErrorMessage = 'Select the date time should be more than ' + this.AllFieldsValues[MinFieldIndex].Name;
                              FControl.setErrors({ MinDateFiled: {errMsg: ErrorMessage } });
                              if (this.AllFieldsValues[FieldIndex].TimeAvailable) {
                                 FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsTouched();
                                 FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsDirty();
                                 FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setErrors({ MinDateFiled: {errMsg: ErrorMessage } });
                              }
                           }
                        }
                     }
                     // Maximum Date Field Restriction  ---------
                     if (this.AllFieldsValues[FieldIndex].If_Max_Date_Restriction) {
                        const MaxFieldId = (this.AllFieldsValues[FieldIndex].Max_Date_Field !== null ) ? this.AllFieldsValues[FieldIndex].Max_Date_Field._id : null;
                        if (MaxFieldId !== null) {
                           const MaxFieldIndex = this.AllFieldsValues.findIndex(obj1 => obj1._id === MaxFieldId);
                           let MaxValue = this.AllFieldsValues[MaxFieldIndex].CurrentValue;
                           MaxValue = (MaxValue !== null && MaxValue !== '') ? new Date(MaxValue).valueOf() : null;
                           change = (change !== null && change !== '') ? new Date(change).valueOf() : null ;
                           if (MaxValue < change && change !== null && MaxValue !== null ) {
                              const ErrorMessage = 'Select the date time should be less than ' + this.AllFieldsValues[MaxFieldIndex].Name;
                              FControl.setErrors({ MaxDateFiled: {errMsg: ErrorMessage } });
                              if (this.AllFieldsValues[FieldIndex].TimeAvailable) {
                                 FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsTouched();
                                 FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsDirty();
                                 FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setErrors({ MinDateFiled: {errMsg: ErrorMessage } });
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
                                 const MinFieldIndex = this.AllFieldsValues.findIndex(obj1 => obj1._id === MinFieldId);
                                 let MinValue = this.AllFieldsValues[MinFieldIndex].CurrentValue;
                                 MinValue = (MinValue !== null && MinValue !== '') ? new Date(MinValue).valueOf() : null;
                                 change = (change !== null && change !== '') ? new Date(change).valueOf() : null ;
                                 if (MinValue > change && change !== null && MinValue !== null) {
                                    const ErrorMessage = 'Select the date time should be more than ' + this.AllFieldsValues[MinFieldIndex].Name;
                                    FControl.setErrors({ MinDateFiled: {errMsg: ErrorMessage } });
                                    MinDateArrMapOperationBreak = true;
                                    if (this.AllFieldsValues[FieldIndex].TimeAvailable) {
                                       FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsTouched();
                                       FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsDirty();
                                       FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setErrors({ MinDateFiled: {errMsg: ErrorMessage } });
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
                                 const MaxFieldIndex = this.AllFieldsValues.findIndex(obj1 => obj1._id === MaxFieldId);
                                 let MaxValue = this.AllFieldsValues[MaxFieldIndex].CurrentValue;
                                 MaxValue = (MaxValue !== null && MaxValue !== '') ? new Date(MaxValue).valueOf() : null;
                                 change = (change !== null && change !== '') ? new Date(change).valueOf() : null ;
                                 if (MaxValue < change && change !== null && MaxValue !== null ) {
                                    const ErrorMessage = 'Select the date time should be less than ' + this.AllFieldsValues[MaxFieldIndex].Name;
                                    FControl.setErrors({ MaxDateFiled: {errMsg: ErrorMessage } });
                                    MaxDateArrMapOperationBreak = true;
                                    if (this.AllFieldsValues[FieldIndex].TimeAvailable) {
                                       FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsTouched();
                                       FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).markAsDirty();
                                       FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setErrors({ MinDateFiled: {errMsg: ErrorMessage } });
                                    }
                                 }
                              }
                           });
                        }
                     }
                  }
               })
            );
         }
      });
   });
}

GetFormArray(ControlName: any): any[] {
   const FArray = this.DynamicFGroup.get(ControlName) as FormArray;
   return FArray.controls;
}


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
   const Active = FArray.getRawValue()[index].HistoryActive as boolean;
   const FGroup = FArray.controls[index] as FormGroup;
   FGroup.controls.HistoryActive.setValue(!Active);
}


AddArrayControl() {
   const FilteredFields = this.AllFieldsValues.filter(obj => this.OtherMedicationArrayFields.includes(obj.Key_Name));
   const NewFGroup = new FormGroup({});
   FilteredFields.map(obj => {
      const SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
      let FormControlValidation = null;
      if (obj.Mandatory || obj.Validation) {
         FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
      }
      NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
   });
   this.OtherMedicationArray = this.DynamicFGroup.get('OtherMedicationArray') as FormArray;
   this.OtherMedicationArray.push(NewFGroup);
   setTimeout(() => {
      this.DynamicFArrayValueChangesMonitoring();
   }, 100);
}

removeArrayControl(index: any) {
   this.OtherMedicationArray.removeAt(index);
   setTimeout(() => {
      this.DynamicFArrayValueChangesMonitoring();
   }, 100);
}

GetFormArrayAdverseEvents(ControlName: any): any[] {
   const FArray = this.DynamicFGroup.get(ControlName) as FormArray;
   return FArray.controls;
}

AddArrayControlAdverseEvents() {
   const FilteredFields = this.AllFieldsValues.filter(obj => obj.Key_Name === 'Adverse_Events_Others');
   const NewFGroup = new FormGroup({});
   FilteredFields.map(obj => {
      const SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
      let FormControlValidation = null;
      if (obj.Mandatory || obj.Validation) {
         FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
      }
      NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
   });
   this.OtherMedicationArrayAdverseEvent = this.DynamicFGroup.get('OtherMedicationArrayAdverseEvent') as FormArray;
   this.OtherMedicationArrayAdverseEvent.push(NewFGroup);
}

removeArrayControlAdverseEvents(index: any) {
   this.OtherMedicationArrayAdverseEvent.removeAt(index);
}

CheckTimeRelatedDateErrorStatus(DateKey: any, TimeKey: any) {
   if (this.DynamicFGroup.get(DateKey)) {
      return (this.DynamicFGroup.get(DateKey).errors !== null) ? true :
               (this.DynamicFGroup.get(TimeKey).errors !== null) ? true : false;
   } else {
      return (this.DynamicFGroup.get(TimeKey).errors !== null) ? true : false;
   }
}

CheckTimeRelatedDateErrorStatusInArray(DateKey: any, Index: any, TimeKey: any) {
   const FArray = this.DynamicFGroup.get('OtherMedicationArray') as FormArray;
   const FGroup = FArray.controls[Index] as FormGroup;
   if (FGroup.get(DateKey)) {
      return (FGroup.get(DateKey).errors !== null) ? true :
               (FGroup.get(TimeKey).errors !== null) ? true : false;
   } else {
      return (FGroup.get(TimeKey).errors !== null) ? true : false;
   }
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
HistoryDateChangeArray(TimeKey: any, DateKey: any, ArrayKey: any, Index: number, OtherArrayKey: any, OtherIndex: any  ) {
   const FArray = this.HistoryFGroup.get(ArrayKey) as FormArray;
   const FGroup = FArray.controls[Index] as FormGroup;
   const OtherFArray = FGroup.get(OtherArrayKey) as FormArray;
   const OtherFGroup = OtherFArray.controls[OtherIndex] as FormGroup;
   const time = OtherFGroup.get(TimeKey).value;
   const date = OtherFGroup.get(DateKey).value;
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
            OtherFGroup.get(TimeKey).setValue(maxTime);
            OtherFGroup.get(TimeKey).updateValueAndValidity();
         }
      }
   }
}
MaxTimeArray(TimeKey: any, DateKey: any, ArrayKey: any, Index: number ) {
   const FArray = this.DynamicFGroup.get(ArrayKey) as FormArray;
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
      if (FControlName === TimeKey && HistoryCondition === 'false') {
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
MaxTimeHistoryArrayOther(TimeKey: any, DateKey: any, ArrayKey: any, Index: number, OtherArrayKey: any, OtherIndex: any ) {
   const FArray = this.HistoryFGroup.get(ArrayKey) as FormArray;
   const FGroup = FArray.controls[Index] as FormGroup;
   const OtherFArray = FGroup.get(OtherArrayKey) as FormArray;
   const OtherFGroup = OtherFArray.controls[OtherIndex] as FormGroup;
   const time = OtherFGroup.get(TimeKey).value;
   const date = OtherFGroup.get(DateKey).value;
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
      Idx = MinIdx + OtherIndex;
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
      FControl.enable();
      if (fieldIndex >= 0) {
         const validationControl = this.AllFieldsValues[fieldIndex];
         FControl.setValidators(Validators.compose([this.CustomDynamicValidation(validationControl), Validators.min(validationControl.Min_Number_Value), Validators.max(validationControl.Max_Number_Value)]));
      }
   });
   this.YesOrNoValidationsHistory(FGroup);
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
LabOneHistoryUpdate(index: any) {
   this.SecondaryUpdating = true;
   const FArray = this.HistoryFGroup.get('LabOneReportHistory') as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;
   if (FGroup.status === 'VALID') {
      this.HospitalService.LabReportHistory_CardiacUpdate(FGroup.getRawValue()).subscribe(response => {
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
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Lab Report Cardiac Biomarkers Details Successfully Updated!' });
         } else {
            if (response.Message === undefined || response.Message === '' || response.Message === null) {
               response.Message = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
         }
      });
   }
}
LabReportHistoryCreate(index: any, formArray: any) {
   this.SecondaryUpdating = true;
   const FArray = this.HistoryFGroup.get(formArray) as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;
   if (FGroup.status === 'VALID') {
      this.HospitalService.LabReportHistory_Create(FGroup.getRawValue()).subscribe(response => {
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
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Lab Report Details Successfully Updated!' });
         } else {
            if (response.Message === undefined || response.Message === '' || response.Message === null) {
               response.Message = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
         }
      });
   }
}
LabSecondHistoryUpdate(index: any) {
   this.SecondaryUpdating = true;
   const FArray = this.HistoryFGroup.get('LabSecondReportHistory') as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;
   if (FGroup.status === 'VALID') {
      this.HospitalService.LabReportHistory_SerumUpdate(FGroup.getRawValue()).subscribe(response => {
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
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Lab Report Serum Biochemistry Details Successfully Updated!' });
         } else {
            if (response.Message === undefined || response.Message === '' || response.Message === null) {
               response.Message = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
         }
      });
   }
}

MedicationHistoryUpdate(index: any) {
   this.SecondaryUpdating = true;
   const FArray = this.HistoryFGroup.get('MedicationHistory') as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;
   this.UpdateDateTimeInHistory('Other_Medication_in_Hospital', FGroup);
   if (FGroup.status === 'VALID') {
      this.HospitalService.MedicationInHospitalHistory_Update(FGroup.getRawValue()).subscribe(response => {
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
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Medication In Hospital Details Successfully Updated!' });
         } else {
            if (response.Message === undefined || response.Message === '' || response.Message === null) {
               response.Message = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
         }
      });
   }
}
MedicationHistoryCreate(index: any) {
   this.SecondaryUpdating = true;
   const FArray = this.HistoryFGroup.get('MedicationHistory') as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;
   this.UpdateDateTimeInHistory('Other_Medication_in_Hospital', FGroup);
   if (FGroup.status === 'VALID') {
      this.HospitalService.MedicationInHospitalHistory_Create(FGroup.getRawValue()).subscribe(response => {
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
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Medication In Hospital Details Successfully Updated!' });
         } else {
            if (response.Message === undefined || response.Message === '' || response.Message === null) {
               response.Message = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
         }
      });
   }
}
AdverseEventsHistoryUpdate(index: any) {
   this.SecondaryUpdating = true;
   const FArray = this.HistoryFGroup.get('AdverseEventsHistory') as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;
   this.UpdateDateTimeInHistory('Adverse_Events_In_Hospital', FGroup);
   if (FGroup.status === 'VALID') {
      this.HospitalService.AdverseEventsHistory_Update(FGroup.getRawValue()).subscribe(response => {
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
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Adverse Events Details Successfully Updated!' });
         } else {
            if (response.Message === undefined || response.Message === '' || response.Message === null) {
               response.Message = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
         }
      });
   }
}
AdverseEventsHistoryCreate(index: any) {
   this.SecondaryUpdating = true;
   const FArray = this.HistoryFGroup.get('AdverseEventsHistory') as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;
   this.UpdateDateTimeInHistory('Adverse_Events_In_Hospital', FGroup);
   if (FGroup.status === 'VALID') {
      this.HospitalService.AdverseEventsHistory_Create(FGroup.getRawValue()).subscribe(response => {
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
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Adverse Events Details Successfully Updated!' });
         } else {
            if (response.Message === undefined || response.Message === '' || response.Message === null) {
               response.Message = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
         }
      });
   }
}

LabReportSubmit() {
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
      this.HospitalService.HospitalSummaryLabReport_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
         this.FormUploading = false;
         if (response.Status) {
            if (response.Response.length >= 1 ) {
               response.Response.map(obj => {
                  if (obj.Hospital._id === this.InitialHospital) {
                     this.LabReportId = response.Response[response.Response.length - 1]._id;
                  }
               });
            }
            this.PatientUpdateData(response.Response, 'LabReport', false);
            this.TabChangeEvent(1);
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Lab Report Successfully Created!' });
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

LabReportUpdate() {
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
      this.HospitalService.HospitalSummaryLabReport_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
         this.FormUploading = false;
         if (response.Status) {
            this.PatientUpdateData(response.Response, 'LabReport', false);
            this.TabChangeEvent(1);
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Lab Report Successfully Updated!' });
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

MedicationHospitalSubmit() {
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
      this.HospitalService.HospitalSummaryMedicationInHospital_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
         this.FormUploading = false;
         if (response.Status) {
            if (response.Response.length >= 1 ) {
               response.Response.map(obj => {
                  if (obj.Hospital._id === this.InitialHospital) {
                     this.MedicationHospitalId = response.Response[response.Response.length - 1]._id;
                  }
               });
            }
            this.PatientUpdateData(response.Response, 'MedicationInHospital', false);
            this.TabChangeEvent(2);
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Medication In Hospital Successfully Created!' });
         } else {
            if (response.Message === undefined || response.Message === '' || response.Message === null) {
               response.Message = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
         }
      });
   } else {
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         if (obj !== 'OtherMedicationArray') {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         } else {
            const FArray = this.DynamicFGroup.controls[obj] as FormArray;
            FArray.controls.map(objNew => {
               const FGroup = objNew as FormGroup;
               Object.keys(FGroup.controls).map(objNewNew => {
                  const FFControl = FGroup.controls[objNewNew];
                  if (FFControl.invalid) {
                     FFControl.markAsTouched();
                     FFControl.markAsDirty();
                  }
               });
            });
         }
      });
      const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
      if (firstElementWithError) {
         window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
      }
   }
}

MedicationHospitalUpdate() {
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
      this.HospitalService.HospitalSummaryMedicationInHospital_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
         this.FormUploading = false;
         if (response.Status) {
            this.PatientUpdateData(response.Response, 'MedicationInHospital', false);
            this.TabChangeEvent(2);
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Medication In Hospital Successfully Updated!' });
         } else {
            if (response.Message === undefined || response.Message === '' || response.Message === null) {
               response.Message = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
         }
      });
   } else {
      Object.keys(this.DynamicFGroup.controls).map(obj => {
         if (obj !== 'OtherMedicationArray') {
            const FControl = this.DynamicFGroup.controls[obj];
            if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
            }
         } else {
            const FArray = this.DynamicFGroup.controls[obj] as FormArray;
            FArray.controls.map(objNew => {
               const FGroup = objNew as FormGroup;
               Object.keys(FGroup.controls).map(objNewNew => {
                  const FFControl = FGroup.controls[objNewNew];
                  if (FFControl.invalid) {
                     FFControl.markAsTouched();
                     FFControl.markAsDirty();
                  }
               });
            });
         }
      });
      const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
      if (firstElementWithError) {
         window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
      }
   }
}

EventsSubmit() {
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
      this.HospitalService.HospitalSummaryAdverseEvents_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
         this.FormUploading = false;
         if (response.Status) {
            if (response.Response.length >= 1 ) {
               response.Response.map(obj => {
                  if (obj.Hospital._id === this.InitialHospital) {
                     this.EventsId = response.Response[response.Response.length - 1]._id;
                  }
               });
            }
            // this.PatientUpdateData(response.Response, 'AdverseEvents', false);
            this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
               this.router.navigate(['/Patient-Manage/Discharge-Transfer', this.UrlParams.Patient])
            );
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Adverse Events Successfully Created!' });
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

EventsUpdate() {
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
      this.HospitalService.HospitalSummaryAdverseEvents_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
         this.FormUploading = false;
         if (response.Status) {
            // this.PatientUpdateData(response.Response, 'AdverseEvents', false);
            this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
               this.router.navigate(['/Patient-Manage/Discharge-Transfer', this.UrlParams.Patient])
            );
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Adverse Events Successfully Updated!' });
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
