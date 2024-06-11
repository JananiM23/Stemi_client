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

export class PatientDetailsService {
	API_URL: string = environment.apiUrl + 'API/patient_management/';
   UserInfo: any;
   ClusterType: any;

   constructor(private http: HttpClient, private LoginService: LoginManagementService) {   }

   PatientBasicDetails_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientBasicDetails_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   AllPatients_List(data: any): Observable<any> {
      const UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
      if (UserInfo.User_Type === 'SA') {
         return this.http.post<any>(this.API_URL + 'AllPatientDetails_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      } else if (UserInfo.User_Type === 'CO') {
            return this.http.post<any>(this.API_URL + 'CoordinatorBasedPatients_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      } else if (UserInfo.User_Type === 'PU') {
         if ( UserInfo.Hospital.If_Cluster_Mapped === true  && UserInfo.Cluster.Cluster_Type === 'multiple' &&  UserInfo.Hospital.Cluster_ConnectionType === 'ClusterHub') {
            return this.http.post<any>(this.API_URL + 'MultipleClusterBased_Patients', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         } else if ( UserInfo.Hospital.If_Cluster_Mapped === true  && UserInfo.Cluster.Cluster_Type === 'single' &&  UserInfo.Hospital.Cluster_ConnectionType === 'ClusterHub') {
            return this.http.post<any>(this.API_URL + 'SingleClusterBased_Patients', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         } else if (UserInfo.Hospital.If_Cluster_Mapped === true  && UserInfo.Cluster.Cluster_Type === 'advanced') {
            return this.http.post<any>(this.API_URL + 'AdvancedClusterBased_Patients', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         } else {
            return this.http.post<any>(this.API_URL + 'HospitalBased_Patients', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         }
      } else {
         return this.http.post<any>(this.API_URL + 'HospitalBased_Patients', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      }
   }

   AllPatients_Count(data: any): Observable<any> {
      const UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
      if (UserInfo.User_Type === 'SA') {
         return this.http.post<any>(this.API_URL + 'AllPatientDetails_Count', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      } else if (UserInfo.User_Type === 'CO') {
            return this.http.post<any>(this.API_URL + 'CoordinatorBasedPatients_Count', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      } else if (UserInfo.User_Type === 'PU') {
         if ( UserInfo.Hospital.If_Cluster_Mapped === true  && UserInfo.Cluster.Cluster_Type === 'multiple' &&  UserInfo.Hospital.Cluster_ConnectionType === 'ClusterHub') {
            return this.http.post<any>(this.API_URL + 'MultipleClusterBasedPatients_Count', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         } else if ( UserInfo.Hospital.If_Cluster_Mapped === true  && UserInfo.Cluster.Cluster_Type === 'single' &&  UserInfo.Hospital.Cluster_ConnectionType === 'ClusterHub') {
            return this.http.post<any>(this.API_URL + 'SingleClusterBasedPatients_Count', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         } else if (UserInfo.Hospital.If_Cluster_Mapped === true  && UserInfo.Cluster.Cluster_Type === 'advanced') {
            return this.http.post<any>(this.API_URL + 'AdvancedClusterBasedPatients_Count', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         } else {
            return this.http.post<any>(this.API_URL + 'HospitalBasedPatients_Count', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         }
      } else {
         return this.http.post<any>(this.API_URL + 'HospitalBasedPatients_Count', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      }
   }



   AllPatients_SimpleList(data: any): Observable<any> {
      const UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
      if (UserInfo.User_Type === 'SA') {
         return this.http.post<any>(this.API_URL + 'AllPatientDetails_SimpleList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      } else if (UserInfo.User_Type === 'CO') {
            return this.http.post<any>(this.API_URL + 'CoordinatorBasedPatients_SimpleList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      } else if (UserInfo.User_Type === 'PU') {
         if ( UserInfo.Hospital.If_Cluster_Mapped === true  && UserInfo.Cluster.Cluster_Type === 'multiple' &&  UserInfo.Hospital.Cluster_ConnectionType === 'ClusterHub') {
            return this.http.post<any>(this.API_URL + 'MultipleClusterBased_PatientsSimpleList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         } else if ( UserInfo.Hospital.If_Cluster_Mapped === true  && UserInfo.Cluster.Cluster_Type === 'single' &&  UserInfo.Hospital.Cluster_ConnectionType === 'ClusterHub') {
            return this.http.post<any>(this.API_URL + 'SingleClusterBased_PatientsSimpleList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         } else if (UserInfo.Hospital.If_Cluster_Mapped === true  && UserInfo.Cluster.Cluster_Type === 'advanced') {
            return this.http.post<any>(this.API_URL + 'AdvancedClusterBased_PatientsSimpleList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         } else {
            return this.http.post<any>(this.API_URL + 'HospitalBased_PatientsSimpleList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
         }
      } else {
         return this.http.post<any>(this.API_URL + 'HospitalBased_PatientsSimpleList', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
      }
   }
   PatientData_Export(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientData_Export', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientBasicDetails_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientBasicDetails_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientBasicDetails_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientBasicDetails_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientDidNotArrive_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientDidNotArrive_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   ECG_Files(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'ECG_Files', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   Update_Ninety_Min_ECG(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Update_Ninety_Min_ECG', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   Update_FollowUp_ECG(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Update_FollowUp_ECG', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   AdmissionType(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'AdmissionType', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   PatientFibrinolyticChecklist_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientFibrinolyticChecklist_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientFibrinolyticChecklist_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientFibrinolyticChecklist_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientFibrinolyticChecklist_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientFibrinolyticChecklist_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   PatientMedicationDuringTransportation_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientMedicationDuringTransportation_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientMedicationDuringTransportation_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientMedicationDuringTransportation_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientMedicationDuringTransportation_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientMedicationDuringTransportation_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   PatientCardiacHistory_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientCardiacHistory_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientCardiacHistory_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientCardiacHistory_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientCardiacHistory_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientCardiacHistory_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   PatientCoMorbidCondition_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientCoMorbidCondition_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientCoMorbidCondition_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientCoMorbidCondition_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientCoMorbidCondition_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientCoMorbidCondition_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   PatientContactDetails_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientContactDetails_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientContactDetails_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientContactDetails_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientContactDetails_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientContactDetails_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   AllNotification_List(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Notifications_List', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   Notifications_Viewed(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Notifications_Viewed', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   Notification_Counts(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Notification_Counts', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }

   Viewed_Notifications_Delete(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Viewed_Notifications_Delete', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }





   PatientNonCluster_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientNonCluster_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientBasicHospital_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientBasicHospital_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientBasicTransport_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientBasicTransport_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientClinical_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientClinical_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientCheckList_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientCheckList_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PatientChecklist_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PatientChecklist_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }


	LoadBasicPage_Files(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'LoadBasicPage_Files', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
}
