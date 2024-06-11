import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { FormGroup, Validators, FormControl, AbstractControl, ValidatorFn } from '@angular/forms';

import { BsModalRef } from 'ngx-bootstrap';
import { LocationService } from './../../../services/location-management/location.service';
import { ToastrService } from './../../../services/common-services/toastr.service';
import { map } from 'rxjs/operators';



@Component({
  selector: 'app-location-management',
  templateUrl: './location-management.component.html',
  styleUrls: ['./location-management.component.css']
})
export class LocationManagementComponent implements OnInit {

   onClose: Subject<any>;

   Type: string;
   Data: any;

   Uploading = false;
   Form: FormGroup;

   AlphabetsSpaceHyphen = new RegExp('^[A-Za-z -]+$');

   constructor(public bsModalRef: BsModalRef,
               public Service: LocationService,
               private Toastr: ToastrService) { }

   ngOnInit() {
      this.onClose = new Subject();

      if (this.Type === 'Create') {
         this.Form = new FormGroup({
            Location_Name: new FormControl( '', { validators: [Validators.required, this.CustomValidation('AlphabetsSpaceHyphen')],
                                                   asyncValidators: [this.Location_AsyncValidate.bind(this)],
                                                   updateOn: 'blur' } ),
         });
      }

      if (this.Type === 'Edit') {
         this.Form = new FormGroup({
            Location_Name: new FormControl(this.Data.Location_Name, { validators: [Validators.required, this.CustomValidation('AlphabetsSpaceHyphen')],
                                                                     asyncValidators: [this.Location_AsyncValidate.bind(this)],
                                                                     updateOn: 'blur' }),
            LocationId: new FormControl(this.Data._id, Validators.required),
         });
      }
   }

   Location_AsyncValidate( control: AbstractControl ) {
      const Data = { Location_Name: control.value};
      return this.Service.StemiLocation_AsyncValidate(Data).pipe(map( response => {
         if (response.Status && response.Available) {
            return null;
         } else {
            if (this.Type === 'Edit' && this.Data.Location_Name === control.value) {
               return null;
            } else {
               return { LocationName_NotAvailable: true };
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
      if (this.Type === 'Create') {
         this.Form.controls.Location_Name.markAsTouched();
         this.Form.controls.Location_Name.markAsDirty();
         this.Submit();
      }
      if (this.Type === 'Edit') {
         this.Form.controls.Location_Name.markAsTouched();
         this.Form.controls.Location_Name.markAsDirty();
         this.Update();
      }
   }


   Submit() {
      if (this.Form.valid && !this.Uploading) {
         this.Uploading = true;
         const Data = this.Form.value;
         this.Service.StemiLocation_Create(Data).subscribe( response => {
            this.Uploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'New Location Successfully Created' } );
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
         this.Service.StemiLocation_Update(Data).subscribe( response => {
            this.Uploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'Location Successfully Updated' } );
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
