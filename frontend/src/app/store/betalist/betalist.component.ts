import { Component, OnInit } from '@angular/core';
import { BackendService } from '../../services/backend.service';
import { CommonService } from '../../services/common.service';
import { TempdataService } from 'app/services/tempdata.service';

@Component({
  selector: 'app-betalist',
  templateUrl: './betalist.component.html',
  styleUrls: ['./betalist.component.scss']
})
export class BetalistComponent implements OnInit {

  public wbList = [];
  public wbListId:any = [];
  public language: any;

  constructor(
    private dataServer : BackendService,
    private cs :CommonService,
    private tds: TempdataService
  ) { 

    this.cs.activeMenu('betaStore');

    if(!this.tds.getBetaUser()) {
      this.cs.redirectToHome();
    }
  }//Constructor

  async ngOnInit() {
    //Set Language
    this.language = await this.tds.getLanguage();

    this.wbListId = await this.tds.getUserData();
    this.wbListId = this.wbListId['wblist'];

    this.dataServer.getBetaWorkBookList()
    .subscribe(
      resp => {
        this.cs.hideLoader();
        // console.log("WB LIST");
        console.log(resp);
        this.wbList = resp['data'].list; 
      },
      err => {
        this.cs.httpErrorHandler(err);
        // console.log(err)
    });
  }

}//End class
