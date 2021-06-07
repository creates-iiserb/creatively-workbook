import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import {BackendService} from '../../services/backend.service';
import {CommonService} from '../../services/common.service'
import {ConfigService} from '../../services/config.service';
import { TempdataService } from 'app/services/tempdata.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

import { Router } from '@angular/router';
import { FourmsService } from 'app/services/fourms.service';


@Component({
  selector: 'app-playquiz',
  templateUrl: './playquiz.component.html',
  styleUrls: ['./playquiz.component.css'],
  animations: [
    trigger('animationside', [
      transition(':enter', [
        style({transform: 'translateX(-10%)'}),
        animate('500ms ease-out', style({transform: 'translateX(0%)'}))
      ])
    ]),
    trigger('animation', [
      transition('void => *', [
        style({opacity:0}),
        animate(300)
      ])
    ])
  ]
})
export class MainComponent implements OnInit, OnDestroy {

  @ViewChild('UserActivity', {static: false}) userActivityModel: ElementRef;
  
  closeResult: string;
  public isBetaUser:any = false;
  public chkLockStatus:any;
  public currWbData:any;
  public QuizMetaData:any;
  public QuizData: any;
  public QuizRes: Array<any> = [];
  public QP = 0; 
  public quizElements: Array<any> = [];
  public quizGridElements: Array<any> = [];
  public gsp = 0;   //Grid Start Pointer
  public gep = 9;   //Grid End Pointer
  public wshelpAllowed = 0;
  public showHint = false;
  public showExp = false;
  public showInst = false;
  public qType="";
  public timer:any = 'timeSpent';
  public duration:any = 0;
  public timeUsed:any = 0;
  public beginTime:any;
  public endTime:any;
  public timeInterval:any;
  public activityCount = 0;
  public userActivityInt:any;
  public isActive:any = true;
  public timeAlert: any = false;
  public quizClock:any;
  public toggleClock = 0;
  public language: any;
  public score:any;
  public showSummary:any = '';
  public ckeditorConfig:any = {};
  // public gradingMatrix = [
  //   ['Correct Answer','Correct Answer with Help Used','Correct Answer with Explanation Used'],
  //   ['Skipped Answer', 'Skipped answer but Help Used' , 'Skipped answer but Explanation Used'],
  //   ['Incorrect Answer', 'Incorrect Answer with Help Used', 'Incorrect Answer with Explanation Used']
  // ];
  public isReview = false;
  public freeItems:any = {
    hintUsed:0,
    expUsed:0
  };

  public feedbackData:any = [];
  public showFeedback = false;
  public oldFeedback:any;
  public currFeedback:any = '';
  public notes:any;
  public showNotes:any = false;

  public userProfileData:any;
  public userImg:any;

  public wsAccess:any;

  //Froums
  public forums:any;
  public forumQus:any;
  public forumAns:any;
  public forumComment:any=[];
  public forumSlideToggle = true;
  public currForumQry:any;
  public showForum = false;

  public subjectiveGrd:any = 0;
  

  constructor(private tds: TempdataService, private cs:CommonService, private _router: Router,
    private dataServer : BackendService, private modalService: NgbModal, private confService: ConfigService, private _forums: FourmsService) {

      this.ckeditorConfig = this.confService.get('ckeditorConfig');
      this.userImg = this.confService.getUrl('userImage');


      //Check for review
      if(this.tds.isReview==true) {
        this.isReview = this.tds.isReview;
      }

      //Get current wb data
      this.tds.getWbData.subscribe(res => {
        this.currWbData = res;
      },
      err => {
        this.cs.httpErrorHandler(err);
      });
      
      document.getElementsByTagName('body')[0].classList.add('quiz-bg');     
      document.getElementsByTagName('nav')[0].classList.add('navhide'); 
      
      this.tds.setStartTime(new Date().getTime());
      this.tds.setEndTime(new Date().getTime());
      this.tds.getTotalTime();

      //user activity
      this.userActivity();

      //this.cs.showToast('warning','','this is simple text for testing',3000,'tl');
  }//End constructor

