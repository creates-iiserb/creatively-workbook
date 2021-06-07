import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'forumnotification'
})
export class ForumnotificationPipe implements PipeTransform {

  transform(notitfication:any,data:any, docType:any, entryType:any): any {
    // console.log(notitfication,data,docType,entryType)
    if(docType=='workbook' && entryType=='notification') {
      return notitfication.length;
    }
    else if(docType=='workbook' && entryType=='question') {
      let qusId = `${data['timestamp']}-${data['randomId']}`;

      return notitfication.filter(itm => itm.qusId==qusId);
    }
    else if(docType=='workbook' && entryType=='answer') {
      return notitfication.filter(item =>item['timestamp']==data['timestamp'] && item['randomId']==data['randomId'])
    }
  }

}
