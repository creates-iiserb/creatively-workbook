import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { TempdataService } from '../../services/tempdata.service';
import {BackendService} from '../../services/backend.service';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-betawbdetails',
  templateUrl: './betawbdetails.component.html',
  styleUrls: ['./betawbdetails.component.scss']
})
export class BetawbdetailsComponent implements OnInit {

  public wbId;
  public pubId;
  public wbListId:any = [];
  public wbDetails:any;
  public language: any;
  public wbContent:any = {
    "noOfWs"    : 0,
    "freeItems" : 0,
    "freeExp"   : 0,
    "freeHint"  : 0,
    "suggDur"   : 0
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private tds: TempdataService,
    private dataServer : BackendService,
    private cs :CommonService

  ) { 

    this.cs.activeMenu('betaStore');
    
    (async ()=> {
      let isBeta = await this.tds.getBetaUser();
      if(!isBeta) {
        this.cs.redirectToHome();
      }
    })();
    
  }

  async ngOnInit() {

    //Set Language
    this.language = await this.tds.getLanguage();

    this.wbListId = await this.tds.getUserData();
      // this.wbListId = this.wbListId['wblist'];

    this.activatedRoute.params.subscribe((params: Params) => {
       
      this.wbId = params['wbId'];
      this.pubId = params['pubId'];
      
      this.dataServer.getBetaWbDetails(this.wbId,this.pubId)
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
          }
        )
      
    });

  }


  getBetaWorkbook(){
    if(this.cs.checkIfUserIsLoggedIn()) {
      this.dataServer.getBetaWorkBook(this.wbId,this.pubId)
      .subscribe(resp => { 
        this.cs.hideLoader()
        if(resp['success']){
        // console.log('success');     
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
      this.cs.displayMessage('info','Please login first.',2000);
    }
    
  }//End

}//End Class
