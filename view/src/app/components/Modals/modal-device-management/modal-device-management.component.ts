import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { Observable } from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import { Subject } from 'rxjs';

import { FormArray, FormGroup, FormControl, Validators, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

import { LocationService } from '../../../services/location-management/location.service';
import { ToastrService } from './../../../services/common-services/toastr.service';
import { HospitalManagementService } from '../../../services/hospital-management/hospital-management.service';
import { ClusterManagementService } from '../../../services/cluster-management/cluster-management.service';
import { DeviceManagementService } from '../../../services/device-management/device-management.service';

export interface Locations { _id: string; Location_Name: string; }
export interface Clusters {  _id: string;  Cluster_Name: string; }
export interface Hospitals {  _id: string;  Hospital_Name: string; }


@Component({
  selector: 'app-modal-device-management',
  templateUrl: './modal-device-management.component.html',
  styleUrls: ['./modal-device-management.component.css']
})
export class ModalDeviceManagementComponent implements OnInit {

   DeviceForm: FormGroup;
   onClose: Subject<any>;
   Type: string;
   Uploading = false;
   Info: any;

   filteredLocationsList: Observable<Locations[]>;
   LocationsList: Locations[] = [];
   LastSelectedLocation = null;

   filteredClusterList: Observable<Clusters[]>;
   ClusterList: Clusters[] = [];
   LastSelectedCluster = null;

   filteredHospitalList: Observable<Hospitals[]>;
   HospitalList: Hospitals[] = [];
   LastSelectedHospital = null;

   ShowPassword = false;

  constructor( public modalRef: BsModalRef,
               public LocService: LocationService,
               private HospitalService: HospitalManagementService,
               private ClusterService: ClusterManagementService,
               private Toastr: ToastrService,
               private Service: DeviceManagementService
            ) {
               this.LocService.StemiLocations_SimpleList('').subscribe( response => {
                  this.LocationsList = response.Response;
                  if (this.Type === 'Edit') {
                    this.UpdateLocation();
                } else {
                  setTimeout(() => {
                    this.DeviceForm.controls.Location.updateValueAndValidity();
                  }, 100);
                }
              });
             }

   ngOnInit() {
      this.onClose = new Subject();

      if (this.Type === 'Create') {
         this.DeviceForm = new FormGroup({
            Device_UID: new FormControl('', { validators : [Validators.required],
               asyncValidators: [this.Device_AsyncValidate.bind(this)],
               updateOn: 'change' }),
            Location: new FormControl(null, Validators.required),
            Cluster: new FormControl(null, Validators.required),
            Hospital: new FormControl(null, Validators.required)
         });
      }

      if (this.Type === 'Edit') {
         this.DeviceForm = new FormGroup({
            Device: new FormControl(this.Info._id, Validators.required),
            Device_UID: new FormControl(this.Info.Device_UID, { validators : [Validators.required],
               asyncValidators: [this.Device_AsyncValidate.bind(this)],
               updateOn: 'change' }),
            Location: new FormControl(null, Validators.required),
            Cluster: new FormControl(null, Validators.required),
            Hospital: new FormControl(null,  Validators.required)
         });
         setTimeout(() => {
            this.UpdateLocation();
         }, 100);
      }

      this.DeviceForm.controls.Location.valueChanges.subscribe( res => {
         if (res !== null && typeof res === 'object' && res._id) {
            const SelectedLocation = this.DeviceForm.controls.Location.value._id;
            if (SelectedLocation && SelectedLocation !== null && SelectedLocation !== '') {
               this.ClusterService.ClustersSimpleList_LocationBased({Location_Id: SelectedLocation}).subscribe( response => {
                  this.ClusterList = response.Response;
                  setTimeout(() => {
                     this.DeviceForm.controls.Cluster.setValue(null);
                     this.DeviceForm.controls.Cluster.updateValueAndValidity();
                  }, 100);
               });
            } else {
               this.ClusterList = [];
            }
         }
      });

      this.DeviceForm.controls.Cluster.valueChanges.subscribe( res => {
         if (res !== null && typeof res === 'object' && res._id) {
            const SelectedCluster = this.DeviceForm.controls.Cluster.value._id;
            if (SelectedCluster && SelectedCluster !== null && SelectedCluster !== '') {
               this.ClusterService.ClusterBased_Hospitals({Cluster_Id: SelectedCluster}).subscribe( response => {
                  this.HospitalList = response.Response;
                  setTimeout(() => {
                     this.DeviceForm.controls.Hospital.setValue(null);
                     this.DeviceForm.controls.Hospital.updateValueAndValidity();
                  }, 100);
               });
            } else {
               this.HospitalList = [];
            }
         }
      });

      this.filteredLocationsList = this.DeviceForm.controls.Location.valueChanges.pipe(
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

      this.filteredClusterList = this.DeviceForm.controls.Cluster.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                  if (this.LastSelectedCluster === null || this.LastSelectedCluster !== value._id) {
                     this.LastSelectedCluster = value._id;
                  }
                  value = value.Cluster_Name;
               }
               return this.ClusterList.filter(option => option.Cluster_Name.toLowerCase().includes(value.toLowerCase()));
            } else {
               this.LastSelectedCluster = null;
               return this.ClusterList;
            }
         })
      );

      this.filteredHospitalList = this.DeviceForm.controls.Hospital.valueChanges.pipe(
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
               return this.HospitalList;
            }
         })
      );

   }


   LocationDisplayName(Location: any) {
      return (Location && Location !== null && Location !== '') ? Location.Location_Name : null;
   }

   ClusterDisplayName(Cluster: any) {
      return (Cluster && Cluster !== null && Cluster !== '') ? Cluster.Cluster_Name : null;
   }

   HospitalDisplayName(Hospital: any) {
      return (Hospital && Hospital !== null && Hospital !== '') ? Hospital.Hospital_Name : null;
   }

   AutocompleteBlur(key: any) {
      setTimeout(() => {
         const value =  this.DeviceForm.controls[key].value;
         if (!value || value === null || value === '' || typeof value !== 'object') {
            this.DeviceForm.controls[key].setValue(null);
         }
      }, 500);
   }

   Device_AsyncValidate( control: AbstractControl ) {
      const Data = { Device_UID: control.value };
      return this.Service.Device_AsyncValidate(Data).pipe(map( response => {
         if (this.Type === 'Edit' && (control.value).toLowerCase() === (this.Info.Device_UID).toLowerCase()) {
            return null;
         } else {
            if (response.Status && response.Available) {
               return null;
            } else {
               return { DeviceUID_NotAvailable: true };
            }
         }
      }));
   }

   UpdateLocation() {
      if (this.LocationsList.length > 0) {
         this.DeviceForm.controls.Location.setValue(this.Info.Location, { onlySelf: true, emitEvent: false });
         // this.DeviceForm.controls.Location.disable({ onlySelf: true, emitEvent: false });
         this.ClusterService.ClustersSimpleList_LocationBased({Location_Id: this.Info.Location._id}).subscribe( response => {
            this.ClusterList = response.Response;
            this.DeviceForm.controls.Cluster.setValidators(Validators.required);
            this.DeviceForm.controls.Cluster.setValue(this.Info.Cluster, { onlySelf: true, emitEvent: false });
            // this.DeviceForm.controls.Cluster.disable({ onlySelf: true, emitEvent: false });
            this.ClusterService.ClusterBased_Hospitals({Cluster_Id: this.Info.Cluster._id}).subscribe( responseNew => {
               this.HospitalList = responseNew.Response;
               this.DeviceForm.controls.Hospital.setValidators(Validators.required);
               this.DeviceForm.controls.Hospital.setValue(this.Info.Hospital, { onlySelf: true, emitEvent: false });
               // this.DeviceForm.controls.Hospital.disable({ onlySelf: true, emitEvent: false });
            });
         });
      }
   }

   GetFormControlErrorMessage(KeyName: any) {
      const FControl = this.DeviceForm.get(KeyName) as FormControl;
      if (FControl.invalid && FControl.touched) {
         const ErrorKeys: any[] = FControl.errors !== null ? Object.keys(FControl.errors) : [];
         if (ErrorKeys.length > 0) {
            let returnText = '';
            if (ErrorKeys.indexOf('required') > -1) {
               returnText = 'This field is required';
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
      if (this.DeviceForm.valid && !this.Uploading) {
         this.Uploading = true;
         const Info = this.DeviceForm.getRawValue();
         this.Service.Device_Create(Info).subscribe( response => {
            this.Uploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'New Device Successfully Created' } );
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
         Object.keys(this.DeviceForm.controls).map(obj => {
         const FControl = this.DeviceForm.controls[obj] as FormControl;
         if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
         }
         });
      }
   }

   Update() {
      if (this.DeviceForm.valid && !this.Uploading) {
         this.Uploading = true;
         const Info = this.DeviceForm.value;
         this.Service.Device_Update(Info).subscribe( response => {
            this.Uploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'Device Details Successfully Updated' } );
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
         Object.keys(this.DeviceForm.controls).map(obj => {
         const FControl = this.DeviceForm.controls[obj] as FormControl;
         if (FControl.invalid) {
               FControl.markAsTouched();
               FControl.markAsDirty();
         }
         });
      }
   }

}
