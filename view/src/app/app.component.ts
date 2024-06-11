import { Component, ViewChild, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd, RoutesRecognized } from '@angular/router';
import { MatSidenav } from '@angular/material';

import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';

import { filter, pairwise } from 'rxjs/operators';
import { BsModalRef, BsModalService} from 'ngx-bootstrap';

import { ToastrService } from './services/common-services/toastr.service';
import { LoginManagementService } from './services/login-management/login-management.service';
import { DataPassingService } from './services/common-services/data-passing.service';
import { EcgFileManagementComponent } from './components/Modals/ecg-file-management/ecg-file-management.component';
import { PatientDetailsService } from './services/patient-management/patient-details/patient-details.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit{

   @ViewChild('SideNav') SideNav: MatSidenav;

   showGroup = true;

   UserLoggedIn: boolean;

   UserInfo: any;

   ToastrList: any[] = [];
   modalReference: BsModalRef;
   CurrentIndex = 1;
   SkipCount = 0;
   SerialNoAddOn = 0;
   LimitCount = 5;
   ShowingText = 'Showing <span>0</span> to <span>0</span> out of <span>0</span> entries';
   PagesArray = [];
   LastCreation: Date = new Date();
   PagePrevious: object = { Disabled: true, value : 0, Class: 'PageAction_Disabled'};
   PageNext: object = { Disabled: true, value : 0, Class: 'PageAction_Disabled'};
   SubLoader = false;
   GoToPage = null;
   UrlParams: any;

   ECGView = false;
   PageType = 'View';

   innerWidth: any;

   Notification: any[] = [];
   ShowNotification = false;
   ShowNotifyPanel = false;
   NotifyCount = 0;
   SideNameMode = 'side';

   @HostListener('window:resize', ['$event'])
   onResize(event) {
      this.innerWidth = window.innerWidth;
      if (this.innerWidth < 992) {
         this.SideNameMode = 'over'
      } else {
         this.SideNameMode = 'side';
      }   }


   constructor(private router: Router,
               private LoginService: LoginManagementService,
               public Toastr: ToastrService,
               private DataPassing: DataPassingService,
               public ModalService: BsModalService,
               private PatientService: PatientDetailsService
               ) {

      this.DataPassing.UpdateAllValidationsData([]);
      this.DataPassing.UpdateAllFieldsData([]);
      this.DataPassing.UpdateAllFieldValuesData([]);
      this.DataPassing.UpdatePatientNameData('');
      this.DataPassing.UpdatePatientUniqueData('');


      // Find Page Url
      router.events.subscribe(event => {
         if (event instanceof NavigationEnd ) {
            if (event.url === '/Login' || event.url === '/Hospital-Apply' || event.url === '/' ) {
               this.UserLoggedIn = false;
               this.SideNav.close();
            } else {
               this.UserInfo = JSON.parse(this.LoginService.LoginUser_Info());
               if (this.UserInfo.User_Type === 'PU') {
                  this.ShowNotification = true;
                  this.GetNotifyCount();
               } else {
                  this.ShowNotification = false;
               }
               this.UserLoggedIn = true;
               if (sessionStorage.getItem('NavOpen') && sessionStorage.getItem('NavOpen') === 'No') {
                  this.SideNav.close();
               } else {
                  this.SideNav.open();
               }
            }
         }
      });
      // Patient Management Restrictions
      this.router.events.pipe(filter((e: any) => e instanceof RoutesRecognized), pairwise() ).subscribe((e: any) => {
         const PreviousRoutsArr = e[0].urlAfterRedirects.split('/');
         const CurrentRoutsArr = e[1].urlAfterRedirects.split('/');
         if (PreviousRoutsArr[1] && (PreviousRoutsArr[1] === 'Patient-Manage' || PreviousRoutsArr[1] === 'Patient-View') && CurrentRoutsArr[1] && (CurrentRoutsArr[1] !== 'Patient-Manage' && CurrentRoutsArr[1] !== 'Patient-View')) {
            this.DataPassing.UpdateAllValidationsData([]);
            this.DataPassing.UpdateAllFieldsData([]);
            this.DataPassing.UpdateAllFieldValuesData([]);
            this.DataPassing.UpdatePatientNameData('');
            this.DataPassing.UpdatePatientUniqueData('');
         }
      });
      // ECG Handling 
      this.router.events.pipe(filter((event: any) => event instanceof NavigationEnd)).subscribe((event) => {
         const RoutesArray = this.router.url.split('/');
         if (RoutesArray.length > 3 && RoutesArray[1] && (RoutesArray[1] === 'Patient-Manage' || RoutesArray[1] === 'Patient-View' )) {
            if (RoutesArray[3] && RoutesArray[3] !== null && RoutesArray[3] !== '') {
               this.UrlParams = {Patient: RoutesArray[3] };
               this.ECGView = true;
               this.PageType = RoutesArray[1] === 'Patient-View' ? 'View' : 'Edit';
            } else {
               this.ECGView = false;
            }
         } else {
            this.ECGView = false;
         }
      })
      // Toastr Message
      this.Toastr.WaitingToastr.subscribe(Message => {
         setTimeout(() => {
            this.ToastrList.push(Message);
            this.RefreshToastrPosition();
            setTimeout(() => {
               this.ToastrList.splice(0, 1);
               this.RefreshToastrPosition();
            }, 3000);
         }, 100);
      });
   }

   ResetURL() {
      this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
         this.router.navigate(['/Patient-Manage/Patient-Details'])
      );
   }

   ngOnInit() {
      this.innerWidth = window.innerWidth;
      if (this.innerWidth < 991) {
         this.SideNameMode = 'over'
      } else {
         this.SideNameMode = 'side';
      }
   }

   HideToastr(index) {
      this.ToastrList[index].Type = 'Hidden';
      this.RefreshToastrPosition();
   }

   RefreshToastrPosition() {
      let Count = 0;
      this.ToastrList.map(toastr => {
         if (toastr.Type !== 'Hidden') {
            toastr.Top = Count * 80 + 10 ; Count = Count + 1;
         }
      });
   }
   ViewECG() {
      const initialState = { UrlParams: this.UrlParams, PageType: this.PageType };
      this.modalReference = this.ModalService.show(EcgFileManagementComponent, Object.assign({initialState}, {ignoreBackdropClick: true, class: 'modal-dialog-centered animated bounceInRight' }));
   }

   GetNotifyCount() {
      const data = { User: this.UserInfo._id, User_Type: this.UserInfo.User_Type };
      this.PatientService.Notification_Counts(data).subscribe( CountResponse =>  {
         if (CountResponse.Status) {
            this.NotifyCount = CountResponse.Response;
         } else {
            this.NotifyCount = 0;
         }
      });
   }
   GetNotificationList() {
      const data = { User: this.UserInfo._id, User_Type: this.UserInfo.User_Type };
      this.PatientService.AllNotification_List(data).subscribe( NewResponse => {
         if (NewResponse.Status) {
            this.Notification = NewResponse.Response;
         } else {
            this.Notification = [];
         }
      });
   }
   View_Notification(Id: any) {
      const data = { NotificationId: Id };
      this.PatientService.Notifications_Viewed(data).subscribe( NewResponse => {
         if (NewResponse.Status) {
            this.GetNotificationList();
            this.GetNotifyCount();
         }
      });
   }

   NotifyPanelToggle() {
      this.ShowNotifyPanel = !this.ShowNotifyPanel;
   }


   Redirect(_id: any) {
      if (_id !== undefined && _id !== null && _id !== '') {
         const RoutesArray = this.router.url.split('/');
         if (RoutesArray[1] === 'Patient-Manage' && (RoutesArray[3] && RoutesArray[3] !== null && RoutesArray[3] !== '')) {
            if (RoutesArray[3] !== _id) {
               this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                  this.router.navigate(['/Patient-Manage/Patient-Details', _id])
               );
            }
         } else {
            this.router.navigate(['/Patient-Manage/Patient-Details', _id]);
         }
      }
   }

   DeleteNotification() {
      this.PatientService.Viewed_Notifications_Delete({User: this.UserInfo._id}).subscribe(response => {
         this.Notification = [];
         if (response.Status) {
            this.Notification = response.Response;
         }
      });
      this.GetNotifyCount();
   }

   SideNavToggle() {
      if (this.SideNav.opened) {
         this.SideNav.close();
         sessionStorage.setItem('NavOpen', 'No');
      } else {
         this.SideNav.open();
         sessionStorage.setItem('NavOpen', 'Yes');
      }
   }

   LogOut() {
      localStorage.clear();
      this.router.navigate(['/Login']);
   }

}
