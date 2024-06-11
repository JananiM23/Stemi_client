import { Component, ElementRef, ViewChild, Renderer, TemplateRef, OnInit } from '@angular/core';
import { BsModalRef, BsModalService} from 'ngx-bootstrap';
import { FormGroup, FormControl } from '@angular/forms';
import * as XLSX from 'xlsx';
import { DatePipe } from '@angular/common';

import { Observable } from 'rxjs';
import {map, startWith} from 'rxjs/operators';

import { ToastrService } from '../../../../services/common-services/toastr.service';
import { PatientDetailsService } from '../../../../services/patient-management/patient-details/patient-details.service';
import { HospitalManagementService } from '../../../../services/hospital-management/hospital-management.service';
import { LocationService } from '../../../../services/location-management/location.service';
import { LoginManagementService } from '../../../../services/login-management/login-management.service';
import { ModalApprovedComponent } from '../../../Modals/modal-approved/modal-approved.component';
import { DateAdapter, NativeDateAdapter } from '@angular/material/core';

export class MyDateAdapter extends NativeDateAdapter {
   format(date: Date, displayFormat: any): string {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate();
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
   }
}
export interface Hospitals { _id: string; Hospital_Name: string; }
export interface Locations { _id: string; Location_Name: string; }

@Component({
  selector: 'app-patients-table',
  templateUrl: './patients-table.component.html',
  styleUrls: ['./patients-table.component.css'],
  providers: [{provide: DateAdapter, useClass: MyDateAdapter}]
})
export class PatientsTableComponent implements OnInit {
   PageLoader = true;
   UserInfo: any;

   @ViewChild('TableHeaderSection') TableHeaderSection: ElementRef;
   @ViewChild('TableBodySection') TableBodySection: ElementRef;
   @ViewChild('TableLoaderSection') TableLoaderSection: ElementRef;

   // Pagination Keys
   CurrentIndex = 1;
   SkipCount = 0;
   SerialNoAddOn = 0;
   LimitCount = 5;
   ShowingText = 'Showing <span>0</span> to <span>0</span> out of <span>0</span> entries';
   PagesArray = [];
   TotalRows = 0;
   LastCreation: Date = new Date();
   PagePrevious: object = { Disabled: true, value : 0, Class: 'PageAction_Disabled'};
   PageNext: object = { Disabled: true, value : 0, Class: 'PageAction_Disabled'};
   SubLoader = false;
   GoToPage = null;

   filteredHospitalsList: Observable<Hospitals[]>;
   HospitalList: Hospitals[] = [];
   LastSelectedHospital = null;

   filteredLocationsList: Observable<Locations[]>;
   LocationsList: Locations[] = [];
   LastSelectedLocation = null;



   modalReference: BsModalRef;
   PatientDetails: any[] = [];

   FilterFGroup: FormGroup;
   ReportFGroup: FormGroup;
   ReportFGroupStatus = false;
   ExportInProgress = false;

   FiltersArray: any[] = [ {Active: false, Key: 'PatientName', Value: '', DisplayName: 'Patient Name', DBName: 'Patient_Name', Type: 'String', Option: '' },
                           {Active: false, Key: 'PatientCode', Value: '', DisplayName: 'Patient Code', DBName: 'Patient_Unique', Type: 'String', Option: '' },
                           {Active: false, Key: 'StemiStatus', Value: null, DisplayName: 'Stemi Status', DBName: 'Stemi_Confirmed', Type: 'String', Option: '' },
                           {Active: false, Key: 'Hospital', Value: null, DisplayName: 'Spoke / Hub Hospital', DBName: 'Initiated_Hospital', Type: 'Object', Option: '' },
                           {Active: false, Key: 'FromDate', Value: null, DisplayName: 'Hospital Arrival From', DBName: 'Initiated_Hospital_Arrival', Type: 'Date', Option: 'GTE' },
                           {Active: false, Key: 'ToDate', Value: null, DisplayName: 'Hospital Arrival To', DBName: 'Initiated_Hospital_Arrival', Type: 'Date', Option: 'LTE' },
                           {Active: false, Key: 'PatientStatus', Value: null, DisplayName: 'Patient Status', DBName: 'PatientStatus', Type: 'Select', Option: '' }];
   FilterFGroupStatus = false;
   THeaders: any[] = [ { Key: 'Patient_Name', ShortKey: 'PatientNameSort', Name: 'Patient Name', If_Short: false, Condition: '' },
                        { Key: 'Patient_Code', ShortKey: 'Patient_Unique', Name: 'Patient Code', If_Short: false, Condition: '' },
                        { Key: 'Stemi_Confirmed', ShortKey: 'Stemi_Confirmed', Name: 'Stemi Status', If_Short: false, Condition: '' },
                        { Key: 'Hospital', ShortKey: 'HospitalSort', Name: 'Spoke / Hub Hospital', If_Short: false, Condition: '' },
                        { Key: 'Hospital_Arrival_Date_Time', ShortKey: 'Initiated_Hospital_Arrival', Name: 'Hospital Arrival Date / Time', If_Short: false, Condition: '' }];

