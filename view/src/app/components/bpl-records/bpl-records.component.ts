import { Component, ElementRef, ViewChild, Renderer, TemplateRef, OnInit } from '@angular/core';
import { BsModalRef, BsModalService} from 'ngx-bootstrap';
import { FormGroup, FormControl } from '@angular/forms';

import { Observable } from 'rxjs';
import {map, startWith} from 'rxjs/operators';

import { HospitalManagementService } from 'src/app/services/hospital-management/hospital-management.service';
import { LoginManagementService } from 'src/app/services/login-management/login-management.service';
import { BplPatientsManagementService } from 'src/app/services/bpl-management/bpl-patients-management.service';
import { ToastrService } from 'src/app/services/common-services/toastr.service';
import { ClusterManagementService } from 'src/app/services/cluster-management/cluster-management.service';
import { LocationService } from 'src/app/services/location-management/location.service';

import { ModalBplViewComponent } from './../Modals/modal-bpl-view/modal-bpl-view.component';
import { ModalBplUpdateComponent } from './../Modals/modal-bpl-update/modal-bpl-update.component';


export interface Locations { _id: string; Location_Name: string; }
export interface Clusters  { _id: string;  Cluster_Name: string; }
export interface Hospitals  { _id: string; Hospital_Name: string; }

@Component({
  selector: 'app-bpl-records',
  templateUrl: './bpl-records.component.html',
  styleUrls: ['./bpl-records.component.css']
})
export class BplRecordsComponent implements OnInit {

   PageLoader = true;
   UserInfo: any;

   @ViewChild('TableHeaderSection') TableHeaderSection: ElementRef;
   @ViewChild('TableBodySection') TableBodySection: ElementRef;
   @ViewChild('TableLoaderSection') TableLoaderSection: ElementRef;

   modalReference: BsModalRef;
   PatientDetails: any[] = [];
   AllClusterName: any[] = [];

   filteredHospitalsList: Observable<Hospitals[]>;
   HospitalList: Hospitals[] = [];
   LastSelectedHospital = null;

   ClustersList: Clusters[] = [];
   LastSelectedClusters = null;

   LimitCount = 5;
   TotalRows = 0;
   CurrentIndex = 1;
   SkipCount = 0;
   SerialNoAddOn = 0;
   GoToPage = null;
   PagesArray = [];
   PagePrevious: object = { Disabled: true, value : 0, Class: 'PageAction_Disabled'};
   PageNext: object = { Disabled: true, value : 0, Class: 'PageAction_Disabled'};
   ShowingText = 'Showing <span>0</span> to <span>0</span> out of <span>0</span> entries';

   FilterFGroup: FormGroup;

   PatientStatus: any[] = [   {Name: 'Stemi Ask Cardiologist', Key: 'Stemi_Ask_Cardiologist'},
                              {Name: 'Stemi Confirmed', Key: 'Stemi_Confirmed'},
                              {Name: 'Follow Up', Key: 'FollowUp'},
                              {Name: 'Pending', Key: 'Pending'}];


   FiltersArray: any[] = [ {Active: false, Key: 'Patient_Name', Value: '', DisplayName: 'Patient Name ', DBName: 'Patient_Name', Type: 'String', Option: '' },
                           {Active: false, Key: 'HospitalName', Value: '', DisplayName: 'Hospital Name', DBName: 'Hospital', Type: 'Object', Option: '' },
                           {Active: false, Key: 'FromDate', Value: null, DisplayName: 'From Date', DBName: 'ECG_Taken_date_time', Type: 'Date', Option: 'GTE' },
                           {Active: false, Key: 'ToDate', Value: null, DisplayName: 'To Date', DBName: 'ECG_Taken_date_time', Type: 'Date', Option: 'LTE' },
                           {Active: false, Key: 'Patient_Status', Value: '', DisplayName: 'Patient Status ', DBName: 'Patient_Status', Type: 'String', Option: '' }];
   FilterFGroupStatus = false;

   THeaders: any[] = [  { Key: 'Patient_Id', ShortKey: 'Patient_Id', Name: 'Patient ID', If_Short: false, Condition: '' },
                        { Key: 'Patient_Name', ShortKey: 'PatientNameSort', Name: 'Patient Name', If_Short: false, Condition: '' },
                        { Key: 'Patient_Age', ShortKey: 'Patient_Age', Name: 'Patient Age', If_Short: false, Condition: '' },
                        { Key: 'Patient_Gender', ShortKey: 'Patient_Gender', Name: 'Patient Gender', If_Short: false, Condition: '' },
                        { Key: 'Hospital', ShortKey: 'HospitalSort', Name: 'Spoke / Hub Hospital', If_Short: false, Condition: '' },
                        { Key: 'ECG_Taken_date_time', ShortKey: 'ECG_Taken_date_time', Name: 'ECG Taken  Date / Time', If_Short: false, Condition: '' },
                        { Key: 'Patient_Status', ShortKey: 'PatientStatusSort', Name: 'Patient Status', If_Short: false, Condition: '' }];
   LoadCompleteList = false;

