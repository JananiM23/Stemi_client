import { Component, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { FormGroup, Validators, FormControl, ValidatorFn, AbstractControl, FormArray } from '@angular/forms';
import { DateAdapter, NativeDateAdapter } from '@angular/material/core';
import { Subscription, forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TimepickerDirective } from 'ngx-material-timepicker';

import { DataPassingService } from './../../../../../services/common-services/data-passing.service';
import { LoginManagementService } from 'src/app/services/login-management/login-management.service';
import { ToastrService } from './../../../../../services/common-services/toastr.service';

import { PatientDetailsService } from 'src/app/services/patient-management/patient-details/patient-details.service';
import { ThrombolysisService } from 'src/app/services/patient-management/thrombolysis/thrombolysis.service';


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
  selector: 'app-manage-thrombolysis',
  templateUrl: './manage-thrombolysis.component.html',
  styleUrls: ['./manage-thrombolysis.component.css'],
  providers: [{provide: DateAdapter, useClass: MyDateAdapter}],
})
export class ManageThrombolysisComponent implements OnInit, OnDestroy {

   @ViewChildren(TimepickerDirective) timePicker: QueryList<TimepickerDirective>;


   private subscription: Subscription = new Subscription();
   private dataSubscription: Subscription = new Subscription();
   private otherMedicineSubscription: Subscription = new Subscription();


   AllFields: any[] = [];
   AllValidations: any[] = [];
   AllFieldsValues: any[] = [];

   TabsList: any[] = ['Medication_Prior_to_Thrombolysis', 'Thrombolysis'];

   DosageUnitsOne: any[] = [  {Name: 'mg', Key: 'mg'},
                              {Name: 'U', Key: 'u'},
                              {Name: 'mcg', Key: 'mcg'},
                              {Name: 'mg/ml', Key: 'mg_ml'},
                              {Name: 'mcg/min', Key: 'mcg_min'} ];


   DynamicFGroup: FormGroup;
   FormLoaded = false;
   FormUploading = false;

   CurrentTabIndex = 0;

   UrlParams = null;
   ExistingPatient = true;

   ReadonlyPage = false;
   LastActiveTab = 'Thrombolysis';
   InitialHospital = null;
   MedicationId = null;
   ThrombolysisId = null;

   IfPostThrombolysis = false;
   PostThrombolysisFields = [ 'Post_Thrombolysis',
                              'Thrombolytic_Agent',
                              'Dosage',
                              'Dosage_Units',
                              'Post_Thrombolysis_Start_Date_Time',
                              'Post_Thrombolysis_End_Date_Time',
                              'Ninety_Min_ECG',
                              'Ninety_Min_ECG_Date_Time',
                              'Successful_Lysis',
										'MissedSTEMI',
										'Autoreperfused',
										'Others'];
   CurrentThrombolysisFields = [ 'Thrombolysis',
                                 'Thrombolysis_Agent_Select_any_one',
                                 'Thrombolysis_Agent_Dosage',
                                 'Thrombolysis_Agent_Dosage_Units',
                                 'Thrombolysis_Agent_Dosage_Start_Date_time',
                                 'Thrombolysis_Agent_Dosage_End_Date_time',
                                 'Thrombolysis_90_120_Min_ECG',
                                 'Thrombolysis_90_120_Min_ECG_Date_Time',
                                 'Thrombolysis_Successful_Lysis',
											'Thrombolysis_MissedSTEMI',
											'Thrombolysis_Autoreperfused',
											'Thrombolysis_Others',
                                 'Thrombolysis_Agent_Dosage_Start_time',
                                 'Thrombolysis_Agent_Dosage_End_time',
                                 'Thrombolysis_90_120_Min_ECG_Time'];

