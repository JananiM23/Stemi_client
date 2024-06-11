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

export class HospitalSummaryService {
	API_URL: string = environment.apiUrl + 'API/patient_management/';

  constructor(private http: HttpClient) { }

  HospitalSummaryLabReport_Create(data: any): Observable<any> {
    return this.http.post<any>(this.API_URL + 'HospitalSummaryLabReport_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }
  HospitalSummaryLabReport_View(data: any): Observable<any> {
    return this.http.post<any>(this.API_URL + 'HospitalSummaryLabReport_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }
  HospitalSummaryLabReport_Update(data: any): Observable<any> {
    return this.http.post<any>(this.API_URL + 'HospitalSummaryLabReport_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }
  LabReportHistory_CardiacUpdate(data: any): Observable<any> {
   return this.http.post<any>(this.API_URL + 'LabReportHistory_CardiacUpdate', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }
  LabReportHistory_SerumUpdate(data: any): Observable<any> {
   return this.http.post<any>(this.API_URL + 'LabReportHistory_SerumUpdate', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }
  LabReportHistory_Create(data: any): Observable<any> {
   return this.http.post<any>(this.API_URL + 'LabReportHistory_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }


  HospitalSummaryMedicationInHospital_Create(data: any): Observable<any> {
    return this.http.post<any>(this.API_URL + 'HospitalSummaryMedicationInHospital_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }
  HospitalSummaryMedicationInHospital_View(data: any): Observable<any> {
    return this.http.post<any>(this.API_URL + 'HospitalSummaryMedicationInHospital_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }
  HospitalSummaryMedicationInHospital_Update(data: any): Observable<any> {
    return this.http.post<any>(this.API_URL + 'HospitalSummaryMedicationInHospital_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }
  MedicationInHospitalHistory_Update(data: any): Observable<any> {
   return this.http.post<any>(this.API_URL + 'MedicationInHospitalHistory_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }
  MedicationInHospitalHistory_Create(data: any): Observable<any> {
   return this.http.post<any>(this.API_URL + 'MedicationInHospitalHistory_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }


  HospitalSummaryAdverseEvents_Create(data: any): Observable<any> {
    return this.http.post<any>(this.API_URL + 'HospitalSummaryAdverseEvents_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }
  HospitalSummaryAdverseEvents_View(data: any): Observable<any> {
    return this.http.post<any>(this.API_URL + 'HospitalSummaryAdverseEvents_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }
  HospitalSummaryAdverseEvents_Update(data: any): Observable<any> {
    return this.http.post<any>(this.API_URL + 'HospitalSummaryAdverseEvents_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }
  AdverseEventsHistory_Update(data: any): Observable<any> {
   return this.http.post<any>(this.API_URL + 'AdverseEventsHistory_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }
  AdverseEventsHistory_Create(data: any): Observable<any> {
   return this.http.post<any>(this.API_URL + 'AdverseEventsHistory_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
  }

}
