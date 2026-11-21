import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginWithPasswordDto, RefreshTokenDto } from "./dto/login.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Service } from "src/utils/constants/service";
import { LoginWithEmailPasswordAPI, RefreshTokenAPI } from "src/utils/routes/auth.routes";


@ApiTags("auth")
@Controller(Service.AUTH_API_PREFIX)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post(LoginWithEmailPasswordAPI.path)
  @ApiOperation({ summary: "User login" })
  @ApiResponse({
    status: 200,
    description: "Successful login",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async loginWithPassword(@Body() LoginWithPasswordDto: LoginWithPasswordDto): Promise<any> {
    return this.authService.loginWithPassword(LoginWithPasswordDto);
  }

  @Post(RefreshTokenAPI.path)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({
    status: 200,
    description: "Successful token refresh",
  })
  async refresh(@Body() body: RefreshTokenDto): Promise<any> {
    return this.authService.refreshToken(body.refreshToken);
  }

}
