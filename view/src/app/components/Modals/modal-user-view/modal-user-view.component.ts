import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-modal-user-view',
  templateUrl: './modal-user-view.component.html',
  styleUrls: ['./modal-user-view.component.css']
})
export class ModalUserViewComponent implements OnInit {

  onClose: Subject<any>;
  Info: any;

  constructor(public modalRef: BsModalRef) { }

  ngOnInit() {
    this.onClose = new Subject();
  }

}
