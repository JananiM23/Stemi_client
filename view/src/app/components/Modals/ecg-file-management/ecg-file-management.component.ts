import { Component, OnInit, ElementRef, ViewChild, TemplateRef} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { PatientDetailsService } from '../../../services/patient-management/patient-details/patient-details.service';
import { LoginManagementService } from '../../../services/login-management/login-management.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-ecg-file-management',
  templateUrl: './ecg-file-management.component.html',
  styleUrls: ['./ecg-file-management.component.css']
})
export class EcgFileManagementComponent implements OnInit {

   private subscription: Subscription = new Subscription();
   @ViewChild('fileInput') fileInput: ElementRef;
  
   Uploading = false;
   ECGPreviewAvailable = false;
   ECGPreview: any;

   ShowListECGPreview = false;
   ListECGPreview: any;

   screenHeight: any;
   screenWidth: any;

   RoutesArray = null;
   UrlParams: any;
   UserInfo: any;

   ECGFiles: any[] = [];

   FormUploading = false;
   ContentLoading = true;

   PageType = 'Edit';

   constructor(public bsModalRef: BsModalRef,
               public bsModalRefOne: BsModalRef,
               public bsModalRefTwo: BsModalRef,
               private modalService: BsModalService,
               public PatientService: PatientDetailsService,
               private LoginService: LoginManagementService,
               public _DomSanitizationService: DomSanitizer
            ) {
            this.UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
         }

   ngOnInit() {
      const Data = {User: this.UserInfo._id, PatientId: this.UrlParams.Patient };
      this.PatientService.ECG_Files(Data).subscribe(response => {
         this.ContentLoading = false;
         if (response.Status) {
            this.ECGFiles = response.Response;
         }
      })
      this.getScreenSize();
   }

   OpenUploadModel(template: TemplateRef<any>) {
		const ImageOrPdf = this.ECGPreview.includes('data:application/pdf;base64,') ? 'Pdf' : 'Image';
		if (ImageOrPdf === 'Image') {
			this.bsModalRefTwo = this.modalService.show(template, { class: 'second' });
		} else if (ImageOrPdf === 'Pdf') {
			const byteString = window.atob(this.ECGPreview.replace('data:application/pdf;base64,', ''));
			const arrayBuffer = new ArrayBuffer(byteString.length);
			const int8Array = new Uint8Array(arrayBuffer);
			for (let i = 0; i < byteString.length; i++) {
				int8Array[i] = byteString.charCodeAt(i);
			}
			const blob = new Blob([int8Array], { type: 'application/pdf' });
			var fileURL = URL.createObjectURL(blob);
			window.open(fileURL);
		}
   }

   OpenListModel(template: TemplateRef<any>, index: any) {
		const ImageOrPdf = this.ECGFiles[index].ECG_File.includes('data:application/pdf;base64,') ? 'Pdf' : 'Image';
		if (ImageOrPdf === 'Image') {
			this.ListECGPreview = this._DomSanitizationService.bypassSecurityTrustUrl(this.ECGFiles[index].ECG_File);
			this.bsModalRefTwo = this.modalService.show(template, { class: 'second' });
		} else if (ImageOrPdf === 'Pdf') {
			const byteString = window.atob(this.ECGFiles[index].ECG_File.replace('data:application/pdf;base64,', ''));
			const arrayBuffer = new ArrayBuffer(byteString.length);
			const int8Array = new Uint8Array(arrayBuffer);
			for (let i = 0; i < byteString.length; i++) {
				int8Array[i] = byteString.charCodeAt(i);
			}
			const blob = new Blob([int8Array], { type: 'application/pdf' });
			var fileURL = URL.createObjectURL(blob);
			window.open(fileURL);
		}
   }

   getScreenSize(event?: any) {
      this.screenHeight = window.innerHeight - 80;
      this.screenWidth = window.innerWidth - 40;
   }

   onFileChange(event) {
      if (event.target.files && event.target.files.length > 0) {
         const reader = new FileReader();
         reader.readAsDataURL(event.target.files[0]);
         reader.onload = (events) => {
            this.ECGPreview = events.target['result'];
            this.ECGPreviewAvailable = true;
         };
      } else {
         this.fileInput.nativeElement.value = null;
         this.ECGPreviewAvailable = false;
         this.ECGPreview = null;
      }
   }

   Update_ECG() {
      if (this.ECGPreviewAvailable && this.UserInfo._id && this.UserInfo._id !== null && this.UrlParams.Patient && this.UrlParams.Patient !== null && this.UrlParams.Patient !== '' && !this.FormUploading) {
         this.FormUploading = true;
         const Data = { User: this.UserInfo._id, Patient: this.UrlParams.Patient, ECG_File: this.ECGPreview };
         this.PatientService.Update_FollowUp_ECG(Data).subscribe(response => {
            this.FormUploading = false;
            if (response.Status) {
               this.ECGFiles = response.Response;
               this.fileInput.nativeElement.value = null;
               this.ECGPreviewAvailable = false;
               this.ECGPreview = null;
            }
         })
      }
   }

}
