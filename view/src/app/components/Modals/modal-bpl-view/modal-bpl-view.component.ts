import { Component, OnInit, ElementRef, ViewChild, TemplateRef } from '@angular/core';
import { Subject } from 'rxjs';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-modal-bpl-view',
  templateUrl: './modal-bpl-view.component.html',
  styleUrls: ['./modal-bpl-view.component.css']
})
export class ModalBplViewComponent implements OnInit {

   @ViewChild('fileInput') fileInput: ElementRef;


   onClose: Subject<any>;
   Info: any;
   ECGPreview: any;
   ECGPreviewAvailable: false;
   DynamicFGroup: FormGroup;
   ShowECGPreview = false;
   modalReference: BsModalRef;

   screenHeight: any;
   screenWidth: any;

   constructor(public modalRef: BsModalRef, public ModalService: BsModalService) { }

   ngOnInit() {
      this.onClose = new Subject();
      this.getScreenSize();
   }

   getScreenSize(event?: any) {
      this.screenHeight = window.innerHeight - 80;
      this.screenWidth = window.innerWidth - 40;
   }

   EcgView(template: TemplateRef<any>) {
      this.modalReference = this.ModalService.show(template, { class: 'second'} );
   }

}
