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
export class PciService {
	API_URL: string = environment.apiUrl + 'API/patient_management/';

   constructor(private http: HttpClient) { }

   PciDrugBeforePci_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PciDrugBeforePci_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PciDrugBeforePci_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PciDrugBeforePci_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PciDrugBeforePci_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PciDrugBeforePci_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }





   Pci_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Pci_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   Pci_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Pci_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   Pci_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'Pci_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }





   PciMedicationInCath_Create(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PciMedicationInCath_Create', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PciMedicationInCath_View(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PciMedicationInCath_View', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }
   PciMedicationInCath_Update(data: any): Observable<any> {
      return this.http.post<any>(this.API_URL + 'PciMedicationInCath_Update', data, httpOptions).pipe( map(res => res), catchError(err => of(err)) );
   }


}
