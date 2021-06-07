import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ElementRef } from '@angular/core';
import { OnChanges, SimpleChanges } from '@angular/core';
import { TempdataService } from '../../services/tempdata.service';
import {CommonService} from '../../services/common.service';
import * as $ from 'jquery';

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit, AfterViewInit {

  @Input('qusData') QusData: any;
  @Input('quizRes') quizRes:any;
  @Input('qusRef') QusRef:any;
  @Output() public ansRes:EventEmitter<any> = new EventEmitter();
  public cursor = -1;
  public language: any;

  constructor(private tds: TempdataService, private cs: CommonService,private myElement: ElementRef) {
   
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['QusRef']) {
      // console.log(this.QusData);
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

  scrollTo(id,i) {;
    let el = document.getElementById(id+i);
    // console.log(document.getElementById(id+i));
    el.scrollIntoView();
  }

  ngAfterViewInit() {
    this.cs.loadYtVideo();
    this.cs.loadPlotly();
    this.cs.loadPdf();
    
    $('.flip-card').click(function(){
      $(this).toggleClass('flipped');
    });

  }

  setAnswer(id) {
    // if(this.quizRes.lock==true) {
    //   this.tds.setAlert('info',this.language.msg_plsUnlockAns);
    //   return;
    // }

    // if(this.cursor==id) {
    //   this.cursor = -1;
    //   this.quizRes.lock = false;
    // }
    // else {
    //   this.cursor = id;
    //   this.quizRes.lock = true;
    // } 

    // this.quizRes.tempAns = this.cursor;
    // this.quizRes.answerId = this.cursor;

    this.ansRes.emit(this.quizRes);
  }

}//End class
