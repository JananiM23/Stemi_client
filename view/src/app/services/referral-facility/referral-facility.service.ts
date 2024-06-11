import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const httpOptions = {
  headers: new HttpHeaders({  'Content-Type':  'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class ReferralFacilityService {
	API_URL: string = environment.apiUrl + 'API/ReferralFacility/';

   constructor(private http: HttpClient) { }

   ReferralFacility_AsyncValidate(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'ReferralFacility_AsyncValidate', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   ReferralFacility_Create(data: any): Observable<any> {
     return this.http.post<any>(this.API_URL + 'ReferralFacility_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   ReferralFacilities_List(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'ReferralFacilities_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   ReferralFacilities_SimpleList(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'ReferralFacilities_SimpleList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   ReferralFacility_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'ReferralFacility_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
}
