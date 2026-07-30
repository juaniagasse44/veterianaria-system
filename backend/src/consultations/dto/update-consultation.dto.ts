import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateConsultationDto } from './create-consultation.dto';

/**
 * Edición acotada (D4): no permite cambiar pet/appointment/veterinarian, solo
 * los campos clínicos del registro ya creado.
 */
export class UpdateConsultationDto extends PartialType(
  OmitType(CreateConsultationDto, [
    'petId',
    'appointmentId',
    'veterinarianId',
  ] as const),
) {}
