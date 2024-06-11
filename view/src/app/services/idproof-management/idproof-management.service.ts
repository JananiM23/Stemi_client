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
export class IdproofManagementService {
	API_URL: string = environment.apiUrl + 'API/Config_Management/';

   constructor(private http: HttpClient) { }

   IdProofConfig_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL  + 'IdProofConfig_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Cluster_IdProofUpdate(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL  + 'Cluster_IdProofUpdate', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   IdProof_ConfigList(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL  + 'IdProof_ConfigList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   ClusterConfig_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL  + 'ClusterConfig_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   ClusterConfig_DetailedView(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL  + 'ClusterConfig_DetailedView', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   IdProofConfig_Delete(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL  + 'IdProofConfig_Delete', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
}
