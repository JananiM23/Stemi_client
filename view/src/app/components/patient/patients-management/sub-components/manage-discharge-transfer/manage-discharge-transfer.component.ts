import { Component, OnInit, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, Validators, FormControl, ValidatorFn, ValidationErrors, AbstractControl, FormArray } from '@angular/forms';
import { DateAdapter, NativeDateAdapter } from '@angular/material/core';
import {map, startWith} from 'rxjs/operators';
import { TimepickerDirective } from 'ngx-material-timepicker';

import { PatientDetailsService } from 'src/app/services/patient-management/patient-details/patient-details.service';
import { ThrombolysisService } from 'src/app/services/patient-management/thrombolysis/thrombolysis.service';
import { PciService } from 'src/app/services/patient-management/pci/pci.service';
import { HospitalSummaryService } from 'src/app/services/patient-management/hospital-summary/hospital-summary.service';
import { DischargeTransferService } from 'src/app/services/patient-management/discharge-transfer/discharge-transfer.service';
import { DataPassingService } from './../../../../../services/common-services/data-passing.service';
import { LoginManagementService } from './../../../../../services/login-management/login-management.service';
import { ToastrService } from './../../../../../services/common-services/toastr.service';
import { HospitalManagementService } from './../../../../../services/hospital-management/hospital-management.service';
import { Observable } from 'rxjs';


export class MyDateAdapter extends NativeDateAdapter {
   format(date: Date, displayFormat: any): string {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate();
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
   }
}
export interface Clusters {  _id: string;  Cluster_Name: string; }
export interface Hospitals  { _id: string; Hospital_Name: string; Hospital_Role: string; Hospital_Address: string; Hospital_Type: string; }
@Component({
selector: 'app-manage-discharge-transfer',
templateUrl: './manage-discharge-transfer.component.html',
styleUrls: ['./manage-discharge-transfer.component.css'],
providers: [{provide: DateAdapter, useClass: MyDateAdapter}],
})
export class ManageDischargeTransferComponent implements OnInit, OnDestroy {

   @ViewChildren(TimepickerDirective) timePicker: QueryList<TimepickerDirective>;

private subscription: Subscription = new Subscription();
private dataSubscription: Subscription = new Subscription();
private TransferToSubscription: Subscription = new Subscription();
private ClusterChangeSubscription: Subscription = new Subscription();
private TransferVehicleSubscription: Subscription = new Subscription();
private historySubscription: Subscription = new Subscription();


AllFields: any[] = [];
AllFieldsValues: any[] = [];
AllValidations: any[] = [];

TabsList: any[] = ['Death', 'Discharge_Medications', 'Discharge_Transfer'];
StatinOptions: any[] = [	{Name: 'simva', Key: 'simva'},
									{Name: 'atorva', Key: 'atorva'},
									{Name: 'rosuva', Key: 'rosuva'},
									{Name: 'other', Key: 'other'}];

DynamicFGroup: FormGroup;
HistoryFGroup: FormGroup;

HistoryAvailable = false;
MedicationHistoryAvailable = false;
DischargeHistoryAvailable = false;
IfDidNotArrive = false;

FormLoaded = false;
FormUploading = false;

CurrentTabIndex = 0;

UrlParams = null;
ExistingPatient = true;

PatientDeath = false;
OtherMedicationArray: FormArray;
OtherMedicationData = [];

ReadonlyPage = false;
LastActiveTab = 'Discharge_Transfer';
InitialHospital = null;
DeathId = null;
DischargeMedicationId = null;
DischargeId = null;

UserInfo: any;
PatientInfo: any;
HospitalInfo: any;
DischargeInfo: any;

CurrentHospitalInfo: any = null;
ContentLoading = true;

ClustersList: Clusters[] = [];
filteredClustersList: Observable<Clusters[]>;
LastSelectedClusters = null;

HospitalList: Hospitals[] = [];
filteredHospitalsList: Observable<Hospitals[]>;
LastSelectedHospital = null;

AmbulancesList: Hospitals[] = [];
filteredAmbulancesList: Observable<Hospitals[]>;
LastSelectedAmbulance = null;

TransportDetailsHide = false;

SecondaryEdit = false;
SecondaryCurrentEdit = {FormArray: '', Index: ''};
SecondaryData: any;
SecondaryUpdating = false;
noFutureDate: any;

AdverseEventsData: any[] = [];

constructor(   private PatientService: PatientDetailsService,
               private thrombolysisService: ThrombolysisService,
               private pciService: PciService,
               private router: Router,
               private HospitalService: HospitalSummaryService,
               private DischargeService: DischargeTransferService,
               private LoginService: LoginManagementService,
               private dataPassingService: DataPassingService,
               private activatedRoute: ActivatedRoute,
               public Toastr: ToastrService,
               public HospitalManageService: HospitalManagementService) {
   this.noFutureDate = new Date();

   this.UserInfo = JSON.parse(this.LoginService.LoginUser_Info());

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
                  this.HospitalManageService.Hospital_view({_id: this.PatientInfo.Initiated_Hospital._id}).subscribe(responseOne => {
                     if (responseOne.Status) {
                        this.HospitalInfo = responseOne.Response;
                     }
                  });

                  if (this.PatientInfo.Initiated_Hospital.Hospital_Role === 'EMS') {
                     this.TransportDetailsHide = true;
                  }

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
                     this.HospitalService.HospitalSummaryAdverseEvents_View(DataObj),
                     this.DischargeService.DischargeTransferDeath_View(DataObj),
                     this.DischargeService.DischargeTransferMedication_View(DataObj),
                     this.DischargeService.DischargeTransferDischarge_View(DataObj)
                  ).subscribe( ([Res1, Res2, Res3, Res4, Res5, Res6, Res7, Res8, Res9, Res10, Res11, Res12, Res13, Res14, Res15, Res16]) => {
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
									this.AdverseEventsData = Res13.Response;
                           this.PatientUpdateData(Res13.Response, 'AdverseEvents', false);
                        }
                        if (Res14.Response !== null) {
                           this.DeathId = Res14.Response._id;
                           this.PatientUpdateData(Res14.Response, 'Death', false);
                        } else {
									this.UpdateAdverseDeathData();
								}
                        if (Res15.Response !== null) {
                           if (Res15.Response.length >= 1 ) {
                              Res15.Response.map(obj => {
                                 if (obj.Hospital._id === this.InitialHospital) {
                                    this.DischargeMedicationId = Res15.Response[Res15.Response.length - 1]._id;
                                 }
                              });
                           }
                           this.PatientUpdateData(Res15.Response, 'DischargeMedication', false);
                        }
                        if (Res16.Response !== null) {
                           if (Res16.Response.length >= 1 ) {
                              Res16.Response.map(obj => {
                                 if (obj.Hospital._id === this.InitialHospital) {
                                    this.DischargeId = Res16.Response[Res16.Response.length - 1]._id;
                                 }
                              });
                           }
                           this.PatientUpdateData(Res16.Response, 'Discharge', false);
                        }

                        setTimeout(() => {
                           this.ActivateDynamicFGroup();
                        }, 500);
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
      MedicationHistory: new FormArray([]),
      DischargeHistory: new FormArray([])
   });
}