  //For check user activity
  @HostListener('click', ['$event'])
  @HostListener('mouseover', ['$event'])
  @HostListener('mousemove', ['$event'])
  @HostListener('document:keypress', ['$event'])
  async onEvent(event) {
    this.activityCount = await this.tds.getInactivityTime();
    if(!this.isActive) {      
      this.isActive = true;
      this.tds.open(this.userActivityModel,'');
      setTimeout(()=>{this.modalService.dismissAll()},1500);
    }
    
  }
  async userActivity() {
    this.activityCount = await this.tds.getInactivityTime();

    this.userActivityInt = setInterval(() => {
      this.activityCount--;
      if(this.activityCount==60) {
        this.isActive = false;
        this.tds.open(this.userActivityModel,'');
      }
      if(this.activityCount==0) {
        clearInterval(this.userActivityInt);
        this.exitQuiz();
      }
    },1000);
  }
  //end
  

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    //console.log(event.target.innerWidth);
    var quizQus = document.getElementById("quiz-qus");
    if(event.target.innerWidth<=991) {
      quizQus.classList.remove('col-md-9');
      quizQus.classList.add('col-md-12');
    }
    else {
      quizQus.classList.remove('col-md-12');
      quizQus.classList.add('col-md-9');
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event) {
    if(this.tds.isReview==false) {
      alert(this.language.msg_backBtnMsg);
    }
  }

  async ngOnInit() {

    //Set Language
    this.language = await this.tds.getLanguage();

    //Beta User flag
    this.isBetaUser = this.tds.isBetaUser;

    this.userProfileData = await this.cs.getUsrProfileData();
    
    //Get Meta Data
    this.tds.getQuizMeta.subscribe(res => {
      
      if(!res) {       
        this.cs.redirectToHome();
        return;
      }
      this.QuizMetaData = res;

      //For help level select 
      if(this.isReview&&this.QuizMetaData.helpLevelSelAtReview) {
        this.wshelpAllowed = this.QuizMetaData.helpLevelSelAtReview;
      }
      else {
        this.wshelpAllowed = this.QuizMetaData.wshelpAllowed;
      }
      // console.log(this.QuizMetaData);
    }).unsubscribe();

    
    //Get Quiz Data
    this.getQuizData();
  }

  getQuizData() {
    this.tds.getQuizData.subscribe(res => {
      if(!res) {
        this.cs.redirectToHome();
        return;
      }
      this.QuizData =  res;
      console.log(this.QuizData);

      // Worksheet Access
      this.wsAccess = this.QuizData['elements'].findIndex(item=>item.access==-1);
      // console.log(this.wsAccess);

      //Clock Setup
      let timeNow = new Date();
      
      this.duration = this.QuizData['response'].duration;     

      //Initialize time(BeginTime-EndTime)
      // For Certificate mode
      if(this.QuizData['response']['mode']=='certification') { 

        // Set temp wsdata quiz mode to "QUIZ"
        this.currWbData['quizMode'] = 'quiz';
        console.log(this.currWbData)
        
        this.beginTime = this.QuizData['response']['startedOn']? new Date(this.QuizData['response']['startedOn']) : new Date();
        this.timeUsed = new Date().getTime() - this.beginTime.getTime();

        // Calculate End Time according to which one is grater (near to submit quiz) duration or endTime
        if(new Date(this.currWbData['endTime']).getTime()-this.beginTime.getTime()<this.duration*60000) {
          this.endTime = new Date(this.currWbData['endTime']);
        }
        else {
          this.endTime = new Date(this.beginTime.getTime()+parseInt(this.duration)*60000);
        }

      }
      else {
        this.beginTime = new Date(); //Current Time
        this.endTime = new Date(timeNow.setTime(timeNow.getTime()+parseInt(this.duration)*60000)); 
      }

      //Check if Quiz Res exist load old response     
      if(this.QuizData['response'].isResponse) {
        this.QuizRes = this.QuizData['response'].resData;
        
        this.QP = this.isReview? 0:this.QuizData['response'].lastQue;
        
        this.jumpTo(this.QP);

        //Calculate time taken, Hint Used, Exp Used
        this.QuizData['response'].resData.forEach(ele => {
          
          //Time taken calc
          if(this.QuizData['response']['mode']!='certification'){
            this.timeUsed += parseInt(ele.timeTaken);
          }
          
          //Hit,Exp calc
          if(ele.helpUsed==1) {
            this.freeItems.hintUsed++;
          }
          else if(ele.helpUsed==1) {
            this.freeItems.expUsed++;
          }

        });

        //Add timeused to begin time
        if(this.QuizData['response']['mode']!='certification'){
          this.beginTime = new Date(this.beginTime.setTime(this.beginTime.getTime()-this.timeUsed));
          this.endTime = new Date(this.endTime.setTime(this.endTime.getTime()-this.timeUsed));
        }
        
        //Set Feedback
        this.feedbackData = this.QuizData.userdata && Object.keys(this.QuizData.userdata).length!=0 && this.currWbData.type=='beta'? this.QuizData.userdata.feedback? this.QuizData.userdata.feedback:[]:[];

        //Set Notes
        this.notes = this.QuizData.userdata && Object.keys(this.QuizData.userdata).length!=0 && this.currWbData.type!='beta'? this.QuizData.userdata.notes? this.QuizData.userdata.notes:'':'';
        this.setFeedback();
      }
      else {

        //Create fresh response
        this.createResponse(this.QuizData.elements);
        
        //Set Feedback
        this.feedbackData = this.QuizData.userdata && Object.keys(this.QuizData.userdata).length!=0 && this.currWbData.type=='beta'? this.QuizData.userdata.feedback? this.QuizData.userdata.feedback:[]:[];
        //Set Notes
        this.notes = this.QuizData.userdata && Object.keys(this.QuizData.userdata).length!=0 && this.currWbData.type!='beta'? this.QuizData.userdata.notes? this.QuizData.userdata.notes:'':'';
        this.setFeedback();
      }      
      
      //Push qus element for grid data
      for(let i in this.QuizData.elements){
        this.quizElements.push(parseInt(i));
      }

      this.setGrid();
      this.getQusType();
      
      //Start clock
      if(!this.isReview) {
        this.startInterval();
      }

    }).unsubscribe();
  }//End

