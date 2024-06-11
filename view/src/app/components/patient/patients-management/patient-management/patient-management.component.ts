import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

import { DataPassingService } from './../../../../services/common-services/data-passing.service';
import { UnderProcessService } from './../../../../services/under-process/under-process.service';
import { ClusterManagementService } from './../../../../services/cluster-management/cluster-management.service';
import { LoginManagementService } from './../../../../services/login-management/login-management.service';
import { Subscription, forkJoin } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PatientDetailsService } from 'src/app/services/patient-management/patient-details/patient-details.service';


@Component({
  selector: 'app-patient-management',
  templateUrl: './patient-management.component.html',
  styleUrls: ['./patient-management.component.css']
})
export class PatientManagementComponent implements OnInit, OnDestroy {

   private subscription: Subscription = new Subscription();

   StaticRouteMapArr = [
      { Menu : 'Patient-Details', Visibility: true, left: '5%', activeWidth: '6%' },
      { Menu : 'Thrombolysis', Visibility: true, left: '23%', activeWidth: '24%' },
      { Menu : 'PCI', Visibility: true, left: '41%', activeWidth: '42%' },
      { Menu : 'Hospital-Summary', Visibility: true, left: '59%', activeWidth: '60%' },
      { Menu : 'Discharge-Transfer', Visibility: true, left: '77%', activeWidth: '78%' },
      { Menu : 'Follow-Up', Visibility: true, left: '95%', activeWidth: '96%' }
   ];
   RouteMapArr = [
      { Menu : 'Patient-Details', Visibility: true, left: '5%', activeWidth: '6%' },
      { Menu : 'Thrombolysis', Visibility: true, left: '23%', activeWidth: '24%' },
      { Menu : 'PCI', Visibility: true, left: '41%', activeWidth: '42%' },
      { Menu : 'Hospital-Summary', Visibility: true, left: '59%', activeWidth: '60%' },
      { Menu : 'Discharge-Transfer', Visibility: true, left: '77%', activeWidth: '78%' },
      { Menu : 'Follow-Up', Visibility: true, left: '95%', activeWidth: '96%' }
   ];

   ActiveWidth = '6%';

   AllValidations: any[] = [];
   AllFields: any[] = [];
   AllFieldsValues: any[] = [];

   UserInfo: any;

   RoutesArray = null;
   UrlParams: any;

   PatientName = '';
   PatientUnique = '';
   InitialHospital = null;

   IfPostThrombolysis = false;

   TransferDeath = false;
   TransferHome = false;

   DisableFollowUp = true;

   PageLoading = true;
   ContentLoading = true;

   Basic: any;
   Thrombolysis: any;
   Pci: any;
   LabReport: any;
   DischargeDeath: any;
   Transfer: any;
   FollowUps: any;

   constructor(private router: Router,
               private LoginService: LoginManagementService,
               private DataPassService: DataPassingService,
               private activatedRoute: ActivatedRoute,
               private ClusterService: ClusterManagementService,
               private PatientService: PatientDetailsService,
               private UnderProcess: UnderProcessService) {
      this.UserInfo = JSON.parse(this.LoginService.LoginUser_Info());

      this.subscription.add(
         this.router.events.pipe(filter((event: any) => event instanceof NavigationEnd)).subscribe((event) => {
            this.PatientName = '';
            this.UrlParams = this.activatedRoute.snapshot.children[0].params;
            this.RoutesArray = this.router.url.split('/');
            if (this.RoutesArray[1] && (this.RoutesArray[1] === 'Patient-Manage' || this.RoutesArray[1] === 'Patient-View' || this.RoutesArray[1] === 'Patient-Print' )) {
               const Index = this.RouteMapArr.findIndex(obj => obj.Menu === this.RoutesArray[2]);
               this.ActiveWidth = this.RouteMapArr[Index].activeWidth;
            }
         })
      );
      this.subscription.add(
         this.DataPassService.AllFieldsValues.subscribe( response => {
            this.AllFieldsValues = response;
         })
      );
      this.subscription.add(
         this.DataPassService.PatientName.subscribe( response => {
            this.PatientName = response;
         })
      );
      this.subscription.add(
         this.DataPassService.PatientUnique.subscribe( response => {
            this.PatientUnique = response;
         })
      );

      this.subscription.add(
         this.DataPassService.TransferDeath.subscribe( response => {
            this.TransferDeath = response;
            if (this.TransferDeath === false && this.TransferHome) {
               this.DisableFollowUp = false;
            } else {
               this.DisableFollowUp = true;
            }
         })
      );

      this.subscription.add(
         this.DataPassService.TransferHome.subscribe( response => {
            this.TransferHome = response;
            if (this.TransferDeath === false && this.TransferHome) {
               this.DisableFollowUp = false;
            } else {
               this.DisableFollowUp = true;
            }
         })
      );
   }

