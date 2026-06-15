import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { WorkOrderEvidenceType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, join } from "node:path";
import { diskStorage } from "multer";
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
import { UploadWorkOrderEvidenceDto } from "./dto/upload-work-order-evidence.dto";
import { WorkOrdersService } from "./work-orders.service";

const allowedEvidenceMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const evidenceFileInterceptor = FileInterceptor("file", {
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedEvidenceMimeTypes.has(file.mimetype)) {
      callback(
        new BadRequestException(
          "Tipo de archivo no permitido para evidencias",
        ),
        false,
      );
      return;
    }

    callback(null, true);
  },
  storage: diskStorage({
    destination: (request, _file, callback) => {
      const uploadRoot =
        process.env.UPLOAD_ROOT ?? join(process.cwd(), "storage");
      const workOrderId = String(request.params.id);
      const destination = join(
        uploadRoot,
        "evidences",
        "work-orders",
        workOrderId,
      );

      mkdirSync(destination, { recursive: true });
      callback(null, destination);
    },
    filename: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
});

@ApiTags("work-orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("work-orders")
export class WorkOrdersController {
  constructor(
    private readonly workOrders: WorkOrdersService,
    private readonly config: ConfigService,
  ) {}

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

  @Permissions("work-orders:write")
  @Post(":id/evidences/upload")
  @UseInterceptors(evidenceFileInterceptor)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        type: {
          enum: [WorkOrderEvidenceType.PHOTO, WorkOrderEvidenceType.DOCUMENT],
        },
        title: {
          type: "string",
        },
        description: {
          type: "string",
        },
      },
      required: ["file"],
    },
  })
  uploadEvidence(
    @Param("id") id: string,
    @Body() dto: UploadWorkOrderEvidenceDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrders.uploadEvidence(id, dto, file, user, {
      publicBaseUrl: this.config.get<string>("UPLOAD_PUBLIC_BASE_URL"),
    });
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
