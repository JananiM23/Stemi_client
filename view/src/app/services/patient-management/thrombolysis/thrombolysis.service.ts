import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';


const httpOptions = {
   headers: new HttpHeaders({  'Content-Type':  'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class ThrombolysisService {
	API_URL: string = environment.apiUrl + 'API/patient_management/';

   constructor(private http: HttpClient) { }

   ThrombolysisMedication_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'ThrombolysisMedication_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   ThrombolysisMedication_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'ThrombolysisMedication_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   ThrombolysisMedication_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'ThrombolysisMedication_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }


   Thrombolysis_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Thrombolysis_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   Thrombolysis_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Thrombolysis_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   Thrombolysis_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Thrombolysis_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

}