   ngOnInit() {
      if (this.UserInfo.User_Type === 'PU') {
         if (this.UserInfo.Hospital.Hospital_Role === 'EMS' ) {
            this.EMS_Login_Hidden();
         } else if (this.UserInfo.Hospital.Hospital_Role === 'Spoke S2') {
            this.Thrombolysis_PCI_Hidden();
         } else if (this.UserInfo.Hospital.Hospital_Role === 'Spoke S1') {
            this.PCI_Hidden();
         }
         forkJoin(
            this.ClusterService.ClusterBased_ControlPanelFields({Cluster_Id: this.UserInfo.Cluster._id}),
            this.UnderProcess.All_Validations()
         ).subscribe( ([Res1, Res2]) => {
            if (Res1.Status && Res2.Status) {
               this.PageLoading = false;
               this.AllFields = Res1.Response;
               this.DataPassService.UpdateAllFieldsData(Res1.Response);
               this.DataPassService.UpdateAllValidationsData(Res2.Response);
            } else {
               console.log('Some Error Occurred!');
            }
         });
      } else {
         forkJoin(
            this.UnderProcess.All_Fields(),
            this.UnderProcess.All_Validations()
         ).subscribe( ([Res1, Res2]) => {
            if (Res1.Status && Res2.Status) {
               this.PageLoading = false;
               this.AllFields = Res1.Response;
               this.DataPassService.UpdateAllFieldsData(Res1.Response);
               this.DataPassService.UpdateAllValidationsData(Res2.Response);
            } else {
               console.log('Some Error Occurred!');
            }
         });
      }
      if (this.UrlParams.Patient !== undefined && this.UrlParams.Patient !== null && this.UrlParams.Patient !== '') {
         const DataObj = { PatientId: this.UrlParams.Patient};
         this.PatientService.AdmissionType(DataObj).subscribe( PatientResponse =>  {
            if (PatientResponse.Response !== null) {
               this.ContentLoading = false;
               this.Basic = PatientResponse.Response.Basic !== null ? PatientResponse.Response.Basic : null;
               if (this.UserInfo.User_Type === 'PU' && (this.UserInfo.Hospital.Hospital_Role === 'EMS' || this.UserInfo.Hospital.Hospital_Role === 'Spoke S2' || this.UserInfo.Hospital.Hospital_Role === 'Spoke S1')) {
                  let PCIHide = true;
                  let ThrombolysisHide = true;
                  if (PatientResponse.Response.Thrombolysis !== null || this.UserInfo.Hospital.Hospital_Role === 'Spoke S1' || this.Basic.Post_Thrombolysis === 'Yes') {
                     ThrombolysisHide = false;
                  }
                  if (PatientResponse.Response.PCI !== null) {
                     PCIHide = false;
                  }
                  if (this.RoutesArray[2] === 'Thrombolysis' && ThrombolysisHide) {
                     this.router.navigate(['/Patient-Records']);
                  }
                  if (this.RoutesArray[2] === 'PCI' && PCIHide) {
                     this.router.navigate(['/Patient-Records']);
                  }
                  if (ThrombolysisHide && PCIHide && this.UserInfo.Hospital.Hospital_Role !== 'EMS') {
                     this.Thrombolysis_PCI_Hidden();
                  }
                  if (this.UserInfo.Hospital.Hospital_Role === 'EMS') {
                     this.EMS_Login_Hidden();
                  }
                  if (!ThrombolysisHide && PCIHide && this.UserInfo.Hospital.Hospital_Role !== 'EMS') {
                     this.PCI_Hidden();
                  }
                  if (ThrombolysisHide && !PCIHide && this.UserInfo.Hospital.Hospital_Role !== 'EMS') {
                     this.Thrombolysis_Hidden();
                  }
                  if (!ThrombolysisHide && !PCIHide) {
                     this.RouteMapArr = JSON.parse(JSON.stringify(this.StaticRouteMapArr));
                     const Index = this.RouteMapArr.findIndex(obj => obj.Menu === this.RoutesArray[2]);
                     this.ActiveWidth = this.RouteMapArr[Index].activeWidth;
                  }
               } else if ( this.UserInfo.User_Type !== 'PU' && this.Basic !== null) {
                  if (this.Basic.Initiated_Hospital.Hospital_Role === 'EMS' ) {
                     if (this.RoutesArray[2] === 'Thrombolysis' || this.RoutesArray[2] === 'PCI' || this.RoutesArray[2] === 'Hospital-Summary' || this.RoutesArray[2] === 'Follow-Up') {
                        this.router.navigate(['/Patient-Records']);
                     }
                     this.EMS_Login_Hidden();
                  } else if ( this.Basic.Initiated_Hospital.Hospital_Role === 'Spoke S2') {
                     if (this.RoutesArray[2] === 'Thrombolysis' || this.RoutesArray[2] === 'PCI') {
                        this.router.navigate(['/Patient-Records']);
                     }
                     this.Thrombolysis_PCI_Hidden();
                  } else if (this.Basic.Initiated_Hospital.Hospital_Role === 'Spoke S1') {
                     if (this.RoutesArray[2] === 'PCI') {
                        this.router.navigate(['/Patient-Records']);
                     }
                     this.PCI_Hidden();
                  }
               }
               if (this.Basic.Post_Thrombolysis && this.Basic.Post_Thrombolysis_Data && this.Basic.Post_Thrombolysis === 'Yes' && this.Basic.Post_Thrombolysis_Data !== null) {
                  this.IfPostThrombolysis = true;
               } else {
                  this.Thrombolysis = PatientResponse.Response.Thrombolysis !== null ? PatientResponse.Response.Thrombolysis : null;
               }
               this.Pci = PatientResponse.Response.PCI !== null ? PatientResponse.Response.PCI : null;
               this.LabReport = PatientResponse.Response.LabReport !== null ? PatientResponse.Response.LabReport : null;
               this.DischargeDeath = PatientResponse.Response.DischargeDeath !== null ? PatientResponse.Response.DischargeDeath : null;
               this.Transfer = PatientResponse.Response.Transfer !== null ? PatientResponse.Response.Transfer : null;
               this.FollowUps = PatientResponse.Response.FollowUps !== null ? PatientResponse.Response.FollowUps : null;
               if (this.DischargeDeath !== null && this.DischargeDeath.Discharge_Transfer_Death === 'Yes') {
                  this.TransferDeath = true;
               }
               if (this.Transfer !== null && (this.Transfer.Discharge_Transfer_To === 'Non_Stemi_Cluster' || this.Transfer.Discharge_Transfer_To === 'Home' || this.Transfer.Discharge_Transfer_To === 'Step_Down_Facility') ) {
                  this.TransferHome = true;
               }
               if (!this.TransferDeath && this.TransferHome) {
                  this.DisableFollowUp = false;
               } else {
                  if (this.RoutesArray[2] === 'Follow-Up') {
                     this.router.navigate(['/Patient-Records']);
                  } else {
                     this.DisableFollowUp = true;
                  }
               }
            } else {
               this.ContentLoading = false;
            }
         });
      } else {
         this.ContentLoading = false;
      }

   }

