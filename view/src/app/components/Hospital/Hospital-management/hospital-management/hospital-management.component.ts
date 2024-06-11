import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormGroup, FormControl, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';

import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { ToastrService } from '../../../../services/common-services/toastr.service';

import { MapsAPILoader } from '@agm/core';
declare var google: any; // @types/googlemaps;
import * as stringSimilarity from 'string-similarity';

import { CommonService } from '../../../../services/common-services/common.service';
import { HospitalManagementService } from '../../../../services/hospital-management/hospital-management.service';
import { LocationService } from '../../../../services/location-management/location.service';

import { StaticModalComponent } from '../../../Modals/static-modal/static-modal.component';

import { Observable } from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import { MatCheckboxChange } from '@angular/material/checkbox'; // this is necessary

export interface Countries {  _id: string;  Country_Name: string; }
export interface States { _id: string; State_Name: string; }
export interface Cities { _id: string; City_Name: string; }
export interface Locations { _id: string; Location_Name: string; }

@Component({
  selector: 'app-hospital-management',
  templateUrl: './hospital-management.component.html',
  styleUrls: ['./hospital-management.component.css']
})
export class HospitalManagementComponent implements OnInit {

   PageAccess = 'Protected';

   PageType = 'Creat';
   PageLoaded = false;
   modalReference: BsModalRef;
   latitude = 11.015282;
   longitude = 76.96136690000003;
   zoom = 14;

   @ViewChild('search') searchElementRef: ElementRef;
   @ViewChild('AgmMap') AgmMap: any;

   HospitalManageForm: FormGroup;
   CardiologistArray: FormArray;
   GeneralPhysicianArray: FormArray;
   CoOrdinatorsArray: FormArray;
   HospitalReferringArray: FormArray;
   ClosetHospitalArray: FormArray;
   ShowDepartmentOfAdministration = false;
   ShowOwnedAmbulanceDrop = false;
   EMS = true;

   CountriesList: Countries[] = [];
   filteredCountriesList: Observable<Countries[]>;
   LastSelectedCountry = null;
   StatesList: States[] = [];
   filteredStatesList: Observable<States[]>;
   LastSelectedState = null;
   CitiesList: Cities[] = [];
   filteredCitiesList: Observable<Cities[]>;
   LastSelectedCity = null;
   filteredLocationsList: Observable<Locations[]>;
   LocationsList: Locations[] = [];
   LastSelectedLocation = null;

   HospitalDetails: any;
   RouteName: string;
   id: string;

   EMSFields: any[] = ['searchAddress', 'HospitalId', 'Hospital_Type', 'Department_of_Administration',
                        'Hospital_Name', 'Address', 'Country', 'State', 'City', 'Pin_Code', 'Location', 'Latitude',
                        'Longitude', 'Phone', 'Mobile', 'Is_EMS' ];

   RestrictedFields: any[] = ['HospitalId', 'Hospital_Type', 'Hospital_Name', 'Address', 'Country', 'State',
                              'City', 'Pin_Code', 'Latitude', 'Longitude', 'Phone', 'ECG_Availability',
                              'NoOf_ICU_Or_CCU_Beds', 'Cardiology_Department_Head', 'NoOf_Cardiologists', 'NoOf_GeneralPhysicians',
                              'If_PharmacoInvasive_Therapy', 'NoOf_CCUNurses', 'Thrombolysis_Availability', 'CathLab_Availability', 'PCI_Availability', 'Heard_About_Project', 'Help_Timely_Care_ToPatients'];

   FArrays: any[] = ['CardiologistArray', 'GeneralPhysicianArray', 'CoOrdinatorsArray', 'HospitalReferringArray', 'ClosetHospitalArray'];


   HospitalType: any[] = [ {Name: 'Government', Key: 'government'},
                           {Name: 'Private', Key: 'private'}   ];

   ECGLocation: any[] = [  {Name: 'Emergency Room', Key: 'emergency'},
                           {Name: 'CCU', Key: 'ccu'},
                           {Name: 'Cardiology Department', Key: 'cardiology'},
                           {Name: 'Other', Key: 'other'} ];

   PatchOrBulbElectrode: any[] = [  {Name: 'Patch', Key: 'patch'},
                                    {Name: 'Bulb', Key: 'bulb'},
                                    {Name: 'Both', Key: 'both'}   ];

   ThrombolyticType: any[] = [   {Name: 'Streptokinase', Key: 'streptokinase'},
                                 {Name: 'Tenecteplase', Key: 'tenecteplase'},
                                 {Name: 'Reteplase', Key: 'reteplase'},
                                 {Name: 'Others', Key: 'others'}   ];


   public searchControl: FormControl;
   FormUploading = false;


   AlphaNumeric = new RegExp('^[A-Za-z0-9]+$');
   AlphaNumericSpaceHyphen = new RegExp('^[A-Za-z0-9 -]+$');
   Alphabets = new RegExp('^[A-Za-z]+$');
   AlphabetsSpaceHyphen = new RegExp('^[A-Za-z -]+$');
   AlphabetsSpaceHyphenDot = new RegExp('^[A-Za-z -.]+$');
   Numerics = new RegExp('^[0-9]+$');
   NumericDecimal = new RegExp('^[0-9]+([.][0-9]+)?$');
   MobileNumeric = new RegExp('^[0-9 +]+$');

   constructor(public MapsAPI: MapsAPILoader,
               public ModalService: BsModalService,
               public ngZone: NgZone,
               public commonService: CommonService,
               public HospitalService: HospitalManagementService,
               public LocService: LocationService,
               public ActiveRoute: ActivatedRoute,
               public Toastr: ToastrService,
               public router: Router
            ) {

      this.RouteName = this.ActiveRoute.snapshot.url[0].path;
      if (this.RouteName === 'Hospital-Apply' ) {
         this.PageAccess = 'Open';
      }
      if (this.RouteName === 'Hospital-Edit') {
         this.PageType = 'Edit';
         this.id = this.ActiveRoute.snapshot.url[1].path;
         this.HospitalService.Hospital_view({ _id: this.id }).subscribe(response => {
            if (response.Status) {
               this.HospitalDetails = response.Response;
               this.UpdateDetails();
            }
         });
      } else {
         this.PageType = 'Create';
         this.setCurrentPosition();
         this.commonService.GetCountries('').subscribe( response => {
            this.CountriesList = response.Response;
         });
         this.LocService.StemiLocations_SimpleList('').subscribe( response => {
            this.LocationsList = response.Response;
            setTimeout(() => {
               this.HospitalManageForm.controls.Location.updateValueAndValidity();
            }, 100);
         });
      }
   }

   ngOnInit() {

      this.searchControl = new FormControl();

      this.MapsAPI.load().then(() => {
         const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement);
         autocomplete.addListener('place_changed', () => {
            this.ngZone.run(() => {
               const place: google.maps.places.PlaceResult = autocomplete.getPlace();
               if (place.geometry === undefined || place.geometry === null) {
                  return;
               }
               this.AutocompleteData(place);
               this.latitude = place.geometry.location.lat();
               this.longitude = place.geometry.location.lng();
               this.zoom = 14;
               setTimeout(() => {
                  this.HospitalManageForm.controls.Latitude.setValue(this.latitude);
                  this.HospitalManageForm.controls.Longitude.setValue(this.longitude);
               }, 10);
            });
         });
      });


