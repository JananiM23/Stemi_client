import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { MapsAPILoader } from '@agm/core';
declare var google: any; // @types/googlemaps;

import domtoimage from 'dom-to-image';
import * as jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { BsModalRef, BsModalService} from 'ngx-bootstrap';

import { LocationService } from '../.../../../../services/location-management/location.service';
import { ClusterManagementService } from '../.../../../../services/cluster-management/cluster-management.service';
import { ToastrService } from '../../../services/common-services/toastr.service';
import { Observable, interval } from 'rxjs';
import { startWith, map, take } from 'rxjs/operators';


export interface Locations { _id: string; Location_Name: string; }
export interface Clusters { _id: string; Cluster_Name: string; }
export interface MarkerRoutes { Route_From: { lat: number; lng: number };
                              Route_To: { lat: number; lng: number };
                              Route_Data: { Distance: string; Duration: string; Distance_Value: number; Duration_Value: number; To_Data: any; };
                              RenderOptions: any; Visible: boolean; Others: { BestRoute: false; }; }
export interface Marker {  Latitude: number; Longitude: number; Icon: string; Data: any;
                           If_ClusterLinked: boolean;
                           ShowConnected_Route: boolean;
                           ShowPossible_Routes: boolean;
                           If_Spokes: boolean;
                           If_AllRoutes: boolean;
                           Routes_Type: string; // All, AllSpokes,  AllPossibles, Connected, AllPossiblesAndConnected
                           Connected_Route: MarkerRoutes;
                           Possible_Routes: MarkerRoutes[];
                           Spokes: MarkerRoutes[];
                           All_Routes: MarkerRoutes[];
                           ShowInfo: boolean; ConnectConfirm: boolean; RemoveConfirm: boolean;
                        }


@Component({
  selector: 'app-cluster-mapping',
  templateUrl: './cluster-mapping.component.html',
  styleUrls: ['./cluster-mapping.component.css']
})
export class ClusterMappingComponent implements OnInit {

   latitude = 11.015282;
   longitude = 76.96136690000003;
   zoom = 10;

   @ViewChild('AgmMap') AgmMap: any;
   public mapStyles = [ { featureType: 'poi', elementType: 'labels', stylers: [ { visibility: 'off' }] },
                        { featureType: 'poi.medical', elementType: 'labels', stylers: [ { visibility: 'on' }] } ];

   InfoWindowFullscreen = true;

   modalReference: BsModalRef;
   DownloadBtn = true;

   LocationsList: Locations[] = [];
   filteredLocationsList: Observable<Locations[]>;
   LastSelectedLocation = null;
   ClustersList: Clusters[] = [];
   filteredClustersList: Observable<Clusters[]>;
   LastSelectedCluster = null;

   ClusterDetails: any;

   MarkersData: any[] = [];

   ConfirmationData =  { SubIndex: null };


   FilterForm: FormGroup;

