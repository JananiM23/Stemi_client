import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';


@Component({
  selector: 'app-modal-filter',
  templateUrl: './modal-filter.component.html',
  styleUrls: ['./modal-filter.component.css']
})
export class ModalFilterComponent implements OnInit {

  constructor(public ModalRef: BsModalRef) { }

  ngOnInit() {
  }

}