  bottomNavToggle() {
    var bottomNav = document.getElementById("bottom-nav");
    if(bottomNav.classList.contains('bottom-menu-up')) {
      bottomNav.classList.remove('bottom-menu-up');
    }
    else {
      bottomNav.classList.add('bottom-menu-up');
    }
  }//End

  createResponse(data:Array<any>) {
    if(this.QuizRes.length==0) {
      data.forEach(ele => {
        
        let resObj = {
          "ref": ele.ref,
          "type": ele.type,
          "timeTaken": 0,
          "helpUsed": 0,
          "lock": false,
          "review": 0,
          "answerId": -1,
          "tempAns": -1
        };

        this.QuizRes.push(resObj);
      });
    }
  }//End

  //Quistion Navigation
  async next() {
    await this.getTotalTime(this.QP);
    
    if(this.QP==this.QuizData.elements.length-1) {
      this.cs.showToast('warning','',this.language.msg_alreadyAtLastQue,3000,'tfw');
      return false;
    }
    if(this.QP<this.QuizData.elements.length-1){
      await this.QP++;
      this.getQusType();

      //Increment grid star and end point
      if(this.gsp<this.QuizData.elements.length-9&&this.QP>4){
        this.gsp++;
      }
      if(this.gep<this.QuizData.elements.length&&this.QP>4){
        this.gep++;
      }

    }

    this.setGrid();  
    this.resetHint();
    this.resetExp();
    this.resetInst();
      
    this.setFeedback();
    this.showFeedback = false;
    this.resetForum();
    this.subjectiveGrd = 0;

    if(!this.isReview && this.wsAccess==-1) {
      await this.saveData();
    }
  }//End

  async prev() {
    await this.getTotalTime(this.QP);

    if(this.QP==0) {
      this.cs.showToast('warning','',this.language.msg_alreadyAtFirstQue,3000,'tfw');
      return;
    }
    if(this.QP>0){
      
      await this.QP--;
      this.getQusType();

      //Decrement grid star and end point
      if(this.gsp>0&&this.QP<this.quizElements.length-5){
        this.gsp--;
      }
      if(this.gep>9&&this.QP<this.quizElements.length-5){
        this.gep--;
      }
    } 

    this.setGrid();
    this.resetHint();
    this.resetExp();
    this.resetInst();
    
    this.setFeedback();
    this.showFeedback = false;
    this.resetForum();
    this.subjectiveGrd = 0;

    if(!this.isReview && this.wsAccess==-1) {
      await this.saveData();
    }
  }//End

