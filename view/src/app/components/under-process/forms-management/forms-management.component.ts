import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, Validators, FormControl, FormArray, AbstractControl } from '@angular/forms';

import { LocationService } from '../.../../../../services/location-management/location.service';
import { ClusterManagementService } from '../.../../../../services/cluster-management/cluster-management.service';
import { UnderProcessService } from './../../../services/under-process/under-process.service';
import { ToastrService } from '../../../services/common-services/toastr.service';

import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material';
import { Observable, forkJoin, Subscription } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { BsModalService, BsModalRef } from 'ngx-bootstrap';
import { ModalIdProofConfigComponent } from '../../Modals/modal-id-proof-config/modal-id-proof-config.component';

export interface Locations { _id: string; Location_Name: string; }
export interface Clusters { _id: string; Cluster_Name: string; }

@Component({
  selector: 'app-forms-management',
  templateUrl: './forms-management.component.html',
  styleUrls: ['./forms-management.component.css']
})
export class FormsManagementComponent implements OnInit, OnDestroy {

   AllFields: any[] = [];
   AllValidations: any[] = [];
   modalReference: BsModalRef;

   AllVisibility = false;
   AllMandatory = false;
   AllValidation = false;

   FormGroup: FormGroup;

   FormChangesDetection = false;
   DBRenderedFormValues: any[] = [];

   LocationsList: Locations[] = [];
   filteredLocationsList: Observable<Locations[]>;
   LastSelectedLocation = null;
   ClustersList: Clusters[] = [];
   filteredClustersList: Observable<Clusters[]>;
   LastSelectedCluster = null;

   FormUpdateLoading = false;
   ConfigEnable = false;
   FilterForm: FormGroup;
   ClusterId = null;
   private subscription: Subscription = new Subscription();
   Category = 'Default';

   ActiveSection = { If_Active: false, Category_Index: -1, Category_Name: '', Sub_Category_Index: -1, Sub_Category_Name: '', Skip: 0, limit: 0 };

   CategoriesAndSubCategories: any[] = [  {  Category_key: 'Patient_Details', Category_Name: 'Patient Details',
                                             Sub_Categories: [ { Key: 'Basic_Details', Name: 'Basic Details', Active: false, Skip: 0, limit: 0 },
                                                               { Key: 'Fibrinolytic_Checklist', Name: 'Fibrinolytic Checklist', Active: false, Skip: 0, limit: 0 },
                                                               { Key: 'Medication_During_Transportation', Name: 'Medication During Transportation', Active: 0, Skip: 0, limit: 0 },
                                                               { Key: 'Cardiac_History', Name: 'Cardiac History', Active: false, Skip: 0, limit: 0 },
                                                               { Key: 'Co-Morbid_Conditions', Name: 'Co-Morbid Conditions', Active: false, Skip: 0, limit: 0 },
                                                               { Key: 'Contact_Details', Name: 'Contact Details', Active: false, Skip: 0, limit: 0 } ] },
                                          {  Category_key: 'Thrombolysis', Category_Name: 'Thrombolysis',
                                             Sub_Categories: [ { Key: 'Medication_Prior_to_Thrombolysis', Name: 'Medication Prior to Thrombolysis', Active: false, Skip: 0, limit: 0 },
                                                               { Key: 'Thrombolysis', Name: 'Thrombolysis', Active: false, Skip: 0, limit: 0 } ] },
                                          {  Category_key: 'PCI', Category_Name: 'PCI',
                                             Sub_Categories: [ { Key: 'Drug_Before_Pci', Name: 'Drug Before PCI', Active: false, Skip: 0, limit: 0 },
                                                               { Key: 'PCI', Name: 'PCI', Active: false, Skip: 0, limit: 0 },
                                                               { Key: 'Medication_in_Cath', Name: 'Medication in Cath', Active: false, Skip: 0, limit: 0 } ] },
                                          {  Category_key: 'In_Hospital_Summary', Category_Name: 'In Hospital Summary',
                                             Sub_Categories: [ { Key: 'Lab_Report', Name: 'Lab Report', Active: false, Skip: 0, limit: 0 },
                                                               { Key: 'Medication_in_Hospital', Name: 'Medication in Hospital', Active: false, Skip: 0, limit: 0 },
                                                               { Key: 'Adverse_Events', Name: 'Adverse Events', Active: false, Skip: 0, limit: 0 } ] },
                                          {  Category_key: 'Discharge_Transfer', Category_Name: 'Discharge / Transfer',
                                             Sub_Categories: [ { Key: 'Death', Name: 'Death', Active: false, Skip: 0, limit: 0 },
                                                               { Key: 'Discharge_Medications', Name: 'Discharge Medications', Active: false, Skip: 0, limit: 0 },
                                                               { Key: 'Discharge_Transfer', Name: 'Discharge / Transfer', Active: false, Skip: 0, limit: 0 } ] },
                                          {  Category_key: 'Follow_Up', Category_Name: 'Follow Up',
                                             Sub_Categories: [ { Key: 'Follow_Up_Details', Name: 'Follow Up Details', Active: false, Skip: 0, limit: 0 },
                                                               { Key: 'Medication', Name: 'Medication', Active: false, Skip: 0, limit: 0 },
                                                               { Key: 'Events', Name: 'Events', Active: false, Skip: 0, limit: 0 } ] } ];


   constructor(   private UnderProcess: UnderProcessService,
                  private snackBar: MatSnackBar,
                  public LocService: LocationService,
                  public Toastr: ToastrService,
                  public ModalService: BsModalService,
                  public ClusterService: ClusterManagementService) {
      this.LocService.StemiLocations_SimpleList({}).subscribe(response => {
         if (response.Status && response.Status === true ) {
            this.LocationsList = response.Response;
            setTimeout(() => {
               this.FilterForm.controls.Location.updateValueAndValidity();
            }, 100);
         } else if (!response.Status && response.ErrorCode === 400 || response.ErrorCode === 401 || response.ErrorCode === 417) {
            if (response.ErrorMessage === undefined || response.ErrorMessage === '' || response.ErrorMessage === null) {
               response.ErrorMessage = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.ErrorMessage });
         } else {
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Location Records Getting Error!, But not Identify!' });
         }
      });

