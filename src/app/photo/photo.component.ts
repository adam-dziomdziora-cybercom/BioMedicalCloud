import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import {
  BlobHTTPHeaders,
  BlobServiceClient,
  BlockBlobClient,
  BlockBlobUploadOptions,
  ContainerClient,
} from '@azure/storage-blob';
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

  public width = 640;
  public height = 480;
  public sasToken = '';
  public isCaptured = false;
  public error = '';
  public latestUploadedUrl = '';

  private mediaStream: MediaStream | undefined;
  private peerIdentity: string | undefined;
  private captures: string[] = [];
  private functionId = 'sastokenfunction2137';
  private functionName = 'SasTokenFunction';
  private accountName = 'mlstorageaccount2137';
  private containerName = 'mlblobcontainer2137';
  private url = `https://${this.accountName}.blob.core.windows.net/`;
  private blobServiceClient = new BlobServiceClient(this.url);
  private containerClient!: ContainerClient;
  private sasUrl =
    `https://${this.functionId}.azurewebsites.net/api/${this.functionName}`;

  constructor(private httpClient: HttpClient) {}

  async ngAfterViewInit() {
    await this.getSasToken();
    await this.setupDevices();
    this.containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
  }

  public goToLink() {
    window.open(this.latestUploadedUrl);
  }

  public capture() {
    this.drawImageToCanvas(this.video.nativeElement);
    this.captures.push(this.canvas.nativeElement.toDataURL('image/png'));
    this.isCaptured = true;
  }

  public async previewImage(event: any) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      console.log('csv content', e.target.result);
    };
    reader.readAsDataURL(event.target.files[0]);
    const blobToBeUploaded: Blob = event.target.files[0];
    const blockBlobClient = await this.uploadBlob(blobToBeUploaded);
    await this.downloadIfNotMobile(blockBlobClient);
  }

  public async swithcCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const devicesIds: string[] = [];
        devices.forEach((device) => {
          console.log(
            device.kind + ': ' + device.label + ' id = ' + device.deviceId
          );
          devicesIds.push(device.deviceId);
        });

        if (this.peerIdentity && devicesIds.length > 1) {
          this.peerIdentity = devicesIds[1];
        } else {
          this.peerIdentity = devicesIds[0];
        }

        if (this.mediaStream) {
          const tracks = this.mediaStream.getTracks();
          tracks.forEach((track) => track.stop());

          // Provide new options
          this.mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            peerIdentity: this.peerIdentity,
          });
          if (this.mediaStream) {
            this.mediaStream = this.mediaStream;
            this.video.nativeElement.srcObject = null;
            this.video.nativeElement.srcObject = this.mediaStream;
            this.video.nativeElement.play();
            this.error = '';
          } else {
            this.error = 'You have no output video device';
          }
        }
      } catch (e) {
        this.error = e;
      }
    }
  }
  private async setupDevices() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (stream) {
          this.mediaStream = this.mediaStream;
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

  private async getSasToken() {
    const response = await this.httpClient
      .get<ISasReponse>(this.sasUrl)
      .toPromise();
    this.sasToken = response.sasToken;
    this.blobServiceClient = new BlobServiceClient(this.url + this.sasToken);
  }

  private async drawImageToCanvas(image: any) {
    this.canvas.nativeElement
      .getContext('2d')
      .drawImage(image, 0, 0, this.width, this.height);
    const canvasHtml: HTMLCanvasElement = this.canvas.nativeElement;
    canvasHtml.toBlob(async (blobToBeUploaded) => {
      if (blobToBeUploaded) {
        const blockBlobClient = await this.uploadBlob(blobToBeUploaded);

        await this.downloadIfNotMobile(blockBlobClient);
      }
    });
  }

  private async uploadBlob(blobToBeUploaded: Blob) {
    const blobName = 'photo' + new Date().getTime();
    const blobHTTPHeaders: BlobHTTPHeaders = { blobContentType: 'image/jpeg' };
    const blockBlobUploadOptions: BlockBlobUploadOptions = { blobHTTPHeaders };
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const uploadBlobResponse = await blockBlobClient.upload(
      blobToBeUploaded,
      blobToBeUploaded.size,
      blockBlobUploadOptions
    );
    console.log(
      `Uploaded block blob ${blobName} successfully`,
      uploadBlobResponse.requestId
    );
    return blockBlobClient;
  }

  private async downloadIfNotMobile(blockBlobClient: BlockBlobClient) {
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
