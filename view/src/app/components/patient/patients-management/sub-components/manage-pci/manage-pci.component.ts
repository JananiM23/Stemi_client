import { Component, OnInit, OnDestroy, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { FormGroup, Validators, FormControl, ValidatorFn, AbstractControl, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DateAdapter, NativeDateAdapter } from '@angular/material/core';
import { Subscription, forkJoin } from 'rxjs';
import { TimepickerDirective } from 'ngx-material-timepicker';

import { DataPassingService } from './../../../../../services/common-services/data-passing.service';
import { LoginManagementService } from './../../../../../services/login-management/login-management.service';
import { PatientDetailsService } from 'src/app/services/patient-management/patient-details/patient-details.service';
import { ThrombolysisService } from 'src/app/services/patient-management/thrombolysis/thrombolysis.service';
import { PciService } from 'src/app/services/patient-management/pci/pci.service';
import { ToastrService } from './../../../../../services/common-services/toastr.service';
import { MatTabGroup } from '@angular/material/tabs';


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
   selector: 'app-manage-pci',
   templateUrl: './manage-pci.component.html',
   styleUrls: ['./manage-pci.component.css'],
   providers: [{provide: DateAdapter, useClass: MyDateAdapter}],
})
export class ManagePciComponent implements OnInit, OnDestroy {

   @ViewChildren(TimepickerDirective) timePicker: QueryList<TimepickerDirective>;
   @ViewChild('tabs') tabGroup: MatTabGroup;

   private subscription: Subscription = new Subscription();
   private dataSubscription: Subscription = new Subscription();
   private DrugsBeforePCISubscription: Subscription = new Subscription();
   private CulpritVesselBasicSubscription: Subscription = new Subscription();
   private CulpritVesselSubscription: Subscription = new Subscription();
   private CulpritVesselYesOrNoSubscription: Subscription = new Subscription();
   private VesselBasicSubscription: Subscription = new Subscription();
   private VesselSubscription: Subscription = new Subscription();
   private VesselYesOrNoSubscription: Subscription = new Subscription();
   private AntiThromboticsOthersSubscription: Subscription = new Subscription();



   AllFields: any[] = [];
   AllFieldsValues: any[] = [];
   AllValidations: any[] = [];
   UserInfo: any;
   TabsList: any[] = ['Drug_Before_Pci', 'PCI', 'Medication_in_Cath'];

   CulpritVessel: any[] = [{Key: 'LAD (Proximal)', Name: 'LAD (Proximal)'},
                           {Key: 'LAD (Middle)', Name: 'LAD (Middle)'},
                           {Key: 'LAD (Distal)', Name: 'LAD (Distal)'},
                           {Key: 'RAMUS', Name: 'RAMUS'},
                           {Key: 'LCX (Proximal)', Name: 'LCX (Proximal)'},
                           {Key: 'LCX (Middle)', Name: 'LCX (Middle)'},
                           {Key: 'LCX (Distal)', Name: 'LCX (Distal)'},
                           {Key: 'RCA (Proximal)', Name: 'RCA (Proximal)'},
                           {Key: 'RCA (Middle)', Name: 'RCA (Middle)'},
                           {Key: 'RCA (Distal)', Name: 'RCA (Distal)'},
                           {Key: 'LMS', Name: 'LMS'},
                           {Key: 'LIMA', Name: 'LIMA'},
                           {Key: 'SVG', Name: 'SVG'},
                           {Key: 'D1', Name: 'D1'},
                           {Key: 'D2', Name: 'D2'},
                           {Key: 'CX', Name: 'CX'},
                           {Key: 'OM1', Name: 'OM1'},
                           {Key: 'OM2', Name: 'OM2'},
                           {Key: 'RI', Name: 'RI'},
                           {Key: 'PDA', Name: 'PDA'},
                           {Key: 'PLV', Name: 'PLV'} ];

   PCIInterventionBMSNumberOfStents: any[] = [  { Key: '0', Name: '0' },
                                                { Key: '1', Name: '1' },
                                                { Key: '2', Name: '2' },
                                                { Key: '3', Name: '3' },
                                                { Key: '4', Name: '4' } ];

   TIMIFlow: any[] = [  { Key: '0', Name: '0' },
                           { Key: '1', Name: '1' },
                           { Key: '2', Name: '2' },
                           { Key: '3', Name: '3' }];

   UnfractionatedHeparin: any[] = [ { Key: 'Mg', Name: 'Mg' },
                                    { Key: 'U', Name: 'U' },
                                    { Key: 'MCG', Name: 'MCG' },
                                    { Key: 'mg/ml', Name: 'mg/ml' },
                                    { Key: 'mcg/min', Name: 'mcg/min' }];

   Route: any[] = [  { Key: 'IV', Name: 'IV' },
                     { Key: 'SC', Name: 'SC' },
                     { Key: 'SH', Name: 'SH' },
                     { Key: 'A', Name: 'A' },
                     { Key: 'IC', Name: 'IC' },
                     { Key: 'IM', Name: 'IM' },
                     { Key: 'UK', Name: 'UK' },
                     { Key: 'Sheath', Name: 'Sheath' },
                     { Key: 'HS', Name: 'HS' } ];

   DynamicFGroup: FormGroup;
   HistoryFGroup: FormGroup;

   DrugsBeforePCIOthersArrayFields = [ 'Pci_Drug_Before_Pci_Other_Medicine',
                                       'Pci_Drug_Before_Pci_Other_Medicine_Date_Time',
                                       'Pci_Drug_Before_Pci_Other_Medicine_Time'];

   CulpritVesselArrayBasicFields = [ 'Pci_Culprit_Vessel', 'Pci_Culprit_Vessel_Percent' ];
   CulpritVesselArrayFields = [ 'Pci_Culprit_Vessel',
                                 'Pci_Culprit_Vessel_Percent',
                                 'Culprit_Vessel_Intervention',
                                 'PCI_Intervention_Balloon_Dilatation',
                                 'PCI_Intervention_Balloon_Dilatation_Date',
                                 'PCI_Intervention_Balloon_Dilatation_Time',
											'PCI_Intervention_Wire_Crossing',
                                 'PCI_Intervention_Wire_Crossing_Date_Time',
                                 'PCI_Intervention_Wire_Crossing_Time',
                                 'PCI_Intervention_Aspiration',
                                 'PCI_Intervention_Stenting',
                                 'PCI_Intervention_Stenting_Date_Time',
                                 'PCI_Intervention_Stenting_Time',
                                 'PCI_Intervention_Stenting_Diameter',
                                 'PCI_Intervention_Stenting_Length',
                                 'PCI_Intervention_Bms',
                                 'PCI_Intervention_Bms_Number_Of_Stents',
                                 'PCI_Intervention_DES',
                                 'PCI_Intervention_DES_Number_Of_Stents',
											'PCI_Intervention_DCB',
                                 'PCI_Intervention_DCB_Number_Of_Stents',
                                 'PCI_Intervention_MGuard',
                                 'PCI_Intervention_MGuard_Number_Of_Stents',
                                 'PCI_Intervention_Postdilatation',
                                 'PCI_Intervention_IVUS',
                                 'PCI_Intervention_OCT',
                                 'PCI_Intervention_TIMI_Flow',
                                 'PCI_Intervention_TIMI_Blush_Grade'];

   VesselArrayBasicFields = [ 'Pci_Cart_Vessel', 'Pci_Cart_Vessel_Percent' ];
   VesselArrayFields = [   'Pci_Cart_Vessel',
                           'Pci_Cart_Vessel_Percent',
                           'PCI_Vessel_Intervention',
                           'PCI_Intervention_Vessel_Balloon_Dilatation',
                           'PCI_Intervention_Vessel_Balloon_Dilatation_Date',
                           'PCI_Intervention_Vessel_Balloon_Dilatation_Time',
									'PCI_Intervention_Vessel_Wire_Crossing',
									'PCI_Intervention_Vessel_Wire_Crossing_Date_Time',
									'PCI_Intervention_Vessel_Wire_Crossing_Time',
                           'PCI_Intervention_Vessel_Stenting',
                           'PCI_Intervention_Vessel_Stenting_Date_Time',
                           'PCI_Intervention_Vessel_Stenting_Time',
                           'PCI_Intervention_Vessel_Stenting_Diameter',
                           'PCI_Intervention_Vessel_Stenting_Length',
                           'PCI_Intervention_Vessel_Bms',
                           'PCI_Intervention_Vessel_Bms_Number_Of_Stents',
                           'PCI_Intervention_Vessel_DES',
                           'PCI_Intervention_Vessel_DES_Number_Of_Stents',
									'PCI_Intervention_Vessel_DCB',
                           'PCI_Intervention_Vessel_DCB_Number_Of_Stents',
                           'PCI_Intervention_Vessel_MGuard',
                           'PCI_Intervention_Vessel_MGuard_Number_Of_Stents',
                           'PCI_Intervention_Vessel_Postdilatation',
                           'PCI_Intervention_Vessel_IVUS',
                           'PCI_Intervention_Vessel_OCT',
                           'PCI_Intervention_Vessel_TIMI_Flow',
                           'PCI_Intervention_Vessel_TIMI_Blush_Grade'];