      forkJoin(
         this.UnderProcess.All_Fields(),
         this.UnderProcess.All_Validations()
      ).subscribe( ([Res1, Res2]) => {
         if (Res1.Status && Res2.Status) {
            this.AllFields = Res1.Response;
            this.AllValidations = Res2.Response;
            const TempAllFields = [];
            let SkipCount = 0;
            this.CategoriesAndSubCategories.map(obj => {
               let SubCategories = [];
               SubCategories = obj.Sub_Categories;
               SubCategories.map(objNew => {
                  const Temp = this.AllFields.filter(objObj => objObj.Sub_Category === objNew.Key);
                  objNew.Length = Temp.length;
                  objNew.Skip = SkipCount;
                  objNew.limit = SkipCount + Temp.length;
                  Temp.map(objObj => {
                     TempAllFields.push(objObj);
                  });
                  SkipCount = TempAllFields.length;
               });
            });
            this.AllFields = TempAllFields;
            this.ActivateFormGroups();
         }
      });
   }

   ngOnInit() {
      this.FilterForm = new FormGroup({
         Location: new FormControl(null),
         Cluster: new FormControl(null),
         If_Default: new FormControl({value: true, disabled: true}),
      });
      this.AutocompleteFilters();
      this.FormGroup = new FormGroup({
         FormArray: new FormArray([]),
      });
   }

   ngOnDestroy() {
      this.subscription.unsubscribe();
   }

   LocationDisplayName(Location: any) {
      return (Location && Location !== null && Location !== '') ? Location.Location_Name : null;
   }
   ClusterDisplayName(Cluster: any) {
      return (Cluster && Cluster !== null && Cluster !== '') ? Cluster.Cluster_Name : null;
   }
   AutocompleteFilters() {
      this.filteredLocationsList = this.FilterForm.controls.Location.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                  if (this.LastSelectedLocation === null || this.LastSelectedLocation !== value._id) {
                     this.LastSelectedLocation = value._id;
                     this.onSelectLocation(value._id);
                  }
                  value = value.Location_Name;
               }
               return this.LocationsList.filter(option => option.Location_Name.toLowerCase().includes(value.toLowerCase()));
            } else {
               this.LastSelectedLocation = null;
               this.FilterForm.controls.Cluster.setValue(null);
               this.ClustersList = [];
               return this.LocationsList;
            }
         })
      );
      this.filteredClustersList = this.FilterForm.controls.Cluster.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                  if (this.LastSelectedCluster === null || this.LastSelectedCluster !== value._id) {
                     this.LastSelectedCluster = value._id;
                     this.onSelectCluster(value._id);
                  }
                  value = value.Cluster_Name;
               }
               return this.ClustersList.filter(option => option.Cluster_Name.toLowerCase().includes(value.toLowerCase()));
            } else {
               this.LastSelectedCluster = null;
               return this.ClustersList;
            }
         })
      );
   }
   AutocompleteBlur(key: any) {
      setTimeout(() => {
         const value =  this.FilterForm.controls[key].value;
         if (!value || value === null || value === '' || typeof value !== 'object') {
            this.FilterForm.controls[key].setValue(null);
         }
      }, 500);
   }
   onSelectLocation(Location: any) {
      if (Location !== null && Location !== undefined && Location !== '') {
         this.ClusterService.ClustersSimpleList_LocationBased({ Location_Id: Location }).subscribe( response => {
            if (response.Status && response.Status === true ) {
               this.ClustersList = response.Response;
               setTimeout(() => {
                  this.FilterForm.controls.Cluster.updateValueAndValidity();
               }, 100);
            } else if (!response.Status && response.ErrorCode === 400 || response.ErrorCode === 401 || response.ErrorCode === 417) {
               if (response.ErrorMessage === undefined || response.ErrorMessage === '' || response.ErrorMessage === null) {
                  response.ErrorMessage = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.ErrorMessage });
            } else {
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Cluster Records Getting Error!, But not Identify!' });
            }
            this.FilterForm.controls.Cluster.setValue(null);
         });
      } else {
         this.FilterForm.controls.Cluster.setValue(null);
      }
   }
   onSelectCluster(Cluster: any) {
      if (Cluster !== null && Cluster !== undefined && Cluster !== '') {
         this.ClusterId = Cluster;
         this.Category = 'Cluster';
         this.FilterForm.controls.If_Default.enable();
         this.FilterForm.controls.If_Default.setValue(false);
         this.ActiveSection.If_Active = false;
         this.ClusterService.ClusterBased_ControlPanelFields({ Cluster_Id: Cluster }).subscribe( response => {
            if (response.Status && response.Status === true ) {
               const TempAllFields = [];
               let SkipCount = 0;
               this.AllFields = response.Response;
               this.CategoriesAndSubCategories.map(obj => {
                  let SubCategories = [];
                  SubCategories = obj.Sub_Categories;
                  SubCategories.map(objNew => {
                     const Temp = this.AllFields.filter(objObj => objObj.Sub_Category === objNew.Key);
                     objNew.Length = Temp.length;
                     objNew.Skip = SkipCount;
                     objNew.limit = SkipCount + Temp.length;
                     Temp.map(objObj => {
                        TempAllFields.push(objObj);
                     });
                     SkipCount = TempAllFields.length;
                  });
               });
               this.AllFields = TempAllFields;
               this.ActivateFormGroups();
            }
         });
      }
   }

   LoadDefault(event: MatCheckboxChange) {
      if (event.checked === true) {
         this.ClusterId = null;
         this.Category = 'Default';
         this.FilterForm.controls.Location.setValue(null);
         this.FilterForm.controls.Cluster.setValue(null);
         this.FilterForm.controls.If_Default.disable();
         this.ActiveSection.If_Active = false;
         this.UnderProcess.All_Fields().subscribe(response => {
            if (response.Status) {
               this.AllFields = response.Response;
               const TempAllFields = [];
               let SkipCount = 0;
               this.CategoriesAndSubCategories.map(obj => {
                  let SubCategories = [];
                  SubCategories = obj.Sub_Categories;
                  SubCategories.map(objNew => {
                     const Temp = this.AllFields.filter(objObj => objObj.Sub_Category === objNew.Key);
                     objNew.Length = Temp.length;
                     objNew.Skip = SkipCount;
                     objNew.limit = SkipCount + Temp.length;
                     Temp.map(objObj => {
                        TempAllFields.push(objObj);
                     });
                     SkipCount = TempAllFields.length;
                  });
               });
               this.AllFields = TempAllFields;
               this.ActivateFormGroups();
            }
         });
      } else {
         const CurrentCluster = this.FilterForm.value.Cluster && this.FilterForm.value.Cluster !== null && this.FilterForm.value.Cluster !== '' ? this.FilterForm.value.Cluster : null;
         if (CurrentCluster !== null && CurrentCluster._id && CurrentCluster._id !== null) {
            this.onSelectCluster(CurrentCluster._id);
         }
      }
   }


   SectionActivate(index: any, subIndex: any) {
      this.ActiveSection.If_Active = false;
      this.CategoriesAndSubCategories.map(obj => {
         obj.Sub_Categories.map(objNew => {
            objNew.Active = false;
         });
      });
      if (index === 0 && subIndex === 5) {
         this.ConfigEnable = true;
      }
      if (index >= 0 && subIndex >= 0) {
         this.CategoriesAndSubCategories[index].Sub_Categories[subIndex].Active = true;
         this.ActiveSection.Category_Index = index;
         this.ActiveSection.Category_Name = this.CategoriesAndSubCategories[index].Category_Name;
         this.ActiveSection.Sub_Category_Index = subIndex; 
         this.ActiveSection.Sub_Category_Name = this.CategoriesAndSubCategories[index].Sub_Categories[subIndex].Name;
         this.ActiveSection.Skip = this.CategoriesAndSubCategories[index].Sub_Categories[subIndex].Skip;
         this.ActiveSection.limit = this.CategoriesAndSubCategories[index].Sub_Categories[subIndex].limit;
         this.ActiveSection.If_Active = true;
      }
      this.AllVisibilityCheck();
      this.AllMandatoryCheck();
      this.AllValidationCheck();

   }

   AllVisibilityCheck() {
      const FArray = this.FormGroup.controls.FormArray as FormArray;
      this.AllVisibility = true;
      FArray.controls.map( (obj, i) => {
         if (i >= this.ActiveSection.Skip && i < this.ActiveSection.limit) {
            const FGroup = obj as FormGroup;
            this.AllVisibility = FGroup.get('Visibility').value !== true ? false : this.AllVisibility;
         }
      });
   }
   AllMandatoryCheck() {
      const FArray = this.FormGroup.controls.FormArray as FormArray;
      this.AllMandatory = true;
      FArray.controls.map( (obj, i) => {
         if (i >= this.ActiveSection.Skip && i < this.ActiveSection.limit) {
            const FGroup = obj as FormGroup;
            this.AllMandatory = FGroup.get('Mandatory').value !== true ? false : this.AllMandatory;
         }
      });
   }
   AllValidationCheck() {
      const FArray = this.FormGroup.controls.FormArray as FormArray;
      this.AllValidation = true;
      FArray.controls.map( (obj, i) => {
         if (i >= this.ActiveSection.Skip && i < this.ActiveSection.limit) {
            const FGroup = obj as FormGroup;
            this.AllValidation = FGroup.get('Validation').value !== true ? false : this.AllValidation;
         }
      });
   }


   AllVisibilityChange(event: MatCheckboxChange) {
      const FArray = this.FormGroup.controls.FormArray as FormArray;
      if (event) {
         FArray.controls.map( (obj, i) => {
            if (i >= this.ActiveSection.Skip && i < this.ActiveSection.limit) {
               const FGroup = obj as FormGroup;
               if (FGroup.controls.Visibility.value !== true) {
                  FGroup.controls.Visibility.setValue(true);
               }
            }
         });
      } else {
         FArray.controls.map( (obj, i) => {
            if (i >= this.ActiveSection.Skip && i < this.ActiveSection.limit) {
               const FGroup = obj as FormGroup;
               if (FGroup.controls.Visibility.value !== false) {
                  FGroup.controls.Visibility.setValue(false);
               }
            }
         });
      }
   }

   AllMandatoryChange(event: MatCheckboxChange) {
      const FArray = this.FormGroup.controls.FormArray as FormArray;
      if (event) {
         FArray.controls.map( (obj, i) => {
            if (i >= this.ActiveSection.Skip && i < this.ActiveSection.limit) {
               const FGroup = obj as FormGroup;
               if (FGroup.controls.Mandatory.value !== true) {
                  FGroup.controls.Mandatory.setValue(true);
               }
            }
         });
      } else {
         FArray.controls.map( (obj, i) => {
            if (i >= this.ActiveSection.Skip && i < this.ActiveSection.limit) {
               const FGroup = obj as FormGroup;
               if (FGroup.controls.Mandatory.value !== false) {
                  FGroup.controls.Mandatory.setValue(false);
               }
            }
         });
      }
   }

   AllValidationChange(event: MatCheckboxChange) {
      const FArray = this.FormGroup.controls.FormArray as FormArray;
      if (event) {
         FArray.controls.map( (obj, i) => {
            if (i >= this.ActiveSection.Skip && i < this.ActiveSection.limit) {
               const FGroup = obj as FormGroup;
               if (FGroup.controls.Validation.value !== true) {
                  FGroup.controls.Validation.setValue(true);
               }
            }
         });
      } else {
         FArray.controls.map( (obj, i) => {
            if (i >= this.ActiveSection.Skip && i < this.ActiveSection.limit) {
               const FGroup = obj as FormGroup;
               if (FGroup.controls.Validation.value !== false) {
                  FGroup.controls.Validation.setValue(false);
               }
            }
         });
      }
   }

   ValidateNumber(control: AbstractControl) {
      let value: string = control.value || '';
      value = (value === '') ? '0' : value;
      const regex = new RegExp('^[0-9.]+$');
      const valid = regex.test(value);
      return valid ? null : {ValidNumber: true};
   }

   GetFormControlErrorMessage(KeyName: any, index: number) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      const FControl = FGroup.get(KeyName) as FormControl;
      if (FControl.invalid && FControl.dirty && FControl.touched) {
         return FControl.hasError('required') ? 'This field is required' :
                  FControl.hasError('ValidNumber') ? 'Enter a valid number' :
                  '';
      } else {
         return '';
      }
   }

   ActivateFormGroups() {
      if (this.AllValidations.length > 0 && this.AllFields.length > 0) {
         this.subscription.unsubscribe();
         this.subscription = new Subscription();
         this.FormChangesDetection = false;
         const controlArray = this.FormGroup.get('FormArray') as FormArray;
         while (controlArray.length !== 0) {
            controlArray.removeAt(0);
         }
         this.FormGroup.reset();
         this.AllFields.map(obj => {
            const ParentId = (obj.Parent !== null) ? obj.Parent._id : null;
            const ValidationControlArray = obj.Validation_Control_Array.map(objNew => (objNew.Validation_Control !== null) ? objNew.Validation_Control._id : null);
            const MinDateFieldId = (obj.Min_Date_Field !== null) ? obj.Min_Date_Field._id : null;
            const MaxDateFieldId = (obj.Max_Date_Field !== null) ? obj.Max_Date_Field._id : null;
            const MinNumberFieldId = (obj.Min_Number_Field !== null) ? obj.Min_Number_Field._id : null;
            const MaxNumberFieldId = (obj.Max_Number_Field !== null) ? obj.Max_Number_Field._id : null;
            const MinDateArray = obj.Min_Date_Array.map(objNew => (objNew.Min_Date_Field !== null) ? objNew.Min_Date_Field._id : null);
            const MaxDateArray = obj.Max_Date_Array.map(objNew => (objNew.Max_Date_Field !== null) ? objNew.Max_Date_Field._id : null);

            const ValidationControlArrayValidation = obj.If_Validation_Control_Array ? Validators.required : null;
            const MinNumberValueValidation = obj.If_Min_Number_Restriction ? [Validators.required, this.ValidateNumber] : null;
            const MinNumberFieldValidation = obj.If_Min_Number_Field_Restriction ? Validators.required : null;
            const MaxNumberValueValidation = obj.If_Max_Number_Restriction ? [Validators.required, this.ValidateNumber] : null;
            const MaxNumberFieldValidation = obj.If_Max_Number_Field_Restriction ? Validators.required : null;
            const MinDateFieldValidation = obj.If_Min_Date_Restriction ? Validators.required : null;
            const MinDateArrayValidation = obj.If_Min_Date_Array_Available ? Validators.required : null;
            const MaxDateFieldValidation = obj.If_Max_Date_Restriction ? Validators.required : null;
            const MaxDateArrayValidation = obj.If_Max_Date_Array_Available ? Validators.required : null;

            const NewFormGroup = new FormGroup({
               _id: new FormControl(obj._id, Validators.required),
               Name: new FormControl(obj.Name, Validators.required),
               Key_Name: new FormControl(obj.Key_Name, Validators.required),
               Type: new FormControl(obj.Type, Validators.required),
               If_Child_Available: new FormControl(obj.If_Child_Available),
               If_Parent_Available: new FormControl(obj.If_Parent_Available),
               Parent: new FormControl(ParentId),
               Visibility: new FormControl(obj.Visibility),
               Mandatory: new FormControl(obj.Mandatory),
               Validation: new FormControl(obj.Validation),
               If_Validation_Control_Array: new FormControl(obj.If_Validation_Control_Array),
               Validation_Control_Array: new FormControl(ValidationControlArray, ValidationControlArrayValidation),
               If_Date_Restriction: new FormControl(obj.If_Date_Restriction),
               If_Min_Date_Restriction: new FormControl(obj.If_Min_Date_Restriction),
               Min_Date_Field: new FormControl(MinDateFieldId, MinDateFieldValidation),
               If_Min_Date_Array_Available: new FormControl(obj.If_Min_Date_Array_Available),
               Min_Date_Array: new FormControl(MinDateArray, MinDateArrayValidation),
               If_Max_Date_Restriction: new FormControl(obj.If_Max_Date_Restriction),
               Max_Date_Field: new FormControl(MaxDateFieldId, MaxDateFieldValidation),
               If_Max_Date_Array_Available: new FormControl(obj.If_Max_Date_Array_Available),
               Max_Date_Array: new FormControl(MaxDateArray, MaxDateArrayValidation),
               If_Future_Date_Available: new FormControl(obj.If_Future_Date_Available),
               If_Number_Restriction: new FormControl(obj.If_Number_Restriction),
               If_Min_Number_Restriction: new FormControl(obj.If_Min_Number_Restriction),
               Min_Number_Value: new FormControl(obj.Min_Number_Value, MinNumberValueValidation),
               If_Min_Number_Field_Restriction: new FormControl(obj.If_Min_Number_Field_Restriction),
               Min_Number_Field: new FormControl(MinNumberFieldId, MinNumberFieldValidation),
               If_Max_Number_Restriction: new FormControl(obj.If_Max_Number_Restriction),
               Max_Number_Value: new FormControl(obj.Max_Number_Value, MaxNumberValueValidation),
               If_Max_Number_Field_Restriction: new FormControl(obj.If_Max_Number_Field_Restriction),
               Max_Number_Field: new FormControl(MaxNumberFieldId, MaxNumberFieldValidation),
               Category: new FormControl(obj.Category, Validators.required),
               Sub_Category: new FormControl(obj.Sub_Category),
               Sub_Junior_Category: new FormControl(obj.Sub_Junior_Category),
               Changes_Detected: new FormControl(false),
            });
            const control = this.FormGroup.get('FormArray') as FormArray;
            control.push(NewFormGroup);
         });
         this.DBRenderedFormValues = this.FormGroup.controls.FormArray.value;
         this.DetectFormGroupChanges();
      }
   }

   MultiSelectOrderKeep(a: any, b: any) {
      return 1;
   }

   Validation_Filter(Type: any) {
      const TempValidations = this.AllValidations;
      return TempValidations.filter(obj => obj.Accessible_Type === Type);
   }

   Field_Filter(index: number) {
      let FilteredList = [];
      const CurrentField = Object.assign({}, this.FormGroup.value.FormArray[index]);
      FilteredList = [...this.FormGroup.value.FormArray as any[]];
      FilteredList = FilteredList.splice(0, index);
      if (CurrentField.Key_Name !== 'EMS_Ambulance_Call_Date_Time' && CurrentField.Key_Name !== 'Hospital_Arrival_Date_Time' && CurrentField.Key_Name !== 'EMS_Ambulance_Departure_Date_Time') {
         FilteredList = FilteredList.filter(obj => obj.Key_Name !== 'EMS_Ambulance_Call_Date_Time' && obj.Key_Name !== 'EMS_Ambulance_Departure_Date_Time');
      }
      if (CurrentField.Key_Name === 'EMS_Ambulance_Departure_Date_Time') {
         FilteredList = FilteredList.filter(obj => obj.Key_Name !== 'Hospital_Arrival_Date_Time');
      }
      return FilteredList;
   }

   VisibilityChange(event: MatCheckboxChange, index: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      this.AllVisibilityCheck();
      if (event) {
         if (FGroup.value.If_Parent_Available) {
            const Parent = FGroup.value.Parent;
            const ArrIndex = FArray.value.findIndex(obj => obj._id === Parent);
            const NewFGroup = FArray.controls[ArrIndex] as FormGroup;
            NewFGroup.controls.Visibility.setValue(true);
            NewFGroup.updateValueAndValidity();
         }
      } else {
         FGroup.controls.Mandatory.setValue(false);
         FGroup.controls.Validation.setValue(false);
         FGroup.controls.If_Validation_Control_Array.setValue(false);
         FGroup.controls.Validation_Control_Array.setValue([]);
         FGroup.controls.Validation_Control_Array.clearValidators();
         FGroup.controls.If_Date_Restriction.setValue(false);
         FGroup.controls.If_Min_Date_Restriction.setValue(false);
         FGroup.controls.Min_Date_Field.setValue(null);
         FGroup.controls.Min_Date_Field.clearValidators();
         FGroup.controls.If_Min_Date_Array_Available.setValue(false);
         FGroup.controls.Min_Date_Array.setValue([]);
         FGroup.controls.Min_Date_Array.clearValidators();
         FGroup.controls.If_Max_Date_Restriction.setValue(false);
         FGroup.controls.Max_Date_Field.setValue(null);
         FGroup.controls.Max_Date_Field.clearValidators();
         FGroup.controls.If_Max_Date_Array_Available.setValue(false);
         FGroup.controls.Max_Date_Array.setValue([]);
         FGroup.controls.Max_Date_Array.clearValidators();
         FGroup.controls.If_Future_Date_Available.setValue(false);
         FGroup.controls.If_Number_Restriction.setValue(false);
         FGroup.controls.If_Min_Number_Restriction.setValue(false);
         FGroup.controls.Min_Number_Value.setValue(null);
         FGroup.controls.Min_Number_Value.clearValidators();
         FGroup.controls.If_Min_Number_Field_Restriction.setValue(false);
         FGroup.controls.Min_Number_Field.setValue(null);
         FGroup.controls.Min_Number_Field.clearValidators();
         FGroup.controls.If_Max_Number_Restriction.setValue(false);
         FGroup.controls.Max_Number_Value.setValue(null);
         FGroup.controls.Max_Number_Value.clearValidators();
         FGroup.controls.If_Max_Number_Field_Restriction.setValue(false);
         FGroup.controls.Max_Number_Field.setValue(null);
         FGroup.controls.Max_Number_Field.clearValidators();
         FGroup.updateValueAndValidity();
         if (FGroup.value.Type === 'Number' || FGroup.value.Type === 'Date') {
            this.SomeVisibilityUnchecked(FGroup);
         }
         if (FGroup.value.If_Child_Available) {
            this.VisibilityUncheckedInChildAffect(FGroup);
         }
      }
   }

   SomeVisibilityUnchecked(FGroup: FormGroup) {
      const CheckingId = FGroup.value._id;
      const CheckingType = FGroup.value.Type;
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FilteredFArray = FArray.controls.filter(obj => obj.value.Type === CheckingType);
      FilteredFArray.map(obj => {
         const NewFGroup = obj as FormGroup;
         if (CheckingType === 'Number') {
            if (NewFGroup.value.If_Min_Number_Field_Restriction) {
               const CheckableValue = NewFGroup.controls.Min_Number_Field.value;
               if (CheckableValue === CheckingId) {
                  NewFGroup.controls.If_Min_Number_Field_Restriction.setValue(false);
                  NewFGroup.updateValueAndValidity();
               }
            }
            if (NewFGroup.value.If_Max_Number_Restriction) {
               const CheckableValue = NewFGroup.controls.Max_Number_Field.value;
               if (CheckableValue === CheckingId) {
                  NewFGroup.controls.If_Max_Number_Restriction.setValue(false);
                  NewFGroup.updateValueAndValidity();
               }
            }
         }
         if (CheckingType === 'Date') {
            if (NewFGroup.value.If_Min_Date_Restriction) {
               const CheckableValue = NewFGroup.controls.Min_Date_Field.value;
               if (CheckableValue === CheckingId) {
                  NewFGroup.controls.If_Min_Date_Restriction.setValue(false);
                  NewFGroup.updateValueAndValidity();
               }
            }
            if (NewFGroup.value.If_Max_Date_Restriction) {
               const CheckableValue = NewFGroup.controls.Max_Date_Field.value;
               if (CheckableValue === CheckingId) {
                  NewFGroup.controls.If_Max_Date_Restriction.setValue(false);
                  NewFGroup.updateValueAndValidity();
               }
            }
            if (NewFGroup.value.If_Min_Date_Array_Available) {
               const CheckableValuesArray: any[] = NewFGroup.controls.Min_Date_Array.value;
               const ArrIndex = CheckableValuesArray.indexOf(CheckingId);
               if (ArrIndex >= 0) {
                  CheckableValuesArray.splice(ArrIndex, 1);
                  if (CheckableValuesArray.length === 0) {
                     NewFGroup.controls.If_Min_Date_Array_Available.setValue(false);
                  }
                  NewFGroup.updateValueAndValidity();
               }
            }
            if (NewFGroup.value.If_Max_Date_Array_Available) {
               const CheckableValuesArray: any[] = NewFGroup.controls.Max_Date_Array.value;
               const ArrIndex = CheckableValuesArray.indexOf(CheckingId);
               if (ArrIndex >= 0) {
                  CheckableValuesArray.splice(ArrIndex, 1);
                  if (CheckableValuesArray.length === 0) {
                     NewFGroup.controls.If_Max_Date_Array_Available.setValue(false);
                  }
                  NewFGroup.updateValueAndValidity();
               }
            }
         }
      });
   }

   VisibilityUncheckedInChildAffect(FGroup: FormGroup) {
      const CheckingId = FGroup.value._id;
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FilteredFArray = FArray.controls.filter(obj => obj.value.Parent === CheckingId);
      FilteredFArray.map(obj => {
         const NewFGroup = obj as FormGroup;
         NewFGroup.controls.Visibility.setValue(false);
         NewFGroup.updateValueAndValidity();
      });
   }

   ValidationChange(event: MatCheckboxChange, index: any) {
      this.AllValidationCheck();
      if (!event) {
         const FArray = this.FormGroup.get('FormArray') as FormArray;
         const FGroup = FArray.controls[index] as FormGroup;
         FGroup.controls.If_Validation_Control_Array.setValue(false);
         FGroup.controls.Validation_Control_Array.setValue([]);
         FGroup.controls.Validation_Control_Array.clearValidators();
         FGroup.controls.If_Date_Restriction.setValue(false);
         FGroup.controls.If_Min_Date_Restriction.setValue(false);
         FGroup.controls.Min_Date_Field.setValue(null);
         FGroup.controls.Min_Date_Field.clearValidators();
         FGroup.controls.If_Min_Date_Array_Available.setValue(false);
         FGroup.controls.Min_Date_Array.setValue([]);
         FGroup.controls.Min_Date_Array.clearValidators();
         FGroup.controls.If_Max_Date_Restriction.setValue(false);
         FGroup.controls.Max_Date_Field.setValue(null);
         FGroup.controls.Max_Date_Field.clearValidators();
         FGroup.controls.If_Max_Date_Array_Available.setValue(false);
         FGroup.controls.Max_Date_Array.setValue([]);
         FGroup.controls.Max_Date_Array.clearValidators();
         FGroup.controls.If_Future_Date_Available.setValue(false);
         FGroup.controls.If_Number_Restriction.setValue(false);
         FGroup.controls.If_Min_Number_Restriction.setValue(false);
         FGroup.controls.Min_Number_Value.setValue(null);
         FGroup.controls.Min_Number_Value.clearValidators();
         FGroup.controls.If_Min_Number_Field_Restriction.setValue(false);
         FGroup.controls.Min_Number_Field.setValue(null);
         FGroup.controls.Min_Number_Field.clearValidators();
         FGroup.controls.If_Max_Number_Restriction.setValue(false);
         FGroup.controls.Max_Number_Value.setValue(null);
         FGroup.controls.Max_Number_Value.clearValidators();
         FGroup.controls.If_Max_Number_Field_Restriction.setValue(false);
         FGroup.controls.Max_Number_Field.setValue(null);
         FGroup.controls.Max_Number_Field.clearValidators();
         FGroup.updateValueAndValidity();
      }
   }

   ValidationControlArrayChange(event: MatCheckboxChange, index: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      if (event) {
         FGroup.controls.Validation_Control_Array.setValidators(Validators.required);
      } else {
         FGroup.controls.Validation_Control_Array.setValue([]);
         FGroup.controls.Validation_Control_Array.clearValidators();
         FGroup.controls.Validation_Control_Array.setErrors(null);
         FGroup.controls.Validation_Control_Array.markAsPristine();
         FGroup.controls.Validation_Control_Array.markAsUntouched();
         FGroup.updateValueAndValidity();
      }
   }

   GetValidationArrayMultipleSelectDisplayContent(index: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      const ValueArray: any[] = FGroup.value.Validation_Control_Array;
      if (ValueArray && ValueArray.length > 0) {
         const FilterIndex = this.AllValidations.findIndex(obj => obj._id === ValueArray[0] );
         const Name = this.AllValidations[FilterIndex].Name;
         if (ValueArray.length === 1) {
            return Name;
         }
         if (ValueArray.length > 1) {
            const AddOns = (ValueArray.length > 2) ?  '<small> ( +' + (ValueArray.length - 1) + ' others ) </small>' : ' <small>( +1 other) </small>' ;
            return Name + AddOns;
         }
      } else {
         return '';
      }
   }

   GetValidationArrayMultipleSelectOrderNo(index: any, id: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      const ValueArray: any[] = FGroup.value.Validation_Control_Array;
      if (ValueArray && ValueArray.length > 0) {
         const FilterIndex = ValueArray.findIndex(obj => obj === id );
         const ReturnValue = (FilterIndex >= 0) ?  '<small> ( Order No: ' + (FilterIndex + 1) + ') </small>' : null ;
         return ReturnValue;
      } else {
         return null;
      }
   }

   GetMinDateArrayMultipleSelectsDisplayContent(index: number) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      const ValueArray: any[] = FGroup.value.Min_Date_Array;
      if (ValueArray && ValueArray.length > 0) {
         const FilteredList = this.FormGroup.value.FormArray as any[];
         const FilterIndex = FilteredList.findIndex(obj => obj._id === ValueArray[0] );
         const Name = FilteredList[FilterIndex].Name;
         if (ValueArray.length === 1) {
            return Name;
         }
         if (ValueArray.length > 1) {
            const AddOns = (ValueArray.length > 2) ?  '<small> ( +' + (ValueArray.length - 1) + ' others ) </small>' : ' <small>( +1 other) </small>' ;
            return Name + AddOns;
         }
      } else {
         return '';
      }
   }

   GetMinDateArrayMultipleSelectsOrderNo(index: any, id: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      const ValueArray: any[] = FGroup.value.Min_Date_Array;
      if (ValueArray && ValueArray.length > 0) {
         const FilterIndex = ValueArray.findIndex(obj => obj === id );
         const ReturnValue = (FilterIndex >= 0) ?  '<small> ( Order No: ' + (FilterIndex + 1) + ') </small>' : null ;
         return ReturnValue;
      } else {
         return null;
      }
   }

   GetMaxDateArrayMultipleSelectsDisplayContent(index: number) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      const ValueArray: any[] = FGroup.value.Max_Date_Array;
      if (ValueArray && ValueArray.length > 0) {
         const FilteredList = this.FormGroup.value.FormArray as any[];
         const FilterIndex = FilteredList.findIndex(obj => obj._id === ValueArray[0] );
         const Name = FilteredList[FilterIndex].Name;
         if (ValueArray.length === 1) {
            return Name;
         }
         if (ValueArray.length > 1) {
            const AddOns = (ValueArray.length > 2) ?  '<small> ( +' + (ValueArray.length - 1) + ' others ) </small>' : ' <small>( +1 other) </small>' ;
            return Name + AddOns;
         }
      } else {
         return '';
      }
   }

   GetMaxDateArrayMultipleSelectsOrderNo(index: any, id: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      const ValueArray: any[] = FGroup.value.Max_Date_Array;
      if (ValueArray && ValueArray.length > 0) {
         const FilterIndex = ValueArray.findIndex(obj => obj === id );
         const ReturnValue = (FilterIndex >= 0) ?  '<small> ( Order No: ' + (FilterIndex + 1) + ') </small>' : null ;
         return ReturnValue;
      } else {
         return null;
      }
   }

   MinNumberRestrictionChange(event: MatCheckboxChange, index: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      if (event) {
         FGroup.controls.Min_Number_Value.setValidators([Validators.required, this.ValidateNumber]);
      } else {
         FGroup.controls.Min_Number_Value.setValue(null);
         FGroup.controls.Min_Number_Value.clearValidators();
         FGroup.controls.Min_Number_Value.setErrors(null);
         FGroup.controls.Min_Number_Value.markAsPristine();
         FGroup.controls.Min_Number_Value.markAsUntouched();
         FGroup.updateValueAndValidity();
      }
   }

   MaxNumberRestrictionChange(event: MatCheckboxChange, index: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      if (event) {
         FGroup.controls.Max_Number_Value.setValidators([Validators.required, this.ValidateNumber]);
      } else {
         FGroup.controls.Max_Number_Value.setValue(null);
         FGroup.controls.Max_Number_Value.clearValidators();
         FGroup.controls.Max_Number_Value.setErrors(null);
         FGroup.controls.Max_Number_Value.markAsPristine();
         FGroup.controls.Max_Number_Value.markAsUntouched();
         FGroup.updateValueAndValidity();
      }
   }

   MinNumberFieldRestrictionChange(event: MatCheckboxChange, index: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      if (event) {
         FGroup.controls.Min_Number_Field.setValidators(Validators.required);
      } else {
         FGroup.controls.Min_Number_Field.setValue(null);
         FGroup.controls.Min_Number_Field.clearValidators();
         FGroup.controls.Min_Number_Field.setErrors(null);
         FGroup.controls.Min_Number_Field.markAsPristine();
         FGroup.controls.Min_Number_Field.markAsUntouched();
         FGroup.updateValueAndValidity();
      }
   }

   MaxNumberFieldRestrictionChange(event: MatCheckboxChange, index: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      if (event) {
         FGroup.controls.Max_Number_Field.setValidators(Validators.required);
      } else {
         FGroup.controls.Max_Number_Field.setValue(null);
         FGroup.controls.Max_Number_Field.clearValidators();
         FGroup.controls.Max_Number_Field.setErrors(null);
         FGroup.controls.Max_Number_Field.markAsPristine();
         FGroup.controls.Max_Number_Field.markAsUntouched();
         FGroup.updateValueAndValidity();
      }
   }

   MinDateFieldRestrictionChange(event: MatCheckboxChange, index: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      if (event) {
         FGroup.controls.Min_Date_Field.setValidators(Validators.required);
      } else {
         FGroup.controls.Min_Date_Field.setValue(null);
         FGroup.controls.Min_Date_Field.clearValidators();
         FGroup.controls.Min_Date_Field.setErrors(null);
         FGroup.controls.Min_Date_Field.markAsPristine();
         FGroup.controls.Min_Date_Field.markAsUntouched();
         FGroup.updateValueAndValidity();
      }
   }

   MinDateArrayRestrictionChange(event: MatCheckboxChange, index: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      if (event) {
         FGroup.controls.Min_Date_Array.setValidators(Validators.required);
      } else {
         FGroup.controls.Min_Date_Array.setValue([]);
         FGroup.controls.Min_Date_Array.clearValidators();
         FGroup.controls.Min_Date_Array.setErrors(null);
         FGroup.controls.Min_Date_Array.markAsPristine();
         FGroup.controls.Min_Date_Array.markAsUntouched();
         FGroup.updateValueAndValidity();
      }
   }

   MaxDateFieldRestrictionChange(event: MatCheckboxChange, index: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      if (event) {
         FGroup.controls.Max_Date_Field.setValidators(Validators.required);
      } else {
         FGroup.controls.Max_Date_Field.setValue(null);
         FGroup.controls.Max_Date_Field.clearValidators();
         FGroup.controls.Max_Date_Field.setErrors(null);
         FGroup.controls.Max_Date_Field.markAsPristine();
         FGroup.controls.Max_Date_Field.markAsUntouched();
         FGroup.updateValueAndValidity();
      }
   }

   MaxDateArrayRestrictionChange(event: MatCheckboxChange, index: any) {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      if (event) {
         FGroup.controls.Max_Date_Array.setValidators(Validators.required);
      } else {
         FGroup.controls.Max_Date_Array.setValue([]);
         FGroup.controls.Max_Date_Array.clearValidators();
         FGroup.controls.Max_Date_Array.setErrors(null);
         FGroup.controls.Max_Date_Array.markAsPristine();
         FGroup.controls.Max_Date_Array.markAsUntouched();
         FGroup.updateValueAndValidity();
      }
   }

   DetectFormGroupChanges(): void {
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      FArray.controls.map(Obj => {
         const FGroup = Obj as FormGroup;
         Object.keys(FGroup.value).map(key => {
            if (key !== 'Changes_Detected') {
               this.subscription.add(
                  FGroup.get(key).valueChanges.subscribe( res => {
                     setTimeout(() => {
                        const FilterIndex = this.DBRenderedFormValues.findIndex(obj => obj._id === FGroup.value._id);
                        const PreviousData = this.DBRenderedFormValues[FilterIndex];
                        const CurrentData = FGroup.value;
                        delete PreviousData.Changes_Detected;
                        delete CurrentData.Changes_Detected;
                        const ReturnStatus = (JSON.stringify(PreviousData) !== JSON.stringify(CurrentData)) ? true : false;
                        if (ReturnStatus) {
                           FGroup.controls.Changes_Detected.setValue(true);
                        } else {
                           FGroup.controls.Changes_Detected.setValue(false);
                        }
                        const ChangesLength = FArray.value.filter(val => val.Changes_Detected === true).length;
                        if (ChangesLength > 0) {
                           this.FormChangesDetection = true;
                        } else {
                           this.FormChangesDetection = false;
                        }
                     }, 10);
                  })
               );
            }
         });
      });
   }

   GoBack() {
      this.ActiveSection.If_Active = false;
      if (this.FormChangesDetection) {
         this.ActivateFormGroups();
      }
   }

   UpdateForm() {
      const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
      if (firstElementWithError) {
         window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
      }
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      if (this.FormChangesDetection && this.FormGroup.status === 'VALID' && !this.FormUpdateLoading) {
         this.FormUpdateLoading = true;
         this.FilterForm.disable();
         const ModifiedData =  FArray.value.filter(val => val.Changes_Detected === true);
         this.UnderProcess.All_Fields_Update(ModifiedData).subscribe(response => {
            if (response.Status) {
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Modified Details Successfully Updated' });
               FArray.controls.map(Obj => {
                  const FGroup = Obj as FormGroup;
                  FGroup.controls.Changes_Detected.setValue(false);
               });
               this.AllFields = response.Response;
               this.DBRenderedFormValues = this.FormGroup.controls.FormArray.value;
               this.FormChangesDetection = false;
            } else {
               const message = response.Message;
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: message });
            }
            this.FormUpdateLoading = false;
            this.FilterForm.enable();
         });
      } else {
         if (this.FormGroup.status === 'INVALID') {
            const InCompletedFGroups =  FArray.controls.filter(val => val.status === 'INVALID');
            const ErrorsList = [];
            InCompletedFGroups.map(obj => {
               const FGroup = obj as FormGroup;
               Object.keys(FGroup.value).map(key => {
                  const FControl = FGroup.get(key) as FormControl;
                  if (FControl.status === 'INVALID') {
                     FControl.markAsDirty();
                     FControl.markAsTouched();
                     const ControlName = (key === 'Validation_Control_Array') ? 'Type Of Validation' :
                                          (key === 'Min_Date_Field') ? 'Minimum Date Field' :
                                          (key === 'Min_Date_Array') ? 'Minimum Date Field More than One ' :
                                          (key === 'Max_Date_Field') ? 'Maximum Date Field ' :
                                          (key === 'Max_Date_Array') ? 'Maximum Date Field More than One' :
                                          (key === 'Min_Number_Value') ? 'Minimum Value' :
                                          (key === 'Min_Number_Field') ? 'Minimum Field Validation' :
                                          (key === 'Max_Number_Value') ? 'Maximum Value' :
                                          (key === 'Max_Number_Field') ? 'Maximum Field Validation' :
                                          '';
                     const Err = FControl.hasError('required') ? FGroup.value.Name + ' >>> ' + ControlName + ' >>> Required' :
                                    FControl.hasError('ValidNumber') ? ' >>> Invalid Number' :
                                    '';
                     ErrorsList.push(Err);
                  }
               });
            });
            const message = 'Some Field Values are Invalid Please check After Update!';
            this.Toastr.NewToastrMessage({ Type: 'Warning', Message: message });
         }
      }
   }


   UpdateClusterBasedForm() {
      const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
      if (firstElementWithError) {
         window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
      }
      const FArray = this.FormGroup.get('FormArray') as FormArray;
      if (this.FormChangesDetection && this.FormGroup.status === 'VALID' && !this.FormUpdateLoading) {
         this.FormUpdateLoading = true;
         this.FilterForm.disable();
         const ModifiedData =  FArray.value.filter(val => val.Changes_Detected === true);
         this.ClusterService.ClusterControlPanel_Update({ModifiedRecords: ModifiedData, Cluster_Id: this.FilterForm.getRawValue().Cluster._id}).subscribe(response => {
            if (response.Status) {
               const message = 'Modified Details Successfully Updated';
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: message });
               FArray.controls.map(Obj => {
                  const FGroup = Obj as FormGroup;
                  FGroup.controls.Changes_Detected.setValue(false);
               });
               this.AllFields = response.Response;
               this.DBRenderedFormValues = this.FormGroup.controls.FormArray.value;
               this.FormChangesDetection = false;
            } else {
               const message = response.Message;
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: message });
            }
            this.FormUpdateLoading = false;
            this.FilterForm.enable();
         });
      } else {
         if (this.FormGroup.status === 'INVALID') {
            const InCompletedFGroups =  FArray.controls.filter(val => val.status === 'INVALID');
            const ErrorsList = [];
            InCompletedFGroups.map(obj => {
               const FGroup = obj as FormGroup;
               Object.keys(FGroup.value).map(key => {
                  const FControl = FGroup.get(key) as FormControl;
                  if (FControl.status === 'INVALID') {
                     FControl.markAsDirty();
                     FControl.markAsTouched();
                     const ControlName = (key === 'Validation_Control_Array') ? 'Type Of Validation' :
                                          (key === 'Min_Date_Field') ? 'Minimum Date Field' :
                                          (key === 'Min_Date_Array') ? 'Minimum Date Field More than One ' :
                                          (key === 'Max_Date_Field') ? 'Maximum Date Field ' :
                                          (key === 'Max_Date_Array') ? 'Maximum Date Field More than One' :
                                          (key === 'Min_Number_Value') ? 'Minimum Value' :
                                          (key === 'Min_Number_Field') ? 'Minimum Field Validation' :
                                          (key === 'Max_Number_Value') ? 'Maximum Value' :
                                          (key === 'Max_Number_Field') ? 'Maximum Field Validation' :
                                          '';
                     const Err = FControl.hasError('required') ? FGroup.value.Name + ' >>> ' + ControlName + ' >>> Required' :
                                    FControl.hasError('ValidNumber') ? ' >>> Invalid Number' :
                                    '';
                     ErrorsList.push(Err);
                  }
               });
            });
            const message = 'Some Field Values are Invalid Please check After Update!';
            this.Toastr.NewToastrMessage({ Type: 'Warning', Message: message });
         }
      }
   }

   IDConfig() {
      const initialState = {
         Cluster: this.ClusterId,
         Category: this.Category
      };
      this.modalReference = this.ModalService.show(ModalIdProofConfigComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-lg modal-dialog-centered animated bounceInRight' }));
   }

}

