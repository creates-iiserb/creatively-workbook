import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { OnChanges, SimpleChanges } from '@angular/core';
import { UtilsPipe } from 'app/pipe/utils.pipe';
import { CommonService } from 'app/services/common.service';
import { TempdataService } from 'app/services/tempdata.service';


@Component({
  selector: 'app-ratings',
  templateUrl: './ratings.component.html',
  styleUrls: ['./ratings.component.scss'],
  providers: [UtilsPipe],
})
export class RatingsComponent implements OnInit, OnChanges {

  @Input('data') data:any;
  @Input('flag') flag:any = true;
  @Output() public setRating:EventEmitter<any> = new EventEmitter();

  public ratingVal:any;
  public comment:any;
  public reviewsData:any;
  public crrUser: any;
  public language:any;

  public listSize:any = 5
  public showReviews:any = [0,this.listSize];

  constructor(private utils:UtilsPipe, private cs: CommonService,private tds: TempdataService) { }

  async ngOnChanges(changes: SimpleChanges) {
    if(changes['data']) {
      this.reviewsData = await this.utils.transform(this.data,'rating');
      this.ratingVal = this.reviewsData['isRated'].length==0? '':this.reviewsData['isRated'][0]['rating'];
    }
    
  }

  async ngOnInit() {
    //Set Language
    this.language = await this.tds.getLanguage();

    this.crrUser = await this.cs.getUsrProfileData('user');
    this.reviewsData = await this.utils.transform(this.data,'rating');
    this.ratingVal = this.reviewsData['isRated'].length==0? '':this.reviewsData['isRated'][0]['rating'];
    // console.log(this.reviewsData);
  }

  rateStar(val) {
    if(this.reviewsData['isRated'].length==0) {
      this.ratingVal = val;
    }
  }

  rateUs() {
    this.setRating.emit({stmt:this.comment, rating: this.ratingVal});
  }

  next() {
    if(this.data.length!=this.showReviews[1]) {
      this.showReviews[0] = this.showReviews[0]+this.listSize;
      this.showReviews[1] = this.showReviews[1]+this.listSize;
    }
  }

  preview() {
    if(this.showReviews[0]!=0) {
      this.showReviews[0] = this.showReviews[0]-this.listSize;
      this.showReviews[1] = this.showReviews[1]-this.listSize;
    }
  }

}//end class
