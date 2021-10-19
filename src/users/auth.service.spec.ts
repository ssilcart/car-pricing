import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);

        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: users.length,
          email,
          password,
        } as User;
        users.push(user);

        return Promise.resolve(user);
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return a hased password', async () => {
      const signUpUser = {
        email: 'foo@bar.com',
        password: 'abc123',
      };
      const user = await service.signup(signUpUser.email, signUpUser.password);
      expect(user.password).not.toEqual(signUpUser.password);
      const [password, hash] = user.password.split('.');
      expect(password).toBeDefined();
      expect(hash).toBeDefined();
    });

    it('should fail if email already in use', async () => {
      const signUpUser = {
        email: 'foo@bar.com',
        password: 'abc123',
      };
      await service.signup(signUpUser.email, signUpUser.password);
      await expect(
        service.signup(signUpUser.email, signUpUser.password),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('signin', () => {
    it('should fail if invalid password is provided', async () => {
      const signUpUser = {
        email: 'foo@bar.com',
        password: 'abc.123',
      };
      const randomPassword = 'Abc.1234';
      await service.signup(signUpUser.email, signUpUser.password);
      await expect(
        service.signin(signUpUser.email, randomPassword),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should fail if not registered Email', async () => {
      const signUpUser = {
        email: 'foo@bar.com',
        password: 'abc.123',
      };
      await expect(
        service.signin(signUpUser.email, signUpUser.password),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return user if email and password are correct', async () => {
      const signUpUser = {
        email: 'foo@bar.com',
        password: 'abc.123',
      };
      await service.signup(signUpUser.email, signUpUser.password);
      const user = service.signin(signUpUser.email, signUpUser.password);
      await expect(user).toBeDefined();
    });
  });
});
