import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { OnChanges, SimpleChanges } from '@angular/core';
import { TempdataService } from '../../services/tempdata.service';
import {CommonService} from '../../services/common.service';
import { ConfigService } from 'app/services/config.service';

@Component({
  selector: 'app-subjective',
  templateUrl: './subjective.component.html',
  styleUrls: ['./subjective.component.scss']
})
export class SubjectiveComponent implements OnInit, OnChanges, AfterViewInit {

  @Input('qusData') QusData: any;
  @Input('quizRes') quizRes:any;
  @Input('qusRef') QusRef:any;
  @Input('lang') language:any;
  @Input('qusResponse') qusResData:any;
  @Output() public ansRes:EventEmitter<any> = new EventEmitter();
  public cursor = '';
  // public language: any;
  public isReview = false;
  public ckeditorConfig: any;
  public showWBoard:any = false;
  public wBoardOpt: any;

  constructor(private tds: TempdataService, private cs: CommonService, private confService: ConfigService) {
    this.isReview = this.tds.isReview;
    this.ckeditorConfig = this.confService.get('ckeditorConfig');
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['QusRef']) {
      this.cursor = '';
      if(this.quizRes.tempAns!=-1) {
        if(this.QusData.limit==0) {
          this.quizRes.tempAns['text'] = '';
        }
        this.cursor = this.quizRes.tempAns['text'];
      } 
      else if(this.quizRes.type=='sub') {
        this.quizRes.tempAns = {text:'',drawing:[]};
      }
    }
  }//ENd

  async ngOnInit() {
    // console.log(this.QusData)
    // console.log(this.quizRes);
    //Set Language
    // this.language = await this.tds.getLanguage();
    // console.log(this.QusData);
    this.cs.loadYtVideo();
    this.cs.loadPlotly();
    this.cs.loadPdf();

    if(this.quizRes.tempAns!=-1) {
      this.cursor = this.quizRes.tempAns['text'];
    }
    
  }

  ngAfterViewInit() {
    this.cs.loadYtVideo();
    this.cs.loadPlotly();
    this.cs.loadPdf();
  }

  async updateRes(e:any) {
    let newStr = e.editor.getData().trim();
    this.quizRes.tempAns['text'] = newStr;
    newStr = newStr.replace(/(<([^>]+)>)/ig, '');

    if(newStr.length>this.QusData.limit) {
      this.cs.showToast('warning','',this.language.msg_subTxtOverLimit,2000,'tfw');
    }

  }

  openWBoard(type,data='',index=-1) {
    this.wBoardOpt = {
      data: data,
      type: type,
      index: index
    };

    this.showWBoard = true;
  }

  closeWBoard() {
    this.showWBoard = false;
  }

  setDrawing(drawing) {
      if(drawing.type=='new' && this.quizRes.tempAns['drawing'].length<this.QusData.allowedDrawings) {
        this.quizRes.tempAns['drawing'].push(drawing['data'])
      }
      else if(drawing.type=='edit'){
        this.quizRes.tempAns['drawing'][drawing['index']] = drawing['data'];
      }
      // else {
      //   this.cs.showToast('info','',"You can add only 3 drawing.",2000,'tfw');
      // }
    this.showWBoard = false;
  }

  removeDrawing(i) {
    if(confirm(this.language.msg_delDrawingConfirm)) {
      this.quizRes.tempAns['drawing'].splice(i,1);
    }
  }

  open(content) {
    this.tds.open(content,'xl');
  }

  // setAnswer() {
  //   if(this.quizRes.tempAns['text']=='' && this.quizRes.tempAns['drawing'].length==0) {
  //     this.quizRes.lock = false;
  //     this.quizRes.answerId = -1;
  //     this.cs.showToast('warning','',this.language.msg_ansSubjectiveQus,2000,'tfw');
  //   }
  //   else {
  //     this.closeWBoard();
  //     this.quizRes.lock = true;
  //     this.quizRes.tempAns['text'] = this.cursor;
  //     this.quizRes.answerId = this.quizRes.tempAns;
  //   }
    
  //   this.ansRes.emit(this.quizRes);
  // }

}//End class
