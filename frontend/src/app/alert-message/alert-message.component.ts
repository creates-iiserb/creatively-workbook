import { Component, OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonService } from '../services/common.service';
import { TempdataService } from '../services/tempdata.service';
//import { ConsoleReporter } from 'jasmine';

@Component({
  selector: 'app-alert-message',
  templateUrl: './alert-message.component.html',
  styleUrls: ['./alert-message.component.css']
})
export class AlertMessageComponent implements OnDestroy {
  subscription: Subscription;
 
  public type:any;
  public message:any;

  constructor(private cs: CommonService,private tds: TempdataService) {
    this.message = '';
    this.type = 'info'
    this.subscription = this.cs.messageService().subscribe(data => {
      if (data) { 
        // display message
        this.message = data.message;
        this.type = data.type;  
        // console.log(data);
      } else {
        // clear message
        this.message = '';
        this.type = 'info'
      }
    });

    
  
  }

  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.subscription.unsubscribe();
  }

}
