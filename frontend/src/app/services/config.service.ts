import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  constructor() {}
  private data = {
    // baseUrl: "http://172.28.73.107:4004",
    
    secureHeaderName: "usr-tkn",
    ckeditorConfig: {
      mathJaxLib:
        "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.4/MathJax.js?config=TeX-AMS_HTML",
      toolbarGroups: [
        { name: "basicstyles", groups: ["basicstyles"] },
        { name: "paragraph", groups: ["list"] },
        { name: "insert", groups: ["mathjax"] },
        { name: "tools", groups: ["Maximize"] },
      ],
      extraPlugins: "mathjax",
      removeButtons:
        "Image,SpecialChar,Styles,Table,HorizontalRule,Subscript,Superscript",
      format_tags: "p;h1;h2;h3;pre",
      removeDialogTabs: "image:advanced;link:advanced",
      removePlugins: "elementspath",
    },
  };
  get(key) {
    if (!this.data[key]) {
      throw new Error("Config not found");
    }
    return this.data[key];
  }
  public getUrl(key) {
    // console.log(key);
    if (!this.data.backEndRoutes[key]) {
      throw new Error("Backend route not found");
    }
    if (
      key === "image" ||
      key === "ytVideo" ||
      key === "plotlyUrl" ||
      key === "pdfUrl"
    ) {
      return this.data.backEndRoutes[key];
    } else {
      return this.data["baseUrl"] + this.data.backEndRoutes[key];
    }
  }
}
