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
import { UserManagementService } from '../../../services/user-management/user-management.service';

export interface Locations { _id: string; Location_Name: string; }
export interface Clusters {  _id: string;  Cluster_Name: string; }
export interface Hospitals {  _id: string;  Hospital_Name: string; }

@Component({
  selector: 'app-modal-user-management',
  templateUrl: './modal-user-management.component.html',
  styleUrls: ['./modal-user-management.component.css']
})
export class ModalUserManagementComponent implements OnInit {

  UserForm: FormGroup;
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

  MobileNumeric = new RegExp('^[0-9 +]+$');
  AlphaNumericUnderscoreHyphenDot = new RegExp('^[A-Za-z0-9_.-]+$');
  AlphabetsSpaceHyphen = new RegExp('^[A-Za-z -]+$');
  AlphaNumericSpaceHyphen = new RegExp('^[A-Za-z0-9 -]+$');
  Numeric = new RegExp('^[0-9]+$');

   constructor( public modalRef: BsModalRef,
                public LocService: LocationService,
                private HospitalService: HospitalManagementService,
                private ClusterService: ClusterManagementService,
                private Toastr: ToastrService,
                private UserService: UserManagementService)  {
      this.LocService.StemiLocations_SimpleList('').subscribe( response => {
          this.LocationsList = response.Response;
          if (this.Type === 'Edit') {
            this.UpdateLocation();
        } else {
          setTimeout(() => {
            this.UserForm.controls.Location.updateValueAndValidity();
          }, 100);
        }
      });

      }

