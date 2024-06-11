import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToastrService {

   constructor() { }

   private ToastrMessage =  new Subject<any>();

   WaitingToastr = this.ToastrMessage.asObservable();

   NewToastrMessage(Message: any) {
      this.ToastrMessage.next(Message);
   }

}
