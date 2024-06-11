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
export class HospitalManagementService {
	API_URL: string = environment.apiUrl + 'API/Hospital_Management/';

   constructor(private http: HttpClient, private LoginService: LoginManagementService) { }

   Create_Hospital(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Create_Hospital', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Hospitals_List(data: any): Observable<any> {
      const UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
      if (UserInfo.User_Type === 'CO') {
         const ClusterIds = UserInfo.ClustersArray.map(obj => obj._id);
         data.Clusters = ClusterIds;
         return this.http.post<any>(this.API_URL + 'Hospitals_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      } else {
         return this.http.post<any>(this.API_URL + 'Hospitals_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      }
   }

   Hospitals_All_List(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Hospitals_All_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Update_Hospital(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Update_Hospital', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Hospital_view(data: any): Observable<any> {
   return this.http.post<any>(this.API_URL + 'Hospital_view', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Hospital_Approve(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Hospital_Approve', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Hospital_Reject(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Hospital_Reject', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Hospital_Block(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Hospital_Block', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Hospital_UnBlock(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Hospital_UnBlock', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Hospital_Delete(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Hospital_Delete', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   HubHospitals_SimpleList(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'HubHospitals_SimpleList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Location_HubHospitals(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Location_HubHospitals', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   ClusterEdit_HubHospitals(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'ClusterEdit_HubHospitals', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Location_HubHospitals_AlsoMapped(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Location_HubHospitals_AlsoMapped', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Hospital_SimpleList(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Hospital_SimpleList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }


}
