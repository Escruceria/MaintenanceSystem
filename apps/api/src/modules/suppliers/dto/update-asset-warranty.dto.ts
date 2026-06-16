import { PartialType } from "@nestjs/swagger";
import { CreateAssetWarrantyDto } from "./create-asset-warranty.dto";

export class UpdateAssetWarrantyDto extends PartialType(
  CreateAssetWarrantyDto,
) {}
