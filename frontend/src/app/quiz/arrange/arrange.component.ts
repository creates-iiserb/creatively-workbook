import { Component, Input, Output, OnInit, EventEmitter, AfterViewInit  } from '@angular/core';
import { OnChanges, SimpleChanges } from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {TempdataService} from '../../services/tempdata.service';
import {CommonService} from '../../services/common.service'; 

@Component({
  selector: 'app-arrange',
  templateUrl: './arrange.component.html',
  styleUrls: ['./arrange.component.css']
})
export class ArrangeComponent implements OnInit, AfterViewInit {

  @Input("qusData") QusData:any;
  @Input("quizRes") quizRes:any;
  @Input('qusRef') QusRef:any;
  @Output() public ansRes:EventEmitter<any> = new EventEmitter();

  public items:Array<number> = [];
  public language: any;
  public isReview:any = false;

  constructor(private tds:TempdataService, private cs: CommonService) {

    this.isReview = this.tds.isReview;
  }


  async ngOnInit() {
    //Set Language
    this.language = await this.tds.getLanguage();
    //this.setArrangeOpt();  
  }//End

  ngOnChanges(changes: SimpleChanges) {
    if(changes['QusRef']) {
      this.items = [];
      this.setArrangeOpt();
    }
  }

  ngAfterViewInit() {
    this.cs.loadYtVideo();
    this.cs.loadPlotly();
    this.cs.loadPdf();
  }

  setArrangeOpt() {
    if(this.quizRes.tempAns!=-1) {
      this.items = this.quizRes.tempAns;
    }
    else {
      this.QusData.items.forEach(item => {
        this.items.push(item.id);
        this.quizRes.tempAns = this.items;
        this.ansRes.emit(this.quizRes);
      });
    }
  }

  drop(event: CdkDragDrop<any[]>) {
    if(this.quizRes.lock==true) {
      this.cs.displayMessage('info',this.language.msg_plsUnlockAns,2);
      return;
    }
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);

    this.quizRes.answerId = this.items;
    this.quizRes.tempAns = this.items;
    this.ansRes.emit(this.quizRes);
    // console.log(this.items);
  }//End drop

}
