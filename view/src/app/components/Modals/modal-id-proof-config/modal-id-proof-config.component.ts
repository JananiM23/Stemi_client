import { Component, OnInit, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatCheckboxChange } from '@angular/material/checkbox';

import { FormArray, FormGroup, FormControl, Validators, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

import { ToastrService } from './../../../services/common-services/toastr.service';
import { IdproofManagementService } from 'src/app/services/idproof-management/idproof-management.service';
import { ModalApprovedComponent } from '../modal-approved/modal-approved.component';


@Component({
   selector: 'app-modal-id-proof-config',
   templateUrl: './modal-id-proof-config.component.html',
   styleUrls: ['./modal-id-proof-config.component.css']
})
export class ModalIdProofConfigComponent implements OnInit {

   onClose: Subject<any>;
   Uploading = false;
   Cluster: any;
   Category: any;
   FormGroup: FormGroup;
   FormLoaded = false;

   ConfigList: any[] = [];
   ClusterConfig: any;
   NewIdAddForm: FormGroup;
   NewIdInput = false;

   ClusterConfigForm: FormGroup;
   Config_Details: FormArray;

   modalReference: BsModalRef;


   constructor(public modalRef: BsModalRef,
               private Toastr: ToastrService,
               public ModalService: BsModalService,
               private Service: IdproofManagementService) {
                  this.Service.IdProof_ConfigList({}).subscribe(response => {
                     this.FormLoaded = true;
                     if (response.Status) {
                        this.ConfigList = response.Response;
                        this.UpdateClusterFormArray();
                     }
                  });
               }

   ngOnInit() {
      this.onClose = new Subject();
      this.NewIdAddForm = new FormGroup({
         Name: new FormControl('', Validators.required),
         Key_Name: new FormControl(),
      });
      this.ClusterConfigForm = new FormGroup({
         _id: new FormControl('', Validators.required),
         Config_Details: new FormArray([]),
      });

      if (this.Category === 'Cluster') {
         this.Service.ClusterConfig_View({Cluster: this.Cluster}).subscribe(response => {
            if (response.Status) {
               this.ClusterConfig = response.Response;
               if (this.ClusterConfig !== null) {
                  this.ClusterConfigForm.controls._id.setValue(this.ClusterConfig._id);
               }
               this.UpdateClusterFormArray();
            }
         });
      }
   }

   UpdateClusterFormArray() {
      if (this.ClusterConfig !== undefined && this.ConfigList.length > 0) {
         this.ConfigList.map(objNew => {
            let Visibility = false;
            if (this.ClusterConfig !== null && this.ClusterConfig.Config_Details !== undefined && this.ClusterConfig.Config_Details !== null) {
               Visibility = this.ClusterConfig.Config_Details.includes(objNew._id) ? true : false;
            }
            const NewFGroup = new FormGroup({
               _id: new FormControl(objNew._id),
               Name: new FormControl(objNew.Name),
               Visibility: new FormControl(Visibility)
            });
            const FArray = this.ClusterConfigForm.get('Config_Details') as FormArray;
            FArray.push(NewFGroup);
         });
      }
   }

   AddNewIdProof() {
      this.NewIdInput = true;
   }

   SubmitNewIdProof() {
      if (this.NewIdAddForm.valid && !this.Uploading) {
         this.Uploading = true;
         const str = this.NewIdAddForm.controls.Name.value;
         const replaced = str.replace(/ /g, '_');
         this.NewIdAddForm.controls.Key_Name.setValue(replaced);

         const Info = this.NewIdAddForm.getRawValue();
         this.Service.IdProofConfig_Create(Info).subscribe(response => {
            this.Uploading = false;
            if (response.Status) {
               this.NewIdAddForm.reset();
               this.NewIdInput = false;
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'New Id-Proof Successfully Added' });
               this.ConfigList = response.Response;
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      }
   }

   DeleteIdProof(idx: any) {
      const initialState = {
         Icon: 'delete_forever',
         ColorCode: 'danger',
         TextOne: 'You Want to',
         TextTwo: 'Delete',
         TextThree: 'this Id-Proof ?',
      };
      this.modalReference = this.ModalService.show(ModalApprovedComponent, Object.assign({ initialState }, { ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight modal-small-with' }));
      this.modalReference.content.onClose.subscribe(response => {
         if (response.Status) {
            const Id = this.ConfigList[idx]._id;
            this.Service.IdProofConfig_Delete({ ConfigId: Id }).subscribe(newResponse => {
               if (newResponse.Status) {
                  this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Id-Proof Successfully Removed' });
                  this.ConfigList = newResponse.Response;
               } else {
                  if (newResponse.Message === undefined || newResponse.Message === '' || newResponse.Message === null) {
                     newResponse.Message = 'Some Error Occoured!, But not Identified.';
                  }
                  this.Toastr.NewToastrMessage({ Type: 'Error', Message: newResponse.Message });
               }
            });
         }
      });
   }

   getFArray(): FormArray {
      return this.ClusterConfigForm.get('Config_Details') as FormArray;
    }


   GetFormControlErrorMessage(KeyName: any) {
      const FControl = this.NewIdAddForm.get(KeyName) as FormControl;
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

   Submit() {
      if (this.ClusterConfigForm.valid && !this.Uploading) {
         this.Uploading = true;
         const Info = this.ClusterConfigForm.getRawValue();
         const ConfigDetails = [];
         Info.Config_Details.map(obj => {
            if (obj.Visibility) {
               ConfigDetails.push(obj._id);
            }
         });
         const Data = {
            ConfigId: Info._id,
            Config_Details: ConfigDetails
         };
         this.Service.Cluster_IdProofUpdate(Data).subscribe(response => {
            this.Uploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Cluster Id-Proof Configuration Successfully Updated' });
               this.onClose.next({ Status: true, Response: response.Response });
               this.modalRef.hide();
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
               this.onClose.next({ Status: false, Message: 'UnExpected Error!' });
               this.modalRef.hide();
            }
         });
      }
   }

}
