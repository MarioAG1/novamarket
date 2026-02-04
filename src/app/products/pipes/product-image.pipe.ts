import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';

const baseUrl = environment.baseUrl;

@Pipe({
  name: 'productImage',
})
export class ProductImagePipe implements PipeTransform {
  transform(value: string | string[]): string {
    if (!value) {
      return './assets/images/no-image.jpg';
    }

    if (typeof value === 'string') {
      return `${baseUrl}/files/product/${value}`;
    }

    return `${baseUrl}/files/product/${value[0]}`;
  }
}
