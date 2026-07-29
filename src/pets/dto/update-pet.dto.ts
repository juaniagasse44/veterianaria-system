import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePetDto } from './create-pet.dto';

export class UpdatePetDto extends PartialType(
  OmitType(CreatePetDto, ['ownerId'] as const),
) {}
