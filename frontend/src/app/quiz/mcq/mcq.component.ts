import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { OnChanges, SimpleChanges } from '@angular/core';
import { TempdataService } from '../../services/tempdata.service';
import {CommonService} from '../../services/common.service';

@Component({
  selector: 'app-mcq',
  templateUrl: './mcq.component.html',
  styleUrls: ['./mcq.component.css']
})
export class McqComponent implements OnInit, OnChanges, AfterViewInit {

  @Input('qusData') QusData: any;
  @Input('quizRes') quizRes:any;
  @Input('qusRef') QusRef:any;
  @Output() public ansRes:EventEmitter<any> = new EventEmitter();
  public cursor = -1;
  public language: any;
  public isReview = false;

  constructor(private tds: TempdataService, private cs: CommonService) {
    this.isReview = this.tds.isReview;
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['QusRef']) {
      this.cursor = -1;
      if(this.quizRes.tempAns!=-1) {
        this.cursor = this.quizRes.tempAns;
      }
    }
    
  }

  async ngOnInit() {
    //Set Language
    this.language = await this.tds.getLanguage();

    if(this.quizRes.tempAns!=-1) {
      this.cursor = this.quizRes.tempAns;
    }
  }

  ngAfterViewInit() {
    this.cs.loadYtVideo();
    this.cs.loadPlotly();
    this.cs.loadPdf();
  }


  setAnswer(id) {
    //if(this.quizRes.lock!=true&&this.isReview==false) {
      if(this.cursor==id) {
        this.cursor = -1;
        this.quizRes.lock = false;
      }
      else {
        this.cursor = id;
        this.quizRes.lock = true;
      } 
  
      this.quizRes.tempAns = this.cursor;
      this.quizRes.answerId = this.cursor;
  
      this.ansRes.emit(this.quizRes);
    //}

    
  }

}//End class
