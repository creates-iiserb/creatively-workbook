import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { SimpleChanges } from '@angular/core'; 
import { TempdataService } from '../../services/tempdata.service';

@Component({
  selector: 'app-math',
  templateUrl: './math.component.html',
  styleUrls: ['./math.component.css']
})
export class MathComponent implements OnChanges,OnInit {
  @Input("content") content :any;
  public mathID:any = '';

  constructor(private tds:TempdataService) {
    this.content = this.tds.sanitizeHtml(this.content);

    this.mathID +=  Math.round((Math.random() * 10000))
  }
  mathJaxObject;

  ngOnChanges(changes: SimpleChanges) {
    // to render math equations again on content change
    if (changes['content']) {
      this.content = this.tds.sanitizeHtml(this.content);
      this.renderMath()
    }
  }
  ngOnInit() {    
    //console.log(this.content);
    this.loadMathConfig()
    this.renderMath();
  }

  updateMathObt(){
    this.mathJaxObject = window['MathJax'];
  }

  renderMath() {
    this.updateMathObt();
    setTimeout(() => {
      // this.mathJaxObject['Hub'].Queue(["Typeset", this.mathJaxObject.Hub], 'mathContent');
      this.mathJaxObject['Hub'].Queue(["Typeset", this.mathJaxObject.Hub], this.mathID);
    },1000)
  }
  loadMathConfig() {
    this.updateMathObt();
    this.mathJaxObject.Hub.Config({
      showMathMenu: false,
      // tex2jax: { inlineMath: [["$", "$"]],displayMath:[["$$", "$$"]] },
      menuSettings: { zoom: "Double-Click", zscale: "150%" },
      CommonHTML: { linebreaks: { automatic: true } },
      "HTML-CSS": { linebreaks: { automatic: true } },
      SVG: { linebreaks: { automatic: true } }
    });
  }
}