   RecordCounts = { UnAttended: 0, InTransfer : 0, Pending: 0, Closed: 0};

   IfSALogin = false;

  constructor( public Toastr: ToastrService,
               public ModalService: BsModalService,
               public PatientService: PatientDetailsService,
               private renderer: Renderer,
               public HospitalService: HospitalManagementService,
               private LoginService: LoginManagementService,
               private locationService: LocationService
            ) {
               this.UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
               if (this.UserInfo.User_Type === 'SA') {
                  this.IfSALogin = true;
               }
               this.Service_Loader();
               this.LoadPatientCount();
            }

  ngOnInit() {

      this.FilterFGroup = new FormGroup({
         PatientName: new FormControl(''),
         PatientCode: new FormControl(''),
         StemiStatus: new FormControl(''),
         Hospital: new FormControl(null),
         FromDate: new FormControl(null),
         ToDate: new FormControl(null),
         PatientStatus: new FormControl('')
      });

      this.ReportFGroup = new FormGroup({
         Location: new FormControl(null),
         FromDate: new FormControl(null),
         ToDate: new FormControl(null),
      });

      this.HospitalService.Hospital_SimpleList('').subscribe( NewResponse => {
         this.HospitalList = NewResponse.Response;
      });
      this.locationService.StemiLocations_SimpleList('').subscribe( NewResponse => {
         this.LocationsList = NewResponse.Response;
      });

      const FilterControls = this.FilterFGroup.controls;
      Object.keys(FilterControls).map(obj => {
         this.FilterFGroup.controls[obj].valueChanges.subscribe(value => {
            this.FilterFormChanges();
         });
      });

      this.filteredHospitalsList = this.FilterFGroup.controls.Hospital.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
               if (this.LastSelectedHospital === null || this.LastSelectedHospital !== value._id) {
                     this.LastSelectedHospital = value._id;
               }
               value = value.Hospital_Name;
               }
               return this.HospitalList.filter(option => option.Hospital_Name.toLowerCase().includes(value.toLowerCase()));
            }  else {
               this.LastSelectedHospital = null;
               return this.HospitalList;
            }
         })
      );

      this.filteredLocationsList = this.ReportFGroup.controls.Location.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
               if (this.LastSelectedLocation === null || this.LastSelectedLocation !== value._id) {
                     this.LastSelectedLocation = value._id;
               }
               value = value.Location_Name;
               }
               return this.LocationsList.filter(option => option.Location_Name.toLowerCase().includes(value.toLowerCase()));
            }  else {
               this.LastSelectedLocation = null;
               return this.LocationsList;
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
   LocationDisplayName(Location: any) {
      return (Location && Location !== null && Location !== '') ? Location.Location_Name : null;
   }

   LoadPatientCount() {
      const Data = {
         Cluster: this.UserInfo.Cluster,
         Hospital: this.UserInfo.Hospital,
         ClustersArray: this.UserInfo.ClustersArray,
         User: this.UserInfo._id,
         User_Type: this.UserInfo.User_Type
      };
      this.PatientService.AllPatients_Count(Data).subscribe(response => {
         if (response.Status && response.Status === true ) {
            this.RecordCounts = response.Response;
         } else if (!response.Status && response.ErrorCode === 400 || response.ErrorCode === 401 || response.ErrorCode === 417) {
            if (response.ErrorMessage === undefined || response.ErrorMessage === '' || response.ErrorMessage === null) {
               response.ErrorMessage = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.ErrorMessage });
         } else {
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Cluster Records Getting Error!, But not Identify!' });
         }
      });
   }

   Service_Loader() {
      let ShortOrderKey = '';
      let ShortOrderCondition = '';
      this.THeaders.map(obj => {
         if (obj.If_Short === true) { ShortOrderKey = obj.ShortKey; ShortOrderCondition = obj.Condition;  }
      });
      const Filters = this.FiltersArray.filter(obj => obj.Active === true);
      const Data = { Skip_Count: this.SkipCount,
                     Limit_Count: this.LimitCount,
                     FilterQuery: Filters,
                     ShortKey: ShortOrderKey,
                     ShortCondition: ShortOrderCondition,
                     Cluster: this.UserInfo.Cluster,
                     Hospital: this.UserInfo.Hospital,
                     ClustersArray: this.UserInfo.ClustersArray,
                     User: this.UserInfo._id,
                     User_Type: this.UserInfo.User_Type
                  };
      this.TableLoader();
      this.PatientService.AllPatients_List(Data).subscribe(response => {
         this.PageLoader = false;
         this.SerialNoAddOn = this.SkipCount;
         if (response.Status && response.Status === true ) {
            this.PatientDetails = response.Response;
            this.PatientDetails = this.PatientDetails.map(obj => {
               obj.Hi_Color = 'hi-white';
               if (this.UserInfo.User_Type === 'PU') {
                  let DisHistoryIds = [];
                  const Dis = obj.Discharge_Details as [];
                  const HosHistory = obj.Hospital_History as [];
                  if (Dis.length > 0 && !obj.DidNotArrive) {
                     DisHistoryIds.push(obj.Initiated_Hospital._id);
                     Dis.map(obj1 => { DisHistoryIds.push(obj1['Hospital']); });
                     DisHistoryIds = DisHistoryIds.filter(obj1 => obj1 !== '');
                     DisHistoryIds = DisHistoryIds.filter((obj1, index) => DisHistoryIds.indexOf(obj1) === index);
                     const LastDis = Dis[Dis.length - 1];
                     if (obj.Initiated_Hospital._id === this.UserInfo.Hospital._id && Dis.length === HosHistory.length && LastDis['Transfer_to_Stemi_Cluster_Hospital_Name'] !== '' && LastDis['Transfer_to_Stemi_Cluster_Hospital_Name'] !== null) {
                        obj.Hi_Color = 'hi-green';
                     } else if (obj.Initiated_Hospital._id !== this.UserInfo.Hospital._id && this.UserInfo.Hospital._id === LastDis['Transfer_to_Stemi_Cluster_Hospital_Name'] && Dis.length === HosHistory.length && LastDis['Transfer_to_Stemi_Cluster_Hospital_Name'] !== '' && LastDis['Transfer_to_Stemi_Cluster_Hospital_Name'] !== null) {
                        obj.Hi_Color = 'hi-red';
                     } else if ( !DisHistoryIds.includes(this.UserInfo.Hospital._id) && Dis.length === HosHistory.length && LastDis['Transfer_to_Stemi_Cluster_Hospital_Name'] !== '' && LastDis['Transfer_to_Stemi_Cluster_Hospital_Name'] !== null) {
                        obj.Hi_Color = 'hi-yellow';
                     }
                  }
               }
               return obj;
            });
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
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Cluster Records Getting Error!, But not Identify!' });
         }
      });
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

   FilterFormChanges() {
      const FilteredValues = this.FilterFGroup.value;
      this.FilterFGroupStatus = false;
      Object.keys(FilteredValues).map(obj => {
         const value = this.FilterFGroup.controls[obj].value;
         if (value !== undefined && value !== null && value !== '') {
            this.FilterFGroupStatus = true;
         }
      });
   }

   SubmitFilters() {
      const FilteredValues = this.FilterFGroup.value;
      this.FiltersArray.map(obj => {
         obj.Active = false;
         obj.Value = obj.Type === 'String' ? '' : null;
         obj.Value = obj.Type === 'Object' ? '' : null;
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
         obj.Value = obj.Type === 'String' ? '' : null;
         this.FilterFGroup.controls[obj.Key].setValue(obj.Value);
      });
      this.FilterFGroupStatus = false;
      this.Pagination_Action(1);
      // this.modalReference.hide();
   }

   RemoveFilter(index: any) {
      const KeyName = this.FiltersArray[index].Key;
      const EmptyValue = this.FiltersArray[index].Type === 'String' ? '' : null;
      this.FilterFGroup.controls[KeyName].setValue(EmptyValue);
      this.SubmitFilters();
   }

   openFilterModal(template: TemplateRef<any>) {
      this.FiltersArray.map(obj => {
         this.FilterFGroup.controls[obj.Key].setValue(obj.Value);
      });
      this.modalReference = this.ModalService.show(template, {ignoreBackdropClick: true, class: 'modal-lg modal-dialog-centered animated bounceInRight'} );
   }

   colorHighlight(index: any) {
      const patient = this.PatientDetails[index];
   }

   AddFilter(value: any) {
      this.FilterFGroup.controls.PatientStatus.setValue(value);
      this.SubmitFilters();
   }

   CheckAndEnableDidNotArrive(idx: any) {
      const Info = this.PatientDetails[idx];
      if (Info.Hi_Color === 'hi-red' && Info.TransferInfo !== undefined && Info.TransferInfo !== null) {
         let TransferDataTime = Info.TransferInfo.Discharge_Transfer_from_Hospital_Date_Time;
         if ( TransferDataTime !== undefined && TransferDataTime !== '') {
            const dateDuration = new Date(new Date().setDate(new Date().getDate() - 30));
            TransferDataTime = new Date(TransferDataTime);
            if (!isNaN(TransferDataTime.valueOf()) && dateDuration.valueOf() > TransferDataTime.valueOf()) {
               return true;
            } else {
               return false;
            }
         } else {
            return false;
         }
      } else {
         return false;
      }
   }

   PatientDidNotArrive(idx: any) {
      const initialState = {
         Icon : 'block',
         ColorCode : 'danger',
         TextOne : 'This Patient',
         TextTwo : 'Did Not Arrive',
         TextThree : 'in Your Hospital?',
      };
      this.modalReference = this.ModalService.show(ModalApprovedComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight modal-small-with'} ));
      this.modalReference.content.onClose.subscribe(Res => {
         if (Res.Status) {
            const Data = { Patient: this.PatientDetails[idx]._id};
            this.PatientService.PatientDidNotArrive_Update(Data).subscribe(response => {
               if (response.Status) {
                  this.Toastr.NewToastrMessage({ Type: 'Success', Message: 'Patient Did Not Arrive Successfully Updated!' });
                  this.Service_Loader();
                  this.LoadPatientCount();
               } else {
                  if (response.Message === undefined || response.Message === '' || response.Message === null) {
                     response.Message = 'Some Error Occoured!, But not Identified.';
                  }
                  this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.Message });
               }
            });
         }
      });
   }

   openExportModal(template: TemplateRef<any>) {
      this.ReportFGroup.reset();
      this.modalReference = this.ModalService.show(template, {ignoreBackdropClick: true, class: 'modal-md modal-dialog-centered animated bounceInRight'} );
   }


   SubmitExport() {
      if (!this.ExportInProgress) {
         this.ExportInProgress = true;
         const Data = this.ReportFGroup.value;
         this.PatientService.PatientData_Export(Data).subscribe(response => {
            this.ExportInProgress = false;
            if (response.Status) {
               const PatientData = response.Response.Data;
               const Header = response.Response.Header;
               let Today = new DatePipe('en-US').transform(new Date(), 'd-MMM-y');
               let WorkSheetName = 'ALL Locations';
               let WorkbookName = 'STEMI_Data_Export_' + Today;
               if (Data.FromDate !== null && Data.ToDate !== null) {
                  Today = new DatePipe('en-US').transform(new Date(Data.FromDate), 'd-MMM-y') + '_To_' + new DatePipe('en-US').transform(new Date(Data.ToDate), 'd-MMM-y');
               } else if (Data.FromDate !== null || Data.ToDate !== null) {
                  Today = Data.FromDate !== null ? 'From_' + new DatePipe('en-US').transform(new Date(Data.FromDate), 'd-MMM-y') : 'To_' + new DatePipe('en-US').transform(new Date(Data.ToDate), 'd-MMM-y');
               }
               if (Data.Location !== null) {
                  WorkSheetName = Data.Location.Location_Name;
                  WorkbookName = 'STEMI_' + Data.Location.Location_Name + '_Data_Export_' + Today;
               }
               const workbook = XLSX.utils.book_new();
               const worksheet = XLSX.utils.aoa_to_sheet([Header]);
               XLSX.utils.sheet_add_json(worksheet, PatientData, {origin: 'A2', skipHeader: true });
               XLSX.utils.book_append_sheet(workbook, worksheet, WorkSheetName);
               XLSX.writeFile(workbook, (WorkbookName + '.csv'));

               this.Toastr.NewToastrMessage( { Type: 'Success', Message: 'Patient Data Successfully Downloaded' } );
               this.modalReference.hide();
            } else {
               if (response.Message === undefined || response.Message === '' || response.Message === null) {
                  response.Message = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage( { Type: 'Error', Message: response.Message } );
               this.modalReference.hide();
            }
         });
      }
   }
}
