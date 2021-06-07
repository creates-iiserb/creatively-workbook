import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'parsetime'
})
export class ParsetimePipe implements PipeTransform {

  transform(value: any): any {
    var msec = value;
    var hh = Math.floor(msec / 1000 / 60 / 60);
    msec -= hh * 1000 * 60 * 60;
    var mm = Math.floor(msec / 1000 / 60);
    msec -= mm * 1000 * 60;
    var ss = Math.floor(msec / 1000);
    msec -= ss * 1000;

    let hrs = (hh<10)? '0'+hh:hh;
    let min = (mm<10)? '0'+mm:mm;
    let sec = (ss<10)? '0'+ss:ss;

    return hrs+":"+min+":"+sec;
  }

}
