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
export class ClusterManagementService {
	API_URL: string = environment.apiUrl + 'API/Cluster_Management/';

	constructor(private http: HttpClient) { }

	StemiCluster_Create(data: any): Observable<any> {
	return this.http.post<any>(this.API_URL + 'StemiCluster_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	StemiCluster_View(data: any): Observable<any> {
	return this.http.post<any>(this.API_URL + 'StemiCluster_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	StemiCluster_Update(data: any): Observable<any> {
	return this.http.post<any>(this.API_URL + 'StemiCluster_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	StemiCluster_AsyncValidate(data: any): Observable<any> {
	return this.http.post<any>(this.API_URL + 'StemiCluster_AsyncValidate', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	Clusters_SimpleList(data: any): Observable<any> {
	return this.http.post<any>(this.API_URL + 'Clusters_SimpleList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	ClusterBased_Hospitals(data: any): Observable<any> {
	return this.http.post<any>(this.API_URL + 'ClusterBased_Hospitals', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	ClusterBased_ControlPanelFields(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'ClusterBased_ControlPanelFields', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	ClusterControlPanel_Update(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'ClusterControlPanel_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	ClustersSimpleList_LocationBased(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'ClustersSimpleList_LocationBased', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	ClusterDetails_RequiredForMapping(data: any): Observable<any> {
		return this.http.post<any>(this.API_URL + 'ClusterDetails_RequiredForMapping', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	Add_HospitalTo_Cluster(data: any): Observable<any> {
	return this.http.post<any>(this.API_URL + 'Add_HospitalTo_Cluster', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}

	Remove_HospitalFrom_Cluster(data: any): Observable<any> {
	return this.http.post<any>(this.API_URL + 'Remove_HospitalFrom_Cluster', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
	}


}
