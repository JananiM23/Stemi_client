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
export class LocationService {
	API_URL: string = environment.apiUrl + 'API/Location/';

   constructor(private http: HttpClient) { }

   StemiLocation_AsyncValidate(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'StemiLocation_AsyncValidate', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   StemiLocation_Create(data: any): Observable<any> {
     return this.http.post<any>(this.API_URL + 'StemiLocation_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   StemiLocations_List(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'StemiLocations_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   StemiLocations_SimpleList(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'StemiLocations_SimpleList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   StemiLocation_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'StemiLocation_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

}
