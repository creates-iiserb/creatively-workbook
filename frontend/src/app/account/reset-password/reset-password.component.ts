import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { FormBuilder, Validators, Form, FormGroup } from '@angular/forms';
import { BackendService } from '../../services/backend.service';
import { CommonService } from '../../services/common.service';
import { TempdataService } from 'app/services/tempdata.service';


@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  
  data : Date = new Date();
  public resetData:FormGroup;
  public language: any;


  constructor( private activatedRoute: ActivatedRoute, private router: Router, private dataServer: BackendService, private cs: CommonService,
    private tds: TempdataService, private fb: FormBuilder) {   

      this.resetData = this.fb.group({
        wbuser: [''],
        emailToken: [0],
        password: ['', [Validators.required,Validators.pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,15}$")]],
        cnfPassword: ['',Validators.required], 
      });
  }

  async ngOnInit() {
    //Set Language
    this.language = await this.tds.getLanguage();
    
   
    // this.response=" "
    this.activatedRoute.params.subscribe((params: Params) => {
      // :type/:typevalue
      this.resetData.get('wbuser').setValue(params['wbuser']);
      this.resetData.get('emailToken').setValue(params['emailToken']);
    });

    var body = document.getElementsByTagName('body')[0];
    body.classList.add('full-screen');
    body.classList.add('register-page');
    // var navbar = document.getElementsByTagName('nav')[0];
    // navbar.classList.add('navbar-transparent');

  }

  resetPassword() {
    if(this.resetData.status=='VALID' && this.resetData.get('password').value==this.resetData.get('cnfPassword').value) {
      delete this.resetData.value['cnfPassword'];

      this.dataServer.userResetPwd(this.resetData.value)
        .subscribe(
          resp => {
            this.cs.hideLoader();
            this.cs.showToast('success','',resp['data'].message,5000,'tfw');
            this.router.navigate(['account/login']);
          },
          err => {
            this.cs.httpErrorHandler(err);
          }
        );
    }
      
  }
 

  ngOnDestroy(){
    var body = document.getElementsByTagName('body')[0];
    body.classList.remove('full-screen');
    body.classList.remove('register-page');
    var navbar = document.getElementsByTagName('nav')[0];
    navbar.classList.remove('navbar-transparent');
  }//End


}
