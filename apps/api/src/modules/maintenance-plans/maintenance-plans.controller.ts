import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { CreateMaintenancePlanDto } from "./dto/create-maintenance-plan.dto";
import { GenerateMaintenanceOrdersDto } from "./dto/generate-maintenance-orders.dto";
import { SetMaintenancePlanAssetsDto } from "./dto/set-maintenance-plan-assets.dto";
import { SetMaintenancePlanTasksDto } from "./dto/set-maintenance-plan-tasks.dto";
import { UpdateMaintenancePlanDto } from "./dto/update-maintenance-plan.dto";
import { UpdateMaintenancePlanTaskDto } from "./dto/update-maintenance-plan-task.dto";
import { MaintenancePlanTaskDto } from "./dto/maintenance-plan-task.dto";
import { MaintenancePlansService } from "./maintenance-plans.service";

@ApiTags("maintenance-plans")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("maintenance-plans")
export class MaintenancePlansController {
  constructor(private readonly maintenancePlans: MaintenancePlansService) {}

  @Permissions("maintenance-plans:write")
  @Post()
  create(@Body() dto: CreateMaintenancePlanDto) {
    return this.maintenancePlans.create(dto);
  }

  @Permissions("maintenance-plans:read")
  @Get()
  findAll() {
    return this.maintenancePlans.findAll();
  }

  @Permissions("maintenance-plans:read")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.maintenancePlans.findOne(id);
  }

  @Permissions("maintenance-plans:write")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateMaintenancePlanDto) {
    return this.maintenancePlans.update(id, dto);
  }

  @Permissions("maintenance-plans:write")
  @Patch(":id/activate")
  activate(@Param("id") id: string) {
    return this.maintenancePlans.activate(id);
  }

  @Permissions("maintenance-plans:write")
  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.maintenancePlans.deactivate(id);
  }

  @Permissions("maintenance-plans:write")
  @Post(":id/assets/:assetId")
  addAsset(@Param("id") id: string, @Param("assetId") assetId: string) {
    return this.maintenancePlans.addAsset(id, assetId);
  }

  @Permissions("maintenance-plans:write")
  @Put(":id/assets")
  setAssets(@Param("id") id: string, @Body() dto: SetMaintenancePlanAssetsDto) {
    return this.maintenancePlans.setAssets(id, dto);
  }

  @Permissions("maintenance-plans:write")
  @Delete(":id/assets/:assetId")
  removeAsset(@Param("id") id: string, @Param("assetId") assetId: string) {
    return this.maintenancePlans.removeAsset(id, assetId);
  }

  @Permissions("maintenance-plans:write")
  @Post(":id/tasks")
  addTask(@Param("id") id: string, @Body() dto: MaintenancePlanTaskDto) {
    return this.maintenancePlans.addTask(id, dto);
  }

  @Permissions("maintenance-plans:write")
  @Put(":id/tasks")
  setTasks(@Param("id") id: string, @Body() dto: SetMaintenancePlanTasksDto) {
    return this.maintenancePlans.setTasks(id, dto);
  }

  @Permissions("maintenance-plans:write")
  @Patch(":id/tasks/:taskId")
  updateTask(
    @Param("id") id: string,
    @Param("taskId") taskId: string,
    @Body() dto: UpdateMaintenancePlanTaskDto,
  ) {
    return this.maintenancePlans.updateTask(id, taskId, dto);
  }

  @Permissions("maintenance-plans:write")
  @Delete(":id/tasks/:taskId")
  removeTask(@Param("id") id: string, @Param("taskId") taskId: string) {
    return this.maintenancePlans.removeTask(id, taskId);
  }

  @Permissions("maintenance-plans:write", "work-orders:write")
  @Post(":id/generate-work-orders")
  generateWorkOrders(
    @Param("id") id: string,
    @Body() dto: GenerateMaintenanceOrdersDto,
  ) {
    return this.maintenancePlans.generateWorkOrders(id, dto);
  }

  @Permissions("maintenance-plans:write")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.maintenancePlans.remove(id);
  }
}
