import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class DataPassingService {

   private AllValidationsData = new BehaviorSubject([]);
   AllValidations = this.AllValidationsData.asObservable();

   private AllFieldsData = new BehaviorSubject([]);
   AllFields = this.AllFieldsData.asObservable();

   private AllFieldValuesData = new BehaviorSubject([]);
   AllFieldsValues = this.AllFieldValuesData.asObservable();

   private PatientNameData = new BehaviorSubject('');
   PatientName = this.PatientNameData.asObservable();

   private PatientUniqueData = new BehaviorSubject('');
   PatientUnique = this.PatientUniqueData.asObservable();

   private TransferDeathData = new BehaviorSubject(null);
   TransferDeath = this.TransferDeathData.asObservable();

   private TransferHomeData = new BehaviorSubject(null);
   TransferHome = this.TransferHomeData.asObservable();

   constructor() { }

   UpdateAllValidationsData(Data: any[]) {
      this.AllValidationsData.next(Data);
   }

   UpdateAllFieldsData(Data: any[]) {
      this.AllFieldsData.next(Data);
   }

   UpdateAllFieldValuesData(Data: any[]) {
      this.AllFieldValuesData.next(Data);
   }

   UpdatePatientNameData(Data: any) {
      this.PatientNameData.next(Data);
   }

   UpdatePatientUniqueData(Data: any) {
      this.PatientUniqueData.next(Data);
   }

   UpdateTransferDeathData(Data: any) {
      this.TransferDeathData.next(Data);
   }

   UpdateTransferHomeData(Data: any) {
      this.TransferHomeData.next(Data);
   }

}
