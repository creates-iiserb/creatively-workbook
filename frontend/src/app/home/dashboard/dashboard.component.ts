import { Component, OnInit } from '@angular/core';

import { BackendService } from '../../services/backend.service';
import { CommonService } from '../../services/common.service'
import { TempdataService } from 'app/services/tempdata.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  public subList = [];
  public betaCnt = 0;
  public activeCnt = 0;
  public inActiveCnt = 0;
  public language: any;
  public updateDetails:any = {};
  public isBeta = false;
  public crrTab = 'active-apps';
  public options =  {
    'classes':'info bg-light col-md-12 mw-100',
    'icon':'nc-icon nc-book-bookmark',
    'iconType':'info-title',
    'titleClass':'info-title',
    'message':'No data is available',
    'title':'Information',
  };

  constructor(
    private dataServer: BackendService,
    private cs: CommonService,
    public tds: TempdataService
  ) { 

    this.cs.activeMenu('home');

    this.isBeta = this.tds.isBetaUser;

    this.tds.getLibTab.subscribe(res=>{
      // console.log(res);
      this.crrTab = res;
    });


  }
  
 //  wbDetails = {}
  async ngOnInit() {
    //Set Language
    this.language = await this.tds.getLanguage();

    let tab = await this.tds.getLastActivity()['libraryTab']!=''&&this.tds.getLastActivity()['libraryTab']!=undefined? this.tds.getLastActivity()['libraryTab']:'active-apps';
    this.tds.currLibTab(tab);
    this.tds.setLastActivity('libTab',tab);


    this.subList = []
    // this.wbDetails= {}
    this.getSubscriptionList();
    this.tds.getUserData();
  }

  getSubscriptionList() {
    this.dataServer.getWorkBookSubscription()
      .subscribe(resp => {
        this.cs.hideLoader()
        // subscrData:subscrData, wbDetails:wbDetails
        this.subList = resp['data'];
        // this.wbDetails = resp['data']['wbDetails'];
        console.log(resp['data']);
        this.getWbCount();
      },
      err => {
        this.cs.httpErrorHandler(err);
      });
  }

  getWbCount() {
    this.subList.forEach(ele => {
      //for Beta
      if(ele.subscription.beta==true && ele.subscription.betaAccess==true && ele.subscription.validity==true
        && ele.wbDetails.published==true) {
          this.betaCnt++;
      }
      //For Regular Active
      else if(!ele.subscription.beta&&ele.subscription.validity==true&&ele.wbDetails.published==true) {
        this.activeCnt++;
      }
      //For Inactive
      else if((!ele.subscription.beta&&(ele.subscription.validity==false||ele.wbDetails.published==false)) || 
      (ele.subscription.beta==false || ele.subscription.betaAccess==false || ele.subscription.validity==false
        && ele.wbDetails.published==false) || ele.subscription.validity==false) {
        this.inActiveCnt++;
      }

    });
  }

  updateWbModel(content,msg:String,subid) {
    this.updateDetails['msg'] = msg;
    this.updateDetails['subId'] = subid;
    this.tds.open(content,'');
  }

  updateWb(subId) {
    
    this.dataServer.updateWb(subId).subscribe(
      resp => {
        this.cs.hideLoader();
        this.cs.showToast('success','',resp['data'].message,3000,'tfw'); 
        setTimeout(()=>{location.reload();},3000);     
      },
      err => {
        this.cs.httpErrorHandler(err);
        this.cs.redirectToHome();
      }
    ); 
  }//End

  // switchTabs(tab) {
  //   this.tds.setLastActivity('libTab',tab);
  //   this.crrTab = tab;
  // }

  renewWbSub(subId) {
    this.cs.subscribe(subId);
  }

}//end class