  async jumpTo(qp) {
    await this.getTotalTime(this.QP);

    this.QP = qp;
    await this.getQusType();

    if(this.QP<=this.QuizData.elements.length-1){
      //set center pointer
      if(this.QP<this.QuizData.elements.length-4&&this.QP>4){
        this.gsp = this.QP-4;
        this.gep = this.QP+5;
      }
      else if(this.QuizData.elements.length>9 && (this.QP<=this.QuizData.elements.length && this.QP>this.QuizData.elements.length-5)){
        this.gsp = this.QuizData.elements.length-9;
        this.gep = this.QuizData.elements.length;
      }
      else if(this.QP<5){
        this.gsp = 0;
        this.gep = 9;
      }
    }

    await this.setGrid();
    await this.resetHint();
    await this.resetExp();
    await this.resetInst();
    await this.setFeedback();
    this.showFeedback = false;
    await this.resetForum();
    
    this.subjectiveGrd = 0;

    if(!this.isReview && this.wsAccess==-1) {
      await this.saveData();
    }
  }//End

  setGrid() {
    this.quizGridElements = this.quizElements.slice(this.gsp,this.gep);  
  }//End

  //Set Response from template
  setAnsRes(data) {
    this.QuizRes[this.QP] = data;
  }//End

  async getQusType() {
    this.qType = await 'none';
    setTimeout(()=>{
      this.qType = this.QuizData.elements[this.QP].type;
    },5);
  }//End

  //Set Flag, Lock, Hint, Exp
  setFlag() {
    if(this.QuizRes[this.QP].review==0){
      this.QuizRes[this.QP].review = 1;
      //this.cs.showToast('info','','Flag set.',2000,'tl');
    }
    else if(this.QuizRes[this.QP].review==1){
      this.QuizRes[this.QP].review = 0;
      //this.cs.showToast('info','','Flag unset.',2000,'tl');
    }
  }//End

  setLock() {
    //For MCQ 
    if(this.QuizRes[this.QP].type=='mcq') {
      if(this.QuizRes[this.QP].tempAns!=-1) {
        if(this.QuizRes[this.QP].lock==true){
          this.QuizRes[this.QP].lock = false;
          this.QuizRes[this.QP].answerId = -1;          
        }
        else if(this.QuizRes[this.QP].lock==false){
          this.QuizRes[this.QP].lock = true;
          this.QuizRes[this.QP].answerId = this.QuizRes[this.QP].tempAns;
        }        
      }
      else {
        this.cs.showToast('warning','',this.language.msg_plsSelectAnOpt,2000,'tfw');
      }
    }
    //For ARANGE
    else if(this.QuizRes[this.QP].type=='arrange') {
      if(this.QuizRes[this.QP].lock==true){
        this.QuizRes[this.QP].lock = false;
        this.QuizRes[this.QP].answerId = -1;
      }
      else if(this.QuizRes[this.QP].lock==false){
        this.QuizRes[this.QP].lock = true;
        this.QuizRes[this.QP].answerId = this.QuizRes[this.QP].tempAns;;
      }
    }
    //For FILLIN
    else if(this.QuizRes[this.QP].type=='fillIn'){  
      if(this.QuizRes[this.QP].tempAns!=-1) {
        (async ()=> {
          let flag = false;

          for (let x in this.QuizRes[this.QP].tempAns) {
            // if(this.QuizRes[this.QP].tempAns[x]==''||this.QuizRes[this.QP].tempAns[x]==undefined){
              // this.cs.showToast('warning','',this.language.msg_fillAllBlanks,2000,'tfw');
              // return false;
            // }
            if(this.QuizRes[this.QP].tempAns[x]!=''&&this.QuizRes[this.QP].tempAns[x]!=undefined){
              flag = true;
              break;
            }
            await new Promise(resolve => {setTimeout(resolve,100)});            
          }

          if(!flag) {
            this.cs.showToast('warning','',this.language.msg_fillAllBlanks,2000,'tfw');
            return false;
          }
          else if(this.QuizRes[this.QP].lock==true){
            this.QuizRes[this.QP].lock = false;
            this.QuizRes[this.QP].answerId = -1;
          }
          else if(this.QuizRes[this.QP].lock==false){
            this.QuizRes[this.QP].lock = true;
            this.QuizRes[this.QP].answerId = this.QuizRes[this.QP].tempAns;;
          }
          
        })(); 
      } 
      else {
        this.cs.showToast('warning','',this.language.msg_fillAllBlanks,2000,'tfw');
      }    
      
    }
    else if(this.QuizRes[this.QP].type=='info') {
      if(this.QuizRes[this.QP].lock==true){
        this.QuizRes[this.QP].lock = false;
        this.QuizRes[this.QP].answerId = -1;          
      }
      else if(this.QuizRes[this.QP].lock==false){
        this.QuizRes[this.QP].lock = true;
        this.QuizRes[this.QP].answerId = 1;
      }
    }
    else if(this.QuizRes[this.QP].type=='sub') {
      if(this.QuizRes[this.QP].tempAns!=-1) {
        
        if(this.QuizRes[this.QP].tempAns['text']=='' && this.QuizRes[this.QP].tempAns['drawing'].length==0) {
              this.cs.showToast('warning','',this.language.msg_ansSubjectiveQus,2000,'tfw');
        }
        else {
          let str = this.QuizRes[this.QP].tempAns['text'];
          str = str.replace(/(<([^>]+)>)/ig, '');
          if(str.length>this.QuizData.elements[this.QP]['object']['limit']) {
            this.cs.showToast('warning','',this.language.msg_subTxtOverLimit,2000,'tfw');
          }
          else {
            if(this.QuizRes[this.QP].lock==true){
              this.QuizRes[this.QP].lock = false;
              this.QuizRes[this.QP].answerId = -1;          
            }
            else if(this.QuizRes[this.QP].lock==false){
              this.QuizRes[this.QP].lock = true;
              // this.QuizRes[this.QP].answerId = this.QuizRes[this.QP].tempAns;
              this.QuizRes[this.QP].answerId = 1;
            } 
          }
        }    
      }
      else {
        this.cs.showToast('warning','',this.language.msg_ansSubjectiveQus,2000,'tfw');
      }
    }
    // else {
    //   this.cs.showToast('warning','',this.language.msg_plsAnsFirst,2000,'tfw');
    // }
  }//End 

