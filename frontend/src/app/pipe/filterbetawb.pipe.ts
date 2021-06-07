import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'wbfilter'
})
export class WbfilterPipe implements PipeTransform {

  transform(value: any, wbType:any): any {
    
    let filteredItems = [];
    value.map(item => {
      if(wbType=="active"&&!item.subscription.beta&&item.subscription.validity==true&&item.wbDetails.published==true) {
        filteredItems.push(item);
      }
      //beta
      else if(wbType=='beta'&&item.subscription.beta==true && item.subscription.betaAccess==true && item.subscription.validity==true
        && item.wbDetails.published==true) {
          filteredItems.push(item);
      }
      //expired
      else if(wbType=='expired'&&((!item.subscription.beta&&(item.subscription.validity==false||item.wbDetails.published==false))||
      (item.subscription.beta==false || item.subscription.betaAccess==false || item.subscription.validity==false
        && item.wbDetails.published==false) || item.subscription.validity==false)) {
          
          filteredItems.push(item);
      }
    });
    
    return filteredItems;
  }

}
