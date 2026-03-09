import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductCarouselComponent } from '@products/components/product-carousel/product-carousel.component';
import { Product } from '@products/interfaces/product.interface';
import { FormUtils } from '@utils/form-utils';
import { FormErrorLabelComponent } from '@shared/components/form-error-label/form-error-label.component';
import { ProductsService } from '@products/services/products.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'product-details',
  imports: [ProductCarouselComponent, ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './product-details.component.html',
})
export class ProductDetailsComponent implements OnInit {
  product = input.required<Product>();
  productService = inject(ProductsService);
  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  router = inject(Router);
  wasSaved = signal(false);
  wasCreated = signal(false);
  tempImages = signal<string[]>([]);
  imagesFileList = signal<FileList | undefined>(undefined);
  imagesToCarrousel = computed(() => {
    const currentProductImages = [...this.product().images, ...this.tempImages()];
    return currentProductImages;
  });

  fb = inject(FormBuilder);
  productForm = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(FormUtils.slugPattern)]],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    sizes: [['']],
    images: [[]],
    tags: [''],
    gender: ['men', [Validators.required, Validators.pattern(/men|women|kid|unisex/)]],
  });

  ngOnInit(): void {
    this.setFormValue(this.product());
  }

  setFormValue(formLike: Partial<Product>) {
    this.productForm.reset(this.product() as any);
    this.productForm.patchValue({ tags: formLike.tags?.join(',') });
  }

  onSizeClick(size: string) {
    const currentsizes = this.productForm.value.sizes ?? [];
    if (currentsizes.includes(size)) {
      currentsizes.splice(currentsizes.indexOf(size), 1);
    } else {
      currentsizes.push(size);
    }
    this.productForm.patchValue({ sizes: currentsizes });
  }

  async wasCreatedCheck(productLike: Partial<Product>) {
    //Crear producto
    await firstValueFrom(this.productService.createProduct(productLike));

    // Navegas hasta la ruta del nuevo producto
    // this.router.navigate(['/admin/products', product.id]);

    this.wasCreatedToggle();
  }

  async wasSavedCheck(productLike: Partial<Product>) {
    //Actualizar producto
    await firstValueFrom(this.productService.updateProduct(this.product().id, productLike));

    this.wasSavedToggle();
  }

  wasCreatedToggle() {
    this.wasCreated.set(true);
    setTimeout(() => {
      this.wasCreated.set(false);
      this.router.navigate(['/admin/products']);
    }, 3000);
  }

  wasSavedToggle() {
    this.wasSaved.set(true);
    setTimeout(() => {
      this.wasSaved.set(false);
    }, 3000);
  }

  onSubmit() {
    const isValid = this.productForm.valid;
    this.productForm.markAllAsTouched();
    if (!isValid) {
      return;
    }
    const formValue = this.productForm.value;

    const productLike: Partial<Product> = {
      ...(formValue as any),
      tags:
        formValue.tags
          ?.toLowerCase()
          .split(',')
          .map((tag) => tag.trim()) ?? [],
    };

    if (this.product().id === 'new') {
      this.wasCreatedCheck(productLike);
    } else {
      this.wasSavedCheck(productLike);
    }
  }

  //Imágenes
  onFilesChanged(event: Event) {
    const fileList = (event.target as HTMLInputElement).files;

    // Esto sirve si luego quieres subir los archivos reales al servidor.
    this.imagesFileList.set(fileList ?? undefined);

    const imageUrls = Array.from(fileList ?? []).map((file) => {
      return URL.createObjectURL(file);
    });

    this.tempImages.set(imageUrls);
  }
}