   constructor(
      public ModalService: BsModalService,
      public Service: BplPatientsManagementService,
      private renderer: Renderer,
      public Toastr: ToastrService,
      public LocService: LocationService,
      public HospitalService: HospitalManagementService,
      private LoginService: LoginManagementService,
      public ClusterService: ClusterManagementService
   ) {
      this.UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
      this.Service_Loader();
   }

   ngOnInit() {
      this.FilterFGroup = new FormGroup({
         Patient_Name: new FormControl(''),
         HospitalName: new FormControl(null),
         FromDate: new FormControl(null),
         ToDate: new FormControl(null),
         Patient_Status: new FormControl(''),
      });

      const FilterControls = this.FilterFGroup.controls;
      Object.keys(FilterControls).map(obj => {
         this.FilterFGroup.controls[obj].valueChanges.subscribe(value => {
            this.FilterFormChanges();
         });
      });

      this.HospitalService.Hospital_SimpleList('').subscribe( Newresponse => {
         this.HospitalList = Newresponse.Response;
      });

      this.filteredHospitalsList = this.FilterFGroup.controls.HospitalName.valueChanges.pipe(
         startWith(''), map(value => {
           if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                 if (this.LastSelectedHospital === null || this.LastSelectedHospital !== value._id) {
                     this.LastSelectedHospital = value._id;
                 }
                 value = value.Hospital_Name;
               }
               return this.HospitalList.filter(option => option.Hospital_Name.toLowerCase().includes(value.toLowerCase()));
           } else {
               this.LastSelectedHospital = null;
               return this.HospitalList;
           }
         })
      );
   }

   NotAllow(): boolean {return false; }
   ClearInput(event: KeyboardEvent): boolean {
      const Events = event.composedPath() as EventTarget[];
      const Input = Events[0] as HTMLInputElement;
      const FControl = Input.attributes as NamedNodeMap;
      const FControlName = FControl.getNamedItem('formcontrolname').textContent;
      this.FilterFGroup.controls[FControlName].setValue(null);
      return false;
   }

   HospitalDisplayName(Hospital: any) {
      return (Hospital && Hospital !== null && Hospital !== '') ? Hospital.Hospital_Name : null;
   }

   AutocompleteBlur(key: any) {
      setTimeout(() => {
         const value =  this.FilterFGroup.controls[key].value;
         if (!value || value === null || value === '' || typeof value !== 'object') {
            this.FilterFGroup.controls[key].setValue(null);
         }
      }, 500);
   }

   FilterFormChanges() {
      const FilteredValues = this.FilterFGroup.value;
      this.FilterFGroupStatus = false;
      Object.keys(FilteredValues).map(obj => {
         const value = this.FilterFGroup.controls[obj].value;
         if (value !== undefined && value !== null && value !== '') {
            if ((FilteredValues === 'Location' || FilteredValues === 'HospitalName' || FilteredValues === 'ClusterName')) {
               if ( typeof value === 'object') {
                  this.FilterFGroupStatus = true;
               }
            } else {
               this.FilterFGroupStatus = true;
            }
         }
      });
   }

   SubmitFilters() {
      const FilteredValues = this.FilterFGroup.value;
      this.FiltersArray.map(obj => {
         obj.Active = false;
         obj.Value = obj.Type !== 'Number' ? '' : null;
      });
      Object.keys(FilteredValues).map(obj => {
         const value = this.FilterFGroup.controls[obj].value;
         if (value !== undefined && value !== null && value !== '') {
            const index = this.FiltersArray.findIndex(objNew => objNew.Key === obj);
            this.FiltersArray[index].Active = true;
            this.FiltersArray[index].Value = value;
         }
      });
      this.Pagination_Action(1);
      this.modalReference.hide();
   }

   ResetFilters() {
      this.FiltersArray.map(obj => {
         obj.Active = false;
         obj.Value = obj.Type !== 'Number' ? '' : null;
         this.FilterFGroup.controls[obj.Key].setValue(obj.Value);
      });
      this.Pagination_Action(1);
   }

   RemoveFilter(index: any) {
      const KeyName = this.FiltersArray[index].Key;
      const EmptyValue = this.FiltersArray[index].Type !== 'Number' ? '' : null;
      this.FilterFGroup.controls[KeyName].setValue(EmptyValue);
      this.SubmitFilters();
   }

   ToggleRecords(change: boolean) {
      if (this.LoadCompleteList !== change) {
         this.LoadCompleteList = change;
         this.ResetFilters();
      }
   }
   getKeyBasedValue(key: any) {
      if (key !== '') {
         const idx = this.PatientStatus.findIndex(obj => obj.Key === key);
         if (idx >= 0 ) {
            return this.PatientStatus[idx].Name;
         } else {
            return key;
         }
      } else {
         return key;
      }
   }

   Service_Loader() {
      let ShortOrderKey = '';
      let ShortOrderCondition = '';
      this.THeaders.map(obj => {
         if (obj.If_Short === true) { ShortOrderKey = obj.ShortKey; ShortOrderCondition = obj.Condition;  }
      });
      const Filters = this.FiltersArray.filter(obj => obj.Active === true);
      const Data = { Skip_Count: this.SkipCount,
                     User: this.UserInfo._id,
                     User_Type: this.UserInfo.User_Type,
                     Limit_Count: this.LimitCount,
                     FilterQuery: Filters,
                     ShortKey: ShortOrderKey,
                     ShortCondition: ShortOrderCondition,
                     Cluster: this.UserInfo.Cluster,
                     Hospital: this.UserInfo.Hospital,
                     ClustersArray: this.UserInfo.ClustersArray, };
      this.TableLoader();
      if (this.LoadCompleteList === true && this.UserInfo.User_Type === 'SA') {
         this.Service.All_BPLPatients_CompleteList(Data).subscribe(response => {
            this.PageLoader = false;
            this.SerialNoAddOn = this.SkipCount;
            if (response.Status && response.Status === true ) {
               this.PatientDetails = response.Response;
               setTimeout(() => {
                  this.renderer.setElementStyle(this.TableLoaderSection.nativeElement, 'display', 'none');
               }, 10);
               this.TotalRows = response.SubResponse;
               this.Pagination_Affect();
            } else if (!response.Status && response.ErrorCode === 400 || response.ErrorCode === 401 || response.ErrorCode === 417) {
               if (response.ErrorMessage === undefined || response.ErrorMessage === '' || response.ErrorMessage === null) {
                  response.ErrorMessage = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.ErrorMessage });
            } else {
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Patient List Getting Error!, But not Identify!' });
            }
         });
      } else {
         this.Service.All_BPLPatients_List(Data).subscribe(response => {
            this.PageLoader = false;
            this.SerialNoAddOn = this.SkipCount;
            if (response.Status && response.Status === true ) {
               this.PatientDetails = response.Response;
               setTimeout(() => {
                  this.renderer.setElementStyle(this.TableLoaderSection.nativeElement, 'display', 'none');
               }, 10);
               this.TotalRows = response.SubResponse;
               this.Pagination_Affect();
            } else if (!response.Status && response.ErrorCode === 400 || response.ErrorCode === 401 || response.ErrorCode === 417) {
               if (response.ErrorMessage === undefined || response.ErrorMessage === '' || response.ErrorMessage === null) {
                  response.ErrorMessage = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.ErrorMessage });
            } else {
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Patient List Getting Error!, But not Identify!' });
            }
         });
      }
   }

   TableLoader() {
      setTimeout(() => {
         const Top = this.TableHeaderSection.nativeElement.offsetHeight - 2;
         const Height = this.TableBodySection.nativeElement.offsetHeight + 4;
         this.renderer.setElementStyle(this.TableLoaderSection.nativeElement, 'display', 'flex');
         this.renderer.setElementStyle(this.TableLoaderSection.nativeElement, 'height', Height + 'px');
         this.renderer.setElementStyle(this.TableLoaderSection.nativeElement, 'line-height', Height + 'px');
         this.renderer.setElementStyle(this.TableLoaderSection.nativeElement, 'top', Top + 'px');
      }, 10);
   }

   Pagination_Affect() {
      const NoOfArrays = Math.ceil(this.TotalRows / this.LimitCount);
      const PrevClass = (this.CurrentIndex > 1 ? '' : 'PageAction_Disabled');
      this.PagePrevious = { Disabled: !(this.CurrentIndex > 1), Value : (this.CurrentIndex - 1), Class: PrevClass};
      const NextClass = (this.CurrentIndex < NoOfArrays ? '' : 'PageAction_Disabled');
      this.PageNext = { Disabled: !(this.CurrentIndex < NoOfArrays), Value : (this.CurrentIndex + 1), Class: NextClass};
      this.PagesArray = [];
      for (let index = 1; index <= NoOfArrays ; index++) {
         if (index === 1) {
            this.PagesArray.push({Text: '1', Class: 'Number', Value: 1, Show: true, Active: (this.CurrentIndex === index ) });
         }
         if (index > 1 && NoOfArrays > 2 && index < NoOfArrays ) {
            if (index === (this.CurrentIndex - 2)) {
               this.PagesArray.push({Text: '...', Class: 'Dots', Show: true, Active: false });
            }
            if (index === (this.CurrentIndex - 1) ) {
               this.PagesArray.push({Text: (this.CurrentIndex - 1).toString(), Class: 'Number',  Value: index, Show: true, Active: false });
            }
            if (index === this.CurrentIndex) {
               this.PagesArray.push({Text: this.CurrentIndex.toString(), Class: 'Number', Value: index, Show: true, Active: true });
            }
            if (index === (this.CurrentIndex + 1) ) {
               this.PagesArray.push({Text: (this.CurrentIndex + 1).toString(), Class: 'Number', Value: index, Show: true, Active: false });
            }
            if (index === (this.CurrentIndex + 2)) {
               this.PagesArray.push({Text: '...', Class: 'Dots', Show: true, Active: false });
            }
         }
         if (index === NoOfArrays && NoOfArrays > 1) {
            this.PagesArray.push({Text: NoOfArrays.toString(), Class: 'Number', Value: NoOfArrays, Show: true, Active: (this.CurrentIndex === index ) });
         }
      }
      let ToCount = this.SkipCount + this.LimitCount;
      if (ToCount > this.TotalRows) { ToCount = this.TotalRows; }
      this.ShowingText = 'Showing <span>' + (this.SkipCount + 1) + '</span> to <span>' + ToCount + '</span> out of <span>' + this.TotalRows + '</span>  entries';
   }

   Pagination_Action(index: any) {
      const NoOfArrays = Math.ceil(this.TotalRows / this.LimitCount);
      if ((index >= 1 && NoOfArrays >= index) || NoOfArrays === 0) {
         this.CurrentIndex = index;
         this.SkipCount = this.LimitCount * (this.CurrentIndex - 1);
         this.Service_Loader();
      }
   }

   Short_Change(index: any) {
      if (this.THeaders[index].If_Short !== undefined && !this.THeaders[index].If_Short) {
         this.THeaders = this.THeaders.map(obj => { obj.If_Short = false; obj.Condition = ''; return obj; });
         this.THeaders[index].If_Short = true;
         this.THeaders[index].Condition = 'Ascending';
         this.Pagination_Action(1);
      } else if (this.THeaders[index].If_Short !== undefined && this.THeaders[index].If_Short && this.THeaders[index].Condition === 'Ascending') {
         this.THeaders[index].If_Short = true;
         this.THeaders[index].Condition = 'Descending';
         this.Pagination_Action(1);
      } else if (this.THeaders[index].If_Short !== undefined && this.THeaders[index].If_Short && this.THeaders[index].Condition === 'Descending') {
         this.THeaders[index].If_Short = true;
         this.THeaders[index].Condition = 'Ascending';
         this.Pagination_Action(1);
      } else {
         this.THeaders = this.THeaders.map(obj => { obj.If_Short = false; obj.Condition = ''; return obj; });
         this.Pagination_Action(1);
      }
   }

   openFilterModal(template: TemplateRef<any>) {
      this.FiltersArray.map(obj => {
         this.FilterFGroup.controls[obj.Key].setValue(obj.Value);
      });
      this.modalReference = this.ModalService.show(template, {ignoreBackdropClick: true, class: 'modal-lg modal-dialog-centered animated bounceInRight'} );
   }

   ViewPatient(index: any) {
      const initialState = {
         Info: this.PatientDetails[index]
      };
      this.modalReference = this.ModalService.show(ModalBplViewComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-lg modal-dialog-centered animated bounceInRight' }));
      this.modalReference.content.onClose.subscribe(response => {
         if (response.Status) {
            this.PatientDetails[index] = response.Response;
         }
      });
   }

   UpdatePatient(index: any) {
      const initialState = {
         Data: this.PatientDetails[index],
         UserInfo: this.UserInfo
      };
      this.modalReference = this.ModalService.show(ModalBplUpdateComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-md modal-dialog-centered animated bounceInRight' }));
      this.modalReference.content.onClose.subscribe(response => {
         if (response.Status) {
            this.Pagination_Action(1);
         }
      });
   }

}
