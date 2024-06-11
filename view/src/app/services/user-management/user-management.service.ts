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
export class UserManagementService {
	API_URL: string = environment.apiUrl + 'API/UserManagement/';

	constructor(private http: HttpClient) { }

	StemiUser_AsyncValidate(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'StemiUser_AsyncValidate', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	StemiUser_Create(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'StemiUser_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	StemiUsers_List(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'StemiUsers_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	StemiUsers_Delete(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'StemiUsers_Delete', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	StemiUser_Update(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'StemiUser_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	StemiUserActive_Status(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'StemiUserActive_Status', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}


}
