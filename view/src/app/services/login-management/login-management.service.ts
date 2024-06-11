import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';


const httpOptions = {
  headers: new HttpHeaders({  'Content-Type':  'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class LoginManagementService {
	API_URL: string = environment.apiUrl + 'API/LoginManagement/';

   constructor(private http: HttpClient, private router: Router) { }

   StemiUser_Login(data: any): Observable<any> {
     return this.http.post<any>(this.API_URL + 'StemiUser_Login', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   StemiUser_AutoLogin(data: any): Observable<any> {
     return this.http.post<any>(this.API_URL + 'StemiUser_AutoLogin', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   If_LoggedIn() {
      if (localStorage.getItem('Session') && localStorage.getItem('SessionKey') && localStorage.getItem('SessionVerify') ) {
         const LastSession = new Date(atob(localStorage.getItem('SessionVerify'))).getTime();
         const NowSession = new Date().getTime();
         const SessionDiff: number = NowSession - LastSession;
         const SessionDiffHours: number = SessionDiff / 1000 / 60 / 60 ;
         if (SessionDiffHours < 2 ) {
            return 'Valid';
         } else {
            return 'Expired';
         }
      } else {
         localStorage.clear();
         return 'Invalid';
      }
   }

   LoginUser_Info() {
      if (localStorage.getItem('Session') && localStorage.getItem('SessionKey') && localStorage.getItem('SessionVerify') ) {
         console.log(`session`, CryptoJS.AES.decrypt(localStorage.getItem('Session'), localStorage.getItem('SessionKey').slice(3, 10)).toString(CryptoJS.enc.Utf8))
         return CryptoJS.AES.decrypt(localStorage.getItem('Session'), localStorage.getItem('SessionKey').slice(3, 10)).toString(CryptoJS.enc.Utf8);
      } else {
         localStorage.clear();
         this.router.navigate(['/Login']);
      }
   }

}
