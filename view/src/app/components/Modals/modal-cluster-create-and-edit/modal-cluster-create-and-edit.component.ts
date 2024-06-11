import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { Observable } from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import { Subject } from 'rxjs';

import { FormGroup, FormControl, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { DateAdapter, NativeDateAdapter } from '@angular/material/core';

import { LocationService } from '../../../services/location-management/location.service';
import { ToastrService } from './../../../services/common-services/toastr.service';
import { HospitalManagementService } from '../../../services/hospital-management/hospital-management.service';
import { ClusterManagementService } from '../../../services/cluster-management/cluster-management.service';


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
  selector: 'app-modal-cluster-create-and-edit',
  templateUrl: './modal-cluster-create-and-edit.component.html',
  styleUrls: ['./modal-cluster-create-and-edit.component.css'],
  providers: [{provide: DateAdapter, useClass: MyDateAdapter}],
})
export class ModalClusterCreateAndEditComponent implements OnInit {

   PageLoaded = false;

   filteredClusterList: Observable<Clusters[]>;
   ClusterList: Clusters[] = [];
   LastSelectedCluster = null;

   filteredLocationsList: Observable<Locations[]>;
   LocationsList: Locations[] = [];
   LastSelectedLocation = null;

   filteredPreviousClusterList: Observable<Clusters[]>;
   PreviousClusterList: Clusters[] = [];
   LastSelectedPreviousCluster = null;


   filteredHospitalsList: Observable<Hospitals[]>;
   HospitalList: Hospitals[] = [];
   TempHospitalList: Hospitals[] = [];
   LastSelectedHospital = null;


   ClusterForm: FormGroup;
   onClose: Subject<any>;
   Type: string;
   Uploading = false;
   Info: any;
   ViewEnable = false;

   AlphaNumericSpaceHyphen = new RegExp('^[A-Za-z0-9 -]+$');

   DataType: any[] = [ {Name: 'Pre', Key: 'pre'},
   {Name: 'Post', Key: 'post'}   ];

   constructor(public modalRef: BsModalRef,
               public LocService: LocationService,
               private HospitalService: HospitalManagementService,
               private ClusterService: ClusterManagementService,
               private Toastr: ToastrService
            ) {
      this.LocService.StemiLocations_SimpleList('').subscribe( response => {
         this.LocationsList = response.Response;
         if (this.Type === 'Edit') {
            this.UpdateLocation();
         } else {
            setTimeout(() => {
               this.ClusterForm.controls.Location.updateValueAndValidity();
            }, 100);
         }
      });
   }



