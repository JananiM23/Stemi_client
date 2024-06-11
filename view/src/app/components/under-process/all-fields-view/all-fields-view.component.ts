import { Component, OnInit } from '@angular/core';

import { UnderProcessService } from './../../../services/under-process/under-process.service';

@Component({
   selector: 'app-all-fields-view',
   templateUrl: './all-fields-view.component.html',
   styleUrls: ['./all-fields-view.component.css']
})
export class AllFieldsViewComponent implements OnInit {

   AllFields: any[] = [];

   constructor( private UnderProcess: UnderProcessService) {

      this.UnderProcess.All_Fields().subscribe(response => {
         if (response.Status) {
            this.AllFields = response.Response;
         }
      });
   }

   ngOnInit() {
   }

}
