import { Component, ElementRef, ViewChild, Renderer, TemplateRef, OnInit } from '@angular/core';
import { BsModalRef, BsModalService} from 'ngx-bootstrap';
import { FormGroup, FormControl } from '@angular/forms';
import { formatDate } from '@angular/common';

import { Observable, from } from 'rxjs';
import {map, startWith} from 'rxjs/operators';

import { HospitalManagementService } from 'src/app/services/hospital-management/hospital-management.service';
import { LoginManagementService } from 'src/app/services/login-management/login-management.service';
import { AskCardiologistPatientsManagementService } from 'src/app/services/ask-cardiologist-patients-management/ask-cardiologist-patients-management.service';
import { ToastrService } from 'src/app/services/common-services/toastr.service';
import { ModalFilterComponent } from '../../Modals/modal-filter/modal-filter.component';
import { ModalOfflineViewComponent } from '../../Modals/modal-offline-view/modal-offline-view.component';
import { ClusterManagementService } from 'src/app/services/cluster-management/cluster-management.service';
import { LocationService } from 'src/app/services/location-management/location.service';

import * as XLSX from 'xlsx';
import { ModalCardioViewComponent } from '../../Modals/modal-cardio-view/modal-cardio-view.component';

export interface Locations { _id: string; Location_Name: string; }
export interface Clusters  { _id: string;  Cluster_Name: string; }
export interface Hospitals  { _id: string; Hospital_Name: string; }

@Component({
  selector: 'app-cardio-table',
  templateUrl: './cardio-table.component.html',
  styleUrls: ['./cardio-table.component.css']
})
export class CardioTableComponent implements OnInit {

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


  StemiStatus: any[] = [ {Name: 'Stemi Ask Cardiologist', Key: 'Stemi_Ask_Cardiologist'},
                           {Name: 'Retake ECG', Key: 'Retake_ECG'}];

  FiltersArray: any[] = [ {Active: false, Key: 'Patient_Name', Value: '', DisplayName: 'Patient Name ', DBName: 'Patient_Name', Type: 'String', Option: '' },
                          {Active: false, Key: 'HospitalName', Value: '', DisplayName: 'Hospital Name', DBName: 'Hospital', Type: 'Object', Option: '' },
                          {Active: false, Key: 'Stemi_Status', Value: '', DisplayName: 'Stemi Status ', DBName: 'Stemi_Status', Type: 'String', Option: '' },
                          {Active: false, Key: 'FromDate', Value: null, DisplayName: 'From Date', DBName: 'createdAt', Type: 'Date', Option: 'GTE' },
                          {Active: false, Key: 'ToDate', Value: null, DisplayName: 'To Date', DBName: 'createdAt', Type: 'Date', Option: 'LTE' } ];
  FilterFGroupStatus = false;

  THeaders: any[] = [ { Key: 'Patient_Name', ShortKey: 'PatientNameSort', Name: 'Patient Name', If_Short: false, Condition: '' },
  { Key: 'Patient_Age', ShortKey: 'Patient_Age', Name: 'Patient Age', If_Short: false, Condition: '' },
  { Key: 'Patient_Gender', ShortKey: 'Patient_Gender', Name: 'Patient Gender', If_Short: false, Condition: '' },
  { Key: 'Hospital', ShortKey: 'HospitalSort', Name: 'Spoke / Hub Hospital', If_Short: false, Condition: '' },
  { Key: 'Stemi_Status', ShortKey: 'Stemi_StatusSort', Name: 'Status', If_Short: false, Condition: '' },
  { Key: 'ECG_Taken_date_time', ShortKey: 'ECG_Taken_date_time', Name: 'ECG Taken  Date / Time', If_Short: false, Condition: '' }];


  constructor(public ModalService: BsModalService,
              public Service: AskCardiologistPatientsManagementService,
              private renderer: Renderer,
              public Toastr: ToastrService,
              public LocService: LocationService,
              public HospitalService: HospitalManagementService,
              private LoginService: LoginManagementService,
              public ClusterService: ClusterManagementService) {
              this.UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
              this.Service_Loader(); }

