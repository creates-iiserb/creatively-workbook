import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { DomSanitizer, Meta, Title } from '@angular/platform-browser';
import { Observable, Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';

import { ConfigService } from './config.service'
@Injectable({
  providedIn: 'root'
})
export class CommonService {

  private toastInterval:any;
  private oldToastMsg:any;

  constructor(
    private router: Router,
    private http: HttpClient, 
    private cs: ConfigService,
    private sanitize: DomSanitizer,
    private toastr: ToastrService,private titleService: Title, private metaService: Meta
  ) { }

  checkIfUserIsLoggedIn(): boolean {
    if (localStorage.getItem('user') && localStorage.getItem('token')) {
      return true
    } else {
      return false;
    }
  }

  getLoggedInUserData() {
    return { token: localStorage.getItem('token'), user: localStorage.getItem('user') }
  }

  getUsrProfileData(param='') {
    if(param=='') {
      return { user: localStorage.getItem('user'), name: localStorage.getItem('name'), image: localStorage.getItem('image'), regType: localStorage.getItem('regType') };
    }
    else if(param=='user') {
      return localStorage.getItem('user');
    }
    else if(param=='image') {
      return localStorage.getItem('image');
    }
    else if(param=='regType') {
      return localStorage.getItem('regType');
    }
    
  }

  activeMenu(item) {
    let element = document.getElementsByClassName('active-menu');
    setTimeout(()=>{
      if(element!=undefined && element!=null) {
        for(var x=0; x<element.length; x++) {
          element[x].classList.remove('active-menu');
        }        
      }            
      document.getElementById(item).classList.add('active-menu');
    },1);
  }

  logoutAndRedirectToLogin() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('regType');
    localStorage.removeItem('name');
    localStorage.removeItem('image');
    this.router.navigate(['account/login']);
  }


  redirectToHome() {    
    this.router.navigate(['home']);
  }

  saveLoggedinUserData(user, token, usrData) {
    localStorage.setItem('user', user);
    localStorage.setItem('token', token);
    localStorage.setItem('regType', usrData.regType);
    localStorage.setItem('name', usrData.name);
    localStorage.setItem('image', usrData.image);
  }

  getSecureHeader() {
    //console.log(this.getLoggedInUserData().token)
    if (localStorage.getItem('token')) {
      let secHeader = {}
      secHeader['Content-Type'] = 'application/json';
      secHeader[this.cs.get('secureHeaderName')] = this.getLoggedInUserData().token
      const httpOptionsSecure = {
        headers: new HttpHeaders(secHeader)
      };
      return httpOptionsSecure;
    } else {
      this.logoutAndRedirectToLogin();
      return { headers: new HttpHeaders({ 'Content-Type': 'application/json', 'user-access-token': 'undefined' }) }
    }
  }

  // getBase64(file) {
  //   var reader = new FileReader();
  //   reader.readAsDataURL(file);
  //   // reader.onload = function () {
  //   //   console.log(reader.result);
  //   // };
  //   // reader.onerror = function (error) {
  //   //   console.log('Error: ', error);
  //   // };
  //   console.log(reader)
  //   return reader;
  // }

  private subject = new Subject<any>();
  messageService(): Observable<any> {
    return this.subject.asObservable();
  }

  displayMessage(type, message,time) {
    this.subject.next({ type: type, message: message }); 
    setTimeout(() => {
      this.clearMessage();
    },time);
  }

  clearMessage() { 
    this.subject.next('');
  }

  showLoader(message) {
    // this.displayMessage('info', message,'');

    let loader = document.getElementById('preloader');
    if(loader!=null && loader!=undefined) {
      loader = document.getElementById('preloader');
      loader.classList.remove("hide-loader");
    }  
  }

  hideLoader() {
    // this.clearMessage();
    document.getElementById('preloader').classList.add("hide-loader");
    let loader = document.getElementById('preloader');
    loader.classList.add("hide-loader");
  }

  hideLoaderAndDisplayMessage(type, message) {
    //this.displayMessage(type, message, '')
    this.hideLoader();
    this.showToast(type,'',message,5000,'tfw')
  }

  
  httpErrorHandler(err) {
    // let emsg = "";
    // if (err.error && err.error.error.code) {
    //   emsg = err.error.error.message;
      // if (err['status'] == 403 || err['error']['error']['code'] == 'unauthorized' || err['error']['error']['message'] == "Unauthorized access") {
      //   this.logoutAndRedirectToLogin();
      // }
    // } else {
    //   emsg = "Internal error. Try again later. Check if you are connected to the internet or not."
    // }
    this.hideLoader();
    //this.hideLoaderAndDisplayMessage('error',err.error.message);
    console.log(err);
    this.showToast('error','',err.error.message? err.error.message:err.error.error.message,5000,'tfw');
   // this.hideLoaderAndDisplayMessage('error',emsg);
  }

  sanitizeHtml(hmtlText) {
    return this.sanitize.bypassSecurityTrustHtml(hmtlText);
  }

  showToast(type,title,msg,time,pos) {
    var position = {
      tfw: 'toast-top-full-width',
      tc: 'toast-top-center',
      bfw: 'toast-bottom-full-width',
      tl: 'toast-top-left',
      tr: 'toast-top-right',
      br: 'toast-bottom-right',
      bl: 'toast-bottom-left'
    };

    if(this.oldToastMsg && this.oldToastMsg['type']==type && this.oldToastMsg['title']==title && this.oldToastMsg['msg']==msg 
        && this.oldToastMsg['time']==time && this.oldToastMsg['pos']==pos) {
          return;
    }
    else {
      switch(type) {
        case 'success':
          this.toastr.success(title,msg,{positionClass: position[pos],timeOut:time});
        break;
  
        case 'warning':
          this.toastr.warning(title,msg,{positionClass: position[pos],timeOut:time});
        break;
  
        case 'info':
          this.toastr.info(title,msg,{positionClass: position[pos],timeOut:time});
        break;
  
        case 'error':
          this.toastr.error(title,msg,{positionClass: position[pos],timeOut:time});
        break;
      }

      this.oldToastMsg = {
        type: type,
        title: title,
        msg: msg,
        time: time,
        pos: pos
      }

      clearInterval(this.toastInterval);

      this.toastInterval = setTimeout(()=>{
        this.oldToastMsg = '';
      },time);
    }
    
  }

  loadYtVideo() {
    let ytVideo = document.getElementsByClassName('loadVideo');

    Object.keys(ytVideo).forEach(key => {

      let dataUrl = ytVideo[key].attributes.getNamedItem('data-url').value;
      let datasrc = ytVideo[key].attributes.getNamedItem("data-vsource").value;
      let chartCaption = ytVideo[key].attributes.getNamedItem("data-caption").value;
      let elemId = ytVideo[key].attributes.getNamedItem("id").value;
       
      ytVideo[key].classList.add('embed-responsive');
      ytVideo[key].classList.add('embed-responsive-16by9');
      ytVideo[key].append("<p class='media-caption'>" + chartCaption + "</p>");

      if (dataUrl) {            // data url exists
        let ytUrl = this.cs.getUrl('ytVideo')+''+dataUrl;

        this.http.get(ytUrl).subscribe(res => {
          let url:any;
          if (datasrc == 'youtube') {
              url = "https://www.youtube.com/embed/" + res['ytvid'] + "?autoplay=0&rel=0&iv_load_policy=3&showinfo=1&modestbranding=1";
          }
          let temp = `<iframe src='${url}'  width=\"100%\" scrolling=\"no\" frameborder=\"0\" allowfullscreen=\"allowfullscreen\"> </iframe>`;
          ytVideo[key].innerHTML = temp;
        });
      } 
      else {
        let dataid = ytVideo[key].attributes.getNamedItem("data-vid").value;
        let url:any;
        if (datasrc == 'youtube') {
          url = "https://www.youtube.com/embed/" + dataid + "?autoplay=0&rel=0&iv_load_policy=3&showinfo=1&modestbranding=1";
        }
        let temp = `<iframe src='${url}'  width=\"100%\" scrolling=\"no\" frameborder=\"0\" allowfullscreen=\"allowfullscreen\"> </iframe>`;
        ytVideo[key].innerHTML = temp;
      }

    });
  }//End

  async loadPlotly() {
    let graphData = document.getElementsByClassName('loadPlot');
    let plotUrl = await this.cs.getUrl('plotlyUrl');

    Object.keys(graphData).forEach(key => {
      let plotData, plotLayout;
      let chartUrl = graphData[key].attributes.getNamedItem("data-url").value;
      let chartCaption = graphData[key].attributes.getNamedItem("data-caption").value;     
      let divId = graphData[key].attributes.getNamedItem("id").value;
      
      //plotIframeLink
      let htmltpm = `
      <div class='embed-responsive embed-responsive-4by3'>
        <iframe scrolling="no" src="${plotUrl}${chartUrl}"></iframe></div>
      </div>
      <p class='media-caption'>${chartCaption}</p>`;
      graphData[key].innerHTML = htmltpm;

    });        
  }

  loadPdf() {
    let loadPDF = document.getElementsByClassName('loadPDF');

    Object.keys(loadPDF).forEach(key => {
      let dataurl = loadPDF[key].attributes.getNamedItem("data-url").value;
      let pdfCaption = loadPDF[key].attributes.getNamedItem("data-caption").value;

      let url = this.cs.getUrl('pdfUrl')+''+dataurl;
      let temp = `<div class="embed-responsive embed-responsive-16by9">
                    <iframe src='${url}' width=\"100%\" scrolling=\"yes\" frameborder=\"0\" allowfullscreen=\"allowfullscreen\"> </iframe>
                  </div>
                  <p style="font-family:Arial;font-size:70%;text-align:center">${pdfCaption}</p><br/><br>`;
      loadPDF[key].innerHTML = temp;

    });
  }

  getImgUrl() {
    return this.cs.getUrl('image');
  }


  getCountry() {
    return this.http.get('https://restcountries.eu/rest/v2/all?fields=name').toPromise();
  }

  // Set meta tags
  setMetaTags(link,title,img) {
    let siteTag = [
      {name: 'og:url', value: link},
      {name: 'og:title', value: title},
      {name: 'og:description', value: 'Workbook'},
      {name: 'og:image', value: img},
      {name: 'twitter:text:title', value: title},
      {name: 'twitter:image', value: img},
    ];
    siteTag.forEach(siteTag=>{
        this.metaService.updateTag({ property: siteTag.name, content: siteTag.value });
        // this.metaService.updateTag({ name: siteTag.name, content: siteTag.value });
    });
  }


  // Subscribe to pro 
  subscribe(subId) {
    let url = this.cs.getUrl('subscribe')+''+subId+'/'+this.getUsrProfileData('user')+'/'+this.getLoggedInUserData().token;
    window.location.href = url;
  }

}//End class
