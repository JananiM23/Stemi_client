import { Component, OnInit, ViewEncapsulation, ElementRef, ViewChild, Renderer, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService} from 'ngx-bootstrap';
import { Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';

import { DateAdapter, NativeDateAdapter } from '@angular/material/core';

import { ToastrService } from '../../services/common-services/toastr.service';
import { ReferralFacilityService } from '../../services/referral-facility/referral-facility.service';

import { ModalReferralFacilityComponent } from '../Modals/modal-referral-facility/modal-referral-facility.component';

export class MyDateAdapter extends NativeDateAdapter {
   format(date: Date, displayFormat: any): string {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate();
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
   }
}

@Component({
  selector: 'app-referral-facility',
  templateUrl: './referral-facility.component.html',
  styleUrls: ['./referral-facility.component.css'],
  providers: [{provide: DateAdapter, useClass: MyDateAdapter}],
})
export class ReferralFacilityComponent implements OnInit {

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

	HospitalTypes: any[] = [ {Name: 'EMS', Key: 'E'},
									{Name: 'Secondary Hospital', Key: 'S1'},
									{Name: 'Clinic/GP', Key: 'S2'},
									{Name: 'Tertiary level PCI Facility 24x7', Key: 'H1'},
									{Name: 'Tertiary level PCI Facility', Key: 'H2'} ];

   modalReference: BsModalRef;
   ReferralFacilitiesListData: any[] = [];

   FilterFGroup: FormGroup;
   FiltersArray: any[] = [ {Active: false, Key: 'Hospital_Name', Value: '', DisplayName: 'Hospital Name', DBName: 'Hospital_Name', Type: 'String', Option: '' },
                           {Active: false, Key: 'Hospital_Type', Value: null, DisplayName: 'Hospital Type', DBName: 'Hospital_Type', Type: 'String', Option: '' },
                           {Active: false, Key: 'Hospital_Address', Value: null, DisplayName: 'Hospital Address', DBName: 'Hospital_Address', Type: 'String', Option: '' },
									{Active: false, Key: 'FromDate', Value: null, DisplayName: 'From Date', DBName: 'createdAt', Type: 'Date', Option: 'GTE' },
                           {Active: false, Key: 'ToDate', Value: null, DisplayName: 'To Date', DBName: 'createdAt', Type: 'Date', Option: 'LTE' } ];
   FilterFGroupStatus = false;
   THeaders: any[] = [ { Key: 'Hospital_Name', ShortKey: 'HospitalNameSort', Name: 'Hospital Name', If_Short: false, Condition: '' },
                        { Key: 'Hospital_Type', ShortKey: 'Hospital_Type', Name: 'Hospital Type', If_Short: false, Condition: '' },
								{ Key: 'Hospital_Address', ShortKey: 'Hospital_Address', Name: 'Hospital Address', If_Short: false, Condition: '' },
                        { Key: 'createdAt', ShortKey: 'createdAt', Name: 'Created Date/Time', If_Short: false, Condition: '' } ];

   constructor(public Toastr: ToastrService,
               public ModalService: BsModalService,
               public Service: ReferralFacilityService,
               public route: Router,
               private renderer: Renderer) {
                  this.Service_Loader();
   }

   ngOnInit() {
      this.FilterFGroup = new FormGroup({
         Hospital_Name: new FormControl(''),
         Hospital_Type: new FormControl(''),
			Hospital_Address: new FormControl(''),
         FromDate: new FormControl(null),
         ToDate: new FormControl(null)
      });

      const FilterControls = this.FilterFGroup.controls;
      Object.keys(FilterControls).map(obj => {
         this.FilterFGroup.controls[obj].valueChanges.subscribe(value => {
            this.FilterFormChanges();
         });
      });
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

   Service_Loader() {
      let ShortOrderKey = '';
      let ShortOrderCondition = '';
      this.THeaders.map(obj => {
         if (obj.If_Short === true) { ShortOrderKey = obj.ShortKey; ShortOrderCondition = obj.Condition;  }
      });
      const Filters = this.FiltersArray.filter(obj => obj.Active === true);
      const Data = { Skip_Count: this.SkipCount, Limit_Count: this.LimitCount, FilterQuery: Filters,  ShortKey: ShortOrderKey, ShortCondition: ShortOrderCondition };
      this.TableLoader();
      this.Service.ReferralFacilities_List(Data).subscribe(response => {
         this.PageLoader = false;
         this.SerialNoAddOn = this.SkipCount;
         if (response.Status && response.Status === true ) {
            this.ReferralFacilitiesListData = response.Response;
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
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Referral Facility Records Getting Error!, But not Identify!' });
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

   CreateReferralFacility() {
      const initialState = { Type: 'Create' };
      this.modalReference = this.ModalService.show(ModalReferralFacilityComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight' }));
      this.modalReference.content.onClose.subscribe(response => {
         if (response.Status) {
            this.Pagination_Action(1);
         }
      });
   }

   EditReferralFacility(index: any) {
      const initialState = {
         Type: 'Edit',
         Data: this.ReferralFacilitiesListData[index]
      };
      this.modalReference = this.ModalService.show(ModalReferralFacilityComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight' }));
      this.modalReference.content.onClose.subscribe(response => {
         if (response.Status) {
            this.ReferralFacilitiesListData[index] = response.Response;
         }
      });
   }

	ReferralFacilityName(key: string) {
		if (key !== '') {
			return this.HospitalTypes.find(obj => obj.Key === key).Name;
		} else {
			return key;
		}
	}

}
