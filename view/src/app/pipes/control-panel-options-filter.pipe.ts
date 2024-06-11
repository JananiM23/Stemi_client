import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ControlPanelOptionsFilter'
})
export class ControlPanelOptionsFilterPipe implements PipeTransform {

   transform(items: any[], type: any): any {
      if (!items || !type) {
         return items;
      }
      return items.filter(item => item.Type === type && item.Visibility === true);
   }

}
