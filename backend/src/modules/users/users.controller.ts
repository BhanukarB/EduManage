import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CreateUserDto, UpdateUserDto, UserDto } from './dtos/user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ApiOperation({ summary: 'Create a user in the current organisation' })
  @ApiResponse({ status: 201, type: UserDto })
  create(@Req() req: any, @Body() userData: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(userData, req.user.uid, req.user.orgId);
  }

  @Get()
  @ApiOperation({ summary: 'List users in the current organisation' })
  @ApiResponse({ status: 200, type: [UserDto] })
  findAll(@Req() req: any): Promise<UserDto[]> {
    return this.usersService.findAll(req.user.uid, req.user.orgId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the logged-in user profile' })
  @ApiResponse({ status: 200, type: UserDto })
  findCurrentUser(@Req() req: any): Promise<UserDto> {
    return this.usersService.findCurrentUser(req.user.uid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by UUID' })
  @ApiResponse({ status: 200, type: UserDto })
  findById(@Req() req: any, @Param('id', ParseUUIDPipe) id: string): Promise<UserDto> {
    return this.usersService.findById(id, req.user.uid, req.user.orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user profile' })
  @ApiResponse({ status: 200, type: UserDto })
  update(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() userData: UpdateUserDto,
  ): Promise<UserDto> {
    return this.usersService.update(id, userData, req.user.uid, req.user.orgId);
  }
}
