import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

import { Observable } from 'rxjs';

import { ToastrService } from '../services/common-services/toastr.service';
import { LoginManagementService } from './../services/login-management/login-management.service';

@Injectable({
  providedIn: 'root'
})
export class AutologinGuard implements CanActivate {

   constructor( private router: Router, private LoginService: LoginManagementService, public Toastr: ToastrService) { }

   canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      localStorage.clear();
      const Data = route.params;
      if (Data.User !== undefined && Data.Token !== undefined && Data.DeviceId !== undefined) {
         return new Promise(resolve => {
            this.LoginService.StemiUser_AutoLogin(Data).subscribe(response => {
               if (response.Status) {
                  localStorage.setItem('Session', response.Response);
                  localStorage.setItem('SessionKey', response.Key);
                  localStorage.setItem('SessionVerify', btoa(Date()));
                  this.router.navigate(['/Patient-Records']);
                  resolve(true);
               } else {
                  resolve(false);
                  this.router.navigate(['/Login']);
                  this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
               }
            });
         });
      } else {
         this.router.navigate(['/Login']);
         this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Invalid URL!' });
         return false;
      }
   }

}
