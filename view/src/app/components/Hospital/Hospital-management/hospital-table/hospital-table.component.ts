import { Component, OnInit, ViewEncapsulation, ElementRef, ViewChild, Renderer, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService} from 'ngx-bootstrap';
import { Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { formatDate } from '@angular/common';


import { Observable } from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import { DateAdapter, NativeDateAdapter } from '@angular/material/core';

import { ToastrService } from '../../../../services/common-services/toastr.service';
import { HospitalManagementService } from '../../../../services/hospital-management/hospital-management.service';
import { LocationService } from '../../../../services/location-management/location.service';

import { ModalApprovedComponent } from '../../../Modals/modal-approved/modal-approved.component';

import * as XLSX from 'xlsx';
import { LoginManagementService } from '../../../../services/login-management/login-management.service';

export class MyDateAdapter extends NativeDateAdapter {
   format(date: Date, displayFormat: any): string {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate();
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
   }
}

export interface Locations { _id: string; Location_Name: string; }


@Component({
  selector: 'app-hospital-table',
  templateUrl: './hospital-table.component.html',
  styleUrls: ['./hospital-table.component.css'],
  providers: [{provide: DateAdapter, useClass: MyDateAdapter}],
  encapsulation: ViewEncapsulation.None,
})
export class HospitalTableComponent implements OnInit {

   PageLoader = true;

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

   modalReference: BsModalRef;
   HospitalListData: any[] = [];
   UserInfo: any;

   LocationsList: Locations[] = [];
   filteredLocationsList: Observable<Locations[]>;
   LastSelectedLocation = null;

   FilterFGroup: FormGroup;
   FiltersArray: any[] = [ {Active: false, Key: 'HospitalName', Value: '', DisplayName: 'Hospital Name', DBName: 'Hospital_Name', Type: 'String', Option: '' },
                           {Active: false, Key: 'Location', Value: '', DisplayName: 'Location', DBName: 'Location', Type: 'Object', Option: '' },
                           {Active: false, Key: 'HospitalRole', Value: '', DisplayName: 'Hospital Role', DBName: 'Hospital_Role', Type: 'String', Option: '' },
                           {Active: false, Key: 'HospitalAddress', Value: '', DisplayName: 'Hospital Address', DBName: 'Address', Type: 'String', Option: '' },
                           {Active: false, Key: 'HospitalStatus', Value: null, DisplayName: 'Hospital Status', DBName: 'Hospital_Status', Type: 'Select', Option: '' },
                           {Active: false, Key: 'FromDate', Value: null, DisplayName: 'From Date', DBName: 'createdAt', Type: 'Date', Option: 'GTE' },
                           {Active: false, Key: 'ToDate', Value: null, DisplayName: 'To Date', DBName: 'createdAt', Type: 'Date', Option: 'LTE' } ];
   FilterFGroupStatus = false;

   THeaders: any[] = [ { Key: 'Hospital_Name', ShortKey: 'HospitalNameSort', Name: 'Hospital Name', If_Short: false, Condition: '' },
                        { Key: 'Hospital_Role', ShortKey: 'HospitalRoleSort', Name: 'Hospital Role', If_Short: false, Condition: '' },
                        { Key: 'Address', ShortKey: 'AddressSort', Name: 'Hospital Address', If_Short: false, Condition: '' },
                        { Key: 'Location', ShortKey: 'LocationSort', Name: 'Location', If_Short: false, Condition: '' },
                        { Key: 'createdAt', ShortKey: 'createdAt', Name: 'Applied Date/Time', If_Short: false, Condition: '' },
                        { Key: 'Hospital_Status', ShortKey: 'Hospital_Status', Name: 'Status', If_Short: false, Condition: '' } ];

   constructor(   public Toastr: ToastrService,
                  public ModalService: BsModalService,
                  public HospitalService: HospitalManagementService,
                  public route: Router,
                  private renderer: Renderer,
                  public LocService: LocationService,
                  private LoginService: LoginManagementService) {
                  this.Service_Loader();
   }

   ngOnInit() {
      this.FilterFGroup = new FormGroup({
         HospitalName: new FormControl(''),
         Location: new FormControl(''),
         HospitalRole: new FormControl(''),
         HospitalAddress: new FormControl(''),
         HospitalStatus: new FormControl(null),
         FromDate: new FormControl(null),
         ToDate: new FormControl(null)
      });

      const FilterControls = this.FilterFGroup.controls;
      Object.keys(FilterControls).map(obj => {
         this.FilterFGroup.controls[obj].valueChanges.subscribe(value => {
            this.FilterFormChanges();
         });
      });

      this.LocService.StemiLocations_SimpleList('').subscribe( response => {
         this.LocationsList = response.Response;
         setTimeout(() => {
            this.FilterFGroup.controls.Location.updateValueAndValidity();
         }, 100);
      });

      this.filteredLocationsList = this.FilterFGroup.controls.Location.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                  if (this.LastSelectedLocation === null || this.LastSelectedLocation !== value._id) {
                     this.LastSelectedLocation = value._id;
                  }
                  value = value.Location_Name;
               }
               return this.LocationsList.filter(option => option.Location_Name.toLowerCase().includes(value.toLowerCase()));
            } else {
               this.LastSelectedLocation = null;
               return this.LocationsList;
              // return [];
            }
         })
      );
      this.UserInfo = JSON.parse(this.LoginService.LoginUser_Info());

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

   LocationDisplayName(Location: any) {
      return (Location && Location !== null && Location !== '') ? Location.Location_Name : null;
   }

   AutocompleteBlur(key: any) {
      const value =  this.FilterFGroup.controls[key].value;
      if (!value || value === null || value === '' || typeof value !== 'object') {
         this.FilterFGroup.controls[key].setValue(null);
      }
   }

   FilterFormChanges() {
      const FilteredValues = this.FilterFGroup.value;
      this.FilterFGroupStatus = false;
      Object.keys(FilteredValues).map(obj => {
         const value = this.FilterFGroup.controls[obj].value;
         if (value !== undefined && value !== null && value !== '') {
            if ((FilteredValues === 'Location')) {
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
         obj.Value = obj.Type !== 'Date' || obj.Type !== 'Select' ? '' : null;
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
         obj.Value = obj.Type !== 'Date' || obj.Type !== 'Select' ? '' : null;
         this.FilterFGroup.controls[obj.Key].setValue(obj.Value);
      });
      this.FilterFGroupStatus = false;
      this.Pagination_Action(1);
      // this.modalReference.hide();
   }

   RemoveFilter(index: any) {
      const KeyName = this.FiltersArray[index].Key;
      const EmptyValue = this.FiltersArray[index].Type !== 'Date' || this.FiltersArray[index].Type !== 'Select' ? '' : null;
      this.FilterFGroup.controls[KeyName].setValue(EmptyValue);
      this.SubmitFilters();
   }

   Service_Loader() {
      let ShortOrderKey = '';
      let ShortOrderCondition = '';
      this.THeaders.map(obj => {
         if (obj.If_Short === true) { ShortOrderKey = obj.ShortKey; ShortOrderCondition = obj.Condition;  }
      });
      const Filters = this.FiltersArray.filter(obj => obj.Active === true);
      const Data = { Skip_Count: this.SkipCount, Limit_Count: this.LimitCount, FilterQuery: Filters,  ShortKey: ShortOrderKey, ShortCondition: ShortOrderCondition };
      this.TableLoader();
      this.HospitalService.Hospitals_List(Data).subscribe(response => {
         this.PageLoader = false;
         this.SerialNoAddOn = this.SkipCount;
         if (response.Status && response.Status === true ) {
            this.HospitalListData = response.Response;
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
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Hospitals List Getting Error!, But not Identify!' });
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

   openModal(template: TemplateRef<any>) {
      this.FiltersArray.map(obj => {
         this.FilterFGroup.controls[obj.Key].setValue(obj.Value);
      });
      this.modalReference = this.ModalService.show(template, {ignoreBackdropClick: true, class: 'modal-lg modal-dialog-centered animated bounceInRight'} );
   }


   HospitalApprove(index: any) {
      const initialState = {
         Icon : 'verified_user',
         ColorCode : 'success',
         TextOne : 'You Want to',
         TextTwo : 'Approve',
         TextThree : 'this Hospital ?',
      };
      this.modalReference = this.ModalService.show(ModalApprovedComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight modal-small-with'} ));
      this.modalReference.content.onClose.subscribe(response => {
         if (response.Status) {
            const HospitalId = this.HospitalListData[index]._id;
            this.HospitalService.Hospital_Approve({_id: HospitalId}).subscribe(responseNew => {
               this.HospitalListData[index].Hospital_Status = 'Approved';
            });
         }
      });
   }

   HospitalReject(index: any) {
      const initialState = {
         Icon : 'block',
         ColorCode : 'danger',
         TextOne : 'You Want to',
         TextTwo : 'Reject',
         TextThree : 'this Hospital?',
      };
      this.modalReference = this.ModalService.show(ModalApprovedComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight modal-small-with'} ));
      this.modalReference.content.onClose.subscribe(response => {
         if (response.Status) {
            const HospitalId = this.HospitalListData[index]._id;
            this.HospitalService.Hospital_Reject({_id: HospitalId}).subscribe(responseNew => {
               this.HospitalListData[index].Hospital_Status = 'Rejected';
            });
         }
      });
   }


   HospitalDelete(index: any) {
      const initialState = {
         Icon : 'delete_forever',
         ColorCode : 'danger',
         TextOne : 'You Want to',
         TextTwo : 'Delete',
         TextThree : 'this Hospital?',
      };
      this.modalReference = this.ModalService.show(ModalApprovedComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight modal-small-with'} ));
      this.modalReference.content.onClose.subscribe(response => {
         if (response.Status) {
            const HospitalId = this.HospitalListData[index]._id;
            this.HospitalService.Hospital_Delete({_id: HospitalId}).subscribe(newResponse => {
               this.Pagination_Action(1);
            });
         }
      });
   }

   HospitalBlock(index: any) {
      const initialState = {
         Icon : 'lock',
         ColorCode : 'danger',
         TextOne : 'You Want to',
         TextTwo : 'Block',
         TextThree : 'this Hospital Access?',
      };
      this.modalReference = this.ModalService.show(ModalApprovedComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight modal-small-with'} ));
      this.modalReference.content.onClose.subscribe(response => {
         if (response.Status) {
            const HospitalId = this.HospitalListData[index]._id;
            this.HospitalService.Hospital_Block({_id: HospitalId}).subscribe(responseNew => {
               this.HospitalListData[index].Hospital_Status = 'Blocked';
            });
         }
      });
   }

   HospitalUnblock(index: any) {
      const initialState = {
         Icon : 'lock_open',
         ColorCode : 'success',
         TextOne : 'You Want to',
         TextTwo : 'Activate',
         TextThree : 'this Hospital Access?',
      };
      this.modalReference = this.ModalService.show(ModalApprovedComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight modal-small-with'} ));
      this.modalReference.content.onClose.subscribe(response => {
         if (response.Status) {
            const HospitalId = this.HospitalListData[index]._id;
            this.HospitalService.Hospital_UnBlock({_id: HospitalId}).subscribe(responseNew => {
               this.HospitalListData[index].Hospital_Status = 'Approved';
            });
         }
      });
   }

   redirectTo(url: string) {
      this.route.navigateByUrl('/', {skipLocationChange: true}).then(() =>
      this.route.navigate([url]));
   }


   ExportAll() {
      const Arr = ['Hospital_Type', 'Department_of_Administration', 'Hospital_Role', 'Hospital_Name', 'Hospital_Code', 'Address', 'Country',
                  'State', 'City', 'Pin_Code', 'Location', 'Latitude', 'Longitude', 'Phone', 'Mobile', 'Best_Mobile_Network',
                  'Wifi_Availability', 'Popular_FM_Channel', 'Popular_Newspaper', 'Is_EMS', 'ECG_Availability', 'ECG_Location', 'ECG_Brand_And_Model',
                  'Patch_Or_BulbElectrode', 'NoOf_ECG_PerMonth', 'NoOf_Cardiology_Beds', 'NoOf_Own_Ambulances', 'Doctors_24in7_EmergencyRoom', 'Doctors_24in7_CCU',
                  'Cardiology_Department_Head', 'NoOf_Cardiologists', 'NoOf_GeneralPhysicians', 'CathLab_Availability', 'CathLab_24_7',
                  'ClosestHospitals_with_CathLab', 'NoOf_ICU_Or_CCU_Beds', 'NoOf_PCI_Done_PerMonth', 'PCI_Availability',
                  'NoOf_PrimaryPCI_Done_PerMonth', 'ModeOf_Transports_Used_ByPatients', 'NoOf_CCUNurses', 'Thrombolysis_Availability', 'TypeOf_Thrombolytic',
                  'NoOf_Thrombolysed_patients_PerMonth', 'PercentageOf_Streptokinase_patients',
                  'PercentageOf_Tenecteplase_patients', 'PercentageOf_Reteplase_patients', 'Thrombolytic_Other',
                  'If_PharmacoInvasive_Therapy', 'NoOf_PharmacoInvasive_PerMonth', 'Heard_About_Project', 'Help_Timely_Care_ToPatients', 'Feedback_Remarks',
                  'NoOf_STEMI_Patients_PerMonth', 'NoOf_Direct_STEMI_Patients_PerMonth', 'NoOf_Referral_STEMI_Patients_PerMonth',
                  'NoOf_STEMI_Cases_ReferredFrom_PerMonth', 'NoOf_STEMI_Cases_ReferredTo_PerMonth', 'Hospital_Status', 'createdAt'];

      const Headers = ['Hospital Type', 'Ministry/Dept. of administration',  'Hospital Role', 'Name of the hospital', 'Hospital Code', 'Hospital Address', 'Country',
                     'State', 'City', 'Zip Code', 'Location', 'Latitude', 'Longitude', 'Phone', 'Mobile', 'Which mobile phone network has best coverage in the hospital?',
                     'Do you have WiFi connectivity?', 'Most popular FM channel in the region', 'Most widely read print newspaper in the region', 'Is EMS',
                     'Do you have an ECG machine in your hospital?', 'Where is the ECG machine located?', 'Brand and model of ECG machine',
                     'Are patch or bulb electrode used?', 'How many ECG are recorded per month', 'No. of cardiology beds', 'How many ambulances does the hospital own?',
                     'Are there doctors 24X7 in the Emergency Room?', 'Are there doctors 24X7 in the CCU?', 'Head of the Department', 'Number Of Cardiologists',
                     'Total Number of General Physicians', 'Do you have cath lab in your hospital?', 'Is Cath Lab 24x7',
                     'Closest hospital with a cath lab', 'Cardiac / ICU Beds', 'How many PCI done per month', 'Do you do Primary PCI?',
                     'No. of Primary PCI done per month', 'Mode of Transports used by STEMI patients ?',  'CCU Staff', 'Do you do thrombolysis',
                     'Type of Thrombolytic used', 'How many thrombolysis done per month?', 'What % of patients are given streptokinase?',
                     'What % of patients are given tenecteplase?', 'What % of patients are given reteplase?', 'Others',
                     'Is Pharmaco-Invasive therapy given for patients referred here after thrombolysis?', 'No. of cases treated with Pharmaco-Invasive therapy per month',
                     'Have you heard about STEMI Project', 'Are you willing to help STEMI patients receive timely care through this project?', 'Additional Remarks',
                     'No of STEMI Patients received per month', 'Number of Direct Admission per month', 'No of STEMI Referral patients received per month',
                     'No. of STEMI cases per month referred from here to another hospital', 'No of STEMI patients referred here from another hospital per month',
                     'Hospital Status', 'Applied Date'];

      const SubVal = ['Government Ambulance', 'Hospital Ambulance', 'Private Ambulance', 'Private Vehicle', 'Public Transport'];

      const AtoZ = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

      function add_cell_to_sheet(worksheet, address, value) {
         worksheet[address] = {t: 'string', v: value};
         /* find the cell range */
         const range = XLSX.utils.decode_range(worksheet['!ref']);
         const addr = XLSX.utils.decode_cell(address);
         /* extend the range to include the new cell */
         if (range.s.c > addr.c) { range.s.c = addr.c; }
         if (range.s.r > addr.r) { range.s.r = addr.r; }
         if (range.e.c < addr.c) { range.e.c = addr.c; }
         if (range.e.r < addr.r) { range.e.r = addr.r; }
         /* update range */
         worksheet['!ref'] = XLSX.utils.encode_range(range);
      }

      const DataArray = [];
      let ShortOrderKey = '';
      let ShortOrderCondition = '';
      this.THeaders.map(obj => {
         if (obj.If_Short === true) { ShortOrderKey = obj.ShortKey; ShortOrderCondition = obj.Condition;  }
      });
      const Filters = this.FiltersArray.filter(obj => obj.Active === true);
      const Data = { Skip_Count: this.SkipCount, Limit_Count: this.LimitCount, FilterQuery: Filters,  ShortKey: ShortOrderKey, ShortCondition: ShortOrderCondition };
      this.HospitalService.Hospitals_All_List(Data).subscribe(response => {
         if (response.Status && response.Status === true ) {
            const TempHospitalListData = response.Response;
            TempHospitalListData.map(object => {
               const DataObject = Object.keys(object).filter(key => Arr.includes(key)).reduce((obj, key) => { obj[key] = object[key]; return obj; }, {});
               Object.keys(object).map(obj => {
                  if (obj === 'Country') {
                     DataObject[obj] = (DataObject[obj] && DataObject[obj] !== null && DataObject[obj] !== '') ? DataObject[obj].Country_Name : '';
                  }
                  if (obj === 'State') {
                     DataObject[obj] = (DataObject[obj] && DataObject[obj] !== null && DataObject[obj] !== '') ? DataObject[obj].State_Name : '';
                  }
                  if (obj === 'City') {
                     DataObject[obj] = (DataObject[obj] && DataObject[obj] !== null && DataObject[obj] !== '') ? DataObject[obj].City_Name : '';
                  }
                  if (obj === 'Location') {
                     DataObject[obj] = (DataObject[obj] && DataObject[obj] !== null && DataObject[obj] !== '') ? DataObject[obj].Location_Name : '';
                  }
                  if (obj === 'createdAt') {
                     DataObject[obj] = formatDate(DataObject[obj], 'dd/MM/yyyy - hh:mm a', 'en-US');
                  }
                  if (obj === 'ModeOf_Transports_Used_ByPatients') {
                     if (DataObject[obj] && DataObject[obj] !== null && DataObject[obj] !== '') {
                        let Str = '';
                        Object.keys(DataObject[obj]).map( (obj1 , i) => {
                           if (DataObject[obj][obj1]) { Str = Str + SubVal[i] + ', '; }
                        });
                        DataObject[obj] = Str;
                     }
                  }
               });
               DataArray.push(DataObject);
            });
            const ws = XLSX.utils.json_to_sheet(DataArray, {header: Arr});
            const RePlaceKey = [];
            Arr.map( (obj, i) => {
               const Str = Math.trunc(i / 26);
               const Add = Str === 0 ? '' : AtoZ[Str - 1];
               const index = i > 25 ? i - (Str * 26) : i;
               const key = Add + AtoZ[index] + 1;
               RePlaceKey.push(key);
            });
            RePlaceKey.map((obj, i) => {
               add_cell_to_sheet(ws, obj, Headers[i]);
            });
            const wb: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            const date = new Date().toLocaleDateString('en-US', { year: 'numeric',  month: 'long', day: 'numeric' });
            XLSX.writeFile(wb, date + '-Hospitals-List.xlsx');
         } else if (!response.Status && response.ErrorCode === 400 || response.ErrorCode === 401 || response.ErrorCode === 417) {
            if (response.ErrorMessage === undefined || response.ErrorMessage === '' || response.ErrorMessage === null) {
               response.ErrorMessage = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.ErrorMessage });
         } else {
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Hospitals List Getting Error!, But not Identify!' });
         }
      });
   }

   Export() {

      const Arr = ['Hospital_Type', 'Department_of_Administration', 'Hospital_Role', 'Hospital_Name', 'Hospital_Code', 'Address', 'Country',
                  'State', 'City', 'Pin_Code', 'Location', 'Latitude', 'Longitude', 'Phone', 'Mobile', 'Best_Mobile_Network',
                  'Wifi_Availability', 'Popular_FM_Channel', 'Popular_Newspaper', 'Is_EMS', 'ECG_Availability', 'ECG_Location', 'ECG_Brand_And_Model',
                  'Patch_Or_BulbElectrode', 'NoOf_ECG_PerMonth', 'NoOf_Cardiology_Beds', 'NoOf_Own_Ambulances', 'Doctors_24in7_EmergencyRoom', 'Doctors_24in7_CCU',
                  'Cardiology_Department_Head', 'NoOf_Cardiologists', 'NoOf_GeneralPhysicians', 'CathLab_Availability', 'CathLab_24_7',
                  'ClosestHospitals_with_CathLab', 'NoOf_ICU_Or_CCU_Beds', 'NoOf_PCI_Done_PerMonth', 'PCI_Availability',
                  'NoOf_PrimaryPCI_Done_PerMonth', 'ModeOf_Transports_Used_ByPatients', 'NoOf_CCUNurses', 'Thrombolysis_Availability', 'TypeOf_Thrombolytic',
                  'NoOf_Thrombolysed_patients_PerMonth', 'PercentageOf_Streptokinase_patients',
                  'PercentageOf_Tenecteplase_patients', 'PercentageOf_Reteplase_patients', 'Thrombolytic_Other',
                  'If_PharmacoInvasive_Therapy', 'NoOf_PharmacoInvasive_PerMonth', 'Heard_About_Project', 'Help_Timely_Care_ToPatients', 'Feedback_Remarks',
                  'NoOf_STEMI_Patients_PerMonth', 'NoOf_Direct_STEMI_Patients_PerMonth', 'NoOf_Referral_STEMI_Patients_PerMonth',
                  'NoOf_STEMI_Cases_ReferredFrom_PerMonth', 'NoOf_STEMI_Cases_ReferredTo_PerMonth', 'Hospital_Status', 'createdAt'];

      const Headers = ['Hospital Type', 'Ministry/Dept. of administration',  'Hospital Role', 'Name of the hospital', 'Hospital Code', 'Hospital Address', 'Country',
                  'State', 'City', 'Zip Code', 'Location', 'Latitude', 'Longitude', 'Phone', 'Mobile', 'Which mobile phone network has best coverage in the hospital?',
                  'Do you have WiFi connectivity?', 'Most popular FM channel in the region', 'Most widely read print newspaper in the region', 'Is EMS',
                  'Do you have an ECG machine in your hospital?', 'Where is the ECG machine located?', 'Brand and model of ECG machine',
                  'Are patch or bulb electrode used?', 'How many ECG are recorded per month', 'No. of cardiology beds', 'How many ambulances does the hospital own?',
                  'Are there doctors 24X7 in the Emergency Room?', 'Are there doctors 24X7 in the CCU?', 'Head of the Department', 'Number Of Cardiologists',
                  'Total Number of General Physicians', 'Do you have cath lab in your hospital?', 'Is Cath Lab 24x7',
                  'Closest hospital with a cath lab', 'Cardiac / ICU Beds', 'How many PCI done per month', 'Do you do Primary PCI?',
                  'No. of Primary PCI done per month', 'Mode of Transports used by STEMI patients ?',  'CCU Staff', 'Do you do thrombolysis',
                  'Type of Thrombolytic used', 'How many thrombolysis done per month?', 'What % of patients are given streptokinase?',
                  'What % of patients are given tenecteplase?', 'What % of patients are given reteplase?', 'Others',
                  'Is Pharmaco-Invasive therapy given for patients referred here after thrombolysis?', 'No. of cases treated with Pharmaco-Invasive therapy per month',
                  'Have you heard about STEMI Project', 'Are you willing to help STEMI patients receive timely care through this project?', 'Additional Remarks',
                  'No of STEMI Patients received per month', 'Number of Direct Admission per month', 'No of STEMI Referral patients received per month',
                  'No. of STEMI cases per month referred from here to another hospital', 'No of STEMI patients referred here from another hospital per month',
                  'Hospital Status', 'Applied Date'];

      const SubVal = ['Government Ambulance', 'Hospital Ambulance', 'Private Ambulance', 'Private Vehicle', 'Public Transport'];

      const AtoZ = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

      const DataArray = [];
      this.HospitalListData.map(object => {
         const DataObject = Object.keys(object).filter(key => Arr.includes(key)).reduce((obj, key) => { obj[key] = object[key]; return obj; }, {});
         Object.keys(object).map(obj => {
            if (obj === 'Country') {
               DataObject[obj] = (DataObject[obj] && DataObject[obj] !== null && DataObject[obj] !== '') ? DataObject[obj].Country_Name : '';
            }
            if (obj === 'State') {
               DataObject[obj] = (DataObject[obj] && DataObject[obj] !== null && DataObject[obj] !== '') ? DataObject[obj].State_Name : '';
            }
            if (obj === 'City') {
               DataObject[obj] = (DataObject[obj] && DataObject[obj] !== null && DataObject[obj] !== '') ? DataObject[obj].City_Name : '';
            }
            if (obj === 'Location') {
               DataObject[obj] = (DataObject[obj] && DataObject[obj] !== null && DataObject[obj] !== '') ? DataObject[obj].Location_Name : '';
            }
            if (obj === 'createdAt') {
               DataObject[obj] = formatDate(DataObject[obj], 'dd/MM/yyyy - hh:mm a', 'en-US');
            }
            if (obj === 'ModeOf_Transports_Used_ByPatients') {
               if (DataObject[obj] && DataObject[obj] !== null && DataObject[obj] !== '') {
                  let Str = '';
                  Object.keys(DataObject[obj]).map( (obj1 , i) => {
                     if (DataObject[obj][obj1]) { Str = Str + SubVal[i] + ', '; }
                  });
                  DataObject[obj] = Str;
               }
            }
         });
         DataArray.push(DataObject);
      });

      function add_cell_to_sheet(worksheet, address, value) {
         worksheet[address] = {t: 'string', v: value};
         /* find the cell range */
         const range = XLSX.utils.decode_range(worksheet['!ref']);
         const addr = XLSX.utils.decode_cell(address);
         /* extend the range to include the new cell */
         if (range.s.c > addr.c) { range.s.c = addr.c; }
         if (range.s.r > addr.r) { range.s.r = addr.r; }
         if (range.e.c < addr.c) { range.e.c = addr.c; }
         if (range.e.r < addr.r) { range.e.r = addr.r; }
         /* update range */
         worksheet['!ref'] = XLSX.utils.encode_range(range);
      }

      const ws = XLSX.utils.json_to_sheet(DataArray, {header: Arr});
      const RePlaceKey = [];
      Arr.map( (obj, i) => {
         const Str = Math.trunc(i / 26);
         const Add = Str === 0 ? '' : AtoZ[Str - 1];
         const index = i > 25 ? i - (Str * 26) : i;
         const key = Add + AtoZ[index] + 1;
         RePlaceKey.push(key);
      });
      RePlaceKey.map((obj, i) => {
         add_cell_to_sheet(ws, obj, Headers[i]);
      });
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const date = new Date().toLocaleDateString('en-US', { year: 'numeric',  month: 'long', day: 'numeric' });
      XLSX.writeFile(wb, date + '-Hospitals-List.xlsx');
   }

}
