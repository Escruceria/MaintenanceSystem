import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AssetsService } from "./assets.service";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { UpdateAssetDto } from "./dto/update-asset.dto";

@ApiTags("assets")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("assets")
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Permissions("assets:write")
  @Post()
  create(@Body() dto: CreateAssetDto) {
    return this.assets.create(dto);
  }

  @Permissions("assets:read")
  @Get()
  findAll() {
    return this.assets.findAll();
  }

  @Permissions("assets:read")
  @Get(":id/history")
  getHistory(@Param("id") id: string) {
    return this.assets.getHistory(id);
  }

  @Permissions("assets:read")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.assets.findOne(id);
  }

  @Permissions("assets:write")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateAssetDto) {
    return this.assets.update(id, dto);
  }

  @Permissions("assets:write")
  @Patch(":id/activate")
  activate(@Param("id") id: string) {
    return this.assets.activate(id);
  }

  @Permissions("assets:write")
  @Patch(":id/retire")
  retire(@Param("id") id: string) {
    return this.assets.retire(id);
  }

  @Permissions("assets:write")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.assets.remove(id);
  }
}
