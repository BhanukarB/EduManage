import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginWithPasswordDto {
  @ApiProperty({ description: "User email", example: "john.doe@example.com" })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: "User password", example: "Password@123" })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: "Refresh token", example: "refresh_token" })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}


