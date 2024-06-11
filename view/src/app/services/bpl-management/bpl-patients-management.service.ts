import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LoginManagementService } from '../login-management/login-management.service';
import { environment } from '../../../environments/environment';

const httpOptions = {
   headers: new HttpHeaders({  'Content-Type':  'application/json' })
 };

@Injectable({
  providedIn: 'root'
})
export class BplPatientsManagementService {
	API_URL: string = environment.apiUrl + 'API/BPLPatient_Management/';
   UserInfo: any;
   ClusterType: any;

   constructor(private http: HttpClient, private LoginService: LoginManagementService) { }

   All_BPLPatients_List(data: any): Observable<any> {
      const UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
      if (UserInfo.User_Type === 'SA') {
         return this.http.post<any>(this.API_URL + 'All_BPLPatients_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      } else if (UserInfo.User_Type === 'CO') {
         return this.http.post<any>(this.API_URL + 'Coordinator_BPLPatients_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      } else if (UserInfo.User_Type === 'PU') {
         if ( UserInfo.Hospital.If_Cluster_Mapped === true  && UserInfo.Cluster.Cluster_Type === 'multiple' &&  UserInfo.Hospital.Cluster_ConnectionType === 'ClusterHub') {
            return this.http.post<any>(this.API_URL + 'MultipleCluster_BPLPatients_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         } else if ( UserInfo.Hospital.If_Cluster_Mapped === true  && UserInfo.Cluster.Cluster_Type === 'single' &&  UserInfo.Hospital.Cluster_ConnectionType === 'ClusterHub') {
            return this.http.post<any>(this.API_URL + 'SingleCluster_BPLPatients_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         } else if (UserInfo.Hospital.If_Cluster_Mapped === true  && UserInfo.Cluster.Cluster_Type === 'advanced') {
            return this.http.post<any>(this.API_URL + 'AdvancedCluster_BPLPatients_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         } else {
            return this.http.post<any>(this.API_URL + 'HospitalBased_BPLPatients_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         }
      } else {
         return this.http.post<any>(this.API_URL + 'HospitalBased_BPLPatients_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      }
   }

   All_BPLPatients_CompleteList(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'All_BPLPatients_CompleteList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   BPLPatient_AskCardiologist(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'BPLPatient_AskCardiologist', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   BPLPatient_StemiConfirm(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'BPLPatient_StemiConfirm', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
    }

    Update_BPLFollowUp_ECG(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Update_BPLFollowUp_ECG', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
    }

}
