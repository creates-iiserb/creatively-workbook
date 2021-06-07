import { Injectable } from '@angular/core';
import {ConfigService} from './config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import {CommonService} from  './common.service';
import { TouchSequence } from '../../../node_modules/@types/selenium-webdriver';
@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(
    private cf : ConfigService,
    private http: HttpClient, 
    private cs : CommonService
  ) { }

  getWorkBookList(){
    this.cs.showLoader('Loading Workbook List...');
    //console.log(this.cf.getUrl('store'));
    return this.http.get(this.cf.getUrl('store'));
  }

  getBetaWorkBookList(){
    this.cs.showLoader('Loading Beta Workbook List...');
    //console.log(this.cf.getUrl('betaStore'));
    return this.http.get(this.cf.getUrl('betaStore')+"/list",this.cs.getSecureHeader());
  }
  
  getWorkbookDetails(id){
    this.cs.showLoader('Loading Details...')
    return this.http.get(this.cf.getUrl('store')+"/"+id)
  }

  getBetaWbDetails(wbid,pubid) {
    this.cs.showLoader('Loading Beta WB Details...')
    return this.http.get(this.cf.getUrl('betaStore')+"/"+wbid+"/"+pubid,this.cs.getSecureHeader())
  }

  getWorkBook(wbid){
    this.cs.showLoader('Getting Workbook..')
    return this.http.post(this.cf.getUrl('store')+"/"+wbid,{beta:false},this.cs.getSecureHeader());
    //this.cs.getLoggedInUserData().user +"/w/"+wbid
  }

  getBetaWorkBook(wbid,pubid){
    this.cs.showLoader('Getting Beta Workbook..')
    return this.http.post(this.cf.getUrl('store')+"/"+wbid, 
          {beta:true,pubId:pubid},this.cs.getSecureHeader() );
    //this.cs.getLoggedInUserData().user +"/w/"+wbid
  }

  getWorkBookSubscription(){
    this.cs.showLoader('Loading List..')
    return this.http.get(this.cf.getUrl('library'),this.cs.getSecureHeader());
  }

  getSubscriptionDetails(subrId){
    this.cs.showLoader('Loading Workbook..')
    return this.http.get(this.cf.getUrl('library')+'/'+subrId,this.cs.getSecureHeader());
  }

  getQuizData(subId,wsId,mode,dur,metaData,play) {
    this.cs.showLoader('Loading Quiz Data..')
    return this.http.post(this.cf.getUrl('library')+'/'+subId+'/'+wsId,
    {"mode":mode,"duration":dur, metaOnly: metaData, play: play},this.cs.getSecureHeader());
  }

  updateWb(subId) {
    this.cs.showLoader('Update Workbook..')
    return this.http.post(this.cf.getUrl('library')+'/update/wb/'+subId,{},this.cs.getSecureHeader());
  }
  
  updateWs(subId,wsId,data) {
    //data['wbuser'] = this.cs.getLoggedInUserData().user;
    this.cs.showLoader('Update Worksheet..')
    return this.http.post(this.cf.getUrl('library')+'/reset/'+subId+'/'+wsId,data,this.cs.getSecureHeader());
  }

  saveResponse(subId,wsId,data,lastQus,userdata) {
    // console.log(subId,wsId,data,lastQus,userdata)
    this.cs.showLoader('Loading save Data..');
    return this.http.patch(this.cf.getUrl('library')+'/'+subId+'/'+wsId,
    {"respData":data, "lastQue":lastQus, "userdata":userdata},this.cs.getSecureHeader());
  }

  submitResponse(subId,wsId) {
    this.cs.showLoader('Loading Submit Data..');
    return this.http.put(this.cf.getUrl('library')+'/'+subId+'/'+wsId,{},this.cs.getSecureHeader());
  }

  getMetaData(data) {
    this.cs.showLoader('Loading Meta Data..');
    return this.http.post(this.cf.getUrl('library')+'/meta',{fields:data});
  }

  getMetaDataPr(data) {
    this.cs.showLoader('Loading Meta Data..');
    return this.http.post(this.cf.getUrl('library')+'/meta',{fields:data}).toPromise();
  }

  userNew(data){
    this.cs.showLoader('Signing up.... ');
    return this.http.post(this.cf.getUrl('signupPOST'),data)
  }

  userLogin(data){
    this.cs.showLoader('Logging In...')
    return this.http.post(this.cf.getUrl('loginPOST'),data)
  }

  userSocialLogin(data){
    this.cs.showLoader('Logging In...')
    return this.http.post(this.cf.getUrl('socialLogin'),data)
  }

  userVerify(wbuser,token){
    this.cs.showLoader('Verifying Account..')
    return this.http.get(this.cf.getUrl('verifyGET')+"/"+wbuser+"/"+token)
  }

  userResetLink(wbuser){
    this.cs.showLoader('Sending Reset Link..')
    return this.http.post(this.cf.getUrl('resetLinkGET'), {'wbuser':wbuser})

  }
  userResetPwd(data){
    this.cs.showLoader('Resetting Password..')
    return this.http.put(this.cf.getUrl('resetPwdPOST'),data)
  }
  userDataGet(){
    this.cs.showLoader('Loading Data..')
    // console.log(this.cs.getSecureHeader())
    return this.http.get<any>(this.cf.getUrl('profile') + this.cs.getLoggedInUserData().user, this.cs.getSecureHeader())
  }

  userRequireDataGet(){
    this.cs.showLoader('Loading Data..')
    // console.log(this.cs.getSecureHeader())
    return this.http.get<any>(this.cf.getUrl('profile') + this.cs.getLoggedInUserData().user+'/details', this.cs.getSecureHeader())
  }


  userDataUpdate(data){
    this.cs.showLoader('Updating Data..')
    return this.http.post(this.cf.getUrl('profile') + this.cs.getLoggedInUserData().user, data,this.cs.getSecureHeader())

  }

  gradeSubjective(subId,wsId,refId,data) {
    return this.http.post(this.cf.getUrl('library')+'/subGrade/'+subId+'/'+wsId+'/'+refId, data,this.cs.getSecureHeader() )
  }

  //For lesson mode only
  gradeAns(subId,wsId,data) {
    return this.http.post(this.cf.getUrl('library')+'/'+subId+'/'+wsId+'/checkans', {response: data},this.cs.getSecureHeader() )
  }

}//End
