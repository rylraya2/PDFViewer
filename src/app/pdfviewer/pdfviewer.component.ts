import { Component, OnInit, ViewChild, AfterViewInit, Renderer2, Input, OnChanges, SimpleChanges, Output, EventEmitter} from '@angular/core';
import SignaturePad from 'signature_pad';
declare const PDFLib: any;
const { PDFDocument, StandardFonts, rgb } = PDFLib
@Component({
  selector: 'app-pdfviewer',
  templateUrl: './pdfviewer.component.html',
  styleUrls: ['./pdfviewer.component.css']
})
export class PDFViewerComponent implements OnInit, AfterViewInit, OnChanges{
  // Variables firmas
  @Input() allowSignature: boolean = true;
  @ViewChild('sPad',{static: true}) signaturePadElement;
  signaturePad: any;
  signature: any;
  arrSignatures: any;
  hideCaptureSignature: boolean = true;

  //Vaiables pdf
  @Input() url: string;
  @Input() fileU: any;
  @Output() savePDFEvent = new EventEmitter<string>();
  @ViewChild('viewer',{static: true}) htmlPdfViewer;
  @ViewChild('viewerContainer',{static: true}) viewContainer;
  pdfjsLib: any;
  hidepdfloading: boolean = true;
  scale: any;
  urlPDF: string;
  pdfDocument: any;
  numPage: number;
  elementNumPage: any;
  totalPage: number;
  arrHTML: any = [];
  //variables funcionalidad drag an drop
  @ViewChild('listSignature',{static: true}) listSignatures;
  @ViewChild('ULSignatures',{static: true}) ULSignatures;
  dragged: any;
  arrConfImages: any;