   constructor(public mapsAPILoader: MapsAPILoader,
               public LocService: LocationService,
               public Toastr: ToastrService,
               public ModalService: BsModalService,
               private matIconRegistry: MatIconRegistry,
               private domSanitizer: DomSanitizer,
               public ClusterService: ClusterManagementService) {
      this.matIconRegistry.addSvgIcon( 'car', this.domSanitizer.bypassSecurityTrustResourceUrl('../../../../assets/images/svg/car.svg'));
      this.matIconRegistry.addSvgIcon( 'schedule', this.domSanitizer.bypassSecurityTrustResourceUrl('../../../../assets/images/svg/schedule.svg'));

      this.LocService.StemiLocations_SimpleList({}).subscribe(response => {
         if (response.Status && response.Status === true ) {
            this.LocationsList = response.Response;
            setTimeout(() => {
               this.FilterForm.controls.Location.updateValueAndValidity();
            }, 100);
         } else if (!response.Status && response.ErrorCode === 400 || response.ErrorCode === 401 || response.ErrorCode === 417) {
            if (response.ErrorMessage === undefined || response.ErrorMessage === '' || response.ErrorMessage === null) {
               response.ErrorMessage = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.ErrorMessage });
         } else {
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Location Records Getting Error!, But not Identify!' });
         }
      });
   }

   ngOnInit() {

      this.FilterForm = new FormGroup({
         Location: new FormControl(null, Validators.required),
         Cluster: new FormControl(null)
      });
      this.AutocompleteFilters();
   }

   LocationDisplayName(Location: any) {
      return (Location && Location !== null && Location !== '') ? Location.Location_Name : null;
   }
   ClusterDisplayName(Cluster: any) {
      return (Cluster && Cluster !== null && Cluster !== '') ? Cluster.Cluster_Name : null;
   }
   AutocompleteFilters() {
      this.filteredLocationsList = this.FilterForm.controls.Location.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                  if (this.LastSelectedLocation === null || this.LastSelectedLocation !== value._id) {
                     this.LastSelectedLocation = value._id;
                     this.onSelectLocation(value._id);
                  }
                  value = value.Location_Name;
                  this.MarkersData = [];
               }
               return this.LocationsList.filter(option => option.Location_Name.toLowerCase().includes(value.toLowerCase()));
            } else {
               this.LastSelectedLocation = null;
               this.FilterForm.controls.Cluster.setValue(null);
               this.MarkersData = [];
               this.ClustersList = [];
               return this.LocationsList;
            }
         })
      );
      this.filteredClustersList = this.FilterForm.controls.Cluster.valueChanges.pipe(
         startWith(''), map(value => {
            if (value && value !== null && value !== '') {
               if ( typeof value === 'object') {
                  if (this.LastSelectedCluster === null || this.LastSelectedCluster !== value._id) {
                     this.LastSelectedCluster = value._id;
                     this.onSelectCluster(value._id);
                  }
                  value = value.Cluster_Name;
               }
               return this.ClustersList.filter(option => option.Cluster_Name.toLowerCase().includes(value.toLowerCase()));
            } else {
               this.LastSelectedCluster = null;
               this.MarkersData = [];
               return this.ClustersList;
            }
         })
      );
   }
   AutocompleteBlur(key: any) {
      setTimeout(() => {
         const value =  this.FilterForm.controls[key].value;
         if (!value || value === null || value === '' || typeof value !== 'object') {
            this.FilterForm.controls[key].setValue(null);
         }
      }, 500);
   }
   onSelectLocation(Location: any) {
      if (Location !== null && Location !== undefined && Location !== '') {
         this.ClusterService.ClustersSimpleList_LocationBased({ Location_Id: Location }).subscribe( response => {
            if (response.Status && response.Status === true ) {
               this.ClustersList = response.Response;
               setTimeout(() => {
                  this.FilterForm.controls.Cluster.updateValueAndValidity();
               }, 100);
            } else if (!response.Status && response.ErrorCode === 400 || response.ErrorCode === 401 || response.ErrorCode === 417) {
               if (response.ErrorMessage === undefined || response.ErrorMessage === '' || response.ErrorMessage === null) {
                  response.ErrorMessage = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.ErrorMessage });
            } else {
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Cluster Records Getting Error!, But not Identify!' });
            }
            this.FilterForm.controls.Cluster.setValue(null);
            this.MarkersData = [];
         });
      } else {
         this.FilterForm.controls.Cluster.setValue(null);
         this.MarkersData = [];
      }
   }
   onSelectCluster(Cluster: any) {
      if (Cluster !== null && Cluster !== undefined && Cluster !== '') {
         this.MarkersData = [];
         this.ClusterService.ClusterDetails_RequiredForMapping({ Cluster_Id: Cluster }).subscribe( response => {
            if (response.Status && response.Status === true ) {
               this.ClusterDetails = response.Response.ClusterDetails;
               const ClusterDetails = response.Response.ClusterDetails;
               const UnLinkedHospitals: any[] = response.Response.UnLinkedHospitals;
               const LinkedHospitals: any[] = response.Response.ClusterMappingDetails;
               const AllHospitals: any[] = response.Response.AllHospitals;
               if (this.ClusterDetails.Cluster_Type !== 'advanced') {
                  UnLinkedHospitals.map(obj => {
                     const markerIcon =   obj.Hospital_Role === 'Hub H1' ? 'assets/images/markers/H1.png' :
                                          obj.Hospital_Role === 'Hub H2' ? 'assets/images/markers/H2.png' :
                                          obj.Hospital_Role === 'Spoke S1' ? 'assets/images/markers/S1.png' :
                                          obj.Hospital_Role === 'Spoke S2' ? 'assets/images/markers/S2.png' :
                                          obj.Hospital_Role === 'EMS' ? 'assets/images/markers/E.png' : '';
                     const marker = {  Latitude: Number(obj.Latitude),
                                       Longitude: Number(obj.Longitude),
                                       Icon: markerIcon,
                                       Data: obj,
                                       If_ClusterLinked: false,
                                       ShowConnected_Route: false,
                                       ShowPossible_Routes: false,
                                       If_AllRoutes: false,
                                       If_Spokes: false,
                                       Routes_Type: '',
                                       Connected_Route: {  Route_From: { lat: 0, lng: 0},
                                                            Route_To: { lat: 0, lng: 0},
                                                            Route_Data: { Distance: '', Duration: '', Distance_Value: 0, Duration_Value: 0, To_Data: null},
                                                            RenderOptions: null, Visible: false, Others: { BestRoute: false } },
                                       Possible_Routes: [],
                                       Spokes: [],
                                       All_Routes: [],
                                       ShowInfo: false,
                                       ConnectConfirm: false,
                                       RemoveConfirm: false
                                    } as Marker;
                     const HubHospitals = [];
                     if (ClusterDetails.HospitalsArray && ClusterDetails.HospitalsArray !== null  && ClusterDetails.HospitalsArray.length > 0) {
                        ClusterDetails.HospitalsArray.map(objOne => { HubHospitals.push(objOne); });
                     }
                     if (ClusterDetails.Hospital && ClusterDetails.Hospital !== null) {
                        HubHospitals.push(ClusterDetails.Hospital);
                     }
                     marker.ShowPossible_Routes = HubHospitals.length > 0 ? true : false;
                     HubHospitals.map( (objOne, i) => {
                        const ClusterHub = { Route_From: { lat: Number(obj.Latitude), lng: Number(obj.Longitude) },
                                             Route_To: { lat: Number(objOne.Latitude), lng: Number(objOne.Longitude) },
                                             Route_Data: { Distance: '', Duration: '', Distance_Value: 0, Duration_Value: 0, To_Data: objOne },
                                             RenderOptions: {  suppressMarkers: true,
                                                               preserveViewport: true,
                                                               polylineOptions: {
                                                                  strokeColor: '#007eff'
                                                               } },
                                             Visible: false,
                                             Others: { BestRoute: false }} as MarkerRoutes;
                        marker.Possible_Routes.push(ClusterHub);
                     });
                     this.MarkersData.push(marker);
                  });
               } else {
                  AllHospitals.map(obj => {
                     const IfTick = obj.If_Cluster_Mapped ? '-tick' : '';
                     const markerIcon =   obj.Hospital_Role === 'Hub H1' ? 'assets/images/markers/H1' + IfTick + '.png' :
                                          obj.Hospital_Role === 'Hub H2' ? 'assets/images/markers/H2' + IfTick + '.png' :
                                          obj.Hospital_Role === 'Spoke S1' ? 'assets/images/markers/S1' + IfTick + '.png' :
                                          obj.Hospital_Role === 'Spoke S2' ? 'assets/images/markers/S2' + IfTick + '.png' :
                                          obj.Hospital_Role === 'EMS' ? 'assets/images/markers/E' + IfTick + '.png' : '';
                     const marker = {  Latitude: Number(obj.Latitude),
                                       Longitude: Number(obj.Longitude),
                                       Icon: markerIcon,
                                       Data: obj,
                                       If_ClusterLinked: false,
                                       ShowConnected_Route: false,
                                       ShowPossible_Routes: false,
                                       If_AllRoutes: false,
                                       If_Spokes: false,
                                       Routes_Type: '',
                                       Connected_Route: {  Route_From: { lat: 0, lng: 0},
                                                            Route_To: { lat: 0, lng: 0},
                                                            Route_Data: { Distance: '', Duration: '', Distance_Value: 0, Duration_Value: 0, To_Data: null},
                                                            RenderOptions: null, Visible: false, Others: { BestRoute: false } },
                                       Possible_Routes: [],
                                       Spokes: [],
                                       All_Routes: [],
                                       ShowInfo: false,
                                       ConnectConfirm: false,
                                       RemoveConfirm: false
                                    } as Marker;
                     const HubHospitals = [];
                     if (ClusterDetails.HospitalsArray && ClusterDetails.HospitalsArray !== null  && ClusterDetails.HospitalsArray.length > 0) {
                        ClusterDetails.HospitalsArray.map(objOne => { HubHospitals.push(objOne); });
                     }
                     marker.ShowPossible_Routes = HubHospitals.length > 0 ? true : false;
                     HubHospitals.map( (objOne, i) => {
                        const ClusterHub = { Route_From: { lat: Number(obj.Latitude), lng: Number(obj.Longitude) },
                                             Route_To: { lat: Number(objOne.Latitude), lng: Number(objOne.Longitude) },
                                             Route_Data: { Distance: '', Duration: '', Distance_Value: 0, Duration_Value: 0, To_Data: objOne },
                                             RenderOptions: {  suppressMarkers: true,
                                                               preserveViewport: true,
                                                               polylineOptions: {
                                                                  strokeColor: '#007eff'
                                                               } },
                                             Visible: false,
                                             Others: { BestRoute: false }} as MarkerRoutes;
                        marker.Possible_Routes.push(ClusterHub);
                     });
                     this.MarkersData.push(marker);
                  });
               }

               LinkedHospitals.map(obj => {
                  let markerIcon =   obj.ClusterHospital.Hospital_Role === 'Hub H1' ? 'assets/images/markers/H1-tick.png' :
                                       obj.ClusterHospital.Hospital_Role === 'Hub H2' ? 'assets/images/markers/H2-tick.png' :
                                       obj.ClusterHospital.Hospital_Role === 'Spoke S1' ? 'assets/images/markers/S1-tick.png' :
                                       obj.ClusterHospital.Hospital_Role === 'Spoke S2' ? 'assets/images/markers/S2-tick.png' :
                                       obj.ClusterHospital.Hospital_Role === 'EMS' ? 'assets/images/markers/E-tick.png' : '';
                  markerIcon = (this.ClusterDetails.Cluster_Type === 'advanced') ? 'assets/images/markers/T-tick.png' : markerIcon;
                  const marker = {  Latitude: Number(obj.ClusterHospital.Latitude),
                                    Longitude: Number(obj.ClusterHospital.Longitude),
                                    Icon: markerIcon,
                                    Data: obj.ClusterHospital,
                                    If_ClusterLinked: true,
                                    ShowConnected_Route: false,
                                    ShowPossible_Routes: false,
                                    If_Spokes: false,
                                    If_AllRoutes: false,
                                    Routes_Type: '',
                                    Connected_Route: {  Route_From: { lat: 0, lng: 0},
                                                         Route_To: { lat: 0, lng: 0},
                                                         Route_Data: { Distance: '', Duration: '', Distance_Value: 0, Duration_Value: 0, To_Data: null},
                                                         RenderOptions: null, Visible: false, Others: { BestRoute: false }},
                                    Possible_Routes: [],
                                    Spokes: [],
                                    All_Routes: [],
                                    ShowInfo: false,
                                    ConnectConfirm: false,
                                    RemoveConfirm: false
                                 } as Marker;
                  if (this.ClusterDetails.Cluster_Type !== 'virtual') {
                     if (obj.ClusterHospital_Type === 'ClusterSpoke') {
                        marker.ShowConnected_Route = true;
                        marker.Connected_Route.Route_From.lat = Number(marker.Latitude);
                        marker.Connected_Route.Route_From.lng = Number(marker.Longitude);
                        marker.Connected_Route.Route_To.lat = Number(obj.Connected_ClusterHub.Latitude);
                        marker.Connected_Route.Route_To.lng = Number(obj.Connected_ClusterHub.Longitude);
                        marker.Connected_Route.Route_Data.Distance = '';
                        marker.Connected_Route.Route_Data.Duration = '';
                        marker.Connected_Route.Route_Data.Distance_Value = 0;
                        marker.Connected_Route.Route_Data.Duration_Value = 0;
                        marker.Connected_Route.Route_Data.To_Data = obj.Connected_ClusterHub;
                        marker.Connected_Route.RenderOptions = { suppressMarkers: true,
                                                                  preserveViewport: true,
                                                                  polylineOptions: {
                                                                     strokeColor: '#007eff'
                                                                  }};
                        LinkedHospitals.map(objOne => {
                           if (objOne.ClusterHospital_Type === 'ClusterHub' && obj.Connected_ClusterHub._id !== objOne.ClusterHospital._id) {
                              const ClusterHub = { Route_From: { lat: Number(obj.ClusterHospital.Latitude), lng: Number(obj.ClusterHospital.Longitude) },
                                                   Route_To: { lat: Number(objOne.ClusterHospital.Latitude), lng: Number(objOne.ClusterHospital.Longitude) },
                                                   Route_Data: { Distance: '', Duration: '', Distance_Value: 0, Duration_Value: 0, To_Data: objOne.ClusterHospital },
                                                   RenderOptions: { suppressMarkers: true,
                                                                     preserveViewport: true,
                                                                     polylineOptions: {
                                                                        strokeColor: '#007eff'
                                                                     } },
                                                   Visible: false,
                                                   Others: { BestRoute: false }} as MarkerRoutes;
                              marker.Possible_Routes.push(ClusterHub);
                              marker.ShowPossible_Routes = true;
                           }
                        });
                     }
                     if (obj.ClusterHospital_Type === 'ClusterHub') {
                        LinkedHospitals.map(objOne => {
                           if (objOne.ClusterHospital_Type === 'ClusterSpoke' && objOne.Connected_ClusterHub._id === obj.ClusterHospital._id) {
                              const ClusterSpoke = {  Route_From: { lat: Number(obj.ClusterHospital.Latitude), lng: Number(obj.ClusterHospital.Longitude) },
                                                      Route_To: { lat: Number(objOne.ClusterHospital.Latitude), lng: Number(objOne.ClusterHospital.Longitude) },
                                                      Route_Data: { Distance: '', Duration: '', Distance_Value: 0, Duration_Value: 0, To_Data: objOne.ClusterHospital },
                                                      RenderOptions: {  suppressMarkers: true,
                                                                        preserveViewport: true,
                                                                        polylineOptions: {
                                                                           strokeColor: '#007eff'
                                                                        } },
                                                      Visible: false,
                                                      Others: { BestRoute: false }} as MarkerRoutes;
                              marker.Spokes.push(ClusterSpoke);
                              marker.If_Spokes = true;
                           }
                        });
                     }
                     if (this.ClusterDetails.Cluster_Type === 'advanced') {
                        AllHospitals.map(objOne => {
                           const AllHospital = {  Route_From: { lat: Number(obj.ClusterHospital.Latitude), lng: Number(obj.ClusterHospital.Longitude) },
                                                   Route_To: { lat: Number(objOne.Latitude), lng: Number(objOne.Longitude) },
                                                   Route_Data: { Distance: '', Duration: '', Distance_Value: 0, Duration_Value: 0, To_Data: objOne },
                                                   RenderOptions: {  suppressMarkers: true,
                                                                     preserveViewport: true,
                                                                     polylineOptions: {
                                                                        strokeColor: '#007eff'
                                                                     } },
                                                   Visible: false,
                                                   Others: { BestRoute: false }} as MarkerRoutes;
                           marker.All_Routes.push(AllHospital);
                           marker.If_AllRoutes = true;
                        });
                     }
                  }
                  this.MarkersData.push(marker);
               });
               setTimeout(() => {
                  this.MarkersData.map(obj => {
                     if (obj.If_Spokes && obj.Spokes.length > 0) {
                        obj.Routes_Type = 'AllSpokes';
                     }
                  });
               }, 1000);
            } else if (!response.Status && response.ErrorCode === 400 || response.ErrorCode === 401 || response.ErrorCode === 417) {
               if (response.ErrorMessage === undefined || response.ErrorMessage === '' || response.ErrorMessage === null) {
                  response.ErrorMessage = 'Some Error Occoured!, But not Identified.';
               }
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.ErrorMessage });
            } else {
               this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Cluster Records Getting Error!, But not Identify!' });
            }
         });
      } else {
         this.FilterForm.controls.Cluster.setValue(null);
         this.MarkersData = [];
      }
   }

   FindIconUrl(Role: any, Type: any ) {
      if (Type === 'Tick') {
         return Role === 'Hub H1' ? 'assets/images/markers/H1-tick.png' :
         Role === 'Hub H2' ? 'assets/images/markers/H2-tick.png' :
         Role === 'Spoke S1' ? 'assets/images/markers/S1-tick.png' :
         Role === 'Spoke S2' ? 'assets/images/markers/S2-tick.png' :
         Role === 'EMS' ? 'assets/images/markers/E-tick.png' :
         Role === 'Tire2' ? 'assets/images/markers/T-tick.png' : '';
      } else if (Type === 'Circle') {
         return Role === 'Hub H1' ? 'assets/images/markers/H1-circle.png' :
         Role === 'Hub H2' ? 'assets/images/markers/H2-circle.png' :
         Role === 'Spoke S1' ? 'assets/images/markers/S1-circle.png' :
         Role === 'Spoke S2' ? 'assets/images/markers/S2-circle.png' :
         Role === 'EMS' ? 'assets/images/markers/E-circle.png' :
         Role === 'Tire2' ? 'assets/images/markers/T-circle.png' : '';
      } else {
         return Role === 'Hub H1' ? 'assets/images/markers/H1.png' :
         Role === 'Hub H2' ? 'assets/images/markers/H2.png' :
         Role === 'Spoke S1' ? 'assets/images/markers/S1.png' :
         Role === 'Spoke S2' ? 'assets/images/markers/S2.png' :
         Role === 'EMS' ? 'assets/images/markers/E.png' :
         Role === 'Tire2' ? 'assets/images/markers/T.png' : '';
      }
   }

   onResponseConnect(index: number, event: any) {
      if (event !== null && event.routes !== undefined) {
         this.MarkersData[index].Connected_Route.Route_Data.Distance = event.routes[0].legs[0].distance.text;
         this.MarkersData[index].Connected_Route.Route_Data.Duration = event.routes[0].legs[0].duration.text;
         this.MarkersData[index].Connected_Route.Route_Data.Distance_Value = event.routes[0].legs[0].distance.value;
         this.MarkersData[index].Connected_Route.Route_Data.Duration_Value = event.routes[0].legs[0].duration.value;
      }
   }
   onResponsePossible(index: number, subIndex: number, event: any) {
      if (event !== null && event.routes !== undefined) {
         this.MarkersData[index].Possible_Routes[subIndex].Route_Data.Distance = event.routes[0].legs[0].distance.text;
         this.MarkersData[index].Possible_Routes[subIndex].Route_Data.Duration = event.routes[0].legs[0].duration.text;
         this.MarkersData[index].Possible_Routes[subIndex].Route_Data.Distance_Value = event.routes[0].legs[0].distance.value;
         this.MarkersData[index].Possible_Routes[subIndex].Route_Data.Duration_Value = event.routes[0].legs[0].duration.value;
         let StartCalculation = true;
         this.MarkersData[index].Possible_Routes.map(obj => {
            if (obj.Route_Data.Duration_Value === 0 && obj.Route_Data.Distance_Value === 0) {
               StartCalculation = false;
            }
         });
         if (StartCalculation && this.MarkersData[index].Possible_Routes.length > 1) {
            this.MarkersData[index].Possible_Routes.sort((obj1: any, obj2: any) => {
               if (obj1.Route_Data.Duration_Value < obj2.Route_Data.Duration_Value) { return -1; }
               if (obj1.Route_Data.Duration_Value > obj2.Route_Data.Duration_Value) { return 1; }
               if (obj1.Route_Data.Distance_Value < obj2.Route_Data.Distance_Value) { return -1; }
               if (obj1.Route_Data.Distance_Value < obj2.Route_Data.Distance_Value) { return 1; }
            });
            if (this.ClusterDetails.Cluster_Type !== 'advanced' && this.MarkersData[index].Data.If_Cluster_Mapped === false) {
               setTimeout(() => {
                  this.MarkersData[index].Possible_Routes.map(obj => obj.Others.BestRoute = false);
                  this.MarkersData[index].Possible_Routes[0].Others.BestRoute = true;
               }, 100);
            }
         }
      }
   }
   onResponseSpoke(index: number, subIndex: number, event: any) {
      if (event !== null && event.routes !== undefined) {
         this.MarkersData[index].Spokes[subIndex].Route_Data.Distance = event.routes[0].legs[0].distance.text;
         this.MarkersData[index].Spokes[subIndex].Route_Data.Duration = event.routes[0].legs[0].duration.text;
         this.MarkersData[index].Spokes[subIndex].Route_Data.Distance_Value = event.routes[0].legs[0].distance.value;
         this.MarkersData[index].Spokes[subIndex].Route_Data.Duration_Value = event.routes[0].legs[0].duration.value;
         let StartCalculation = true;
         this.MarkersData[index].Spokes.map(obj => {
            if (obj.Route_Data.Duration_Value === 0 && obj.Route_Data.Distance_Value === 0) {
               StartCalculation = false;
            }
         });
         if (StartCalculation && this.MarkersData[index].Data.If_Cluster_Mapped === true && this.MarkersData[index].Spokes.length > 1) {
            this.MarkersData[index].Spokes.sort((obj1: any, obj2: any) => {
               if (obj1.Route_Data.Duration_Value < obj2.Route_Data.Duration_Value) { return -1; }
               if (obj1.Route_Data.Duration_Value > obj2.Route_Data.Duration_Value) { return 1; }
               if (obj1.Route_Data.Distance_Value < obj2.Route_Data.Distance_Value) { return -1; }
               if (obj1.Route_Data.Distance_Value < obj2.Route_Data.Distance_Value) { return 1; }
            });
         }
      }
   }
   onResponseAll(index: number, subIndex: number, event: any) {
      if (event !== null && event.routes !== undefined) {
         this.MarkersData[index].All_Routes[subIndex].Route_Data.Distance = event.routes[0].legs[0].distance.text;
         this.MarkersData[index].All_Routes[subIndex].Route_Data.Duration = event.routes[0].legs[0].duration.text;
         this.MarkersData[index].All_Routes[subIndex].Route_Data.Distance_Value = event.routes[0].legs[0].distance.value;
         this.MarkersData[index].All_Routes[subIndex].Route_Data.Duration_Value = event.routes[0].legs[0].duration.value;
         let StartCalculation = true;
         this.MarkersData[index].All_Routes.map(obj => {
            if (obj.Route_Data.Duration_Value === 0 && obj.Route_Data.Distance_Value === 0) {
               StartCalculation = false;
            }
         });
         if (StartCalculation && this.MarkersData[index].All_Routes.length > 1) {
            this.MarkersData[index].All_Routes.sort((obj1: any, obj2: any) => {
               if (obj1.Route_Data.Duration_Value < obj2.Route_Data.Duration_Value) { return -1; }
               if (obj1.Route_Data.Duration_Value > obj2.Route_Data.Duration_Value) { return 1; }
               if (obj1.Route_Data.Distance_Value < obj2.Route_Data.Distance_Value) { return -1; }
               if (obj1.Route_Data.Distance_Value < obj2.Route_Data.Distance_Value) { return 1; }
            });
         }
      }
   }

   OpenInfoWindow(index: number) {
      this.MarkersData[index].ConnectConfirm = false;
      this.MarkersData[index].RemoveConfirm = false;
      this.MarkersData.map(obj => { obj.ShowInfo = false; obj.Routes_Type = ''; });
      this.MarkersData[index].Possible_Routes.map(obj => { obj.Visible = false; });
      this.MarkersData[index].All_Routes.map(obj => { obj.Visible = false; });
      this.MarkersData[index].Spokes.map(obj => { obj.Visible = false; });
      this.MarkersData[index].Connected_Route.Visible = false;

      const HospitalData = this.MarkersData[index].Data;
      const PossibleRoutesLength = this.MarkersData[index].Possible_Routes.length;
      const AllRoutesLength = this.MarkersData[index].All_Routes.length;
      const SpokesLength = this.MarkersData[index].Spokes.length;

      const PossibleRoutesInterval = PossibleRoutesLength < 5 ? 10 : PossibleRoutesLength < 10 ? 100 : PossibleRoutesLength < 15 ? 500 : PossibleRoutesLength <= 20 ? 1000 : PossibleRoutesLength <= 30 ? 1500 : PossibleRoutesLength <= 40 ? 2000 : 3000;
      const AllRoutesInterval = AllRoutesLength < 5 ? 10 : AllRoutesLength < 10 ? 100 : AllRoutesLength < 15 ? 500 : AllRoutesLength <= 20 ? 1000 : AllRoutesLength <= 30 ? 1500 : AllRoutesLength <= 40 ? 2000 : 3000;
      const SpokesInterval = SpokesLength < 5 ? 10 : SpokesLength < 10 ? 100 : SpokesLength < 15 ? 500 : SpokesLength <= 20 ? 1000 : SpokesLength <= 30 ? 1500 : SpokesLength <= 40 ? 2000 : 3000;

      if (HospitalData.If_Cluster_Mapped === false || this.ClusterDetails.Cluster_Type === 'advanced') {
         interval(PossibleRoutesInterval).pipe(take(PossibleRoutesLength)).subscribe(res => {
            this.MarkersData[index].Possible_Routes[res].Visible = true;
         });
         this.MarkersData[index].Routes_Type = 'AllPossibles';
      }
      if (this.MarkersData[index].If_AllRoutes) {
         interval(AllRoutesInterval).pipe(take(AllRoutesLength)).subscribe(res => {
            this.MarkersData[index].All_Routes[res].Visible = true;
         });
         this.MarkersData[index].Routes_Type = 'All';
      }
      if (this.MarkersData[index].If_Spokes) {
         interval(SpokesInterval).pipe(take(SpokesLength)).subscribe(res => {
            this.MarkersData[index].Spokes[res].Visible = true;
         });
         this.MarkersData[index].Routes_Type = 'AllSpokes';
      }
      if (this.MarkersData[index].ShowConnected_Route) {
         const lineSymbol = {
            path: google.maps.SymbolPath.CIRCLE,
            fillOpacity: 0.8,
            scale: 2.5
        };
         this.MarkersData[index].Possible_Routes.map(obj => {
            obj.RenderOptions.polylineOptions.strokeOpacity = 0;
            obj.RenderOptions.polylineOptions.strokeWeight = 3;
            obj.RenderOptions.polylineOptions.icons = [{
               icon: lineSymbol,
               offset: '5px',
               repeat: '10px'
           }];
         });
         interval(PossibleRoutesInterval).pipe(take(PossibleRoutesLength)).subscribe(res => {
            this.MarkersData[index].Possible_Routes[res].Visible = true;
         });
         this.MarkersData[index].Connected_Route.Visible = true;
         this.MarkersData[index].Connected_Route.RenderOptions.polylineOptions.strokeColor = '#003061';
         this.MarkersData[index].Routes_Type = 'AllPossiblesAndConnected';
      }
      this.InfoWindowFullscreen = true;
      this.MarkersData[index].ShowInfo = true;
   }

   CloseInfoWindow(index: number) {
      this.ConfirmationData.SubIndex = null;
      this.MarkersData[index].Routes_Type = '';
   }

   ShowAllRoutes(index: number) {
      const lineSymbol = {
         path: google.maps.SymbolPath.CIRCLE,
         fillOpacity: 0.8,
         scale: 2.5
      };
      this.MarkersData[index].Possible_Routes.map(obj => {
         obj.RenderOptions.polylineOptions.strokeOpacity = 0;
         obj.RenderOptions.polylineOptions.strokeWeight = 3;
         obj.RenderOptions.polylineOptions.icons = [{
            icon: lineSymbol,
            offset: '5px',
            repeat: '10px'
        }];
      });
      this.MarkersData[index].Connected_Route.RenderOptions.polylineOptions.strokeColor = '#003061';
      this.MarkersData[index].Routes_Type = 'AllPossiblesAndConnected';
   }

   HideOtherRoutes(index: number) {
      this.MarkersData[index].Connected_Route.RenderOptions.polylineOptions.strokeColor = '#007eff';
      this.MarkersData[index].Routes_Type = 'Connected';
   }

   openModal(template: TemplateRef<any>) {
      if (this.ModalService.getModalsCount() === 0) {
         this.modalReference = this.ModalService.show(template, {ignoreBackdropClick: false, class: 'modal-md modal-dialog-centered animated bounceInRight'} );
      }
   }

   DownloadIMG(type: string, name: string) {
      let HospitalName = name.replace(' ', '_');
      HospitalName = HospitalName.replace('.', '');
      this.DownloadBtn = false;
      setTimeout(() => {
         domtoimage.toBlob(document.getElementById('ModalDom'))
         .then( blob => {
            if (type === 'Image') {
               saveAs(blob, HospitalName + '.png');
            }
            if (type === 'PDF') {
               const reader = new FileReader();
               reader.readAsDataURL(blob);
               reader.onloadend = () => {
                  const doc = new jsPDF('p', 'mm');
                  const base64data = reader.result;
                  const pageWidth = doc.internal.pageSize.getWidth();
                  const pageHeight =  doc.internal.pageSize.getHeight();
                  const imgWeight =   document.getElementById('ModalDom').clientWidth;
                  const imgHeight =   document.getElementById('ModalDom').clientHeight;
                  const setImgHeight = imgHeight * pageWidth / imgWeight;
                  let heightLeft = setImgHeight;
                  let position = 0;

                  doc.addImage(base64data, 'PNG', 0, position, pageWidth, setImgHeight);
                  heightLeft -= pageHeight;

                  while (heightLeft >= 0) {
                    position = heightLeft - setImgHeight;
                    doc.addPage();
                    doc.addImage(base64data, 'PNG', 0, position, pageWidth, setImgHeight);
                    heightLeft -= pageHeight;
                  }
                  doc.save(HospitalName + '.pdf');
               };
            }
            this.DownloadBtn = true;
         });
      }, 100);

   }
   AddHospitalToCluster(index: number) {
      const subIndex = this.ConfirmationData.SubIndex;
      const Data  = {
         Cluster_Id : this.FilterForm.controls.Cluster.value._id,
         Hospital_id : this.MarkersData[index].Data._id,
         ConnectedHub : subIndex !== null ? this.MarkersData[index].Possible_Routes[subIndex].Route_Data.To_Data._id : null
      };
      this.ClusterService.Add_HospitalTo_Cluster(Data).subscribe(response => {
         this.ConfirmationData.SubIndex = null;
         if (response.Status === true) {
            this.onSelectCluster(Data.Cluster_Id);
         }  else if (!response.Status && response.ErrorCode === 400 || response.ErrorCode === 401 || response.ErrorCode === 417) {
            if (response.ErrorMessage === undefined || response.ErrorMessage === '' || response.ErrorMessage === null) {
               response.ErrorMessage = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.ErrorMessage });
         } else {
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Add Hospital to Cluster Getting Error!, But not Identify!' });
         }
      });
   }



   RemoveHospitalFromCluster(index: number) {
      const Data  = {
         Cluster_Id : this.FilterForm.controls.Cluster.value._id,
         Hospital_id : this.MarkersData[index].Data._id,
      };
      this.ClusterService.Remove_HospitalFrom_Cluster(Data).subscribe(response => {
         if (response.Status === true) {
            this.onSelectCluster(Data.Cluster_Id);
         }  else if (!response.Status && response.ErrorCode === 400 || response.ErrorCode === 401 || response.ErrorCode === 417) {
            if (response.ErrorMessage === undefined || response.ErrorMessage === '' || response.ErrorMessage === null) {
               response.ErrorMessage = 'Some Error Occoured!, But not Identified.';
            }
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: response.ErrorMessage });
         } else {
            this.Toastr.NewToastrMessage({ Type: 'Error', Message: 'Hospital Removing From this Cluster Getting Error!, But not Identify!' });
         }
      });
   }

}
