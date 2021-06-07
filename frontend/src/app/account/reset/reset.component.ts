import { Component, OnInit } from '@angular/core';
import { BackendService } from '../../services/backend.service';
import { CommonService } from '../../services/common.service'
import { TempdataService } from 'app/services/tempdata.service';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.css']
})
export class ResetComponent {
  public wbuser;
  data : Date = new Date();
  public language: any;

  constructor(
    private dataServer: BackendService,
    private cs: CommonService,
    private tds: TempdataService
  ) { }

  sendResetLink() {
    this.dataServer.userResetLink(this.wbuser)
      .subscribe(
        resp => {
          console.log(resp);
          this.cs.hideLoader();
          this.cs.showToast('success','',resp['data'].message,5000,'tfw');
        }, err => {
          this.cs.httpErrorHandler(err);
        }
      )
  }//End

  async ngOnInit() {
    //Set Language
    this.language = await this.tds.getLanguage();
    
    var body = document.getElementsByTagName('body')[0];
    body.classList.add('full-screen');
    body.classList.add('register-page');
    var navbar = document.getElementsByTagName('nav')[0];
    navbar.classList.add('navbar-transparent');
  }//End

  ngOnDestroy(){
    var body = document.getElementsByTagName('body')[0];
    body.classList.remove('full-screen');
    body.classList.remove('register-page');
    var navbar = document.getElementsByTagName('nav')[0];
    navbar.classList.remove('navbar-transparent');
  }//End

}