   OtherMedicationArrayFields = ['Medication_Prior_to_Thrombolysis_Other_Medicine',
                                 'Medication_Prior_to_Thrombolysis_Other_Medicine_Dosage',
                                 'Medication_Prior_to_Thrombolysis_Other_Medicine_Dosage_Units',
                                 'Medication_Prior_to_Thrombolysis_Other_Medicine_Date_Time',
                                 'Medication_Prior_to_Thrombolysis_Other_Medicine_Time'];

   OtherMedicationArray: FormArray;
   OtherMedicationData = [];
   UserInfo: any;
   ContentLoading = true;
   DisableMedication = false;
   DisableThrombolysis = false;
   FibrinolyticCheckListUpdated = false;

   PatientInfo: any;
   noFutureDate: any;
   constructor(   private thrombolysisService: ThrombolysisService,
                  public Toastr: ToastrService,
                  public router: Router,
                  private PatientService: PatientDetailsService,
                  private dataPassingService: DataPassingService,
                  private LoginService: LoginManagementService,
                  private activatedRoute: ActivatedRoute
               ) {

            this.UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
            this.noFutureDate = new Date();

            this.UrlParams = this.activatedRoute.snapshot.params;
            if (this.activatedRoute.snapshot.parent.url[0].path === 'Patient-View' || (this.UserInfo.User_Type === 'PU' && (this.UserInfo.Hospital.Hospital_Role === 'EMS' || this.UserInfo.Hospital.Hospital_Role === 'Spoke S2'))) {
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
                              const Obj = Object.assign({}, obj);
                              return Obj;
                           });

