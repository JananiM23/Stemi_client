import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from '../../services/common-services/toastr.service';
import * as CryptoJS from 'crypto-js';
import { LoginManagementService } from './../../services/login-management/login-management.service';


@Component({
   selector: 'app-login',
   templateUrl: './login.component.html',
   styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

   LoginForm: FormGroup;
   submitted = false;

   User = 'stemiSA';
   Pass = '123456';

   messageText: string;
   messages: Array<any>;

   constructor(private router: Router,
               public Toastr: ToastrService,
               public LoginService: LoginManagementService ) {
   }

   ngOnInit() {
      this.LoginForm = new FormGroup({
         User_Name: new FormControl('', Validators.required),
         User_Password: new FormControl('', Validators.required),
      });
   }


   Login() {
      if (this.LoginForm.valid) {
         this.LoginService.StemiUser_Login(this.LoginForm.getRawValue()).subscribe(response => {
            if (response.Status) {
               const UserData  = CryptoJS.AES.decrypt(response.Response, response.Key.slice(3, 10)).toString(CryptoJS.enc.Utf8);
               localStorage.setItem('Session', response.Response);
               localStorage.setItem('SessionKey', response.Key);
               localStorage.setItem('SessionVerify', btoa(Date()));
               if (UserData.User_Type === 'PU') {
                  this.router.navigate(['/Patient-Manage/Patient-Details']);
               } else {
                  this.router.navigate(['/Patient-Records']);
               }
               this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Login Successfully!' });
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
            }
         });
      } else {
         this.LoginForm.controls.User_Name.markAsTouched();
         this.LoginForm.controls.User_Name.markAsDirty();
         this.LoginForm.controls.User_Password.markAsTouched();
         this.LoginForm.controls.User_Password.markAsDirty();
      }
   }


}
