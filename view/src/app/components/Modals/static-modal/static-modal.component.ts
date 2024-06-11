import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';

@Component({
  selector: 'app-static-modal',
  templateUrl: './static-modal.component.html',
  styleUrls: ['./static-modal.component.css']
})
export class StaticModalComponent implements OnInit {

  constructor(public ModalRef: BsModalRef) { }

  ngOnInit() {
  }

}
