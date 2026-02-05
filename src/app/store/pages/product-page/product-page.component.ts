import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { ProductsService } from '@products/services/products.service';
import { ProductCarouselComponent } from '@products/components/product-carousel/product-carousel.component';

@Component({
  selector: 'app-product-page',
  imports: [ProductCarouselComponent],
  templateUrl: './product-page.component.html',
})
export class ProductPageComponent {
  productsService = inject(ProductsService);
  private route = inject(ActivatedRoute);

  productidSlug = this.route.snapshot.paramMap.get('idSlug')!;

  productIdSlugResource = rxResource({
    params: () => ({ idSlug: this.productidSlug }),
    stream: ({ params }) => {
      return this.productsService.getProductByIdSlug(params.idSlug);
    },
  });
}
