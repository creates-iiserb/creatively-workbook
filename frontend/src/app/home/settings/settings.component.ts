import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BackendService } from '../../services/backend.service';
import { CommonService } from '../../services/common.service'
import { TempdataService } from 'app/services/tempdata.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  public isImage:any = false;
  public data : Date = new Date();
  public user:any = {};
  public isUpdate = false;
  public isPwd = false;
  public changePwd: FormGroup;
  public language: any;

  constructor(
    private dataServer: BackendService,
    private cs: CommonService,
    private fb: FormBuilder,
    private tds: TempdataService
  ) { 

    this.cs.activeMenu('settings');
    console.log('settings');

    this.changePwd = this.fb.group({
      newPwd: ['',[Validators.required, Validators.pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,15}$")]],
      cnfPwd: ['',[Validators.required]]
    });

  }
  

  async ngOnInit() {
    //Set Language
    this.language = await this.tds.getLanguage();
    
    this.user = {
      name : '',
      country :'',
      image:'',
      createdOn:'',
      email:'',
      password:'',
      _id:''
    }

    this.getUserDetails();

    var body = document.getElementsByTagName('body')[0];
    body.classList.add('settings-page');
    // var navbar = document.getElementsByTagName('nav')[0];
    // navbar.classList.add('navbar-transparent');
    // navbar.classList.add('bg-danger');
    
  }

  getUserDetails() {
    this.dataServer.userDataGet().subscribe(resp => { 
      this.cs.hideLoader()
      console.log(resp);
      this.user = resp['data'];
      localStorage.setItem('name', this.user.name);
      localStorage.setItem('image', this.user.image); 
    },
    err => {
      this.cs.httpErrorHandler(err);
      console.log(err) 
    });
  }

  updateUserDetails(data) {

  }

  onFileChanged(event) {
    
    if(event.target.files[0].size > 50000 || event.target.files[0].type!="image/jpeg") {
      this.cs.showToast('warning','',this.language.msg_profilePicValidation,5000,'tfw');
      this.isImage = false;
      return;
    }
    else {
      if(event.target.files.length!=0) {
        let newPhoto = event.target.files[0];
        var reader = new FileReader();
        reader.readAsDataURL(newPhoto);
        this.user['image'] = reader
        let angObj = this;
        reader.onload = (e)=>{
          angObj.user['image'] = reader.result;
          this.isImage = true;
        }  
      }  
      else {
        this.isImage = false;
      }
    }
  }
  
  updateData(type){
    let data = {}
    if(type=='image'){
      data['image'] = this.user['image']
    }else if(type == 'details'){
      data['name'] = this.user['name'],
      data['phone'] = this.user['contact']
      data['country'] = this.user['country']
    }else if (type=='password'){
      data['password'] = this.changePwd.get('newPwd').value;
    }
    this.dataServer.userDataUpdate(data)
    .subscribe(resp=>{
      this.cs.hideLoader();
      console.log(resp);
      this.cs.showToast('success','',resp['data'].message,5000,'tfw');
      this.isImage = false;
      this.isUpdate = false;
      this.isPwd = false;
      this.getUserDetails();
    },
    err=>{
      this.cs.hideLoader();
      this.cs.httpErrorHandler(err);
      
      if(type=='image'){
        this.isImage = true;
      }else if(type == 'details'){
        this.isUpdate = true;
      }else if (type=='password'){
        this.isPwd = true;
      }
      // console.log(err)
    })
  }

  updateDetails(type) {
    if(type=='details') {
      this.isUpdate = true;
    }
    else if(type=='pwd') {
      this.isPwd = true;
    }
    else {
      this.isUpdate = false;
      this.isPwd = false;
    }
  }

  
  changePassword(data:any) { 
    if(this.changePwd.valid) {
      if(this.changePwd.get('newPwd').value==this.changePwd.get('cnfPwd').value) {
        this.updateData('password');
      }
      else {
        this.cs.showToast('error','',"Please confirm new password.",5000,'tfw');
        this.changePwd.status=='INVALID';
      }      
    }
    else {
      this.cs.showToast('error','',"Please make sure all fields are valid.",5000,'tfw');
      this.changePwd.status=='INVALID';
    }
  }

  ngOnDestroy(){
    var body = document.getElementsByTagName('body')[0];
    body.classList.remove('settings-page');
    var navbar = document.getElementsByTagName('nav')[0];
    navbar.classList.remove('navbar-transparent');
    navbar.classList.remove('bg-danger');
  }

  memberSince(date) {
    return new Date(date).toString().slice(0,15);
  }

}//End class
