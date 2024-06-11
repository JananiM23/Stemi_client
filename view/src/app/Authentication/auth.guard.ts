import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { BsModalRef, BsModalService} from 'ngx-bootstrap';
import { Observable } from 'rxjs';

import { LoginManagementService } from './../services/login-management/login-management.service';
import { ModalSessionExpiredComponent } from '../components/Modals/modal-session-expired/modal-session-expired.component';

@Injectable({
   providedIn: 'root'
})
export class AuthGuard implements CanActivate  {

   modalReference: BsModalRef;

   constructor( private router: Router, private LoginService: LoginManagementService, public ModalService: BsModalService) {

   }

   canActivate(): Observable<boolean> | Promise<boolean> | boolean {
      if (this.LoginService.If_LoggedIn() === 'Valid') {
         return true;
      } else if (this.LoginService.If_LoggedIn() === 'Expired') {
         return new Promise(resolve => {
            const initialState = {};
            this.modalReference = this.ModalService.show(ModalSessionExpiredComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight'} ));
            this.modalReference.content.onClose.subscribe(response => {
               if (response.Status) {
                  resolve(true);
               } else {
                  localStorage.clear();
                  this.router.navigate(['/Login']);
                  resolve(false);
               }
            });
         });
      } else {
         localStorage.clear();
         this.router.navigate(['/Login']);
         return false;
      }
   }

}
