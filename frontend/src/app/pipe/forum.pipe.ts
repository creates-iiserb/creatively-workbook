import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'forum'
})
export class ForumPipe implements PipeTransform {

  transform(value:any,type:any,parent:any,user:any=''): any {
    if(type=='like' || type=='dislike') {
      let like = type=='like'? true:false;
      let filteredData = value.filter(item=>item.like['status']==like&&item.parent==parent);
      return filteredData;
    }
    else if(type=='like_status' || type=='dislike_status') {
      let like = type=='like_status'? true:false;
      let filteredData = value.filter(item=>item.like['status']==like && item.parent==parent && item.wbuser==user);
      return filteredData;
    }
    else if(type=='views') {
      let filteredData = value.filter(item=>item.parent==parent);
      return filteredData;
    }
    // Return  filtered entries data
    else {
      let filteredData = value.filter(item=>item.type==type&&item.parent==parent);
      return filteredData;
    }
    
  }

}