 ngOnInit() {
  this.FilterFGroup = new FormGroup({
     Patient_Name: new FormControl(''),
     Stemi_Status: new FormControl(''),
     HospitalName: new FormControl(null),
     FromDate: new FormControl(null),
     ToDate: new FormControl(null)
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
//   LocationDisplayName(Location: any) {
//      return (Location && Location !== null && Location !== '') ? Location.Location_Name : null;
//   }
//   ClusterDisplayName(Cluster: any) {
//      return (Cluster && Cluster !== null && Cluster !== '') ? Cluster.Cluster_Name : null;
//   }
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
     // this.modalReference.hide();
  }

  RemoveFilter(index: any) {
     const KeyName = this.FiltersArray[index].Key;
     const EmptyValue = this.FiltersArray[index].Type !== 'Number' ? '' : null;
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
     this.Service.AllCardiologist_List(Data).subscribe(response => {
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

  ViewPatient(index: any) {
     const initialState = {
        Info: this.PatientDetails[index]
     };
     this.modalReference = this.ModalService.show(ModalCardioViewComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-lg modal-dialog-centered animated bounceInRight' }));
     this.modalReference.content.onClose.subscribe(response => {
        if (response.Status) {
           this.PatientDetails[index] = response.Response;
        }
     });
  }

  openFilterModal(template: TemplateRef<any>) {
     this.FiltersArray.map(obj => {
        this.FilterFGroup.controls[obj.Key].setValue(obj.Value);
     });
     this.modalReference = this.ModalService.show(template, {ignoreBackdropClick: true, class: 'modal-lg modal-dialog-centered animated bounceInRight'} );
  }

 

  ExportAll() {
   const Arr = ['Patient_Name', 'Patient_Age', 'Stemi_Status', 'Admission_Type', 'Hospital', 'User',
   'Chest_Discomfort', 'Duration_of_Pain', 'Location_of_Pain',
   'Diabetes', 'Family_History_of_IHD', 'High_Cholesterol', 'Hypertension', 'Previous_History_of_IHD', 'Smoker',
   'ECG_Taken_date_time', 'createdAt'];

   const Headers = ['Patient Name', 'Patient Age', 'Stemi Status' , 'Admission Type', 'Name of the hospital', 'User',
   'Chest Discomfort', 'Duration of Pain', 'Location of Pain',
   'Diabetes', 'Family History of IHD', 'High Cholesterol', 'Hypertension', 'Previous History of IHD', 'Smoker',
   'ECG Taken Date Time', 'CreatedAt'];

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
   this.Service.AllCardiologist_List(Data).subscribe(response => {
        if (response.Status && response.Status === true ) {
           const PatientData = response.Response;
           PatientData.map(object => {
              const DataObject = Object.keys(object).filter(key => Arr.includes(key)).reduce((obj, key) => { obj[key] = object[key]; return obj; }, {});
              Object.keys(object).map(obj => {
               if (obj === 'Initiated_Hospital') {
                  DataObject['Hospital'] = (object[obj] && object[obj] !== null && object[obj] !== '') ? object[obj].Hospital_Name : '';
               }
               if (obj === 'UserInfo') {
                  DataObject['User'] = (object[obj] && object[obj] !== null && object[obj] !== '') ? object[obj].Name : '';
               }
               if (obj === 'Symptoms') {
                  if (object[obj].Location_of_Pain !== undefined && object[obj].Location_of_Pain !== '') {
                     let Arr = object[obj].Location_of_Pain.split(',');
                     Arr = Arr.map(obj => {
                       obj = obj.replace('_', ' ');
                       return obj;
                     });
                     object[obj].Location_of_Pain = Arr.join(', ');
                  }
                  DataObject['Chest_Discomfort'] = (object[obj] && object[obj] !== null && object[obj] !== '') ? object[obj].Chest_Discomfort : '';
                  DataObject['Duration_of_Pain'] = (object[obj] && object[obj] !== null && object[obj] !== '' && object[obj] !== undefined ) ?  formatDate(object[obj].Duration_of_Pain , 'dd/MM/yyyy - hh:mm a', 'en-US') : '';
                  DataObject['Location_of_Pain'] = (object[obj] && object[obj] !== null && object[obj] !== '') ? object[obj].Location_of_Pain : '';
               }
               if (obj === 'Risk_Factors') {
                  DataObject['Diabetes'] = (object[obj] && object[obj] !== null && typeof object[obj] === 'object') ? object[obj][0].Diabetes : '';
                  DataObject['Family_History_of_IHD'] = (object[obj] && object[obj] !== null && typeof object[obj] === 'object') ? object[obj][0].Family_History_of_IHD : '';
                  DataObject['High_Cholesterol'] = (object[obj] && object[obj] !== null && typeof object[obj] === 'object') ? object[obj][0].High_Cholesterol : '';
                  DataObject['Hypertension'] = (object[obj] && object[obj] !== null && typeof object[obj] === 'object') ? object[obj][0].Hypertension : '';
                  DataObject['Previous_History_of_IHD'] = (object[obj] && object[obj] !== null && typeof object[obj] === 'object') ? object[obj][0].Previous_History_of_IHD : '';
                  DataObject['Smoker'] = (object[obj] && object[obj] !== null && typeof object[obj] === 'object') ? object[obj][0].Smoker : '';
               }
               if (obj === 'createdAt') {
                  DataObject[obj] = formatDate(DataObject[obj], 'dd/MM/yyyy - hh:mm a', 'en-US');
               }
                  
               if (obj === 'ECG_Taken_date_time') {
                  DataObject[obj] = formatDate(DataObject[obj], 'dd/MM/yyyy - hh:mm a', 'en-US');
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
           XLSX.writeFile(wb, date + '-Cardio-List.xlsx');
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



  Export() {

      const Arr = ['Patient_Name', 'Patient_Age', 'Stemi_Status', 'Admission_Type', 'Hospital', 'User',
      'Chest_Discomfort', 'Duration_of_Pain', 'Location_of_Pain',
      'Diabetes', 'Family_History_of_IHD', 'High_Cholesterol', 'Hypertension', 'Previous_History_of_IHD', 'Smoker',
      'ECG_Taken_date_time', 'createdAt'];

      const Headers = ['Patient Name', 'Patient Age', 'Stemi Status' , 'Admission Type', 'Name of the hospital', 'User',
      'Chest Discomfort', 'Duration of Pain', 'Location of Pain',
      'Diabetes', 'Family History of IHD', 'High Cholesterol', 'Hypertension', 'Previous History of IHD', 'Smoker',
      'ECG Taken Date Time', 'CreatedAt'];

      const AtoZ = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

   // const SubVal = ['Stemi_Ask_Cardiologist', 'Retake_ECG'];

      const DataArray = [];
      this.PatientDetails.map(object => {
         const DataObject = Object.keys(object).filter(key => Arr.includes(key)).reduce((obj, key) => { obj[key] = object[key]; return obj; }, {});
         Object.keys(object).map(obj => {
            if (obj === 'Initiated_Hospital') {
               DataObject['Hospital'] = (object[obj] && object[obj] !== null && object[obj] !== '') ? object[obj].Hospital_Name : '';
            } 
            if (obj === 'UserInfo') {
               DataObject['User'] = (object[obj] && object[obj] !== null && object[obj] !== '') ? object[obj].Name : '';
            }
            if (obj === 'Symptoms') {
               if (object[obj].Location_of_Pain !== undefined && object[obj].Location_of_Pain !== '') {
                  let Arr = object[obj].Location_of_Pain.split(',');
                  Arr = Arr.map(obj => {
                    obj = obj.replace('_', ' ');
                    return obj;
                  });
                  object[obj].Location_of_Pain = Arr.join(', ');
               }
               DataObject['Chest_Discomfort'] = (object[obj] && object[obj] !== null && object[obj] !== '') ? object[obj].Chest_Discomfort : '';
               DataObject['Duration_of_Pain'] = (object[obj] && object[obj] !== null && object[obj] !== '' && object[obj] !== undefined ) ?  formatDate(object[obj].Duration_of_Pain , 'dd/MM/yyyy - hh:mm a', 'en-US') : '';
               DataObject['Location_of_Pain'] = (object[obj] && object[obj] !== null && object[obj] !== '') ? object[obj].Location_of_Pain : '';
            }
            if (obj === 'Risk_Factors') {
               DataObject['Diabetes'] = (object[obj] && object[obj] !== null && typeof object[obj] === 'object') ? object[obj][0].Diabetes : '';
               DataObject['Family_History_of_IHD'] = (object[obj] && object[obj] !== null && typeof object[obj] === 'object') ? object[obj][0].Family_History_of_IHD : '';
               DataObject['High_Cholesterol'] = (object[obj] && object[obj] !== null && typeof object[obj] === 'object') ? object[obj][0].High_Cholesterol : '';
               DataObject['Hypertension'] = (object[obj] && object[obj] !== null && typeof object[obj] === 'object') ? object[obj][0].Hypertension : '';
               DataObject['Previous_History_of_IHD'] = (object[obj] && object[obj] !== null && typeof object[obj] === 'object') ? object[obj][0].Previous_History_of_IHD : '';
               DataObject['Smoker'] = (object[obj] && object[obj] !== null && typeof object[obj] === 'object') ? object[obj][0].Smoker : '';
            }
            if (obj === 'createdAt') {
               DataObject[obj] = formatDate(DataObject[obj], 'dd/MM/yyyy - hh:mm a', 'en-US');
            }           
            if (obj === 'ECG_Taken_date_time') {
               DataObject[obj] = formatDate(DataObject[obj], 'dd/MM/yyyy - hh:mm a', 'en-US');
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
      XLSX.writeFile(wb, date + '-Cardio-List.xlsx');
  }


}