  setHint() {
    if(this.freeItems.hintUsed==this.QuizMetaData.free.hints && this.isReview==false && this.currWbData['type']!='beta') {
      this.cs.showToast('info','',this.language.msg_freeHintUsed,2000,'tfw');
      return;
    }
    else {
      if(this.QuizRes[this.QP].helpUsed==0) {
        this.QuizRes[this.QP].helpUsed = 1;
        if(this.currWbData['type']!='beta') {
          this.freeItems.hintUsed++;
        }
      }
      // else{
      //   //this.cs.showToast('info','','You have already used.',2000,'tfw');
      // }
      this.showHintExp('hint');
      // console.log(this.freeItems);
    }
  }//End

  setExp() {
    if(this.freeItems.expUsed==this.QuizMetaData.free.explanations && this.isReview==false && this.currWbData['type']!='beta') {
      this.cs.showToast('info','',this.language.msg_freeExpUsed,2000,'tfw');
      return;
    }
    else {
      if(this.QuizRes[this.QP].helpUsed==0) {
        this.cs.showToast('warning','',this.language.msg_useHintFirst,2000,'tfw');      
      }
      else if(this.QuizRes[this.QP].helpUsed==1) {
        this.QuizRes[this.QP].helpUsed = 2;
        
        if(this.currWbData['type']!='beta') {
          this.freeItems.expUsed++;
        }
      }
      // else if(this.QuizRes[this.QP].helpUsed==2) {
      //   //this.cs.displayMessage('info','You have already used.',2000);
      // }
      this.showHintExp('exp');
      // console.log(this.freeItems);
    } 
  }//End

  subGrade() {
    this.dataServer.gradeSubjective(this.currWbData.subId,this.currWbData.wsId,this.QuizData.response.resData[this.QP].ref,{grade:this.subjectiveGrd}).subscribe(
      resp => {
        this.QuizData.response.resData[this.QP]['graded'] = true;
        this.QuizData.response.resData[this.QP]['score'] = this.subjectiveGrd;
        this.subjectiveGrd = 0;
        this.cs.showToast('success','',resp['data'].msg,3000,'tfw');        
        this.cs.hideLoader();
      },
      err => {
        console.log(err);
        this.subjectiveGrd = 0;
        this.cs.httpErrorHandler(err);
        this.cs.hideLoader();
      }
    );
  }

  showHintExp(flag) {
    if(this.isReview&&flag=='hint') {
      this.showHint = true;
    }
    else if(this.isReview&&flag=='exp') {
      this.showExp = true;
    }
    else if(this.QuizRes[this.QP].helpUsed>=1&&flag=='hint') {
      this.showHint = true;
    }
    else if(this.QuizRes[this.QP].helpUsed>1&&flag=='exp') {
      this.showExp = true;
    }
  }//End

  instToggle() {
    if(this.showInst) {
      this.showInst = false;
    }
    else {
      this.showInst = true;
    }
  }//end

