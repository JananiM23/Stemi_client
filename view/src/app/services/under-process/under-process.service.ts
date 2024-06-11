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
export class UnderProcessService {
	API_URL: string = environment.apiUrl + 'API/ControlPanel/';

   constructor(private http: HttpClient) { }


   All_Fields(): Observable<any> {
      return this.http.get<any>(this.API_URL + 'All_Fields', httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   TypeBased_Validations(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'TypeBased_Validations', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   All_Validations(): Observable<any> {
      return this.http.get<any>(this.API_URL + 'All_Validations', httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }


   All_Fields_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'All_Fields_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }


}
