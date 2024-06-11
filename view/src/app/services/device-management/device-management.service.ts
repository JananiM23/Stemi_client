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
export class DeviceManagementService {
	API_URL: string = environment.apiUrl + 'API/DeviceManagement/';

   constructor(private http: HttpClient) { }

   Device_AsyncValidate(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Device_AsyncValidate', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Device_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Device_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Devices_List(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Devices_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Device_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Device_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Device_Delete(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Device_Delete', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

}
