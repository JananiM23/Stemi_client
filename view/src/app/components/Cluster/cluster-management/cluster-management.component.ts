import { Component, OnInit, ElementRef, ViewChild, Renderer, TemplateRef } from '@angular/core';
import { BsModalRef,  BsModalService } from 'ngx-bootstrap';
import { FormGroup, FormControl } from '@angular/forms';

import { Observable, from } from 'rxjs';
import {map, startWith} from 'rxjs/operators';


import { ModalClusterCreateAndEditComponent } from '../../Modals/modal-cluster-create-and-edit/modal-cluster-create-and-edit.component';
import { ClusterManagementService } from '../../../services/cluster-management/cluster-management.service';
import { ToastrService } from '../../../services/common-services/toastr.service';
import { HospitalManagementService } from '../../../services/hospital-management/hospital-management.service';
import { LocationService } from '../../../services/location-management/location.service';
import { ModalClusterViewComponent } from '../../Modals/modal-cluster-view/modal-cluster-view.component';

export interface Locations { _id: string; Location_Name: string; }
export interface Hospitals { _id: string; Hospital_Name: string; }

@Component({
  selector: 'app-cluster-management',
  templateUrl: './cluster-management.component.html',
  styleUrls: ['./cluster-management.component.css']
})
export class ClusterManagementComponent implements OnInit {

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

   LocationsList: Locations[] = [];
   filteredLocationsList: Observable<Locations[]>;
   LastSelectedLocation = null;

   filteredHospitalsList: Observable<Hospitals[]>;
   HospitalList: Hospitals[] = [];
   LastSelectedHospital = null;

   modalReference: BsModalRef;
   ClusterDetails: any[] = [];

   FilterFGroup: FormGroup;
   FiltersArray: any[] = [ {Active: false, Key: 'ClusterName', Value: '', DisplayName: 'Cluster Name', DBName: 'Cluster_Name', Type: 'String', Option: '' },
                           {Active: false, Key: 'ClusterType', Value: '', DisplayName: 'Cluster Type', DBName: 'Cluster_Type', Type: 'String', Option: '' },
                           {Active: false, Key: 'ClusterCode', Value: null, DisplayName: 'Cluster Code', DBName: 'Cluster_Code', Type: 'Number', Option: '' },
                           {Active: false, Key: 'Location', Value: '', DisplayName: 'Location', DBName: 'Location', Type: 'Object', Option: '' },
                           {Active: false, Key: 'HospitalName', Value: '', DisplayName: 'Hospital Name', DBName: 'Hospital', Type: 'Object', Option: '' } ];
   FilterFGroupStatus = false;

   THeaders: any[] = [ { Key: 'Cluster_Name', ShortKey: 'ClusterSort', Name: 'Cluster Name', If_Short: false, Condition: '' },
                        { Key: 'Cluster_Type', ShortKey: 'ClusterTypeSort', Name: 'Cluster Type', If_Short: false, Condition: '' },
                        { Key: 'Cluster_Code', ShortKey: 'Cluster_Code', Name: 'Cluster Code', If_Short: false, Condition: '' },
                        { Key: 'Hospital', ShortKey: 'HospitalSort', Name: 'Hospital', If_Short: false, Condition: '' },
                        { Key: 'Location', ShortKey: 'LocationSort', Name: 'Location', If_Short: false, Condition: '' },
                        { Key: 'Active_Status', ShortKey: 'Active_Status', Name: 'Status', If_Short: false, Condition: '' } ];

   constructor(public ModalService: BsModalService,
               public ClusterService: ClusterManagementService,
               public Toastr: ToastrService,
               public HospitalService: HospitalManagementService,
               private renderer: Renderer,
               public LocService: LocationService) {
                  this.Service_Loader();
    }

   ngOnInit() {
      this.FilterFGroup = new FormGroup({
         ClusterName: new FormControl(''),
         ClusterCode: new FormControl(''),
         ClusterType: new FormControl(''),
         Location: new FormControl(null),
         HospitalName: new FormControl(null)
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

      this.HospitalService.HubHospitals_SimpleList('').subscribe( NewResponse => {
         this.HospitalList = NewResponse.Response;
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
            }  else {
               this.LastSelectedHospital = null;
               return this.HospitalList;
            }
         })
      );
   }

   LocationDisplayName(Location: any) {
      return (Location && Location !== null && Location !== '') ? Location.Location_Name : null;
   }
   HospitalDisplayName(Hospital: any) {
      return (Hospital && Hospital !== null && Hospital !== '') ? Hospital.Hospital_Name : null;
   }
   ClusterDisplayName(Cluster: any) {
      return (Cluster && Cluster !== null && Cluster !== '') ? Cluster.Cluster_Name : null;
   }

   AutocompleteBlur(key: any) {
      const value =  this.FilterFGroup.controls[key].value;
      if (!value || value === null || value === '' || typeof value !== 'object') {
         this.FilterFGroup.controls[key].setValue(null);
      }
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
    this.ClusterService.StemiCluster_View(Data).subscribe(response => {
       this.PageLoader = false;
       this.SerialNoAddOn = this.SkipCount;
       if (response.Status && response.Status === true ) {
          this.ClusterDetails = response.Response;
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
         if ((FilteredValues === 'Location' || FilteredValues === 'HospitalName')) {
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
   //  this.modalReference.hide();
 }

 RemoveFilter(index: any) {
    const KeyName = this.FiltersArray[index].Key;
    const EmptyValue = this.FiltersArray[index].Type !== 'Number' ? '' : null;
    this.FilterFGroup.controls[KeyName].setValue(EmptyValue);
    this.SubmitFilters();
 }

 openFilterModal(template: TemplateRef<any>) {
    this.FiltersArray.map(obj => {
       this.FilterFGroup.controls[obj.Key].setValue(obj.Value);
    });
    this.modalReference = this.ModalService.show(template, {ignoreBackdropClick: true, class: 'modal-lg modal-dialog-centered animated bounceInRight'} );
 }

//   openModal() {
//    this.modalReference = this.ModalService.show(ModalClusterCreateAndEditComponent, {ignoreBackdropClick: true, class: 'modal-md modal-dialog-centered animated bounceInRight'} );
//  }

CreateCluster() {
   const initialState = { Type: 'Create' };
   this.modalReference = this.ModalService.show(ModalClusterCreateAndEditComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-md modal-dialog-centered animated bounceInRight' }));
   this.modalReference.content.onClose.subscribe(response => {
      if (response.Status) {
         this.Pagination_Action(1);
      }
   });
}

EditCluster(index: any) {
   const initialState = {
      Type: 'Edit',
      Info: this.ClusterDetails[index]
   };
   this.modalReference = this.ModalService.show(ModalClusterCreateAndEditComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-md modal-dialog-centered animated bounceInRight' }));
   this.modalReference.content.onClose.subscribe(response => {
      if (response.Status) {
         this.ClusterDetails[index] = response.Response;
      }
   });
}

ViewCluster(index: any) {
   const initialState = {
      Info: this.ClusterDetails[index]
   };
   this.modalReference = this.ModalService.show(ModalClusterViewComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-md modal-dialog-centered animated bounceInRight' }));
}


}
