import { PartialType } from '@nestjs/swagger';
import { CreateProductVersionDto } from './create-product-version.dto';

export class UpdateProductVersionDto extends PartialType(CreateProductVersionDto) {}
