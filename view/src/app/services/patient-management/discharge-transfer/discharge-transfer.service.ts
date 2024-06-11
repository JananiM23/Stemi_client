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
export class DischargeTransferService {
	API_URL: string = environment.apiUrl + 'API/patient_management/';

	constructor(private http: HttpClient) { }

   DischargeTransferDeath_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'DischargeTransferDeath_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   DischargeTransferDeath_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'DischargeTransferDeath_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   DischargeTransferDeath_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'DischargeTransferDeath_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }


   DischargeTransferMedication_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'DischargeTransferMedication_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   DischargeTransferMedication_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'DischargeTransferMedication_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   DischargeTransferMedication_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'DischargeTransferMedication_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   TransferHistoryMedication_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'TransferHistoryMedication_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   TransferHistoryMedication_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'TransferHistoryMedication_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }



   DischargeTransferDischarge_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'DischargeTransferDischarge_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   DischargeTransferDischarge_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'DischargeTransferDischarge_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   DischargeTransferDischarge_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'DischargeTransferDischarge_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   DischargeHistory_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'DischargeHistory_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }



   DischargeHospitals_ClusterBased(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'DischargeHospitals_ClusterBased', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   DischargeAmbulance_LocationBased(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'DischargeAmbulance_LocationBased', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   DischargeOther_Clusters(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'DischargeOther_Clusters', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

}
