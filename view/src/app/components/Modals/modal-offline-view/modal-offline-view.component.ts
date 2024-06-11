import { Component, OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { Subject } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';

@Component({
  selector: 'app-modal-offline-view',
  templateUrl: './modal-offline-view.component.html',
  styleUrls: ['./modal-offline-view.component.css']
})
export class ModalOfflineViewComponent implements OnInit {
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
    if (this.Info.Symptoms.Location_of_Pain !== undefined && this.Info.Symptoms.Location_of_Pain !== '') {
      let Arr = this.Info.Symptoms.Location_of_Pain.split(',');
      Arr = Arr.map(obj => {
        obj = obj.replace('_', ' ');
        return obj;
      });
      this.Info.Symptoms.Location_of_Pain = Arr.join(', ');
    }
  }

  getScreenSize(event?: any) {
    this.screenHeight = window.innerHeight - 80;
    this.screenWidth = window.innerWidth - 40;
 }

 EcgView(template: TemplateRef<any>) {

  this.modalReference = this.ModalService.show(template, { class: 'second'} );
}


}
