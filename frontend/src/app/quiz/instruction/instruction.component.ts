import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { TempdataService } from '../../services/tempdata.service';
import { BackendService } from '../../services/backend.service';
import { Router } from '@angular/router';
import {CommonService} from '../../services/common.service';
// import * as $ from 'jquery';

@Component({
  selector: 'app-instruction',
  templateUrl: './instruction.component.html',
  styleUrls: ['./instruction.component.css']
})
export class InstructionComponent implements OnInit, AfterViewInit, OnDestroy {

  public QuizMetaData: any;
  public subs;
  public language: any;
  public isReview = false;
  public isBetaUser = false;
  public wbData:any;
  
  constructor(private tds: TempdataService, private _route: Router, private dataService: BackendService,
    private cs: CommonService) { 
      
      this.isBetaUser = this.tds.isBetaUser;
      
      //Check for review
      if(this.tds.isReview==true) {
        this.isReview = this.tds.isReview;
      }
  }
  

  async ngOnInit() {
    //Set Language
    this.language = await this.tds.getLanguage();

    await this.tds.getWbData.subscribe(res => {
      if(!res) {
        this.cs.redirectToHome();
        return;
      }
      else {
        this.wbData = res;
        // console.log(res);
        this.wbData['selectedDur'] = this.wbData['response'].resume==true? this.wbData['response'].duration:this.wbData.duration;
        this.wbData['quizMode'] = this.wbData['response'].resume==true? this.wbData['response'].mode:this.wbData.mode;
      }
    }).unsubscribe();

    if(this.wbData==undefined||this.wbData==''){
      this.cs.redirectToHome();
      return;
    }

    this.dataService.getQuizData(this.wbData['subId'],this.wbData['wsId'],this.wbData['mode'],this.wbData['duration'],true,false).subscribe(
      resp => {
        this.cs.hideLoader()
        
        if(resp['data'].generated==false){
          this.cs.showToast('warning','',resp['data'].message,3000,'tfw');
        }
        else {
          this.tds.setQuizMetaData(resp['data'].meta);
          this.QuizMetaData = resp['data'].meta;
          // console.log(resp['data']);
        }        
      },
      err => {
        this.cs.httpErrorHandler(err);
        this.cs.redirectToHome();
      }
    ); 
    
    // this.subs =  this.tds.getQuizMeta.subscribe(res => {      
    //   if(!res) {
    //     this.cs.redirectToHome();
    //     return;
    //   }
    //   this.QuizMetaData = res;
    //   console.log(this.QuizMetaData);
    // }).unsubscribe();
  }

  ngAfterViewInit() {
    this.cs.loadYtVideo();
    this.cs.loadPlotly();
    this.cs.loadPdf();
  }

  minDuration(dur) {
    return Math.floor(dur/2);
  }

  maxDuration(dur) {
    return parseInt(dur)*2;
  }
 

  async playQuiz() { 
    this.dataService.getQuizData(this.wbData.subId,this.wbData.wsId,this.wbData['quizMode'],this.wbData['selectedDur'],false,true).subscribe(
      resp => {
        this.cs.hideLoader();
        
        if(resp['data'].generated==false){
          this.cs.showToast('warning','',resp['data'].message,3000,'tfw');
        }
        else {
          console.log(resp['data'].quizdata)
          this.tds.setQuizData(resp['data'].quizdata);
          this._route.navigate(['/quiz/play']);
        }        
      },
      err => {
        this.cs.httpErrorHandler(err);
        this.cs.redirectToHome();
      }
    ); 

  }//End

  ngOnDestroy(){
    //this.subs.unsubscribe()
  }

}//End class