   IntraCoronaryDrugsOthersArrayFields = [ 'Intra_coronary_Other_Medicine'];

   InhibitorsOthersDataFields = [ 'Inhibitors_Other_Medicine'];

   AntiThromboticsOthersArrayFields = ['Anti_Thrombotics_Other_Medicine_Name',
                                       'Anti_Thrombotics_Other_Medicine_Route',
                                       'Anti_Thrombotics_Other_Medicine_Dosage',
                                       'Anti_Thrombotics_Other_Medicine_Dosage_Units',
                                       'Anti_Thrombotics_Other_Medicine_Dosage_Date_Time',
                                       'Anti_Thrombotics_Other_Medicine_Dosage_Time' ];


   AllArrayFields = [];


   DrugsBeforePCIOthersArray: FormArray;
   DrugsBeforePCIOthersData = [];
   CulpritVesselArray: FormArray;
   CulpritVesselBasicArray: FormArray;
   CulpritVesselData = [];
   VesselArray: FormArray;
   VesselBasicArray: FormArray;
   VesselData = [];
   IntraCoronaryDrugsOthersArray: FormArray;
   IntraCoronaryDrugsOthersData = [];
   InhibitorsOthersArray: FormArray;
   InhibitorsOthersData = [];
   AntiThromboticsOthersArray: FormArray;
   AntiThromboticsOthersData = [];

   CurrentHospitalInfo: any = null;
   PatientInfo: any;

   FormLoaded = false;
   FormUploading = false;

   UrlParams = null;
   ExistingPatient = true;
   ReadonlyPage = false;
   LastActiveTab = 'Medication_in_Cath';
   InitialHospital = null;
   DrugBeforePciId = null;
   PCIId = null;
   MedicationInCathId = null;
   ContentLoading = true;
   CurrentTabIndex = 0;
   noFutureDate: any;

