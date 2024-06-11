
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
   providedIn: 'root'
})
export class MyInterceptor implements HttpInterceptor {

   AuthorizeKey = '';
   encryptedBody = '';

   constructor() {
   }

   intercept( request: HttpRequest<any>, next: HttpHandler ): Observable<HttpEvent<any>> {
		let AuthorizeKey = '';
		let encryptedBody = request.body;
      if (localStorage.getItem('Session') && localStorage.getItem('SessionKey')) {
         let UserData = CryptoJS.AES.decrypt(localStorage.getItem('Session'), localStorage.getItem('SessionKey').slice(3, 10)).toString(CryptoJS.enc.Utf8);
         UserData = JSON.parse(UserData);
         UserData.Token = localStorage.getItem('SessionKey');
         AuthorizeKey = CryptoJS.SHA512(JSON.stringify(UserData)).toString(CryptoJS.enc.Hex);
         localStorage.setItem('SessionVerify', btoa(Date()));
      }
      if (request.method === 'POST' && environment.production) {
         const data = JSON.stringify(request.body);
         encryptedBody = {info: CryptoJS.AES.encrypt(data, environment['encriptionKey']).toString() };
      }
      const updatedRequest = request.clone({
         body: encryptedBody,
         headers: request.headers.set('Authorization', AuthorizeKey)
      });

      return next.handle(updatedRequest).pipe( tap((event: HttpEvent<any>) => {
         if (event instanceof HttpResponse) {
            if (event.body.Response && environment.production) {
               const data = CryptoJS.AES.decrypt(event.body.Response, environment['decryptionKey']).toString(CryptoJS.enc.Utf8);
               event.body.Response = JSON.parse(data);
            }
            return event;
         }
       }, (err: any) => {
         if (err instanceof HttpErrorResponse) {
            return err;
         }
       }));
   }

}