   ngOnInit() {
      this.onClose = new Subject();
      if (this.Type === 'Create') {
         this.ClusterForm = new FormGroup({
            Location: new FormControl('', Validators.required),
            Data_Type: new FormControl('', Validators.required),
            Cluster_Name: new FormControl('', { validators : [Validators.required, this.CustomValidation('AlphaNumericSpaceHyphen')],
               asyncValidators: [this.Cluster_AsyncValidate.bind(this)],
               updateOn: 'blur' } ),
            Cluster_Type: new FormControl('', Validators.required),
            Hospital: new FormControl(null),
            Post_Date: new FormControl(''),
            HospitalsArray: new FormControl(null),
            IfControlPanelDuplicate: new FormControl(null),
            DuplicateFrom: new FormControl(null),
         });
      }

      if (this.Type === 'Edit') {
         this.ClusterForm = new FormGroup({
            Cluster_id: new FormControl(this.Info._id, Validators.required),
            Location: new FormControl(null, Validators.required),
            Data_Type: new FormControl('', Validators.required),
            Cluster_Name: new FormControl('', { validators : [Validators.required, this.CustomValidation('AlphaNumericSpaceHyphen')],
               asyncValidators: [this.Cluster_AsyncValidate.bind(this)],
               updateOn: 'blur' } ),
            Cluster_Type: new FormControl('', Validators.required),
            Hospital: new FormControl(null),
            HospitalsArray: new FormControl(null),
            Post_Date: new FormControl(''),
            IfControlPanelDuplicate: new FormControl({value: null, disabled: true}),
            DuplicateFrom: new FormControl(null),
         });
         if (this.Info.Data_Type === 'post') {
            this.ViewEnable = true;
         }
         this.UpdateLocation();
      }

      this.PageLoaded = true;

      this.ClusterForm.controls.Location.valueChanges.subscribe(res => {
         this.CommonInputReset('Hospital', null);
         this.CommonInputReset('HospitalsArray', null);
         this.CommonInputReset('Cluster_Type', null);
         setTimeout(() => {
            if (this.ClusterForm.controls.Cluster_Name.value !== '' && this.ClusterForm.controls.Cluster_Name.value !== null) {
               this.ClusterForm.controls.Cluster_Name.setValue(this.ClusterForm.controls.Cluster_Name.value);
            }
            if (res && res !== null && res !== '') {
               this.ClusterForm.controls.Cluster_Type.setValidators(Validators.required);
            }
         }, 100);
         if (res !== null && typeof res === 'object' && res._id) {
            const SelectedLocation = this.ClusterForm.controls.Location.value._id;
            if (SelectedLocation && SelectedLocation !== null && SelectedLocation !== '') {
               this.ClusterService.ClustersSimpleList_LocationBased({Location_Id: SelectedLocation}).subscribe( response => {
                  this.PreviousClusterList = response.Response;
               });
            } else {
               this.PreviousClusterList = [];
               this.CommonInputReset('IfControlPanelDuplicate', null);
               this.CommonInputReset('DuplicateFrom', null);
            }
         }
      });


      this.filteredLocationsList = this.ClusterForm.controls.Location.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                  if (this.LastSelectedLocation === null || this.LastSelectedLocation !== value._id) {
                     this.LastSelectedLocation = value._id;
                  }
                  value = value.Location_Name;
               }
               return this.LocationsList.filter(option => option.Location_Name.toLowerCase().includes(value.toLowerCase()));
            } else {
               this.LastSelectedLocation = null;
               return this.LocationsList;
            }
         })
      );

      this.filteredHospitalsList = this.ClusterForm.controls.Hospital.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                  if (this.LastSelectedHospital === null || this.LastSelectedHospital !== value._id) {
                        this.LastSelectedHospital = value._id;
                        const TempIndex = this.TempHospitalList.findIndex(obj => obj._id === value._id);
                        this.TempHospitalList.splice(TempIndex, 1);
                  }
                  value = value.Hospital_Name;
               }
               const TempList = this.ClusterForm.controls.HospitalsArray.value || [];
               return this.TempHospitalList.filter(option => option.Hospital_Name.toLowerCase().includes(value.toLowerCase()) && !TempList.includes(option._id));
            } else {
               this.HospitalList.map(obj => {
                  if (!this.TempHospitalList.includes(obj)) {
                     this.TempHospitalList.push(obj);
                  }
               });
               this.LastSelectedHospital = null;
               const TempList = this.ClusterForm.controls.HospitalsArray.value || [];
               return this.TempHospitalList.filter(option => !TempList.includes(option._id));
            }
         })
      );

      this.filteredPreviousClusterList = this.ClusterForm.controls.DuplicateFrom.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                  if (this.LastSelectedPreviousCluster === null || this.LastSelectedPreviousCluster !== value._id) {
                     this.LastSelectedPreviousCluster = value._id;
                  }
                  value = value.Cluster_Name;
               }
               return this.PreviousClusterList.filter(option => option.Cluster_Name.toLowerCase().includes(value.toLowerCase()));
            } else {
               this.LastSelectedPreviousCluster = null;
               return this.PreviousClusterList;
            }
         })
      );
      this.ClusterForm.controls.HospitalsArray.valueChanges.subscribe(value => {
         this.ClusterForm.controls.Hospital.updateValueAndValidity();
      });
   }

   LocationDisplayName(Location: any) {
      return (Location && Location !== null && Location !== '') ? Location.Location_Name : null;
   }

   HospitalDisplayName(Hospital: any) {
      return (Hospital && Hospital !== null && Hospital !== '') ? Hospital.Hospital_Name : null;
   }

   DuplicateClusterDisplayName(Cluster: any) {
      return (Cluster && Cluster !== null && Cluster !== '') ? Cluster.Cluster_Name : null;
   }

   AutocompleteBlur(key: any) {
      setTimeout(() => {
         const value =  this.ClusterForm.controls[key].value;
         if (!value || value === null || value === '' || typeof value !== 'object') {
            this.ClusterForm.controls[key].setValue(null);
         }
      }, 500);
   }

   DataTypeChange(event: any) {
      if (event && event === 'post') {
         this.ViewEnable = true;
         this.ClusterForm.controls.Post_Date.setValidators(Validators.required);
      } else {
         this.ViewEnable = false;
         this.ClusterForm.controls.Post_Date.setValidators(Validators.required);
      }
   }

   UpdateLocation() {
      if (this.LocationsList.length > 0) {
         this.ClusterForm.controls.Location.setValue(this.Info.Location, { onlySelf: false, emitEvent: true });
         this.LastSelectedLocation = this.Info.Location._id;
         this.ClusterForm.controls.Location.disable();
         this.ClusterForm.controls.Data_Type.setValue(this.Info.Data_Type);
         if (this.Info.Post_Date !== null && this.Info.Data_Type === 'post') {
            this.ClusterForm.controls.Post_Date.setValue(this.Info.Post_Date);
         }
         this.ClusterForm.controls.Cluster_Name.setValue(this.Info.Cluster_Name);
         this.ClusterForm.controls.Cluster_Type.setValue(this.Info.Cluster_Type);
         if (this.Info.IfControlPanelDuplicate && this.Info.IfControlPanelDuplicate === true) {
            this.ClusterForm.controls.IfControlPanelDuplicate.setValue(this.Info.IfControlPanelDuplicate);
         }
         if (this.Info.IfControlPanelDuplicate && this.Info.DuplicateFrom && typeof this.Info.DuplicateFrom === 'object') {
            this.UpdateDuplicateCluster();
         }

         this.ClusterForm.controls.Cluster_Type.disable();
         this.UpdateHospital();
      }
   }
   UpdateHospital() {
       if (this.Info.Cluster_Type !== 'advanced' && this.Info.Cluster_Type !== 'virtual') {
         this.HospitalService.ClusterEdit_HubHospitals({ Cluster_ID: this.Info._id, Location: this.ClusterForm.getRawValue().Location._id }).subscribe( NewResponse => {
            this.HospitalList = NewResponse.Response;
            this.TempHospitalList = NewResponse.Response;
            this.ClusterForm.controls.Hospital.setValue(this.Info.Hospital);
            this.ClusterForm.controls.Hospital.disable();
            if (this.Info.Cluster_Type === 'multiple') {
               const Ids = this.Info.HospitalsArray.map(obj => obj._id);
               this.ClusterForm.controls.HospitalsArray.setValue(Ids);
               this.ClusterForm.controls.HospitalsArray.disable();
            }
         });
       }
       if (this.Info.Cluster_Type === 'advanced') {
            this.HospitalService.Location_HubHospitals_AlsoMapped({ Location: this.ClusterForm.getRawValue().Location._id }).subscribe( NewResponse => {
            this.HospitalList = NewResponse.Response;
            this.TempHospitalList = NewResponse.Response;
            const Ids = this.Info.HospitalsArray.map(obj => obj._id);
            this.ClusterForm.controls.HospitalsArray.setValue(Ids);
            this.ClusterForm.controls.HospitalsArray.disable();
         });
      }
   }

   UpdateDuplicateCluster() {
      this.ClusterService.ClustersSimpleList_LocationBased({Location_Id: this.ClusterForm.getRawValue().Location._id}).subscribe( response => {
         this.PreviousClusterList = response.Response;
         this.ClusterForm.controls.DuplicateFrom.setValue(this.Info.DuplicateFrom);
         this.ClusterForm.controls.DuplicateFrom.disable();
      });
   }

   Cluster_AsyncValidate( control: AbstractControl ) {
      const Data = { Cluster_Name: control.value, Location: control.parent.getRawValue().Location._id };
      return this.ClusterService.StemiCluster_AsyncValidate(Data).pipe(map( response => {
         if (this.Type === 'Edit' && (this.Info.Cluster_Name).toLowerCase() === (control.value).toLowerCase() ) {
            return null;
         } else {
            if (response.Status && response.Available) {
               return null;
            } else {
               return { ClusterName_NotAvailable: true };
            }
         }
      }));
   }

   CommonInputReset(control: any, value: any) {
      this.ClusterForm.controls[control].setValue(value);
      this.ClusterForm.controls[control].clearValidators();
      this.ClusterForm.controls[control].setErrors(null);
      this.ClusterForm.controls[control].markAsPristine();
      this.ClusterForm.controls[control].markAsUntouched();
      this.ClusterForm.controls[control].updateValueAndValidity();
   }

   checkClusterType(event: any) {
      this.HospitalList = [];
      this.TempHospitalList = [];
      this.HospitalList = this.HospitalList.slice();
      this.TempHospitalList = this.TempHospitalList.slice();
      if (event === 'virtual') {
         this.CommonInputReset('Hospital', null);
         this.CommonInputReset('HospitalsArray', null);
      } else if (event === 'single') {
         this.CommonInputReset('HospitalsArray', null);
         this.ClusterForm.controls.Hospital.setValidators(Validators.required);
         this.FindHospitals('BasicService');
      } else if (event === 'multiple') {
         this.CommonInputReset('Hospital', null);
         this.CommonInputReset('HospitalsArray', null);
         setTimeout(() => {
            this.ClusterForm.controls.HospitalsArray.setValidators(Validators.required);
         }, 100);
         this.FindHospitals('BasicService');
      } else if (event === 'advanced') {
         this.CommonInputReset('Hospital', null);
         this.CommonInputReset('HospitalsArray', null);
         setTimeout(() => {
            this.ClusterForm.controls.HospitalsArray.setValidators(Validators.required);
         }, 100);
         this.FindHospitals('AdvancedService');
      } else {
         this.CommonInputReset('Hospital', null);
         this.CommonInputReset('HospitalsArray', null);
      }
   }

   FindHospitals(Type: any) {
      if (Type === 'BasicService') {
         if (this.Type !== 'Edit') {
            this.HospitalService.Location_HubHospitals({ Location: this.ClusterForm.getRawValue().Location._id }). subscribe( NewResponse => {
               this.HospitalList = NewResponse.Response;
               this.HospitalList.map(obj => this.TempHospitalList.push(obj));
               this.ClusterForm.controls.Hospital.setValue(null);
               this.ClusterForm.controls.HospitalsArray.setValue(null);
            });
         }
         if (this.Type === 'Edit') {
            this.HospitalService.ClusterEdit_HubHospitals({ Cluster_ID: this.Info._id, Location: this.ClusterForm.getRawValue().Location._id }).subscribe( res => {
               this.HospitalList = res.Response;
               this.HospitalList.map(obj => this.TempHospitalList.push(obj));
               this.ClusterForm.controls.Hospital.setValue(null);
               this.ClusterForm.controls.HospitalsArray.setValue(null);
            });
         }
      }
      if (Type === 'AdvancedService') {
         this.HospitalService.Location_HubHospitals_AlsoMapped({ Location: this.ClusterForm.getRawValue().Location._id }). subscribe( NewResponse => {
            this.HospitalList = NewResponse.Response;
            this.HospitalList.map(obj => this.TempHospitalList.push(obj));
            this.ClusterForm.controls.Hospital.setValue(null);
            this.ClusterForm.controls.HospitalsArray.setValue(null);
         });
      }
   }

   DuplicateConditionChange() {
      const SelectedCondition = this.ClusterForm.controls.IfControlPanelDuplicate.value;
      if (SelectedCondition) {
         this.ClusterForm.controls.DuplicateFrom.setValidators(Validators.required);
      } else {
         this.ClusterForm.controls.DuplicateFrom.setValidators(null);
      }
      this.ClusterForm.controls.DuplicateFrom.updateValueAndValidity();
   }

   GeMultipleSelectDisplayContent(key: any) {
      const ValueArray: any[] = this.ClusterForm.getRawValue()[key];
      if (ValueArray && ValueArray.length > 0) {
         const FilterIndex = this.HospitalList.findIndex(obj => obj._id === ValueArray[0] );
         let Name = this.HospitalList[FilterIndex].Hospital_Name;
         Name = Name.length <= 20 ? Name : Name.slice(0, 20) + '...' ;
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

   CustomValidation(Condition: any): ValidatorFn {
      if (Condition === 'AlphaNumericSpaceHyphen') {
         return (control: AbstractControl): { [key: string]: boolean } | null => {
            if (control.value !== '' && control.value !== null && !this.AlphaNumericSpaceHyphen.test(control.value)) {
               return { AlphaNumericSpaceHyphenError: true };
            }
            return null;
         };
      }
   }

   GetFormControlErrorMessage(KeyName: any) {
      const FControl = this.ClusterForm.get(KeyName) as FormControl;
      if (FControl.invalid && FControl.touched) {
         const ErrorKeys: any[] = FControl.errors !== null ? Object.keys(FControl.errors) : [];
         if (ErrorKeys.length > 0) {
            let returnText = '';
            if (ErrorKeys.indexOf('required') > -1) {
               returnText = 'This field is required';
            } else if (ErrorKeys.indexOf('AlphaNumericSpaceHyphenError') > -1) {
               returnText = 'Please Enter Only Alphabets, Numerics, Space and Hyphen!';
            } else {
               returnText = 'Undefined error detected!';
            }
            return returnText;
         } else {
            return '';
         }
      } else {
         return '';
      }
   }

   onSubmit() {
      if (this.Type === 'Create') {
         this.Submit();
      }

      if (this.Type === 'Edit') {
         this.Update();
      }
   }

   Submit() {
      if (this.ClusterForm.valid && !this.Uploading) {
         this.Uploading = true;
         const Info = this.ClusterForm.value;
         this.ClusterService.StemiCluster_Create(Info).subscribe( response => {
            this.Uploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'New Cluster Successfully Created' } );
               this.onClose.next({Status: true, Response: response.Response});
               this.modalRef.hide();
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage( { Type: 'Error', Message: response.Message } );
               this.onClose.next({Status: false, Message: 'UnExpected Error!'});
               this.modalRef.hide();
            }
         });
      } else {
         Object.keys(this.ClusterForm.controls).map(obj => {
               const FControl = this.ClusterForm.controls[obj] as FormControl;
               if (FControl.invalid) {
                  FControl.markAsTouched();
                  FControl.markAsDirty();
               }
         });
      }
   }

   Update() {
      if (this.ClusterForm.valid && !this.Uploading) {
         this.Uploading = true;
         const Info = this.ClusterForm.value;
         this.ClusterService.StemiCluster_Update(Info).subscribe( response => {
            this.Uploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'Cluster Successfully Updated' } );
               this.onClose.next({Status: true, Response: response.Response});
               this.modalRef.hide();
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage( { Type: 'Error', Message: response.Message } );
               this.onClose.next({Status: false, Message: 'UnExpected Error!'});
               this.modalRef.hide();
            }
         });
      } else {
         Object.keys(this.ClusterForm.controls).map(obj => {
               const FControl = this.ClusterForm.controls[obj] as FormControl;
               if (FControl.invalid) {
                  FControl.markAsTouched();
                  FControl.markAsDirty();
               }
         });
      }
   }

}
