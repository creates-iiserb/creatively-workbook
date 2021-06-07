import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { BackendService } from './backend.service';
import { CommonService } from './common.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { promise } from 'protractor';
import { resolve } from 'path';

@Injectable({
  providedIn: 'root'
})
export class TempdataService {

  constructor(private DomSenitize: DomSanitizer, private dataService: BackendService, private cs: CommonService, private modalService: NgbModal) { }

  //Flags
  public isBetaUser = false;
  public language: any = '';
  private lastActivity: any = { "lastUrl": [], "libraryTab": "" };
  closeResult: string;

  public isReview = false;

  private appMetaData = new BehaviorSubject('');
  public getAppMeta = this.appMetaData.asObservable();

  private quizMetaData = new BehaviorSubject('');
  public getQuizMeta = this.quizMetaData.asObservable();

  private quizData = new BehaviorSubject('');
  public getQuizData = this.quizData.asObservable();

  private wbData = new BehaviorSubject('');
  public getWbData = this.wbData.asObservable();

  private alertMsg = new Subject();
  public getAlert = this.alertMsg.asObservable();

  private curLibTab = new BehaviorSubject('');
  public getLibTab = this.curLibTab.asObservable();


  setQuizMetaData(data: any) {
    this.quizMetaData.next(data);
  }

  setWbData(data: any) {
    this.wbData.next(data);
  }

  setQuizData(data: any) {
    this.quizData.next(data);
  }

  setAlert(type, msg) {
    this.alertMsg.next({ type: type, msg: msg });
  }

  sanitizeHtml(html) {
    return this.DomSenitize.bypassSecurityTrustHtml(html);
  }

  setBetaUser(flag) {
    this.isBetaUser = flag;
  }

  getBetaUser() {
    return this.isBetaUser;
  }

  async getAppMetaData() {
    try {
      let res = await this.dataService.getMetaDataPr(['language', 'inactivityTime']);
      await this.setAppMetaData(res['data']);
      this.language = res['data']['langauge'][res['data']['langauge']['default']];
      //this.setLanguage('default');
      this.cs.hideLoader();
    } catch (error) {
      this.cs.httpErrorHandler(error);
    }
  }

  setAppMetaData(data) {
    this.appMetaData.next(data);
  }

  setLanguage(language) {
    this.getAppMeta.subscribe(res => {
      this.language = res['langauge'][res['langauge'][language]];
    });
  }

  async getLanguage() {
    if (this.language == '' || this.language == undefined) {
      await this.getAppMetaData();
      //await this.setLanguage('default');
      return this.language;
    }
    else {
      return this.language;
    }
  }

  //Last activity
  setLastActivity(type, activity) {
    if (type == 'lastUrl') {
      this.lastActivity['lastUrl'].push(activity);
    }
    else if (type == 'libTab') {
      this.lastActivity['libraryTab'] = activity;
    }
  }

  getLastActivity() {
    return this.lastActivity;
  }

  async getInactivityTime() {
    let inactivityTime = 0;
    await this.appMetaData.subscribe(res => {
      inactivityTime = res['inactivityTime'];
    });
    return inactivityTime;
  }

  //Get User data if login
  getUserData() {
    return new Promise((resolve, reject) => {
      if (this.cs.checkIfUserIsLoggedIn()) {
        this.dataService.userRequireDataGet().subscribe(resp => {
          // this.cs.hideLoader(); 
          //Set beta user flag
          // console.log(resp['data']);
          this.setBetaUser(resp['data'].isBetaUser);
          resolve(resp['data']);
        },
          err => {
            this.cs.httpErrorHandler(err);
            resolve(err);
            //console.log(err) 
          });
      }
      else {
        resolve([]);
      }
    });
  }

  //Time methods 
  //Start time
  private sTime = new BehaviorSubject('');
  private getSTime = this.sTime.asObservable();
  setStartTime(time) {
    this.sTime.next(time);
  }

  getStartTime() {
    return new Promise(resolve => {
      this.getSTime.subscribe(res => {
        resolve(res);
      });
    });
  }

  //End time
  private eTime = new BehaviorSubject('');
  private getETime = this.eTime.asObservable();
  setEndTime(time) {
    this.eTime.next(time);
  }

  getEndTime() {
    return new Promise(resolve => {
      this.getETime.subscribe(res => {
        resolve(res);
      });
    });
  }

  //Get total time used
  async getTotalTime() {
    //console.log('start');
    let sTime: any;
    sTime = await this.getStartTime();
    //console.log('stime', sTime);
    let eTime: any;
    eTime = await this.getEndTime();
    //console.log('etime', eTime);
    // console.log(eTime-sTime);
    return eTime - sTime;
  }

  parseTime(diff) {
    var msec = diff;
    var hh = Math.floor(msec / 1000 / 60 / 60);
    msec -= hh * 1000 * 60 * 60;
    var mm = Math.floor(msec / 1000 / 60);
    msec -= mm * 1000 * 60;
    var ss = Math.floor(msec / 1000);
    msec -= ss * 1000;

    return { "hh": hh, "mm": mm, "ss": ss, "diff": diff.getTime() }

  }

  //Model service
  open(content, type) {
    if (type === 'sm') {
      this.modalService.open(content, { size: 'sm' }).result.then((result) => {
        this.closeResult = `Closed with: ${result}`;
      }, (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      });
    }
    else if (type === 'xl') {
      this.modalService.open(content, { size: 'xl' }).result.then((result) => {
        this.closeResult = `Closed with: ${result}`;
      }, (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      });
    }
    else {
      this.modalService.open(content).result.then((result) => {
        this.closeResult = `Closed with: ${result}`;
      }, (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      });
    }
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  // Current Library tab
  
  currLibTab(tab) {
    this.curLibTab.next(tab);
    this.setLastActivity('libTab',tab);
  }

}//end