  constructor(private renderer2: Renderer2) {}
  ngOnInit() {
    this.pdfjsLib = window['pdfjs-dist/build/pdf'];
    //this.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.6.347/build/pdf.worker.js';
    this.scale = 1;
    this.numPage = 1;
    this.arrSignatures = new Array();
    if(JSON.parse(localStorage.getItem("listSignatures")) == null){
    this.arrSignatures = [];
    }else{
      this.arrSignatures = JSON.parse(localStorage.getItem("listSignatures"));
      this.signature = this.arrSignatures[0];
    }
    this.arrConfImages = new Array();
  }
  // Funcionalidad Firma
  ngAfterViewInit(){
    this.loadPDF(this.url);
    this.signaturePad = new SignaturePad(this.signaturePadElement.nativeElement);
  }
  ngOnChanges(changes: SimpleChanges){
      if(changes.url != null ){
        this.loadPDF(changes.url.currentValue);
      }

  }
  clearSignature(){
   this.signaturePad.clear();
  }
  saveSignature() {
    if(this.signaturePad.isEmpty()){
     alert('Favor agregar una firma');
    } else {
      let signature =  this.signaturePad.toDataURL();
      this.hideCaptureSignature = true;
      this.clearSignature();
      this.arrSignatures.push(signature);
      if(this.arrSignatures.length == 1){
        this.signature = this.arrSignatures[0];
      }
      //guardar en localstorage
      let strSignature = JSON.stringify(this.arrSignatures);
      localStorage.setItem("listSignatures",strSignature);
    }
  }
  displaySignature() {
    this.hideCaptureSignature = !this.hideCaptureSignature;
  }
  insertSignature() {
    if(this.signature == null){
      return;
    }
    let divPage = this.arrHTML[this.numPage - 1].divCanvasWrapper;
    //let divImg = this.renderer2.createElement("div");
    let img = this.renderer2.createElement("img");
    this.renderer2.setAttribute(img,"src",this.signature);
    this.renderer2.setAttribute(img,"draggable","true");
    this.renderer2.listen(img,"dragstart",(event) => {
      this.start(event);
    });
    this.renderer2.listen(img,"dragend",(event) => {
      this.end(event);
    });
    this.renderer2.listen(img,"touchstart",(event) => {
      this.startTouch(event);
    });
    this.renderer2.listen(img,"touchend",(event) => {
      this.endTouch(event);
    });

    this.renderer2.appendChild(divPage,img);
    this.arrConfImages.push({image: img, page: this.numPage, imageBase64: this.signature});
  }
  openList(){
    if (this.listSignatures.nativeElement.classList.contains('open')) {
      this.renderer2.removeClass(this.listSignatures.nativeElement,'open');
    } else {
      this.renderer2.addClass(this.listSignatures.nativeElement,'open');
    }
  }
  selectSignature(e,i) {
    if (this.ULSignatures.nativeElement.hasChildNodes()) {
      var children = this.ULSignatures.nativeElement.childNodes;
      for (let j = 1; j < children.length; j++) {
        this.renderer2.removeClass(children[j],"select");
      }
    }
    let parentLi = this.renderer2.parentNode(e.target);
    this.renderer2.addClass(parentLi,"select");
    this.signature = this.arrSignatures[i];
  }
  changeColor(r,g,b){
    const color = 'rgb('+r+','+g+','+b+')';
    this.signaturePad.penColor = color;
  }
  //Funcionalidad drag and drop para firma
  start(e) {
    this.dragged = e.target;
    e.dataTransfer.effectAllowed = 'move'; // Define el efecto como mover
    e.dataTransfer.setData("text", e.target.id); // Coje el elemento que se va a mover
    e.dataTransfer.setDragImage(e.target, 0, 0); // Define la imagen que se vera al ser arrastrado el elemento y por donde se coje el elemento que se va a mover (el raton aparece en la esquina sup_izq con 0,0)
    e.target.style.opacity = '0.5'; // Establece la opacidad del elemento que se va arrastrar
  }
  end(e) {
    this.dragged.style.position = "absolute";
    //calcular position
    let top = parseInt(this.dragged.offsetTop);
    let left = parseInt(this.dragged.offsetLeft);
    this.dragged.style.top =  (top + e.offsetY)+"px";
    this.dragged.style.left = (left + e.offsetX)+"px";
    e.target.style.opacity = ''; // Restaura la opacidad del elemento
    e.dataTransfer.clearData("Data");
    this.dragged = null;
  }
  startTouch(e) {
    e.preventDefault();
    this.dragged = e.target;
    //e.dataTransfer.effecAllowed = 'move'; // Define el efecto como mover
    // Define la imagen que se vera al ser arrastrado el elemento y por donde se coje el elemento que se va a mover (el raton aparece en la esquina sup_izq con 0,0)
    e.target.style.opacity = '0.5'; // Establece la opacidad del elemento que se va arrastrar
  }
  endTouch(e) {
    e.preventDefault();
    this.dragged.style.position = "absolute";
    
    //calcular position
    let top =  (e.changedTouches[0].clientY - this.dragged.clientHeight/2)+60;
    let left = (e.changedTouches[0].clientX - this.dragged.clientWidth/2);
    this.dragged.style.top =  top+"px";
    this.dragged.style.left = left+"px";
    this.dragged.style.opacity = '';
    this.dragged = null;
  }
  touchMove(e){
    if( this.dragged == null){
      return true;
    }
    e.preventDefault();
    this.dragged.style.position = "absolute";
    //calcular position
    let top =  (e.changedTouches[0].clientY - this.dragged.clientHeight/2)+60;
    let left = (e.changedTouches[0].clientX - this.dragged.clientWidth/2);
    this.dragged.style.top =  top+"px";
    this.dragged.style.left = left+"px";
    this.dragged.style.opacity = '0.5';
  }
  touchCancel(e){
    this.dragged = null;
  }
  enter(e) {
    e.target.style.border = '1px dotted #555';
  }
  leave(e) {
    e.target.style.border = '';
  }
  over(e) {
    this.dragged.style.position = "absolute";
    //calcular position
    let top = parseInt(this.dragged.offsetTop);
    let left = parseInt(this.dragged.offsetLeft);
    this.dragged.style.top =  (top + e.offsetY)+"px";
    this.dragged.style.left = (left + e.offsetX)+"px";
    return true;
  }
  clonar(e) {
    var elementoArrastrado = this.dragged;
    elementoArrastrado.style.opacity = ''; // Dejamos la opacidad a su estado anterior para copiar el elemento igual que era antes
    var movecarclone = elementoArrastrado.cloneNode(true); // Se clona el elemento
    //movecarclone.id = "ElemClonado" + contador; // Se cambia el id porque tiene que ser unico
    //contador += 1;
     // Se posiciona de forma "normal" (Sino habria que cambiar las coordenadas de la posición)
    var elemClonado = e.target.appendChild(movecarclone); // Se añade el elemento clonado
    e.target.style.border = '';   // Quita el borde del "cuadro clonador"
  }
  drop(e){
    console.log("Drop-->",e);
  }
  //PDF metodos
  loadPDF(urlPDF){
    const pvc = this;
    //borrar elementos de html paginas
    for(let i = 0;i < pvc.arrHTML.length; i++){
      pvc.renderer2.removeChild(pvc.htmlPdfViewer.nativeElement,pvc.arrHTML[i].divPage);
    }
    //reiniciar variables
    pvc.arrHTML = [];
    this.numPage = 1;
    this.arrConfImages = [];

    let loadingTask = pvc.pdfjsLib.getDocument(urlPDF);
    loadingTask.promise.then(
      function(pdf) {
        pvc.pdfDocument = pdf;
        pvc.totalPage = pdf.numPages;
        document.getElementById("numPages").innerText=pdf.numPages;
        for(let numPage = 1;numPage <= pdf.numPages; numPage ++) {
          //Creando contenido html, para las paginas
            let divPage=pvc.renderer2.createElement('div');
            pvc.renderer2.addClass(divPage,'page');
            pvc.renderer2.setAttribute(divPage,'data-page-number',''+numPage);
            pvc.renderer2.setAttribute(divPage,'role','region');
            pvc.renderer2.setAttribute(divPage,'aria-label','Page '+numPage);
            pvc.renderer2.setAttribute(divPage,'data-loaded','false');
            let divCanvasWrapper = pvc.renderer2.createElement('div');
            pvc.renderer2.addClass(divCanvasWrapper,'canvasWrapper');
            let canvas=pvc.renderer2.createElement('canvas');
            pvc.renderer2.appendChild(divPage,divCanvasWrapper);
            pvc.renderer2.appendChild(divCanvasWrapper,canvas);
            pvc.renderer2.appendChild(pvc.htmlPdfViewer.nativeElement,divPage);
            pvc.renderer2.listen(divCanvasWrapper,"drop",(event) => {pvc.drop(event);});
            pvc.renderer2.listen(divCanvasWrapper,"dragenter",(event) => {pvc.enter(event);});
            pvc.renderer2.listen(divCanvasWrapper,"dragover",(event) => {pvc.over(event);});
            pvc.renderer2.listen(divCanvasWrapper,"dragleave",(event) => {pvc.leave(event);});
            pvc.renderer2.listen(divCanvasWrapper,"touchmove",(event) => {pvc.touchMove(event);});
            pvc.renderer2.listen(divCanvasWrapper,"touchcancel",(event) => {pvc.touchCancel(event);});
            pvc.arrHTML.push({divPage: divPage, divCanvasWrapper: divCanvasWrapper, canvas:canvas,dataLoaded: false});

          //load primer página
          pvc.renderPage(pdf,numPage);
          }

      },
      function (reason) {
        console.error(reason);
      }
    );
  }

