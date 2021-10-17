import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    const usersByEmail = await this.usersService.find(email);
    if (usersByEmail.length) {
      throw new BadRequestException('Email already in use');
    }
    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    const saltedPassword = `${hash.toString('hex')}.${salt}`;
    const user = await this.usersService.create(email, saltedPassword);

    return user;
  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const [storedHash, storedSalt] = user.password.split('.');
    const hash = (await scrypt(password, storedSalt, 32)) as Buffer;
    if (!(storedHash === hash.toString('hex'))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