   ngOnDestroy() {
      this.subscription.unsubscribe();
   }

   Thrombolysis_PCI_Hidden() {
      this.RouteMapArr = JSON.parse(JSON.stringify(this.StaticRouteMapArr));
      this.RouteMapArr[1].Visibility = false;
      this.RouteMapArr[2].Visibility = false;

      this.RouteMapArr[3].left = '35%';
      this.RouteMapArr[3].activeWidth = '36%';
      this.RouteMapArr[4].left = '65%';
      this.RouteMapArr[4].activeWidth = '66%';
      const Index = this.RouteMapArr.findIndex(obj => obj.Menu === this.RoutesArray[2]);
      this.ActiveWidth = this.RouteMapArr[Index].activeWidth;

   }

   Thrombolysis_Hidden() {
      this.RouteMapArr = JSON.parse(JSON.stringify(this.StaticRouteMapArr));
      this.RouteMapArr[1].Visibility = false;
      this.RouteMapArr[2].left = '27.5%';
      this.RouteMapArr[2].activeWidth = '28.5%';
      this.RouteMapArr[3].left = '50%';
      this.RouteMapArr[3].activeWidth = '51%';
      this.RouteMapArr[4].left = '72.5%';
      this.RouteMapArr[4].activeWidth = '73.5%';
      const Index = this.RouteMapArr.findIndex(obj => obj.Menu === this.RoutesArray[2]);
      this.ActiveWidth = this.RouteMapArr[Index].activeWidth;
   }

   PCI_Hidden() {
      this.RouteMapArr = JSON.parse(JSON.stringify(this.StaticRouteMapArr));
      this.RouteMapArr[2].Visibility = false;
      this.RouteMapArr[1].left = '27.5%';
      this.RouteMapArr[1].activeWidth = '28.5%';
      this.RouteMapArr[3].left = '50%';
      this.RouteMapArr[3].activeWidth = '51%';
      this.RouteMapArr[4].left = '72.5%';
      this.RouteMapArr[4].activeWidth = '73.5%';
      const Index = this.RouteMapArr.findIndex(obj => obj.Menu === this.RoutesArray[2]);
      this.
      ActiveWidth = this.RouteMapArr[Index].activeWidth;
   }

   EMS_Login_Hidden() {
      this.RouteMapArr = JSON.parse(JSON.stringify(this.StaticRouteMapArr));
      this.RouteMapArr[1].Visibility = false;
      this.RouteMapArr[2].Visibility = false;
      this.RouteMapArr[3].Visibility = false;
      this.RouteMapArr[5].Visibility = false;
      this.RouteMapArr[0].left = '25%';
      this.RouteMapArr[0].activeWidth = '26%';
      this.RouteMapArr[4].left = '75%';
      this.RouteMapArr[4].activeWidth = '76%';
      const Index = this.RouteMapArr.findIndex(obj => obj.Menu === this.RoutesArray[2]);
      this.ActiveWidth = this.RouteMapArr[Index].activeWidth;
   }

   checkVisibility(Key: any): boolean {
      const Index = this.RouteMapArr.findIndex(obj => obj.Menu === Key);
      return this.RouteMapArr[Index].Visibility;
   }

   getLeft(Key: any): any {
      const Index = this.RouteMapArr.findIndex(obj => obj.Menu === Key);
      return this.RouteMapArr[Index].left;
   }

}
