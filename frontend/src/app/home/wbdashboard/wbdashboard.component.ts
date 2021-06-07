import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import {BackendService} from '../../services/backend.service';
import {CommonService} from '../../services/common.service'
import { TempdataService } from 'app/services/tempdata.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { FourmsService } from 'app/services/fourms.service';
import { ConfigService } from 'app/services/config.service';

@Component({
  selector: 'app-wbdashboard',
  templateUrl: './wbdashboard.component.html',
  styleUrls: ['./wbdashboard.component.css']
})
export class WbdashboardComponent implements OnInit, OnDestroy {

  @ViewChild('AskRating', {static: false}) AskRating:ElementRef;

  public subDetails:any = {};
  public wbDetails:any = {};
  public generatedWs:any = [];
  public update:any = {};
  public imgUrl:any;
  public language: any;
  closeResult: string;
  public wsSummary:any;
  public userImg:any;
  public userProfileData:any;

  //Froums
  public forums:any;
  public forumQus:any;
  public forumAns:any;
  public forumComment:any=[];
  public forumSlideToggle = true;
  public currForumQry:any;
  public showForum = false;
  public forumNotification;
  public newForumMsg:any = [];

  //Reviews/Rating
  public reviewsData:any;
 
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dataServer : BackendService, private confService: ConfigService,
    private cs: CommonService, private _forums: FourmsService, 
    private tds: TempdataService,private modalService: NgbModal
  ) { 
    
    this.cs.activeMenu('home');
    
    this.imgUrl = this.cs.getImgUrl();

    this.userImg = this.confService.getUrl('userImage');
    
  }


  async ngOnInit() {
    //reset Review mode
    this.tds.isReview = false;

    //Set Language
    this.language = await this.tds.getLanguage();
    this.userProfileData = await this.cs.getUsrProfileData();
    
    this.subDetails = {
      curSubr:{  }
    }
    this.wbDetails= {
      publisher:{},
      approval: {},
      production :{}
    }
  //subscrData: subscrData, wbDetails: wbDetails 
    this.activatedRoute.params.subscribe((params: Params) => {
      
      let subrId = params['subrId'];
      this.getSubDetails(subrId);
      
    });

  }

  getSubDetails(subrId) {
    this.dataServer.getSubscriptionDetails(subrId)
        .subscribe(
          async resp => {
            this.cs.hideLoader()
            console.log(resp['data']);
            this.subDetails = resp['data']['subscription'];
            this.wbDetails = resp['data']['workbook'];
            this.generatedWs =  resp['data']['worksheets'];
            this.update = resp['data']['update'];

            let tab = resp['data']['subscription']['type']=='beta'&&resp['data']['subscription']['validity']==true? 'beta-apps':
                      resp['data']['subscription']['validity']==true?'active-apps':'expired-apps';
            this.tds.currLibTab(tab);

            //If Published false return to library
            if(!this.wbDetails['published']&&!this.wbDetails['isBeta']) {
              this.cs.redirectToHome();
            }

            //Add selected dur.
            this.generatedWs.forEach(element => {    
              if(element.data&&element['data']['response']['resume']!=false){
                element['selectedDur'] = element.data.response['duration'];
                element['quizMode'] = element.data.response['mode'];
              }
              else {
                element['selectedDur'] = element.duration;
                element['quizMode'] = element.mode;
              }
            });

            //Forum Start
            await this.forumsStart();
            await this.getRatings();
          
          },
          err => {
            this.cs.httpErrorHandler(err);
            this.cs.redirectToHome();
            // if (erro.error.error.code == 'notFound') {
            //   this.router.navigate(['notfound'])
            // }
            // console.log(err)
          }
        );
  }


  playQuiz(wsi) {    
    
    //If ws genetared false then send/create new ws req to generate
    if(!this.generatedWs[wsi].wsGenerated||this.generatedWs[wsi].wsGenerated===false) {
      this.dataServer.getQuizData(this.subDetails['id'],this.generatedWs[wsi].id,this.generatedWs[wsi].mode,this.generatedWs[wsi].duration,true,false).subscribe(
        resp => {
          this.cs.hideLoader()
          // console.log(resp['data']);
          if(resp['data'].generated==false){
            this.cs.showToast('warning','',resp['data'].message,3000,'tfw');
            this.getSubDetails(this.subDetails['id']);
          }
          else {
            this.getSubDetails(this.subDetails['id']);
          }

        },
        err => {
          this.cs.httpErrorHandler(err);
          this.cs.redirectToHome();
        }
      ); 
    }
    else { //go to instruction ws generated is true
      this.tds.setWbData({
        _id: this.wbDetails['_id'],
        subId: this.subDetails['id'],
        pubId: this.subDetails['pubId'],
        wbId: this.wbDetails['wbId'],
        wsId: this.generatedWs[wsi].id,
        duration: this.generatedWs[wsi].duration,
        mode: this.generatedWs[wsi].mode,
        type: this.subDetails['type'],
        response: this.generatedWs[wsi].data['response'],
        wbTitle: this.wbDetails['title'],
        wsTitle: this.generatedWs[wsi].title,
        wbVersion: this.subDetails['version'],
        updtDetails: this.update,
        beginTime: this.generatedWs[wsi].beginTime? this.generatedWs[wsi].beginTime:'',
        endTime: this.generatedWs[wsi].endTime? this.generatedWs[wsi].endTime: ''
      });
      
      this.router.navigate(['/quiz/inst']);
    }
    
  }//End
  

  showSummary(content,data) {
    this.wsSummary = data;
    this.open(content,'');
  }

  reviewQuiz(wsi) {
    this.tds.isReview = true;
    this.playQuiz(wsi);
  }

  //Model
  open(content, type) {
    if (type === 'sm') {
        this.modalService.open(content, { size: 'sm' }).result.then((result) => {
            this.closeResult = `Closed with: ${result}`;
        }, (reason) => {
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        });
    } else {
        this.modalService.open(content).result.then((result) => {
            this.closeResult = `Closed with: ${result}`;
        }, (reason) => {
            this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        });
    }
  }

  private getDismissReason(reason: any): string {
      if (reason === ModalDismissReasons.ESC) {
          return 'by pressing ESC';
      } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
          return 'by clicking on a backdrop';
      } else {
          return  `with: ${reason}`;
      }
  }

  updateWb(subId) {
    this.dataServer.updateWb(subId).subscribe(
      resp => {
        //this.cs.hideLoader()
        this.cs.showToast('success','',resp['data'].message,3000,'tfw'); 
        setTimeout(()=>{location.reload();},3000);     
      },
      err => {
        this.cs.httpErrorHandler(err);
        this.cs.redirectToHome();
      }
    ); 
  }//End

  updateWs(subId,wsId,flag) {
    let data = {};
    if(flag == "update") {
      data['update'] = true;
    }
    else {
      data['update'] = false;
    }
    
    this.dataServer.updateWs(subId,wsId,data).subscribe(
      resp => {
        //this.cs.hideLoader();
        // console.log(resp); 
        this.cs.showToast('success','',resp['data'].message,3000,'tfw');  
        setTimeout(()=>{location.reload();},3000);   
      },
      err => {
        this.cs.httpErrorHandler(err);
        this.cs.redirectToHome();
      }
    ); 
  }//End

  subscribe() {
    this.cs.subscribe(this.subDetails['id']);
  }

  //Forums

  async forumsStart() {

    this.forums = await this._forums.getEntry(this.subDetails.id,this.wbDetails.wbId,'WB'+this.wbDetails.wbId);
    this.forums = await this.forums['data'];

    // this.forumNotification = setInterval(() => {
      this._forums.getNewEntry(this.subDetails.id,'WB'+this.wbDetails.wbId).subscribe(data => {
        this.newForumMsg = data['data'];
        // console.log(this.newForumMsg);
      });
    // },20000);
    
  }

  forumToggle(query='') {
    if(this.forumSlideToggle) {
      this.forumSlideToggle = false;
      this.currForumQry = query;
      this.setViews(this.currForumQry.timestamp+'-'+this.currForumQry.randomId);
    }
    else {
      this._forums.getNewEntry(this.subDetails.id,'WB'+this.wbDetails.wbId).subscribe(data => {
        this.newForumMsg = data['data'];
      });
      this.forumSlideToggle = true;
      this.currForumQry = '';
    }
  }

  forumPost(type,parent,stmt,qusId='none') {

    let data = {
      type: type,
      qusId: qusId,
      parent: parent,
      statement: stmt,
      anonymous: false
    }
    // console.log(data);

    this._forums.setEntry(this.subDetails.id,this.wbDetails.wbId,'WB'+this.wbDetails.wbId,'workbook',data).subscribe(
      res => {
        this.cs.hideLoader();
        console.log(res);
        this.forums = res['data'];
        this.forumQus = '';
        this.forumAns = '';
        //delete forum comment
        let cmntIndex = this.forumComment.findIndex(item=>item==stmt);
        this.forumComment[cmntIndex] = '';
      },
      err => {
        this.cs.httpErrorHandler(err);
    });
  }

  async setLike(parent,like) {

    let findData = await this.forums.likes.filter(item=>parent==item.parent && this.cs.getUsrProfileData('user')==item.wbuser && like==item.like['status']);
    let data = {};
    if(findData.length!=0) {
      data = {
        type: "like",
        data:{
          parent: parent,
          like: {status:like},
          delete: true
        }
      };
      
    }
    else {
      data = {
        type: "like",
        data:{
          parent: parent,
          like: {status:like}
        }
      };
  
      // console.log(this.forums.likes, data);
    }

    this._forums.setLikeView(this.subDetails.id,this.wbDetails.wbId,'WB'+this.wbDetails.wbId,data).subscribe(
      res => {
        this.cs.hideLoader();
        // console.log(res);
        this.forums = res['data'];
      },
      err => {
        this.cs.httpErrorHandler(err);
    });

  }//End

  async setViews(parent) {

    //let findData = await this.forums.views.filter(item=>parent==item.parent && this.cs.getUsrProfileData('user')==item.wbuser);
    // console.log(findData);
    //if(findData.length!=0) {
      // console.log('viewed already');
      //return;
    //}
    //else {
      let data = {
        type: "view",
        data:{
          parent: parent
        }
      };
  
      this._forums.setLikeView(this.subDetails.id,this.wbDetails.wbId,'WB'+this.wbDetails.wbId,data).subscribe(
        res => {
          this.cs.hideLoader();
           console.log(res);
          this.forums = res['data'];
        },
        err => {
          this.cs.httpErrorHandler(err);
      });
    //}

  }//End

  resetForum() {
    this.forums = '';
    this.forumQus = '';
    this.forumAns = '';
    this.forumComment=[];
    this.forumSlideToggle = true;
    this.currForumQry = '';
  }

  async getRatings() {
    this.reviewsData = await this._forums.getEntry(this.subDetails.id,this.wbDetails.wbId,'RT'+this.wbDetails.wbId);
    this.reviewsData = await this.reviewsData['data'];
    this.askRating(this.reviewsData['entries']);
    // console.log(this.reviewsData);
  }

  ratingpost(review) {

    let data = {
      type: 'rating',
      parent: 'none',
      statement: review.stmt,
      rating: review.rating,
      pubId: this.subDetails['pubId'],
      anonymous: false
    }
    // console.log(data);

    this._forums.setEntry(this.subDetails.id,this.wbDetails.wbId,'RT'+this.wbDetails.wbId,'ratings',data).subscribe(
      res => {
        this.cs.hideLoader();
        // console.log(res);
        this.reviewsData = res['data'];
      },
      err => {
        this.cs.httpErrorHandler(err);
    });
  }

  askRating(entries) {
    let x = parseInt(((Math.random()*10)+1).toFixed(0)); 
    let y = parseInt(((Math.random()*10)+1).toFixed(0));
    let isSubmitted = this.generatedWs.findIndex(item=>item.data && item.data['isSubmitted']==true);
    if((x*y)%2!=0 && this.generatedWs.length>=3 && isSubmitted>-1 && entries.findIndex(item=>item.wbuser==this.userProfileData['user'])==-1 && this.subDetails.type!='beta') {
      // console.log('ask rating');
      this.tds.open(this.AskRating,'');
    }
  }

  ngOnDestroy() {
    clearInterval(this.forumNotification); 
  }

}//end
