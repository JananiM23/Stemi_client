import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { FormGroup, Validators, FormControl, AbstractControl, ValidatorFn } from '@angular/forms';

import { BsModalRef } from 'ngx-bootstrap';
import { ReferralFacilityService } from './../../../services/referral-facility/referral-facility.service';
import { ToastrService } from './../../../services/common-services/toastr.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-modal-referral-facility',
  templateUrl: './modal-referral-facility.component.html',
  styleUrls: ['./modal-referral-facility.component.css']
})
export class ModalReferralFacilityComponent implements OnInit {


   onClose: Subject<any>;

   Type: string;
   Data: any;

	HospitalTypes: any[] = [ {Name: 'EMS', Key: 'E'},
									{Name: 'Secondary Hospital', Key: 'S1'},
									{Name: 'Clinic/GP', Key: 'S2'},
									{Name: 'Tertiary level PCI Facility 24x7', Key: 'H1'},
									{Name: 'Tertiary level PCI Facility', Key: 'H2'} ];

   Uploading = false;
   Form: FormGroup;

   AlphabetsSpaceHyphen = new RegExp('^[A-Za-z -]+$');

   constructor(public bsModalRef: BsModalRef,
               public Service: ReferralFacilityService,
               private Toastr: ToastrService) { }

   ngOnInit() {
      this.onClose = new Subject();

      if (this.Type === 'Create') {
         this.Form = new FormGroup({
            Hospital_Name: new FormControl( '', { validators: [Validators.required, this.CustomValidation('AlphabetsSpaceHyphen')],
                                                   asyncValidators: [this.HospitalName_AsyncValidate.bind(this)],
                                                   updateOn: 'blur' } ),
				Hospital_Type: new FormControl('', Validators.required),
            Hospital_Address: new FormControl('', Validators.required),
         });
      }

      if (this.Type === 'Edit') {
         this.Form = new FormGroup({
            Hospital_Name: new FormControl(this.Data.Hospital_Name, { validators: [Validators.required, this.CustomValidation('AlphabetsSpaceHyphen')],
                                                                     asyncValidators: [this.HospitalName_AsyncValidate.bind(this)],
                                                                     updateOn: 'blur' }),
				Hospital_Type: new FormControl(this.Data.Hospital_Type, Validators.required),
            Hospital_Address: new FormControl(this.Data.Hospital_Address, Validators.required),
            HospitalId: new FormControl(this.Data._id, Validators.required),
         });
      }
   }

   HospitalName_AsyncValidate( control: AbstractControl ) {
      const Data = { Hospital_Name: control.value};
      return this.Service.ReferralFacility_AsyncValidate(Data).pipe(map( response => {
         if (response.Status && response.Available) {
            return null;
         } else {
            if (this.Type === 'Edit' && this.Data.Hospital_Name === control.value) {
               return null;
            } else {
               return { HospitalName_NotAvailable: true };
            }
         }
      }));
   }

   CustomValidation(Condition: any): ValidatorFn {
      if (Condition === 'AlphabetsSpaceHyphen') {
         return (control: AbstractControl): { [key: string]: boolean } | null => {
            if (control.value !== '' && control.value !== null && !this.AlphabetsSpaceHyphen.test(control.value)) {
               control.markAsTouched();
               control.markAsDirty();
               return { AlphabetsSpaceHyphenError: true };
            }
            return null;
         };
      }
   }


   onSubmit() {
		this.Form.controls.Hospital_Name.markAsTouched();
		this.Form.controls.Hospital_Name.markAsDirty();
		this.Form.controls.Hospital_Type.markAsTouched();
		this.Form.controls.Hospital_Type.markAsDirty();
		this.Form.controls.Hospital_Address.markAsTouched();
		this.Form.controls.Hospital_Address.markAsDirty();
      if (this.Type === 'Create') {
         this.Submit();
      }
      if (this.Type === 'Edit') {
         this.Update();
      }
   }


   Submit() {
      if (this.Form.valid && !this.Uploading) {
         this.Uploading = true;
         const Data = this.Form.value;
         this.Service.ReferralFacility_Create(Data).subscribe( response => {
            this.Uploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'New Referral Facility Successfully Created' } );
               this.onClose.next({Status: true, Response: response.Response});
               this.bsModalRef.hide();
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage( { Type: 'Error', Message: response.Message } );
               this.onClose.next({Status: false, Message: 'UnExpected Error!'});
               this.bsModalRef.hide();
            }
         });
      }
   }


   Update() {
      if (this.Form.valid && !this.Uploading) {
         this.Uploading = true;
         const Data = this.Form.value;
         this.Service.ReferralFacility_Update(Data).subscribe( response => {
            this.Uploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'Referral Facility Successfully Updated' } );
               this.onClose.next({Status: true, Response: response.Response});
               this.bsModalRef.hide();
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage( { Type: 'Error', Message: response.Message } );
               this.onClose.next({Status: false, Message: 'UnExpected Error!'});
               this.bsModalRef.hide();
            }
         });
      }
   }


}
