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
import { AssignUserRolesDto } from "./dto/assign-user-roles.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Permissions("users:write")
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Permissions("roles:read")
  @Get("roles")
  findRoles() {
    return this.users.findRoles();
  }

  @Permissions("users:read")
  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Permissions("users:read")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.users.findOne(id);
  }

  @Permissions("users:write")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.users.update(id, dto, user);
  }

  @Permissions("users:write")
  @Patch(":id/activate")
  activate(@Param("id") id: string) {
    return this.users.activate(id);
  }

  @Permissions("users:write")
  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.users.deactivate(id, user);
  }

  @Permissions("users:write")
  @Put(":id/roles")
  assignRoles(
    @Param("id") id: string,
    @Body() dto: AssignUserRolesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.users.assignRoles(id, dto, user);
  }
}
