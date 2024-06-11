import { Component, OnInit, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService} from 'ngx-bootstrap';
import { ActivatedRoute } from '@angular/router';

import { HospitalManagementService } from '../../../../services/hospital-management/hospital-management.service';
import { ModalApprovedComponent } from '../../../Modals/modal-approved/modal-approved.component';
import { ToastrService } from '../../../../services/common-services/toastr.service';

@Component({
  selector: 'app-hospital-view',
  templateUrl: './hospital-view.component.html',
  styleUrls: ['./hospital-view.component.css']
})
export class HospitalViewComponent implements OnInit {

   @ViewChild('AgmMap') AgmMap: any;

   latitude = 0;
   longitude = 0;
   zoom = 14;

   HospitalDetails: any;
   id: string;

   modalReference: BsModalRef;
   HospitalListData: any[] = [];

   constructor(public hospitalListview: HospitalManagementService,
               private route: ActivatedRoute,
               public ModalService: BsModalService,
               public Toastr: ToastrService) {

      this.id = this.route.snapshot.paramMap.get('id');

      this.hospitalListview.Hospital_view({ _id: this.id }).subscribe(response => {
         this.HospitalDetails = response.Response;
         this.latitude = response.Response.Latitude !== '' ? response.Response.Latitude : this.latitude ;
         this.longitude = response.Response.Longitude !== '' ? response.Response.Longitude : this.longitude ;
         this.zoom = 14;
      });

      }

   ngOnInit() {
   }

   checkArray(KeyName: string) {
      if (this.HospitalDetails[KeyName] !== undefined && typeof this.HospitalDetails[KeyName] === 'object') {
         return true;
      } else {
         return false;
      }
   }

   HospitalApprove(HospitalID: any) {
      const initialState = {
         Icon : 'verified_user',
         ColorCode : 'success',
         TextOne : 'You Want to',
         TextTwo : 'Approve',
         TextThree : 'this Hospital ?',
      };
      this.modalReference = this.ModalService.show(ModalApprovedComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight modal-small-with'} ));
      this.modalReference.content.onClose.subscribe(response => {
         if (response.Status) {
            const HospitalId = HospitalID;
            this.hospitalListview.Hospital_Approve({_id: HospitalId}).subscribe(responseNew => {
               this.HospitalDetails.Hospital_Status = 'Approved';
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Status Changed Successfully!' });
            });
         }
      });
   }

   HospitalReject(HospitalID: any) {
      const initialState = {
         Icon : 'block',
         ColorCode : 'danger',
         TextOne : 'You Want to',
         TextTwo : 'Reject',
         TextThree : 'this Hospital ?',
      };
      this.modalReference = this.ModalService.show(ModalApprovedComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight modal-small-with'} ));
      this.modalReference.content.onClose.subscribe(response => {
         if (response.Status) {
            const HospitalId = HospitalID;
            this.hospitalListview.Hospital_Reject({_id: HospitalId}).subscribe(responseNew => {
               this.HospitalDetails.Hospital_Status = 'Rejected';
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Status Changed Successfully!' });
            });
         }
      });
   }


}