ngOnDestroy() {
   this.dataSubscription.unsubscribe();
   this.subscription.unsubscribe();
   this.TransferToSubscription.unsubscribe();
   this.TransferVehicleSubscription.unsubscribe();
   this.ClusterChangeSubscription.unsubscribe();
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
      if (PatientData.DidNotArrive) {
         this.IfDidNotArrive = true;
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
   } else if (From === 'Death') {
      const BasicDetailsKeys = Object.keys(PatientData);
      this.AllFieldsValues.map((obj, i) => {
         if (BasicDetailsKeys.includes(obj.Key_Name)) {
            this.AllFieldsValues[i].CurrentValue = PatientData[obj.Key_Name];
            this.AllFieldsValues[i].DefaultValue = PatientData[obj.Key_Name];
         }
      });
      const DischargeTransferDeath = PatientData.Discharge_Transfer_Death;
      if (DischargeTransferDeath && DischargeTransferDeath !== null && DischargeTransferDeath !== '' && DischargeTransferDeath === 'Yes' ) {
         this.PatientDeath =  true;
      } else {
         this.PatientDeath = false;
      }
		if (this.AdverseEventsData.length > 0) {
			const DeathData = this.AdverseEventsData[this.AdverseEventsData.length - 1];
			if (DeathData.Adverse_Events_Death !== DischargeTransferDeath && DischargeTransferDeath !== 'Yes' ) {
				this.AllFieldsValues.map((obj, i) => {
					if (obj.Sub_Category === 'Death' && this.PatientDeath === false) {
						if (obj.Key_Name === 'Discharge_Transfer_Death') {
							this.AllFieldsValues[i].CurrentValue = DeathData.Adverse_Events_Death || '';
							this.AllFieldsValues[i].DefaultValue = DeathData.Adverse_Events_Death || '';
						}
						if (obj.Key_Name === 'Discharge_Transfer_Cause_of_Death') {
							this.AllFieldsValues[i].CurrentValue = DeathData.Adverse_Events_Cause_of_Death || '';
							this.AllFieldsValues[i].DefaultValue = DeathData.Adverse_Events_Cause_of_Death || '';
						}
						if (obj.Key_Name === 'Discharge_Transfer_Death_Date_Time') {
							this.AllFieldsValues[i].CurrentValue = DeathData.Adverse_Events_Death_Date_Time || '';
							this.AllFieldsValues[i].DefaultValue = DeathData.Adverse_Events_Death_Date_Time || '';
						}
						if (obj.Key_Name === 'Discharge_Transfer_Remarks') {
							this.AllFieldsValues[i].CurrentValue = DeathData.Adverse_Events_Death_Remarks || '';
							this.AllFieldsValues[i].DefaultValue = DeathData.Adverse_Events_Death_Remarks || '';
						}
					}
				})
				if (DeathData.Adverse_Events_Death === 'Yes') {
					this.PatientDeath =  true;
				}
			}
		}
   } else if (From === 'DischargeMedication') {
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
            if (obj.Sub_Junior_Category === 'Discharge_Medications') {
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
            if (obj.Hospital.Hospital_Role !== 'EMS' && (obj.Hospital._id !== this.InitialHospital || (this.UserInfo.User_Type === 'PU' && this.PatientInfo.TransferBending && this.PatientInfo.TransferBendingTo._id === this.UserInfo.Hospital._id))) {
               const Arr = PatientData.filter(obj1 => obj1.Hospital._id === obj.Hospital._id);
               const MedicationData =  Arr.length > 0 ? Arr[0] : {};
               const Key = obj.Hospital.Hospital_Role === 'EMS' ? 'E' : obj.Hospital.Hospital_Role.slice(0, 1) + obj.Hospital.Hospital_Role.slice(-1);
               const OtherMedication = MedicationData.OtherMedicationArray !== undefined ? MedicationData.OtherMedicationArray : [];
               const NewFArray = new FormArray([]);
               if (OtherMedication.length > 0) {
                  OtherMedication.map(OBJ => {
                     const NewFGroup = new FormGroup({});
                     NewFGroup.addControl('Discharge_Medications_Other_Medicine', new FormControl({value: OBJ.Discharge_Medications_Other_Medicine, disabled: true}));
                     NewFArray.push(NewFGroup);
                  });
               }
               const FGroup = new FormGroup({
                  Patient: new FormControl({value: this.PatientInfo._id, disabled: true}),
                  _id: new FormControl({value: MedicationData._id || null, disabled: true}),
                  Hospital: new FormControl({value: obj.Hospital._id, disabled: true}),
                  Hospital_Role: new FormControl({value: obj.Hospital.Hospital_Role, disabled: true}),
                  Hospital_Key: new FormControl({value: Key, disabled: true}),
                  HistoryActive: new FormControl({value: false, disabled: true}),
                  Discharge_Medications_Aspirin: new FormControl({value: MedicationData.Discharge_Medications_Aspirin || null, disabled: true}),
                  Discharge_Medications_Clopidogrel: new FormControl({value: MedicationData.Discharge_Medications_Clopidogrel || null, disabled: true}),
                  Discharge_Medications_Prasugrel: new FormControl({value: MedicationData.Discharge_Medications_Prasugrel || null, disabled: true}),
                  Discharge_Medications_Ticagrelor: new FormControl({value: MedicationData.Discharge_Medications_Ticagrelor || null, disabled: true}),
                  Discharge_Medications_ACEI: new FormControl({value: MedicationData.Discharge_Medications_ACEI || null, disabled: true}),
                  Discharge_Medications_ARB: new FormControl({value: MedicationData.Discharge_Medications_ARB || null, disabled: true}),
                  Discharge_Medications_Beta_Blocker: new FormControl({value: MedicationData.Discharge_Medications_Beta_Blocker || null, disabled: true}),
                  Discharge_Medications_Nitrate: new FormControl({value: MedicationData.Discharge_Medications_Nitrate || null, disabled: true}),
                  Discharge_Medications_Statin: new FormControl({value: MedicationData.Discharge_Medications_Statin || null, disabled: true}),
						Discharge_Medications_Statin_Option: new FormControl({value: MedicationData.Discharge_Medications_Statin_Option || null, disabled: true}),
                  Discharge_Medications_Echocardiography: new FormControl({value: MedicationData.Discharge_Medications_Echocardiography || null, disabled: true}),
                  Discharge_Medications_Ejection_Fraction: new FormControl({value: MedicationData.Discharge_Medications_Ejection_Fraction || null, disabled: true}),
                  OtherMedicationArray: NewFArray,
                  EditActivate: new FormControl({value: false, disabled: true}),
               });
               const FArray = this.HistoryFGroup.controls.MedicationHistory as FormArray;
               FArray.push(FGroup);
            }
         });
      }
   } else if (From === 'Discharge') {
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
            if (obj.Sub_Junior_Category === 'Discharge_Transfer') {
               this.AllFieldsValues[i].Disabled = true;
            }
         });
      }
      if (PatientData.length > 0) {
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
         this.DischargeHistoryAvailable = true;
         const arr = this.HistoryFGroup.controls['DischargeHistory'] as FormArray;
         while (0 !== arr.length) { arr.removeAt(0); }
         this.PatientInfo.Hospital_History.map(obj => {
            if (obj.Hospital._id !== this.InitialHospital || (this.UserInfo.User_Type === 'PU' && this.PatientInfo.TransferBending && this.PatientInfo.TransferBendingTo._id === this.UserInfo.Hospital._id)) {
               const Arr = PatientData.filter(obj1 => obj1.Hospital._id === obj.Hospital._id);
               const TransferData =  Arr.length > 0 ? Arr[0] : {};
               const Key = obj.Hospital.Hospital_Role === 'EMS' ? 'E' : obj.Hospital.Hospital_Role.slice(0, 1) + obj.Hospital.Hospital_Role.slice(-1);
               let DischargeICUTime = null;
               if (TransferData.Discharge_Transfer_ICU_CCU_HCU_Date_Time && TransferData.Discharge_Transfer_ICU_CCU_HCU_Date_Time !== null && TransferData.Discharge_Transfer_ICU_CCU_HCU_Date_Time !== '') {
                  const DateTime = new Date(TransferData.Discharge_Transfer_ICU_CCU_HCU_Date_Time);
                  DischargeICUTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let DischargeHospitalTime = null;
               if (TransferData.Discharge_Transfer_from_Hospital_Date_Time && TransferData.Discharge_Transfer_from_Hospital_Date_Time !== null && TransferData.Discharge_Transfer_from_Hospital_Date_Time !== '') {
                  const DateTime = new Date(TransferData.Discharge_Transfer_from_Hospital_Date_Time);
                  DischargeHospitalTime  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let CallTimeValue = null;
               if (TransferData.Discharge_Ambulance_Call_Date_Time && TransferData.Discharge_Ambulance_Call_Date_Time !== null && TransferData.Discharge_Ambulance_Call_Date_Time !== '') {
                  const DateTime = new Date(TransferData.Discharge_Ambulance_Call_Date_Time);
                  CallTimeValue  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let ArrivalTimeValue = null;
               if (TransferData.Discharge_Ambulance_Arrival_Date_Time && TransferData.Discharge_Ambulance_Arrival_Date_Time !== null && TransferData.Discharge_Ambulance_Arrival_Date_Time !== '') {
                  const DateTime = new Date(TransferData.Discharge_Ambulance_Arrival_Date_Time);
                  ArrivalTimeValue  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let DepartureTimeValue = null;
               if (TransferData.Discharge_Ambulance_Departure_Date_Time && TransferData.Discharge_Ambulance_Departure_Date_Time !== null && TransferData.Discharge_Ambulance_Departure_Date_Time !== '') {
                  const DateTime = new Date(TransferData.Discharge_Ambulance_Departure_Date_Time);
                  DepartureTimeValue  = DateTime.getHours() + ':' + DateTime.getMinutes();
               }
               let TransferToStemiCluster = null;
               if (TransferData.Transfer_to_Stemi_Cluster !== null) {
                  TransferToStemiCluster = TransferData.Transfer_to_Stemi_Cluster.Cluster_Name;
               }
               let TransferToStemiClusterHospitalName = null;
               let TransferToStemiClusterHospitalAddress = '';
               if (TransferData.Transfer_to_Stemi_Cluster_Hospital_Name !== null) {
                  TransferToStemiClusterHospitalName = TransferData.Transfer_to_Stemi_Cluster_Hospital_Name.Hospital_Name;
                  TransferToStemiClusterHospitalAddress = TransferData.Transfer_to_Stemi_Cluster_Hospital_Name.Address;
               }
               let TransferClusterAmbulance = null;
               if (TransferData.Discharge_Cluster_Ambulance !== null) {
                  TransferClusterAmbulance = TransferData.Discharge_Cluster_Ambulance.Hospital_Name;
               }

               const FGroup = new FormGroup({
                  Patient: new FormControl({value: this.PatientInfo._id, disabled: true}),
                  _id: new FormControl({value: TransferData._id || null, disabled: true}),
                  Hospital: new FormControl({value: obj.Hospital._id, disabled: true}),
                  Hospital_Role: new FormControl({value: obj.Hospital.Hospital_Role, disabled: true}),
                  Hospital_Key: new FormControl({value: Key, disabled: true}),
                  HistoryActive: new FormControl({value: false, disabled: true}),
                  Discharge_Transfer_ICU_CCU_HCU_Date_Time: new FormControl({value: TransferData.Discharge_Transfer_ICU_CCU_HCU_Date_Time || null, disabled: true}),
                  Discharge_Transfer_ICU_CCU_HCU_Time: new FormControl({value: DischargeICUTime, disabled: true}),
                  Discharge_Transfer_from_Hospital_Date_Time: new FormControl({value: TransferData.Discharge_Transfer_from_Hospital_Date_Time || null, disabled: true}),
                  Discharge_Transfer_from_Hospital_Time: new FormControl({value: DischargeHospitalTime || null, disabled: true}),
                  Discharge_Transfer_To: new FormControl({value: TransferData.Discharge_Transfer_To || null, disabled: true}),
                  Discharge_Details_Remarks: new FormControl({value: TransferData.Discharge_Details_Remarks || null, disabled: true}),
                  Transfer_to_Stemi_Cluster: new FormControl({value: TransferToStemiCluster || null, disabled: true}),
                  Transfer_to_Stemi_Cluster_Hospital_Name: new FormControl({value: TransferToStemiClusterHospitalName || null, disabled: true}),
                  Transfer_to_Stemi_Cluster_Hospital_Address: new FormControl({value: TransferToStemiClusterHospitalAddress || null, disabled: true}),
                  Transfer_to_Non_Stemi_Cluster_Hospital_Hospital_Name: new FormControl({value: TransferData.Transfer_to_Non_Stemi_Cluster_Hospital_Hospital_Name || null, disabled: true}),
                  Transfer_to_Non_Stemi_Cluster_Hospital_Hospital_Address: new FormControl({value: TransferData.Transfer_to_Non_Stemi_Cluster_Hospital_Hospital_Address || null, disabled: true}),
                  Transport_Vehicle: new FormControl({value: TransferData.Transport_Vehicle || null, disabled: true}),
                  Transport_Vehicle_Other: new FormControl({value: TransferData.Transport_Vehicle_Other || null, disabled: true}),
                  Discharge_Cluster_Ambulance: new FormControl({value: TransferClusterAmbulance || null, disabled: true}),
                  Discharge_Ambulance_Call_Date_Time: new FormControl({value: TransferData.Discharge_Ambulance_Call_Date_Time || null, disabled: true}),
                  Discharge_Ambulance_Call_Time: new FormControl({value: CallTimeValue || null, disabled: true}),
                  Discharge_Ambulance_Arrival_Date_Time: new FormControl({value: TransferData.Discharge_Ambulance_Arrival_Date_Time || null, disabled: true}),
                  Discharge_Ambulance_Arrival_Time: new FormControl({value: ArrivalTimeValue || null, disabled: true}),
                  Discharge_Ambulance_Departure_Date_Time: new FormControl({value: TransferData.Discharge_Ambulance_Departure_Date_Time || null, disabled: true}),
                  Discharge_Ambulance_Departure_Time: new FormControl({value: DepartureTimeValue || null, disabled: true}),
                  EditActivate: new FormControl({value: false, disabled: true}),
               });
               const FArray = this.HistoryFGroup.controls.DischargeHistory as FormArray;
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
         }
      });
   }
}

UpdateAdverseDeathData() {
	if (this.AdverseEventsData.length > 0) {
		const DeathData = this.AdverseEventsData[this.AdverseEventsData.length - 1];
		if (DeathData.Adverse_Events_Death !== '' ) {
			this.AllFieldsValues.map((obj, i) => {
				if (obj.Sub_Category === 'Death') {
					if (obj.Key_Name === 'Discharge_Transfer_Death') {
						this.AllFieldsValues[i].CurrentValue = DeathData.Adverse_Events_Death || '';
						this.AllFieldsValues[i].DefaultValue = DeathData.Adverse_Events_Death || '';
						if (DeathData.Adverse_Events_Death === 'Yes') {
							this.PatientDeath =  true;
						}
					}
					if (obj.Key_Name === 'Discharge_Transfer_Cause_of_Death') {
						this.AllFieldsValues[i].CurrentValue = DeathData.Adverse_Events_Cause_of_Death || '';
						this.AllFieldsValues[i].DefaultValue = DeathData.Adverse_Events_Cause_of_Death || '';
					}
					if (obj.Key_Name === 'Discharge_Transfer_Death_Date_Time') {
						this.AllFieldsValues[i].CurrentValue = DeathData.Adverse_Events_Death_Date_Time || '';
						this.AllFieldsValues[i].DefaultValue = DeathData.Adverse_Events_Death_Date_Time || '';
					}
					if (obj.Key_Name === 'Discharge_Transfer_Remarks') {
						this.AllFieldsValues[i].CurrentValue = DeathData.Adverse_Events_Death_Remarks || '';
						this.AllFieldsValues[i].DefaultValue = DeathData.Adverse_Events_Death_Remarks || '';
					}
				}
			})
		}
	}
}

TabChangeEvent(event: any) {
   if (!this.CheckSubCategoryVisibility(this.TabsList[event])) {
      this.CurrentTabIndex = event;
      if (event >= 0) {
         this.DynamicFGroup.reset({}, { emitEvent: false });
         this.subscription.unsubscribe();
         this.TransferToSubscription.unsubscribe();
         this.TransferVehicleSubscription.unsubscribe();
         this.ClusterChangeSubscription.unsubscribe();
         this.subscription = new Subscription();
         this.TransferToSubscription = new Subscription();
         this.TransferVehicleSubscription = new Subscription();
         this.ClusterChangeSubscription = new Subscription();
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
            this.router.navigate(['/Patient-Manage/Follow-Up', this.UrlParams.Patient])
         );
      }
   }
}

GetHistoryFormControlErrorMessage(formArray: any, index: any, KeyName: any, Index?: any) {
   let FControl: FormControl;
   const FArray = this.HistoryFGroup.get(formArray) as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;

   if (KeyName === 'Discharge_Medications_Other_Medicine') {
      const FArrayNew = FGroup.get('OtherMedicationArray') as FormArray;
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
   if (this.PatientDeath && this.CurrentTabIndex > 0) {
      this.ReadonlyPage = true;
   }
   if (this.AllFieldsValues.length > 0 && this.AllValidations.length > 0 && !this.FormLoaded) {
      this.ContentLoading = false;
      const KeyDatabase = [];
      this.AllFieldsValues.map(obj1 => { KeyDatabase.push(obj1.Key_Name); });
      const BasicDetailsFields = this.AllFieldsValues.filter(obj => obj.Sub_Category === this.TabsList[this.CurrentTabIndex]);
      this.DynamicFGroup = new FormGroup({ });
      this.DynamicFGroup.addControl('User', new FormControl(this.UserInfo._id, Validators.required ));
      this.DynamicFGroup.addControl('PatientId', new FormControl(this.UrlParams.Patient, Validators.required ));
      this.DynamicFGroup.addControl('Hospital', new FormControl(this.InitialHospital, Validators.required ));
      if (this.TabsList[this.CurrentTabIndex] === 'Death' && this.DeathId !== null) {
         this.DynamicFGroup.addControl('DeathId', new FormControl(this.DeathId, Validators.required ));
      }
      if (this.TabsList[this.CurrentTabIndex] === 'Discharge_Medications' && this.DischargeMedicationId !== null) {
         this.DynamicFGroup.addControl('DischargeMedicationId', new FormControl(this.DischargeMedicationId, Validators.required ));
      }
      if (this.TabsList[this.CurrentTabIndex] === 'Discharge_Transfer' && this.DischargeId !== null) {
         this.DynamicFGroup.addControl('DischargeId', new FormControl(this.DischargeId, Validators.required ));
      }
      BasicDetailsFields.map(obj => {
         let FormControlValidation = null;
         if (obj.Mandatory || obj.Validation) {
            FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
         }
         if (obj.Key_Name !== 'Discharge_Medications_Other_Medicine') {
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
         // Death
         if (obj.Key_Name === 'Discharge_Transfer_Death_Date_Time' && !KeyDatabase.includes('Discharge_Transfer_Death_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Discharge_Transfer_Death_Date_Time';
            NewObj.Name = 'Discharge Transfer Death Time';
            NewObj.Key_Name = 'Discharge_Transfer_Death_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Discharge_Transfer_Death_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }

         // Discharge Transfer
         if (obj.Key_Name === 'Discharge_Transfer_from_Hospital_Date_Time' && !KeyDatabase.includes('Discharge_Transfer_from_Hospital_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Discharge_Transfer_from_Hospital_Date_Time';
            NewObj.Name = 'Discharge Transfer from Hospital Time';
            NewObj.Key_Name = 'Discharge_Transfer_from_Hospital_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Discharge_Transfer_from_Hospital_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Discharge_Transfer_ICU_CCU_HCU_Date_Time' && !KeyDatabase.includes('Discharge_Transfer_ICU_CCU_HCU_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Discharge_Transfer_ICU_CCU_HCU_Date_Time';
            NewObj.Name = 'Discharge Transfer ICU/CCU Time';
            NewObj.Key_Name = 'Discharge_Transfer_ICU_CCU_HCU_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Discharge_Transfer_ICU_CCU_HCU_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Discharge_Ambulance_Call_Date_Time' && !KeyDatabase.includes('Discharge_Ambulance_Call_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Discharge_Ambulance_Call_Date_Time';
            NewObj.Name = 'Discharge Ambulance Call Time';
            NewObj.Key_Name = 'Discharge_Ambulance_Call_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Discharge_Ambulance_Call_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Discharge_Ambulance_Arrival_Date_Time' && !KeyDatabase.includes('Discharge_Ambulance_Arrival_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Discharge_Ambulance_Arrival_Date_Time';
            NewObj.Name = 'Discharge Ambulance Arrival Time';
            NewObj.Key_Name = 'Discharge_Ambulance_Arrival_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Discharge_Ambulance_Arrival_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
         if (obj.Key_Name === 'Discharge_Ambulance_Departure_Date_Time' && !KeyDatabase.includes('Discharge_Ambulance_Departure_Time')) {
            NewObj.ThisIsTime = true;
            NewObj.ParentDateKey = 'Discharge_Ambulance_Departure_Date_Time';
            NewObj.Name = 'Discharge Ambulance Departure Time';
            NewObj.Key_Name = 'Discharge_Ambulance_Departure_Time';
            this.AllFieldsValues.push(NewObj);
            this.DynamicFGroup.addControl('Discharge_Ambulance_Departure_Time', new FormControl(NewObj.CurrentValue, FormControlValidation));
         }
      });
      if (this.TabsList[this.CurrentTabIndex] === 'Discharge_Medications') {
         this.DynamicFGroup.addControl('OtherMedicationArray', new FormArray([]));
         if (this.OtherMedicationData.length > 0) {
            this.OtherMedicationArrayDataUpdate();
         }
      }
      if (this.TabsList[this.CurrentTabIndex] === 'Discharge_Transfer') {
         if (this.TransportDetailsHide) {
            const TransportKeys = ['Transport_Vehicle', 'Discharge_Ambulance_Call_Date_Time', 'Discharge_Ambulance_Call_Time', 'Discharge_Ambulance_Arrival_Date_Time', 'Discharge_Ambulance_Arrival_Time', 'Discharge_Ambulance_Departure_Date_Time', 'Discharge_Ambulance_Departure_Time'];
            const TransportArr = this.AllFieldsValues.filter(objNew => TransportKeys.includes(objNew.Key_Name));
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
         this.DischargeHandling();
      }
      setTimeout(() => {
         this.FormLoaded = true;
         this.AllFieldValuesManagement();
         if (this.CurrentHospitalInfo.Hospital_Role === 'EMS' || (this.UserInfo.User_Type !== 'SA'  && this.UserInfo.Hospital.Hospital_Role === 'EMS')) {
            this.RestrictTheTabs();
         }
      }, 100);
   }
}

RestrictTheTabs() {
   const NodeList = document.querySelectorAll('.mat-tab-label') as NodeListOf<HTMLElement>;
   NodeList.forEach((Node, index) => {
      if (index === 1) {
         Node.style.display = 'none';
      }
   });
}

DischargeHandling() {
   const ObjKeys = Object.keys(this.DynamicFGroup.controls);

   if (ObjKeys.includes('Discharge_Transfer_To')) {
      this.TransferToSubscription.add(
         this.DynamicFGroup.controls.Discharge_Transfer_To.valueChanges.subscribe(change => {
            this.ClusterChangeSubscription.unsubscribe();
            this.ClusterChangeSubscription = new Subscription();
            this.TransferVehicleSubscription.unsubscribe();
            this.TransferVehicleSubscription = new Subscription();
            const StaticHospitalTypes = ['EMS', 'Spoke S2', 'Spoke S1', 'Hub H2', 'Hub H1'];

            // Validation Control
            const TransportKeys = ['Transport_Vehicle', 'Transport_Vehicle_Other', 'Discharge_Cluster_Ambulance', 'Discharge_Ambulance_Call_Date_Time', 'Discharge_Ambulance_Call_Time', 'Discharge_Ambulance_Arrival_Date_Time', 'Discharge_Ambulance_Arrival_Time', 'Discharge_Ambulance_Departure_Date_Time', 'Discharge_Ambulance_Departure_Time'];
            const ResetKeys = [  'Transfer_to_Stemi_Cluster',
                                 'Transfer_to_Non_Stemi_Cluster_Hospital_Hospital_Name',
                                 'Transfer_to_Non_Stemi_Cluster_Hospital_Hospital_Address',
                                 'Transport_Vehicle_Other',
                                 'Discharge_Cluster_Ambulance',
                                 'Discharge_Ambulance_Call_Date_Time',
                                 'Discharge_Ambulance_Call_Time',
                                 'Discharge_Ambulance_Arrival_Date_Time',
                                 'Discharge_Ambulance_Arrival_Time',
                                 'Discharge_Ambulance_Departure_Date_Time',
                                 'Discharge_Ambulance_Departure_Time'];
            let SetValidationKeys = ['Transfer_to_Stemi_Cluster_Hospital_Name',
                                       'Transfer_to_Stemi_Cluster_Hospital_Address',
                                       'Discharge_Details_Remarks',
                                       'Transport_Vehicle'];
            if (change === 'Other_Cluster') {
               ResetKeys.splice(0, 1);
               SetValidationKeys.splice(0, 0, 'Transfer_to_Stemi_Cluster');
            }
            if (change === 'Non_Stemi_Cluster' || change === 'Step_Down_Facility') {
               SetValidationKeys.splice(0, 2);
               ResetKeys.splice(1, 2);
               ResetKeys.splice(1, 0, 'Transfer_to_Stemi_Cluster_Hospital_Name', 'Transfer_to_Stemi_Cluster_Hospital_Address');
               SetValidationKeys.splice(1, 0, 'Transfer_to_Non_Stemi_Cluster_Hospital_Hospital_Name', 'Transfer_to_Non_Stemi_Cluster_Hospital_Hospital_Address');
            }
            if (change === 'Home') {
               ResetKeys.splice(1, 0, 'Transfer_to_Stemi_Cluster_Hospital_Name', 'Transfer_to_Stemi_Cluster_Hospital_Address', 'Transport_Vehicle');
               SetValidationKeys.splice(0, 2);
               SetValidationKeys.splice(1, 1);
            }
            if (change === '' || change === null) {
               SetValidationKeys.map(obj => ResetKeys.push(obj));
            }
            if (this.DynamicFGroup.controls.Transport_Vehicle.value !== null && this.DynamicFGroup.controls.Transport_Vehicle.value !== '') {
               const AmbKeys = [ 'Transport_Vehicle_Other',
                                 'Discharge_Cluster_Ambulance',
                                 'Discharge_Ambulance_Call_Date_Time',
                                 'Discharge_Ambulance_Call_Time',
                                 'Discharge_Ambulance_Arrival_Date_Time',
                                 'Discharge_Ambulance_Arrival_Time',
                                 'Discharge_Ambulance_Departure_Date_Time',
                                 'Discharge_Ambulance_Departure_Time'];
               AmbKeys.map(obj => {
                  const RIndex = ResetKeys.indexOf(obj);
                  ResetKeys.splice(RIndex, 1);
               });
            }
            if (this.TransportDetailsHide) {
               SetValidationKeys = SetValidationKeys.filter(objNewNew => {
                  if (TransportKeys.includes(objNewNew)) {
                     ResetKeys.push(objNewNew);
                     return false;
                  } else {
                     return true;
                  }
               });
            }

            ResetKeys.map(obj => {
               const Index = this.AllFieldsValues.findIndex(objNew => objNew.Key_Name === obj);
               const FieldObject = this.AllFieldsValues[Index];
               const SetValue = (FieldObject.Type === 'Select' || FieldObject.Type === 'Date' || FieldObject.Type === 'Number' || FieldObject.Type === 'Boolean' ) ? null : '';
               this.CommonInputReset(obj, SetValue);
            });
            SetValidationKeys.map(obj => {
               const Index = this.AllFieldsValues.findIndex(objNew => objNew.Key_Name === obj);
               const FieldObject = this.AllFieldsValues[Index];
               let SetValue = (FieldObject.Type === 'Select' || FieldObject.Type === 'Date' || FieldObject.Type === 'Number' || FieldObject.Type === 'Boolean' ) ? null : '';
               SetValue = (FieldObject.CurrentValue !== '' && FieldObject.CurrentValue !== null) ? FieldObject.CurrentValue : SetValue;
               this.DynamicFGroup.controls[obj].setValue(SetValue);
               this.CommonValidatorsSet(FieldObject.Key_Name, FieldObject.ThisIsTime, FieldObject.ParentDateKey);
            });


            if (change === 'Current_Cluster' || change === 'Other_Cluster') {
               this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Address.disable();
               this.filteredHospitalsList = this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Name.valueChanges.pipe(
                  startWith(''), map(value => {
                     if (value && value !== null && value !== '') {
                        if ( typeof value === 'object') {
                           if (this.LastSelectedHospital === null || this.LastSelectedHospital !== value._id) {
                              this.LastSelectedHospital = value._id;
                           }
                           value = value.Hospital_Name;
                        }
                        return this.HospitalList.filter(option => option.Hospital_Name.toLowerCase().includes(value.toLowerCase()));
                     } else {
                        this.LastSelectedHospital = null;
                        this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Address.setValue('');
                        return this.HospitalList;
                     }
                  })
               );
            }

            if (change === 'Other_Cluster') {
               this.filteredClustersList = this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster.valueChanges.pipe(
                  startWith(''), map(value => {
                     if (value && value !== null && value !== '') {
                        if ( typeof value === 'object') {
                           if (this.LastSelectedClusters === null || this.LastSelectedClusters !== value._id) {
                              this.LastSelectedClusters = value._id;
                           }
                           value = value.Cluster_Name;
                        }
                        return this.ClustersList.filter(option => option.Cluster_Name.toLowerCase().includes(value.toLowerCase()));
                     } else {
                        this.LastSelectedClusters = null;
                        return this.ClustersList;
                     }
                  })
               );
            }


            if (change === 'Current_Cluster') {
               const HospitalTypes = [];
               StaticHospitalTypes.map(obj => { HospitalTypes.push(obj); });
               const TypeIndex = HospitalTypes.findIndex(obj => obj === this.HospitalInfo.Hospital_Role);
               let RestrictionsList = [];
               if (TypeIndex > 2) {
                  HospitalTypes.splice(0, 3);
                  RestrictionsList = HospitalTypes;
               } else {
                  HospitalTypes.splice(0, TypeIndex);
                  RestrictionsList = HospitalTypes;
               }
               const Data = { Clusters: this.HospitalInfo.Connected_Clusters,
                              Hospital_Id: this.PatientInfo.Initiated_Hospital,
                              Restrictions_List: RestrictionsList,
                              Location_Id: this.HospitalInfo.Location._id
                           };
               this.DischargeService.DischargeHospitals_ClusterBased(Data).subscribe(response => {
                  if (response.Status) {
                     this.HospitalList = response.Response;
                     const PreviousHospital = [];
                     this.PatientInfo.Hospital_History.map(obj => {
                        PreviousHospital.push(obj.Hospital._id);
                     });
                     this.HospitalList = this.HospitalList.filter(obj => !PreviousHospital.includes(obj._id));
                     this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Name.updateValueAndValidity();
                     this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Address.updateValueAndValidity();
                     this.SetAddress(this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Name.value);
                  }
               });
            } else if (change === 'Other_Cluster') {
               const Data = {
                  Clusters: this.HospitalInfo.Connected_Clusters,
                  Location_Id: this.HospitalInfo.Location._id
               };
               this.DischargeService.DischargeOther_Clusters(Data).subscribe(response => {
                  if (response.Status) {
                     this.ClustersList = response.Response;
                     this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster.updateValueAndValidity();
                  }
               });
               this.ClusterChangeSubscription.add(
                  this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster.valueChanges.subscribe(changeNew => {
                     if (changeNew !== null && typeof changeNew === 'object' && changeNew._id) {
                        const SelectedCluster = this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster.value._id;
                        if (SelectedCluster && SelectedCluster !== null && SelectedCluster !== '') {
                           const HospitalTypes = [];
                           StaticHospitalTypes.map(obj => { HospitalTypes.push(obj); });
                           const TypeIndex = HospitalTypes.findIndex(obj => obj === this.HospitalInfo.Hospital_Role);
                           let RestrictionsList = [];
                           if (TypeIndex > 2) {
                              HospitalTypes.splice(0, 3);
                              RestrictionsList = HospitalTypes;
                           } else {
                              HospitalTypes.splice(0, TypeIndex);
                              RestrictionsList = HospitalTypes;
                           }
                           const ClusterArr = [];
                           ClusterArr.push(SelectedCluster);
                           const DataNew = { Clusters: ClusterArr,
                              Hospital_Id: this.PatientInfo.Initiated_Hospital,
                              Restrictions_List: RestrictionsList,
                              Location_Id: this.HospitalInfo.Location._id
                           };
                           this.DischargeService.DischargeHospitals_ClusterBased(DataNew).subscribe(response => {
                              if (response.Status) {
                                 this.HospitalList = response.Response;
                                 const PreviousHospital = [];
                                 this.PatientInfo.Hospital_History.map(obj => {
                                    PreviousHospital.push(obj.Hospital._id);
                                 });
                                 this.HospitalList = this.HospitalList.filter(obj => !PreviousHospital.includes(obj._id));
                                 if (this.LastSelectedHospital !== null) {
                                    const HosList = this.HospitalList.filter(obj1 => obj1._id === this.LastSelectedHospital);
                                    if (HosList.length === 0) {
                                       this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Name.setValue(null);
                                    }
                                 }
                                 this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Name.updateValueAndValidity();
                                 this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Address.updateValueAndValidity();
                                 this.SetAddress(this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Name.value);
                              }
                           });
                        } else {
                           this.HospitalList = [];
                           this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Name.setValue(null);
                           this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Address.setValue('');
                        }
                     } else if (changeNew === null || changeNew === '') {
                        this.HospitalList = [];
                        this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Name.setValue(null);
                        this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Address.setValue('');
                     }
                  })
               );
            }

            //  Transport Date Time validation Control
            this.TransferVehicleSubscription.add(
               this.DynamicFGroup.controls.Transport_Vehicle.valueChanges.subscribe(changeNew => {
                  const DateKeys = [ 'Transport_Vehicle_Other',
                                    'Discharge_Cluster_Ambulance',
                                    'Discharge_Ambulance_Call_Date_Time',
                                    'Discharge_Ambulance_Call_Time',
                                    'Discharge_Ambulance_Arrival_Date_Time',
                                    'Discharge_Ambulance_Arrival_Time',
                                    'Discharge_Ambulance_Departure_Date_Time',
                                    'Discharge_Ambulance_Departure_Time'];
                  if (changeNew !== '' && changeNew !== null && changeNew !== 'Others' && changeNew !== 'Private' && changeNew !== 'Public') {
                     if (changeNew !== 'Cluster_Ambulance' || this.HospitalInfo.Hospital_Role === 'EMS') {
                        DateKeys.splice(0, 1);
                     }
                     if (changeNew === 'Cluster_Ambulance' && this.HospitalInfo.Hospital_Role !== 'EMS') {
                        const Data = { Location_Id: this.HospitalInfo.Location._id };
                        this.DischargeService.DischargeAmbulance_LocationBased(Data).subscribe(response => {
                           if (response.Status) {
                              this.AmbulancesList = response.Response;
                              this.DynamicFGroup.controls.Discharge_Cluster_Ambulance.updateValueAndValidity();
                           }
                        });
                        this.filteredAmbulancesList = this.DynamicFGroup.controls.Discharge_Cluster_Ambulance.valueChanges.pipe(
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
                     DateKeys.map(obj => {
                        const Index = this.AllFieldsValues.findIndex(objNew => objNew.Key_Name === obj);
                        const FieldObject = this.AllFieldsValues[Index];
                        this.CommonValidatorsSet(FieldObject.Key_Name, FieldObject.ThisIsTime, FieldObject.ParentDateKey);
                     });
                  } else {
                     DateKeys.map(obj => {
                        const Index = this.AllFieldsValues.findIndex(objNew => objNew.Key_Name === obj);
                        const FieldObject = this.AllFieldsValues[Index];
                        const SetValue = (FieldObject.Type === 'Select' || FieldObject.Type === 'Date' || FieldObject.Type === 'Number' || FieldObject.Type === 'Boolean' ) ? null : '';
                        this.CommonInputReset(obj, SetValue);
                     });
                  }
               })
            );
            this.DynamicFGroup.controls.Transport_Vehicle.updateValueAndValidity();
         })
      );
   }
}

SetAddress(Hospital: any) {
   if (Hospital !== null ) {
      const Index = this.AllFieldsValues.findIndex(objNew => objNew.Key_Name === 'Transfer_to_Stemi_Cluster_Hospital_Address');
      const FieldObject = this.AllFieldsValues[Index];
      if (FieldObject.Visibility) {
         this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Address.setValue(Hospital.Address);
      }
   } else {
      this.DynamicFGroup.controls.Transfer_to_Stemi_Cluster_Hospital_Address.setValue('');
   }
}

OtherMedicationArrayDataUpdate() {
   const FilteredFields = this.AllFieldsValues.filter(obj => obj.Key_Name === 'Discharge_Medications_Other_Medicine');
   this.OtherMedicationData.map(OBJ => {
      const NewFGroup = new FormGroup({});
      FilteredFields.map(obj => {
         const SetValue = (OBJ[obj.Key_Name] && OBJ[obj.Key_Name] !== null && OBJ[obj.Key_Name] !== '') ? OBJ[obj.Key_Name] : '';
         let FormControlValidation = null;
         if (obj.Mandatory || obj.Validation) {
            FormControlValidation = Validators.compose([ this.CustomDynamicValidation(obj), Validators.min(obj.Min_Number_Value), Validators.max(obj.Max_Number_Value) ]);
         }
         NewFGroup.addControl(obj.Key_Name, new FormControl(SetValue, FormControlValidation ));
      });
      this.OtherMedicationArray = this.DynamicFGroup.get('OtherMedicationArray') as FormArray;
      this.OtherMedicationArray.push(NewFGroup);
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
      if (this.TabsList[this.CurrentTabIndex] !== 'Discharge_Transfer' ) {
         this.YesOrNoValidations();
      }
   } else {
      this.DynamicFGroup.disable();
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
                     SubscribeLimitControl = SubscribeLimitControl.filter(obj1  => obj1.Key_Name !== 'Discharge_Medications_Other_Medicine');
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
         if (obj.Key_Name !== 'Discharge_Medications_Other_Medicine' && !obj.ThisIsTime) {
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
         return RestrictionFields.filter(obj3 => obj3 !== 'Discharge_Medications_Other_Medicine');
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

YesOrNoValidations() {
   const FControlKeys = Object.keys(this.DynamicFGroup.controls);
   const FilteredFields = this.AllFieldsValues.filter(obj => obj.Sub_Category === this.TabsList[this.CurrentTabIndex]);
   FControlKeys.map(obj => {
      const LimitArr = this.AllFieldsValues.filter(obj1 => obj1.Key_Name === obj &&  (obj1.Type === 'Select' || obj1.Type === 'Boolean'));
      if (LimitArr.length > 0) {
         const Parent = LimitArr[0];
         const ChildeArr =  FilteredFields.filter(obj1 => obj1.If_Parent_Available && obj1.Parent.Key_Name === Parent.Key_Name);
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
   if (KeyName === 'Discharge_Medications_Other_Medicine') {
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
               const IndexNew = this.AllValidations.findIndex(objNew => (objNew.Name.trim().split(' ').join('')) === obj);
               if (IndexNew > -1) {
                  returnText = this.AllValidations[IndexNew].Error_Message;
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
   const FilteredFields = this.AllFieldsValues.filter(obj => obj.Key_Name === 'Discharge_Medications_Other_Medicine');
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
}

removeArrayControl(index: any) {
   this.OtherMedicationArray.removeAt(index);
}

CheckTimeRelatedDateErrorStatus(DateKey: any, TimeKey: any) {
   if (this.DynamicFGroup.get(DateKey)) {
      return (this.DynamicFGroup.get(DateKey).errors !== null) ? true :
               (this.DynamicFGroup.get(TimeKey).errors !== null) ? true : false;
   } else {
      return (this.DynamicFGroup.get(TimeKey).errors !== null) ? true : false;
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

ClusterDisplayName(Cluster: any) {
   return (Cluster && Cluster !== null && Cluster !== '') ? Cluster.Cluster_Name : null;
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

EditHistoryArray(formArray: any, index: any) {
   const AlwaysDisable = ['Transfer_to_Stemi_Cluster', 'Transfer_to_Stemi_Cluster_Hospital_Name', 'Transfer_to_Stemi_Cluster_Hospital_Address', 'Discharge_Cluster_Ambulance'];
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
         FControl.enable();
         if (fieldIndex >= 0) {
            const validationControl = this.AllFieldsValues[fieldIndex];
            FControl.setValidators(Validators.compose([this.CustomDynamicValidation(validationControl), Validators.min(validationControl.Min_Number_Value), Validators.max(validationControl.Max_Number_Value)]));
         }
      }
   });
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
TransferHistoryMedicationUpdate(index: any) {
   this.SecondaryUpdating = true;
   const FArray = this.HistoryFGroup.get('MedicationHistory') as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;
   if (FGroup.status === 'VALID') {
      this.DischargeService.TransferHistoryMedication_Update(FGroup.getRawValue()).subscribe(response => {
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
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Medication Details Successfully Updated!' });
         } else {
            if (response.Message === undefined || response.Message === '' || response.Message === null) {
               response.Message = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
         }
      });
   }
}
TransferHistoryMedicationCreate(index: any) {
   this.SecondaryUpdating = true;
   const FArray = this.HistoryFGroup.get('MedicationHistory') as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;
   if (FGroup.status === 'VALID') {
      this.DischargeService.TransferHistoryMedication_Create(FGroup.getRawValue()).subscribe(response => {
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
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Medication Details Successfully Updated!' });
         } else {
            if (response.Message === undefined || response.Message === '' || response.Message === null) {
               response.Message = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
         }
      });
   }
}
DischargeHistoryUpdate(index: any) {
   this.SecondaryUpdating = true;
   const FArray = this.HistoryFGroup.get('DischargeHistory') as FormArray;
   const FGroup =  FArray.controls[index] as FormGroup;
   this.UpdateDateTimeInHistory('Discharge_Details', FGroup);
   if (FGroup.status === 'VALID') {
      this.DischargeService.DischargeHistory_Update(FGroup.getRawValue()).subscribe(response => {
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
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Discharge Details Successfully Updated!' });
         } else {
            if (response.Message === undefined || response.Message === '' || response.Message === null) {
               response.Message = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
         }
      });
   }
}


DeathSubmit() {
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
      this.DischargeService.DischargeTransferDeath_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
         this.FormUploading = false;
         if (response.Status) {
            this.DeathId = response.Response._id;
            const DischargeTransferDeath =  response.Response.Discharge_Transfer_Death;
            if (DischargeTransferDeath && DischargeTransferDeath !== null && DischargeTransferDeath !== '' && DischargeTransferDeath === 'Yes' ) {
               this.PatientDeath =  true;
               this.dataPassingService.UpdateTransferDeathData(true);
            } else {
               this.PatientDeath = false;
               this.TabChangeEvent(1);
               if (this.CurrentHospitalInfo.Hospital_Role === 'EMS') {
                  this.TabChangeEvent(2);
               } else {
                  this.TabChangeEvent(1);
               }
               this.dataPassingService.UpdateTransferDeathData(false);
            }
            this.PatientUpdateData(response.Response, 'Death', false);
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Death Details Successfully Created!' });
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

DeathUpdate() {
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
      this.DischargeService.DischargeTransferDeath_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
         this.FormUploading = false;
         if (response.Status) {
            const DischargeTransferDeath =  response.Response.Discharge_Transfer_Death;
            if (DischargeTransferDeath && DischargeTransferDeath !== null && DischargeTransferDeath !== '' && DischargeTransferDeath === 'Yes' ) {
               this.PatientDeath =  true;
               this.dataPassingService.UpdateTransferDeathData(true);
               if (this.PatientInfo.Hospital_History.length > 1) {
                  if (this.CurrentHospitalInfo.Hospital_Role === 'EMS') {
                     this.TabChangeEvent(2);
                  } else {
                     this.TabChangeEvent(1);
                  }
               }
            } else {
               this.PatientDeath = false;
               this.dataPassingService.UpdateTransferDeathData(false);
               if (this.CurrentHospitalInfo.Hospital_Role === 'EMS') {
                  this.TabChangeEvent(2);
               } else {
                  this.TabChangeEvent(1);
               }
            }
            this.PatientUpdateData(response.Response, 'Death', false);
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Death Details Successfully Updated!' });
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

DischargeMedicationSubmit() {
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
      this.DischargeService.DischargeTransferMedication_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
         this.FormUploading = false;
         if (response.Status) {
            if (response.Response.length >= 1 ) {
               response.Response.map(obj => {
                  if (obj.Hospital._id === this.InitialHospital) {
                     this.DischargeMedicationId = response.Response[response.Response.length - 1]._id;
                  }
               });
            }
            this.PatientUpdateData(response.Response, 'DischargeMedication', false);
            this.TabChangeEvent(2);
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Discharge Medication Details Successfully Created!' });
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

DischargeMedicationUpdate() {
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
      this.DischargeService.DischargeTransferMedication_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
         this.FormUploading = false;
         if (response.Status) {
            this.PatientUpdateData(response.Response, 'DischargeMedication', false);
            this.TabChangeEvent(2);
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Discharge Medication Details Successfully Updated!' });
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

DischargeSubmit() {
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
      this.DischargeService.DischargeTransferDischarge_Create(this.DynamicFGroup.getRawValue()).subscribe(response => {
         this.FormUploading = false;
         if (response.Status) {
            if (response.Response.length >= 1 ) {
               response.Response.map(obj => {
                  if (obj.Hospital._id === this.InitialHospital) {
                     this.DischargeId = response.Response[response.Response.length - 1]._id;
                  }
               });
            }
            // this.PatientUpdateData(response.Response, 'Discharge', false);
            const DischargeTransfer =  response.Response.Discharge_Transfer_To;
            if (DischargeTransfer && DischargeTransfer !== null && DischargeTransfer !== '' && (DischargeTransfer === 'Non_Stemi_Cluster' || DischargeTransfer === 'Home' || DischargeTransfer ===  'Step_Down_Facility') && this.CurrentHospitalInfo.Hospital_Role !== 'EMS') {
               this.dataPassingService.UpdateTransferHomeData(true);
               this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                  this.router.navigate(['/Patient-Manage/Follow-Up', this.UrlParams.Patient])
               );
            } else {
               this.dataPassingService.UpdateTransferHomeData(false);
               this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                  this.router.navigate(['/Patient-Manage/Patient-Details', this.UrlParams.Patient])
               );
            }
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Discharge/ Transfer Details Successfully Created!' });
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

DischargeUpdate() {
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
      this.DischargeService.DischargeTransferDischarge_Update(this.DynamicFGroup.getRawValue()).subscribe(response => {
         this.FormUploading = false;
         if (response.Status) {
            // this.PatientUpdateData(response.Response, 'Discharge', false);
            const DischargeTransfer =  response.Response.Discharge_Transfer_To;
            if (DischargeTransfer && DischargeTransfer !== null && DischargeTransfer !== '' && (DischargeTransfer === 'Non_Stemi_Cluster' || DischargeTransfer === 'Home' || DischargeTransfer ===  'Step_Down_Facility') && this.CurrentHospitalInfo.Hospital_Role !== 'EMS') {
               this.dataPassingService.UpdateTransferHomeData(true);
               this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                  this.router.navigate(['/Patient-Manage/Follow-Up', this.UrlParams.Patient])
               );
            } else {
               this.dataPassingService.UpdateTransferHomeData(false);
               this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                  this.router.navigate(['/Patient-Manage/Patient-Details', this.UrlParams.Patient])
               );
            }
            this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Discharge/ Transfer Details Successfully Updated!' });
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