  //nextPage
  nextPage(){
    if(this.numPage < this.totalPage){
      this.numPage = this.numPage + 1;
      this.viewContainer.nativeElement.scrollTop = this.arrHTML[this.numPage - 1].divPage.offsetTop;
    } else {
      //mostrar mensaje de error
      return;
    }
  }
  previousPage(){
    if(this.numPage > 1){
      this.numPage = this.numPage - 1;
      this.viewContainer.nativeElement.scrollTop = this.arrHTML[this.numPage - 1].divPage.offsetTop;
    } else {
      //mostrar mensaje de error
      return;
    }
  }
  scrolling(e){
    let scrollTop = this.viewContainer.nativeElement.scrollTop
    let distanciaMenor = 999999999;
    for(let div of  e.srcElement.children[0].children){
      let distancia = Math.abs((div.offsetTop - scrollTop));
      if(distanciaMenor > distancia){
        distanciaMenor = distancia;
        this.numPage = parseInt(div.dataset.pageNumber);
      }
    }
  }
  onKeyEnter(event){
    const numInput = parseInt(event.target.value);
    if(numInput > 0 && numInput <= this.totalPage){
      this.numPage = numInput;
      this.arrHTML[this.numPage - 1].divCanvasWrapper.scrollIntoView();
    }else{
      event.target.value = this.numPage;
    }
  }
  //renderer page
  renderPage(pdf, numPage) {
    const pvc = this;
    const i = numPage -1;
    const elementHTML = pvc.arrHTML[i];
    const canvas = elementHTML.canvas;
    const divPage = elementHTML.divPage;
    const divCanvasWrapper = elementHTML.divCanvasWrapper;

    if(!elementHTML.dataLoaded) {
        pdf.getPage(numPage).then(function(page){
            var viewport = page.getViewport({scale: pvc.scale});
            pvc.renderer2.setAttribute(canvas,'height',viewport.height);
            pvc.renderer2.setAttribute(canvas,'width',viewport.width);
            pvc.renderer2.setStyle(divCanvasWrapper,'width',viewport.width+'px');
            pvc.renderer2.setStyle(divCanvasWrapper,'height',viewport.height+'px');
            pvc.renderer2.setStyle(divPage,'width',(viewport.width-1)+'px');
            pvc.renderer2.setStyle(divPage,'height',(viewport.height-1)+'px');
            var context = canvas.getContext("2d");
            // Render PDF page into canvas context
            var renderContext = {
              canvasContext: context,
              viewport: viewport
            };
            var renderTask = page.render(renderContext);

            // Wait for rendering to finish
            renderTask.promise.then(function() {
              pvc.renderer2.setAttribute(divPage,'data-loaded','true')
              pvc.arrHTML[i].dataLoaded = true;
            });
        });
    }
  }
  async savePDF() {
    const existingPdfBytes = await fetch(this.url).then(res => res.arrayBuffer());

    const pdfDocument = await PDFDocument.load(existingPdfBytes);
    for(let objImage of this.arrConfImages){
      let arrayPng = Uint8Array.from(atob(objImage.imageBase64.replace('data:image/png;base64,','')), c => c.charCodeAt(0));
      let pngImage = await pdfDocument.embedPng(arrayPng);
      let pngDims = pngImage.scale(0.5);
      let pages = pdfDocument.getPages();
      pages[(objImage.page - 1)].drawImage(pngImage, {
        x: objImage.image.offsetLeft,
        y: (pages[(objImage.page - 1)].getHeight() - pngDims.height - objImage.image.offsetTop),
        width: pngDims.width,
        height: pngDims.height,
      });
    }

    const pdfBytes  = await pdfDocument.save();
    var base64String =btoa(new Uint8Array(pdfBytes).reduce(function (data, byte) {
        return data + String.fromCharCode(byte);
      }, ''));
      
      this.savePDFEvent.emit(base64String);
  }

}
