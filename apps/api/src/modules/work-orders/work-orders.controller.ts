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
import { CreateWorkOrderEvidenceDto } from "./dto/create-work-order-evidence.dto";
import { CreateWorkOrderDto } from "./dto/create-work-order.dto";
import { SetWorkOrderPartsDto } from "./dto/set-work-order-parts.dto";
import { UpdateWorkOrderChecklistItemDto } from "./dto/update-work-order-checklist-item.dto";
import { UpdateWorkOrderExecutionNotesDto } from "./dto/update-work-order-execution-notes.dto";
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
  create(
    @Body() dto: CreateWorkOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrders.create(dto, user);
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
  update(
    @Param("id") id: string,
    @Body() dto: UpdateWorkOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrders.update(id, dto, user);
  }

  @Permissions("work-orders:assign")
  @Patch(":id/assign")
  assign(
    @Param("id") id: string,
    @Body() dto: AssignWorkOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrders.assign(id, dto, user);
  }

  @Permissions("work-orders:write")
  @Patch(":id/status")
  changeStatus(
    @Param("id") id: string,
    @Body() dto: ChangeWorkOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrders.changeStatus(id, dto, user);
  }

  @Permissions("work-orders:write")
  @Put(":id/spare-parts")
  setSpareParts(
    @Param("id") id: string,
    @Body() dto: SetWorkOrderPartsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrders.setSpareParts(id, dto, user);
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

  @Permissions("work-orders:write")
  @Patch(":id/execution-notes")
  updateExecutionNotes(
    @Param("id") id: string,
    @Body() dto: UpdateWorkOrderExecutionNotesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrders.updateExecutionNotes(id, dto, user);
  }

  @Permissions("work-orders:read")
  @Get(":id/evidences")
  getEvidences(@Param("id") id: string) {
    return this.workOrders.getEvidences(id);
  }

  @Permissions("work-orders:write")
  @Post(":id/evidences")
  addEvidence(
    @Param("id") id: string,
    @Body() dto: CreateWorkOrderEvidenceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrders.addEvidence(id, dto, user);
  }

  @Permissions("work-orders:close")
  @Patch(":id/close")
  close(
    @Param("id") id: string,
    @Body() dto: CloseWorkOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrders.close(id, dto, user);
  }

  @Permissions("work-orders:write")
  @Patch(":id/cancel")
  cancel(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.workOrders.cancel(id, user);
  }
}