   ngOnInit() {
      this.onClose = new Subject();

      if (this.Type === 'Create') {
         this.UserForm = new FormGroup({
            User_Name: new FormControl('', { validators : [Validators.required, this.CustomValidation('AlphaNumericUnderscoreHyphenDot')],
               asyncValidators: [this.User_AsyncValidate.bind(this)],
               updateOn: 'blur' }),
            Password: new FormControl('', [Validators.required, Validators.minLength(5)]),
            RetypePassword: new FormControl('', [Validators.required,  Validators.minLength(5)] ),
            Name: new FormControl('', [Validators.required, this.CustomValidation('AlphabetsSpaceHyphen')]),
            Email: new FormControl('', [Validators.required, Validators.email]),
            Phone: new FormControl('', [Validators.required, this.CustomValidation('MobileNumeric'), Validators.minLength(9), Validators.maxLength(16) ]),
            User_Type: new FormControl('', Validators.required),
            Location: new FormControl(null, Validators.required),
            Cluster: new FormControl(null),
            DocRegID: new FormControl(''),
            Qualification: new FormControl(''),
            Designation: new FormControl(''),
            ClustersArray: new FormControl(null),
            Hospital: new FormControl(null),
            HospitalsArray: new FormControl(null),
            Alert_Duration: new FormControl(null),
            onlyViewAccess: new FormControl(false),
         });
         this.UserForm.setValidators(this.passwordMatchValidator());
      }

      if (this.Type === 'Edit') {
         this.UserForm = new FormGroup({
            UserId: new FormControl(this.Info._id, Validators.required),
            User_Name: new FormControl(this.Info.User_Name, { validators : [Validators.required, this.CustomValidation('AlphaNumericUnderscoreHyphenDot')],
               asyncValidators: [this.User_AsyncValidate.bind(this)],
               updateOn: 'blur' }),
            Password: new FormControl(this.Info.Password, [Validators.required, Validators.minLength(5)]),
            RetypePassword: new FormControl(this.Info.Password, [Validators.required, Validators.minLength(5)]),
            Name: new FormControl(this.Info.Name, [Validators.required, this.CustomValidation('AlphabetsSpaceHyphen')]),
            Email: new FormControl(this.Info.Email, [Validators.required, Validators.email]),
            Phone: new FormControl(this.Info.Phone, [Validators.required, this.CustomValidation('MobileNumeric'), Validators.minLength(9), Validators.maxLength(16) ]),
            User_Type: new FormControl(this.Info.User_Type, Validators.required),
            DocRegID: new FormControl(''),
            Qualification: new FormControl(this.Info.Qualification || ''),
            Designation: new FormControl(this.Info.Designation || ''),
            Location: new FormControl(null, Validators.required),
            Cluster: new FormControl(null),
            ClustersArray: new FormControl(null),
            Hospital: new FormControl(null),
            HospitalsArray: new FormControl(null),
            Alert_Duration: new FormControl(null),
            onlyViewAccess: new FormControl(null),
         });
         this.UserForm.setValidators(this.passwordMatchValidator());
         this.checkUserType(this.UserForm.controls.User_Type.value);
         setTimeout(() => {
            this.UpdateLocation();
            console.log(this.UserForm);
         }, 100);
         // if (this.Info.onlyViewAccess !== undefined && this.Info.onlyViewAccess !== null) {
         //    this.UserForm.controls.onlyViewAccess.setValue(this.Info.onlyViewAccess);
         // }
      }

      this.UserForm.controls.User_Type.valueChanges.subscribe( res => {
         this.UserForm.controls.DocRegID.setValue(null);
         this.CommonInputReset('DocRegID', '');
         this.UserForm.controls.Alert_Duration.setValue(null);
         this.CommonInputReset('Alert_Duration', '');
         this.UserForm.controls.onlyViewAccess.setValue(false);
         setTimeout(() => {
            if (this.UserForm.controls.User_Type.value === 'D') {
               this.UserForm.controls.DocRegID.setValidators([Validators.required, this.CustomValidation('AlphaNumericSpaceHyphen')]);
            }
            if (this.UserForm.controls.User_Type.value === 'CDA') {
               this.UserForm.controls.DocRegID.setValidators([Validators.required, this.CustomValidation('AlphaNumericSpaceHyphen')]);
            }
         }, 1000);
      });

      this.UserForm.controls.Location.valueChanges.subscribe( res => {
         if (res !== null && typeof res === 'object' && res._id) {
            const SelectedLocation = this.UserForm.controls.Location.value._id;
            if (SelectedLocation && SelectedLocation !== null && SelectedLocation !== '') {
               this.ClusterService.ClustersSimpleList_LocationBased({Location_Id: SelectedLocation}).subscribe( response => {
                  this.ClusterList = response.Response;
                  this.checkUserType(this.UserForm.controls.User_Type.value);
                  setTimeout(() => {
                     this.UserForm.controls.Cluster.updateValueAndValidity();
                  }, 100);
               });
            } else {
               this.ClusterList = [];
               this.checkUserType(this.UserForm.controls.User_Type.value);
            }
         }
      });

      this.UserForm.controls.Cluster.valueChanges.subscribe( res => {
         if (res !== null && typeof res === 'object' && res._id) {
            const SelectedCluster = this.UserForm.controls.Cluster.value._id;
            if (SelectedCluster && SelectedCluster !== null && SelectedCluster !== '') {
               this.ClusterService.ClusterBased_Hospitals({Cluster_Id: SelectedCluster}).subscribe( response => {
                  this.HospitalList = response.Response;
                  this.CommonInputReset('HospitalsArray', '');
                  this.CommonInputReset('Hospital', '');
                  setTimeout(() => {
                     if (this.UserForm.controls.User_Type.value === 'D') {
                        this.UserForm.controls.DocRegID.setValidators([Validators.required, this.CustomValidation('AlphaNumericSpaceHyphen')]);
                        this.UserForm.controls.HospitalsArray.setValidators(Validators.required);
                     }
                     if (this.UserForm.controls.User_Type.value === 'PU') {
                        this.UserForm.controls.Hospital.setValidators(Validators.required);
                     }
                     if (this.UserForm.controls.User_Type.value === 'CDA') {
                        this.UserForm.controls.DocRegID.setValidators([Validators.required, this.CustomValidation('AlphaNumericSpaceHyphen')]);
                     }
                  }, 1000);
               });
            } else {
               this.HospitalList = [];
               this.CommonInputReset('HospitalsArray', '');
               this.CommonInputReset('Hospital', '');
            }
         }
      });

      this.filteredLocationsList = this.UserForm.controls.Location.valueChanges.pipe(
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

      this.filteredClusterList = this.UserForm.controls.Cluster.valueChanges.pipe(
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

      this.filteredHospitalList = this.UserForm.controls.Hospital.valueChanges.pipe(
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

   passwordMatchValidator(): ValidatorFn {
      return (FGroup: FormGroup): ValidationErrors => {
         const password: string = FGroup.get('Password').value;
         const confirmPassword: string = FGroup.get('RetypePassword').value;
         if (password !== '' && confirmPassword !== '') {
            if (password !== confirmPassword) {
               FGroup.get('RetypePassword').markAsTouched();
               FGroup.get('RetypePassword').setErrors({ notSame: true });
            } else {
               FGroup.get('RetypePassword').setErrors(null);
            }
         }
         return;
      };
   }

   LocationDisplayName(Location: any) {
      return (Location && Location !== null && Location !== '') ? Location.Location_Name : null;
   }

   ClusterDisplayName(Cluster: any) {
      return (Cluster && Cluster !== null && Cluster !== '') ? Cluster.Cluster_Name : null;
   }

   HospitalDisplayName(Hospital: any) {
      return (Hospital && Hospital !== null && Hospital !== '') ? ('(' + (Hospital.Hospital_Role === 'EMS' ? 'EMS' : (Hospital.Hospital_Role.slice(0, 1) + Hospital.Hospital_Role.slice(-1)) ) + ') ' + Hospital.Hospital_Name) : null;
   }

   AutocompleteBlur(key: any) {
      setTimeout(() => {
         const value =  this.UserForm.controls[key].value;
         if (!value || value === null || value === '' || typeof value !== 'object') {
            this.UserForm.controls[key].setValue(null);
         }
      }, 500);
   }


   UpdateLocation() {
      if (this.LocationsList.length > 0) {
         this.UserForm.controls.Location.setValue(this.Info.Location, { onlySelf: true, emitEvent: false });
         this.UserForm.controls.Location.disable({ onlySelf: true, emitEvent: false });
         this.UserForm.controls.User_Type.disable();
         this.UserForm.controls.DocRegID.setValue(this.Info.DocRegID);
         this.UserForm.controls.Alert_Duration.setValue(this.Info.Alert_Duration);
         this.UserForm.controls.onlyViewAccess.setValue(this.Info.onlyViewAccess);
         this.ClusterService.ClustersSimpleList_LocationBased({Location_Id: this.Info.Location._id}).subscribe( response => {
            this.ClusterList = response.Response;
            if (this.Info.User_Type === 'CDA' || this.Info.User_Type === 'CO') {
               const ClustersIds = this.Info.ClustersArray.map(obj => obj._id);
               this.UserForm.controls.ClustersArray.setValidators(Validators.required);
               this.UserForm.controls.ClustersArray.setValue(ClustersIds, { onlySelf: false, emitEvent: false });
               // this.UserForm.controls.ClustersArray.disable({ onlySelf: false, emitEvent: false });
               this.UserForm.updateValueAndValidity();
            } else {
               this.UserForm.controls.Cluster.setValidators(Validators.required);
               this.UserForm.controls.Cluster.setValue(this.Info.Cluster, { onlySelf: true, emitEvent: false });
               this.UserForm.controls.Cluster.disable({ onlySelf: true, emitEvent: false });
               if (this.Info.User_Type === 'D' || this.Info.User_Type === 'PU') {
               this.ClusterService.ClusterBased_Hospitals({Cluster_Id: this.Info.Cluster._id}).subscribe( responseNew => {
                  this.HospitalList = responseNew.Response;
                  if (this.Info.User_Type === 'D') {
                     const HospitalIds = this.Info.HospitalsArray.map(obj => obj._id);
                     this.UserForm.controls.HospitalsArray.setValidators(Validators.required);
                     this.UserForm.controls.HospitalsArray.setValue(HospitalIds, { onlySelf: false, emitEvent: false });
                     // this.UserForm.controls.HospitalsArray.disable({ onlySelf: false, emitEvent: false });
                     this.UserForm.updateValueAndValidity();
                  } else {
                     this.UserForm.controls.Hospital.setValidators(Validators.required);
                     this.UserForm.controls.Hospital.setValue(this.Info.Hospital, { onlySelf: true, emitEvent: false });
                     this.UserForm.controls.Hospital.disable({ onlySelf: true, emitEvent: false });
                     this.UserForm.updateValueAndValidity();
                  }
               });
               }
            }
         });
      }
   }

   User_AsyncValidate( control: AbstractControl ) {
      const Data = { User_Name: control.value };
      return this.UserService.StemiUser_AsyncValidate(Data).pipe(map( response => {
         if (this.Type === 'Edit' && (control.value).toLowerCase() === (this.Info.User_Name).toLowerCase()) {
            return null;
         } else {
            if (response.Status && response.Available) {
               return null;
            } else {
               return { UserName_NotAvailable: true };
            }
         }
      }));
   }

   CustomValidation(Condition: any): ValidatorFn {
      if (Condition === 'AlphabetsSpaceHyphen') {
         return (control: AbstractControl): { [key: string]: boolean } | null => {
            if ( control.value !== '' && control.value !== null && !this.AlphabetsSpaceHyphen.test(control.value)) {
               return { AlphabetsSpaceHyphenError: true };
            }
            return null;
         };
      }
      if (Condition === 'AlphaNumericUnderscoreHyphenDot') {
         return (control: AbstractControl): { [key: string]: boolean } | null => {
            if ( control.value !== '' && control.value !== null && !this.AlphaNumericUnderscoreHyphenDot.test(control.value)) {
               return { AlphaNumericUnderscoreHyphenDotError: true };
            }
            return null;
         };
      }
      if (Condition === 'Numeric') {
         return (control: AbstractControl): { [key: string]: boolean } | null => {
            if ( control.value !== '' && control.value !== null && !this.Numeric.test(control.value)) {
               return { NumericError: true };
            }
            return null;
         };
      }
      if (Condition === 'AlphaNumericSpaceHyphen') {
         return (control: AbstractControl): { [key: string]: boolean } | null => {
            if (control.value !== '' && control.value !== null && !this.AlphaNumericSpaceHyphen.test(control.value)) {
               return { AlphaNumericSpaceHyphenError: true };
            }
            return null;
         };
      }
      if (Condition === 'MobileNumeric') {
         return (control: AbstractControl): { [key: string]: boolean } | null => {
            if ( control.value !== '' && control.value !== null && !this.MobileNumeric.test(control.value)) {
               return { MobileNumericError: true };
            }
            return null;
         };
      }
   }


   GetFormControlErrorMessage(KeyName: any) {
      const FControl = this.UserForm.get(KeyName) as FormControl;
      if (FControl.invalid && FControl.touched) {
         const ErrorKeys: any[] = FControl.errors !== null ? Object.keys(FControl.errors) : [];
         if (ErrorKeys.length > 0) {
            let returnText = '';
            if (ErrorKeys.indexOf('required') > -1) {
               returnText = 'This field is required';
            } else if (ErrorKeys.indexOf('AlphabetsSpaceHyphenError') > -1) {
               returnText = 'Please Enter Only Alphabets, Space and Hyphen!';
            } else if (ErrorKeys.indexOf('AlphaNumericUnderscoreHyphenDotError') > -1) {
               returnText = 'Please Enter Only Alphabets, Numerics, Space, Hyphen and Dot!';
            } else if (ErrorKeys.indexOf('MobileNumericError') > -1) {
               returnText = 'Please Enter Only Numeric, Spaces and +!';
            } else if (ErrorKeys.indexOf('NumericError') > -1) {
               returnText = 'Please Enter Only Numbers!';
            } else if (ErrorKeys.indexOf('minlength') > -1) {
               returnText = 'Enter the value should be greater than ' + FControl.errors.minlength.requiredLength;
            } else if (ErrorKeys.indexOf('maxlength') > -1) {
               returnText = 'Enter the value should be less than ' + FControl.errors.maxlength.requiredLength;
            } else if (ErrorKeys.indexOf('email') > -1) {
               returnText = 'Please Enter Valid Email!';
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

   CommonInputReset(control: any, value: any) {
      this.UserForm.controls[control].setValue(value);
      this.UserForm.controls[control].clearValidators();
      this.UserForm.controls[control].setErrors(null);
      this.UserForm.controls[control].markAsPristine();
      this.UserForm.controls[control].markAsUntouched();
      this.UserForm.controls[control].updateValueAndValidity();
   }


   checkUserType(event) {
      if (event === 'CO') {
         this.CommonInputReset('DocRegID', '');
         this.CommonInputReset('Alert_Duration', '');
         this.CommonInputReset('Hospital', null);
         this.CommonInputReset('HospitalsArray', null);
         this.CommonInputReset('Cluster', null);
         this.UserForm.controls.ClustersArray.setValidators(Validators.required);
      } else if (event === 'D') {
         this.CommonInputReset('Hospital', null);
         this.CommonInputReset('ClustersArray', null);
         this.CommonInputReset('Alert_Duration', '');
         this.UserForm.controls.DocRegID.setValidators([Validators.required, this.CustomValidation('AlphaNumericSpaceHyphen')]);
         this.UserForm.controls.HospitalsArray.setValidators(Validators.required);
         this.UserForm.controls.Cluster.setValidators(Validators.required);
      } else if (event === 'PU') {
         this.CommonInputReset('DocRegID', '');
         this.CommonInputReset('Alert_Duration', '');
         this.CommonInputReset('HospitalsArray', null);
         this.CommonInputReset('ClustersArray', null);
         this.UserForm.controls.Cluster.setValidators(Validators.required);
         this.UserForm.controls.Hospital.setValidators(Validators.required);
      } else if (event === 'CDA') {
         this.CommonInputReset('HospitalsArray', null);
         this.CommonInputReset('Hospital', null);
         this.CommonInputReset('Cluster', null);
         this.UserForm.controls.DocRegID.setValidators([Validators.required, this.CustomValidation('AlphaNumericSpaceHyphen')]);
         this.UserForm.controls.Alert_Duration.setValidators([Validators.required, this.CustomValidation('Numeric')]);
         this.UserForm.controls.ClustersArray.setValidators(Validators.required);
      } else {
         this.CommonInputReset('HospitalsArray', null);
         this.CommonInputReset('Hospital', null);
         this.CommonInputReset('Cluster', null);
         this.CommonInputReset('ClustersArray', null);
         this.CommonInputReset('DocRegID', '');
         this.CommonInputReset('Alert_Duration', '');
      }
   }

   GeMultipleSelectDisplayContent(key: any) {
      const ValueArray: any[] = this.UserForm.getRawValue()[key];
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

   GeMultipleSelectDisplayContentCluster(key: any) {
      const ValueArray: any[] = this.UserForm.getRawValue()[key];
      if (ValueArray && ValueArray.length > 0) {
         const FilterIndex = this.ClusterList.findIndex(obj => obj._id === ValueArray[0] );
         let Name = this.ClusterList[FilterIndex].Cluster_Name;
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


   onSubmit() {
      if (this.Type === 'Create') {
         this.Submit();
      }
      if (this.Type === 'Edit') {
         this.Update();
      }
   }

  Submit() {
    if (this.UserForm.valid && !this.Uploading) {
      this.Uploading = true;
      const Info = this.UserForm.value;
      this.UserService.StemiUser_Create(Info).subscribe( response => {
         this.Uploading = false;
         if (response.Status) {
            this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'New User Successfully Created' } );
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
      Object.keys(this.UserForm.controls).map(obj => {
        const FControl = this.UserForm.controls[obj] as FormControl;
        if (FControl.invalid) {
            FControl.markAsTouched();
            FControl.markAsDirty();
        }
      });
   }
  }

  Update() {
    if (this.UserForm.valid && !this.Uploading) {
      this.Uploading = true;
      const Info = this.UserForm.value;
      this.UserService.StemiUser_Update(Info).subscribe( response => {
         this.Uploading = false;
         if (response.Status) {
            this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'User Successfully Updated' } );
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
      Object.keys(this.UserForm.controls).map(obj => {
        const FControl = this.UserForm.controls[obj] as FormControl;
        if (FControl.invalid) {
            FControl.markAsTouched();
            FControl.markAsDirty();
        }
      });
   }
  }
}