  feedbackToggle(htmlElem) {
    if(this.showFeedback) {
      this.showFeedback = false;
    }
    else {
      this.showFeedback = true;
      this.scrollTo(htmlElem);
    }
  }//end

  notesToggle() {
    if(this.showNotes) {
      this.showNotes = false;
    }
    else {
      this.showNotes = true;
    }
  }//end

  resetHint() {
    this.showHint = false;
  }//End

  resetExp() {
    this.showExp = false;
  }

  resetInst() {
    this.showInst = false;
  }//End

  async exitQuiz() {
    if(this.isReview || this.wsAccess>-1) {
      this._router.navigate(['/home/wb/'+this.currWbData.subId]);
      return;
    }
    else {
      await this.getTotalTime(this.QP);
      await this.saveRespData('exit');
      //Clear Time Interval
      clearInterval(this.timeInterval);
      this._router.navigate(['/home/wb/'+this.currWbData.subId]);
    }      

  }//End

  chkLock() {   
    // console.log(this.qType); 
    if(this.isReview==false) {
      // if(this.qType=='mcq'&&this.chkLockStatus!=false&&this.chkLockStatus!=undefined) {
      //   console.log('chklock',this.chkLockStatus,this.QuizRes[this.QP].lock);
      //   this.cs.showToast('info','',this.language.msg_plsUnlockAns,2000,'tfw');
      // }
      // else 
      
      if(this.QuizRes[this.QP].lock) {
        this.cs.showToast('info','',this.language.msg_plsUnlockAns,2000,'tfw');
      }
    }
  }//

  async addFeedback() {
    if(this.currWbData['type']=='beta') {

      let feedbackData = { 
        "pubId": this.currWbData['pubId'], 
        "ref": this.QuizData.elements[this.QP].ref,
        "msg": this.currFeedback, 
        "timeStamp": new Date().getTime(),
        "wsTitle": this.currWbData['wsTitle'],
        "wbTitle": this.currWbData['wbTitle'],
        "wbVersion": this.currWbData['wbVersion'],
        "status": "new" 
      }

      if(this.feedbackData.length!=0) {
        let index = await this.feedbackData.findIndex(item=>this.currWbData['pubId']==item.pubId && this.QuizData.elements[this.QP].ref==item.ref && item.status=='new');
        
        if(index!=undefined&&index!=-1) {
          this.feedbackData[index] = feedbackData;
        }
        else {
          this.feedbackData.push(feedbackData);
        }
      }
      else {
        this.feedbackData.push(feedbackData);
      }

      this.saveRespData('feedback');
    }
  }

  async setFeedback() {
    
    if(this.currWbData['type']=='beta') {
      if(this.feedbackData.length!=0) {
        
        let index = await this.feedbackData.findIndex(item=>this.currWbData['pubId']==item.pubId && this.QuizData.elements[this.QP].ref==item.ref && item.status=='new');
        
        if(index!=undefined&&index!=-1) {
          this.currFeedback = this.feedbackData[index].msg;
        }
        else {
          this.currFeedback = '';
        }
        // console.log(this.feedbackData);
        //fetch old feedbacks
        this.oldFeedback = this.feedbackData.filter(item=>(this.QuizData.elements[this.QP].ref==item.ref&&this.currWbData['pubId']!=item.pubId)||(this.QuizData.elements[this.QP].ref==item.ref&&item.status!='new'));
        // console.log(this.oldFeedback);

      }
      else {
        this.currFeedback = '';
      }
    }
  }

  saveData() {
    // console.log(this.QuizRes);
    return new Promise(async (resolve,reject) => {
      await this.getTotalTime(this.QP);

      let userdata = {};

      if(this.currWbData.type!='beta') {
        userdata['notes'] = this.notes;
      }
      else if(this.currWbData.type=='beta') {
        userdata['feedback'] = this.feedbackData;
      }

      this.dataServer.saveResponse(this.currWbData.subId,this.currWbData.wsId,this.QuizRes,this.QP,userdata).subscribe(
        resp => {
          resolve(resp);
          this.cs.hideLoader();
        },
        err => {
          reject(err);
          this.cs.hideLoader();
        }
      );
    });
  }

  async saveRespData(flag='') {
    try {
      let resp = await this.saveData();
      this.cs.hideLoader();
      if(flag!= 'submit'&&flag!= 'exit') {
        this.cs.showToast('success','',resp['data'].message,3000,'tfw');        
      }
    }
    catch(err) {
      this.cs.httpErrorHandler(err);
    }
    
  }

