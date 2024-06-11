import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { BsModalRef, BsModalService} from 'ngx-bootstrap';
import { Observable } from 'rxjs';

import { LoginManagementService } from './../services/login-management/login-management.service';
import { ModalSessionExpiredComponent } from '../components/Modals/modal-session-expired/modal-session-expired.component';


@Injectable({
  providedIn: 'root'
})
export class NotAuthGuard implements CanActivate {

   modalReference: BsModalRef;

   constructor( private router: Router, private LoginService: LoginManagementService, public ModalService: BsModalService) {

   }

   canActivate(): Observable<boolean> | Promise<boolean> | boolean {
      if (this.LoginService.If_LoggedIn() === 'Invalid') {
         return true;
      } else if (this.LoginService.If_LoggedIn() === 'Expired') {
         return new Promise(resolve => {
            const initialState = {};
            this.modalReference = this.ModalService.show(ModalSessionExpiredComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight'} ));
            this.modalReference.content.onClose.subscribe(response => {
               if (response.Status) {
                  const UserInfo = this.LoginService.LoginUser_Info();
                  if (UserInfo.User_Type === 'PU') {
                     this.router.navigate(['/Patient-Manage/Patient-Details']);
                  } else {
                     this.router.navigate(['/Patient-Records']);
                  }
                  resolve(false);
               } else {
                  resolve(true);
               }
            });
         });
      } else {
         const UserInfo = this.LoginService.LoginUser_Info();
         if (UserInfo.User_Type === 'PU') {
            this.router.navigate(['/Patient-Manage/Patient-Details']);
         } else {
            this.router.navigate(['/Patient-Records']);
         }
         return false;
      }
   }

}
