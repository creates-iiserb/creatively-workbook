import { Component, OnInit, Input } from '@angular/core';
import { ConfigService } from 'app/services/config.service';
import { CommonService } from 'app/services/common.service';

@Component({
  selector: 'app-socialshare',
  templateUrl: './socialshare.component.html',
  styleUrls: ['./socialshare.component.scss']
})
export class SocialshareComponent implements OnInit {

  @Input('wbid') wbid:any;
  @Input('title') title:any;
  @Input('tags') tags:any;
  @Input('image') img:any;
  public link:any;

  constructor(private config:ConfigService, private cs: CommonService) { }

  async ngOnInit() {
    this.link = window.location.protocol+'//'+window.location.host+'/store/'+this.wbid;
    this.cs.setMetaTags(this.link,this.title,this.img);
  }

  

  socialShare(social){

    let link = '';

    switch (social) {
      case 'facebook':
        link='https://www.facebook.com/sharer.php?u='+encodeURIComponent(this.link);
      break;

      case 'twitter':
        link='https://twitter.com/share?url='+encodeURIComponent(this.link)+'&text='+this.title+'&hashtags='+this.tags;
      break;

      case 'google-plus':
        link='https://plus.google.com/share?url='+encodeURIComponent(this.link);
      break;

      case 'whatsapp':
        // if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        //  link='whatsapp://send?text='+url;
        // }else{
        link='https://web.whatsapp.com/send?text='+encodeURIComponent(this.link);
        //}
      break;

      case 'linkedin':
        link='http://www.linkedin.com/shareArticle?mini=true&url='+encodeURIComponent(this.link);
      break;

      default:
      break;
    }
    window.open(link,'_blank');
   }

}