  async submitResp(flag='') {
    try {

      await this.saveData();  
      clearInterval(this.timeInterval);
      
      this.dataServer.submitResponse(this.currWbData.subId,this.currWbData.wsId).subscribe(
        resp => {
          this.cs.hideLoader();
          // console.log(resp);
          this.cs.showToast('success','',resp['data'].message,3000,'tfw');   
          this._router.navigate(['/home/wb/'+this.currWbData.subId]);     
        },
        err => {
          this.cs.httpErrorHandler(err);
        }
      );

    }
    catch(err) {
      this.cs.httpErrorHandler(err);
    }

    
  }//End

  submitModel(content) {
    this.showSummary = {attempted:0,skipped:0,flagged:0};

    this.QuizRes.forEach(ele => {
      if(ele.lock == true) {
        this.showSummary.attempted ++;
      }
      if(ele.answerId == -1) {
        this.showSummary.skipped ++;
      }
      if(ele.review != 0) {
        this.showSummary.flagged ++;
      }
    });

    this.tds.open(content,'');
  } 

  //Quit Timer

  toggleTime() {
    if(this.timeAlert) {
      return;
    }
    else if(this.toggleClock == 0) {
      this.timer = "timeLeft";
      this.toggleClock = 1;
    }
    else if(this.toggleClock == 1) {      
      this.toggleClock = 2;
    }
    else if(this.toggleClock == 2) {
      this.toggleClock = 0;
      this.timer = "timeSpent";
    }
  }

  async getTotalTime(QP) {
    await this.tds.setEndTime(new Date().getTime());
    // console.log('QP-'+QP,await this.tds.getTotalTime());
    this.QuizRes[QP].timeTaken = parseInt(this.QuizRes[QP].timeTaken) + await this.tds.getTotalTime();
    // console.log(this.QuizRes);
    await this.tds.setStartTime(new Date().getTime());
  }//End

  startInterval() {
    this.timeInterval = setInterval(async ()=> {
      this.quizClock = await this.tick();
      
      if(this.timer == 'timeSpent' && ((parseInt(this.currWbData.selectedDur)-parseInt(this.quizClock.mm))<=15) && parseInt(this.quizClock.hh)==0) {
        this.timer = "timeLeft";
        this.timeAlert = true; 
        let clock = new Date();
        let showTime = new Date(this.endTime.getTime() - clock.getTime());

        if(parseInt(this.currWbData.selectedDur)>parseInt(this.quizClock.mm)) {
          this.cs.showToast('warning','',this.language.msg_timeAlertM1+' '+this.tds.parseTime(showTime).mm+':'+this.tds.parseTime(showTime).ss+' '+this.language.msg_timeAlertM2,3000,'tfw');
        }
      }

      if(this.timer == 'timeLeft' && (parseInt(this.quizClock.hh)==0 && parseInt(this.quizClock.mm)==5 && parseInt(this.quizClock.ss)==0)) {
        this.cs.showToast('warning','',this.language.msg_fiveMinLeft,5000,'tfw');
      }

      if(parseInt(this.quizClock.hh)==0 && parseInt(this.quizClock.mm)==0 && parseInt(this.quizClock.ss)==0) {
        if(this.currWbData.quizMode!='lesson'&&this.currWbData.type!='beta') {
          clearInterval(this.timeInterval);
          this.submitResp('auto');
        }
      }

      // For certificate mode
      let checkEndTime = (new Date().getTime() - new Date(this.QuizData['response']['startedOn']).getTime())/60000;

      if(checkEndTime> this.duration || new Date() > new Date(this.currWbData['endTime'])) {
        if(this.QuizData['response']['mode']=='certification') {
          if(confirm('Your time is over. Quiz will auto submitted successfully.')){
            clearInterval(this.timeInterval);
            this.submitResp('auto');
          }
          else {
            clearInterval(this.timeInterval);
            this.exitQuiz();
          }
        }
      }
      
    },1000);
  }//End

  tick() {
    let clock = new Date();//current time   
    if (this.timer == "timeSpent") { 
      let showTime = new Date(clock.getTime()-this.beginTime.getTime());
      return this.tds.parseTime(showTime);
    } 
    else {
      let showTime = new Date(this.endTime.getTime() - clock.getTime());
      return this.tds.parseTime(showTime);
    }

  }

  //For lesson mode only
  
