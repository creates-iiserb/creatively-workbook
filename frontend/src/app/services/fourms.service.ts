import { Injectable } from '@angular/core';
import {ConfigService} from './config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {CommonService} from  './common.service';
import { Interface } from 'readline';

@Injectable({
  providedIn: 'root'
})
export class FourmsService {

  constructor(
    private cf : ConfigService,
    private http: HttpClient, 
    private cs : CommonService
  ) { }

  setEntry(subId,docId,refId,docType,data) {

    let entry:Entry;

    entry = {
      type: 'entry',
      docType: docType,
      data: {
        type: data['type'],
        qusId: data['qusId'],
        parent: data['parent'],
        statement: data['statement'],
        anonymous: data['anonymous']
      }
    };
    //for rating only 
    if(data.hasOwnProperty('rating')) {
      entry['data']['rating'] = data['rating'];
      entry['data']['pubId'] = data['pubId'];
    }
    // console.log(entry)
    this.cs.showLoader('');

    return this.http.post(this.cf.getUrl('forums')+'/'+subId+'/'+docId+'/'+refId,entry,this.cs.getSecureHeader());

  }

  setLikeView(subId,docId,refId,data) {
    this.cs.showLoader('');
    return this.http.post(this.cf.getUrl('forums')+'/'+subId+'/'+docId+'/'+refId,data,this.cs.getSecureHeader());
  }

  getEntry(subId,docId,refId) {
    return this.http.get(this.cf.getUrl('forums')+'/'+subId+'/'+docId+'/'+refId,this.cs.getSecureHeader()).toPromise();
  }

  getNewEntry(subId,ref) {
    return this.http.get(this.cf.getUrl('forums')+'/'+subId+'/'+ref,this.cs.getSecureHeader());
  }

}//End class

export interface Entry {

    type: string,
    docType: string,
    data: {
      type: string,
      qusId: string,
      parent: string,
      statement: string,
      anonymous: boolean
    }
  
}
