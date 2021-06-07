import { Component, AfterViewInit, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { OnChanges, SimpleChanges } from '@angular/core';
import { TempdataService } from '../../services/tempdata.service';
import {CommonService} from '../../services/common.service';

@Component({
  selector: 'app-fillin',
  templateUrl: './fillin.component.html',
  styleUrls: ['./fillin.component.css']
})
export class FillinComponent implements OnInit, AfterViewInit, OnChanges {

  @Input("qusData") QusData:any;
  @Input("quizRes") QuizRes:any;
  @Input('qusRef') QusRef:any;
  @Output() public ansRes:EventEmitter<any> = new EventEmitter();
  
  public isChanges = false;
  public inputControls:any;
  public inputLen:any;
  public fillinAns:Object = {};
  public fillinRes:Object = {};
  public isReview:any = false;

  constructor(private tds:TempdataService, private cs: CommonService) { 
    this.isReview = this.tds.isReview;
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) { 
    if(changes['QusRef']) {
      this.isChanges = true;  
    }
  }

  ngAfterViewInit() {
    this.initFillin();     
    this.cs.loadYtVideo();
    this.cs.loadPlotly();
    this.cs.loadPdf();
  }//End

  initFillin() { 
    this.inputControls = document.getElementById('fillin').getElementsByTagName('input');
    this.inputLen = document.getElementById('fillin').getElementsByTagName('input').length;
    this.fillinAns = [];

    for(let i=0;i<this.inputLen;i++) {  
         
      let keyVal = this.inputControls[i].attributes['name'].nodeValue;       
      this.inputControls[i].addEventListener("keyup",(event)=>{this.setFillin(event)}); 
      this.inputControls[i].setAttribute("id",keyVal);
    
      this.fillinAns[keyVal] = {
        name : this.inputControls[i].attributes['name'].nodeValue,
        type : this.inputControls[i].attributes['type'].nodeValue,
        value : ''
      };
      //Initilize fillin ans res with the blank vlaue
      this.fillinRes[keyVal] = "";
     
      if(i==this.inputLen-1) {
        this.setFillinAns();
      }
    }
  }//End

  setFillinAns() {
    if(this.QuizRes.tempAns!=-1) {
      for(let x in this.QuizRes.tempAns) {
        this.fillinAns[x].value = this.QuizRes.tempAns[x];
        this.fillinRes[x] = this.QuizRes.tempAns[x];
        document.getElementById(x).attributes['value'].value = this.QuizRes.tempAns[x];
      }
    }
  }//End

  setFillin(e:any) {
    let ans = this.fillinAns[e.target.name].type;
    this.fillinRes[e.target.name] = (e.target.value=='')? '':(ans=='number')? parseFloat(e.target.value):e.target.value;
    this.QuizRes.tempAns = this.fillinRes;
    this.ansRes.emit(this.QuizRes);
  }//End

}//End Class