  chkAns(content) {
    // if(this.QuizRes[this.QP]["checkAns"] && this.QuizRes[this.QP]["checkAns"]==true) {
    //   this.cs.showToast('warning','',this.language.msg_alreadyChkAns,3000,'tfw'); 
    //   return;  
    // }
    // else 
    if(this.QuizRes[this.QP].lock!=true) {
      this.cs.showToast('warning','',this.language.msg_plsLockAns,3000,'tfw'); 
      return;  
    }
    else {
      this.dataServer.gradeAns(this.currWbData.subId,this.currWbData.wsId,this.QuizRes[this.QP]).subscribe(
        resp => {
          this.cs.hideLoader();
          this.QuizRes[this.QP]["checkAns"] = true;
          this.score = resp['data'];
          this.tds.open(content,'');
        },
        err => {
          this.cs.httpErrorHandler(err);
        }
      ); 
    }
  }//End

  // showAns() {

  // }//End

  //Model

  open(content,type) {
    this.tds.open(content,type);
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

  showCorrectAns(content) {
    this.tds.open(content,'');
  }

  learnHowTo(content) {
    this.tds.open(content,'');
  }

  allContent(content) {
    this.tds.open(content,'xl');
  }


  scrollTo(el: HTMLElement) {
    el.scrollIntoView({behavior: "smooth", block: "start"});
  }

  //Forums

  async forumsStart(content) {
    await this.resetForum();
    this.forums = await this._forums.getEntry(this.currWbData.subId,this.currWbData.wsId,this.QuizData.elements[this.QP].ref);
    this.forums = await this.forums['data'];
    // console.log(this.forums);
    this.showForum = true;
    this.scrollTo(content);
    // this.tds.open(content,'xl');
  }

  forumToggle(query='') {
    if(this.forumSlideToggle) {
      this.forumSlideToggle = false;
      this.currForumQry = query;
      this.setViews(this.currForumQry.timestamp+'-'+this.currForumQry.randomId);
    }
    else {
      this.forumSlideToggle = true;
      this.currForumQry = '';
    }
  }

  forumPost(type,parent,stmt,qusId='none') {
    // if(cmnt!=-1) {
    //   stmt = this.forumComment[cmnt];
    // }

    let data = {
      type: type,
      qusId: qusId,
      parent: parent,
      statement: stmt,
      anonymous: false
    }
    // console.log(data);

    this._forums.setEntry(this.currWbData.subId,this.currWbData.wsId,this.QuizData.elements[this.QP].ref,'question',data).subscribe(
      res => {
        this.cs.hideLoader();
        // console.log(res);
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

    let findData = await this.forums.likes.filter(item=>parent==item.parent && this.userProfileData['user']==item.wbuser && like==item.like['status']);
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

    this._forums.setLikeView(this.currWbData.subId,this.currWbData.wsId,this.QuizData.elements[this.QP].ref,data).subscribe(
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

    let findData = await this.forums.views.filter(item=>parent==item.parent && this.userProfileData['user']==item.wbuser);
    // console.log(findData);
    if(findData.length!=0) {
      // console.log('viewed already');
      return;
    }
    else {
      let data = {
        type: "view",
        data:{
          parent: parent
        }
      };
  
      // console.log(this.forums.views, data);
  
      this._forums.setLikeView(this.currWbData.subId,this.currWbData.wsId,this.QuizData.elements[this.QP].ref,data).subscribe(
        res => {
          this.cs.hideLoader();
          // console.log(res);
          this.forums = res['data'];
        },
        err => {
          this.cs.httpErrorHandler(err);
      });
    }

  }//End

  resetForum() {
    this.showForum = false;
    this.forums = '';
    this.forumQus = '';
    this.forumAns = '';
    this.forumComment=[];
    this.forumSlideToggle = true;
    this.currForumQry = '';
  }

  async subToPro() {
    if(confirm(this.language.msg_exitFromWs)) {
      await this.saveData();
      await this.cs.subscribe(this.currWbData.subId);
    }
    
  }
 
  ngOnDestroy() {
    clearInterval(this.timeInterval); 
    clearInterval(this.userActivityInt);   
    this.tds.setQuizData('');
    this.tds.setWbData('');
    this.tds.setQuizMetaData('');   
    document.getElementsByTagName('body')[0].classList.remove('quiz-bg');     
    document.getElementsByTagName('nav')[0].classList.remove('navhide');
    this.modalService.dismissAll();
  }

}//end class
