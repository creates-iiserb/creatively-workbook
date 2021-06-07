import { Component, OnInit, ElementRef } from '@angular/core';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { CommonService } from '../../services/common.service';
import { TempdataService } from 'app/services/tempdata.service';
import { ConfigService } from 'app/services/config.service';


@Component({
  selector: 'app-custom-nav',
  templateUrl: './custom-nav.component.html',
  styleUrls: ['./custom-nav.component.scss']
})
export class CustomNavComponent implements OnInit {

  private toggleButton: any;
  private sidebarVisible: boolean;
  public language:any;
  public userProfileData:any;
  public currLibMenu:any;
  public userImg:any;

  constructor(public location: Location, private element : ElementRef, public cs:CommonService,
    public tds: TempdataService, private confService: ConfigService) {
    this.sidebarVisible = false;

    this.userImg = this.confService.getUrl('userImage');

    this.tds.getLibTab.subscribe(res=>{
      // console.log(res);
      this.currLibMenu = res;
    });
    
  }

  async ngOnInit() {
    
    // console.log(this.userProfileData);

    const navbar: HTMLElement = this.element.nativeElement;
    this.toggleButton = navbar.getElementsByClassName('navbar-toggler')[0];
  }

  sidebarOpen() {
    const toggleButton = this.toggleButton;
    const html = document.getElementsByTagName('html')[0];
    setTimeout(function(){
        toggleButton.classList.add('toggled');
    }, 500);
    html.classList.add('nav-open');

    this.sidebarVisible = true;
  };

  sidebarClose() {
    const html = document.getElementsByTagName('html')[0];
    // console.log(html);
    this.toggleButton.classList.remove('toggled');
    this.sidebarVisible = false;
    html.classList.remove('nav-open');
  };

  sidebarToggle() {
    // const toggleButton = this.toggleButton;
    // const body = document.getElementsByTagName('body')[0];
    if (this.sidebarVisible === false) {
        this.sidebarOpen();
    } else {
        this.sidebarClose();
    }
  };

  isHome() {
    var titlee = this.location.prepareExternalUrl(this.location.path());

    if( titlee === '/home' ) {
        return true;
    }
    else {
        return false;
    }
  }

  isDocumentation() {
    var titlee = this.location.prepareExternalUrl(this.location.path());
    if( titlee === '/documentation' ) {
        return true;
    }
    else {
        return false;
    }
  }

  activeMenu(item) {
    this.cs.activeMenu(item);
  }

  currLibTab(tab) {
    this.currLibMenu = tab;
    this.tds.currLibTab(tab);
  }



}
