import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { TempdataService } from '../../services/tempdata.service';
import { CommonService } from 'app/services/common.service';

declare const LC:any;

@Component({
  selector: 'app-wboard',
  templateUrl: './wboard.component.html',
  styleUrls: ['./wboard.component.scss']
})
export class WboardComponent implements OnInit, AfterViewInit {

  @Input('wboardData') wBoardData: any;
  @Output() public wBoardRes:EventEmitter<any> = new EventEmitter();

  public lcobj:any;
  public delShape:any;
  public language:any;

  constructor(private ts: TempdataService, private cs: CommonService) { }

  async ngOnInit() {
    this.language = await this.ts.getLanguage();
  }


  ngAfterViewInit() {

    this.whiteBoardInit();
  }

  async whiteBoardInit() {
    this.lcobj = await LC.init(
      document.getElementById('wboard'),
      {
        imageURLPrefix: 'assets/static/img',
        tools:[LC.tools.Pencil,LC.tools.Line,LC.tools.Ellipse,LC.tools.Rectangle,LC.tools.Text,LC.tools.Polygon,LC.tools.Pan,LC.tools.Eyedropper,LC.tools.SelectShape]
      }
    );
    
    if(this.wBoardData['type']!='new') {
      this.lcobj.loadSnapshot(this.wBoardData['data']['snapshot']);
    }

    await this.lcobj.on('drawingChange',()=>{
      let drwaing = {
        "snapshot" : this.lcobj.getSnapshot(['shapes', 'colors'])
        // "svg" : this.lcobj.getSVGString()
      }
      this.wBoardData['data'] = drwaing;
      if(this.wBoardData['data']['snapshot']['shapes'].length>30) {
        this.cs.showToast('info','',this.language.msg_maxShapeAllowed,3000,'tfw');
      }
    });

    await this.lcobj.on('toolChange',()=>{
      this.delShape = false;
    });

    await this.lcobj.on('lc-pointerup',()=>{
      if(this.lcobj['selectedShape'] && Object.keys(this.lcobj['selectedShape']).length!=0) {
        this.delShape = true;
      }
    });


  }

  async delSelectedShape() {
    this.lcobj['shapes'].splice(this.lcobj['selectedShape'].shapeIndex,1);
    this.lcobj._shapesInProgress = [];
    this.lcobj.trigger('drawingChange', {});
    this.lcobj.repaintLayer('main');
  }

  // addImg() {
  //   var img = new Image();
  //   img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABsklEQVR4AcSWg5LsQBiF51Xue1zbtm3btr22vYW1bdu2rfScTafGZudUfePJ/6UtASCwb/nTJfuXPfXkqeYhPLAxRHZtT1pLXld4OLD86W7+iwkeMGKC1hQEqA3j4goJWlsia3aIhCcVqBZRoJoKEBEFiMTYjw6seIYja14aZvVLiyWMCnx57AdTMjU5g7bGHkT4pOHstg+sBbRlbh75aXsBKZEiNaZYi8LMGqGoajqa+2wvMD+/oPd3h1Y+R3xkPlRzafdndgKUh+ccoJpX193YCtA7locQglOb37EVCPFIhjy15W22HwML8xyeXHTS4vMjP2TEl2Judh40nW399pkFpmR8dAo3Dv0Qdx3gFjj4O8bbpwuu7PuqxbUD3/D3XSgKMmuEwSfP71fBbAchJcwrFfJ0tvazF3h49j9Uc2zda7YCdEZor4YMBfLSqiDP5MQMDix/ZlMBneeBY+te4f1dL6REF4PjCOTJSa4QZxrSjAxN4Nz2D+wF6JadkVCG6we/22YdeHDmP93zDUK3YT/HOHx/HojF5UIsJhoPeKN0wJvlA94xGfCu2YB3Tge8ew4AEQyI4dT6lRMAAAAASUVORK5CYII=';
  //   this.lcobj.saveShape(LC.createShape('Image', {x: 100, y: 100, image: img}))
  // }

  addDrwaing() {
    if(this.wBoardData['data']['snapshot']['shapes'].length>30) {
      this.cs.showToast('info','',this.language.msg_maxShapeAllowed,3000,'tfw');
    }
    else {
      this.wBoardRes.emit(this.wBoardData);
    }
  }

}//End Class
