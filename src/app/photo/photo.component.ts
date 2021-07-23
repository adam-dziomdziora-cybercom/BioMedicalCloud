import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import FileSaver from 'file-saver';

interface ISasReponse {
  sasToken: string;
  responseMessage: string;
}

@Component({
  selector: 'app-photo',
  templateUrl: './photo.component.html',
  styleUrls: ['./photo.component.scss'],
})
export class PhotoComponent implements AfterViewInit {
  @ViewChild('video')
  public video!: ElementRef;

  @ViewChild('canvas')
  public canvas!: ElementRef;

  width = 640;
  height = 480;
  sasToken = '';
  isCaptured = false;
  error = '';
  latestUploadedUrl = '';

  private captures: string[] = [];
  private containerName = 'images';
  private url = 'https://mysuperblob.blob.core.windows.net/';
  private blobServiceClient = new BlobServiceClient(this.url);
  private containerClient!: ContainerClient;
  private sasUrl =
    'https://biomedicalappsastoken.azurewebsites.net/api/HttpTriggerGetSasToken';
  /**
   *
   */

  constructor(private httpClient: HttpClient) {}
  public async getSasToken() {
    const response = await this.httpClient
      .get<ISasReponse>(this.sasUrl)
      .toPromise();
    this.sasToken = response.sasToken;
    this.blobServiceClient = new BlobServiceClient(this.url + this.sasToken);
  }

  async ngAfterViewInit() {
    await this.getSasToken();
    await this.setupDevices();
    this.containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
  }

  goToLink() {
    window.open(this.latestUploadedUrl);
  }

  async setupDevices() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (stream) {
          this.video.nativeElement.srcObject = stream;
          this.video.nativeElement.play();
          this.error = '';
        } else {
          this.error = 'You have no output video device';
        }
      } catch (e) {
        this.error = e;
      }
    }
  }

  capture() {
    this.drawImageToCanvas(this.video.nativeElement);
    this.captures.push(this.canvas.nativeElement.toDataURL('image/png'));
    this.isCaptured = true;
  }

  async drawImageToCanvas(image: any) {
    this.canvas.nativeElement
      .getContext('2d')
      .drawImage(image, 0, 0, this.width, this.height);
    const canvasHtml: HTMLCanvasElement = this.canvas.nativeElement;
    canvasHtml.toBlob(async (blob) => {
      if (blob) {
        const blobName = 'photo' + new Date().getTime();
        const blockBlobClient =
          this.containerClient.getBlockBlobClient(blobName);
        const uploadBlobResponse = await blockBlobClient.upload(
          blob,
          blob.size
        );
        console.log(
          `Uploaded block blob ${blobName} successfully`,
          uploadBlobResponse.requestId
        );

        await this.downloadUploadedFromAzure();
      }
    });
  }

  public get isMobile(): boolean {
    const toMatch = [
      /Android/i,
      /webOS/i,
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /BlackBerry/i,
      /Windows Phone/i,
    ];

    return toMatch.some((toMatchItem) =>
      navigator.userAgent.match(toMatchItem)
    );
  }

  async previewImage(event: any) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      console.log('csv content', e.target.result);
    };
    reader.readAsDataURL(event.target.files[0]);
    const heheblob: Blob = event.target.files[0];
    const blobName = 'photo' + new Date().getTime();
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const uploadBlobResponse = await blockBlobClient.upload(
      heheblob,
      heheblob.size
    );
    console.log(
      `Uploaded block blob ${blobName} successfully`,
      uploadBlobResponse.requestId
    );
    this.latestUploadedUrl = blockBlobClient.url;
    if (!this.isMobile) {
      await this.downloadUploadedFromAzure();
    }
  }

  private async downloadUploadedFromAzure() {
    const blobs = this.containerClient.listBlobsFlat();
    const names: string[] = [];
    for await (const blob of blobs) {
      names.push(blob.name);
      console.log(`Blob: ${blob.name}`);
    }
    const lastUploadedName = names[names.length - 1];
    const blobClient = this.containerClient.getBlobClient(lastUploadedName);

    const downloadBlockBlobResponse = await blobClient.download();
    const downloadedBlob = await downloadBlockBlobResponse.blobBody;
    if (downloadedBlob) {
      FileSaver.saveAs(downloadedBlob, `downloaded${lastUploadedName}`);
      console.log(
        `Downloaded blob downloaded${lastUploadedName} with size: ${downloadedBlob?.size}`
      );
    }
  }
}
