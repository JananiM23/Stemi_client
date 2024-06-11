import { Component, OnInit, TemplateRef } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { FormGroup, Validators, FormControl } from '@angular/forms';

import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { BplPatientsManagementService } from './../../../services/bpl-management/bpl-patients-management.service';
import { PatientDetailsService } from './../../../services/patient-management/patient-details/patient-details.service';
import { ToastrService } from './../../../services/common-services/toastr.service';
import { startWith, map } from 'rxjs/operators';

export interface Patients { _id: string; Patient_Unique: string; Patient_Name: string; Patient_Age: string; Patient_Gender: string; Hospital_Id: string; Hospital_Name: string; }

@Component({
  selector: 'app-modal-bpl-update',
  templateUrl: './modal-bpl-update.component.html',
  styleUrls: ['./modal-bpl-update.component.css']
})
export class ModalBplUpdateComponent implements OnInit {

   onClose: Subject<any>;

   Data: any;
   UserInfo: any;

   Uploading = false;
   Form: FormGroup;
   BPLType = '';
   ChestDiscomfort: any[] = [ {Name: 'Pain', Key: 'Pain'},
                              {Name: 'Pressure', Key: 'Pressure'},
                              {Name: 'Ache', Key: 'Ache'} ];

   LocationOfPain: any[] = [  {Name: 'Back', Key: 'Back'},
                              {Name: 'R Arm', Key: 'R_Arm'},
                              {Name: 'L Arm', Key: 'L_Arm'},
                              {Name: 'Jaw', Key: 'Jaw'},
                              {Name: 'Retrosternal', Key: 'Retrosternal'} ];
   Smoker: any[] = [ {Name: 'Non Smoker', Key: 'Non_Smoker'},
                     {Name: 'Current Smoker', Key: 'Current_Smoker'},
                     {Name: 'Past Smoker', Key: 'Past_Smoker'},
                     {Name: 'Unknown', Key: 'Unknown'},
                     {Name: 'Passive', Key: 'Passive'} ];

   ECGPreview: any;
   ECGPreviewAvailable: false;
   ShowECGPreview = false;
   modalReference: BsModalRef;

   screenHeight: any;
   screenWidth: any;

   PatientSelected = false;
   SelectedPatient: any;

   searchForm: FormGroup;
   filteredPatientsList: Observable<Patients[]>;
   PatientsList: Patients[] = [];
   LastSelectedPatient = null;

   constructor(public bsModalRef: BsModalRef,
               public Service: BplPatientsManagementService,
               public ModalService: BsModalService,
               public PatientService: PatientDetailsService,
               private Toastr: ToastrService) { }

   ngOnInit() {
      this.onClose = new Subject();
      this.Form = new FormGroup({
         User: new FormControl(this.Data.User, Validators.required),
         BplId: new FormControl(this.Data._id, Validators.required),
         Diabetes: new FormControl(''),
         Hypertension: new FormControl(''),
         Smoker: new FormControl(''),
         High_Cholesterol: new FormControl(''),
         Previous_History_of_IHD: new FormControl(''),
         Family_History_of_IHD: new FormControl(''),
         Chest_Discomfort: new FormControl(''),
         Location_of_Pain: new FormControl(''),
      });
      this.searchForm = new FormGroup({
         User: new FormControl(this.Data.User, Validators.required),
         BplId: new FormControl(this.Data._id, Validators.required),
         searchKey: new FormControl(''),
      });
      this.getScreenSize();

      const searchData = { User: this.UserInfo._id, User_Type: this.UserInfo.User_Type, Cluster: this.UserInfo.Cluster, Hospital: this.UserInfo.Hospital, ClustersArray: this.UserInfo.ClustersArray };
      this.PatientService.AllPatients_SimpleList(searchData).subscribe( response => {
         this.PatientsList = response.Response;
      });

      this.filteredPatientsList = this.searchForm.controls.searchKey.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                  if (this.LastSelectedPatient === null || this.LastSelectedPatient !== value._id) {
                        this.LastSelectedPatient = value._id;
                  }
                  this.PatientSelected = true;
                  this.SelectedPatient = value;
                  value = value.Patient_Name;
               } else {
                  this.PatientSelected = false;
                  this.SelectedPatient = undefined;
               }
               return this.PatientsList.filter(option => option.Patient_Name.toLowerCase().includes(value.toLowerCase()) || option.Patient_Unique.includes(value));
            } else {
               this.LastSelectedPatient = null;
               return this.PatientsList;
            }
         })
      );

   }

   PatientDisplayName(patient: any) {
      return (patient && patient !== null && patient !== '') ? patient.Patient_Name + ' - ' + patient.Patient_Unique : null;
   }

   AutocompleteBlur(key: any) {
      setTimeout(() => {
         const value =  this.searchForm.controls[key].value;
         if (!value || value === null || value === '' || typeof value !== 'object') {
            this.searchForm.controls[key].setValue(null);
         }
      }, 500);
   }

   BPLTypeUpdate(value: any) {
      this.BPLType = value;
      this.bsModalRef.setClass('modal-lg modal-dialog-centered animated bounceInRight');
   }

   getScreenSize(event?: any) {
      this.screenHeight = window.innerHeight - 80;
      this.screenWidth = window.innerWidth - 40;
   }

   EcgView(template: TemplateRef<any>) {
      this.modalReference = this.ModalService.show(template, { class: 'second'} );
   }

   FollowUpUpdate() {
      if (this.searchForm.valid && !this.Uploading && this.PatientSelected) {
         const ReqData = {
            User: this.searchForm.get('User').value,
            BplId: this.searchForm.get('BplId').value,
            Patient: this.SelectedPatient._id
         };
         this.Uploading = true;
         this.Service.Update_BPLFollowUp_ECG(ReqData).subscribe( response => {
            this.Uploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'The Patient Follow-Up Successfully Updated' } );
               this.onClose.next({Status: true});
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

   StemiConfirm() {
      if (this.Form.valid && !this.Uploading) {
         this.Uploading = true;
         const Data = this.Form.value;
         this.Service.BPLPatient_StemiConfirm(Data).subscribe( response => {
            this.Uploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'The Patient Stemi Confirmed Successfully Updated' } );
               this.onClose.next({Status: true});
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


   AskCardiologist() {
      if (this.Form.valid && !this.Uploading) {
         this.Uploading = true;
         const Data = this.Form.value;
         this.Service.BPLPatient_AskCardiologist(Data).subscribe( response => {
            this.Uploading = false;
            if (response.Status) {
               this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'The Patient Ask Cardiologist Successfully Updated' } );
               this.onClose.next({Status: true});
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
