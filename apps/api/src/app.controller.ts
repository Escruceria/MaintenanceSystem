import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      service: "MaintenanceSystem API",
      status: "ok",
      message: "API operativa. Usa /api/health para healthcheck y /docs para Swagger.",
      links: {
        health: "/api/health",
        swagger: "/docs",
      },
      timestamp: new Date().toISOString(),
    };
  }
}
