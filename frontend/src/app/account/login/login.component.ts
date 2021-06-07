import { Component, OnInit } from '@angular/core';
import {BackendService} from '../../services/backend.service';
import { AuthService } from "angularx-social-login";
import { FacebookLoginProvider, GoogleLoginProvider } from "angularx-social-login";
import { SocialUser } from "angularx-social-login";
import {CommonService} from '../../services/common.service';
import { TempdataService } from 'app/services/tempdata.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  data: Date = new Date();
  private socialUser: SocialUser;
  public language: any;
  public user;

  constructor(
    private dataServer : BackendService,
    private cs: CommonService,
    private authService: AuthService,
    private tds: TempdataService
  ) {

    if(this.cs.checkIfUserIsLoggedIn()) {
      this.cs.redirectToHome();
    }

    this.cs.activeMenu('login');

   }

  
  async ngOnInit() {
    //Set Language
    this.language = await this.tds.getLanguage();
    
    this.user ={wbuser:'',password:''};

    // CTIM
    var body = document.getElementsByTagName('body')[0];
    body.classList.add('full-screen');
    body.classList.add('register-page');
    var navbar = document.getElementsByTagName('nav')[0];
    navbar.classList.add('navbar-transparent');
  }



  attemptLogin(){
    
    this.dataServer.userLogin(this.user)
    .subscribe(
      resp =>{
        this.cs.hideLoader()
        if(resp['success']){
          console.log(resp['data']);
          this.tds.setBetaUser(resp['data'].isBetaUser);           
          this.cs.saveLoggedinUserData(resp['data']['user'],resp['data']['token'],resp['data']['userData']);
          this.checkActivity();
        }
      },
      err =>{
        this.cs.httpErrorHandler(err);
        console.log(err)
        //this.cs.httpErrorHandler(err)
      }
    )
  }

  ngOnDestroy(){
    var body = document.getElementsByTagName('body')[0];
    body.classList.remove('full-screen');
    body.classList.remove('register-page');
     var navbar = document.getElementsByTagName('nav')[0];
     navbar.classList.remove('navbar-transparent');
  }

  //Social login methods
  signInWithGoogle(): void {
    console.log('google');
    this.authService.signIn(GoogleLoginProvider.PROVIDER_ID).then((user)=>{
      this.user = user;
      console.log(user);
      let userData = {
        type: 'google',
        id: user.id,
        idToken: user.idToken,
        email: user.email,
        name: user.name,
        image: user.photoUrl,
        accessToken: user.authToken
      };
      this.dataServer.userSocialLogin(userData)
      .subscribe(
        resp =>{
          this.cs.hideLoader()
          if(resp['success']){
            console.log(resp['data']);
            //Set beta user flag
            this.tds.setBetaUser(resp['data'].isBetaUser);
            
            this.cs.saveLoggedinUserData(resp['data']['user'],resp['data']['token'],resp['data']['userData'])
            this.checkActivity();
          }
        },
        err =>{
          this.cs.httpErrorHandler(err);
          console.log(err)
          //this.cs.httpErrorHandler(err)
        }
      );
  });
  }
 
  // signInWithFB(): void {
  //   this.authService.signIn(FacebookLoginProvider.PROVIDER_ID).then((user)=>{
  //       console.log('fb');
  //       this.user = user;
  //       console.log(user);
  //       //'type','id','email','name','image','accessToken', ['country']
  //       let userData = {
  //         type: 'fb',
  //         id: user.id,
  //         email: user.facebook.email,
  //         name: user.facebook.name,
  //         image: user.photoUrl,
  //         accessToken: user.authToken
  //       };
  //       console.log(userData);
  //       this.dataServer.userSocialLogin(userData)
  //       .subscribe(
  //         resp =>{
  //           this.cs.hideLoader()
  //           if(resp['success']){
  //             console.log(resp['data']);
  //             this.cs.saveLoggedinUserData(resp['data']['user'],resp['data']['token'])
  //             this.cs.redirectToHome();
  //           }
  //         },
  //         err =>{
  //           this.cs.httpErrorHandler(err);
  //           console.log(err)
  //           //this.cs.httpErrorHandler(err)
  //         }
  //       );
  //   });
  // } 
 
  signOut(): void {
    this.authService.signOut();
  }

  //Check Activity
  checkActivity() {
    if(this.tds.getLastActivity()&&this.tds.getLastActivity()['lastUrl'].length>0) {
      let lastUrl = this.tds.getLastActivity()['lastUrl'];
      window.location = lastUrl[lastUrl.length-1];
    }    
    else {
      this.cs.redirectToHome();
    }
  }


//   login(){
//     this.dataServer.userLogin(this.user)
//     .subscribe(
//       resp => {
//         console.log(resp);

//         //this.response = resp['data']
        
//       },
//       erro => {
//         console.log(erro)
//       }
//     )
//   }
 }
