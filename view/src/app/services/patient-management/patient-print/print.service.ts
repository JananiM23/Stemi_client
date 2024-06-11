import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LoginManagementService } from '../../login-management/login-management.service';
import { environment } from '../../../../environments/environment';


const httpOptions = {
  headers: new HttpHeaders({  'Content-Type':  'application/json' })
};
@Injectable({
  providedIn: 'root'
})
export class PrintService {
	API_URL: string = environment.apiUrl + 'API/patient_management/';
	UserInfo: any;
	ClusterType: any;

	constructor(private http: HttpClient, private LoginService: LoginManagementService) {
	}

	Patient_PrintDetails(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'PatientPrintDetails', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	PatientFibrinolyticChecklist_View(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'PatientFibrinolyticChecklist_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	PatientMedicationDuringTransportation_View(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'PatientMedicationDuringTransportation_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	PatientCardiacHistory_View(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'PatientCardiacHistory_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	PatientCoMorbidCondition_View(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'PatientCoMorbidCondition_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	PatientContactDetails_View(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'PatientContactDetails_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}


}
