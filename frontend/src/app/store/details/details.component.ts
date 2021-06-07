import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import {BackendService} from '../../services/backend.service';
import { CommonService } from '../../services/common.service';
import { TempdataService } from 'app/services/tempdata.service';
import { FourmsService } from 'app/services/fourms.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {

  public wbId;
  public wbListId:any = [];
  public wbDetails:any='';
  public language: any;
  public wbContent:any = {
    "noOfWs"    : 0,
    "freeItems" : 0,
    "freeExp"   : 0,
    "freeHint"  : 0,
    "suggDur"   : 0
  };
  //Reviews/Rating
  public reviewsData:any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dataServer : BackendService,
    private cs :CommonService,
    private tds: TempdataService, private _forums: FourmsService

  ) { 
    
    this.cs.activeMenu('store');
  }
  

  async ngOnInit() {

    //Set Language
    this.language = await this.tds.getLanguage();

    if(this.cs.checkIfUserIsLoggedIn()) {
      this.wbListId = await this.tds.getUserData();
      // console.log(this.wbListId)
      // this.wbListId = this.wbListId['wblist'];
    }

    this.activatedRoute.params.subscribe((params: Params) => {
      // :type/:typevalue
      this.wbId = params['wbId'];
      // console.log(wbId);
      this.dataServer.getWorkbookDetails(this.wbId)
        .subscribe(
          resp => {
            this.cs.hideLoader()
            // console.log(resp);
            this.wbDetails = resp['data'];

            //Calc WB Free Content
            this.wbContent.noOfWs = this.wbDetails.worksheets.length;

            this.wbDetails.worksheets.forEach(element => {
              this.wbContent.freeItems += parseInt(element.free.items);
              this.wbContent.freeExp += parseInt(element.free.explanations);
              this.wbContent.freeHint += parseInt(element.free.hints);
              this.wbContent.suggDur += parseInt(element.time);
            });
          },
          err => {
            this.cs.httpErrorHandler(err);
            // if (erro.error.error.code == 'notFound') {
            //   this.router.navigate(['notfound'])
            // }
            // console.log(erro)
          }
        )
      
    });

  }
  
  getNewWorkbook(){
    if(this.cs.checkIfUserIsLoggedIn()) {
      this.dataServer.getWorkBook(this.wbId)
      .subscribe(resp => { 
        this.cs.hideLoader()
        if(resp['success']){
        //console.log('success');     
        }
        // console.log(resp);
        this.cs.redirectToHome();      
      },
      err => {
        this.cs.httpErrorHandler(err);
          console.log(err) 
      });
    }
    else {
      // console.log(document.URL);
      this.tds.setLastActivity('lastUrl',document.URL);
      this.cs.showToast('warning','','Please login first.',2000,'tfw');
      this.router.navigate(['/account/login']);
    }
    
  }//End

  async getRatings(content) {
    if(!this.reviewsData) {
      this.reviewsData = await this._forums.getEntry(this.wbListId['wbDets'][this.wbDetails.wbId],this.wbDetails.wbId,'RT'+this.wbDetails.wbId);
      this.reviewsData = await this.reviewsData['data'];
    }
    this.tds.open(content,'xl');
  }

}
