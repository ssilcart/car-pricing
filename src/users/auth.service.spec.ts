import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    fakeUsersService = {
      find: () => Promise.resolve([]),
      create: (email: string, password: string) =>
        Promise.resolve({
          id: 1,
          email,
          password,
        } as User),
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
      fakeUsersService.find = () => Promise.resolve([signUpUser as User]);
      await expect(
        service.signup(signUpUser.email, signUpUser.password),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('signin', () => {
    it('should fail if not registered Email', async () => {
      const signUpUser = {
        email: 'foo@bar.com',
        password: 'abc123',
      };
      await expect(
        service.signin(signUpUser.email, signUpUser.password),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
