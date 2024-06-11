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
export class FollowupService {
	API_URL: string = environment.apiUrl + 'API/patient_management/';

	constructor(private http: HttpClient) { }

	FollowUpDetails_Create(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpDetails_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	FollowUpDetails_View(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpDetails_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	FollowUpDetails_Update(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpDetails_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	FollowUpHistory_Update(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpHistory_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	// FollowUp Delete 
	FollowUpHistory_Delete(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpHistory_Delete', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}


	FollowUpMedication_Create(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpMedication_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	FollowUpMedication_View(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpMedication_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	FollowUpMedication_Update(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpMedication_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	FollowUpMedicationHistory_Update(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpMedicationHistory_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	FollowUpMedicationHistory_Create(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpMedicationHistory_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	// MedicationHistory Delete 
	MedicationHistory_Delete(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpMedicationHistory_Delete', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	FollowUpEvents_Create(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpEvents_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	FollowUpEvents_View(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpEvents_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	FollowUpEvents_Update(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpEvents_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	FollowUpEventsHistory_Update(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpEventsHistory_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	FollowUpEventsHistory_Create(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpEventsHistory_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}
	// FollowUpEvents Delete
	FollowUpEventsDelete(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'FollowUpEventHistory_Delete', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

}
