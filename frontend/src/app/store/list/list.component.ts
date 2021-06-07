import { Component, OnInit, OnDestroy } from '@angular/core';
import { BackendService } from '../../services/backend.service';
import { CommonService } from '../../services/common.service';
import { TempdataService } from 'app/services/tempdata.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit, OnDestroy {

  public wbList = [];
  public wbListId:any = [];
  public language: any;

  constructor(
    private dataServer : BackendService,
    private cs :CommonService,
    private tds: TempdataService
  ) { 

    this.cs.activeMenu('store');

    // let body = document.getElementsByTagName('body')[0];
    // body.classList.add('store-theme');

  }
 
  async ngOnInit() {

    //Set Language
    this.language = await this.tds.getLanguage();

    if(this.cs.checkIfUserIsLoggedIn()) {
      this.wbListId = await this.tds.getUserData();
      this.wbListId = this.wbListId['wblist'];
    }
    
    this.dataServer.getWorkBookList()
    .subscribe(
      resp => {
        this.cs.hideLoader();
        console.log(resp);
        this.wbList = resp['data']; 
      },
      err => {
        this.cs.httpErrorHandler(err);
        // console.log(err)
    });

  }


  ngOnDestroy() {
    // let body = document.getElementsByTagName('body')[0];
    // body.classList.remove('store-theme');
  }


}//End Class
