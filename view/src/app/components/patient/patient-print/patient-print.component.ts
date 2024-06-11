import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { DataPassingService } from './../../../services/common-services/data-passing.service';
// import { PatientDetailsService } from '../../../services/patient-management/patient-details/patient-details.service';
import { UnderProcessService } from './../../../services/under-process/under-process.service';
import { ClusterManagementService } from './../../../services/cluster-management/cluster-management.service';
import { LoginManagementService } from './../../../services/login-management/login-management.service';
import { filter } from 'rxjs/operators';
// import { ToastrService } from '../../../../services/common-services/toastr.service';


import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { Subscription } from 'rxjs/internal/Subscription';
import { PrintService } from 'src/app/services/patient-management/patient-print/print.service';
@Component({
    selector: 'app-patient-print',
    templateUrl: './patient-print.component.html',
    styleUrls: ['./patient-print.component.css']})
    export class PatientPrintComponent implements OnInit, OnDestroy {

      private subscription: Subscription = new Subscription();

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
      PatientService: any;
      PatientDetails: any;
      CheckListId = null;
      TransportationId = null;
      CardiacHistoryId = null;
      CoMorbidConditionId = null;
      ContactId = null;


      Basic: any;
      FibrinolyticChecklist: any;
      MedicationTransportation: any;
      CardiacHistory: any;
      CoMorbidCondition: any;
      ContactDetails: any;
      ThrombolysisMedication: any;
      Thrombolysis: any;
      PCIDrugBeforePci: any;
      Pci: any;
      PciMedicationInCath: any;
      LabReport: any;
      MedicationInHospital: any;
      AdverseEvents: any;
      TransferDeath: any;
      TransferMedications: any;
      Transfer: any;
      FollowUpDetails: any;
      FollowUpMedications: any;
      FollowUpEvents: any;
      Toastr: any;

      constructor(private router: Router,
                  private LoginService: LoginManagementService,
                  private DataPassService: DataPassingService,
                  private activatedRoute: ActivatedRoute,
                  private ClusterService: ClusterManagementService,
                  private UnderProcess: UnderProcessService,
                  private PrintsService: PrintService,
                  ) {
         this.UserInfo = JSON.parse(this.LoginService.LoginUser_Info());

         this.subscription.add(
            this.router.events.pipe(filter((event: any) => event instanceof NavigationEnd)).subscribe((event) => {
               this.PatientName = '';
               this.UrlParams = this.activatedRoute.snapshot.params;
               this.RoutesArray = this.router.url.split('/');
               const DataObj = {
                  PatientId: this.UrlParams.Patient,
                  Cluster: this.UserInfo.Cluster,
                  Hospital: this.UserInfo.Hospital,
                  ClustersArray: this.UserInfo.ClustersArray,
                  User: this.UserInfo._id,
                  User_Type: this.UserInfo.User_Type };
               this.PrintsService.Patient_PrintDetails(DataObj).subscribe( response =>  {
                  if (response.Status && response.Status === true ) {
                     this.PatientDetails = response.Response;
                     this.Basic = response.Response.Basic;
                     this.CardiacHistory = response.Response.CardiacHistory;
                     this.FibrinolyticChecklist = response.Response.FibrinolyticChecklist;
                     this.MedicationTransportation = response.Response.MedicationTransportation;
                     this.CoMorbidCondition = response.Response.CoMorbidCondition;
                     this.ContactDetails = response.Response.ContactDetails;
                     this.ThrombolysisMedication = response.Response.ThrombolysisMedication;
                     this.Thrombolysis = response.Response.Thrombolysis;
                     this.PCIDrugBeforePci = response.Response.PCIDrugBeforePci;
                     this.Pci = response.Response.Pci;
                     this.PciMedicationInCath = response.Response.PciMedicationInCath;
                     this.LabReport = response.Response.LabReport;
                     this.MedicationInHospital = response.Response.MedicationInHospital;
                     this.AdverseEvents = response.Response.AdverseEvents;
                     this.TransferDeath = response.Response.TransferDeath;
                     this.TransferMedications = response.Response.TransferMedications;
                     this.Transfer = response.Response.Transfer;
                     this.FollowUpDetails = response.Response.FollowUpDetails;
                     this.FollowUpMedications = response.Response.FollowUpMedications;
                     this.FollowUpEvents = response.Response.FollowUpEvents;

                     if (this.CardiacHistory !== null && this.CardiacHistory.Location_of_Pain !== undefined && this.CardiacHistory.Location_of_Pain !== '') {
                        let Arr = this.CardiacHistory.Location_of_Pain.split(',');
                        Arr = Arr.map(obj => {
                          obj = obj.replace('_', ' ');
                          return obj;
                        });
                        this.CardiacHistory.Location_of_Pain = Arr.join(', ');
                     }
                  } else if (!response.Status && response.ErrorCode === 400 || response.ErrorCode === 401 || response.ErrorCode === 417) {
                     if (response.ErrorMessage === undefined || response.ErrorMessage === '' || response.ErrorMessage === null) {
                        response.ErrorMessage = 'Some Error Occoured!, But not Identified.';
                     }
                     this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.ErrorMessage });
                  } else {
                     this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Patient Records Getting Error!, But not Identify!' });
                  }
               });
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
      }

      ngOnInit() {

         if (this.UserInfo.User_Type === 'PU') {
            forkJoin(
               this.ClusterService.ClusterBased_ControlPanelFields({Cluster_Id: this.UserInfo.Cluster._id}),
               this.UnderProcess.All_Validations()
            ).subscribe( ([Res1, Res2]) => {
               if (Res1.Status && Res2.Status) {
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
                  this.AllFields = Res1.Response;
                  this.DataPassService.UpdateAllFieldsData(Res1.Response);
                  this.DataPassService.UpdateAllValidationsData(Res2.Response);
               } else {
                  console.log('Some Error Occurred!');
               }
            });
         }

      }

      ngOnDestroy() {
         this.subscription.unsubscribe();
      }

      Thrombolysis_PCI_Hidden() {
         this.RouteMapArr[1].Visibility = false;
         this.RouteMapArr[2].Visibility = false;

         this.RouteMapArr[3].left = '35%';
         this.RouteMapArr[3].activeWidth = '36%';
         this.RouteMapArr[4].left = '65%';
         this.RouteMapArr[4].activeWidth = '66%';
      }

      PCI_Hidden() {
         this.RouteMapArr[2].Visibility = false;
         this.RouteMapArr[1].left = '27.5%';
         this.RouteMapArr[1].activeWidth = '28.5%';
         this.RouteMapArr[3].left = '50%';
         this.RouteMapArr[3].activeWidth = '51%';
         this.RouteMapArr[4].left = '72.5%';
         this.RouteMapArr[4].activeWidth = '73.5%';
      }

      checkVisibility(Key: any): boolean {
         const Index = this.RouteMapArr.findIndex(obj => obj.Menu === Key);
         return this.RouteMapArr[Index].Visibility;
      }

		checkFieldVisibility(Key: any): boolean {
         const Index = this.AllFields.findIndex(obj => obj.Key_Name === Key);
         return Index >= 0 ? this.AllFields[Index].Visibility : true;
      }

		CheckSubCategoryVisibility(SubCategory: any) {
			const KeyData = this.AllFields.filter(obj => obj.Sub_Category === SubCategory && obj.Visibility === true);
			return KeyData.length > 0 ? true : false;
		}
	
		CheckSubJuniorCategoryVisibility(SubJuniorCategory: any) {
			const KeyData = this.AllFields.filter(obj => obj.Sub_Junior_Category === SubJuniorCategory && obj.Visibility === true);
			return KeyData.length > 0 ? true : false;
		}

      getLeft(Key: any): any {
         const Index = this.RouteMapArr.findIndex(obj => obj.Menu === Key);
         return this.RouteMapArr[Index].left;
      }
      Print_Details(PrintForm) {
         const printContents = document.getElementById(PrintForm).innerHTML;
         const originalContents = document.body.innerHTML;
         document.body.innerHTML = printContents;
         window.print();
         document.body.innerHTML = originalContents;
      }
}
