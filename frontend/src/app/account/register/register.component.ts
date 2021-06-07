import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, Form, FormGroup } from '@angular/forms';
import {BackendService} from '../../services/backend.service';
import {CommonService} from '../../services/common.service';
import { TempdataService } from 'app/services/tempdata.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  data : Date = new Date();

  public response=" ";
  // public newUser:any={};
  public language: any;
  public country:any;
  public newUser:FormGroup;

  constructor(private dataServer : BackendService, private cs: CommonService, private tds: TempdataService, private fb:FormBuilder) { 
    
    this.cs.activeMenu('signUp');
    if(this.cs.checkIfUserIsLoggedIn()) {
      this.cs.redirectToHome();
    }

    this.newUser = this.fb.group({
      name: [''],
      password: ['', [Validators.required,Validators.pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,15}$")]],
      cnfPassword: ['',Validators.required],
      wbuser: ['',[Validators.required,Validators.pattern("^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$")]],
      country: ['',Validators.required]
    });
  }

  async ngOnInit() {
    //Set Language
    this.language = await this.tds.getLanguage();

    this.country = await this.cs.getCountry();
    
    // CTIM
    var body = document.getElementsByTagName('body')[0];
    body.classList.add('full-screen');
    body.classList.add('register-page');
    // var navbar = document.getElementsByTagName('nav')[0];
    // navbar.classList.add('navbar-transparent');
  }

  signUp(){
    if(this.newUser.status=='VALID' && this.newUser.value['password']==this.newUser.value['cnfPassword']){

      delete this.newUser.value['cnfPassword'];

      this.dataServer.userNew(this.newUser.value)
      .subscribe(
        resp=>{
          console.log(resp);
          this.cs.hideLoader();
          this.cs.showToast('success','',resp['data']['message'],2000,'tfw');
        },err=>{
          this.cs.httpErrorHandler(err);
          console.log(err);
        }
      );
    }
      
  }
  // userVerify

  
  ngOnDestroy(){
    var body = document.getElementsByTagName('body')[0];
    body.classList.remove('full-screen');
    body.classList.remove('register-page');
    var navbar = document.getElementsByTagName('nav')[0];
    navbar.classList.remove('navbar-transparent');
  }



}