      this.HospitalManageForm = new FormGroup({
         searchAddress: new FormControl(''),
         Hospital_Type: new FormControl('', Validators.required),
         Department_of_Administration: new FormControl('', this.CustomValidation('AlphabetsSpaceHyphen')),
         Hospital_Name: new FormControl('', [Validators.required, this.CustomValidation('AlphabetsSpaceHyphenDot')]),
         Address: new FormControl('', Validators.required),
         Country: new FormControl(null, [Validators.required]),
         State: new FormControl(null, [Validators.required]),
         City: new FormControl(null, [Validators.required]),
         Pin_Code: new FormControl('', [Validators.required, this.CustomValidation('AlphaNumericSpaceHyphen'), Validators.minLength(3), Validators.maxLength(6)]),
         Location: new FormControl(null, [Validators.required]),
         Latitude: new FormControl({value: '', disabled: true}, Validators.required),
         Longitude: new FormControl({value: '', disabled: true}, Validators.required),
         Phone: new FormControl('', [Validators.required, this.CustomValidation('MobileNumeric'), Validators.minLength(9), Validators.maxLength(16) ]),
         Mobile: new FormControl('', [this.CustomValidation('MobileNumeric'), Validators.minLength(9), Validators.maxLength(16)]),
         Is_EMS: new FormControl(null),
         Best_Mobile_Network: new FormControl(''),
         Wifi_Availability: new FormControl(''),
         Popular_FM_Channel: new FormControl(''),
         Popular_Newspaper: new FormControl(''),
         NoOf_Own_Ambulances: new FormControl('', [this.CustomValidation('Numerics'), Validators.maxLength(2)]),
         Owned_Ambulance_Drop: new FormControl(''),
         ECG_Availability: new FormControl('', Validators.required),
         Defibrillator: new FormControl('', Validators.required),
         BLS_ALS_Ambulance: new FormControl(''),
         PMJAY_Availability: new FormControl(''),
         ECG_Location: new FormControl(''),
         ECG_Brand_And_Model: new FormControl(''),
         Patch_Or_BulbElectrode: new FormControl(''),
         NoOf_ECG_PerMonth: new FormControl('', [this.CustomValidation('Numerics'), Validators.maxLength(3)]),
         NoOf_Cardiology_Beds: new FormControl('', [Validators.required, this.CustomValidation('Numerics'), Validators.maxLength(3)]),
         NoOf_ICU_Or_CCU_Beds: new FormControl('', [Validators.required, this.CustomValidation('Numerics'), Validators.maxLength(3)]),
         Doctors_24in7_EmergencyRoom: new FormControl(''),
         Doctors_24in7_CCU: new FormControl(''),
         NoOf_Cardiologists: new FormControl('', [Validators.required, this.CustomValidation('Numerics'), Validators.maxLength(2)]),
         NoOf_GeneralPhysicians: new FormControl('', [Validators.required, this.CustomValidation('Numerics'), Validators.maxLength(3)]),
         NoOf_CCUNurses: new FormControl('', [Validators.required, this.CustomValidation('Numerics'), Validators.maxLength(2)]),
         Thrombolysis_Availability: new FormControl('', Validators.required),
         TypeOf_Thrombolytic: new FormControl(''),
         Thrombolytic_Other: new FormControl(''),
         NoOf_Thrombolysed_patients_PerMonth: new FormControl('', [this.CustomValidation('Numerics'), Validators.maxLength(4)]),
         PercentageOf_Streptokinase_patients: new FormControl('', [this.CustomValidation('NumericDecimal'), Validators.max(100)]),
         PercentageOf_Tenecteplase_patients: new FormControl('', [this.CustomValidation('NumericDecimal'), Validators.max(100)]),
         PercentageOf_Reteplase_patients: new FormControl('', [this.CustomValidation('NumericDecimal'),  Validators.max(100)]),
         CathLab_Availability: new FormControl('', Validators.required),
         CathLab_24_7: new FormControl(''),
         ClosestHospitals_with_CathLab: new FormControl(''),
         PCI_Availability: new FormControl('', Validators.required),
         NoOf_PCI_Done_PerMonth: new FormControl('', [this.CustomValidation('Numerics'), Validators.maxLength(4)]),
         NoOf_PrimaryPCI_Done_PerMonth: new FormControl('', [this.CustomValidation('Numerics'), Validators.maxLength(4)]),
         If_PharmacoInvasive_Therapy: new FormControl('', Validators.required),
         NoOf_PharmacoInvasive_PerMonth: new FormControl('', [this.CustomValidation('Numerics'), Validators.maxLength(4)]),
         Cardiology_Department_Head: new FormControl('', [Validators.required, this.CustomValidation('AlphabetsSpaceHyphen')]),
         NoOf_STEMI_Patients_PerMonth: new FormControl('', [this.CustomValidation('Numerics'), Validators.maxLength(4)]),
         NoOf_Direct_STEMI_Patients_PerMonth: new FormControl('', [this.CustomValidation('Numerics'), Validators.maxLength(4)]),
         NoOf_Referral_STEMI_Patients_PerMonth: new FormControl('', [this.CustomValidation('Numerics'), Validators.maxLength(4)]),
         // NoOf_STEMI_Cases_ReferredFrom_PerMonth: new FormControl('', [this.CustomValidation('Numerics'), Validators.maxLength(4)]),
         NoOf_STEMI_Cases_ReferredTo_PerMonth: new FormControl('', [this.CustomValidation('Numerics'), Validators.maxLength(4)]),
         Heard_About_Project: new FormControl('', Validators.required),
         Help_Timely_Care_ToPatients: new FormControl('', Validators.required),
         Feedback_Remarks: new FormControl(''),
         CardiologistArray: new FormArray([]),
         GeneralPhysicianArray: new FormArray([]),
         CoOrdinatorsArray: new FormArray([this.createCoOrdinatorsItem()]),
         HospitalReferringArray: new FormArray([this.createHospitalReferringItem()]),
         ClosetHospitalArray: new FormArray([this.createClosetHospitalItem()]),
      });
      this.HospitalManageForm.get('BLS_ALS_Ambulance').setValidators([this.BLSAmbulancesChange()]);

