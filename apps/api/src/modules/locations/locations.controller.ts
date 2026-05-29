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
import { CreateLocationDto } from "./dto/create-location.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { LocationsService } from "./locations.service";

@ApiTags("locations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("locations")
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Permissions("locations:write")
  @Post()
  create(@Body() dto: CreateLocationDto) {
    return this.locations.create(dto);
  }

  @Permissions("locations:read")
  @Get()
  findAll() {
    return this.locations.findAll();
  }

  @Permissions("locations:read")
  @Get("tree")
  findTree() {
    return this.locations.findTree();
  }

  @Permissions("locations:read")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.locations.findOne(id);
  }

  @Permissions("locations:write")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateLocationDto) {
    return this.locations.update(id, dto);
  }

  @Permissions("locations:write")
  @Patch(":id/activate")
  activate(@Param("id") id: string) {
    return this.locations.activate(id);
  }

  @Permissions("locations:write")
  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.locations.deactivate(id);
  }

  @Permissions("locations:write")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.locations.remove(id);
  }
}