                           // this.LastActiveTab = PatientRes.Response.LastCompletionChild;
                           this.PatientInfo = PatientRes.Response;
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
                           ).subscribe( ([Res1, Res2, Res3, Res4, Res5, Res6, Res7]) => {
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
                                    this.MedicationId = Res6.Response._id;
                                    this.PatientUpdateData(Res6.Response, 'MedicationPriorToThrombolysis', false);
                                 }
                                 if (Res7.Response !== null) {
                                    this.ThrombolysisId = Res7.Response._id;
                                    this.PatientUpdateData(Res7.Response, 'Thrombolysis', false);
                                 }
                                 setTimeout(() => {
                                    this.ActivateDynamicFGroup();
                                 }, 150);
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
   }

   ngOnDestroy() {
      this.dataSubscription.unsubscribe();
      this.subscription.unsubscribe();
      this.otherMedicineSubscription.unsubscribe();
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


   PatientUpdateData(PatientData: any, From: string, ProceedNext: boolean) {
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
      let ReceivableHospital = true;
      if (this.PatientInfo.TransferBending && this.UserInfo.User_Type === 'PU') {
         const CheckExisting = this.PatientInfo.Hospital_History.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id);
         ReceivableHospital = CheckExisting.length === 0 ? true : false;
      } else {
         ReceivableHospital = false;
      }
      if (From === 'CheckList') {
         let CheckListField = this.AllFieldsValues.filter(obj => obj.Sub_Category === 'Fibrinolytic_Checklist');
         CheckListField = CheckListField.map(obj => obj.Key_Name);
         if (typeof PatientData === 'object' && PatientData !== null && PatientData.length > 0) {
            PatientData.map(obj => {
               const Fields = Object.keys(obj);
               Fields.map(obj1 => {
                  if (CheckListField.includes(obj1) && obj[obj1] !== undefined && obj[obj1] !== null && obj[obj1] === 'Yes') {
                     this.FibrinolyticCheckListUpdated = true;
                  }
               });
            });
            if (!this.FibrinolyticCheckListUpdated) {
               const Idx = this.AllFieldsValues.findIndex(obj => obj.Key_Name === 'Reason_to_proceed_for_thrombolysis');
               this.AllFieldsValues[Idx].Mandatory =  false;
               this.AllFieldsValues[Idx].Validation =  false;
               this.AllFieldsValues[Idx].If_Validation_Control_Array = false;
               this.AllFieldsValues[Idx].Visibility =  false;
            } else {
               const Idx = this.AllFieldsValues.findIndex(obj => obj.Key_Name === 'Reason_to_proceed_for_thrombolysis');
               const defIdx = this.AllFields.findIndex(obj => obj.Key_Name === 'Reason_to_proceed_for_thrombolysis');
               this.AllFieldsValues[Idx].Mandatory =  this.AllFields[defIdx].Mandatory;
               this.AllFieldsValues[Idx].Validation =  this.AllFields[defIdx].Validation;
               this.AllFieldsValues[Idx].If_Validation_Control_Array = this.AllFields[defIdx].If_Validation_Control_Array;
               this.AllFieldsValues[Idx].Visibility =  this.AllFields[defIdx].Visibility;
            }
         }
      }
      if (From === 'Basic') {
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
         if (PatientData.Post_Thrombolysis && PatientData.Post_Thrombolysis === 'Yes') {
            if (PostThrombolysisData && PostThrombolysisData !== null ) {
               this.IfPostThrombolysis = true;
            }
         }
         if (this.UserInfo.User_Type === 'PU' && PatientData.Hospital_History.length > 1) {
            const HospitalDetails = PatientData.Hospital_History;
            const FilterArr = HospitalDetails.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id && i < (HospitalDetails.length - 1) );
            this.ReadonlyPage = FilterArr.length > 0 ? true : this.ReadonlyPage;
         }
      }
      if (From === 'MedicationPriorToThrombolysis') {
         if (PatientData.OtherMedicationArray && PatientData.OtherMedicationArray !== null && PatientData.OtherMedicationArray.length > 0 ) {
            this.OtherMedicationData = PatientData.OtherMedicationArray;
         }
         const DisableTransportation = this.UserInfo.Hospital !== undefined && this.UserInfo.Hospital !== null && PatientData.Hospital === this.UserInfo.Hospital._id && this.InitialHospital === this.UserInfo.Hospital._id ? false : true;
         if (DisableTransportation && PatientData !== null && this.UserInfo.User_Type !== 'SA') {
            this.DisableMedication = true;
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Junior_Category === 'Medication_Prior_to_Thrombolysis') {
                  this.AllFieldsValues[i].Disabled = true;
               }
            });
         }
         if (ReceivableHospital && PatientData === null ) {
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Category === 'Medication_Prior_to_Thrombolysis') {
                  this.AllFieldsValues[i].Disabled = true;
               }
            });
         }
      }
      if (From === 'Thrombolysis') {
         const DisableTransportation = this.UserInfo.Hospital !== undefined && this.UserInfo.Hospital !== null && PatientData.Hospital === this.UserInfo.Hospital._id && this.InitialHospital === this.UserInfo.Hospital._id ? false : true;
         if (DisableTransportation && PatientData !== null && this.UserInfo.User_Type !== 'SA') {
            this.DisableThrombolysis = true;
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Category === 'Thrombolysis') {
                  this.AllFieldsValues[i].Disabled = true;
               }
            });
         }
         if (ReceivableHospital && PatientData === null ) {
            this.AllFieldsValues.map((obj, i) => {
               if (obj.Sub_Category === 'Thrombolysis') {
                  this.AllFieldsValues[i].Disabled = true;
               }
            });
         }
      }
   }

   TabChangeEvent(event: any) {
      if (!this.CheckSubCategoryVisibility(this.TabsList[event])) {
         this.CurrentTabIndex = event;
         if (event >= 0) {
            this.DynamicFGroup.reset({}, { emitEvent: false });
            this.subscription.unsubscribe();
            this.subscription = new Subscription();
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
               this.router.navigate(['/Patient-Manage/PCI', this.UrlParams.Patient])
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

   GetFormControlErrorMessage(KeyName: any , Index?: any) {
      let FControl: FormControl;
      if (this.OtherMedicationArrayFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('OtherMedicationArray') as FormArray;
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
                  const index = this.AllValidations.findIndex(objNew => (objNew.Name.trim().split(' ').join('')) === obj);
                  if (index > -1) {
                     returnText = this.AllValidations[index].Error_Message;
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
         if (this.TabsList[this.CurrentTabIndex] === 'Medication_Prior_to_Thrombolysis' && this.MedicationId !== null) {
            this.DynamicFGroup.addControl('MedicationId', new FormControl(this.MedicationId, Validators.required ));
         }
         if (this.TabsList[this.CurrentTabIndex] === 'Thrombolysis' && this.ThrombolysisId !== null) {
            this.DynamicFGroup.addControl('ThrombolysisId', new FormControl(this.ThrombolysisId, Validators.required ));
         }
         BasicDetailsFields.map(obj => {
            let FormControlValidation = null;
            if (obj.Mandatory || obj.Validation) {
               FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
            }
            // Post Thrombolysis handling
            if (this.IfPostThrombolysis && this.CurrentThrombolysisFields.includes(obj.Key_Name)) {
               if (obj.Key_Name === 'Thrombolysis') {
                  obj.CurrentValue = 'Yes';
                  obj.DefaultValue = 'Yes';
               } else {
                  const Index = this.CurrentThrombolysisFields.indexOf(obj.Key_Name);
                  if (Index < 12) {
                     const PostKey = this.PostThrombolysisFields[Index];
                     const PostIndex = this.AllFieldsValues.findIndex(objNew => objNew.Key_Name === PostKey);
                     obj.CurrentValue = this.AllFieldsValues[PostIndex].CurrentValue;
                     obj.DefaultValue = this.AllFieldsValues[PostIndex].DefaultValue;
                  }
               }
               this.DynamicFGroup.addControl(obj.Key_Name, new FormControl({value: obj.CurrentValue, disabled: true}));
            } else {
               if (!this.OtherMedicationArrayFields.includes(obj.Key_Name)) {
                  this.DynamicFGroup.addControl(obj.Key_Name, new FormControl({value: obj.CurrentValue, disabled: obj.Disabled}, FormControlValidation ));
               }
            }
            let AnyTimeValue = '00:00';
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
            if (obj.Key_Name === 'Aspirin_Date_Time' && !KeyDatabase.includes('Aspirin_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Aspirin_Date_Time';
               NewObj.Name = 'Aspirin Time';
               NewObj.Key_Name = 'Aspirin_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Aspirin_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation ));
            }
            if (obj.Key_Name === 'Medication_Prior_to_Thrombolysis_Clopidogrel_Dosage_Date_Time' && !KeyDatabase.includes('Medication_Prior_to_Thrombolysis_Clopidogrel_Dosage_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Medication_Prior_to_Thrombolysis_Clopidogrel_Dosage_Date_Time';
               NewObj.Name = 'Medication Prior to Thrombolysis Clopidogrel Dosage Time';
               NewObj.Key_Name = 'Medication_Prior_to_Thrombolysis_Clopidogrel_Dosage_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Medication_Prior_to_Thrombolysis_Clopidogrel_Dosage_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation ));
            }
            if (obj.Key_Name === 'Unfractionated_Heparin_Dosage_Date_Time' && !KeyDatabase.includes('Unfractionated_Heparin_Dosage_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Unfractionated_Heparin_Dosage_Date_Time';
               NewObj.Name = 'Unfractionated Heparin Dosage Time';
               NewObj.Key_Name = 'Unfractionated_Heparin_Dosage_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Unfractionated_Heparin_Dosage_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation ));
            }
            if (obj.Key_Name === 'Medication_Prior_to_Thrombolysis_LMW_Heparin_Dosage_Date_Time' && !KeyDatabase.includes('Medication_Prior_to_Thrombolysis_LMW_Heparin_Dosage_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Medication_Prior_to_Thrombolysis_LMW_Heparin_Dosage_Date_Time';
               NewObj.Name = 'Medication Prior to Thrombolysis LMW Heparin Dosage Time';
               NewObj.Key_Name = 'Medication_Prior_to_Thrombolysis_LMW_Heparin_Dosage_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Medication_Prior_to_Thrombolysis_LMW_Heparin_Dosage_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation ));
            }
            if (obj.Key_Name === 'Medication_Prior_to_Thrombolysis_Ticagrelor_Dosage_Units_Date_Time' && !KeyDatabase.includes('Medication_Prior_to_Thrombolysis_Ticagrelor_Dosage_Units_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Medication_Prior_to_Thrombolysis_Ticagrelor_Dosage_Units_Date_Time';
               NewObj.Name = 'Medication Prior to Thrombolysis Ticagrelor Dosage Units Time';
               NewObj.Key_Name = 'Medication_Prior_to_Thrombolysis_Ticagrelor_Dosage_Units_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Medication_Prior_to_Thrombolysis_Ticagrelor_Dosage_Units_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation ));
            }
				if (obj.Key_Name === 'Medication_Prior_to_Thrombolysis_Enoxaparin_Dosage_Units_Date_Time' && !KeyDatabase.includes('Medication_Prior_to_Thrombolysis_Enoxaparin_Dosage_Units_Time')) {
					NewObj.ThisIsTime = true;
					NewObj.ParentDateKey = 'Medication_Prior_to_Thrombolysis_Enoxaparin_Dosage_Units_Date_Time';
					NewObj.Name = 'Medication Prior to Thrombolysis Enoxaparin Dosage Units Time';
					NewObj.Key_Name = 'Medication_Prior_to_Thrombolysis_Enoxaparin_Dosage_Units_Time';
					this.AllFieldsValues.push(NewObj);
					this.DynamicFGroup.addControl('Medication_Prior_to_Thrombolysis_Enoxaparin_Dosage_Units_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation ));
				}
            if (obj.Key_Name === 'Medication_Prior_to_Thrombolysis_Other_Medicine_Date_Time' && !KeyDatabase.includes('Medication_Prior_to_Thrombolysis_Other_Medicine_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Medication_Prior_to_Thrombolysis_Other_Medicine_Date_Time';
               NewObj.Name = 'Medication Prior to Thrombolysis Other Medicine Time';
               NewObj.Key_Name = 'Medication_Prior_to_Thrombolysis_Other_Medicine_Time';
               this.AllFieldsValues.push(NewObj);
            }
            if (obj.Key_Name === 'Thrombolysis_Agent_Dosage_Start_Date_time' && !KeyDatabase.includes('Thrombolysis_Agent_Dosage_Start_time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Thrombolysis_Agent_Dosage_Start_Date_time';
               NewObj.Name = 'Thrombolysis Agent Dosage Start time';
               NewObj.Key_Name = 'Thrombolysis_Agent_Dosage_Start_time';
               this.AllFieldsValues.push(NewObj);
               if (this.IfPostThrombolysis) {
                  this.DynamicFGroup.addControl('Thrombolysis_Agent_Dosage_Start_time', new FormControl({value: NewObj.CurrentValue, disabled: true}));
               } else {
                  this.DynamicFGroup.addControl('Thrombolysis_Agent_Dosage_Start_time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
               }
            }
            if (obj.Key_Name === 'Thrombolysis_Agent_Dosage_End_Date_time' && !KeyDatabase.includes('Thrombolysis_Agent_Dosage_End_time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Thrombolysis_Agent_Dosage_End_Date_time';
               NewObj.Name = 'Thrombolysis Agent Dosage End time';
               NewObj.Key_Name = 'Thrombolysis_Agent_Dosage_End_time';
               this.AllFieldsValues.push(NewObj);
               if (this.IfPostThrombolysis) {
                  this.DynamicFGroup.addControl('Thrombolysis_Agent_Dosage_End_time', new FormControl({value: NewObj.CurrentValue, disabled: true}));
               } else {
                  this.DynamicFGroup.addControl('Thrombolysis_Agent_Dosage_End_time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
               }
            }
            if (obj.Key_Name === 'Thrombolysis_90_120_Min_ECG_Date_Time' && !KeyDatabase.includes('Thrombolysis_90_120_Min_ECG_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Thrombolysis_90_120_Min_ECG_Date_Time';
               NewObj.Name = 'Thrombolysis 90 120 Min ECG Time';
               NewObj.Key_Name = 'Thrombolysis_90_120_Min_ECG_Time';
               this.AllFieldsValues.push(NewObj);
               if (this.IfPostThrombolysis) {
                  this.DynamicFGroup.addControl('Thrombolysis_90_120_Min_ECG_Time', new FormControl({value: NewObj.CurrentValue, disabled: true}));
               } else {
                  this.DynamicFGroup.addControl('Thrombolysis_90_120_Min_ECG_Time', new FormControl({value: NewObj.CurrentValue, disabled: NewObj.Disabled}, FormControlValidation));
               }
            }
         });
         this.DynamicFGroup.addControl('OtherMedicationArray', new FormArray([]));
         if (this.OtherMedicationData.length > 0) {
            this.OtherMedicationArrayDataUpdate();
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
            if (obj.Key_Name === 'Medication_Prior_to_Thrombolysis_Other_Medicine_Time') {
               if (OBJ['Medication_Prior_to_Thrombolysis_Other_Medicine_Date_Time'] !== null && OBJ['Medication_Prior_to_Thrombolysis_Other_Medicine_Date_Time'] !== '') {
                  const DateTime = new Date(OBJ['Medication_Prior_to_Thrombolysis_Other_Medicine_Date_Time']);
                  SetValue = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
            } else {
               SetValue = (OBJ[obj.Key_Name] && OBJ[obj.Key_Name] !== null && OBJ[obj.Key_Name] !== '') ? OBJ[obj.Key_Name] : SetValue;
            }
            let FormControlValidation = null;
            if (obj.Mandatory || obj.Validation) {
               FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
            }
            NewFGroup.addControl(obj.Key_Name, new FormControl({value: SetValue, disabled: obj.Disabled}, FormControlValidation ));
            // NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
         });
         this.OtherMedicationArray = this.DynamicFGroup.get('OtherMedicationArray') as FormArray;
         this.OtherMedicationArray.push(NewFGroup);
      });
      if (this.OtherMedicationData.length > 0) {
         this.DynamicFArrayValueChangesMonitoring();
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
      let FormControlsArray = Object.keys(this.DynamicFGroup.controls);
      FormControlsArray = FormControlsArray.filter(obj => obj !== 'OtherMedicationArray');
      FormControlsArray.map(controlName => {
         const control = this.DynamicFGroup.controls[controlName] as FormControl;
         if (!control.disabled) {
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
                           RelatedTime = (RelatedTime && RelatedTime !== null && RelatedTime !== '' && RelatedTime !== '0:0' && RelatedTime !== '00:00:00' ) ? (RelatedTime + ':00') : '00:00:00';
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
         }
      });
      // Update Values
      setTimeout(() => {
         const BasicDetailsFields = this.AllFieldsValues.filter(obj => obj.Sub_Category === this.TabsList[this.CurrentTabIndex]);
         const FilterUpdateFields = BasicDetailsFields.filter(obj => obj.CurrentValue !== null && obj.CurrentValue !== '');
         FilterUpdateFields.map(obj => {
            if (!this.OtherMedicationArrayFields.includes(obj.Key_Name) && !obj.ThisIsTime) {
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

   DynamicFArrayValueChangesMonitoring() {
      this.otherMedicineSubscription.unsubscribe();
      this.otherMedicineSubscription = new Subscription();
      // let SubscribeLimitControl = [];
      // let NewSubscribeLimit = true;
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
                              RelatedTime = (RelatedTime && RelatedTime !== null && RelatedTime !== '' && RelatedTime !== '0:0' && RelatedTime !== '00:00:00' ) ? (RelatedTime + ':00') : '00:00:00';
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
      const KeyData = this.AllFieldsValues.filter(obj => obj.Sub_Junior_Category === SubJuniorCategory && obj.Visibility === true);
      if (KeyData.length > 0) {
         return true;
      } else {
         return false;
      }
   }

   CheckSubCategoryVisibility(SubCategory: any) {
      const KeyData = this.AllFieldsValues.filter(obj => obj.Sub_Category === SubCategory && obj.Visibility === true);
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
										if (obj2.Key_Name === 'Thrombolysis_MissedSTEMI' || obj2.Key_Name === 'Thrombolysis_Autoreperfused' || obj2.Key_Name === 'Thrombolysis_Others') {
											const SetValue = (obj2.Type === 'Select' || obj2.Type === 'Date' || obj2.Type === 'Number' || obj2.Type === 'Boolean' ) ? null : '';
											this.CommonInputReset(obj2.Key_Name, SetValue);
										} else {
											this.CommonValidatorsSet(obj2.Key_Name, obj2.ThisIsTime, obj2.ParentDateKey);
										}
                           });
                        } else {
                           ChildeArr.map(obj2 => {
										if ( change === 'No' && (obj2.Key_Name === 'Thrombolysis_MissedSTEMI' || obj2.Key_Name === 'Thrombolysis_Autoreperfused' || obj2.Key_Name === 'Thrombolysis_Others')) {
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

   DefaultTime(Key: any) {
      const value = this.DynamicFGroup.get(Key).value;
      return value === null ? '00:00' : value;
   }
   DefaultTimeFromArray(ArrayKey: any, Idx: number, Key: any) {
      const FArray = this.DynamicFGroup.get(ArrayKey) as FormArray;
      const FGroup = FArray.controls[Idx] as FormGroup;
      const value = FGroup.get(Key).value;
      return value === null ? '00:00' : value;
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
         const FControlName = FControl.getNamedItem('formcontrolname').textContent;
         if (FControlName === TimeKey) {
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
         const FControlName = FControl.getNamedItem('formcontrolname').textContent;
         if (FControlName === TimeKey) {
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



   MedicationSubmit() {
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
         this.thrombolysisService.ThrombolysisMedication_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.MedicationId = response.Response._id;
               this.PatientUpdateData(response.Response, 'MedicationPriorToThrombolysis', false);
               this.TabChangeEvent(1);
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Medication Prior To Thrombolysis Successfully Created!' });
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
   MedicationUpdate() {

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
         this.thrombolysisService.ThrombolysisMedication_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.PatientUpdateData(response.Response, 'MedicationPriorToThrombolysis', false);
               this.TabChangeEvent(1);
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Medication Prior To Thrombolysis Successfully Updated!' });
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



   ThrombolysisSubmit() {
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
         this.thrombolysisService.Thrombolysis_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.MedicationId = response.Response._id;
               // this.PatientUpdateData(response.Response, 'Thrombolysis', false);
               if (this.PatientInfo.Initiated_Hospital.Hospital_Role === 'Spoke S1') {
                  this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                     this.router.navigate(['/Patient-Manage/Hospital-Summary', this.UrlParams.Patient])
                  );
               } else {
                  this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                     this.router.navigate(['/Patient-Manage/PCI', this.UrlParams.Patient])
                  );
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Thrombolysis Successfully Created!' });
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
   ThrombolysisUpdate() {
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
         this.thrombolysisService.Thrombolysis_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               // this.PatientUpdateData(response.Response, 'Thrombolysis', false);
               if (this.PatientInfo.Initiated_Hospital.Hospital_Role === 'Spoke S1') {
                  this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                     this.router.navigate(['/Patient-Manage/Hospital-Summary', this.UrlParams.Patient])
                  );
               } else {
                  this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                     this.router.navigate(['/Patient-Manage/PCI', this.UrlParams.Patient])
                  );
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Thrombolysis Successfully Updated!' });
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
