import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import * as FileSaver from 'file-saver';

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

  captures: string[] = [];
  error: any;
  isCaptured = false;
  myBlob!: Blob;
  account = 'mysuperblob';
  containerName = 'images';
  url =
    // eslint-disable-next-line max-len
    'https://mysuperblob.blob.core.windows.net/?sv=2020-08-04&ss=bfqt&srt=sco&sp=rwdlacuptfx&se=2021-07-10T20:34:42Z&st=2021-07-09T12:34:42Z&spr=https,http&sig=zZ5N3bGTugjaVOPvmCQpi1PMBsvnUu7z86HA%2FWtnDi4%3D';
  blobServiceClient = new BlobServiceClient(this.url);
  containerClient!: ContainerClient;

  async ngAfterViewInit() {
    await this.setupDevices();
    this.containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
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
          this.error = null;
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
        this.myBlob = blob;
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
    await this.downloadUploadedFromAzure();
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
