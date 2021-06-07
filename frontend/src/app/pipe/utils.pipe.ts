import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonService } from 'app/services/common.service';

declare const LC:any;

@Pipe({
  name: 'utils'
})
export class UtilsPipe implements PipeTransform {

  constructor(private DomSenitize: DomSanitizer,private cs: CommonService) {}

  transform(value: any,type:any): any {

    switch(type) {
      case "strcount":
          let str = value.toString().trim();
          str = str.replace(/(<([^>]+)>)/ig, '');
          return str.length;
        break;

      case "sanitize":
          return this.DomSenitize.bypassSecurityTrustHtml(value)
        break;

      case "wboardImg":
          let data = LC.renderSnapshotToSVG(value);
          return this.DomSenitize.bypassSecurityTrustHtml(data)
        break;
      
      case "rating":
          let user = this.cs.getUsrProfileData('user');
          let s1 = value.length==0? 0:value.filter(item => item.rating==1).length,
              s2 = value.length==0? 0:value.filter(item => item.rating==2).length,
              s3 = value.length==0? 0:value.filter(item => item.rating==3).length,
              s4 = value.length==0? 0:value.filter(item => item.rating==4).length,
              s5 = value.length==0? 0:value.filter(item => item.rating==5).length
    
          let ratingsData = {
            "isRated": value.filter(item => item.wbuser==user),
            "5star": s5,
            "4star": s4,
            "3star": s3,
            "2star": s2,
            "1star": s1,
            "totalRatings": value.length==0? 0:((5*s5 + 4*s4 + 3*s3 + 2*s2 + 1*s1) / (s1+s2+s3+s4+s5)).toFixed(1)
          };
     
          return ratingsData;
        break;
      
      case "certModeTimeUsed":
          let timeUsed = new Date().getTime() - new Date(value['startedOn']).getTime();
          return {timeUsedPer: (timeUsed/(value['response'].duration*60000))*100, timeTakenSeconds: timeUsed}
        break;
    }
    
    
  }

}//End class




// if(type=='strcount') {
//   let str = value.toString().trim();
//   str = str.replace(/(<([^>]+)>)/ig, '');
//   return str.length;
// }
// else if(type=='sanitize') {
//   return this.DomSenitize.bypassSecurityTrustHtml(value)
// } 
// else if(type=='wboardImg') {
//   // return LC.renderSnapshotToSVG(value);//LC.renderSnapshotToImage(value).toDataURL();
//   let data = LC.renderSnapshotToSVG(value);
//   return this.DomSenitize.bypassSecurityTrustHtml(data)
// }
// else if(type=='rating') {
//   let user = this.cs.getUsrProfileData('user');
//   let s1 = value.length==0? 0:value.filter(item => item.rating==1).length,
//       s2 = value.length==0? 0:value.filter(item => item.rating==2).length,
//       s3 = value.length==0? 0:value.filter(item => item.rating==3).length,
//       s4 = value.length==0? 0:value.filter(item => item.rating==4).length,
//       s5 = value.length==0? 0:value.filter(item => item.rating==5).length

//   let ratingsData = {
//     "isRated": value.filter(item => item.wbuser==user),
//     "5star": s5,
//     "4star": s4,
//     "3star": s3,
//     "2star": s2,
//     "1star": s1,
//     "totalRatings": value.length==0? 0:((5*s5 + 4*s4 + 3*s3 + 2*s2 + 1*s1) / (s1+s2+s3+s4+s5)).toFixed(1)
//   };

//   return ratingsData;

// }
// else if(type=='slice') {

// }