      this.AutocompleteFilters();
      this.PageLoaded = true;

   }


   GetFormControlErrorMessage(KeyName: any) {
      const FControl = this.HospitalManageForm.get(KeyName) as FormControl;
      if (FControl.invalid && FControl.touched) {
         const ErrorKeys: any[] = FControl.errors !== null ? Object.keys(FControl.errors) : [];
         if (ErrorKeys.length > 0) {
            let returnText = '';
            if (ErrorKeys.indexOf('required') > -1) {
               returnText = 'This field is required';
            } else if (ErrorKeys.indexOf('min') > -1) {
               returnText = 'Enter the value should be more than ' + FControl.errors.min.min;
            } else if (ErrorKeys.indexOf('max') > -1) {
               returnText = 'Enter the value should be less than or equal ' + FControl.errors.max.max;
            } else if (ErrorKeys.indexOf('minlength') > -1) {
               returnText = 'Enter the value should be greater than ' + FControl.errors.minlength.requiredLength + ' Digits/Characters';
            } else if (ErrorKeys.indexOf('maxlength') > -1) {
               returnText = 'Enter the value should be less than ' + FControl.errors.maxlength.requiredLength + ' Digits/Characters';
            } else if (ErrorKeys.indexOf('BLSMaximum') > -1) {
               returnText = 'Enter the value should be less than or equal ' + this.HospitalManageForm.get('NoOf_Own_Ambulances').value;
            } else if (ErrorKeys.indexOf('AlphaNumericError') > -1) {
               returnText = 'Please Enter Only Alphabets and Numerics!';
            } else if (ErrorKeys.indexOf('AlphaNumericSpaceHyphen') > -1) {
               returnText = 'Please Enter Only Alphabets, Numerics, Space and Hyphen!';
            } else if (ErrorKeys.indexOf('AlphabetsError') > -1) {
               returnText = 'Please Enter Only Alphabets!';
            } else if (ErrorKeys.indexOf('AlphabetsSpaceHyphenError') > -1) {
               returnText = 'Please Enter Only Alphabets, Space and Hyphen!';
            } else if (ErrorKeys.indexOf('AlphabetsSpaceHyphenDotError') > -1) {
               returnText = 'Please Enter Only Alphabets, Space, Dot and Hyphen!';
            } else if (ErrorKeys.indexOf('NumericsError') > -1) {
               returnText = 'Please Enter Only Numerics!';
            } else if (ErrorKeys.indexOf('NumericDecimalError') > -1) {
               returnText = 'Please Enter Only Numeric and Decimals!';
            } else if (ErrorKeys.indexOf('MobileNumericError') > -1) {
               returnText = 'Please Enter Only Numeric, Spaces and +!';
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


   GetFormArrayControlErrorMessage(KeyName: any, index: any, key: any) {
      const FArray = this.HospitalManageForm.get(KeyName) as FormArray;
      const FGroup = FArray.controls[index] as FormGroup;
      const FControl = FGroup.get(key) as FormControl;
      if (FControl.invalid && FControl.touched) {
         const ErrorKeys: any[] = FControl.errors !== null ? Object.keys(FControl.errors) : [];
         if (ErrorKeys.length > 0) {
            let returnText = '';
            if (ErrorKeys.indexOf('required') > -1) {
               returnText = 'This field is required';
            } else if (ErrorKeys.indexOf('min') > -1) {
               returnText = 'Enter the value should be more than ' + FControl.errors.min.min;
            } else if (ErrorKeys.indexOf('max') > -1) {
               returnText = 'Enter the value should be less than or equal ' + FControl.errors.max.max;
            } else if (ErrorKeys.indexOf('minlength') > -1) {
               returnText = 'Enter the value should be greater than ' + FControl.errors.minlength.requiredLength + ' Digits/Characters';
            } else if (ErrorKeys.indexOf('maxlength') > -1) {
               returnText = 'Enter the value should be less than ' + FControl.errors.maxlength.requiredLength + ' Digits/Characters';
            } else if (ErrorKeys.indexOf('AlphaNumericError') > -1) {
               returnText = 'Please Enter Only Alphabets and Numerics!';
            } else if (ErrorKeys.indexOf('AlphaNumericSpaceHyphen') > -1) {
               returnText = 'Please Enter Only Alphabets, Numerics, Space and Hyphen!';
            } else if (ErrorKeys.indexOf('AlphabetsError') > -1) {
               returnText = 'Please Enter Only Alphabets!';
            } else if (ErrorKeys.indexOf('AlphabetsSpaceHyphenError') > -1) {
               returnText = 'Please Enter Only Alphabets, Space and Hyphen!';
            } else if (ErrorKeys.indexOf('AlphabetsSpaceHyphenDotError') > -1) {
               returnText = 'Please Enter Only Alphabets, Space, Dot and Hyphen!';
            } else if (ErrorKeys.indexOf('NumericsError') > -1) {
               returnText = 'Please Enter Only Numerics!';
            } else if (ErrorKeys.indexOf('NumericDecimalError') > -1) {
               returnText = 'Please Enter Only Numeric and Decimals!';
            } else if (ErrorKeys.indexOf('MobileNumericError') > -1) {
               returnText = 'Please Enter Only Numeric, Spaces and +!';
            } else if (ErrorKeys.indexOf('email') > -1) {
               returnText = 'Please Enter Valid Email!';
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


   CustomValidation(Condition: any): ValidatorFn {
      if (Condition === 'AlphaNumeric') {
         return (control: AbstractControl): { [key: string]: boolean } | null => {
            if (control.value !== '' && control.value !== null && !this.AlphaNumeric.test(control.value)) {
               return { AlphaNumericError: true };
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
      if (Condition === 'Alphabets') {
         return (control: AbstractControl): { [key: string]: boolean } | null => {
            if (control.value !== '' && control.value !== null && !this.Alphabets.test(control.value)) {
               return { AlphabetsError: true };
            }
            return null;
         };
      }
      if (Condition === 'AlphabetsSpaceHyphen') {
         return (control: AbstractControl): { [key: string]: boolean } | null => {
            if ( control.value !== '' && control.value !== null && !this.AlphabetsSpaceHyphen.test(control.value)) {
               return { AlphabetsSpaceHyphenError: true };
            }
            return null;
         };
      }
      if (Condition === 'AlphabetsSpaceHyphenDot') {
         return (control: AbstractControl): { [key: string]: boolean } | null => {
            if ( control.value !== '' && control.value !== null && !this.AlphabetsSpaceHyphenDot.test(control.value)) {
               return { AlphabetsSpaceHyphenDotError: true };
            }
            return null;
         };
      }
      if (Condition === 'Numerics') {
         return (control: AbstractControl): { [key: string]: boolean } | null => {
            if ( control.value !== '' && control.value !== null && !this.Numerics.test(control.value)) {
               return { NumericsError: true };
            }
            return null;
         };
      }
      if (Condition === 'NumericDecimal') {
         return (control: AbstractControl): { [key: string]: boolean } | null => {
            if ( control.value !== '' && control.value !== null && !this.NumericDecimal.test(control.value)) {
               return { NumericDecimalError: true };
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

   BLSAmbulancesChange(): ValidatorFn {
      return (control: AbstractControl): { [key: string]: boolean } | null => {
         let NoOfOwnAmbulances = this.HospitalManageForm.get('NoOf_Own_Ambulances').value;
         NoOfOwnAmbulances = !isNaN(NoOfOwnAmbulances) ? Number(NoOfOwnAmbulances) : 0;
         if (control.value !== '' && control.value !== null) {
            const value = !isNaN(control.value) ? Number(control.value) : 0;
            if (NoOfOwnAmbulances > 0 && NoOfOwnAmbulances < value) {
               return { BLSMaximum: true };
            } else  {
               return null;
            }
         }
         return null;
      };
   }


   UpdateDetails() {

      if (  this.HospitalDetails.Latitude && this.HospitalDetails.Latitude !== '' && this.HospitalDetails.Latitude !== null &&
            this.HospitalDetails.Longitude && this.HospitalDetails.Longitude !== '' && this.HospitalDetails.Longitude !== null) {
         this.latitude = this.HospitalDetails.Latitude;
         this.longitude = this.HospitalDetails.Longitude;
      } else {
         this.setCurrentPosition();
      }

      this.HospitalManageForm.addControl('HospitalId', new FormControl(this.HospitalDetails._id, Validators.required));
      this.HospitalManageForm.controls.Hospital_Type.setValue(this.HospitalDetails.Hospital_Type);
      this.HospitalManageForm.controls.Department_of_Administration.setValue(this.HospitalDetails.Department_of_Administration);
      this.HospitalManageForm.controls.Hospital_Name.setValue(this.HospitalDetails.Hospital_Name);
      this.HospitalManageForm.controls.Address.setValue(this.HospitalDetails.Address);
      this.HospitalManageForm.controls.Pin_Code.setValue(this.HospitalDetails.Pin_Code);
      this.HospitalManageForm.controls.Latitude.setValue(this.HospitalDetails.Latitude);
      this.HospitalManageForm.controls.Longitude.setValue(this.HospitalDetails.Longitude);
      this.HospitalManageForm.controls.Location.setValue(this.HospitalDetails.Location);
      this.HospitalManageForm.controls.Phone.setValue(this.HospitalDetails.Phone);
      this.HospitalManageForm.controls.Mobile.setValue(this.HospitalDetails.Mobile);
      this.HospitalManageForm.controls.Best_Mobile_Network.setValue(this.HospitalDetails.Best_Mobile_Network);
      this.HospitalManageForm.controls.Wifi_Availability.setValue(this.HospitalDetails.Wifi_Availability);
      this.HospitalManageForm.controls.Popular_FM_Channel.setValue(this.HospitalDetails.Popular_FM_Channel);
      this.HospitalManageForm.controls.Popular_Newspaper.setValue(this.HospitalDetails.Popular_Newspaper);
      this.HospitalManageForm.controls.Is_EMS.setValue(this.HospitalDetails.Is_EMS);
      this.HospitalManageForm.controls.Owned_Ambulance_Drop.setValue(this.HospitalDetails.Owned_Ambulance_Drop);
      this.HospitalManageForm.controls.BLS_ALS_Ambulance.setValue(this.HospitalDetails.BLS_ALS_Ambulance);
      this.HospitalManageForm.controls.Defibrillator.setValue(this.HospitalDetails.Defibrillator);
      this.HospitalManageForm.controls.PMJAY_Availability.setValue(this.HospitalDetails.PMJAY_Availability);
      this.HospitalManageForm.controls.ECG_Availability.setValue(this.HospitalDetails.ECG_Availability);
      this.HospitalManageForm.controls.ECG_Location.setValue(this.HospitalDetails.ECG_Location);
      this.HospitalManageForm.controls.ECG_Brand_And_Model.setValue(this.HospitalDetails.ECG_Brand_And_Model);
      this.HospitalManageForm.controls.NoOf_ECG_PerMonth.setValue(this.HospitalDetails.NoOf_ECG_PerMonth);
      this.HospitalManageForm.controls.NoOf_Own_Ambulances.setValue(this.HospitalDetails.NoOf_Own_Ambulances);
      this.HospitalManageForm.controls.Patch_Or_BulbElectrode.setValue(this.HospitalDetails.Patch_Or_BulbElectrode);
      this.HospitalManageForm.controls.NoOf_Cardiology_Beds.setValue(this.HospitalDetails.NoOf_Cardiology_Beds);
      this.HospitalManageForm.controls.Doctors_24in7_EmergencyRoom.setValue(this.HospitalDetails.Doctors_24in7_EmergencyRoom);
      this.HospitalManageForm.controls.Doctors_24in7_CCU.setValue(this.HospitalDetails.Doctors_24in7_CCU);
      this.HospitalManageForm.controls.Cardiology_Department_Head.setValue(this.HospitalDetails.Cardiology_Department_Head);
      this.HospitalManageForm.controls.NoOf_Cardiologists.setValue(this.HospitalDetails.NoOf_Cardiologists);
      this.HospitalManageForm.controls.NoOf_GeneralPhysicians.setValue(this.HospitalDetails.NoOf_GeneralPhysicians);
      this.HospitalManageForm.controls.CathLab_Availability.setValue(this.HospitalDetails.CathLab_Availability);
      this.HospitalManageForm.controls.ClosestHospitals_with_CathLab.setValue(this.HospitalDetails.ClosestHospitals_with_CathLab);
      this.HospitalManageForm.controls.CathLab_24_7.setValue(this.HospitalDetails.CathLab_24_7);
      this.HospitalManageForm.controls.NoOf_ICU_Or_CCU_Beds.setValue(this.HospitalDetails.NoOf_ICU_Or_CCU_Beds);
      this.HospitalManageForm.controls.PCI_Availability.setValue(this.HospitalDetails.PCI_Availability);
      this.HospitalManageForm.controls.NoOf_PCI_Done_PerMonth.setValue(this.HospitalDetails.NoOf_PCI_Done_PerMonth);
      this.HospitalManageForm.controls.NoOf_PrimaryPCI_Done_PerMonth.setValue(this.HospitalDetails.NoOf_PrimaryPCI_Done_PerMonth);
      this.HospitalManageForm.controls.NoOf_CCUNurses.setValue(this.HospitalDetails.NoOf_CCUNurses);
      this.HospitalManageForm.controls.Thrombolysis_Availability.setValue(this.HospitalDetails.Thrombolysis_Availability);
      this.HospitalManageForm.controls.TypeOf_Thrombolytic.setValue(this.HospitalDetails.TypeOf_Thrombolytic);
      this.HospitalManageForm.controls.NoOf_Thrombolysed_patients_PerMonth.setValue(this.HospitalDetails.NoOf_Thrombolysed_patients_PerMonth);
      this.HospitalManageForm.controls.PercentageOf_Streptokinase_patients.setValue(this.HospitalDetails.PercentageOf_Streptokinase_patients);
      this.HospitalManageForm.controls.PercentageOf_Tenecteplase_patients.setValue(this.HospitalDetails.PercentageOf_Tenecteplase_patients);
      this.HospitalManageForm.controls.PercentageOf_Reteplase_patients.setValue(this.HospitalDetails.PercentageOf_Reteplase_patients);
      this.HospitalManageForm.controls.Thrombolytic_Other.setValue(this.HospitalDetails.Thrombolytic_Other);
      this.HospitalManageForm.controls.If_PharmacoInvasive_Therapy.setValue(this.HospitalDetails.If_PharmacoInvasive_Therapy);
      this.HospitalManageForm.controls.NoOf_PharmacoInvasive_PerMonth.setValue(this.HospitalDetails.NoOf_PharmacoInvasive_PerMonth);
      this.HospitalManageForm.controls.Heard_About_Project.setValue(this.HospitalDetails.Heard_About_Project);
      this.HospitalManageForm.controls.Hospital_Type.setValue(this.HospitalDetails.Hospital_Type);
      this.HospitalManageForm.controls.Help_Timely_Care_ToPatients.setValue(this.HospitalDetails.Help_Timely_Care_ToPatients);
      this.HospitalManageForm.controls.Feedback_Remarks.setValue(this.HospitalDetails.Feedback_Remarks);
      this.HospitalManageForm.controls.NoOf_STEMI_Patients_PerMonth.setValue(this.HospitalDetails.NoOf_STEMI_Patients_PerMonth);
      this.HospitalManageForm.controls.NoOf_Direct_STEMI_Patients_PerMonth.setValue(this.HospitalDetails.NoOf_Direct_STEMI_Patients_PerMonth);
      this.HospitalManageForm.controls.NoOf_Referral_STEMI_Patients_PerMonth.setValue(this.HospitalDetails.NoOf_Referral_STEMI_Patients_PerMonth);
      // this.HospitalManageForm.controls.NoOf_STEMI_Cases_ReferredFrom_PerMonth.setValue(this.HospitalDetails.NoOf_STEMI_Cases_ReferredFrom_PerMonth);
      this.HospitalManageForm.controls.NoOf_STEMI_Cases_ReferredTo_PerMonth.setValue(this.HospitalDetails.NoOf_STEMI_Cases_ReferredTo_PerMonth);
      this.HospitalManageForm.updateValueAndValidity();
      this.commonService.GetCountries('').subscribe( response => {
         if (response.Status) {
            this.CountriesList = response.Response;
            this.HospitalManageForm.controls.Country.setValue(this.HospitalDetails.Country, {emitEvent: false});
            this.commonService.GetStates({ Country_Id: this.HospitalDetails.Country._id }).subscribe( responseNew => {
               if (responseNew.Status) {
                  this.StatesList = responseNew.Response;
                  this.HospitalManageForm.controls.State.setValue(this.HospitalDetails.State, {emitEvent: false});
                  this.commonService.GetCities({ State_Id: this.HospitalDetails.State._id }).subscribe( newResponse => {
                     if (newResponse.Status) {
                        this.CitiesList = newResponse.Response;
                        this.HospitalManageForm.controls.City.setValue(this.HospitalDetails.City, {emitEvent: false});
                     }
                  });
               }
            });
         }
      });

      this.LocService.StemiLocations_SimpleList('').subscribe( response => {
         if (response.Status) {
            this.LocationsList = response.Response;
            this.HospitalManageForm.controls.Location.setValue(this.HospitalDetails.Location, {onlySelf: true, emitEvent: false});
         }
      });

      this.HospitalTypeChange(this.HospitalDetails.Hospital_Type);
      this.checkECGAvailability(this.HospitalDetails.ECG_Availability);
      this.checkCathLabAvailability(this.HospitalDetails.CathLab_Availability);
      this.checkPCIAvailability(this.HospitalDetails.PCI_Availability);
      this.checkThrombolysisAvailability(this.HospitalDetails.Thrombolysis_Availability);
      this.ThrombolyticTypeChange(this.HospitalDetails.TypeOf_Thrombolytic);
      this.checkPharmacoInvasive(this.HospitalDetails.If_PharmacoInvasive_Therapy);

      if (this.HospitalDetails.Is_EMS) {
         this.checkEMS(true);
      }

      this.editCardiologistItem(this.HospitalDetails.Cardiologist_Array);
      this.editGeneralPhysicianItem(this.HospitalDetails.GeneralPhysician_Array);
      this.editCoOrdinatorsItem(this.HospitalDetails.CoOrdinators_Array);
      this.editHospitalReferringItem(this.HospitalDetails.Hospitals_Refer_STEMI_Patients);
      this.editClosetHospitalItem(this.HospitalDetails.ClosetHospital_Array);
   }

   setCurrentPosition() {
      if ('geolocation' in navigator) {
         navigator.geolocation.getCurrentPosition((position) => {
            this.latitude = position.coords.latitude;
            this.longitude = position.coords.longitude;
            this.zoom = 14;
            setTimeout(() => {
               this.HospitalManageForm.controls.Latitude.setValue(this.latitude);
               this.HospitalManageForm.controls.Longitude.setValue(this.longitude);
            }, 10);
         });
      }
   }

   markerDragEvent(event: any) {
      const latlng = {lat: event.coords.lat, lng: event.coords.lng};
      this.searchElementRef.nativeElement.value = '';
      this.MapsAPI.load().then(() => {
         const geocoder = new google.maps.Geocoder();
         geocoder.geocode({location: latlng}, (results: any) => {
            if (results[0] !== undefined) {
               this.AutocompleteData(results[0]);
               setTimeout(() => {
                  this.HospitalManageForm.controls.Latitude.setValue(latlng.lat);
                  this.HospitalManageForm.controls.Longitude.setValue(latlng.lng);
               }, 10);
            }
         });
      });
   }

   AutocompleteData(data: any) {
      const Name = (data.name !== undefined && data.name !== null) ? data.name : this.HospitalManageForm.controls.Hospital_Name.value;
      const Address = (data.formatted_address !== undefined && data.formatted_address !== null) ? data.formatted_address : this.HospitalManageForm.controls.Address.value;
      let Country = '';
      let State = '';
      let City = '';
      let PinCode = '';
      const Phone = (data.international_phone_number !== undefined && data.international_phone_number !== null) ? data.international_phone_number : this.HospitalManageForm.controls.Phone.value;

      data.address_components.map(obj => {
         obj.types.map(newObj => {
            if (newObj === 'country') {
               Country = obj.long_name;
            }
            if (newObj === 'administrative_area_level_1') {
               State = obj.long_name;
            }
            if (newObj === 'administrative_area_level_2') {
               City = obj.long_name;
            }
            if (newObj === 'postal_code') {
               PinCode = obj.long_name;
            }
         });
      });

      this.HospitalManageForm.controls.Hospital_Name.setValue(Name);
      this.HospitalManageForm.controls.Address.setValue(Address);
      this.HospitalManageForm.controls.Phone.setValue(Phone);
      this.HospitalManageForm.controls.Pin_Code.setValue(PinCode);

      const AllCountryNames = this.CountriesList.map(obj => obj.Country_Name);
      const CountrySimilarity = stringSimilarity.findBestMatch(Country, AllCountryNames);
      const CountryData = this.CountriesList[CountrySimilarity.bestMatchIndex];
      this.HospitalManageForm.controls.Country.setValue(CountryData, {emitEvent: false});
      this.commonService.GetStates({ Country_Id: CountryData._id }).subscribe( response => {
         this.StatesList = response.Response;
         const AllStateNames = this.StatesList.map(obj => obj.State_Name);
         const StateSimilarity = stringSimilarity.findBestMatch(State, AllStateNames);
         const StateData = this.StatesList[StateSimilarity.bestMatchIndex];
         this.HospitalManageForm.controls.State.setValue(StateData,  {emitEvent: false});
         this.commonService.GetCities({ State_Id: StateData._id }).subscribe( newResponse => {
            this.CitiesList = newResponse.Response;
            const AllCityNames = this.CitiesList.map(obj => obj.City_Name);
            const CitySimilarity = stringSimilarity.findBestMatch(City, AllCityNames);
            const CityData = this.CitiesList[CitySimilarity.bestMatchIndex];
            this.HospitalManageForm.controls.City.setValue(CityData,  {emitEvent: false});
         });
      });

   }

   AutocompleteFilters() {
      this.filteredCountriesList = this.HospitalManageForm.controls.Country.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                  if (this.LastSelectedCountry === null || this.LastSelectedCountry !== value._id) {
                     this.LastSelectedCountry = value._id;
                     this.onSelectCountry(value._id);
                  }
                  value = value.Country_Name;
               }
               return this.CountriesList.filter(option => option.Country_Name.toLowerCase().includes(value.toLowerCase()));
            } else {
               this.LastSelectedCountry = null;
               this.HospitalManageForm.controls.State.setValue(null);
               this.HospitalManageForm.controls.City.setValue(null);
               this.StatesList = [];
               this.CitiesList = [];
               return [];
            }
         })
      );
      this.filteredStatesList = this.HospitalManageForm.controls.State.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                  if (this.LastSelectedState === null || this.LastSelectedState !== value._id) {
                     this.LastSelectedState = value._id;
                     this.onSelectStates(value._id);
                  }
                  value = value.State_Name;
               }
               return this.StatesList.filter(option => option.State_Name.toLowerCase().includes(value.toLowerCase()));
            } else {
               this.LastSelectedState = null;
               this.HospitalManageForm.controls.City.setValue(null);
               this.CitiesList = [];
               return [];
            }
         })
      );
      this.filteredCitiesList = this.HospitalManageForm.controls.City.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                  if (this.LastSelectedCity === null || this.LastSelectedCity !== value._id) {
                     this.LastSelectedCity = value._id;
                  }
                  value = value.City_Name;
               }
               return this.CitiesList.filter(option => option.City_Name.toLowerCase().includes(value.toLowerCase()));
            } else {
               this.LastSelectedCity = null;
               return [];
            }
         })
      );
      this.filteredLocationsList = this.HospitalManageForm.controls.Location.valueChanges.pipe(
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
               // return [];
            }
         })
      );
   }

   AutocompleteBlur(key: any) {
      setTimeout(() => {
         const value =  this.HospitalManageForm.controls[key].value;
         if (!value || value === null || value === '' || typeof value !== 'object') {
            this.HospitalManageForm.controls[key].setValue(null);
         }
      }, 500);
   }

   CountryDisplayName(Country: any) {
      return (Country && Country !== null && Country !== '') ? Country.Country_Name : null;
   }

   StateDisplayName(State: any) {
      return (State && State !== null && State !== '') ? State.State_Name : null;
   }

   CityDisplayName(City: any) {
      return (City && City !== null && City !== '') ? City.City_Name : null;
   }

   LocationDisplayName(Location: any) {
      return (Location && Location !== null && Location !== '') ? Location.Location_Name : null;
   }

   GetFormArray(ControlName: any): any[] {
      const FArray = this.HospitalManageForm.get(ControlName) as FormArray;
      return FArray.controls;
   }

   CardiologistsCount(event: any) {
      const Value = Number(event);
      const FArray = this.HospitalManageForm.controls.CardiologistArray as FormArray;
      const Length = FArray.length;
      // tslint:disable-next-line:use-isnan
      if (Value !== NaN) {
         if (Length < event) {
            const AddCount = event - Length;
            const Arr = Array.from(new Array(AddCount), (x, i) => i + 1);
            Arr.map(obj => {
               this.addCardiologistItem();
            });
         }
         if (Length > event) {
            const RemoveCount = Length - event;
            let Arr = Array.from(new Array(RemoveCount), (x, i) => i + 1);
            Arr = Arr.map(obj => Length - obj);
            Arr.map(obj => {
               this.removeCardiologistItem(obj);
            });
         }
      } else {
         if (Length > 0) {
            let Arr = Array.from(new Array(Length), (x, i) => i + 1);
            Arr = Arr.map(obj => Length - obj);
            Arr.map(obj => {
               this.removeCardiologistItem(obj);
            });
         }
      }
   }

   GeneralPhysiciansCount(event: any) {
      const Value = Number(event);
      const FArray = this.HospitalManageForm.controls.GeneralPhysicianArray as FormArray;
      const Length = FArray.length;
      // tslint:disable-next-line:use-isnan
      if (Value !== NaN) {
         if (Length < event) {
            const AddCount = event - Length;
            const Arr = Array.from(new Array(AddCount), (x, i) => i + 1);
            Arr.map(obj => {
               this.addGeneralPhysicianItem();
            });
         }
         if (Length > event) {
            const RemoveCount = Length - event;
            let Arr = Array.from(new Array(RemoveCount), (x, i) => i + 1);
            Arr = Arr.map(obj => Length - obj);
            Arr.map(obj => {
               this.removeGeneralPhysicianItem(obj);
            });
         }
      } else {
         if (Length > 0) {
            let Arr = Array.from(new Array(Length), (x, i) => i + 1);
            Arr = Arr.map(obj => Length - obj);
            Arr.map(obj => {
               this.removeGeneralPhysicianItem(obj);
            });
         }
      }
   }

   CommonInputReset(control: any, value: any) {
      this.HospitalManageForm.controls[control].setValue(value);
      this.HospitalManageForm.controls[control].clearValidators();
      this.HospitalManageForm.controls[control].setErrors(null);
      this.HospitalManageForm.controls[control].markAsPristine();
      this.HospitalManageForm.controls[control].markAsUntouched();
      this.HospitalManageForm.controls[control].updateValueAndValidity();
   }

   CommonInputUpdate(controls: any[]) {
      controls.map(obj => {
         this.HospitalManageForm.get(obj).updateValueAndValidity();
      });
   }

   HospitalTypeChange(event: any) {
      if (event && event === 'government') {
         this.ShowDepartmentOfAdministration = true;
         this.HospitalManageForm.controls.Department_of_Administration.setValidators([Validators.required, this.CustomValidation('AlphabetsSpaceHyphen')]);
         this.CommonInputReset('Owned_Ambulance_Drop', '');
      } else if (event && event === 'private') {
         this.ShowOwnedAmbulanceDrop = true;
         this.HospitalManageForm.controls.Owned_Ambulance_Drop.setValidators([Validators.required, this.CustomValidation('AlphabetsSpaceHyphen')]);
         this.CommonInputReset('Department_of_Administration', '');
      } else {
         this.ShowDepartmentOfAdministration = false;
         this.ShowOwnedAmbulanceDrop = false;
         this.CommonInputReset('Department_of_Administration', '');
         this.CommonInputReset('Owned_Ambulance_Drop', '');
      }
   }

   checkECGAvailability(event) {
      if (event && event === 'Yes') {
         this.HospitalManageForm.controls.ECG_Location.setValidators([Validators.required]);
         this.HospitalManageForm.controls.ECG_Brand_And_Model.setValidators([Validators.required]);
         this.HospitalManageForm.controls.Patch_Or_BulbElectrode.setValidators([Validators.required]);
         this.HospitalManageForm.controls.NoOf_ECG_PerMonth.setValidators([Validators.required, this.CustomValidation('Numerics'), Validators.maxLength(3)]);
         this.CommonInputUpdate(['ECG_Location', 'ECG_Brand_And_Model', 'Patch_Or_BulbElectrode', 'NoOf_ECG_PerMonth']);
      } else {
         this.CommonInputReset('ECG_Location', '' );
         this.CommonInputReset('ECG_Brand_And_Model', '');
         this.CommonInputReset('Patch_Or_BulbElectrode', '');
         this.CommonInputReset('NoOf_ECG_PerMonth', '');
      }
   }

   checkCathLabAvailability(event) {
      if (event && event === 'Yes') {
         this.HospitalManageForm.controls.CathLab_24_7.setValidators([Validators.required]);
         this.HospitalManageForm.controls.NoOf_PCI_Done_PerMonth.setValidators([Validators.required, this.CustomValidation('Numerics'), Validators.maxLength(4)]);
         this.HospitalManageForm.controls.PCI_Availability.setValidators([Validators.required]);
         this.HospitalManageForm.controls.If_PharmacoInvasive_Therapy.setValidators([Validators.required]);
         this.CommonInputUpdate(['CathLab_24_7', 'NoOf_PCI_Done_PerMonth', 'PCI_Availability', 'If_PharmacoInvasive_Therapy']);
         this.CommonInputReset('ClosestHospitals_with_CathLab', '');
      } else {
         this.HospitalManageForm.controls.ClosestHospitals_with_CathLab.setValidators([Validators.required]);
         this.HospitalManageForm.controls.ClosestHospitals_with_CathLab.updateValueAndValidity();
         this.CommonInputReset('CathLab_24_7', '');
         this.CommonInputReset('NoOf_PCI_Done_PerMonth', '');
         this.CommonInputReset('PCI_Availability', '');
         this.CommonInputReset('NoOf_PrimaryPCI_Done_PerMonth', '');
         this.CommonInputReset('If_PharmacoInvasive_Therapy', '');
         this.CommonInputReset('NoOf_PharmacoInvasive_PerMonth', '');
      }
   }

   checkPCIAvailability(event) {
      if (event && event === 'Yes') {
         this.HospitalManageForm.controls.NoOf_PrimaryPCI_Done_PerMonth.setValidators([Validators.required, this.CustomValidation('Numerics'), Validators.maxLength(4)]);
         this.HospitalManageForm.controls.NoOf_PrimaryPCI_Done_PerMonth.updateValueAndValidity();
      } else {
         this.CommonInputReset('NoOf_PrimaryPCI_Done_PerMonth', '');
      }
   }

   checkThrombolysisAvailability(event) {
      if (event && event === 'Yes') {
         this.HospitalManageForm.controls.TypeOf_Thrombolytic.setValidators(Validators.required);
         this.HospitalManageForm.controls.NoOf_Thrombolysed_patients_PerMonth.setValidators([Validators.required, this.CustomValidation('Numerics'), Validators.maxLength(4)]);
         this.CommonInputUpdate(['TypeOf_Thrombolytic', 'NoOf_Thrombolysed_patients_PerMonth']);
      } else {
         this.CommonInputReset('TypeOf_Thrombolytic', '');
         this.CommonInputReset('NoOf_Thrombolysed_patients_PerMonth', '');
      }
   }

   ThrombolyticTypeChange(event: any[]) {
      const Keys = ['streptokinase', 'tenecteplase', 'reteplase', 'others'];
      const NestedKeys = ['PercentageOf_Streptokinase_patients', 'PercentageOf_Tenecteplase_patients', 'PercentageOf_Reteplase_patients', 'Thrombolytic_Other'];
      Keys.map((obj, i) => {
         if (event.includes(obj)) {
            this.HospitalManageForm.controls[NestedKeys[i]].setValidators([Validators.required, this.CustomValidation('NumericDecimal'), Validators.max(100)]);
            this.HospitalManageForm.controls[NestedKeys[i]].updateValueAndValidity();
         } else {
            this.CommonInputReset(NestedKeys[i], '');
         }
      });
   }

   ThrombolyticTypeCheck(KeyValue: any) {
      const value = this.HospitalManageForm.controls.TypeOf_Thrombolytic.value;
      if (value && typeof value === 'object' && value.length > 0) {
         return value.includes(KeyValue);
      } else {
         return false;
      }
   }

   checkPharmacoInvasive(event) {
      if (event && event === 'Yes') {
         this.HospitalManageForm.controls.NoOf_PharmacoInvasive_PerMonth.setValidators([Validators.required, this.CustomValidation('Numerics'), Validators.maxLength(4)]);
         this.HospitalManageForm.controls.NoOf_PharmacoInvasive_PerMonth.updateValueAndValidity();
         } else {
            this.CommonInputReset('NoOf_PharmacoInvasive_PerMonth', '');
      }
   }

   checkEMS(event: any) {
      if (event === true) {
         this.EMS = false;
         Object.keys(this.HospitalManageForm.controls).map(obj => {
            if ( !this.EMSFields.includes(obj)) {
               if (this.FArrays.includes(obj)) {
                  const FArray = this.HospitalManageForm.controls[obj] as FormArray;
                  if (FArray.controls.length > 1) {
                     Array.from(Array(FArray.controls.length).keys()).map(objOne => {
                        if (objOne !== 0) {
                           FArray.removeAt(1);
                        }
                     });
                  }
                  const FGroup = FArray.controls[0] as FormGroup;
                  Object.keys(FGroup.controls).map(objTwo => {
                     const value = typeof FGroup.controls[objTwo].value === 'boolean' || typeof FGroup.controls[objTwo].value === 'object' ? null : '';
                     FGroup.controls[objTwo].setValue(value);
                     FGroup.controls[objTwo].setErrors(null);
                     FGroup.controls[objTwo].markAsUntouched();
                     FGroup.controls[objTwo].markAsPristine();
                     FGroup.controls[objTwo].updateValueAndValidity();

                  });
               } else {
                  const FControl = this.HospitalManageForm.controls[obj] as FormControl;
                  const value = typeof FControl.value === 'boolean' || typeof FControl.value === 'object' ? null : '';
                  FControl.disable();
                  FControl.setValue(value);
                  FControl.setErrors(null);
                  FControl.markAsUntouched();
                  FControl.markAsPristine();
                  FControl.updateValueAndValidity();
               }
            }
         });
      } else if (event === false || event === null) {
         this.EMS = true;
         Object.keys(this.HospitalManageForm.controls).map(obj => {
            if (!this.EMSFields.includes(obj) && !this.FArrays.includes(obj)) {
               const FControl = this.HospitalManageForm.controls[obj] as FormControl;
               FControl.enable();
               FControl.updateValueAndValidity();
            }
         });
      }
   }

   onSelectCountry(country: any) {
      if (country !== null && country !== undefined && country !== '') {
         this.commonService.GetStates({ Country_Id: country }).subscribe( response => {
            this.StatesList = response.Response;
            this.HospitalManageForm.controls.State.setValue(null);
            this.HospitalManageForm.controls.City.setValue(null);
         });
      } else {
         this.HospitalManageForm.controls.State.setValue(null);
         this.HospitalManageForm.controls.City.setValue(null);
      }
   }

   onSelectStates(state: any) {
      if (state !== null && state !== undefined && state !== '') {
         this.commonService.GetCities({ State_Id: state }).subscribe( response => {
            this.CitiesList = response.Response;
            this.HospitalManageForm.controls.City.setValue(null);
         });
      } else {
         this.HospitalManageForm.controls.State.setValue(null);
      }
   }

   createCardiologistItem(): FormGroup {
      return new FormGroup({
         Cardiologist_Name: new FormControl('', [this.CustomValidation('AlphabetsSpaceHyphenDot')]),
         Cardiologist_Phone: new FormControl('', [this.CustomValidation('MobileNumeric'), Validators.minLength(9), Validators.maxLength(16)]),
         Cardiologist_Email: new FormControl('', Validators.email),
         Cardiologist_Preferred_Contact: new FormControl(null)
      });
   }

   editCardiologistItem(array: any[]) {
      const FArray = this.HospitalManageForm.controls.CardiologistArray as FormArray;
      if (array.length > 0) { FArray.removeAt(0); }
      array.map(obj => {
         const FGroup = new FormGroup({
            Cardiologist_Name: new FormControl(obj.Cardiologist_Name, [this.CustomValidation('AlphabetsSpaceHyphenDot')]),
            Cardiologist_Phone: new FormControl(obj.Cardiologist_Phone, [this.CustomValidation('MobileNumeric'), Validators.minLength(9), Validators.maxLength(16)]),
            Cardiologist_Email: new FormControl(obj.Cardiologist_Email, Validators.email),
            Cardiologist_Preferred_Contact: new FormControl(obj.Cardiologist_Preferred_Contact)
            });
         FArray.push(FGroup);
      });
   }

   createGeneralPhysicianItem(): FormGroup {
      return new FormGroup({
         GeneralPhysician_Name: new FormControl('', [this.CustomValidation('AlphabetsSpaceHyphenDot')]),
         GeneralPhysician_Phone: new FormControl('', [this.CustomValidation('MobileNumeric'), Validators.minLength(9), Validators.maxLength(16)]),
         GeneralPhysician_Email: new FormControl('', Validators.email),
         GeneralPhysician_Preferred_Contact: new FormControl(null)
      });
   }

   editGeneralPhysicianItem(array: any[]) {
      const FArray = this.HospitalManageForm.controls.GeneralPhysicianArray as FormArray;
      if (array.length > 0) { FArray.removeAt(0); }
      array.map(obj => {
         const FGroup = new FormGroup({
            GeneralPhysician_Name: new FormControl(obj.GeneralPhysician_Name, [this.CustomValidation('AlphabetsSpaceHyphenDot')]),
            GeneralPhysician_Phone: new FormControl(obj.GeneralPhysician_Phone, [this.CustomValidation('MobileNumeric'), Validators.minLength(9), Validators.maxLength(16)]),
            GeneralPhysician_Email: new FormControl(obj.GeneralPhysician_Email, Validators.email),
            GeneralPhysician_Preferred_Contact: new FormControl(obj.GeneralPhysician_Preferred_Contact)
            });
         FArray.push(FGroup);
      });
   }

   createCoOrdinatorsItem(): FormGroup {
      return new FormGroup({
         CoOrdinators_Name: new FormControl('', [this.CustomValidation('AlphabetsSpaceHyphenDot')]),
         CoOrdinators_Phone: new FormControl('', [this.CustomValidation('MobileNumeric'), Validators.minLength(9), Validators.maxLength(16)]),
         CoOrdinators_Email: new FormControl('', Validators.email),
         CoOrdinators_Preferred_Contact: new FormControl(null)
      });
   }

   editCoOrdinatorsItem(array: any[]) {
      const FArray = this.HospitalManageForm.controls.CoOrdinatorsArray as FormArray;
      if (array.length > 0) { FArray.removeAt(0); }
      array.map(obj => {
         const FGroup = new FormGroup({
            CoOrdinators_Name: new FormControl(obj.CoOrdinators_Name, [this.CustomValidation('AlphabetsSpaceHyphenDot')]),
            CoOrdinators_Phone: new FormControl(obj.CoOrdinators_Phone, [this.CustomValidation('MobileNumeric'), Validators.minLength(9), Validators.maxLength(16)]),
            CoOrdinators_Email: new FormControl(obj.CoOrdinators_Email, Validators.email),
            CoOrdinators_Preferred_Contact: new FormControl(obj.CoOrdinators_Preferred_Contact)
            });
         FArray.push(FGroup);
      });
   }

   createHospitalReferringItem(): FormGroup {
      return new FormGroup({
         Referring_Hospital_Name: new FormControl('', [this.CustomValidation('AlphabetsSpaceHyphenDot')]),
         Is_Cath_Lab: new FormControl(''),
         Ambulance_Service: new FormControl(''),
         Remarks: new FormControl('')
      });
   }

   editHospitalReferringItem(array: any[]) {
      const FArray = this.HospitalManageForm.controls.HospitalReferringArray as FormArray;
      if (array.length > 0) { FArray.removeAt(0); }
      array.map(obj => {
         const FGroup = new FormGroup({
            Referring_Hospital_Name: new FormControl(obj.Referring_Hospital_Name, [this.CustomValidation('AlphabetsSpaceHyphenDot')]),
            Is_Cath_Lab: new FormControl(obj.Is_Cath_Lab),
            Ambulance_Service: new FormControl(obj.Ambulance_Service),
            Remarks: new FormControl(obj.Remarks)
            });
         FArray.push(FGroup);
      });
   }

   createClosetHospitalItem(): FormGroup {
      return new FormGroup({
         Closest_Hospital_Name: new FormControl('', [this.CustomValidation('AlphabetsSpaceHyphenDot')]),
         Closest_Hospital_Address: new FormControl(''),
         Closest_Hospital_Preference: new FormControl('')
      });
   }

   editClosetHospitalItem(array: any[]) {
      const FArray = this.HospitalManageForm.controls.ClosetHospitalArray as FormArray;
      if (array.length > 0) { FArray.removeAt(0); }
      array.map(obj => {
         const FGroup = new FormGroup({
            Closest_Hospital_Name: new FormControl(obj.Closest_Hospital_Name, [this.CustomValidation('AlphabetsSpaceHyphenDot')]),
            Closest_Hospital_Address: new FormControl(obj.Closest_Hospital_Address),
            Closest_Hospital_Preference: new FormControl(obj.Closest_Hospital_Preference)
            });
         FArray.push(FGroup);
      });
   }

   addCardiologistItem(): void {
      this.CardiologistArray = this.HospitalManageForm.get('CardiologistArray') as FormArray;
      this.CardiologistArray.push(this.createCardiologistItem());
    }

   addGeneralPhysicianItem(): void {
      this.GeneralPhysicianArray = this.HospitalManageForm.get('GeneralPhysicianArray') as FormArray;
      this.GeneralPhysicianArray.push(this.createGeneralPhysicianItem());
    }

    addCoOrdinatorsItem(): void {
      this.CoOrdinatorsArray = this.HospitalManageForm.get('CoOrdinatorsArray') as FormArray;
      this.CoOrdinatorsArray.push(this.createCoOrdinatorsItem());
    }

    addHospitalReferringItem(): void {
      this.HospitalReferringArray = this.HospitalManageForm.get('HospitalReferringArray') as FormArray;
      this.HospitalReferringArray.push(this.createHospitalReferringItem());
    }

    addClosetHospitalItem(): void {
      this.ClosetHospitalArray = this.HospitalManageForm.get('ClosetHospitalArray') as FormArray;
      this.ClosetHospitalArray.push(this.createClosetHospitalItem());
    }

   removeCardiologistItem(index: any) {
      this.CardiologistArray.removeAt(index);
   }

   removeGeneralPhysicianItem(index: any) {
      this.GeneralPhysicianArray.removeAt(index);
   }

   removeCoOrdinatorsItem(index: any) {
      this.CoOrdinatorsArray.removeAt(index);
   }

   removeHospitalReferringItem(index: any) {
      this.HospitalReferringArray.removeAt(index);
   }

   removeClosetHospitalItem(index: any) {
      this.ClosetHospitalArray.removeAt(index);
   }


   onSubmit() {
      this.HospitalManageForm.updateValueAndValidity();

      const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
      if (firstElementWithError) {
         window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
      }

      let FormValid = true;
      Object.keys(this.HospitalManageForm.controls).map(obj => {
         const FControl = this.HospitalManageForm.controls[obj] as FormControl;
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if (FormValid && !this.FormUploading) {
         this.FormUploading = true;
         this.HospitalService.Create_Hospital(this.HospitalManageForm.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               if (this.PageAccess === 'Protected') {
                  this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Hospital Details Successfully Submited!' });
                  this.router.navigate(['/Hospital-Management']);
               } else {
                  this.modalReference = this.ModalService.show(StaticModalComponent, Object.assign({}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight modal-small-with'} ));
                  this.router.navigate(['/Login']);
               }
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.HospitalManageForm.controls).map(obj => {
            if (!this.FArrays.includes(obj)) {
               const FControl = this.HospitalManageForm.controls[obj] as FormControl;
               if (FControl.invalid) {
                  FControl.markAsTouched();
                  FControl.markAsDirty();
               }
            }
         });
      }
   }

    onUpdate() {
      this.HospitalManageForm.updateValueAndValidity();

      const firstElementWithError = document.querySelector('.YesOrNoButton.ng-invalid, .mat-form-field.ng-invalid, .mat-select-invalid.ng-invalid .mat-checkbox.ng-invalid');
      if (firstElementWithError) {
         window.scrollTo({top: firstElementWithError.parentElement.getBoundingClientRect().top + window.scrollY - 60, left: 0, behavior: 'smooth'});
      }

      let FormValid = true;
      Object.keys(this.HospitalManageForm.controls).map(obj => {
         const FControl = this.HospitalManageForm.controls[obj] as FormControl;
         if (FControl.status === 'INVALID') {
             FormValid = false;
         }
      });
      if (FormValid && !this.FormUploading) {
         this.FormUploading = true;
         this.HospitalService.Update_Hospital(this.HospitalManageForm.getRawValue()).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Hospital Details Successfully Updated!' });
               this.router.navigate(['/Hospital-Management']);
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         Object.keys(this.HospitalManageForm.controls).map(obj => {
            if (!this.FArrays.includes(obj)) {
               const FControl = this.HospitalManageForm.controls[obj] as FormControl;
               if (FControl.invalid) {
                  FControl.markAsTouched();
                  FControl.markAsPristine();
               }
            }
         });
      }
    }

}
