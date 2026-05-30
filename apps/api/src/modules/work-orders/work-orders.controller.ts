import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AuthenticatedUser } from "../auth/types/authenticated-user";
import { AssignWorkOrderDto } from "./dto/assign-work-order.dto";
import { ChangeWorkOrderStatusDto } from "./dto/change-work-order-status.dto";
import { CloseWorkOrderDto } from "./dto/close-work-order.dto";
import { CreateWorkOrderDto } from "./dto/create-work-order.dto";
import { SetWorkOrderPartsDto } from "./dto/set-work-order-parts.dto";
import { UpdateWorkOrderChecklistItemDto } from "./dto/update-work-order-checklist-item.dto";
import { UpdateWorkOrderDto } from "./dto/update-work-order.dto";
import { WorkOrdersService } from "./work-orders.service";

@ApiTags("work-orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("work-orders")
export class WorkOrdersController {
  constructor(private readonly workOrders: WorkOrdersService) {}

  @Permissions("work-orders:write")
  @Post()
  create(@Body() dto: CreateWorkOrderDto) {
    return this.workOrders.create(dto);
  }

  @Permissions("work-orders:read")
  @Get()
  findAll() {
    return this.workOrders.findAll();
  }

  @Permissions("work-orders:read")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.workOrders.findOne(id);
  }

  @Permissions("work-orders:write")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.workOrders.update(id, dto);
  }

  @Permissions("work-orders:assign")
  @Patch(":id/assign")
  assign(@Param("id") id: string, @Body() dto: AssignWorkOrderDto) {
    return this.workOrders.assign(id, dto);
  }

  @Permissions("work-orders:write")
  @Patch(":id/status")
  changeStatus(@Param("id") id: string, @Body() dto: ChangeWorkOrderStatusDto) {
    return this.workOrders.changeStatus(id, dto);
  }

  @Permissions("work-orders:write")
  @Put(":id/spare-parts")
  setSpareParts(@Param("id") id: string, @Body() dto: SetWorkOrderPartsDto) {
    return this.workOrders.setSpareParts(id, dto);
  }

  @Permissions("work-orders:read")
  @Get(":id/checklist")
  getChecklist(@Param("id") id: string) {
    return this.workOrders.getChecklist(id);
  }

  @Permissions("work-orders:write")
  @Patch(":id/checklist/:itemId")
  updateChecklistItem(
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateWorkOrderChecklistItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrders.updateChecklistItem(id, itemId, dto, user);
  }

  @Permissions("work-orders:close")
  @Patch(":id/close")
  close(@Param("id") id: string, @Body() dto: CloseWorkOrderDto) {
    return this.workOrders.close(id, dto);
  }

  @Permissions("work-orders:write")
  @Patch(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.workOrders.cancel(id);
  }
}