   constructor( private PatientService: PatientDetailsService,
                private thrombolysisService: ThrombolysisService,
                private pciService: PciService,
                public router: Router,
                public Toastr: ToastrService,
                private LoginService: LoginManagementService,
                private dataPassingService: DataPassingService,
                private activatedRoute: ActivatedRoute ) {

            this.UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
            this.noFutureDate = new Date();

            this.AllArrayFields = this.AllArrayFields.concat(this.DrugsBeforePCIOthersArrayFields)
                                                      .concat(this.CulpritVesselArrayFields)
                                                      .concat(this.VesselArrayFields)
                                                      .concat(this.IntraCoronaryDrugsOthersArrayFields)
                                                      .concat(this.InhibitorsOthersDataFields)
                                                      .concat(this.AntiThromboticsOthersArrayFields);
            this.UrlParams = this.activatedRoute.snapshot.params;
            if (this.activatedRoute.snapshot.parent.url[0].path === 'Patient-View' || (this.UserInfo.User_Type === 'PU' && (this.UserInfo.Hospital.Hospital_Role === 'EMS' || this.UserInfo.Hospital.Hospital_Role === 'Spoke S2' || this.UserInfo.Hospital.Hospital_Role === 'Spoke S1'))) {
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
                           ).subscribe( ([Res1, Res2, Res3, Res4, Res5, Res6, Res7, Res8, Res9, Res10]) => {
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
                                    this.DrugBeforePciId = Res8.Response._id;
                                    this.PatientUpdateData(Res8.Response, 'DrugBeforePci', false);
                                 }
                                 if (Res9.Response !== null) {
                                    this.PCIId = Res9.Response._id;
                                    this.PatientUpdateData(Res9.Response, 'PCI', false);
                                 }
                                 if (Res10.Response !== null) {
                                    this.MedicationInCathId = Res10.Response._id;
                                    this.PatientUpdateData(Res10.Response, 'MedicationInCath', false);
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
   }

   ngOnDestroy() {
      this.dataSubscription.unsubscribe();
      this.subscription.unsubscribe();
      this.DrugsBeforePCISubscription.unsubscribe();
      this.CulpritVesselBasicSubscription.unsubscribe();
      this.CulpritVesselSubscription.unsubscribe();
      this.CulpritVesselYesOrNoSubscription.unsubscribe();
      this.VesselBasicSubscription.unsubscribe();
      this.VesselSubscription.unsubscribe();
      this.VesselYesOrNoSubscription.unsubscribe();
      this.AntiThromboticsOthersSubscription.unsubscribe();
   }

   NotAllow(): boolean {return false; }
   ClearInput(event: KeyboardEvent, FArrayKey?: any, index?: any): boolean {
      const Events = event.composedPath() as EventTarget[];
      const Input = Events[0] as HTMLInputElement;
      const FControl = Input.attributes as NamedNodeMap;
      const FControlName = FControl.getNamedItem('formcontrolname').textContent;
      if (this.AllArrayFields.includes(FControlName)) {
         const FArray = this.DynamicFGroup.get(FArrayKey) as FormArray;
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
         if (this.UserInfo.User_Type === 'PU' && PatientData.Hospital_History.length > 1) {
            const HospitalDetails = PatientData.Hospital_History;
            const FilterArr = HospitalDetails.filter((obj, i) => obj.Hospital._id === this.UserInfo.Hospital._id && i < (HospitalDetails.length - 1) );
            this.ReadonlyPage = FilterArr.length > 0 ? true : this.ReadonlyPage;
         }
      }
      if (From === 'DrugBeforePci') {
         if (PatientData.DrugsBeforePCIOthersArray && PatientData.DrugsBeforePCIOthersArray !== null && PatientData.DrugsBeforePCIOthersArray.length > 0 ) {
            this.DrugsBeforePCIOthersData = PatientData.DrugsBeforePCIOthersArray;
         }
      }
      if (From === 'PCI') {
         if (PatientData.CulpritVesselArray && PatientData.CulpritVesselArray !== null && PatientData.CulpritVesselArray.length > 0 ) {
            this.CulpritVesselData = PatientData.CulpritVesselArray;
         }
         if (PatientData.VesselArray && PatientData.VesselArray !== null && PatientData.VesselArray.length > 0 ) {
            this.VesselData = PatientData.VesselArray;
         }
      }
      if (From === 'MedicationInCath') {
         if (PatientData.IntraCoronaryDrugsOthersArray && PatientData.IntraCoronaryDrugsOthersArray !== null && PatientData.IntraCoronaryDrugsOthersArray.length > 0 ) {
            this.IntraCoronaryDrugsOthersData = PatientData.IntraCoronaryDrugsOthersArray;
         }
         if (PatientData.InhibitorsOthersArray && PatientData.InhibitorsOthersArray !== null && PatientData.InhibitorsOthersArray.length > 0 ) {
            this.InhibitorsOthersData = PatientData.InhibitorsOthersArray;
         }
         if (PatientData.AntiThromboticsOthersArray && PatientData.AntiThromboticsOthersArray !== null && PatientData.AntiThromboticsOthersArray.length > 0 ) {
            this.AntiThromboticsOthersData = PatientData.AntiThromboticsOthersArray;
         }
      }
   }

   TabChangeEvent(event: any) {
      if (!this.CheckSubCategoryVisibility(this.TabsList[event])) {
         this.CurrentTabIndex = event;
         if (event >= 0 ) {
            this.DynamicFGroup.reset({}, { emitEvent: false });
            this.subscription.unsubscribe();
            this.subscription = new Subscription();
            this.DrugsBeforePCISubscription.unsubscribe();
            this.DrugsBeforePCISubscription = new Subscription();
            this.CulpritVesselBasicSubscription.unsubscribe();
            this.CulpritVesselBasicSubscription = new Subscription();
            this.CulpritVesselSubscription.unsubscribe();
            this.CulpritVesselSubscription = new Subscription();
            this.CulpritVesselYesOrNoSubscription.unsubscribe();
            this.CulpritVesselYesOrNoSubscription = new Subscription();
            this.VesselBasicSubscription.unsubscribe();
            this.VesselBasicSubscription = new Subscription();
            this.VesselSubscription.unsubscribe();
            this.VesselSubscription = new Subscription();
            this.VesselYesOrNoSubscription.unsubscribe();
            this.VesselYesOrNoSubscription = new Subscription();
            this.AntiThromboticsOthersSubscription.unsubscribe();
            this.AntiThromboticsOthersSubscription = new Subscription();
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
               this.router.navigate(['/Patient-Manage/Hospital-Summary', this.UrlParams.Patient])
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
      if (this.DrugsBeforePCIOthersArrayFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('DrugsBeforePCIOthersArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.CulpritVesselArrayBasicFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('CulpritVesselBasicArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.CulpritVesselArrayFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('CulpritVesselArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.VesselArrayBasicFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('VesselBasicArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.VesselArrayFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('VesselArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.IntraCoronaryDrugsOthersArrayFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('IntraCoronaryDrugsOthersArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.InhibitorsOthersDataFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('InhibitorsOthersArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.AntiThromboticsOthersArrayFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('AntiThromboticsOthersArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      }  else {
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
                  const Index1 = this.AllValidations.findIndex(objNew => (objNew.Name.trim().split(' ').join('')) === obj);
                  if (Index1 > -1) {
                     returnText = this.AllValidations[Index1].Error_Message;
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
         if (this.TabsList[this.CurrentTabIndex] === 'Drug_Before_Pci' && this.DrugBeforePciId !== null) {
            this.DynamicFGroup.addControl('DrugBeforePciId', new FormControl(this.DrugBeforePciId, Validators.required ));
         }
         if (this.TabsList[this.CurrentTabIndex] === 'PCI' && this.PCIId !== null) {
            this.DynamicFGroup.addControl('PCIId', new FormControl(this.PCIId, Validators.required ));
         }
         if (this.TabsList[this.CurrentTabIndex] === 'Medication_in_Cath' && this.MedicationInCathId !== null) {
            this.DynamicFGroup.addControl('MedicationInCathId', new FormControl(this.MedicationInCathId, Validators.required ));
         }
         BasicDetailsFields.map(obj => {
            let FormControlValidation = null;
            if (obj.Mandatory || obj.Validation) {
               FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
            }
            if (!this.AllArrayFields.includes(obj.Key_Name)) {
               this.DynamicFGroup.addControl(obj.Key_Name, new FormControl(obj.CurrentValue, FormControlValidation ));
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
            if (obj.Key_Name === 'Pci_Drug_Before_Pci_Clopidogrel_Date_Time' && !KeyDatabase.includes('Pci_Drug_Before_Pci_Clopidogrel_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Pci_Drug_Before_Pci_Clopidogrel_Date_Time';
               NewObj.Name = 'Drug Before Pci Clopidogrel Time';
               NewObj.Key_Name = 'Pci_Drug_Before_Pci_Clopidogrel_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Pci_Drug_Before_Pci_Clopidogrel_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'Pci_Drug_Before_Pci_Prasugrel_Date_Time' && !KeyDatabase.includes('Pci_Drug_Before_Pci_Prasugrel_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Pci_Drug_Before_Pci_Prasugrel_Date_Time';
               NewObj.Name = 'Drug Before Pci Prasugrel Time';
               NewObj.Key_Name = 'Pci_Drug_Before_Pci_Prasugrel_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Pci_Drug_Before_Pci_Prasugrel_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'Pci_Drug_Before_Pci_Ticagrelor_Date_Time' && !KeyDatabase.includes('Pci_Drug_Before_Pci_Ticagrelor_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Pci_Drug_Before_Pci_Ticagrelor_Date_Time';
               NewObj.Name = 'Drug Before Pci Ticagrelor Time';
               NewObj.Key_Name = 'Pci_Drug_Before_Pci_Ticagrelor_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Pci_Drug_Before_Pci_Ticagrelor_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'Pci_Drug_Before_Pci_Aspirin_Dosage_Date_Time' && !KeyDatabase.includes('Pci_Drug_Before_Pci_Aspirin_Dosage_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Pci_Drug_Before_Pci_Aspirin_Dosage_Date_Time';
               NewObj.Name = 'Drug Before Pci Aspirin Time';
               NewObj.Key_Name = 'Pci_Drug_Before_Pci_Aspirin_Dosage_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Pci_Drug_Before_Pci_Aspirin_Dosage_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'Pci_Drug_Before_Pci_Other_Medicine_Date_Time' && !KeyDatabase.includes('Pci_Drug_Before_Pci_Other_Medicine_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Pci_Drug_Before_Pci_Other_Medicine_Date_Time';
               NewObj.Name = 'Drug Before Pci Other Medicine Time';
               NewObj.Key_Name = 'Pci_Drug_Before_Pci_Other_Medicine_Time';
               this.AllFieldsValues.push(NewObj);
               // this.DynamicFGroup.addControl('Pci_Drug_Before_Pci_Other_Medicine_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'Pci_Cath_Lab_Activation_Date_Time' && !KeyDatabase.includes('Pci_Cath_Lab_Activation_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Pci_Cath_Lab_Activation_Date_Time';
               NewObj.Name = 'Cath Lab Activation Time';
               NewObj.Key_Name = 'Pci_Cath_Lab_Activation_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Pci_Cath_Lab_Activation_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'Pci_Cath_Lab_Arrival_Date_Time' && !KeyDatabase.includes('Pci_Cath_Lab_Arrival_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Pci_Cath_Lab_Arrival_Date_Time';
               NewObj.Name = 'Cath Lab Arrival Time';
               NewObj.Key_Name = 'Pci_Cath_Lab_Arrival_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Pci_Cath_Lab_Arrival_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'Pci_Vascular_Access_Date_Time' && !KeyDatabase.includes('Pci_Vascular_Access_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Pci_Vascular_Access_Date_Time';
               NewObj.Name = 'Vascular Access Time';
               NewObj.Key_Name = 'Pci_Vascular_Access_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Pci_Vascular_Access_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'Pci_Cart_Start_Date_Time' && !KeyDatabase.includes('Pci_Cart_Start_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Pci_Cart_Start_Date_Time';
               NewObj.Name = 'Cart Start Time';
               NewObj.Key_Name = 'Pci_Cart_Start_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Pci_Cart_Start_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'Pci_Cart_End_Date_Time' && !KeyDatabase.includes('Pci_Cart_End_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Pci_Cart_End_Date_Time';
               NewObj.Name = 'Cart End Time';
               NewObj.Key_Name = 'Pci_Cart_End_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Pci_Cart_End_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'PCI_Management_CABG_Date' && !KeyDatabase.includes('PCI_Management_CABG_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'PCI_Management_CABG_Date';
               NewObj.Name = 'PCI Management CABG Time';
               NewObj.Key_Name = 'PCI_Management_CABG_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('PCI_Management_CABG_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'PCI_Intervention_Wire_Crossing_Date_Time' && !KeyDatabase.includes('PCI_Intervention_Wire_Crossing_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'PCI_Intervention_Wire_Crossing_Date_Time';
               NewObj.Name = 'Pci Intervention Wire Crossing Time';
               NewObj.Key_Name = 'PCI_Intervention_Wire_Crossing_Time';
               this.AllFieldsValues.push(NewObj);
               // this.DynamicFGroup.addControl('PCI_Intervention_Wire_Crossing_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'PCI_Intervention_Balloon_Dilatation_Date' && !KeyDatabase.includes('PCI_Intervention_Balloon_Dilatation_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'PCI_Intervention_Balloon_Dilatation_Date';
               NewObj.Name = 'PCI Intervention Balloon Dilatation Time';
               NewObj.Key_Name = 'PCI_Intervention_Balloon_Dilatation_Time';
               this.AllFieldsValues.push(NewObj);
               // this.DynamicFGroup.addControl('PCI_Intervention_Balloon_Dilatation_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'PCI_Intervention_Stenting_Date_Time' && !KeyDatabase.includes('PCI_Intervention_Stenting_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'PCI_Intervention_Stenting_Date_Time';
               NewObj.Name = 'PCI Intervention Vessel Stenting Time';
               NewObj.Key_Name = 'PCI_Intervention_Stenting_Time';
               this.AllFieldsValues.push(NewObj);
               // this.DynamicFGroup.addControl('PCI_Intervention_Stenting_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'PCI_Intervention_Vessel_Balloon_Dilatation_Date' && !KeyDatabase.includes('PCI_Intervention_Vessel_Balloon_Dilatation_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'PCI_Intervention_Vessel_Balloon_Dilatation_Date';
               NewObj.Name = 'PCI Intervention Vessel Balloon Dilatation Time';
               NewObj.Key_Name = 'PCI_Intervention_Vessel_Balloon_Dilatation_Time';
               this.AllFieldsValues.push(NewObj);
               // this.DynamicFGroup.addControl('PCI_Intervention_Vessel_Balloon_Dilatation_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
				if (obj.Key_Name === 'PCI_Intervention_Vessel_Wire_Crossing_Date_Time' && !KeyDatabase.includes('PCI_Intervention_Vessel_Wire_Crossing_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'PCI_Intervention_Vessel_Wire_Crossing_Date_Time';
               NewObj.Name = 'Pci Intervention Vessel Wire Crossing Time';
               NewObj.Key_Name = 'PCI_Intervention_Vessel_Wire_Crossing_Time';
               this.AllFieldsValues.push(NewObj);
            }
            if (obj.Key_Name === 'PCI_Intervention_Vessel_Stenting_Date_Time' && !KeyDatabase.includes('PCI_Intervention_Vessel_Stenting_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'PCI_Intervention_Vessel_Stenting_Date_Time';
               NewObj.Name = 'PCI Intervention Vessel Stenting Time';
               NewObj.Key_Name = 'PCI_Intervention_Vessel_Stenting_Time';
               this.AllFieldsValues.push(NewObj);
               // this.DynamicFGroup.addControl('PCI_Intervention_Vessel_Stenting_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'Anti_Thrombotics_Unfractionated_Heparin_Dosage_Date' && !KeyDatabase.includes('Anti_Thrombotics_Unfractionated_Heparin_Dosage_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Anti_Thrombotics_Unfractionated_Heparin_Dosage_Date';
               NewObj.Name = 'Anti Thrombotics Unfractionated Heparin Dosage Time';
               NewObj.Key_Name = 'Anti_Thrombotics_Unfractionated_Heparin_Dosage_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Anti_Thrombotics_Unfractionated_Heparin_Dosage_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'Anti_Thrombotics_LMW_Heparin_Dosage_Date' && !KeyDatabase.includes('Anti_Thrombotics_LMW_Heparin_Dosage_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Anti_Thrombotics_LMW_Heparin_Dosage_Date';
               NewObj.Name = 'Anti Thrombotics LMW Heparin Dosage Time';
               NewObj.Key_Name = 'Anti_Thrombotics_LMW_Heparin_Dosage_Time';
               this.AllFieldsValues.push(NewObj);
               this.DynamicFGroup.addControl('Anti_Thrombotics_LMW_Heparin_Dosage_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
            if (obj.Key_Name === 'Anti_Thrombotics_Other_Medicine_Dosage_Date_Time' && !KeyDatabase.includes('Anti_Thrombotics_Other_Medicine_Dosage_Time')) {
               NewObj.ThisIsTime = true;
               NewObj.ParentDateKey = 'Anti_Thrombotics_Other_Medicine_Dosage_Date_Time';
               NewObj.Name = 'Anti Thrombotics Other Medicine Dosage Time';
               NewObj.Key_Name = 'Anti_Thrombotics_Other_Medicine_Dosage_Time';
               this.AllFieldsValues.push(NewObj);
               // this.DynamicFGroup.addControl('Anti_Thrombotics_Other_Medicine_Dosage_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
            }
         });
         if (this.TabsList[this.CurrentTabIndex] === 'Drug_Before_Pci') {
            this.DynamicFGroup.addControl('DrugsBeforePCIOthersArray', new FormArray([]));
            if (this.DrugsBeforePCIOthersData.length > 0) {
               this.DrugsBeforePCIOthersDataUpdate();
            }
         }
         if (this.TabsList[this.CurrentTabIndex] === 'PCI') {
            this.DynamicFGroup.addControl('CulpritVesselArray', new FormArray([]));
            this.DynamicFGroup.addControl('CulpritVesselBasicArray', new FormArray([]));
            this.DynamicFGroup.addControl('VesselArray', new FormArray([]));
            this.DynamicFGroup.addControl('VesselBasicArray', new FormArray([]));
            this.PciYesOrNoValidation();
         }
         if (this.TabsList[this.CurrentTabIndex] === 'Medication_in_Cath') {
            this.DynamicFGroup.addControl('IntraCoronaryDrugsOthersArray', new FormArray([]));
            if (this.IntraCoronaryDrugsOthersData.length > 0) {
               this.IntraCoronaryDrugsOthersDataUpdate();
            }
            this.DynamicFGroup.addControl('InhibitorsOthersArray', new FormArray([]));
            if (this.InhibitorsOthersData.length > 0) {
               this.InhibitorsOthersDataUpdate();
            }
            this.DynamicFGroup.addControl('AntiThromboticsOthersArray', new FormArray([]));
            if (this.AntiThromboticsOthersData.length > 0) {
               this.AntiThromboticsOthersDataUpdate();
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


   DrugsBeforePCIOthersDataUpdate() {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.DrugsBeforePCIOthersArrayFields.includes(obj.Key_Name));
      this.DrugsBeforePCIOthersData.map(OBJ => {
         const NewFGroup = new FormGroup({});
         FilteredFields.map(obj => {
            let SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
            if (obj.Key_Name === 'Pci_Drug_Before_Pci_Other_Medicine_Time') {
               if (OBJ['Pci_Drug_Before_Pci_Other_Medicine_Date_Time'] !== null && OBJ['Pci_Drug_Before_Pci_Other_Medicine_Date_Time'] !== '') {
                  const DateTime = new Date(OBJ['Pci_Drug_Before_Pci_Other_Medicine_Date_Time']);
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
         this.DrugsBeforePCIOthersArray = this.DynamicFGroup.get('DrugsBeforePCIOthersArray') as FormArray;
         this.DrugsBeforePCIOthersArray.push(NewFGroup);
      });
      if (this.DrugsBeforePCIOthersData.length > 0 && !this.ReadonlyPage) {
         this.DrugsBeforePCIArrayValueChangesMonitoring();
      }
   }

   CulpritVesselBasicDataUpdate() {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.CulpritVesselArrayBasicFields.includes(obj.Key_Name));
      this.CulpritVesselData.map(OBJ => {
         const NewFGroup = new FormGroup({});
         FilteredFields.map(obj => {
            let SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
            SetValue = (OBJ[obj.Key_Name] && OBJ[obj.Key_Name] !== null && OBJ[obj.Key_Name] !== '') ? OBJ[obj.Key_Name] : SetValue;
            let FormControlValidation = null;
            if (obj.Mandatory || obj.Validation) {
               FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
            }
            NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
         });
         this.CulpritVesselBasicArray = this.DynamicFGroup.get('CulpritVesselBasicArray') as FormArray;
         this.CulpritVesselBasicArray.push(NewFGroup);
         this.CulpritVesselDataUpdate(OBJ, NewFGroup.valid);
      });
   }
   VesselBasicDataUpdate() {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.VesselArrayBasicFields.includes(obj.Key_Name));
      this.VesselData.map(OBJ => {
         const NewFGroup = new FormGroup({});
         FilteredFields.map(obj => {
            let SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
            SetValue = (OBJ[obj.Key_Name] && OBJ[obj.Key_Name] !== null && OBJ[obj.Key_Name] !== '') ? OBJ[obj.Key_Name] : SetValue;
            let FormControlValidation = null;
            if (obj.Mandatory || obj.Validation) {
               FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
            }
            NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
         });
         this.VesselBasicArray = this.DynamicFGroup.get('VesselBasicArray') as FormArray;
         this.VesselBasicArray.push(NewFGroup);
         this.VesselDataUpdate(OBJ, NewFGroup.valid);

      });
   }
   CulpritVesselDataUpdate(Data: any, Status: boolean) {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.CulpritVesselArrayFields.includes(obj.Key_Name));
      const NewFGroup = new FormGroup({});
      FilteredFields.map(obj => {
         let SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
         if (obj.Key_Name === 'PCI_Intervention_Wire_Crossing_Time') {
            if (Data['PCI_Intervention_Wire_Crossing_Date_Time'] !== undefined && Data['PCI_Intervention_Wire_Crossing_Date_Time'] !== null && Data['PCI_Intervention_Wire_Crossing_Date_Time'] !== '') {
               const DateTime = new Date(Data['PCI_Intervention_Wire_Crossing_Date_Time']);
               SetValue = DateTime.getHours() + ':' + DateTime.getMinutes();
            }
         } else if (obj.Key_Name === 'PCI_Intervention_Balloon_Dilatation_Time') {
            if (Data['PCI_Intervention_Balloon_Dilatation_Date'] !== undefined && Data['PCI_Intervention_Balloon_Dilatation_Date'] !== null && Data['PCI_Intervention_Balloon_Dilatation_Date'] !== '') {
               const DateTime = new Date(Data['PCI_Intervention_Balloon_Dilatation_Date']);
               SetValue = DateTime.getHours() + ':' + DateTime.getMinutes();
            }
         } else if (obj.Key_Name === 'PCI_Intervention_Stenting_Time') {
            if (Data['PCI_Intervention_Stenting_Date_Time'] !== undefined && Data['PCI_Intervention_Stenting_Date_Time'] !== null && Data['PCI_Intervention_Stenting_Date_Time'] !== '') {
               const DateTime = new Date(Data['PCI_Intervention_Stenting_Date_Time']);
               SetValue = DateTime.getHours() + ':' + DateTime.getMinutes();
            }
         } else {
            SetValue = (Data[obj.Key_Name] !== undefined && Data[obj.Key_Name] !== null && Data[obj.Key_Name] !== '') ? Data[obj.Key_Name] : SetValue;
         }
         let FormControlValidation = null;
         if (obj.Mandatory || obj.Validation) {
            FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
         }
         if (obj.Key_Name === 'Pci_Culprit_Vessel' || obj.Key_Name === 'Pci_Culprit_Vessel_Percent') {
            NewFGroup.addControl(obj.Key_Name, new FormControl({value: SetValue, disabled: true}));
         } else if (obj.Key_Name === 'Culprit_Vessel_Intervention' && !Status) {
            NewFGroup.addControl(obj.Key_Name, new FormControl({value: false, disabled: true}, FormControlValidation));
         } else {
            NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
         }
      });
      this.CulpritVesselArray = this.DynamicFGroup.get('CulpritVesselArray') as FormArray;
      this.CulpritVesselArray.push(NewFGroup);
      this.CulpritVesselBasicArrayValueChangesMonitoring();
      if (!this.ReadonlyPage) {
         this.CulpritVesselArrayValueChangesMonitoring();
         this.CulpritVesselYesOrNoValidations();
      }
   }
   VesselDataUpdate(Data: any, Status: boolean) {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.VesselArrayFields.includes(obj.Key_Name));
      const NewFGroup = new FormGroup({});
      FilteredFields.map(obj => {
         let SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
         if (obj.Key_Name === 'PCI_Intervention_Vessel_Balloon_Dilatation_Time') {
            if (Data['PCI_Intervention_Vessel_Balloon_Dilatation_Date'] !== undefined && Data['PCI_Intervention_Vessel_Balloon_Dilatation_Date'] !== null && Data['PCI_Intervention_Vessel_Balloon_Dilatation_Date'] !== '') {
               const DateTime = new Date(Data['PCI_Intervention_Vessel_Balloon_Dilatation_Date']);
               SetValue = DateTime.getHours() + ':' + DateTime.getMinutes();
            }
			} else if (obj.Key_Name === 'PCI_Intervention_Vessel_Wire_Crossing_Time') {
            if (Data['PCI_Intervention_Vessel_Wire_Crossing_Date_Time'] !== undefined && Data['PCI_Intervention_Vessel_Wire_Crossing_Date_Time'] !== null && Data['PCI_Intervention_Vessel_Wire_Crossing_Date_Time'] !== '') {
               const DateTime = new Date(Data['PCI_Intervention_Vessel_Wire_Crossing_Date_Time']);
               SetValue = DateTime.getHours() + ':' + DateTime.getMinutes();
            }
         } else if (obj.Key_Name === 'PCI_Intervention_Vessel_Stenting_Time') {
            if (Data['PCI_Intervention_Vessel_Stenting_Date_Time'] !== undefined && Data['PCI_Intervention_Vessel_Stenting_Date_Time'] !== null && Data['PCI_Intervention_Vessel_Stenting_Date_Time'] !== '') {
               const DateTime = new Date(Data['PCI_Intervention_Vessel_Stenting_Date_Time']);
               SetValue = DateTime.getHours() + ':' + DateTime.getMinutes();
            }
         } else {
            SetValue = (Data[obj.Key_Name] !== undefined && Data[obj.Key_Name] !== null && Data[obj.Key_Name] !== '') ? Data[obj.Key_Name] : SetValue;
         }
         let FormControlValidation = null;
         if (obj.Mandatory || obj.Validation) {
            FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
         }
         if (obj.Key_Name === 'Pci_Cart_Vessel' || obj.Key_Name === 'Pci_Cart_Vessel_Percent') {
            NewFGroup.addControl(obj.Key_Name, new FormControl({value: SetValue, disabled: true}));
         } else if (obj.Key_Name === 'PCI_Vessel_Intervention' && !Status) {
            NewFGroup.addControl(obj.Key_Name, new FormControl({value: false, disabled: true}, FormControlValidation));
         } else {
            NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
         }
      });
      this.VesselArray = this.DynamicFGroup.get('VesselArray') as FormArray;
      this.VesselArray.push(NewFGroup);
      this.VesselBasicArrayValueChangesMonitoring();
      if (!this.ReadonlyPage) {
         this.VesselArrayValueChangesMonitoring();
         this.VesselYesOrNoValidations();
      }
   }
   IntraCoronaryDrugsOthersDataUpdate() {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.IntraCoronaryDrugsOthersArrayFields.includes(obj.Key_Name));
      this.IntraCoronaryDrugsOthersData.map(OBJ => {
         const NewFGroup = new FormGroup({});
         FilteredFields.map(obj => {
            let SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
            SetValue = (OBJ[obj.Key_Name] && OBJ[obj.Key_Name] !== null && OBJ[obj.Key_Name] !== '') ? OBJ[obj.Key_Name] : SetValue;
            let FormControlValidation = null;
            if (obj.Mandatory || obj.Validation) {
               FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
            }
            NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation));
         });
         this.IntraCoronaryDrugsOthersArray = this.DynamicFGroup.get('IntraCoronaryDrugsOthersArray') as FormArray;
         this.IntraCoronaryDrugsOthersArray.push(NewFGroup);
      });
   }
   InhibitorsOthersDataUpdate() {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.InhibitorsOthersDataFields.includes(obj.Key_Name));
      this.InhibitorsOthersData.map(OBJ => {
         const NewFGroup = new FormGroup({});
         FilteredFields.map(obj => {
            let SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
            SetValue = (OBJ[obj.Key_Name] && OBJ[obj.Key_Name] !== null && OBJ[obj.Key_Name] !== '') ? OBJ[obj.Key_Name] : SetValue;
            let FormControlValidation = null;
            if (obj.Mandatory || obj.Validation) {
               FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
            }
            NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation));
         });
         this.InhibitorsOthersArray = this.DynamicFGroup.get('InhibitorsOthersArray') as FormArray;
         this.InhibitorsOthersArray.push(NewFGroup);
      });
   }
   AntiThromboticsOthersDataUpdate() {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.AntiThromboticsOthersArrayFields.includes(obj.Key_Name));
      this.AntiThromboticsOthersData.map(OBJ => {
         const NewFGroup = new FormGroup({});
         FilteredFields.map(obj => {
            let SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
            if (obj.Key_Name === 'Anti_Thrombotics_Other_Medicine_Dosage_Time') {
               if (OBJ['Anti_Thrombotics_Other_Medicine_Dosage_Date_Time'] !== null && OBJ['Anti_Thrombotics_Other_Medicine_Dosage_Date_Time'] !== '') {
                  const DateTime = new Date(OBJ['Anti_Thrombotics_Other_Medicine_Dosage_Date_Time']);
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
         this.AntiThromboticsOthersArray = this.DynamicFGroup.get('AntiThromboticsOthersArray') as FormArray;
         this.AntiThromboticsOthersArray.push(NewFGroup);
      });
      if (this.AntiThromboticsOthersData.length > 0 && !this.ReadonlyPage) {
         this.AntiThromboticsOthersArrayValueChangesMonitoring();
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
      FormControlsArray = FormControlsArray.filter(obj => obj !== 'DrugsBeforePCIOthersArray'
                                                         && obj !== 'CulpritVesselArray'
                                                         && obj !== 'VesselArray'
                                                         && obj !== 'IntraCoronaryDrugsOthersArray'
                                                         && obj !== 'InhibitorsOthersArray'
                                                         && obj !== 'AntiThromboticsOthersArray');
      FormControlsArray.map(controlName => {
         if (controlName !== 'Location_of_Infarction') {
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
                           this.DynamicFGroup.get(this.AllFieldsValues[TimeFieldIndex].Key_Name).setValue(RelatedTime);
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
                           const CheckCulpritVesselFields = SubscribeLimitControl.filter(obj1 => this.CulpritVesselArrayFields.includes(obj1));
                           const CheckVesselFields = SubscribeLimitControl.filter(obj1 => this.VesselArrayFields.includes(obj1));
                           SubscribeLimitControl = SubscribeLimitControl.filter(obj1 => !this.AllArrayFields.includes(obj1));
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
                              this.DynamicFGroup.get(CKey).markAsDirty();
                              this.DynamicFGroup.get(CKey).markAsTouched();
                              this.DynamicFGroup.get(CKey).updateValueAndValidity();
                           }
                           if (CheckCulpritVesselFields.length > 0) {
                              const FArray = this.DynamicFGroup.get('CulpritVesselArray') as FormArray;
                              FArray.controls.map(FGObject => {
                                 const FGroup = FGObject as FormGroup;
                                 CheckCulpritVesselFields.map(FKey => {
                                    FGroup.get(FKey).markAsDirty();
                                    FGroup.get(FKey).markAsTouched();
                                    FGroup.get(FKey).updateValueAndValidity();
                                 });
                              });
                           }
                           if (CheckVesselFields.length > 0) {
                              const FArrayNew = this.DynamicFGroup.get('VesselArray') as FormArray;
                              FArrayNew.controls.map(FGObject => {
                                 const FGroup = FGObject as FormGroup;
                                 CheckVesselFields.map(FKey => {
                                    FGroup.get(FKey).markAsDirty();
                                    FGroup.get(FKey).markAsTouched();
                                    FGroup.get(FKey).updateValueAndValidity();
                                 });
                              });
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
            if ( !this.AllArrayFields.includes(obj.Key_Name) && !obj.ThisIsTime && obj.Key_Name !== 'PCI' ) {
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

   PciYesOrNoValidation() {
      const FControl = this.DynamicFGroup.get('PCI') as FormControl;
      if (this.CulpritVesselData.length > 0) {
         this.CulpritVesselBasicDataUpdate();
      }
      if (this.VesselData.length > 0) {
         this.VesselBasicDataUpdate();
      }
      this.subscription.add(
         FControl.valueChanges.subscribe(change => {
            const FArrayOne = this.DynamicFGroup.controls.CulpritVesselBasicArray as FormArray;
            const LengthOne = FArrayOne.controls.length;
            const FArrayTwo = this.DynamicFGroup.controls.VesselBasicArray as FormArray;
            const LengthTwo = FArrayTwo.controls.length;
            if (change === 'Yes') {
               if (LengthOne === 0) {
                  this.AddArrayControlBasicCulpritVessel();
               }
               if (LengthTwo === 0) {
                  this.AddArrayControlBasicVessel();
               }
            } else {
               this.CulpritVesselData = [];
               this.VesselData = [];
               for (let index = 0; index < LengthOne; index++) {
                  this.removeArrayControlBasicCulpritVessel(index);
               }
               for (let index = 0; index < LengthTwo; index++) {
                  this.removeArrayControlBasicVessel(index);
               }
            }
         })
      );
   }

   DrugsBeforePCIArrayValueChangesMonitoring() {
      this.DrugsBeforePCISubscription.unsubscribe();
      this.DrugsBeforePCISubscription = new Subscription();
      const FArray = this.DynamicFGroup.get('DrugsBeforePCIOthersArray') as FormArray;
      FArray.controls.map((obj, i) => {
         const FGroup = obj as FormGroup;
         const FGroupKeys = Object.keys(FGroup.controls);
         FGroupKeys.map(controlName => {
            const FControl = FGroup.controls[controlName] as FormControl;
            if (!FControl.disabled) {
               this.DrugsBeforePCISubscription.add(
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
   CulpritVesselBasicArrayValueChangesMonitoring() {
      this.CulpritVesselBasicSubscription.unsubscribe();
      this.CulpritVesselBasicSubscription = new Subscription();
      const FArray = this.DynamicFGroup.get('CulpritVesselBasicArray') as FormArray;
      FArray.controls.map((obj, i) => {
         const FGroup = obj as FormGroup;
         this.CulpritVesselBasicSubscription.add(
            FGroup.valueChanges.subscribe(change => {
               const FFArray = this.DynamicFGroup.get('CulpritVesselArray') as FormArray;
               const FFGroup = FFArray.controls[i] as FormGroup;
               FFGroup.controls.Pci_Culprit_Vessel.setValue(change['Pci_Culprit_Vessel']);
               FFGroup.controls.Pci_Culprit_Vessel_Percent.setValue(change['Pci_Culprit_Vessel_Percent']);
               // FGroup.updateValueAndValidity();
               if (FGroup.invalid) {
                  FFGroup.controls.Culprit_Vessel_Intervention.setValue(false);
                  FFGroup.controls.Culprit_Vessel_Intervention.disable();
               } else {
                  if (!this.ReadonlyPage) {
                     FFGroup.controls.Culprit_Vessel_Intervention.enable();
                  }
               }
            })
         );
      });
   }
   CulpritVesselArrayValueChangesMonitoring() {
      this.CulpritVesselSubscription.unsubscribe();
      this.CulpritVesselSubscription = new Subscription();
      const FArray = this.DynamicFGroup.get('CulpritVesselArray') as FormArray;
      FArray.controls.map((obj, i) => {
         const FGroup = obj as FormGroup;
         const FGroupKeys = Object.keys(FGroup.controls);
         FGroupKeys.map(controlName => {
            const FControl = FGroup.controls[controlName] as FormControl;
            if (!FControl.disabled) {
               this.CulpritVesselSubscription.add(
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
                           // if (TimeHotReload) {
                           //    FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setValue(RelatedTime);
                           // } else {
                           FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setValue(RelatedTime, { emitEvent: false });
                           // }
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
   VesselBasicArrayValueChangesMonitoring() {
      this.VesselBasicSubscription.unsubscribe();
      this.VesselBasicSubscription = new Subscription();
      const FArray = this.DynamicFGroup.get('VesselBasicArray') as FormArray;
      FArray.controls.map((obj, i) => {
         const FGroup = obj as FormGroup;
         this.VesselBasicSubscription.add(
            FGroup.valueChanges.subscribe(change => {
               const FFArray = this.DynamicFGroup.get('VesselArray') as FormArray;
               const FFGroup = FFArray.controls[i] as FormGroup;
               FFGroup.controls.Pci_Cart_Vessel.setValue(change['Pci_Cart_Vessel']);
               FFGroup.controls.Pci_Cart_Vessel_Percent.setValue(change['Pci_Cart_Vessel_Percent']);
               if (FGroup.invalid) {
                  FFGroup.controls.PCI_Vessel_Intervention.setValue(false);
                  FFGroup.controls.PCI_Vessel_Intervention.disable();
               } else {
                  if (!this.ReadonlyPage) {
                     FFGroup.controls.PCI_Vessel_Intervention.enable();
                  }
               }
            })
         );
      });
   }
   VesselArrayValueChangesMonitoring() {
      this.VesselSubscription.unsubscribe();
      this.VesselSubscription = new Subscription();
      const FArray = this.DynamicFGroup.get('VesselArray') as FormArray;
      FArray.controls.map((obj, i) => {
         const FGroup = obj as FormGroup;
         const FGroupKeys = Object.keys(FGroup.controls);
         FGroupKeys.map(controlName => {
            const FControl = FGroup.controls[controlName] as FormControl;
            if (!FControl.disabled) {
               this.VesselSubscription.add(
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
                           // if (TimeHotReload) {
                           //    FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setValue(RelatedTime);
                           // } else {
                           FGroup.get(this.AllFieldsValues[FieldIndex].TimeKeyName).setValue(RelatedTime, { emitEvent: false });
                           // }
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

   AntiThromboticsOthersArrayValueChangesMonitoring() {
      this.AntiThromboticsOthersSubscription.unsubscribe();
      this.AntiThromboticsOthersSubscription = new Subscription();
      const FArray = this.DynamicFGroup.get('AntiThromboticsOthersArray') as FormArray;
      FArray.controls.map((obj, i) => {
         const FGroup = obj as FormGroup;
         const FGroupKeys = Object.keys(FGroup.controls);
         FGroupKeys.map(controlName => {
            const FControl = FGroup.controls[controlName] as FormControl;
            if (!FControl.disabled) {
               this.AntiThromboticsOthersSubscription.add(
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

   AddArrayControlDrugsBeforePCIOthers() {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.DrugsBeforePCIOthersArrayFields.includes(obj.Key_Name));
      const NewFGroup = new FormGroup({});
      FilteredFields.map(obj => {
         const SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
         let FormControlValidation = null;
         if (obj.Mandatory || obj.Validation) {
            FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
         }
         NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
      });
      this.DrugsBeforePCIOthersArray = this.DynamicFGroup.get('DrugsBeforePCIOthersArray') as FormArray;
      this.DrugsBeforePCIOthersArray.push(NewFGroup);
      setTimeout(() => {
         this.DrugsBeforePCIArrayValueChangesMonitoring();
      }, 100);
   }
   AddArrayControlBasicCulpritVessel() {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.CulpritVesselArrayBasicFields.includes(obj.Key_Name));
      const NewFGroup = new FormGroup({});
      FilteredFields.map(obj => {
         const SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
         let FormControlValidation = null;
         if (obj.Mandatory || obj.Validation) {
            FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
         }
         NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
      });
      this.CulpritVesselBasicArray = this.DynamicFGroup.get('CulpritVesselBasicArray') as FormArray;
      this.CulpritVesselBasicArray.push(NewFGroup);
      this.CulpritVesselDataUpdate({}, false);
   }
   AddArrayControlBasicVessel() {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.VesselArrayBasicFields.includes(obj.Key_Name));
      const NewFGroup = new FormGroup({});
      FilteredFields.map(obj => {
         const SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
         let FormControlValidation = null;
         if (obj.Mandatory || obj.Validation) {
            FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
         }
         NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
      });
      this.VesselBasicArray = this.DynamicFGroup.get('VesselBasicArray') as FormArray;
      this.VesselBasicArray.push(NewFGroup);
      this.VesselDataUpdate({}, false);
   }
   AddArrayControlIntraCoronaryDrugsOthers() {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.IntraCoronaryDrugsOthersArrayFields.includes(obj.Key_Name));
      const NewFGroup = new FormGroup({});
      FilteredFields.map(obj => {
         const SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
         let FormControlValidation = null;
         if (obj.Mandatory || obj.Validation) {
            FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
         }
         NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
      });
      this.IntraCoronaryDrugsOthersArray = this.DynamicFGroup.get('IntraCoronaryDrugsOthersArray') as FormArray;
      this.IntraCoronaryDrugsOthersArray.push(NewFGroup);
   }
   AddArrayControlInhibitorsOthersArray() {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.InhibitorsOthersDataFields.includes(obj.Key_Name));
      const NewFGroup = new FormGroup({});
      FilteredFields.map(obj => {
         const SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
         let FormControlValidation = null;
         if (obj.Mandatory || obj.Validation) {
            FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
         }
         NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
      });
      this.InhibitorsOthersArray = this.DynamicFGroup.get('InhibitorsOthersArray') as FormArray;
      this.InhibitorsOthersArray.push(NewFGroup);
   }
   AddArrayControlAntiThromboticsOthers() {
      const FilteredFields = this.AllFieldsValues.filter(obj => this.AntiThromboticsOthersArrayFields.includes(obj.Key_Name));
      const NewFGroup = new FormGroup({});
      FilteredFields.map(obj => {
         const SetValue = (obj.Type === 'Select' || obj.Type === 'Date' || obj.Type === 'Number' || obj.Type === 'Boolean' ) ? null : '';
         let FormControlValidation = null;
         if (obj.Mandatory || obj.Validation) {
            FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
         }
         NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
      });
      this.AntiThromboticsOthersArray = this.DynamicFGroup.get('AntiThromboticsOthersArray') as FormArray;
      this.AntiThromboticsOthersArray.push(NewFGroup);
      setTimeout(() => {
         this.AntiThromboticsOthersArrayValueChangesMonitoring();
      }, 100);
   }

   removeArrayControlDrugsBeforePCIOthers(index: any) {
      this.DrugsBeforePCIOthersArray.removeAt(index);
      setTimeout(() => {
         this.DrugsBeforePCIArrayValueChangesMonitoring();
      }, 100);
   }
   removeArrayControlBasicCulpritVessel(index: any) {
      this.CulpritVesselBasicArray.removeAt(index);
      this.CulpritVesselArray.removeAt(index);
      setTimeout(() => {
         this.CulpritVesselArrayValueChangesMonitoring();
         this.CulpritVesselYesOrNoValidations();
      }, 100);
   }
   removeArrayControlBasicVessel(index: any) {
      this.VesselBasicArray.removeAt(index);
      this.VesselArray.removeAt(index);
      setTimeout(() => {
         this.VesselArrayValueChangesMonitoring();
         this.VesselYesOrNoValidations();
      }, 100);
   }
   removeArrayControlIntraCoronaryDrugsOthers(index: any) {
      this.IntraCoronaryDrugsOthersArray.removeAt(index);
   }
   removeArrayControlInhibitorsOthers(index: any) {
      this.InhibitorsOthersArray.removeAt(index);
   }
   removeArrayControlAntiThromboticsOthers(index: any) {
      this.AntiThromboticsOthersArray.removeAt(index);
      setTimeout(() => {
         this.AntiThromboticsOthersArrayValueChangesMonitoring();
      }, 100);
   }

   CheckTimeRelatedDateErrorStatus(DateKey: any, TimeKey: any) {
      if (this.DynamicFGroup.get(DateKey)) {
         return (this.DynamicFGroup.get(DateKey).errors !== null) ? true :
                  (this.DynamicFGroup.get(TimeKey).errors !== null) ? true : false;
      } else {
         return (this.DynamicFGroup.get(TimeKey).errors !== null) ? true : false;
      }
   }

   CheckTimeRelatedDateErrorStatusInArray(ArrayKey: any, DateKey: any, Index: any, TimeKey: any) {
      const FArray = this.DynamicFGroup.get(ArrayKey) as FormArray;
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

   CheckDisable(KeyName: any, Index?: any) {
      let FControl: FormControl;
      if (this.DrugsBeforePCIOthersArrayFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('DrugsBeforePCIOthersArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.CulpritVesselArrayBasicFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('CulpritVesselBasicArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.CulpritVesselArrayFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('CulpritVesselArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.VesselArrayBasicFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('VesselBasicArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.VesselArrayFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('VesselArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.IntraCoronaryDrugsOthersArrayFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('IntraCoronaryDrugsOthersArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.InhibitorsOthersDataFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('InhibitorsOthersArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      } else if (this.AntiThromboticsOthersArrayFields.includes(KeyName)) {
         const FArray = this.DynamicFGroup.get('AntiThromboticsOthersArray') as FormArray;
         const FGroup = FArray.controls[Index] as FormGroup;
         FControl = FGroup.get(KeyName) as FormControl;
      }  else {
         FControl = this.DynamicFGroup.get(KeyName) as FormControl;
      }
      return FControl.disabled;
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

   CommonValidatorsSet(control: any, IsTime: boolean, DateControl: any, ArrayKey?: any, ArrayIndex?: any) {
      const ControlKey = IsTime ? DateControl : control;
      const Index = this.AllFieldsValues.findIndex(obj => obj.Key_Name === ControlKey);
      const DataObject = this.AllFieldsValues[Index];
      let FormControlValidation = null;
      if (DataObject.Mandatory || DataObject.Validation) {
         FormControlValidation = Validators.compose([ this.CustomDynamicValidation(DataObject), Validators.min(DataObject.Min_Number_Value), Validators.max(DataObject.Max_Number_Value) ]);
      }
      let FControl: FormControl;
      if (ArrayKey !== undefined && ArrayKey !== '' && ArrayIndex !== undefined && ArrayIndex !== null && ArrayIndex >= 0) {
         const FArray = this.DynamicFGroup.get(ArrayKey) as FormArray;
         const FGroup = FArray.controls[ArrayIndex] as FormGroup;
         FControl = FGroup.get(control) as FormControl;
      } else {
         FControl = this.DynamicFGroup.get(control) as FormControl;
      }
      FControl.setValidators(FormControlValidation);
   }

   CommonInputReset(control: any, value: any, ArrayKey?: any, ArrayIndex?: any) {
      let FControl: FormControl;
      if (ArrayKey !== undefined && ArrayKey !== '' && ArrayIndex !== undefined && ArrayIndex !== null && ArrayIndex >= 0) {
         const FArray = this.DynamicFGroup.get(ArrayKey) as FormArray;
         const FGroup = FArray.controls[ArrayIndex] as FormGroup;
         FControl = FGroup.get(control) as FormControl;
      } else {
         FControl = this.DynamicFGroup.get(control) as FormControl;
      }
      FControl.setValue(value);
      FControl.clearValidators();
      FControl.setErrors(null);
      FControl.markAsPristine();
      FControl.markAsUntouched();
      FControl.updateValueAndValidity();
   }

   YesOrNoValidations() {
      const PCINoFields = ['PCI_No_Distal_lesion', 'PCI_No_Tortuosity', 'PCI_No_Small_vessel', 'PCI_No_Non_significant_lesion', 'PCI_No_Other_Reason', 'PCI_No_Successful_lysis'];
      const FControlKeys = Object.keys(this.DynamicFGroup.controls);
      FControlKeys.map(obj => {
         if (obj !== 'DrugsBeforePCIOthersArray' && obj !== 'CulpritVesselArray' && obj !== 'VesselArray' && obj !== 'IntraCoronaryDrugsOthersArray' && obj !== 'InhibitorsOthersArray' && obj !== 'AntiThromboticsOthersArray') {
            const LimitArr = this.AllFieldsValues.filter(obj1 => obj1.Key_Name === obj &&  (obj1.Type === 'Select' || obj1.Type === 'Boolean'));
            if (LimitArr.length > 0) {
               const Parent = LimitArr[0];
               let ChildeArr =  this.AllFieldsValues.filter(obj1 => obj1.If_Parent_Available && obj1.Parent.Key_Name === Parent.Key_Name);
               ChildeArr = ChildeArr.filter(obj1 => !this.AllArrayFields.includes(obj1.Key_Name));
               if (ChildeArr.length > 0) {
                  this.subscription.add(
                     this.DynamicFGroup.controls[Parent.Key_Name].valueChanges.subscribe(change => {
                        if (change === 'Yes' || change === 'No' || change === 'DontKnow' ||  change === '' || change === null || change === true || change === false) {
                           if ((change === 'Yes' && Parent.Key_Name !== 'PCI_Management_Conservative') || change === true || (Parent.Key_Name === 'PCI_Management_Conservative' && change === 'No')) {
                              ChildeArr.map(obj2 => {
                                 if ((Parent.Key_Name === 'PCI' && obj2.Key_Name !== 'PCI_No_Reason') || (Parent.Key_Name === 'PCI_Management_PCI' && !PCINoFields.includes(obj2.Key_Name)) || (Parent.Key_Name !== 'PCI' && Parent.Key_Name !== 'PCI_Management_PCI')  ) {
                                    this.CommonValidatorsSet(obj2.Key_Name, obj2.ThisIsTime, obj2.ParentDateKey);
                                 } else {
                                    const SetValue = (obj2.Type === 'Select' || obj2.Type === 'Date' || obj2.Type === 'Number' || obj2.Type === 'Boolean' ) ? null : '';
                                    this.CommonInputReset(obj2.Key_Name, SetValue);
                                 }
                              });
                           } else {
                              ChildeArr.map(obj2 => {
                                 if ((Parent.Key_Name === 'PCI' && change === 'No' && obj2.Key_Name === 'PCI_No_Reason') || (Parent.Key_Name === 'PCI_Management_PCI' && change === 'No' && PCINoFields.includes(obj2.Key_Name))) {
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
         }
      });
   }

   CulpritVesselYesOrNoValidations() {
      this.CulpritVesselYesOrNoSubscription.unsubscribe();
      this.CulpritVesselYesOrNoSubscription = new Subscription();
      const FArray = this.DynamicFGroup.get('CulpritVesselArray') as FormArray;
      FArray.controls.map( (obj, index) => {
         const FGroup = obj as FormGroup;
         const FControlKeys = Object.keys(FGroup.controls);
         FControlKeys.map(objNew => {
            const LimitArr = this.AllFieldsValues.filter(obj1 => obj1.Key_Name === objNew &&  (obj1.Type === 'Select' || obj1.Type === 'Boolean'));
            if (LimitArr.length > 0) {
               const Parent = LimitArr[0];
               let ChildeArr =  this.AllFieldsValues.filter(obj1 => obj1.If_Parent_Available && obj1.Parent.Key_Name === Parent.Key_Name);
               ChildeArr = ChildeArr.filter(obj1 => this.CulpritVesselArrayFields.includes(obj1.Key_Name));
               if (ChildeArr.length > 0) {
                  this.CulpritVesselYesOrNoSubscription.add(
                     FGroup.controls[Parent.Key_Name].valueChanges.subscribe(change => {
                        if (change === 'Yes' || change === 'No' || change === 'DontKnow' ||  change === '' || change === null || change === true || change === false) {
                           if (change === 'Yes' || change === true) {
										if (Parent.Key_Name === 'PCI_Intervention_Balloon_Dilatation' && change === 'Yes') {
											ChildeArr.map(obj2 => {
												if (obj2.Key_Name === 'PCI_Intervention_Wire_Crossing') {
													const SetValue = (obj2.Type === 'Select' || obj2.Type === 'Date' || obj2.Type === 'Number' || obj2.Type === 'Boolean' ) ? null : '';
													this.CommonInputReset(obj2.Key_Name, SetValue, 'CulpritVesselArray', index);
												} else {
													this.CommonValidatorsSet(obj2.Key_Name, obj2.ThisIsTime, obj2.ParentDateKey, 'CulpritVesselArray', index);
												}
											});
										} else {
											ChildeArr.map(obj2 => {
												this.CommonValidatorsSet(obj2.Key_Name, obj2.ThisIsTime, obj2.ParentDateKey, 'CulpritVesselArray', index);
											});
										}
                           } else {
										if (Parent.Key_Name === 'PCI_Intervention_Balloon_Dilatation' && change === 'No') {
											ChildeArr.map(obj2 => {
												if (obj2.Key_Name === 'PCI_Intervention_Wire_Crossing') {
													this.CommonValidatorsSet(obj2.Key_Name, obj2.ThisIsTime, obj2.ParentDateKey, 'CulpritVesselArray', index);
												} else {
													const SetValue = (obj2.Type === 'Select' || obj2.Type === 'Date' || obj2.Type === 'Number' || obj2.Type === 'Boolean' ) ? null : '';
													this.CommonInputReset(obj2.Key_Name, SetValue, 'CulpritVesselArray', index);
												}
											});
										} else {
											ChildeArr.map(obj2 => {
												const SetValue = (obj2.Type === 'Select' || obj2.Type === 'Date' || obj2.Type === 'Number' || obj2.Type === 'Boolean' ) ? null : '';
												this.CommonInputReset(obj2.Key_Name, SetValue, 'CulpritVesselArray', index);
											});
										}
                           }
                        }
                     })
                  );
                  FGroup.controls[Parent.Key_Name].updateValueAndValidity();
               }
            }
         });
      });
   }

   VesselYesOrNoValidations() {
      this.VesselYesOrNoSubscription.unsubscribe();
      this.VesselYesOrNoSubscription = new Subscription();
      const FArray = this.DynamicFGroup.get('VesselArray') as FormArray;
      FArray.controls.map( (obj, index) => {
         const FGroup = obj as FormGroup;
         const FControlKeys = Object.keys(FGroup.controls);
         FControlKeys.map(objNew => {
            const LimitArr = this.AllFieldsValues.filter(obj1 => obj1.Key_Name === objNew &&  (obj1.Type === 'Select' || obj1.Type === 'Boolean'));
            if (LimitArr.length > 0) {
               const Parent = LimitArr[0];
               let ChildeArr =  this.AllFieldsValues.filter(obj1 => obj1.If_Parent_Available && obj1.Parent.Key_Name === Parent.Key_Name);
               ChildeArr = ChildeArr.filter(obj1 => this.VesselArrayFields.includes(obj1.Key_Name));
               if (ChildeArr.length > 0) {
                  this.VesselYesOrNoSubscription.add(
                     FGroup.controls[Parent.Key_Name].valueChanges.subscribe(change => {
                        if (change === 'Yes' || change === 'No' || change === 'DontKnow' ||  change === '' || change === null || change === true || change === false) {
                           if (change === 'Yes' || change === true) {
                              ChildeArr.map(obj2 => {
                                 this.CommonValidatorsSet(obj2.Key_Name, obj2.ThisIsTime, obj2.ParentDateKey, 'VesselArray', index);
                              });
                           } else {
                              ChildeArr.map(obj2 => {
                                 const SetValue = (obj2.Type === 'Select' || obj2.Type === 'Date' || obj2.Type === 'Number' || obj2.Type === 'Boolean' ) ? null : '';
                                 this.CommonInputReset(obj2.Key_Name, SetValue, 'VesselArray', index);
                              });
                           }
                        }
                     })
                  );
                  FGroup.controls[Parent.Key_Name].updateValueAndValidity();
               }
            }
         });
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



   DrugBeforePciSubmit() {
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
         this.pciService.PciDrugBeforePci_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.DrugBeforePciId = response.Response._id;
               this.PatientUpdateData(response.Response, 'DrugBeforePci', false);
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Drug Before PCI Successfully Saved!' });
               this.tabGroup.selectedIndex = 1;
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            if (obj !== 'DrugsBeforePCIOthersData') {
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
   DrugBeforePciUpdate() {
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
         this.pciService.PciDrugBeforePci_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status === true) {
               this.PatientUpdateData(response.Response, 'DrugBeforePci', false);
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Drug Before PCI Successfully Updated!' });
               this.tabGroup.selectedIndex = 1;
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            if (obj !== 'DrugsBeforePCIOthersData') {
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




   PCISubmit() {
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
         this.pciService.Pci_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.PCIId = response.Response._id;
               this.PatientUpdateData(response.Response, 'PCI', false);
               this.tabGroup.selectedIndex = 2;
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'PCI Successfully Created!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            if (obj !== 'CulpritVesselArray' && obj !== 'VesselArray') {
               const FControl = this.DynamicFGroup.controls[obj];
               if (FControl.invalid) {
                  console.log(obj);
                  console.log(FControl);
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
   PCIUpdate() {
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
         this.pciService.Pci_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.PatientUpdateData(response.Response, 'PCI', false);
               this.tabGroup.selectedIndex = 2;
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'PCI Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         console.log(this.DynamicFGroup);
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            if (obj !== 'CulpritVesselArray' && obj !== 'VesselArray') {
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
                        console.log(obj);
                        console.log(FFControl);
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



   MedicationInCathSubmit() {
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
         this.pciService.PciMedicationInCath_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.MedicationInCathId = response.Response._id;
               // this.PatientUpdateData(response.Response, 'MedicationInCath', false);
               this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                  this.router.navigate(['/Patient-Manage/Hospital-Summary', this.UrlParams.Patient])
               );
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Medication In Cath Successfully Saved!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            if (obj !== 'IntraCoronaryDrugsOthersArray' && obj !== 'InhibitorsOthersArray' && obj !== 'AntiThromboticsOthersArray') {
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
   MedicationInCathUpdate() {
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
         this.pciService.PciMedicationInCath_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               // this.PatientUpdateData(response.Response, 'MedicationInCath', false);
               this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                  this.router.navigate(['/Patient-Manage/Hospital-Summary', this.UrlParams.Patient])
               );
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Medication In Cath Successfully Updated!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.DynamicFGroup.controls).map(obj => {
            if (obj !== 'IntraCoronaryDrugsOthersArray' && obj !== 'InhibitorsOthersArray' && obj !== 'AntiThromboticsOthersArray') {
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
}
