import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import {BackendService} from '../../services/backend.service';
import {CommonService} from '../../services/common.service'
import { TempdataService } from 'app/services/tempdata.service';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.css']
})
export class VerifyComponent implements OnInit {
  public response;
  public userEmail;
  public verification;
  public language: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dataServer : BackendService,
    private cs: CommonService,
    private tds: TempdataService
  ) {

   }

  async ngOnInit() {
    //Set Language
    this.language = await this.tds.getLanguage();
    
    this.response=" "
    this.activatedRoute.params.subscribe((params: Params) => {
      // :type/:typevalue
      this.userEmail = params['uname'];
      let token  = params['token'];
      
      this.dataServer.userVerify(this.userEmail,token)
        .subscribe(
          resp => {
            this.cs.hideLoader()
            //  console.log(resp);
             this.response = resp['data']['message'];
             this.verification = true;
          },
          err => {
            this.cs.httpErrorHandler(err);
            this.response = err.error.message;
            this.verification = false;
            // if (erro.error.error.code == 'notFound') {
            //   this.router.navigate(['notfound'])
            // }
            // console.log(err)
          }
        )
      
    });

  }

}
