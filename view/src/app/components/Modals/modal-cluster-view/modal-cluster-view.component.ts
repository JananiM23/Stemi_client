import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';

@Component({
  selector: 'app-modal-cluster-view',
  templateUrl: './modal-cluster-view.component.html',
  styleUrls: ['./modal-cluster-view.component.css']
})
export class ModalClusterViewComponent implements OnInit {

  Info: any;

  constructor(public modalRef: BsModalRef) { }

  ngOnInit() {
  }

}
